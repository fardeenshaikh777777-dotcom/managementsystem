-- ==============================================================================
-- MIGRATION: 20261015000001_core_schema.sql
-- High-Volume Traditional Restaurant Management System (Karachi Edition)
-- Core Database Structure
-- ==============================================================================

-- Note: Modern PostgreSQL (PostgreSQL 13+) provides gen_random_uuid() natively.
-- No external extensions required.

-- 1. KITCHEN STATIONS TABLE
-- Stations: Wok/Karahi, BBQ Grill, Fryer, Tandoor, Beverages & Desserts
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    display_order INT DEFAULT 0,
    printer_ip VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MENU CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    urdu_name VARCHAR(100),
    slug VARCHAR(100) NOT NULL UNIQUE,
    default_kitchen_station_id UUID REFERENCES kitchen_stations(id) ON DELETE SET NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MENU ITEMS TABLE
-- Supports:
--   a) Fixed-price items (Broast, Biryani plates, Burgers, Drinks)
--   b) Variable-weight items (Fish per kg, Shinwari Mutton/Chicken Karahi per kg, Sajji)
--   c) Daigh portions tracking (Biryani / Haleem Daighs)
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
    kitchen_station_id UUID NOT NULL REFERENCES kitchen_stations(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    urdu_name VARCHAR(150),
    description TEXT,
    pricing_type VARCHAR(20) NOT NULL CHECK (pricing_type IN ('fixed', 'per_kg', 'per_plate_daigh')),
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0), -- Fixed portion price OR Price per 1.0 kg
    min_weight_kg NUMERIC(6, 3) DEFAULT 0.500,                  -- e.g. Min 0.5 kg for Shinwari
    max_weight_kg NUMERIC(6, 3) DEFAULT 10.000,
    is_daigh_item BOOLEAN DEFAULT FALSE,                        -- Biryani or Haleem Daigh portion item
    daigh_capacity_plates INT DEFAULT 0,                        -- e.g., 35 plates per daigh
    low_stock_threshold NUMERIC(10, 2) DEFAULT 5.0,             -- Counter alert if remaining plates/stock < 5
    is_low_stock BOOLEAN DEFAULT FALSE,                         -- Flagged automatically on counter screen
    is_available BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RAW INVENTORY ITEMS TABLE
-- Inventory tracking for raw items: Chicken, Mutton, Beef, Fish, Basmati Rice, Oil/Ghee, 
-- Spices, Naan Flour, Packaging Boxes, Daigh portions
CREATE TABLE IF NOT EXISTS raw_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    urdu_name VARCHAR(150),
    category VARCHAR(50) NOT NULL, -- Meat & Poultry, Seafood, Rice & Grains, Oil & Ghee, Spices, Bakery & Flour, Packaging, Prepared Daigh
    unit VARCHAR(20) NOT NULL,     -- kg, gram, litre, plate, piece, box
    current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.0 CHECK (current_stock >= 0),
    minimum_threshold NUMERIC(12, 3) NOT NULL DEFAULT 10.0,
    cost_per_unit NUMERIC(10, 2) DEFAULT 0.0,
    is_daigh_batch BOOLEAN DEFAULT FALSE, -- Specifically represents a live cooking pot / daigh
    daigh_batch_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECIPE INGREDIENTS TABLE (Bill of Materials)
-- Links menu items to raw inventory ingredients with exact conversion ratios
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    raw_inventory_item_id UUID NOT NULL REFERENCES raw_inventory_items(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(10, 4) NOT NULL CHECK (quantity_required > 0),
    -- If true: deduction scales with actual weighed kg (e.g. 1.0 kg Shinwari Karahi takes 1.05 kg raw chicken + 0.15 kg ghee)
    -- If false: deduction scales with integer ordered quantity (e.g. 1 Broast takes 0.25 kg chicken + 1 packaging box)
    is_proportional_to_weight BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_recipe_menu_raw UNIQUE (menu_item_id, raw_inventory_item_id)
);

-- 6. RIDERS TABLE (Karachi Delivery Fleet)
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    cnic VARCHAR(30),
    vehicle_number VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_delivery', 'off_duty')),
    total_deliveries INT DEFAULT 0,
    cash_in_hand NUMERIC(10, 2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MANAGER CREDENTIALS TABLE (Anti-Theft Void Guard & Approvals)
CREATE TABLE IF NOT EXISTS manager_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_name VARCHAR(100) NOT NULL,
    pin_hash VARCHAR(128) NOT NULL, -- SHA-256 hash of 4-digit PIN
    plain_pin_hint VARCHAR(10),     -- Stored for local dev/demo visibility (e.g., '7860')
    role VARCHAR(50) DEFAULT 'general_manager',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CASH DRAWER SESSIONS TABLE (Blind Cash Shift Closing)
CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number SERIAL,
    cashier_name VARCHAR(100) NOT NULL,
    cashier_id VARCHAR(50) NOT NULL,
    terminal_id VARCHAR(50) NOT NULL DEFAULT 'POS-01',
    opening_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closing_time TIMESTAMPTZ,
    opening_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (opening_cash >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closing_pending', 'closed', 'audited')),
    blind_physical_notes JSONB,        -- Denomination counts entered by cashier before viewing system numbers
    physical_cash_total NUMERIC(10, 2),-- Total counted physical cash
    expected_cash_total NUMERIC(10, 2),-- Total calculated strictly by database
    cash_discrepancy NUMERIC(10, 2),   -- physical_cash_total - expected_cash_total (negative = shortage)
    discrepancy_reason TEXT,
    manager_verified_by VARCHAR(100),
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    order_token VARCHAR(30) NOT NULL UNIQUE, -- Printed token e.g. "TKN-1001"
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
    table_number VARCHAR(30),
    session_id UUID REFERENCES cash_drawer_sessions(id) ON DELETE RESTRICT,
    rider_id UUID REFERENCES riders(id) ON DELETE SET NULL,
    status VARCHAR(25) NOT NULL DEFAULT 'sent_to_kitchen' 
        CHECK (status IN ('draft', 'sent_to_kitchen', 'preparing', 'ready', 'completed', 'cancelled')),
    token_generated BOOLEAN NOT NULL DEFAULT TRUE,
    token_generated_at TIMESTAMPTZ DEFAULT NOW(),
    bill_printed BOOLEAN NOT NULL DEFAULT FALSE,
    bill_printed_at TIMESTAMPTZ,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (subtotal >= 0),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (discount >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (delivery_fee >= 0),
    tax_srb NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (tax_srb >= 0), -- Sindh Revenue Board tax
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (total_amount >= 0),
    payment_method VARCHAR(25) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'unpaid')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    -- Anti-Theft Void Guard Fields:
    is_voided BOOLEAN DEFAULT FALSE,
    void_reason TEXT,
    void_approved_by VARCHAR(100),
    void_at TIMESTAMPTZ,
    -- Customer info for takeaway/delivery
    customer_name VARCHAR(120),
    customer_phone VARCHAR(30),
    delivery_address TEXT,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 10. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    kitchen_station_id UUID NOT NULL REFERENCES kitchen_stations(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    weight_kg NUMERIC(6, 3), -- Weight in KG for variable items like Shinwari/Fish
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    item_status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (item_status IN ('queued', 'cooking', 'done', 'cancelled')),
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INVENTORY TRANSACTIONS TABLE (Audit Log for Recipe Auto-Depletion)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_inventory_item_id UUID NOT NULL REFERENCES raw_inventory_items(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('order_deduction', 'manual_restock', 'spoilage_waste', 'adjustment', 'daigh_cooked')),
    quantity_change NUMERIC(12, 3) NOT NULL, -- Negative for deduction, Positive for restock
    previous_stock NUMERIC(12, 3) NOT NULL,
    new_stock NUMERIC(12, 3) NOT NULL,
    reference_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT VOID LOGS TABLE (Anti-Theft Manager Void Security Trail)
CREATE TABLE IF NOT EXISTS audit_void_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    order_token VARCHAR(30),
    order_number INT,
    order_amount NUMERIC(10, 2),
    cashier_id VARCHAR(50),
    manager_name VARCHAR(100) NOT NULL,
    void_reason TEXT NOT NULL,
    items_snapshot JSONB,
    voided_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-volume performance in Karachi peak hours (dinner rush 8 PM - 2 AM)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(order_token);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_station ON order_items(kitchen_station_id);
CREATE INDEX IF NOT EXISTS idx_recipe_menu ON recipe_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON raw_inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inv_tx_raw ON inventory_transactions(raw_inventory_item_id);
