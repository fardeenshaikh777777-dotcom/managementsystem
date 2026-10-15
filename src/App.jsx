import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { DaighAlertBanner } from './components/DaighAlertBanner';
import { CategoryNav } from './components/CategoryNav';
import { ItemGrid } from './components/ItemGrid';
import { OrderCart } from './components/OrderCart';
import { WeightCalculatorModal } from './components/WeightCalculatorModal';
import { PaymentModal } from './components/PaymentModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { ManagerVoidModal } from './components/ManagerVoidModal';
import { BlindCashCloseModal } from './components/BlindCashCloseModal';
import { RiderTrackerView } from './components/RiderTrackerView';
import { BlindCashScreen } from './components/BlindCashScreen';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { INITIAL_MENU_ITEMS } from './data/mockData';
import {
  getNextDailyTokenNumber,
  getCurrentTokenNumber,
  getOfflineQueue,
  saveOrderToOfflineQueue,
  syncOfflineQueueToSupabase,
  getActiveShiftSession,
  getSavedOrders,
  saveOrderRecord
} from './services/posService';

export default function App() {
  // Active Navigation View: 'pos', 'riders', 'blind_cash', 'owner'
  const [activeView, setActiveView] = useState('pos');

  // Menu State with Real-Time Inventory & Daigh Alert Monitoring
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);

  // Cart & Bill State
  const [cartItems, setCartItems] = useState([]);
  const [orderMode, setOrderMode] = useState('takeaway'); // 'dine_in', 'takeaway', 'car_dine', 'delivery'
  const [tableNumber, setTableNumber] = useState('T-04');
  const [carDetails, setCarDetails] = useState('KHI-8920 White Corolla');
  const [deliveryInfo, setDeliveryInfo] = useState({ riderId: '', address: '', phone: '' });
  const [srbTaxRate, setSrbTaxRate] = useState(0); // 0% or 5% SRB tax

  // Token Sequence (Auto-resets daily)
  const [dailyToken, setDailyToken] = useState(() => {
    const cur = getCurrentTokenNumber();
    return cur === 0 ? getNextDailyTokenNumber() : cur;
  });

  // Shift & Network / Load-Shedding State
  const [activeShift, setActiveShift] = useState(getActiveShiftSession);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(() => getOfflineQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);
  const [placedOrders, setPlacedOrders] = useState(getSavedOrders);

  // Modals State
  const [weightModalData, setWeightModalData] = useState(null); // { item, cartIndex }
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [checkoutInitialMethod, setCheckoutInitialMethod] = useState('cash');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);

  // Network Connectivity Listeners for Automatic Load-Shedding Sync
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (!isSimulatedOffline) {
        triggerAutoSync();
      }
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Global Keyboard Shortcuts (F1: Cash, F2: Card, F3: COD, F4: Void, F8: Shift Close)
  useEffect(() => {
    function handleGlobalKeys(e) {
      if (e.key === 'F1') {
        e.preventDefault();
        if (cartItems.length > 0) initiateCheckout('cash');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (cartItems.length > 0) initiateCheckout('card');
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (cartItems.length > 0) initiateCheckout('rider_cod');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsVoidModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveView('blind_cash');
      }
    }
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [cartItems]);

  // Handle Item Click from 65% Touch Grid
  function handleSelectItem(item) {
    if (item.pricingType === 'per_kg') {
      // Variable-weight item: Open Live Weight Calculator Modal!
      setWeightModalData({ item, cartIndex: null });
    } else {
      // Fixed-price item: Add to active bill instantly with ZERO LAG
      addItemToCart(item, 1, null, item.basePrice);
    }
  }

  function addItemToCart(item, qty = 1, weightKg = null, unitPrice) {
    setCartItems(prev => {
      // If it's a fixed item and already in cart, increment quantity
      if (!weightKg) {
        const existingIdx = prev.findIndex(i => i.id === item.id && !i.weightKg);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const newQty = updated[existingIdx].quantity + qty;
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: newQty,
            totalPrice: newQty * updated[existingIdx].unitPrice
          };
          return updated;
        }
      }

      // Variable weight or new item: Append row
      const totalPrice = weightKg ? Math.round(weightKg * item.basePrice) : item.basePrice * qty;
      return [
        ...prev,
        {
          ...item,
          quantity: qty,
          weightKg,
          unitPrice: item.basePrice,
          totalPrice
        }
      ];
    });
  }

  function handleUpdateCartQty(index, delta) {
    setCartItems(prev => {
      const target = prev[index];
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      const updated = [...prev];
      updated[index] = {
        ...target,
        quantity: newQty,
        totalPrice: newQty * target.unitPrice
      };
      return updated;
    });
  }

  function handleRemoveCartItem(index) {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
  }

  function handleOpenWeightModalForEdit(item, index) {
    setWeightModalData({ item, cartIndex: index });
  }

  function handleConfirmWeight(weightKg, calculatedPrice) {
    if (weightModalData.cartIndex !== null) {
      // Editing existing cart item weight
      setCartItems(prev => {
        const updated = [...prev];
        updated[weightModalData.cartIndex] = {
          ...updated[weightModalData.cartIndex],
          weightKg,
          totalPrice: calculatedPrice
        };
        return updated;
      });
    } else {
      // Adding new weighed item
      addItemToCart(weightModalData.item, 1, weightKg, weightModalData.item.basePrice);
    }
    setWeightModalData(null);
  }

  // 1-Click Checkout Initiation
  function initiateCheckout(method = 'cash') {
    if (cartItems.length === 0) return;
    setCheckoutInitialMethod(method);
    setIsPaymentModalOpen(true);
  }

  // Complete Payment & Generate 80mm Receipt / WhatsApp Link
  function handleCompletePayment({ method, tendered, change }) {
    const subtotal = cartItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const tax = Math.round((subtotal * srbTaxRate) / 100);
    const total = subtotal + tax;

    const newOrder = {
      id: 'ord-' + Date.now(),
      token: dailyToken,
      mode: orderMode,
      tableNo: orderMode === 'dine_in' ? tableNumber : null,
      carDetails: orderMode === 'car_dine' ? carDetails : null,
      deliveryInfo: orderMode === 'delivery' ? deliveryInfo : null,
      items: [...cartItems],
      subtotal,
      tax,
      total,
      paymentMethod: method,
      tendered,
      change,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Save order record
    saveOrderRecord(newOrder);
    setPlacedOrders(prev => [newOrder, ...prev]);

    // =========================================================================
    // AUTOMATION 1: RECIPE INVENTORY AUTO-DEPLETION
    // AUTOMATION 2: DAIGH LOW-STOCK MONITORING (< 5 PLATES RULE)
    // =========================================================================
    setMenuItems(prev =>
      prev.map(item => {
        // If this item was in the completed order
        const cartItemMatch = cartItems.find(c => c.id === item.id);
        if (cartItemMatch && item.isDaighItem && item.daighPlatesRemaining !== undefined) {
          const newRemaining = Math.max(0, item.daighPlatesRemaining - cartItemMatch.quantity);
          const isNowLow = newRemaining < (item.lowStockThreshold || 5);
          return {
            ...item,
            daighPlatesRemaining: newRemaining,
            isLowStock: isNowLow
          };
        }
        return item;
      })
    );

    // =========================================================================
    // LOAD-SHEDDING & OFFLINE AUTOMATION:
    // If offline or simulated, enqueue to browser storage; otherwise push
    // =========================================================================
    if (!isOnline || isSimulatedOffline) {
      const qLen = saveOrderToOfflineQueue(newOrder);
      setPendingSyncCount(qLen);
    }

    // Set thermal receipt preview
    setReceiptOrder(newOrder);
    setIsPaymentModalOpen(false);

    // Advance daily token for the next bill
    const nextTkn = getNextDailyTokenNumber();
    setDailyToken(nextTkn);

    // Clear active bill
    setCartItems([]);
  }

  // Trigger Background Sync to Supabase
  async function triggerAutoSync() {
    setIsSyncing(true);
    try {
      const res = await syncOfflineQueueToSupabase();
      setPendingSyncCount(getOfflineQueue().length);
      if (res.syncedCount > 0) {
        console.log(`Successfully synced ${res.syncedCount} queued orders to Supabase.`);
      }
    } catch (e) {
      console.warn('Sync attempt encountered an error:', e);
    } finally {
      setIsSyncing(false);
    }
  }

  // Handle Void Cancellation Success (Automation 3)
  function handleVoidSuccess(orderId, voidResult) {
    setPlacedOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled', voidMeta: voidResult } : o))
    );
  }

  // Filter items by active category
  const filteredCategoryItems = menuItems.filter(item => {
    if (activeCategory === 'all') return true;
    return item.categoryId === activeCategory;
  });

  return (
    <div className="pos-container">
      {/* 1. Top Header Bar with View Switcher, Network Status, Shift, and Shortcut Buttons */}
      <HeaderBar
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulateOffline={() => setIsSimulatedOffline(prev => !prev)}
        pendingSyncCount={pendingSyncCount}
        onSyncNow={triggerAutoSync}
        isSyncing={isSyncing}
        activeShift={activeShift}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenVoidModal={() => setIsVoidModalOpen(true)}
        onOpenShiftCloseModal={() => setActiveView('blind_cash')}
      />

      {/* 2. Automation 2: Live Daigh Alert Banner (Fires when < 5 plates remaining) */}
      <DaighAlertBanner menuItems={menuItems} />

      {/* 3. Conditional View Router */}
      {activeView === 'pos' && (
        <main className="pos-main-body">
          {/* Left 65%: Fast Touch Menu Grid */}
          <section className="pos-menu-section" aria-label="Touch Menu Selection">
            {/* Category Tabs: Broast, Burgers, Biryani, Karahi, BBQ, Tandoor, Chai */}
            <CategoryNav
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            {/* Touch Item Cards */}
            <ItemGrid
              items={filteredCategoryItems}
              onSelectItem={handleSelectItem}
            />
          </section>

          {/* Right 35%: Active Bill, Modes, Car-Dine & 1-Click Checkout */}
          <section className="pos-cart-section" aria-label="Active Bill and Checkout">
            <OrderCart
              orderMode={orderMode}
              setOrderMode={setOrderMode}
              tokenNumber={dailyToken}
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              carDetails={carDetails}
              setCarDetails={setCarDetails}
              deliveryInfo={deliveryInfo}
              setDeliveryInfo={setDeliveryInfo}
              cartItems={cartItems}
              onUpdateQty={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onOpenWeightModalForEdit={handleOpenWeightModalForEdit}
              onClearCart={() => setCartItems([])}
              srbTaxRate={srbTaxRate}
              setSrbTaxRate={setSrbTaxRate}
              onInitiateCheckout={initiateCheckout}
            />
          </section>
        </main>
      )}

      {/* View 2: In-House Delivery Rider Tracker & Cash Ledger */}
      {activeView === 'riders' && (
        <RiderTrackerView
          orders={placedOrders}
          onUpdateOrders={setPlacedOrders}
        />
      )}

      {/* View 3: Dedicated Blind Cash Drawer Closing Screen */}
      {activeView === 'blind_cash' && (
        <BlindCashScreen
          activeShift={activeShift}
          onShiftClosed={report => setActiveShift(prev => ({ ...prev, ...report }))}
          onSwitchToPos={() => setActiveView('pos')}
        />
      )}

      {/* View 4: Live Owner Mobile View */}
      {activeView === 'owner' && (
        <OwnerDashboardView
          orders={placedOrders}
          menuItems={menuItems}
          activeShift={activeShift}
        />
      )}

      {/* ===================================================================== */}
      {/* Interactive Modals                                                    */}
      {/* ===================================================================== */}

      {/* Live Weight Scale Calculator Modal */}
      {weightModalData && (
        <WeightCalculatorModal
          item={weightModalData.item}
          initialWeight={
            weightModalData.cartIndex !== null
              ? cartItems[weightModalData.cartIndex]?.weightKg
              : 1.0
          }
          onConfirm={handleConfirmWeight}
          onClose={() => setWeightModalData(null)}
        />
      )}

      {/* 1-Click Checkout & Pakistani Cash Tender Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          totalAmount={
            cartItems.reduce((acc, i) => acc + i.totalPrice, 0) +
            Math.round((cartItems.reduce((acc, i) => acc + i.totalPrice, 0) * srbTaxRate) / 100)
          }
          initialMethod={checkoutInitialMethod}
          tokenNumber={dailyToken}
          onCompletePayment={handleCompletePayment}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* 80mm Thermal Receipt Preview & WhatsApp Automation */}
      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Automation 3: Anti-Theft Void Guard Modal (4-digit Manager PIN) */}
      {isVoidModalOpen && (
        <ManagerVoidModal
          orders={placedOrders.filter(o => o.status !== 'cancelled')}
          onVoidSuccess={handleVoidSuccess}
          onClose={() => setIsVoidModalOpen(false)}
        />
      )}

      {/* Automation 4: Quick Blind Cash Shift Closing Modal (Shortcut F8 from POS) */}
      {isShiftCloseModalOpen && (
        <BlindCashCloseModal
          activeShift={activeShift}
          onShiftClosed={report => setActiveShift(prev => ({ ...prev, ...report }))}
          onClose={() => setIsShiftCloseModalOpen(false)}
        />
      )}
    </div>
  );
}
