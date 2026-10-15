// ==============================================================================
// KARACHI EXPRESS POS — ROLE-BASED ACCESS CONTROL & AUTHENTICATION (services/authService.js)
// Enforces least-privilege security across cashier, supervisor, manager, and owner
// ==============================================================================

import { supabase } from '../lib/supabase';

// Standard System Roles
export const ROLES = {
  CASHIER: 'cashier',
  SUPERVISOR: 'supervisor',
  MANAGER: 'manager',
  OWNER: 'owner',
  RIDER: 'rider'
};

// Explicit Permissions Matrix
export const PERMISSIONS = {
  TAKE_ORDERS: [ROLES.CASHIER, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.OWNER],
  COLLECT_PAYMENT: [ROLES.CASHIER, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.OWNER],
  VOID_ACTIVE_ORDER: [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.OWNER], // Requires PIN
  PERFORM_BLIND_CLOSE: [ROLES.CASHIER, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.OWNER],
  OVERRIDE_CASH_DISCREPANCY: [ROLES.MANAGER, ROLES.OWNER],
  DISPATCH_RIDERS: [ROLES.CASHIER, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.OWNER],
  SETTLE_RIDER_CASH: [ROLES.CASHIER, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.OWNER],
  VIEW_OWNER_REPORTS: [ROLES.MANAGER, ROLES.OWNER],
  MANUAL_STOCK_ADJUSTMENT: [ROLES.MANAGER, ROLES.OWNER],
  RESET_DEMO_DATA: [ROLES.OWNER]
};

// Secure SHA-256 Hashes for Authorized Demo Managers (Salted / Non-Plaintext)
// Salt: "khi_pos_pin_"
// "7860" -> sha256("khi_pos_pin_7860") = "54e3af090c7f7576c75ad7c069189f8b2c05a23cad635c3a04782e39deca906f"
// "1234" -> sha256("khi_pos_pin_1234") = "7cd6a60490b143ed643de2dc755aceb6c03f27c08a0cf2f3d0c1051e2e8dac8d"
const AUTHORIZED_MANAGER_HASHES = [
  {
    id: 'mgr-01',
    name: 'Shahmeer Khan',
    title: 'General Manager',
    role: ROLES.MANAGER,
    pinHash: '54e3af090c7f7576c75ad7c069189f8b2c05a23cad635c3a04782e39deca906f'
  },
  {
    id: 'mgr-02',
    name: 'Tariq Mehmood',
    title: 'Shift Supervisor',
    role: ROLES.SUPERVISOR,
    pinHash: '7cd6a60490b143ed643de2dc755aceb6c03f27c08a0cf2f3d0c1051e2e8dac8d'
  }
];

/**
 * Hash a PIN using browser Web Crypto SHA-256 with consistent salt
 */
export async function hashPin(pin) {
  const salted = `khi_pos_pin_${pin.trim()}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback hash for test/node environments
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Current Active User Session in the Counter Terminal
 */
const STORAGE_KEY_AUTH = 'karachi_pos_active_user';

export function getActiveUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Default terminal user: Cashier Counter 01
  const defaultUser = {
    id: 'usr-cashier-01',
    name: 'Asad Ullah',
    role: ROLES.CASHIER,
    terminalId: 'POS-01 (Main Counter)'
  };
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(defaultUser));
  return defaultUser;
}

export function setActiveUser(user) {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
}

/**
 * Check if the active user holds a specific permission
 */
export function hasPermission(permission, role = null) {
  const currentRole = role || getActiveUser().role;
  const allowedRoles = PERMISSIONS[permission] || [];
  return allowedRoles.includes(currentRole);
}

/**
 * Verify Manager PIN securely:
 * 1. If Supabase is connected, call remote RPC function
 * 2. If offline / demo, compare cryptographic SHA-256 hash
 */
export async function verifyManagerPin(pin) {
  if (!pin || pin.length !== 4) {
    throw new Error('PIN must be exactly 4 digits.');
  }

  // 1. Try remote Supabase verification if configured
  const isRemoteActive = typeof import.meta !== 'undefined' && 
    import.meta.env?.VITE_SUPABASE_URL && 
    !import.meta.env.VITE_SUPABASE_URL.includes('demo');

  if (isRemoteActive) {
    try {
      const { data, error } = await supabase
        .from('manager_credentials')
        .select('manager_name, role, is_active')
        .eq('pin_hash', pin) // matches Supabase trigger/column or RPC
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return {
          authorized: true,
          managerName: data.manager_name,
          role: data.role || ROLES.MANAGER
        };
      }
    } catch (e) {
      // Fallback to local cryptographic hash check if offline
    }
  }

  // 2. Local / Offline Cryptographic Verification
  const computedHash = await hashPin(pin);
  const manager = AUTHORIZED_MANAGER_HASHES.find(m => m.pinHash === computedHash);

  if (manager) {
    return {
      authorized: true,
      managerName: `${manager.name} (${manager.title})`,
      role: manager.role
    };
  }

  throw new Error('SECURITY ALERT: Invalid Manager PIN! Authorization rejected.');
}
