// ==============================================================================
// WHATSAPP RECEIPT GENERATOR & PAKISTANI PHONE FORMATTER
// Generates pre-filled digital receipt links for WhatsApp Web & Mobile
// ==============================================================================

/**
 * Normalizes Pakistani mobile numbers to international format (923XXXXXXXXX)
 * Supports:
 * - 03001234567 -> 923001234567
 * - +923001234567 -> 923001234567
 * - 0321-9876543 -> 923219876543
 */
export function formatPakistaniPhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('92') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return '92' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '92' + digits;
  }
  return digits;
}

/**
 * Builds formatted itemized text for WhatsApp receipt
 */
export function generateWhatsAppReceiptText(order) {
  const tokenStr = (order.token || 1).toString().padStart(3, '0');
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB');
  const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let modeHeader = '';
  if (order.mode === 'car_dine') {
    modeHeader = `🚘 *CAR-DINE:* ${order.carDetails || 'General Parking'}`;
  } else if (order.mode === 'dine_in') {
    modeHeader = `🍽️ *TABLE:* ${order.tableNo || 'Walk-in'}`;
  } else if (order.mode === 'delivery') {
    modeHeader = `🛵 *DELIVERY:* ${order.deliveryInfo?.riderName || 'Rider Dispatch'}`;
  } else {
    modeHeader = `🛍️ *TAKEAWAY TOKEN PICKUP*`;
  }

  const itemsList = (order.items || [])
    .map(i => {
      const weightNote = i.weightKg ? ` (${i.weightKg.toFixed(3)} kg @ Rs. ${i.basePrice}/kg)` : '';
      return `• ${i.quantity}x *${i.name}*${weightNote} -> Rs. ${i.totalPrice.toLocaleString()}`;
    })
    .join('\n');

  const text = 
`🔥 *KARACHI SHINWARI & BROAST HOUSE*
Main Superhighway & Burns Road, Karachi
📞 Ph: 021-34981024 / 0300-9284719
NTN: 8920194-2 • SRB Reg: 15-00-9821-001
====================================
🧾 *DIGITAL CASH BILL & TOKEN*
Token Number: *#${tokenStr}*
Date: ${dateStr} at ${timeStr}
Order Mode: ${modeHeader}
====================================
*ORDER ITEMS:*
${itemsList}
====================================
Subtotal: Rs. ${(order.subtotal || 0).toLocaleString()}
Sindh Sales Tax (SRB): Rs. ${(order.tax || 0).toLocaleString()}
*GRAND TOTAL PAID: Rs. ${(order.total || 0).toLocaleString()}*
Payment: *${(order.paymentMethod || 'CASH').toUpperCase()}*
${order.paymentMethod === 'cash' ? `Cash Tendered: Rs. ${(order.tendered || order.total).toLocaleString()} | Change Returned: Rs. ${(order.change || 0).toLocaleString()}\n` : ''}====================================
❤️ *Shukriya for ordering with us!*
🌿 Save trees, thank you for choosing paperless digital receipts!`;

  return text;
}

/**
 * Builds direct WhatsApp URL
 */
export function getWhatsAppReceiptUrl(phone, order) {
  const formattedPhone = formatPakistaniPhoneNumber(phone);
  const text = generateWhatsAppReceiptText(order);
  const encoded = encodeURIComponent(text);
  
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
