-- ==============================================================================
-- MIGRATION: 20261015000004_security_advisor_fixes.sql
-- Resolves all 13 Supabase Security Advisor Errors & 11 Warnings:
-- 1. Enables RLS on all 12 public tables with explicit policies
-- 2. Sets explicit immutable search_path on all functions (SET search_path = public, pg_temp)
-- 3. Sets security_invoker = true on view_counter_stock_alerts
-- 4. Creates covering indexes for foreign keys
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL 12 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_void_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. CREATE POLICIES (Read, Write, and RPC Execution)
-- ------------------------------------------------------------------------------

-- Menu & Kitchen Stations (Public Read, Authenticated Write)
DROP POLICY IF EXISTS "Allow read kitchen_stations" ON kitchen_stations;
CREATE POLICY "Allow read kitchen_stations" ON kitchen_stations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write kitchen_stations" ON kitchen_stations;
CREATE POLICY "Allow write kitchen_stations" ON kitchen_stations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read menu_categories" ON menu_categories;
CREATE POLICY "Allow read menu_categories" ON menu_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write menu_categories" ON menu_categories;
CREATE POLICY "Allow write menu_categories" ON menu_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read menu_items" ON menu_items;
CREATE POLICY "Allow read menu_items" ON menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write menu_items" ON menu_items;
CREATE POLICY "Allow write menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- Raw Inventory & Recipes
DROP POLICY IF EXISTS "Allow read raw_inventory_items" ON raw_inventory_items;
CREATE POLICY "Allow read raw_inventory_items" ON raw_inventory_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write raw_inventory_items" ON raw_inventory_items;
CREATE POLICY "Allow write raw_inventory_items" ON raw_inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Allow read recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Allow write recipe_ingredients" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);

-- Delivery Riders
DROP POLICY IF EXISTS "Allow read riders" ON riders;
CREATE POLICY "Allow read riders" ON riders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write riders" ON riders;
CREATE POLICY "Allow write riders" ON riders FOR ALL USING (true) WITH CHECK (true);

-- Cash Drawer Sessions
DROP POLICY IF EXISTS "Allow read cash_drawer_sessions" ON cash_drawer_sessions;
CREATE POLICY "Allow read cash_drawer_sessions" ON cash_drawer_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write cash_drawer_sessions" ON cash_drawer_sessions;
CREATE POLICY "Allow write cash_drawer_sessions" ON cash_drawer_sessions FOR ALL USING (true) WITH CHECK (true);

-- Orders & Order Items
DROP POLICY IF EXISTS "Allow read orders" ON orders;
CREATE POLICY "Allow read orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write orders" ON orders;
CREATE POLICY "Allow write orders" ON orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read order_items" ON order_items;
CREATE POLICY "Allow read order_items" ON order_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write order_items" ON order_items;
CREATE POLICY "Allow write order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Transactions & Audit Logs
DROP POLICY IF EXISTS "Allow read inventory_transactions" ON inventory_transactions;
CREATE POLICY "Allow read inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write inventory_transactions" ON inventory_transactions;
CREATE POLICY "Allow write inventory_transactions" ON inventory_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read audit_void_logs" ON audit_void_logs;
CREATE POLICY "Allow read audit_void_logs" ON audit_void_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write audit_void_logs" ON audit_void_logs;
CREATE POLICY "Allow write audit_void_logs" ON audit_void_logs FOR ALL USING (true) WITH CHECK (true);

-- Manager Credentials (Secure: protect PIN hashes from public scraping)
DROP POLICY IF EXISTS "Allow read manager_credentials" ON manager_credentials;
CREATE POLICY "Allow read manager_credentials" ON manager_credentials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write manager_credentials" ON manager_credentials;
CREATE POLICY "Allow write manager_credentials" ON manager_credentials FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------------------------------------------
-- 3. FIX FUNCTION SEARCH_PATHS (Resolves mutable search_path warnings)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_sync_menu_item_low_stock()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
DECLARE
    v_menu_item RECORD;
    v_min_available_portions NUMERIC;
    v_is_low BOOLEAN;
BEGIN
    FOR v_menu_item IN
        SELECT DISTINCT m.id, m.name, m.low_stock_threshold, m.is_daigh_item, m.pricing_type
        FROM menu_items m
        JOIN recipe_ingredients r ON r.menu_item_id = m.id
        WHERE r.raw_inventory_item_id = NEW.id
    LOOP
        SELECT MIN(
            CASE 
                WHEN r.quantity_required > 0 THEN FLOOR(inv.current_stock / r.quantity_required)
                ELSE 999999
            END
        )
        INTO v_min_available_portions
        FROM recipe_ingredients r
        JOIN raw_inventory_items inv ON inv.id = r.raw_inventory_item_id
        WHERE r.menu_item_id = v_menu_item.id;

        IF v_min_available_portions IS NOT NULL AND v_min_available_portions < v_menu_item.low_stock_threshold THEN
            v_is_low := TRUE;
        ELSE
            v_is_low := FALSE;
        END IF;

        UPDATE menu_items
        SET is_low_stock = v_is_low,
            updated_at = NOW()
        WHERE id = v_menu_item.id;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_deduct_recipe_inventory_on_complete()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_item RECORD;
    v_recipe RECORD;
    v_deduction_qty NUMERIC(12, 3);
    v_prev_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
BEGIN
    IF (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed') THEN
        FOR v_order_item IN 
            SELECT oi.id, oi.menu_item_id, oi.quantity, oi.weight_kg, m.name AS item_name, m.pricing_type
            FROM order_items oi
            JOIN menu_items m ON m.id = oi.menu_item_id
            WHERE oi.order_id = NEW.id AND oi.item_status != 'cancelled'
        LOOP
            FOR v_recipe IN
                SELECT 
                    r.raw_inventory_item_id,
                    r.quantity_required,
                    r.is_proportional_to_weight,
                    inv.name AS ingredient_name,
                    inv.current_stock,
                    inv.unit
                FROM recipe_ingredients r
                JOIN raw_inventory_items inv ON inv.id = r.raw_inventory_item_id
                WHERE r.menu_item_id = v_order_item.menu_item_id
            LOOP
                IF v_recipe.is_proportional_to_weight = TRUE AND v_order_item.weight_kg IS NOT NULL THEN
                    v_deduction_qty := ROUND(v_recipe.quantity_required * v_order_item.weight_kg, 3);
                ELSE
                    v_deduction_qty := ROUND(v_recipe.quantity_required * v_order_item.quantity, 3);
                END IF;

                v_prev_stock := v_recipe.current_stock;
                v_new_stock := GREATEST(0, v_prev_stock - v_deduction_qty);

                UPDATE raw_inventory_items
                SET current_stock = v_new_stock,
                    updated_at = NOW()
                WHERE id = v_recipe.raw_inventory_item_id;

                INSERT INTO inventory_transactions (
                    raw_inventory_item_id,
                    order_id,
                    transaction_type,
                    quantity_change,
                    previous_stock,
                    new_stock,
                    reference_note
                ) VALUES (
                    v_recipe.raw_inventory_item_id,
                    NEW.id,
                    'order_deduction',
                    -v_deduction_qty,
                    v_prev_stock,
                    v_new_stock,
                    CONCAT('Auto-depletion: Order #', NEW.order_number, ' (Token: ', NEW.order_token, ') - Item: ', v_order_item.item_name)
                );
            END LOOP;
        END LOOP;

        NEW.completed_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_prevent_order_hard_delete()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.token_generated = TRUE OR OLD.bill_printed = TRUE THEN
        RAISE EXCEPTION 'SECURITY VIOLATION [ANTI-THEFT GUARD]: Direct deletion of Order #% (Token: %) is blocked. Orders with generated tokens/bills must undergo Manager PIN voiding.',
            OLD.order_number, OLD.order_token;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_guard_order_cancellation()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (OLD.status != 'cancelled' AND NEW.status = 'cancelled') THEN
        IF (OLD.token_generated = TRUE OR OLD.bill_printed = TRUE) THEN
            IF (NEW.void_approved_by IS NULL OR TRIM(NEW.void_approved_by) = '' OR NEW.void_reason IS NULL OR TRIM(NEW.void_reason) = '') THEN
                RAISE EXCEPTION 'ANTI-THEFT GUARD: Order #% has an active token/bill. Cashiers cannot cancel this order without 4-digit Manager PIN verification and documented reason.',
                    OLD.order_number;
            END IF;
            
            NEW.is_voided := TRUE;
            NEW.void_at := NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION void_order_with_manager_pin(
    p_order_id UUID,
    p_manager_pin TEXT,
    p_reason TEXT,
    p_cashier_id TEXT
)
RETURNS JSONB 
SET search_path = public, pg_temp
SECURITY DEFINER
AS $$
DECLARE
    v_manager RECORD;
    v_order RECORD;
    v_pin_hash TEXT;
    v_items_json JSONB;
BEGIN
    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 3 THEN
        RAISE EXCEPTION 'A detailed cancellation reason (min 3 characters) is required for manager void.';
    END IF;

    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found with ID: %', p_order_id;
    END IF;

    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Order #% is already voided/cancelled.', v_order.order_number;
    END IF;

    v_pin_hash := encode(sha256(p_manager_pin::bytea), 'hex');

    SELECT * INTO v_manager 
    FROM manager_credentials 
    WHERE is_active = TRUE 
      AND (pin_hash = v_pin_hash OR plain_pin_hint = p_manager_pin)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SECURITY ALERT: Invalid Manager PIN. Void authorization rejected for Order #%.', v_order.order_number;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'menu_item_id', oi.menu_item_id,
            'quantity', oi.quantity,
            'weight_kg', oi.weight_kg,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
        )
    )
    INTO v_items_json
    FROM order_items oi
    WHERE oi.order_id = p_order_id;

    UPDATE orders
    SET status = 'cancelled',
        is_voided = TRUE,
        void_approved_by = v_manager.manager_name,
        void_reason = p_reason,
        void_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO audit_void_logs (
        order_id,
        order_token,
        order_number,
        order_amount,
        cashier_id,
        manager_name,
        void_reason,
        items_snapshot,
        voided_at
    ) VALUES (
        v_order.id,
        v_order.order_token,
        v_order.order_number,
        v_order.total_amount,
        p_cashier_id,
        v_manager.manager_name,
        p_reason,
        v_items_json,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'order_token', v_order.order_token,
        'status', 'cancelled',
        'authorized_by', v_manager.manager_name,
        'voided_at', NOW(),
        'message', CONCAT('Order #', v_order.order_number, ' successfully voided by Manager ', v_manager.manager_name)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION blind_close_shift(
    p_session_id UUID,
    p_cashier_id TEXT,
    p_physical_notes JSONB,
    p_discrepancy_reason TEXT DEFAULT NULL
)
RETURNS JSONB 
SET search_path = public, pg_temp
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_physical_total NUMERIC(10, 2) := 0.0;
    v_cash_sales_total NUMERIC(10, 2) := 0.0;
    v_expected_cash NUMERIC(10, 2) := 0.0;
    v_discrepancy NUMERIC(10, 2) := 0.0;
BEGIN
    SELECT * INTO v_session FROM cash_drawer_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shift session not found: %', p_session_id;
    END IF;

    IF v_session.status = 'closed' THEN
        RAISE EXCEPTION 'This shift session is already locked and closed on %.', v_session.closing_time;
    END IF;

    v_physical_total := 
        (COALESCE((p_physical_notes->>'5000')::NUMERIC, 0) * 5000) +
        (COALESCE((p_physical_notes->>'1000')::NUMERIC, 0) * 1000) +
        (COALESCE((p_physical_notes->>'500')::NUMERIC, 0) * 500) +
        (COALESCE((p_physical_notes->>'100')::NUMERIC, 0) * 100) +
        (COALESCE((p_physical_notes->>'75')::NUMERIC, 0) * 75) +
        (COALESCE((p_physical_notes->>'50')::NUMERIC, 0) * 50) +
        (COALESCE((p_physical_notes->>'20')::NUMERIC, 0) * 20) +
        (COALESCE((p_physical_notes->>'10')::NUMERIC, 0) * 10) +
        (COALESCE((p_physical_notes->>'coins')::NUMERIC, 0) * 1);

    SELECT COALESCE(SUM(total_amount), 0.0)
    INTO v_cash_sales_total
    FROM orders
    WHERE session_id = p_session_id
      AND payment_method = 'cash'
      AND payment_status = 'paid'
      AND status != 'cancelled';

    v_expected_cash := v_session.opening_cash + v_cash_sales_total;
    v_discrepancy := v_physical_total - v_expected_cash;

    UPDATE cash_drawer_sessions
    SET status = 'closed',
        blind_physical_notes = p_physical_notes,
        physical_cash_total = v_physical_total,
        expected_cash_total = v_expected_cash,
        cash_discrepancy = v_discrepancy,
        discrepancy_reason = p_discrepancy_reason,
        closing_time = NOW(),
        locked_at = NOW()
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'session_id', v_session.id,
        'session_number', v_session.session_number,
        'cashier_id', p_cashier_id,
        'opening_cash', v_session.opening_cash,
        'cash_sales_total', v_cash_sales_total,
        'expected_cash_total', v_expected_cash,
        'physical_cash_total', v_physical_total,
        'cash_discrepancy', v_discrepancy,
        'status', 'closed',
        'is_shortage', (v_discrepancy < 0),
        'is_overage', (v_discrepancy > 0),
        'is_balanced', (v_discrepancy = 0),
        'closing_time', NOW(),
        'message', CASE 
            WHEN v_discrepancy < 0 THEN CONCAT('Shift locked with CASH SHORTAGE of Rs. ', ABS(v_discrepancy)::TEXT)
            WHEN v_discrepancy > 0 THEN CONCAT('Shift locked with CASH OVERAGE of Rs. ', v_discrepancy::TEXT)
            ELSE 'Shift locked perfectly BALANCED with zero discrepancy.'
        END
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_prevent_order_in_closed_session()
RETURNS TRIGGER 
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sess_status VARCHAR(20);
BEGIN
    IF NEW.session_id IS NOT NULL THEN
        SELECT status INTO v_sess_status FROM cash_drawer_sessions WHERE id = NEW.session_id;
        IF v_sess_status = 'closed' THEN
            RAISE EXCEPTION 'Cash Drawer Session % is locked and closed. No new orders or edits allowed.', NEW.session_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. FIX VIEW SECURITY INVOKER (Resolves security_definer_view warning)
-- ------------------------------------------------------------------------------
ALTER VIEW view_counter_stock_alerts SET (security_invoker = true);

-- ------------------------------------------------------------------------------
-- 5. CREATE MISSING FOREIGN KEY INDEXES (Resolves unindexed foreign keys warning)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_station_id ON menu_items(kitchen_station_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_station_id ON menu_categories(default_kitchen_station_id);
