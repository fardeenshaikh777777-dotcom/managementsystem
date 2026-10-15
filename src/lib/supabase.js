import { createClient } from '@supabase/supabase-js';

const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
  ? import.meta.env.VITE_SUPABASE_URL
  : 'https://demo-restaurant.supabase.co';

const envKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : 'demo-anon-key';

export const supabase = createClient(envUrl, envKey);

/**
 * RPC helper to execute Manager PIN order void (Anti-Theft Guard)
 */
export async function voidOrderWithManagerPin(orderId, managerPin, reason, cashierId = 'CASHIER-01') {
  const { data, error } = await supabase.rpc('void_order_with_manager_pin', {
    p_order_id: orderId,
    p_manager_pin: managerPin,
    p_reason: reason,
    p_cashier_id: cashierId
  });

  if (error) throw error;
  return data;
}

/**
 * RPC helper to perform Blind Shift Closing
 */
export async function blindCloseShift(sessionId, cashierId, physicalNotes, reason = null) {
  const { data, error } = await supabase.rpc('blind_close_shift', {
    p_session_id: sessionId,
    p_cashier_id: cashierId,
    p_physical_notes: physicalNotes,
    p_discrepancy_reason: reason
  });

  if (error) throw error;
  return data;
}
