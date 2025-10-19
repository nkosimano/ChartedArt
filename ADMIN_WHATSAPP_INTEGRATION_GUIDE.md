# Admin Dashboard & WhatsApp Checkout Integration Guide

## Overview
This guide explains how to integrate your ChartedArt admin dashboard with your existing system and set up WhatsApp checkout for seamless order management.

---

## Part 1: Admin Dashboard Integration

### Current Admin System (Already in Place)

Your ChartedArt project has a **fully built admin dashboard** ready to use:

#### 1. **Admin Routes** (src/App.tsx)
```typescript
// Admin routes at /admin/*
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="orders" element={<AdminOrders />} />
  <Route path="products" element={<AdminProducts />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>
```

#### 2. **Admin Dashboard Pages**
Located in `src/components/admin/`:
- **AdminDashboard.tsx** - Overview with metrics
- **AdminOrders.tsx** - Order management
- **AdminProducts.tsx** - Product/inventory management
- **AdminUsers.tsx** - User management
- **AdminAnalytics.tsx** - Sales analytics
- **AdminSettings.tsx** - System configuration

#### 3. **Database Tables**
```sql
-- Admin users table (supabase/migrations/00200_core_tables.sql)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'support')),
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### How to Access Admin Dashboard

#### Step 1: Make Yourself Admin

Run this SQL in your Supabase SQL Editor:

```sql
-- Replace 'YOUR_EMAIL@example.com' with your actual email
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'super_admin'::VARCHAR(50),
  true,
  '["view_orders", "manage_orders", "view_products", "manage_products", "view_users", "manage_users", "view_analytics", "manage_settings"]'::JSONB
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin',
    is_active = true,
    permissions = '["view_orders", "manage_orders", "view_products", "manage_products", "view_users", "manage_users", "view_analytics", "manage_settings"]'::JSONB;
```

**Verify it worked:**
```sql
SELECT 
  au.role,
  au.is_active,
  au.permissions,
  u.email
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'YOUR_EMAIL@example.com';
```

#### Step 2: Access the Dashboard

1. Deploy your app to Amplify (already done)
2. Visit: `https://main.d34w69gsv9iyzb.amplifyapp.com/admin`
3. Login with your admin email
4. You'll see the admin dashboard

---

### Admin Dashboard Features

#### 1. **Order Management** (`/admin/orders`)
- View all orders (pending, processing, shipped, delivered)
- Update order status
- View customer details
- Track shipping
- **Supports custom prints** (shows image_url, name, size, frame)

#### 2. **Product Management** (`/admin/products`)
- Add/edit/delete products
- Manage inventory
- Set prices
- Upload product images

#### 3. **User Management** (`/admin/users`)
- View all customers
- See order history
- Manage user roles

#### 4. **Analytics** (`/admin/analytics`)
- Sales metrics
- Revenue tracking
- Popular products
- Customer insights

#### 5. **Settings** (`/admin/settings`)
- System configuration
- Email templates
- Shipping settings

---

### Integrate with External Admin System

If you have an **existing admin system** you want to connect:

#### Option A: API Integration

Use the backend API to fetch data:

```javascript
// In your external admin system
const API_URL = 'https://mgtgfkocy1.execute-api.us-east-1.amazonaws.com/Prod';

// Get all orders
async function getOrders() {
  const response = await fetch(`${API_URL}/admin/orders`, {
    headers: {
      'Authorization': `Bearer ${ADMIN_JWT_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${ADMIN_JWT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: newStatus })
  });
  return response.json();
}
```

#### Option B: Direct Database Access

Connect your external system directly to Supabase:

```javascript
// In your external admin system
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uuqfobbkjhrpylygauwf.supabase.co',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Get from Supabase dashboard
);

// Query orders
const { data: orders } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      *,
      products (name, price)
    )
  `)
  .order('created_at', { ascending: false });

// Update order
await supabase
  .from('orders')
  .update({ status: 'shipped' })
  .eq('id', orderId);
```

#### Option C: Webhook Integration

Set up webhooks to notify your external system:

```sql
-- Create webhook function in Supabase
CREATE OR REPLACE FUNCTION notify_external_system()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call external API when order is created/updated
  PERFORM net.http_post(
    url := 'https://your-external-system.com/webhook/orders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'event', TG_OP,
      'order_id', NEW.id,
      'status', NEW.status,
      'total', NEW.total,
      'customer_email', NEW.email
    )::text
  );
  RETURN NEW;
END;
$$;

-- Trigger on order changes
CREATE TRIGGER order_webhook
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_external_system();
```

---

## Part 2: WhatsApp Checkout Integration

### Architecture Options

#### Option 1: WhatsApp Business API (Recommended)

**Best for**: Professional businesses with high volume

**Features**:
- Official WhatsApp Business API
- Automated messages
- Rich media (images, buttons, catalogs)
- Payment integration
- Message templates

**Setup**:

1. **Sign up for WhatsApp Business API**
   - Go to: https://business.whatsapp.com/
   - Apply for API access (or use providers like Twilio, MessageBird)

2. **Add WhatsApp Button to Cart/Checkout**

Create: `src/components/WhatsAppCheckout.tsx`

```typescript
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppCheckoutProps {
  cartItems: Array<{
    name: string;
    size?: string;
    frame?: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  total: number;
}

export default function WhatsAppCheckout({ cartItems, total }: WhatsAppCheckoutProps) {
  const WHATSAPP_NUMBER = '+27XXXXXXXXXX'; // Your WhatsApp Business number
  
  const formatOrderMessage = () => {
    let message = '🛍️ *New Order from ChartedArt*\n\n';
    
    cartItems.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;
      if (item.size) message += `   Size: ${item.size}\n`;
      if (item.frame) message += `   Frame: ${item.frame}\n`;
      message += `   Quantity: ${item.quantity}\n`;
      message += `   Price: R${(item.price * item.quantity).toFixed(2)}\n\n`;
    });
    
    message += `*Total: R${total.toFixed(2)}*\n\n`;
    message += '📍 Please provide your delivery address to complete the order.';
    
    return encodeURIComponent(message);
  };
  
  const handleWhatsAppCheckout = () => {
    const message = formatOrderMessage();
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };
  
  return (
    <button
      onClick={handleWhatsAppCheckout}
      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 
                 flex items-center justify-center gap-2 font-semibold transition-colors"
    >
      <MessageCircle className="w-5 h-5" />
      Continue on WhatsApp
    </button>
  );
}
```

3. **Add to CartPage.tsx**

```typescript
import WhatsAppCheckout from '@/components/WhatsAppCheckout';

// In CartPage component, add below "Proceed to Checkout" button:
<WhatsAppCheckout 
  cartItems={items.map(item => ({
    name: item.product_id ? item.products?.name : item.name,
    size: item.product_id ? undefined : item.size,
    frame: item.product_id ? undefined : item.frame,
    quantity: item.quantity || 1,
    price: item.price,
    image_url: item.image_url || item.products?.image_url
  }))}
  total={totalAmount}
/>
```

---

#### Option 2: WhatsApp Cloud API with Backend

**Best for**: Full automation with order tracking

**Setup**:

1. **Add Lambda Function** to `backend/template.yaml`:

```yaml
  SendWhatsAppOrderFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: functions/send-whatsapp-order/
      Handler: index.handler
      Runtime: nodejs18.x
      Environment:
        Variables:
          WHATSAPP_API_TOKEN: !Ref WhatsAppAPIToken
          WHATSAPP_PHONE_ID: !Ref WhatsAppPhoneID
          SUPABASE_URL: !Ref SupabaseUrl
          SUPABASE_KEY: !Ref SupabaseServiceKey
      Events:
        SendOrder:
          Type: Api
          Properties:
            RestApiId: !Ref ChartedArtAPI
            Path: /whatsapp/send-order
            Method: post
```

2. **Create Lambda Handler**: `backend/functions/send-whatsapp-order/index.js`

```javascript
const https = require('https');

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

exports.handler = async (event) => {
  try {
    const { orderId, customerPhone, items, total } = JSON.parse(event.body);
    
    // Format message
    let message = '🎨 *ChartedArt Order Confirmation*\n\n';
    message += `Order ID: ${orderId}\n\n`;
    
    items.forEach((item, i) => {
      message += `${i + 1}. ${item.name}\n`;
      if (item.size) message += `   Size: ${item.size}\n`;
      message += `   Qty: ${item.quantity} × R${item.price}\n\n`;
    });
    
    message += `*Total: R${total}*\n\n`;
    message += '✅ Your order has been received!\n';
    message += 'We will contact you shortly to confirm delivery details.';
    
    // Send via WhatsApp Cloud API
    const response = await sendWhatsAppMessage(customerPhone, message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        messageId: response.messages[0].id 
      })
    };
    
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function sendWhatsAppMessage(to, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    });
    
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
```

3. **Update Frontend to Call WhatsApp API**

In `CheckoutPage.tsx`, after order creation:

```typescript
// After successful order creation
const response = await api.orders.create(orderData);

// Send WhatsApp notification
await fetch(`${API_BASE_URL}/whatsapp/send-order`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    orderId: response.order.id,
    customerPhone: '+27' + phone, // Get from user input
    items: cartItems,
    total: totalAmount
  })
});
```

---

#### Option 3: Simple WhatsApp Link (Quick Start)

**Best for**: Getting started quickly without API

**Implementation**:

Add this to `CartPage.tsx`:

```typescript
const handleWhatsAppCheckout = () => {
  const BUSINESS_WHATSAPP = '+27XXXXXXXXXX'; // Replace with your number
  
  let message = '🛍️ I want to place an order:\n\n';
  
  items.forEach((item, i) => {
    const name = item.product_id ? item.products?.name : item.name;
    const size = item.product_id ? 'Standard' : item.size;
    const frame = item.product_id ? 'None' : item.frame;
    
    message += `${i + 1}. ${name}\n`;
    message += `   Size: ${size}, Frame: ${frame}\n`;
    message += `   Qty: ${item.quantity} × R${item.price.toFixed(2)}\n\n`;
  });
  
  message += `Total: R${totalAmount.toFixed(2)}\n\n`;
  message += 'Please confirm and provide delivery address.';
  
  const url = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

// Add button in render:
<button
  onClick={handleWhatsAppCheckout}
  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 
             flex items-center justify-center gap-2 mt-4"
>
  <MessageCircle className="w-5 h-5" />
  Order via WhatsApp
</button>
```

---

### WhatsApp Order Flow

**Customer Side:**
1. Customer adds items to cart
2. Clicks "Order via WhatsApp"
3. WhatsApp opens with pre-filled message
4. Customer sends message to your business
5. Provides delivery address in chat
6. Receives order confirmation

**Admin Side:**
1. Receive WhatsApp message with order details
2. Reply to confirm order
3. Update order status in admin dashboard
4. Send shipping updates via WhatsApp
5. Customer receives delivery notification

---

## Part 3: Unified Workflow

### Complete Order Flow (Web + WhatsApp + Admin)

```
┌─────────────────┐
│  Customer Cart  │
│  (Web/Mobile)   │
└────────┬────────┘
         │
         ├──Option 1──> Regular Checkout (Cash/Card)
         │                     │
         │                     ▼
         │              ┌──────────────┐
         │              │   Backend    │
         │              │  Creates     │
         │              │   Order      │
         │              └──────┬───────┘
         │                     │
         │                     ▼
         │              ┌──────────────┐
         │              │  Supabase    │
         │              │   Orders     │
         │              │   Table      │
         │              └──────┬───────┘
         │                     │
         │                     ▼
         │              ┌──────────────┐
         │              │    Admin     │
         │              │  Dashboard   │
         │              │  Shows Order │
         │              └──────────────┘
         │
         └──Option 2──> WhatsApp Checkout
                              │
                              ▼
                       ┌─────────────┐
                       │  WhatsApp   │
                       │  Business   │
                       │   Receives  │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Admin     │
                       │  Manually   │
                       │  Creates    │
                       │   Order     │
                       └──────┬──────┘
                              │
                              ▼
                       ┌─────────────┐
                       │   Updates   │
                       │  Customer   │
                       │  via WhatsApp│
                       └─────────────┘
```

---

## Part 4: Implementation Steps

### Step 1: Enable Admin Dashboard (5 minutes)

```sql
-- Run in Supabase SQL Editor
INSERT INTO admin_users (user_id, role, is_active, permissions)
SELECT 
  id,
  'super_admin'::VARCHAR(50),
  true,
  '["view_orders", "manage_orders", "view_products", "manage_products"]'::JSONB
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 2: Add WhatsApp Button (10 minutes)

1. Create `src/components/WhatsAppCheckout.tsx` (code above)
2. Import in `CartPage.tsx`
3. Add button below cart items
4. Replace `+27XXXXXXXXXX` with your WhatsApp number

### Step 3: Deploy (2 minutes)

```bash
npm run build
git add .
git commit -m "Add WhatsApp checkout and fix CheckoutPage for custom prints"
git push
```

### Step 4: Test

1. Add item to cart
2. Click "Order via WhatsApp"
3. Verify message opens in WhatsApp
4. Confirm order details are correct

---

## Part 5: Advanced Features (Optional)

### Feature 1: Auto-Create Orders from WhatsApp

Set up webhook to automatically create orders:

```javascript
// backend/functions/whatsapp-webhook/index.js
exports.handler = async (event) => {
  const { messages } = JSON.parse(event.body);
  
  for (const message of messages) {
    if (message.type === 'text') {
      // Parse order from message
      const orderDetails = parseOrderMessage(message.text.body);
      
      // Create order in Supabase
      await createOrder(orderDetails);
      
      // Send confirmation
      await sendWhatsAppMessage(message.from, 'Order received! Order ID: ' + orderId);
    }
  }
  
  return { statusCode: 200 };
};
```

### Feature 2: Order Status Updates via WhatsApp

```typescript
// In AdminOrders.tsx, when status changes:
const handleStatusChange = async (orderId: string, newStatus: string) => {
  // Update in database
  await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);
  
  // Send WhatsApp notification
  const order = await getOrder(orderId);
  await sendWhatsAppMessage(
    order.customer_phone,
    `Your order ${orderId} is now: ${newStatus} 📦`
  );
};
```

### Feature 3: Custom Print Preview in WhatsApp

Send custom print images via WhatsApp:

```javascript
// Send image message
async function sendCustomPrintPreview(phone, imageUrl, caption) {
  await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption
      }
    })
  });
}
```

---

## Summary

### Admin Dashboard
- ✅ Already built and ready
- ✅ Access at `/admin` after making yourself admin
- ✅ Manage orders, products, users, analytics

### WhatsApp Integration
- 🚀 **Quick Start**: Add WhatsApp link button (15 mins)
- 🔧 **Medium**: WhatsApp Business API with webhooks
- ⚡ **Advanced**: Full automation with Cloud API

### Next Steps
1. Make yourself admin (SQL query above)
2. Test admin dashboard
3. Add WhatsApp button
4. Test order flow
5. Deploy

---

**Need Help?**
- Admin not working? Check `admin_users` table
- WhatsApp issues? Verify phone number format
- Custom prints? They're already supported!

