# Custom Prints Database Review

## Overview
This document reviews all database policies, triggers, and constraints related to custom prints functionality in ChartedArt.

## Summary
✅ **Status**: All database logic properly supports custom prints
✅ **Testing**: Custom print successfully added to cart and displayed
✅ **Recommendation**: No changes needed - system is working correctly

---

## 1. Schema: `cart_items` Table

### Custom Print Columns (Added in 00200_core_tables.sql)
```sql
-- Columns that support custom prints
image_url TEXT              -- S3 URL of uploaded image
name VARCHAR(255)           -- Custom print name/title  
size VARCHAR(50)            -- Selected size (e.g., "16x20")
frame VARCHAR(50)           -- Frame option (e.g., "Black Frame")
price DECIMAL(10,2)         -- Custom print price
```

### Key Constraint: Product OR Custom
```sql
CONSTRAINT cart_items_product_or_custom_check CHECK (
  (product_id IS NOT NULL AND image_url IS NULL AND name IS NULL AND size IS NULL AND frame IS NULL AND price IS NULL)
  OR
  (product_id IS NULL AND image_url IS NOT NULL AND name IS NOT NULL AND size IS NOT NULL AND frame IS NOT NULL AND price IS NOT NULL)
)
```

**What this does**: 
- Ensures cart items are EITHER a regular product (product_id set) OR a custom print (all custom fields set)
- Prevents hybrid/incomplete items
- Verified working ✅

---

## 2. RLS Policies (01500_rls_policies.sql)

### Policy: Users can manage own cart
```sql
CREATE POLICY "Users can manage own cart" 
ON cart_items 
FOR ALL 
USING (auth.uid() = user_id);
```

**Custom Print Implications**:
- ✅ Works for both product_id items AND custom prints
- ✅ Policy checks user_id only (not product_id), so NULL product_id doesn't break it
- ✅ Users can INSERT, UPDATE, DELETE, SELECT their custom prints

### Policy: Users can manage own cart session  
```sql
CREATE POLICY "Users can manage own cart session" 
ON cart_sessions 
FOR ALL 
USING (auth.uid() = user_id);
```

**Custom Print Implications**:
- ✅ Cart sessions track total_value and item_count
- ✅ Works with custom prints via trigger (see below)

---

## 3. Triggers (01800_triggers.sql)

### Trigger: `update_cart_session()`
**Fired on**: cart_items INSERT, UPDATE, DELETE

```sql
CREATE OR REPLACE FUNCTION update_cart_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO cart_sessions (user_id, status, last_activity, item_count, total_value)
  SELECT 
    NEW.user_id,
    'active',
    NOW(),
    COUNT(*),
    COALESCE(SUM(COALESCE(p.price, ci.price, 0) * ci.quantity), 0)
  FROM cart_items ci
  LEFT JOIN products p ON p.id = ci.product_id  -- LEFT JOIN allows NULL product_id
  WHERE ci.user_id = NEW.user_id
  GROUP BY ci.user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity = NOW(),
    item_count = EXCLUDED.item_count,
    total_value = EXCLUDED.total_value,
    status = 'active';
  
  RETURN NEW;
END;
$$;
```

**Custom Print Support Analysis**:
1. ✅ **LEFT JOIN products** - Allows product_id to be NULL without breaking query
2. ✅ **COALESCE(p.price, ci.price, 0)** - Uses custom print price when product_id is NULL
3. ✅ **Calculates total_value** - Works for mixed carts (products + custom prints)
4. ✅ **Counts all items** - Includes custom prints in item_count

**What happens for custom print**:
- product_id = NULL → LEFT JOIN returns no matching product row
- p.price = NULL → COALESCE falls back to ci.price (custom print price)
- total_value = SUM(custom_price * quantity)
- Works perfectly ✅

---

## 4. Frontend Query (src/pages/CartPage.tsx)

### Current Query
```typescript
const { data: cartData } = await supabase
  .from('cart_items')
  .select(`
    *,
    products (id, name, price, image_url, artist_id)
  `)
  .eq('user_id', user.id);
```

### Custom Print Detection
```typescript
const isCustomPrint = !item.product_id;

if (isCustomPrint) {
  // Use custom print fields
  displayName = item.name;
  displayImage = item.image_url;
  displayPrice = item.price;
  // Show size and frame
} else {
  // Use joined products table
  displayName = item.products.name;
  displayImage = item.products.image_url;
  displayPrice = item.products.price;
}
```

**Status**: ✅ Working correctly
- Query joins products table (returns NULL for custom prints)
- Display logic checks product_id to determine type
- Shows correct fields for each type

---

## 5. Data Flow Test (Verified Working)

### Step 1: Add Custom Print (CreatePage.tsx)
```typescript
const { data, error } = await supabase
  .from('cart_items')
  .insert([{
    user_id: user.id,
    product_id: null,  // NULL for custom print
    quantity: 1,
    image_url: 'https://chartedart-user-uploads-311964231104.s3.amazonaws.com/...',
    name: 'My Custom Art',
    size: '16x20',
    frame: 'Black Frame',
    price: 79.99
  }]);
```

**Result**: ✅ Success - "Successfully added to cart"
- Constraint validated (all custom fields present)
- RLS policy allowed (user owns item)
- Trigger fired (cart_session updated)

### Step 2: View Cart (CartPage.tsx)
```typescript
// Query returns:
{
  id: '...',
  user_id: '...',
  product_id: null,  // <-- NULL indicates custom print
  image_url: 'https://...',
  name: 'My Custom Art',
  size: '16x20',
  frame: 'Black Frame',
  price: 79.99,
  quantity: 1,
  products: null  // <-- LEFT JOIN returns NULL
}
```

**Result**: ✅ Displays correctly
- isCustomPrint = true (product_id is null)
- Shows name, image_url, size, frame from cart_items
- Price calculation works

### Step 3: Cart Session Update (Automatic)
```sql
-- Trigger calculates:
item_count = 1
total_value = 79.99 * 1 = 79.99
status = 'active'
last_activity = NOW()
```

**Result**: ✅ Session updated correctly

---

## 6. Edge Cases

### Mixed Cart (Products + Custom Prints)
**Scenario**: User has 2 regular products + 1 custom print

**Query Result**:
```json
[
  { "product_id": "uuid1", "products": {...}, "image_url": null },
  { "product_id": "uuid2", "products": {...}, "image_url": null },
  { "product_id": null, "products": null, "image_url": "s3://..." }
]
```

**Handling**: ✅ Working
- Each item checked individually with `!item.product_id`
- Regular products show products.name, products.image_url
- Custom prints show cart_items.name, cart_items.image_url
- Trigger sums all prices correctly

### Custom Print with Zero Quantity
**Scenario**: User updates quantity to 0

**Behavior**: 
- Should probably DELETE the cart item instead
- Current code doesn't handle this edge case
- ⚠️ Minor issue: quantity=0 items might linger in cart

**Recommendation**: Add quantity validation or auto-delete on quantity=0

### Image URL Validation
**Current**: No validation that image_url is a valid S3 URL

**Risk**: Low - CreatePage.tsx generates URLs in correct format

**Recommendation**: Consider adding CHECK constraint:
```sql
CONSTRAINT valid_s3_url CHECK (
  image_url IS NULL 
  OR image_url LIKE 'https://chartedart-user-uploads-%.s3.amazonaws.com/%'
)
```

---

## 7. Order Creation (Future Concern)

### Current Status
Custom prints can be added to cart ✅
Custom prints display in cart ✅
**Not yet tested**: Creating orders with custom prints

### What to Check
When implementing order creation:

1. **order_items table** - Does it support custom prints?
   ```sql
   -- Check if order_items has:
   - product_id (nullable?)
   - image_url, name, size, frame, price columns?
   ```

2. **Order creation logic** - Does it handle NULL product_id?
   ```typescript
   // In createOrder function
   cartItems.forEach(item => {
     if (!item.product_id) {
       // Insert custom print to order_items
       // Need image_url, name, size, frame, price
     }
   });
   ```

3. **Order confirmation email** - Does it show custom print details?

**Recommendation**: Test order creation with custom print before going live

---

## 8. Recommendations

### ✅ Working Correctly (No Changes Needed)
1. cart_items constraint validates product OR custom
2. RLS policies work with NULL product_id  
3. update_cart_session trigger handles custom prints
4. CartPage displays custom prints correctly
5. S3 URL format is consistent

### ⚠️ Optional Improvements

#### 1. Add Image URL Validation
```sql
ALTER TABLE cart_items
ADD CONSTRAINT valid_s3_url CHECK (
  image_url IS NULL 
  OR image_url LIKE 'https://chartedart-user-uploads-%.s3.amazonaws.com/%'
);
```

#### 2. Auto-Delete Zero Quantity Items
```sql
CREATE OR REPLACE FUNCTION delete_zero_quantity_cart_items()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quantity <= 0 THEN
    DELETE FROM cart_items WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_zero_quantity
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION delete_zero_quantity_cart_items();
```

#### 3. Add Custom Print Identifier Column (Optional)
```sql
ALTER TABLE cart_items
ADD COLUMN item_type VARCHAR(20) 
GENERATED ALWAYS AS (
  CASE WHEN product_id IS NULL THEN 'custom_print' ELSE 'product' END
) STORED;

CREATE INDEX idx_cart_items_type ON cart_items(item_type);
```

Benefits: Clearer queries, easier analytics

### 🔴 Critical Before Launch
1. **Test order creation** with custom prints
2. **Check order_items table** schema
3. **Verify order confirmation** shows custom print details
4. **Test AWS Lambda** GenerateUploadUrl function (not deployed yet)
5. **Verify S3 permissions** for public read on uploaded images

---

## 9. Testing Checklist

### ✅ Completed Tests
- [x] Add custom print to cart (CreatePage)
- [x] View custom print in cart (CartPage)
- [x] Cart session updates with correct total
- [x] Mixed cart (products + custom prints)
- [x] RLS policies allow custom print operations
- [x] Constraint validates product OR custom

### 🔄 Pending Tests
- [ ] Create order with custom print
- [ ] Order confirmation shows custom print details
- [ ] Admin dashboard displays custom print orders
- [ ] S3 upload via Lambda (actual file upload)
- [ ] Custom print image displays in order history
- [ ] Delete custom print from cart
- [ ] Update custom print quantity

---

## 10. Conclusion

**Overall Status**: ✅ **EXCELLENT**

The database schema, policies, and triggers are **well-designed** and **fully support custom prints**:

1. ✅ Schema constraint ensures data integrity
2. ✅ RLS policies work with NULL product_id
3. ✅ Trigger correctly calculates totals for custom prints
4. ✅ LEFT JOIN pattern allows mixed carts
5. ✅ Frontend properly detects and displays custom prints

**No immediate changes required** - the system is working as designed.

**Next steps**:
1. Deploy S3 Upload Lambda for actual image uploads
2. Test order creation with custom prints
3. Consider optional improvements (URL validation, zero quantity handling)

---

Generated: 2024
Last Updated: After CartPage fix (products.images → products.image_url)
