# ChartedArt - Visual Codebase Map

**Quick Reference Guide**

---

## 🗂️ Directory Structure Overview

```
ChartedArt/
│
├── 📱 MOBILE APP (mobile/)
│   ├── App.js                          # Mobile entry point
│   ├── src/
│   │   ├── screens/                    # 15 screens (auth, home, create, cart, checkout, etc.)
│   │   ├── navigation/                 # AuthStack, MainTabs
│   │   ├── contexts/                   # AuthContext
│   │   ├── hooks/                      # useCart, useImagePicker, useBiometricAuth, etc.
│   │   ├── lib/                        # API client, Supabase client, offline manager
│   │   ├── components/common/          # Button, Card, LoadingSpinner
│   │   ├── constants/                  # colors, spacing, typography
│   │   └── config/                     # app.ts, links.ts
│   ├── ios/ChartedArtWidget/           # iOS widget
│   └── __tests__/                      # Jest tests
│
├── 🌐 WEB APP (src/)
│   ├── main.tsx                        # Web entry point
│   ├── App.tsx                         # Root component with routing
│   ├── pages/                          # 20+ pages (Home, Create, Cart, Checkout, Admin, etc.)
│   ├── components/
│   │   ├── artist/                     # 6 artist portal components
│   │   ├── shop/                       # 6 shop components
│   │   ├── admin/                      # 4 admin components
│   │   ├── payments/                   # Payment components
│   │   ├── ui/                         # Shadcn/ui components
│   │   └── animations/                 # Framer Motion variants
│   ├── hooks/                          # 9 custom hooks (useAuth, useCart, useNotifications, etc.)
│   ├── contexts/                       # CartContext
│   ├── lib/
│   │   ├── supabase/                   # Supabase client & types
│   │   ├── api/                        # API client for Lambda functions
│   │   └── utils/                      # Utilities (file-upload, etc.)
│   ├── layouts/                        # RootLayout
│   └── utils/                          # imageUpload utilities
│
├── ☁️ BACKEND (backend/)
│   ├── template.yaml                   # AWS SAM infrastructure
│   ├── src/
│   │   ├── handlers/                   # 8 Lambda functions
│   │   │   ├── generate-upload-url.js  # S3 presigned URLs
│   │   │   ├── create-order.js         # Order creation
│   │   │   ├── create-payment-intent.js # Stripe payments
│   │   │   ├── stripe-webhook.js       # Stripe webhooks
│   │   │   ├── get-orders.js           # Admin order fetching
│   │   │   ├── update-order-status.js  # Admin order updates
│   │   │   ├── register-push-token.js  # Mobile push tokens
│   │   │   └── antivirus-scan.js       # File scanning (placeholder)
│   │   └── utils/
│   │       └── auth.js                 # JWT verification, admin checks
│   └── package.json
│
├── 🗄️ DATABASE (database/ & supabase/)
│   ├── database/
│   │   ├── admin_dashboard_functions.sql
│   │   ├── artist_portal_schema.sql
│   │   ├── notifications_schema.sql
│   │   ├── recommendation_functions.sql
│   │   ├── social_features_schema.sql
│   │   └── migrations/
│   └── supabase/
│       ├── migrations/                 # 4 migration files
│       ├── functions/                  # Edge functions (payment, messages)
│       └── config.toml
│
├── ⚙️ CONFIGURATION
│   ├── .env.example                    # Environment template
│   ├── package.json                    # Web dependencies
│   ├── vite.config.ts                  # Vite bundler config
│   ├── tsconfig.json                   # TypeScript config
│   ├── tailwind.config.ts              # TailwindCSS config
│   ├── components.json                 # Shadcn/ui config
│   ├── buildspec.yml                   # AWS CodeBuild
│   └── index.html                      # HTML entry point
│
├── 📚 DOCUMENTATION
│   ├── WARP.md                         # Developer guide
│   ├── PROJECT_COMPLETE.md             # Project overview
│   ├── DEPLOYMENT.md                   # Deployment guide
│   ├── SETUP_GUIDE.md                  # Setup instructions
│   ├── MOBILE_FEATURES_SUMMARY.md      # Mobile features
│   └── [10+ other docs]
│
└── 🧪 TESTING & UTILITIES
    ├── test-admin.js                   # Admin testing script
    ├── dashboard_test_queries.sql      # SQL test queries
    └── mobile/__tests__/               # Mobile tests
```

---

## 🔄 User Workflow Mapping

### 1️⃣ **User Registration & Login**
```
┌─────────────┐
│ LoginPage   │ ──→ Supabase Auth ──→ Profile Creation ──→ Account Page
└─────────────┘
     ↓
┌─────────────┐
│ SignUpPage  │ ──→ Email Verification ──→ Login
└─────────────┘
```
**Files Involved:**
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/SignUpPage.tsx`
- `src/lib/supabase/client.ts`

---

### 2️⃣ **Create Custom Print** (Primary Revenue)
```
┌─────────────┐
│ CreatePage  │ ──→ Upload Image ──→ S3 ──→ Add to Cart ──→ CartContext
└─────────────┘
     ↓
┌──────────────────────┐
│ generate-upload-url  │ (Lambda)
└──────────────────────┘
     ↓
┌──────────────────────┐
│ antivirus-scan       │ (Lambda)
└──────────────────────┘
```
**Files Involved:**
- `src/pages/CreatePage.tsx`
- `src/lib/utils/file-upload.ts`
- `backend/src/handlers/generate-upload-url.js`
- `backend/src/handlers/antivirus-scan.js`
- `src/contexts/CartContext.tsx`

---

### 3️⃣ **Purchase Flow** (Critical Revenue)
```
┌──────────┐     ┌──────────────┐     ┌─────────────────────┐
│ CartPage │ ──→ │ CheckoutPage │ ──→ │ Stripe Payment Form │
└──────────┘     └──────────────┘     └─────────────────────┘
                        ↓
              ┌──────────────────────┐
              │ create-payment-intent│ (Lambda)
              └──────────────────────┘
                        ↓
              ┌──────────────────────┐
              │ Stripe Processing    │
              └──────────────────────┘
                        ↓
              ┌──────────────────────┐
              │ stripe-webhook       │ (Lambda) ──→ Update Order Status
              └──────────────────────┘
                        ↓
              ┌──────────────────────┐
              │ OrderConfirmationPage│
              └──────────────────────┘
```
**Files Involved:**
- `src/pages/CartPage.tsx`
- `src/pages/CheckoutPage.tsx`
- `src/components/PaymentForm.tsx`
- `backend/src/handlers/create-payment-intent.js`
- `backend/src/handlers/create-order.js`
- `backend/src/handlers/stripe-webhook.js`
- `src/pages/OrderConfirmationPage.tsx`

---

### 4️⃣ **Admin Order Management**
```
┌──────────────────┐
│ AdminDashboard   │ ──→ View Metrics
└──────────────────┘
         ↓
┌──────────────────┐
│ AdminOrdersPage  │ ──→ get-orders (Lambda) ──→ Display Orders
└──────────────────┘
         ↓
┌──────────────────┐
│ Update Status    │ ──→ update-order-status (Lambda) ──→ Notification
└──────────────────┘
```
**Files Involved:**
- `src/pages/AdminDashboardPage.tsx`
- `src/pages/AdminOrdersPage.tsx`
- `src/components/admin/SalesDashboard.tsx`
- `backend/src/handlers/get-orders.js`
- `backend/src/handlers/update-order-status.js`

---

### 5️⃣ **Artist Portal**
```
┌──────────────────┐
│ ArtistDashboard  │
└──────────────────┘
    ├─→ Portfolio Manager ──→ Upload Artwork
    ├─→ Commission Tracker ──→ Manage Requests
    ├─→ Sales Analytics   ──→ View Performance
    ├─→ Inventory Tracker ──→ Manage Stock
    └─→ Payout Manager    ──→ Request Payouts
```
**Files Involved:**
- `src/components/artist/ArtistDashboard.tsx`
- `src/components/artist/ArtistPortfolioManager.tsx`
- `src/components/artist/CommissionTracker.tsx`
- `src/components/artist/SalesAnalytics.tsx`
- `src/components/artist/InventoryTracker.tsx`
- `src/components/artist/PayoutManager.tsx`

---

### 6️⃣ **Mobile App Flow**
```
┌──────────────┐
│ App.js       │ ──→ AuthProvider ──→ Check Auth State
└──────────────┘
    ├─→ Not Authenticated ──→ AuthStack (Login/SignUp)
    └─→ Authenticated ──→ MainTabs
                            ├─→ Home
                            ├─→ Create ──→ Checkout
                            ├─→ Cart ──→ Checkout
                            └─→ Account ──→ Gallery/Orders/Profile
```
**Files Involved:**
- `mobile/App.js`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/navigation/AuthStack.tsx`
- `mobile/src/navigation/MainTabs.tsx`
- All screens in `mobile/src/screens/`

---

## 🔑 Critical Files (Cannot Delete)

### Web App
- ✅ `src/main.tsx` - Entry point
- ✅ `src/App.tsx` - Routing
- ✅ `src/pages/CreatePage.tsx` - Primary revenue feature
- ✅ `src/pages/CheckoutPage.tsx` - Payment processing
- ✅ `src/components/PaymentForm.tsx` - Stripe integration
- ✅ `src/lib/supabase/client.ts` - Database connection
- ✅ `src/lib/api/client.ts` - Backend communication
- ✅ `src/contexts/CartContext.tsx` - Cart state

### Mobile App
- ✅ `mobile/App.js` - Entry point
- ✅ `mobile/src/contexts/AuthContext.tsx` - Auth state
- ✅ `mobile/src/lib/supabase/client.ts` - Database connection
- ✅ `mobile/src/lib/api/client.ts` - Backend communication

### Backend
- ✅ `backend/template.yaml` - Infrastructure
- ✅ `backend/src/handlers/create-payment-intent.js` - Payments
- ✅ `backend/src/handlers/stripe-webhook.js` - Payment confirmation
- ✅ `backend/src/handlers/generate-upload-url.js` - File uploads
- ✅ `backend/src/utils/auth.js` - Security

---

## ⚠️ Files to Review/Delete

### Orphaned (Next.js remnants - Project uses Vite)
- ❌ `next-env.d.ts`
- ❌ `src/pages/page.tsx`
- ❌ `src/pages/layout.tsx`
- ❌ `src/pages/globals.css`
- ❌ `src/pages/auth/login/page.tsx`
- ❌ `src/pages/auth/signup/page.tsx`
- ❌ `src/pages/create/page.tsx`

### Duplicates
- ❌ `lib/` (root) - Duplicate of `src/lib/`
- ❌ `tailwind.config.js` (if `.ts` version is active)

### Backups
- ❌ `CreatePage_clean.txt`
- ❌ `src/pages/CreatePage.tsx.backup`

---

## 📊 File Statistics

| Category | Count | Status |
|----------|-------|--------|
| **Web Pages** | 20+ | ✅ Active |
| **Web Components** | 40+ | ✅ Active |
| **Mobile Screens** | 15 | ✅ Active |
| **Lambda Functions** | 8 | ✅ Active |
| **Database Scripts** | 15+ | ✅ Active |
| **Config Files** | 20+ | ✅ Active |
| **Documentation** | 15+ | 📚 Reference |
| **Orphaned Files** | ~15 | ❌ Can Delete |
| **Total Files** | 263 | - |

---

**End of Visual Map**

