# Karachi Express POS — Restaurant Management System 🍗🥘

> **High-Volume Traditional Restaurant POS & Management System for Karachi**  
> Engineered for fast-paced dinner rushes, load-shedding offline resilience, recipe BOM auto-depletion, anti-theft void security, and blind shift cash closing.

---

## 🌟 Key Highlights & Architectural Features

### 1. ⚡ Fast Touch Counter POS (65/35 Split)
- **65% Touch Menu Grid**: High-contrast, large touch cards with authentic bilingual Urdu dish titles (*Broast, Biryani, Karahi/BBQ, Tandoor, Chai/Drinks*).
- **35% Active Bill Panel**: Real-time quantity steppers, subtotal, 0% or 5% SRB sales tax, and instant total calculation.
- **Order Mode Toggles**:
  - **Takeaway**: Auto-generating daily bold token number starting from `#1` every single day.
  - **Dine-In**: Quick table selection (`T-01` to `T-16`).
  - **Car-Dine**: Dedicated car/bike registration input (e.g. `KHI-8920 White Corolla`).
  - **Local Delivery**: Assign phone orders to internal delivery motorbike riders.
- **Variable-Weight Keypad**: Real-time gram/kg price calculation for variable-weight dishes (*Shinwari Karahi, Surmai Fish*).
- **Thermal Receipt & Split Slips**: Instant 80mm thermal receipt with tear-off slips for **Main Kitchen (KOT)** and **Tandoor Naan**.
- **WhatsApp Digital Receipts**: 1-click digital receipt generation using pre-filled `wa.me` links with Pakistani mobile number formatting (`923...`).

### 2. 🛡️ 4 Core Backend Database Automations (Supabase PostgreSQL)
1. **Recipe Auto-Depletion Trigger (`trg_recipe_auto_depletion`)**:
   - Marking an order as `completed` automatically scales bill-of-materials (BOM) recipes and deducts raw inventory (chicken, beef, oil, daigh portions, packing) with audit logs in `inventory_transactions`.
2. **Daigh & Stock Alerts (`trg_sync_low_stock_on_inventory`)**:
   - Automatically flags `is_low_stock = TRUE` when Biryani or Haleem Daigh has `< 5` plates remaining.
3. **Anti-Theft Void Guard (`trg_block_order_deletion` & `trg_guard_order_cancellation`)**:
   - Hard deletion of paid or tokenized orders is strictly blocked by the database.
   - Orders can only be voided via stored procedure `void_order_with_manager_pin` using an authorized 4-digit Manager PIN (`7860` / `1234`), logging to `audit_void_logs`.
4. **Blind Cash Shift Closing (`blind_close_shift`)**:
   - Cashier enters physical Pakistani currency note counts (Rs. 5000, 1000, 500, 100, 50, 20, 10, coins) without seeing system totals. The database computes expected cash, records discrepancy (shortage/overage), and locks the shift session.

### 3. 🛵 In-House Delivery Rider Ledger
- Track motorbike riders (e.g. Tariq Road, Bahadurabad, PECHS routes).
- Real-time gross COD collections, cash surrendered, and net cash owed per rider.
- Settlement modal with automated discrepancy calculation.

### 4. 📱 Live Owner Mobile View
- Executive smartphone-optimized dashboard.
- Live daily revenue, active open tables, top dishes sold, remaining Daigh inventory counters, and anti-theft void watchlist.

### 5. 🔌 Load-Shedding & Offline Resilience
- Automatically queues placed orders in `localStorage` when internet or power drops.
- Automatically synchronizes queued orders with Supabase cloud once connectivity is restored.
- Manual offline simulation toggle for training and resilience testing.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system (responsive touch UI with Outfit, Inter, and Noto Nastaliq Urdu typography)
- **Icons & Extras**: Lucide React, Canvas Confetti
- **Backend & Database**: Supabase (PostgreSQL 17 with Row-Level Security, Triggers, RPC Stored Procedures, Views)
- **Local Testing**: `@electric-sql/pglite` (Zero-dependency embedded PostgreSQL engine for test-driven migration verification)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/fardeenshaikh777777-dotcom/managementsystem.git
cd managementsystem
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres.your-project:password@your-pooler-host:5432/postgres
```

### 4. Run local database tests
Test all 4 migrations and automations locally on embedded PostgreSQL:
```bash
npm run db:verify
```

### 5. Deploy migrations to remote Supabase (Optional)
```bash
npm run db:deploy
```

### 6. Start development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
├── .env.example                 # Sanitized environment template
├── .gitignore                   # Excludes .env, node_modules, dist, logs
├── index.html                   # HTML entry point with Google Fonts
├── package.json                 # Dependencies and scripts
├── scripts/
│   ├── deploy_to_supabase.js    # Remote Supabase migration runner
│   └── verify_migrations.cjs    # Local PGlite test suite for all 4 automations
├── src/
│   ├── App.jsx                  # Main application orchestrator & hotkeys
│   ├── index.css                # Curated high-contrast touch design system
│   ├── main.jsx                 # React root mount
│   ├── components/              # Touch POS components & modular views
│   │   ├── BlindCashCloseModal.jsx
│   │   ├── BlindCashScreen.jsx
│   │   ├── CategoryNav.jsx
│   │   ├── DaighAlertBanner.jsx
│   │   ├── HeaderBar.jsx
│   │   ├── ItemGrid.jsx
│   │   ├── ManagerVoidModal.jsx
│   │   ├── OrderCart.jsx
│   │   ├── OwnerDashboardView.jsx
│   │   ├── PaymentModal.jsx
│   │   ├── RiderTrackerView.jsx
│   │   ├── ThermalReceiptModal.jsx
│   │   └── WeightCalculatorModal.jsx
│   ├── data/
│   │   └── mockData.js          # Seed dishes, categories, riders, manager PINs
│   ├── lib/
│   │   └── supabase.js          # Supabase client & RPC wrapper helpers
│   ├── services/
│   │   └── posService.js        # Offline queue, tokens, sync & calculations
│   └── utils/
│       └── whatsappReceipt.js   # WhatsApp digital receipt generator (923...)
└── supabase/
    └── migrations/
        ├── 20261015000001_core_schema.sql
        ├── 20261015000002_automations.sql
        ├── 20261015000003_seed_data.sql
        └── 20261015000004_security_advisor_fixes.sql
```

---

## 🔒 Security & Privacy Notice
All `.env` files, production secrets, and database credentials are fully git-ignored. Never commit `.env` or sensitive API keys to public repositories.

---

## 📄 License
MIT
