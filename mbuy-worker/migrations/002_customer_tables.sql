-- =====================================================
-- Customer Shopping Tables Migration
-- Creates: shopping_carts, cart_items, wishlists, wishlist_items
-- =====================================================

-- =====================================================
-- 1. SHOPPING CARTS
-- =====================================================

CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active, converted, abandoned
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopping_carts_customer_id ON shopping_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_status ON shopping_carts(status);

-- Unique active cart per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_carts_active 
  ON shopping_carts(customer_id) WHERE status = 'active';

-- =====================================================
-- 2. CART ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2), -- Stored price at time of adding
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Unique product per cart (use variant_id for variant-specific items)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique 
  ON cart_items(cart_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- =====================================================
-- 3. WISHLISTS (Favorites)
-- =====================================================

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Wishlist',
  is_default BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON wishlists(customer_id);

-- One default wishlist per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_default 
  ON wishlists(customer_id) WHERE is_default = true;

-- =====================================================
-- 4. WISHLIST ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  notes TEXT,
  priority INTEGER DEFAULT 0, -- For ordering
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);

-- Unique product per wishlist
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_items_unique 
  ON wishlist_items(wishlist_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- =====================================================
-- 5. UPDATED_AT TRIGGERS
-- =====================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_shopping_carts_updated_at 
  BEFORE UPDATE ON shopping_carts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at 
  BEFORE UPDATE ON wishlists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. RLS POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Shopping Carts: Users can only access their own carts
CREATE POLICY shopping_carts_customer_policy ON shopping_carts
  FOR ALL USING (customer_id = current_setting('app.current_user_id')::uuid);

-- Cart Items: Access through cart ownership
CREATE POLICY cart_items_customer_policy ON cart_items
  FOR ALL USING (
    cart_id IN (
      SELECT id FROM shopping_carts 
      WHERE customer_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Wishlists: Users can access their own or public wishlists
CREATE POLICY wishlists_customer_policy ON wishlists
  FOR ALL USING (
    customer_id = current_setting('app.current_user_id')::uuid 
    OR is_public = true
  );

-- Wishlist Items: Access through wishlist ownership/visibility
CREATE POLICY wishlist_items_customer_policy ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (
      SELECT id FROM wishlists 
      WHERE customer_id = current_setting('app.current_user_id')::uuid 
        OR is_public = true
    )
  );

-- =====================================================
-- DONE
-- =====================================================
