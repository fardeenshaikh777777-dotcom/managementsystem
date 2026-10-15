-- ==============================================================================
-- MIGRATION: 20261015000002_automations.sql
-- High-Volume Traditional Restaurant Management System (Karachi Edition)
-- Backend Automations 1, 2, 3, and 4
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- AUTOMATION 2 (Supporting View & Trigger): Daigh & Stock Alerts
-- Automatically flags an item as 'Low Stock' on the counter screen when a biryani 
-- or haleem daigh has fewer than 5 plates remaining or raw inventory is depleted.
-- ------------------------------------------------------------------------------

-- Function to evaluate and synchronize low stock status for menu items
CREATE OR REPLACE FUNCTION fn_sync_menu_item_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_menu_item RECORD;
    v_min_available_portions NUMERIC;
    v_is_low BOOLEAN;
BEGIN
    -- Find all menu items that use the modified raw inventory item
    FOR v_menu_item IN
        SELECT DISTINCT m.id, m.name, m.low_stock_threshold, m.is_daigh_item, m.pricing_type
        FROM menu_items m
        JOIN recipe_ingredients r ON r.menu_item_id = m.id
        WHERE r.raw_inventory_item_id = NEW.id
    LOOP
        -- Calculate the minimum number of portions/plates possible from current raw ingredients
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

        -- For Daigh items (Biryani, Haleem, Pulao), trigger Low Stock when remaining < 5 plates
        -- For other items, trigger Low Stock when available portions < low_stock_threshold
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

-- Trigger to recalculate low stock when raw inventory changes
DROP TRIGGER IF EXISTS trg_sync_low_stock_on_inventory ON raw_inventory_items;
CREATE TRIGGER trg_sync_low_stock_on_inventory
AFTER UPDATE OF current_stock ON raw_inventory_items
FOR EACH ROW
EXECUTE FUNCTION fn_sync_menu_item_low_stock();

-- Counter Screen Live Alert View for Daigh and Fast-Moving Items
CREATE OR REPLACE VIEW view_counter_stock_alerts AS
SELECT 
    m.id AS menu_item_id,
    m.name AS item_name,
    m.urdu_name,
    c.name AS category_name,
    m.pricing_type,
    m.is_daigh_item,
    m.low_stock_threshold,
    m.is_low_stock,
    COALESCE(
        (SELECT MIN(FLOOR(inv.current_stock / r.quantity_required))
         FROM recipe_ingredients r
         JOIN raw_inventory_items inv ON inv.id = r.raw_inventory_item_id
         WHERE r.menu_item_id = m.id AND r.quantity_required > 0),
        0
    ) AS remaining_plates_or_portions,
    CASE 
        WHEN m.is_daigh_item = TRUE THEN 
            CONCAT('⚠️ Daigh Alert: Only ', 
                COALESCE((SELECT MIN(FLOOR(inv.current_stock / r.quantity_required))
                          FROM recipe_ingredients r
                          JOIN raw_inventory_items inv ON inv.id = r.raw_inventory_item_id
                          WHERE r.menu_item_id = m.id AND r.quantity_required > 0), 0),
                ' plates left in current daigh!')
        ELSE 
            CONCAT('⚠️ Low Stock: Only ', 
                COALESCE((SELECT MIN(FLOOR(inv.current_stock / r.quantity_required))
                          FROM recipe_ingredients r
                          JOIN raw_inventory_items inv ON inv.id = r.raw_inventory_item_id
                          WHERE r.menu_item_id = m.id AND r.quantity_required > 0), 0),
                ' portions left in kitchen!')
    END AS alert_message
FROM menu_items m
JOIN menu_categories c ON c.id = m.category_id
WHERE m.is_low_stock = TRUE OR m.is_available = FALSE;


-- ------------------------------------------------------------------------------
-- AUTOMATION 1: Recipe Auto-Depletion
-- Whenever an order is marked as completed, system automatically deducts exact
-- raw ingredients (chicken, beef, oil, spices, packaging, or daigh portions)
-- from inventory based on recipe ratios and variable-weight measurements.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_deduct_recipe_inventory_on_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_order_item RECORD;
    v_recipe RECORD;
    v_deduction_qty NUMERIC(12, 3);
    v_prev_stock NUMERIC(12, 3);
    v_new_stock NUMERIC(12, 3);
BEGIN
    -- Only trigger when order status transitions to 'completed'
    IF (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed') THEN
        
        -- Loop through all items in this order (exclude any individually cancelled items)
        FOR v_order_item IN 
            SELECT oi.id, oi.menu_item_id, oi.quantity, oi.weight_kg, m.name AS item_name, m.pricing_type
            FROM order_items oi
            JOIN menu_items m ON m.id = oi.menu_item_id
            WHERE oi.order_id = NEW.id AND oi.item_status != 'cancelled'
        LOOP
            -- Loop through each recipe ingredient for this menu item
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
                -- Calculate exact deduction:
                -- If item is variable weight (e.g. Fish or Shinwari Karahi priced per kg),
                -- multiply by actual weighed kg.
                -- Otherwise, multiply by order item count.
                IF v_recipe.is_proportional_to_weight = TRUE AND v_order_item.weight_kg IS NOT NULL THEN
                    v_deduction_qty := ROUND(v_recipe.quantity_required * v_order_item.weight_kg, 3);
                ELSE
                    v_deduction_qty := ROUND(v_recipe.quantity_required * v_order_item.quantity, 3);
                END IF;

                v_prev_stock := v_recipe.current_stock;
                -- Protect against negative stock underflow (cap at 0 if required by business rule)
                v_new_stock := GREATEST(0, v_prev_stock - v_deduction_qty);

                -- Deduct inventory
                UPDATE raw_inventory_items
                SET current_stock = v_new_stock,
                    updated_at = NOW()
                WHERE id = v_recipe.raw_inventory_item_id;

                -- Record transaction in audit log
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

        -- Record completion timestamp
        NEW.completed_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipe_auto_depletion ON orders;
CREATE TRIGGER trg_recipe_auto_depletion
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_deduct_recipe_inventory_on_complete();


-- ------------------------------------------------------------------------------
-- AUTOMATION 3: Anti-Theft Void Guard
-- Block cashiers from deleting or canceling any order after a bill or token is 
-- generated unless a valid 4-digit Manager PIN is verified.
-- ------------------------------------------------------------------------------

-- 3A. Hard block on row deletion if token or bill exists
CREATE OR REPLACE FUNCTION fn_prevent_order_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.token_generated = TRUE OR OLD.bill_printed = TRUE THEN
        RAISE EXCEPTION 'SECURITY VIOLATION [ANTI-THEFT GUARD]: Direct deletion of Order #% (Token: %) is blocked. Orders with generated tokens/bills must undergo Manager PIN voiding.',
            OLD.order_number, OLD.order_token;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_order_deletion ON orders;
CREATE TRIGGER trg_block_order_deletion
BEFORE DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_order_hard_delete();

-- 3B. Block status change to 'cancelled' without verified manager authorization
CREATE OR REPLACE FUNCTION fn_guard_order_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    -- If cashier tries to cancel order after token was generated or bill printed:
    IF (OLD.status != 'cancelled' AND NEW.status = 'cancelled') THEN
        IF (OLD.token_generated = TRUE OR OLD.bill_printed = TRUE) THEN
            -- Check if manager signoff is present on the update
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

DROP TRIGGER IF EXISTS trg_guard_order_cancellation ON orders;
CREATE TRIGGER trg_guard_order_cancellation
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_guard_order_cancellation();

-- 3C. Secure RPC function: void_order_with_manager_pin
-- Validates manager 4-digit PIN hash, cancels order, and generates tamper-proof audit trail
CREATE OR REPLACE FUNCTION void_order_with_manager_pin(
    p_order_id UUID,
    p_manager_pin TEXT,
    p_reason TEXT,
    p_cashier_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_manager RECORD;
    v_order RECORD;
    v_pin_hash TEXT;
    v_items_json JSONB;
BEGIN
    -- Validate reason
    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) < 3 THEN
        RAISE EXCEPTION 'A detailed cancellation reason (min 3 characters) is required for manager void.';
    END IF;

    -- Fetch order
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found with ID: %', p_order_id;
    END IF;

    IF v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Order #% is already voided/cancelled.', v_order.order_number;
    END IF;

    -- Compute SHA-256 hash of the provided 4-digit PIN using PostgreSQL native sha256()
    v_pin_hash := encode(sha256(p_manager_pin::bytea), 'hex');

    -- Verify manager PIN against manager_credentials (check hash or plain_pin_hint fallback)
    SELECT * INTO v_manager 
    FROM manager_credentials 
    WHERE is_active = TRUE 
      AND (pin_hash = v_pin_hash OR plain_pin_hint = p_manager_pin)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SECURITY ALERT: Invalid Manager PIN. Void authorization rejected for Order #%.', v_order.order_number;
    END IF;

    -- Snapshot order items for audit log
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

    -- Perform authenticated cancellation
    UPDATE orders
    SET status = 'cancelled',
        is_voided = TRUE,
        void_approved_by = v_manager.manager_name,
        void_reason = p_reason,
        void_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Insert into tamper-proof audit void log
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- AUTOMATION 4: Blind Cash Closing
-- Cashier must enter physical cash note count at shift end before seeing system totals.
-- System calculates expected cash, logs any shortage/overage, and permanently locks shift.
-- ------------------------------------------------------------------------------

-- Procedure to perform Blind Shift Closing
CREATE OR REPLACE FUNCTION blind_close_shift(
    p_session_id UUID,
    p_cashier_id TEXT,
    p_physical_notes JSONB,
    p_discrepancy_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_session RECORD;
    v_physical_total NUMERIC(10, 2) := 0.0;
    v_cash_sales_total NUMERIC(10, 2) := 0.0;
    v_expected_cash NUMERIC(10, 2) := 0.0;
    v_discrepancy NUMERIC(10, 2) := 0.0;
    v_denom RECORD;
    v_count INT;
    v_val NUMERIC;
BEGIN
    -- Verify session exists and is open
    SELECT * INTO v_session FROM cash_drawer_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shift session not found: %', p_session_id;
    END IF;

    IF v_session.status = 'closed' THEN
        RAISE EXCEPTION 'This shift session is already locked and closed on %.', v_session.closing_time;
    END IF;

    -- Compute physical cash total strictly from note denomination counts:
    -- Standard Pakistani Rupee denominations: Rs. 5000, 1000, 500, 100, 75, 50, 20, 10, and coins
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

    -- Calculate expected cash:
    -- Opening float + Sum of paid cash orders (excluding cancelled/voided orders)
    SELECT COALESCE(SUM(total_amount), 0.0)
    INTO v_cash_sales_total
    FROM orders
    WHERE session_id = p_session_id
      AND payment_method = 'cash'
      AND payment_status = 'paid'
      AND status != 'cancelled';

    v_expected_cash := v_session.opening_cash + v_cash_sales_total;
    v_discrepancy := v_physical_total - v_expected_cash;

    -- Lock the shift permanently
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Guard to prevent orders being added to a locked/closed shift session
CREATE OR REPLACE FUNCTION fn_prevent_order_in_closed_session()
RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS trg_guard_closed_session_orders ON orders;
CREATE TRIGGER trg_guard_closed_session_orders
BEFORE INSERT OR UPDATE OF session_id, total_amount ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_order_in_closed_session();
