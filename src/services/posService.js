// ==============================================================================
// KARACHI EXPRESS POS — LOCAL & SUPABASE HYBRID SERVICE
// Handles Load-Shedding Offline Storage, Sync, Token Sequence, & Automations
// ==============================================================================

import { supabase, voidOrderWithManagerPin, blindCloseShift } from '../lib/supabase';
import { DEMO_MANAGERS, INITIAL_MENU_ITEMS } from '../data/mockData';

const STORAGE_KEYS = {
  TOKEN_DATE: 'karachi_pos_token_date',
  LAST_TOKEN: 'karachi_pos_last_token',
  OFFLINE_QUEUE: 'karachi_pos_offline_orders_queue',
  ACTIVE_ORDERS: 'karachi_pos_active_orders',
  INVENTORY_STATE: 'karachi_pos_inventory_state',
  SHIFT_SESSION: 'karachi_pos_shift_session'
};

// 1. Daily Token Generator: Starts from 1 every single calendar day
export function getNextDailyTokenNumber() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem(STORAGE_KEYS.TOKEN_DATE);
  let currentToken = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_TOKEN) || '0', 10);

  if (savedDate !== todayStr) {
    // New Day! Reset token to 1
    currentToken = 1;
    localStorage.setItem(STORAGE_KEYS.TOKEN_DATE, todayStr);
  } else {
    currentToken += 1;
  }

  localStorage.setItem(STORAGE_KEYS.LAST_TOKEN, currentToken.toString());
  return currentToken;
}

export function getCurrentTokenNumber() {
  const token = localStorage.getItem(STORAGE_KEYS.LAST_TOKEN) || '0';
  return parseInt(token, 10);
}

// 2. Offline Queue Management
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOrderToOfflineQueue(order) {
  const queue = getOfflineQueue();
  const queuedOrder = {
    ...order,
    queuedAt: new Date().toISOString(),
    syncStatus: 'pending'
  };
  queue.push(queuedOrder);
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  return queue.length;
}

export function clearOfflineQueue() {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
}

// 3. Supabase Background Synchronization
export async function syncOfflineQueueToSupabase(onProgress) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  let synced = 0;
  let failed = 0;
  const remaining = [];

  for (let i = 0; i < queue.length; i++) {
    const order = queue[i];
    try {
      const isRemoteActive = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('demo');
      if (isRemoteActive) {
        const { error } = await supabase.from('orders').insert({
          id: order.id,
          order_token: order.token,
          order_type: order.mode,
          table_number: order.tableNo || null,
          subtotal: order.subtotal,
          tax_srb: order.tax,
          total_amount: order.total,
          payment_method: order.paymentMethod,
          status: 'completed'
        });
        if (error) throw error;
      }
      synced++;
      if (onProgress) onProgress(synced, queue.length);
    } catch (err) {
      console.warn('Sync failed for order:', order.token, err);
      remaining.push(order);
      failed++;
    }
  }

  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
  return { syncedCount: synced, failedCount: failed };
}

// 4. Shift Session Storage
export function getActiveShiftSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.SHIFT_SESSION);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  const defaultSession = {
    id: '77777777-7777-7777-7777-777777777001',
    sessionNumber: 104,
    cashierName: 'Asad Ullah (Cashier 1)',
    cashierId: 'CASHIER-01',
    terminalId: 'POS-01 (Main Counter)',
    openingCash: 5000,
    openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    status: 'open'
  };
  localStorage.setItem(STORAGE_KEYS.SHIFT_SESSION, JSON.stringify(defaultSession));
  return defaultSession;
}

export function saveShiftSession(session) {
  localStorage.setItem(STORAGE_KEYS.SHIFT_SESSION, JSON.stringify(session));
}

// 5. Anti-Theft Void Manager PIN Validation (Automation 3)
export async function verifyManagerPinAndVoid(orderId, managerPin, reason, cashierId = 'CASHIER-01') {
  // If remote Supabase is connected, invoke the RPC function
  const isRemoteActive = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('demo');
  if (isRemoteActive) {
    try {
      return await voidOrderWithManagerPin(orderId, managerPin, reason, cashierId);
    } catch (e) {
      // Fallback to local check if offline
    }
  }

  // Local/Offline verification against authorized manager credentials
  const validManager = DEMO_MANAGERS.find(m => m.pin === managerPin.trim());
  if (!validManager) {
    throw new Error('SECURITY ALERT: Invalid Manager PIN! Authorization rejected.');
  }

  return {
    success: true,
    orderId,
    authorizedBy: validManager.name,
    voidedAt: new Date().toISOString(),
    reason,
    message: `Order successfully voided with Manager PIN by ${validManager.name}`
  };
}

// 6. Blind Shift Closing Calculation (Automation 4)
export async function executeBlindShiftClose(notesCount, discrepancyReason = '') {
  const session = getActiveShiftSession();
  
  // Calculate counted physical cash
  let physicalTotal = 0;
  physicalTotal += (Number(notesCount['5000']) || 0) * 5000;
  physicalTotal += (Number(notesCount['1000']) || 0) * 1000;
  physicalTotal += (Number(notesCount['500']) || 0) * 500;
  physicalTotal += (Number(notesCount['100']) || 0) * 100;
  physicalTotal += (Number(notesCount['75']) || 0) * 75;
  physicalTotal += (Number(notesCount['50']) || 0) * 50;
  physicalTotal += (Number(notesCount['20']) || 0) * 20;
  physicalTotal += (Number(notesCount['10']) || 0) * 10;
  physicalTotal += (Number(notesCount['coins']) || 0) * 1;

  // Retrieve all paid cash orders during this session
  const activeOrders = getSavedOrders();
  const cashSales = activeOrders
    .filter(o => o.paymentMethod === 'cash' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const expectedTotal = session.openingCash + cashSales;
  const discrepancy = physicalTotal - expectedTotal;

  const closedSession = {
    ...session,
    status: 'closed',
    physicalCashTotal: physicalTotal,
    expectedCashTotal: expectedTotal,
    cashDiscrepancy: discrepancy,
    blindNotes: notesCount,
    discrepancyReason,
    closedAt: new Date().toISOString(),
    locked: true
  };

  saveShiftSession(closedSession);

  return {
    success: true,
    openingCash: session.openingCash,
    cashSalesTotal: cashSales,
    expectedCashTotal: expectedTotal,
    physicalCashTotal: physicalTotal,
    cashDiscrepancy: discrepancy,
    isShortage: discrepancy < 0,
    isOverage: discrepancy > 0,
    isBalanced: discrepancy === 0,
    status: 'closed',
    message: discrepancy < 0 
      ? `Shift locked with CASH SHORTAGE of Rs. ${Math.abs(discrepancy).toLocaleString()}`
      : discrepancy > 0 
      ? `Shift locked with CASH OVERAGE of Rs. ${discrepancy.toLocaleString()}`
      : `Shift locked perfectly BALANCED with zero discrepancy!`
  };
}

// 7. Orders In-Memory / Local Storage
export function getSavedOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOrderRecord(order) {
  const orders = getSavedOrders();
  orders.unshift(order);
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDERS, JSON.stringify(orders.slice(0, 100))); // Keep last 100 orders
}
