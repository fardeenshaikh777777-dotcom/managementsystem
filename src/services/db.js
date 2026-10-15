// ==============================================================================
// KARACHI EXPRESS POS — DURABLE INDEXEDDB STORAGE ENGINE (services/db.js)
// Zero-dependency, ACID transactional local storage for load-shedding resilience
// ==============================================================================

const DB_NAME = 'karachi_pos_enterprise_db';
const DB_VERSION = 1;

/**
 * Open or upgrade the IndexedDB database
 */
export function openPosDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Orders Store: Authoritative local order records
      if (!db.objectStoreNames.contains('orders')) {
        const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
        orderStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
        orderStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        orderStore.createIndex('createdAt', 'createdAt', { unique: false });
        orderStore.createIndex('sessionId', 'sessionId', { unique: false });
        orderStore.createIndex('orderNumber', 'orderNumber', { unique: false });
      }

      // 2. Outbox Store: Durable queue for Supabase synchronization
      if (!db.objectStoreNames.contains('outbox')) {
        const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
        outboxStore.createIndex('status', 'status', { unique: false });
        outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
        outboxStore.createIndex('retryCount', 'retryCount', { unique: false });
      }

      // 3. Shift Sessions Store: Cash drawer shift records
      if (!db.objectStoreNames.contains('shifts')) {
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' });
        shiftStore.createIndex('status', 'status', { unique: false });
        shiftStore.createIndex('openedAt', 'openedAt', { unique: false });
      }

      // 4. Cash Movements Store: Traceable cash drawer ledger
      if (!db.objectStoreNames.contains('cash_movements')) {
        const movementStore = db.createObjectStore('cash_movements', { keyPath: 'id' });
        movementStore.createIndex('sessionId', 'sessionId', { unique: false });
        movementStore.createIndex('type', 'type', { unique: false });
        movementStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 5. Riders Store: In-house delivery riders and states
      if (!db.objectStoreNames.contains('riders')) {
        const riderStore = db.createObjectStore('riders', { keyPath: 'id' });
        riderStore.createIndex('status', 'status', { unique: false });
      }

      // 6. Rider Handovers Store: Cash handover audit trail
      if (!db.objectStoreNames.contains('rider_handovers')) {
        const handoverStore = db.createObjectStore('rider_handovers', { keyPath: 'id' });
        handoverStore.createIndex('riderId', 'riderId', { unique: false });
        handoverStore.createIndex('sessionId', 'sessionId', { unique: false });
        handoverStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 7. Inventory Store: Local raw materials and stock levels
      if (!db.objectStoreNames.contains('inventory')) {
        const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
        invStore.createIndex('sku', 'sku', { unique: true });
        invStore.createIndex('isLowStock', 'isLowStock', { unique: false });
      }

      // 8. Audit Logs Store: Manager void and security actions
      if (!db.objectStoreNames.contains('audit_logs')) {
        const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
        auditStore.createIndex('action', 'action', { unique: false });
        auditStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic transactional helper to get all records from a store
 */
export async function idbGetAll(storeName) {
  const db = await openPosDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Generic transactional helper to get one record by key
 */
export async function idbGet(storeName, key) {
  const db = await openPosDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Generic transactional helper to put/save a record
 */
export async function idbPut(storeName, value) {
  const db = await openPosDB();
  if (!db) return value;
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(value);
      req.onerror = () => reject(req.error);
    } catch (e) {
      resolve(value);
    }
  });
}

/**
 * Generic transactional helper to delete a record
 */
export async function idbDelete(storeName, key) {
  const db = await openPosDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Clear a specific store
 */
export async function idbClear(storeName) {
  const db = await openPosDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Generate standard UUID v4
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
