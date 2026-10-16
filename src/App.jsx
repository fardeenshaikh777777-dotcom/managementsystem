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
import { TerminalSplashScreen } from './components/TerminalSplashScreen';
import { INITIAL_MENU_ITEMS, CATEGORIES } from './data/mockData';
import { BRAND, BRAND_PRESETS, applyBrandTheme } from './config/brand';
import {
  submitAuthoritativeOrder,
  getAllStoredOrders,
  getOrCreateActiveShiftSession,
  getPendingOutboxCount,
  processOutboxSync,
  getNextDailyTokenNumber,
  getCurrentTokenNumber
} from './services/posService';
import { getActiveUser, setActiveUser, ROLES } from './services/authService';
import { idbClear } from './services/db';

export default function App() {
  // White-Label Active Brand State (defaults to "Your Restaurant" with presets available)
  const [currentBrand, setCurrentBrand] = useState(BRAND);
  const [showSplash, setShowSplash] = useState(false);

  // Apply white-label brand theme (CSS accent variable, page title)
  useEffect(() => {
    applyBrandTheme(currentBrand);
  }, [currentBrand]);

  // Active Navigation View: 'pos', 'riders', 'blind_cash', 'owner'
  const [activeView, setActiveView] = useState('pos');

  // RBAC User Session State
  const [currentUser, setCurrentUser] = useState(getActiveUser);

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
  const [activeShift, setActiveShift] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [placedOrders, setPlacedOrders] = useState([]);

  // Modals State
  const [weightModalData, setWeightModalData] = useState(null); // { item, cartIndex }
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [checkoutInitialMethod, setCheckoutInitialMethod] = useState('cash');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [isShiftCloseModalOpen, setIsShiftCloseModalOpen] = useState(false);

  // Check if live remote Supabase is configured
  const isRemoteConfigured = typeof import.meta !== 'undefined' && 
    import.meta.env?.VITE_SUPABASE_URL && 
    !import.meta.env.VITE_SUPABASE_URL.includes('demo');

  // Load Initial Data from IndexedDB
  useEffect(() => {
    async function initDB() {
      try {
        const shift = await getOrCreateActiveShiftSession();
        setActiveShift(shift);

        const orders = await getAllStoredOrders();
        setPlacedOrders(orders);

        const pCount = await getPendingOutboxCount();
        setPendingSyncCount(pCount);
      } catch (err) {
        console.warn('Initialization error from IndexedDB:', err);
      }
    }
    initDB();

    // Periodic background sync engine (runs every 15s)
    const syncInterval = setInterval(() => {
      if (navigator.onLine && !isSimulatedOffline) {
        processOutboxSync()
          .then(async (res) => {
            const p = await getPendingOutboxCount();
            setPendingSyncCount(p);
            if (res.syncedCount > 0) {
              const updated = await getAllStoredOrders();
              setPlacedOrders(updated);
            }
          })
          .catch(() => {});
      }
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [isSimulatedOffline]);

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
      if (isPaymentModalOpen || isVoidModalOpen || weightModalData) {
        return; // Modal is handling focus
      }

      if (e.key === 'F1') {
        e.preventDefault();
        initiateCheckout('cash');
      } else if (e.key === 'F2') {
        e.preventDefault();
        initiateCheckout('card');
      } else if (e.key === 'F3') {
        e.preventDefault();
        initiateCheckout('rider_cod');
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
  }, [cartItems, isPaymentModalOpen, isVoidModalOpen, weightModalData]);

  // Handle Item Click from 65% Touch Grid
  function handleSelectItem(item) {
    if (item.pricingType === 'per_kg') {
      // Variable-weight item: Open Live Weight Calculator Modal
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
    let currentCart = cartItems;
    if (cartItems.length === 0) {
      // If cashier taps checkout with an empty cart, automatically add signature dish for rapid checkout
      const defaultItem = menuItems.find(m => m.pricingType === 'fixed') || menuItems[0];
      if (defaultItem) {
        const newItem = {
          id: defaultItem.id,
          name: defaultItem.name,
          urduName: defaultItem.urduName,
          unitPrice: defaultItem.basePrice,
          basePrice: defaultItem.basePrice,
          quantity: 1,
          weightKg: null,
          totalPrice: defaultItem.basePrice,
          pricingType: 'fixed',
          isDaighItem: defaultItem.isDaighItem || false,
          category: defaultItem.category
        };
        currentCart = [newItem];
        setCartItems(currentCart);
      }
    }
    setCheckoutInitialMethod(method);
    setIsPaymentModalOpen(true);
  }

  // Authoritative Order Submission Workflow (Priority 1)
  async function handleCompletePayment({ method, tendered, change }) {
    try {
      const activeItems = cartItems.length > 0 ? cartItems : [
        {
          id: menuItems[0]?.id || 'item-broast-1',
          name: menuItems[0]?.name || 'Quarter Chicken Broast (Crispy)',
          urduName: menuItems[0]?.urduName || 'کوارٹر چکن بروسٹ',
          unitPrice: menuItems[0]?.basePrice || 680,
          basePrice: menuItems[0]?.basePrice || 680,
          quantity: 1,
          weightKg: null,
          totalPrice: menuItems[0]?.basePrice || 680,
          pricingType: 'fixed',
          isDaighItem: false,
          category: 'broast'
        }
      ];

      const newOrder = await submitAuthoritativeOrder({
        cartItems: activeItems,
        orderMode,
        tableNumber: orderMode === 'dine_in' ? tableNumber : null,
        carDetails: orderMode === 'car_dine' ? carDetails : null,
        deliveryInfo: orderMode === 'delivery' ? deliveryInfo : null,
        paymentMethod: method,
        tendered: tendered || (activeItems.reduce((acc, i) => acc + i.totalPrice, 0) + Math.round((activeItems.reduce((acc, i) => acc + i.totalPrice, 0) * srbTaxRate) / 100)),
        change: change || 0,
        taxRatePercent: srbTaxRate
      });

      // Update state
      setPlacedOrders(prev => [newOrder, ...prev]);

      // Reactive update for Daigh plate stock countdown (< 5 plates alert)
      setMenuItems(prev =>
        prev.map(item => {
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

      // Refresh outbox badge
      const pCount = await getPendingOutboxCount();
      setPendingSyncCount(pCount);

      // Open receipt modal
      setReceiptOrder(newOrder);
      setIsPaymentModalOpen(false);

      // Advance daily token for the next bill
      setDailyToken(newOrder.token + 1);

      // Clear active bill
      setCartItems([]);
    } catch (err) {
      alert(`Order submission error: ${err.message}`);
    }
  }

  // Trigger Background Sync to Supabase
  async function triggerAutoSync() {
    setIsSyncing(true);
    try {
      const res = await processOutboxSync();
      const pCount = await getPendingOutboxCount();
      setPendingSyncCount(pCount);
      if (res.syncedCount > 0) {
        const updated = await getAllStoredOrders();
        setPlacedOrders(updated);
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

  // Handle Role Switching for demonstration (Priority 0)
  function handleChangeRole(user) {
    setCurrentUser(user);
    setActiveUser(user);
  }

  // Reset Register & Shift Data
  async function handleResetDemoData() {
    if (!confirm('Are you sure you want to reset the register and clear local session orders?')) {
      return;
    }
    await idbClear('orders');
    await idbClear('outbox');
    await idbClear('cash_movements');
    setPlacedOrders([]);
    setPendingSyncCount(0);
    setMenuItems(INITIAL_MENU_ITEMS);
    alert('Register transaction ledger successfully reset to clean shift state.');
  }

  // Filter items by active category
  const filteredCategoryItems = menuItems.filter(item => {
    if (activeCategory === 'all') return true;
    return item.categoryId === activeCategory;
  });

  return (
    <div className="pos-container">
      {/* 1. Top Header Bar with View Switcher, Network Status, Role Switcher, and Shortcuts */}
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
        currentUser={currentUser}
        onChangeRole={handleChangeRole}
        isRemoteConfigured={isRemoteConfigured}
        brand={currentBrand}
        onOpenSplash={() => setShowSplash(true)}
        onSelectBrand={(b) => {
          setCurrentBrand(b);
          applyBrandTheme(b);
        }}
      />

      {/* 2. Automation 2: Live Daigh Alert Banner (Fires when < 5 plates remaining) */}
      <DaighAlertBanner menuItems={menuItems} />

      {/* 3. Main Operational Screens */}
      {activeView === 'pos' && (
        <main className="pos-body">
          {/* Left 65%: Fast Touch Screen Menu Grid */}
          <section className="pos-menu-panel">
            <CategoryNav
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />

            <ItemGrid
              items={filteredCategoryItems}
              onSelectItem={handleSelectItem}
              onOpenWeightModal={handleOpenWeightModalForEdit}
              currency={currentBrand.currency}
            />
          </section>

          {/* Right 35%: Active Bill, Mode Toggles, & Tender Controls */}
          <section className="pos-cart-panel">
            <OrderCart
              dailyToken={dailyToken}
              orderMode={orderMode}
              onChangeOrderMode={setOrderMode}
              tableNumber={tableNumber}
              onChangeTableNumber={setTableNumber}
              carDetails={carDetails}
              onChangeCarDetails={setCarDetails}
              deliveryInfo={deliveryInfo}
              onChangeDeliveryInfo={setDeliveryInfo}
              cartItems={cartItems}
              onUpdateQty={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onOpenWeightModalForEdit={handleOpenWeightModalForEdit}
              srbTaxRate={srbTaxRate}
              onChangeTaxRate={setSrbTaxRate}
              onInitiateCheckout={initiateCheckout}
              onOpenVoidModal={() => setIsVoidModalOpen(true)}
              onResetDemo={handleResetDemoData}
              currency={currentBrand.currency}
            />
          </section>
        </main>
      )}

      {/* View 2: In-House Rider Tracker & COD Ledger */}
      {activeView === 'riders' && (
        <RiderTrackerView
          orders={placedOrders}
          onUpdateOrders={setPlacedOrders}
        />
      )}

      {/* View 3: Dedicated Blind Cash Closing Screen */}
      {activeView === 'blind_cash' && (
        <BlindCashScreen
          activeShift={activeShift}
          onShiftClosed={(res) => {
            setActiveShift(prev => ({ ...prev, status: 'closed', ...res }));
          }}
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
      {/* MODALS SECTION                                                        */}
      {/* ===================================================================== */}

      {/* Variable Weight Keypad Calculator Modal */}
      {weightModalData && (
        <WeightCalculatorModal
          item={weightModalData.item}
          initialWeight={weightModalData.cartIndex !== null ? cartItems[weightModalData.cartIndex]?.weightKg : 1.0}
          onConfirm={handleConfirmWeight}
          onClose={() => setWeightModalData(null)}
        />
      )}

      {/* Payment & Tender Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          totalAmount={
            cartItems.length > 0
              ? cartItems.reduce((acc, i) => acc + i.totalPrice, 0) + Math.round((cartItems.reduce((acc, i) => acc + i.totalPrice, 0) * srbTaxRate) / 100)
              : (menuItems[0]?.basePrice || 680) + Math.round(((menuItems[0]?.basePrice || 680) * srbTaxRate) / 100)
          }
          initialMethod={checkoutInitialMethod}
          tokenNumber={dailyToken}
          onCompletePayment={handleCompletePayment}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Thermal 80mm Printable Receipt & WhatsApp Modal */}
      {receiptOrder && (
        <ThermalReceiptModal
          order={receiptOrder}
          brand={currentBrand}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Anti-Theft Void Guard Modal (4-Digit Manager PIN Guard) */}
      {isVoidModalOpen && (
        <ManagerVoidModal
          orders={placedOrders.filter(o => o.status !== 'cancelled')}
          onVoidSuccess={handleVoidSuccess}
          onClose={() => setIsVoidModalOpen(false)}
        />
      )}

      {/* Shift Close Confirmation Modal */}
      {isShiftCloseModalOpen && (
        <BlindCashCloseModal
          activeShift={activeShift}
          orders={placedOrders}
          onClose={() => setIsShiftCloseModalOpen(false)}
          onConfirmClose={() => {
            setIsShiftCloseModalOpen(false);
            setActiveView('blind_cash');
          }}
        />
      )}

      {/* White-Label Brand & Staff Terminal Splash Screen */}
      {showSplash && (
        <TerminalSplashScreen
          currentBrand={currentBrand}
          onSelectBrand={(b) => {
            setCurrentBrand(b);
            applyBrandTheme(b);
          }}
          currentUser={currentUser}
          onChangeRole={handleChangeRole}
          activeShift={activeShift}
          onEnterPOS={() => setShowSplash(false)}
        />
      )}
    </div>
  );
}
