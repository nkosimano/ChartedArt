# ChartedArt - Complete File Checklist

**Quick Status Reference for All 263 Files**

Legend:
- ✅ Active & Essential
- 🔧 Active but needs attention
- 📚 Documentation
- 🧪 Testing/Development
- ⚠️ Review needed
- ❌ Orphaned/Can delete
- 📦 Build artifact

---

## Root Directory (37 files)

| File | Status | Notes |
|------|--------|-------|
| `.env` | ✅ | Git-ignored, required for local dev |
| `.env.example` | ✅ | Template for environment setup |
| `.eslintrc.json` | ✅ | Linting configuration |
| `.gitignore` | ✅ | Version control exclusions |
| `app.json` | ⚠️ | Check if duplicate of mobile/app.json |
| `buildspec.yml` | ✅ | AWS CodeBuild CI/CD |
| `BUTTON_FIXES_SUMMARY.md` | 📚 | Documentation |
| `complete_foundation_migration.sql` | ✅ | Database setup |
| `COMPLETION_SUMMARY.md` | 📚 | Documentation |
| `components.json` | ✅ | Shadcn/ui config |
| `CreatePage_clean.txt` | ❌ | Backup file - can delete |
| `dashboard_test_queries.sql` | 🧪 | Testing queries |
| `DEPLOYMENT.md` | 📚 | Documentation |
| `directus.config.js` | ⚠️ | Check if Directus is used |
| `ERROR_FIXES.md` | 📚 | Documentation |
| `file_list.txt` | 🧪 | Generated file list |
| `fix_database_functions.sql` | 🔧 | Database patches |
| `IMPLEMENTATION_SUMMARY.md` | 📚 | Documentation |
| `index.html` | ✅ | Web app entry HTML |
| `MIGRATION_STATUS.md` | 📚 | Documentation |
| `MOBILE_FEATURES_SUMMARY.md` | 📚 | Documentation |
| `next-env.d.ts` | ❌ | Next.js file - project uses Vite |
| `ORDER_WORKFLOW_GAP_ANALYSIS.md` | 📚 | Documentation |
| `package-lock.json` | ✅ | Dependency lock file |
| `package.json` | ✅ | Web app dependencies |
| `phase_0_foundation_manual.sql` | ✅ | Database setup |
| `PHASE_1_IMPLEMENTATION.md` | 📚 | Documentation |
| `postcss.config.js` | ✅ | CSS processing |
| `PROJECT_COMPLETE.md` | 📚 | Documentation |
| `SETUP_GUIDE.md` | 📚 | Documentation |
| `tailwind.config.js` | ⚠️ | Check if .ts version is used |
| `tailwind.config.ts` | ✅ | TailwindCSS config |
| `test-admin.js` | 🧪 | Admin testing script |
| `tsconfig.json` | ✅ | TypeScript config |
| `verify_and_setup_admin.sql` | ✅ | Admin setup |
| `vite.config.ts` | ✅ | Vite bundler config |
| `WARP.md` | 📚 | Developer guide |

---

## Web App - Pages (src/pages/) - 20 files

| File | Status | User Workflow |
|------|--------|---------------|
| `AccountPage.tsx` | ✅ | User account management |
| `AdminDashboardPage.tsx` | ✅ | Admin dashboard |
| `AdminMessagesPage.tsx` | ✅ | Admin message management |
| `AdminOrdersPage.tsx` | ✅ | Admin order management |
| `ArchivePage.tsx` | ✅ | Archived orders |
| `BlogPage.tsx` | 🔧 | Blog listing (check implementation) |
| `CartPage.tsx` | ✅ | Shopping cart |
| `CheckoutPage.tsx` | ✅ | Payment & checkout |
| `CreatePage.tsx` | ✅ | **PRIMARY REVENUE FEATURE** |
| `CreatePage.tsx.backup` | ❌ | Backup - can delete |
| `EventsPage.tsx` | 🔧 | Events listing (check implementation) |
| `FAQPage.tsx` | ✅ | FAQ page |
| `GalleryPage.tsx` | ✅ | User gallery |
| `globals.css` | ❌ | Next.js file - can delete |
| `HomePage.tsx` | ✅ | Landing page |
| `layout.tsx` | ❌ | Next.js file - can delete |
| `OrderConfirmationPage.tsx` | ✅ | Order confirmation |
| `OrdersPage.tsx` | ✅ | Order history |
| `page.tsx` | ❌ | Next.js file - can delete |
| `ShippingPage.tsx` | ✅ | Shipping info |

---

## Web App - Auth Pages (src/pages/auth/) - 5 files

| File | Status | User Workflow |
|------|--------|---------------|
| `LoginPage.tsx` | ✅ | User login |
| `SignUpPage.tsx` | ✅ | User registration |
| `login/page.tsx` | ❌ | Next.js duplicate - can delete |
| `signup/page.tsx` | ❌ | Next.js duplicate - can delete |
| `create/page.tsx` | ❌ | Next.js duplicate - can delete |

---

## Web App - Components (src/components/) - 40+ files

### Root Components (12 files)
| File | Status | Purpose |
|------|--------|---------|
| `AddressAutocomplete.tsx` | ✅ | Google Maps autocomplete |
| `ArtistDashboard.tsx` | ⚠️ | Check if duplicate of artist/ version |
| `AudioPlayer.tsx` | ⚠️ | Check if used |
| `BiometricSettings.tsx` | ✅ | Biometric auth settings |
| `CheckoutPage.tsx` | ⚠️ | Check if duplicate of pages/ version |
| `CommissionSystem.tsx` | ✅ | Commission management |
| `ContactDialog.tsx` | ✅ | Contact form modal |
| `index.ts` | ✅ | Barrel exports |
| `Map.tsx` | ✅ | Google Maps display |
| `MessageReplyDialog.tsx` | ✅ | Admin message replies |
| `PaymentForm.tsx` | ✅ | **CRITICAL - Stripe payment** |
| `ProductPage.tsx` | ⚠️ | Check if used |
| `ProtectedRoute.tsx` | ✅ | **CRITICAL - Auth guard** |

### Admin Components (4 files)
| File | Status | Purpose |
|------|--------|---------|
| `admin/CustomerManagement.tsx` | ✅ | Customer management |
| `admin/ProductManagement.tsx` | ✅ | Product CRUD |
| `admin/SalesDashboard.tsx` | ✅ | Sales analytics |
| `admin/SystemSettings.tsx` | ✅ | System configuration |

### Artist Components (7 files)
| File | Status | Purpose |
|------|--------|---------|
| `artist/ArtistDashboard.tsx` | ✅ | Artist portal main |
| `artist/ArtistPortfolioManager.tsx` | ✅ | Portfolio management |
| `artist/CommissionTracker.tsx` | ✅ | Commission tracking |
| `artist/index.ts` | ✅ | Barrel exports |
| `artist/InventoryTracker.tsx` | ✅ | Inventory management |
| `artist/PayoutManager.tsx` | ✅ | Payout requests |
| `artist/SalesAnalytics.tsx` | ✅ | Artist analytics |

### Shop Components (7 files)
| File | Status | Purpose |
|------|--------|---------|
| `shop/CheckoutProcess.tsx` | ✅ | Checkout flow |
| `shop/CommissionRequest.tsx` | ✅ | Commission requests |
| `shop/CustomerProfile.tsx` | ✅ | Customer profile |
| `shop/index.ts` | ✅ | Barrel exports |
| `shop/OrderDashboard.tsx` | ✅ | Order dashboard |
| `shop/ProductCatalog.tsx` | ✅ | Product browsing |
| `shop/ShoppingCart.tsx` | ✅ | Cart component |

### Other Components
| File | Status | Purpose |
|------|--------|---------|
| `animations/variants.ts` | ✅ | Framer Motion animations |
| `payments/EnhancedPaymentMethods.tsx` | ✅ | Payment methods |
| `ui/card.tsx` | ✅ | Shadcn/ui card |

---

## Web App - Hooks (src/hooks/) - 9 files

| File | Status | Purpose |
|------|--------|---------|
| `useAdminDashboard.ts` | ✅ | Admin data fetching |
| `useAnalytics.ts` | ✅ | User analytics |
| `useArtistPortal.ts` | ✅ | Artist data |
| `useBiometricAuth.ts` | ✅ | Biometric auth |
| `useNotifications.ts` | ✅ | Notification system |
| `usePWA.ts` | ✅ | PWA functionality |
| `useRecommendations.ts` | ✅ | Product recommendations |
| `useSmartSearch.ts` | ✅ | Search functionality |
| `useSocialFeatures.ts` | ✅ | Social features |

---

## Web App - Libraries (src/lib/) - 10 files

| File | Status | Purpose |
|------|--------|---------|
| `api/client.ts` | ✅ | **CRITICAL - Backend API** |
| `directus.ts` | ⚠️ | Check if Directus used |
| `inventory.ts` | ✅ | Inventory utilities |
| `stripe.ts` | ✅ | **CRITICAL - Stripe client** |
| `supabase/client.ts` | ✅ | **CRITICAL - Database** |
| `supabase/types.ts` | ✅ | Database types |
| `utils.ts` | ✅ | General utilities |
| `utils/file-upload.ts` | ✅ | **CRITICAL - File uploads** |

---

## Web App - Other (src/) - 8 files

| File | Status | Purpose |
|------|--------|---------|
| `App.tsx` | ✅ | **CRITICAL - Root component** |
| `contexts/CartContext.tsx` | ✅ | **CRITICAL - Cart state** |
| `data/mockData.ts` | 🧪 | Mock data |
| `index.css` | ✅ | Global styles |
| `layouts/RootLayout.tsx` | ✅ | Layout wrapper |
| `main.tsx` | ✅ | **CRITICAL - Entry point** |
| `netlify.toml` | ⚠️ | Check if Netlify used |
| `types/global.d.ts` | ✅ | Type definitions |
| `utils/imageUpload.ts` | ✅ | Image utilities |

---

## Web App - API Routes (src/api/) - 4 files

| File | Status | Purpose |
|------|--------|---------|
| `webauthn/authenticate/begin.ts` | ✅ | WebAuthn auth start |
| `webauthn/authenticate/finish.ts` | ✅ | WebAuthn auth complete |
| `webauthn/register/begin.ts` | ✅ | WebAuthn register start |
| `webauthn/register/finish.ts` | ✅ | WebAuthn register complete |

---

## Mobile App (mobile/) - 50+ files

### Core (5 files)
| File | Status | Purpose |
|------|--------|---------|
| `App.js` | ✅ | **CRITICAL - Mobile entry** |
| `app.json` | ✅ | Expo configuration |
| `babel.config.js` | ✅ | Babel config |
| `eas.json` | ✅ | EAS Build config |
| `index.ts` | ✅ | Expo entry point |
| `jest.setup.ts` | 🧪 | Jest config |
| `package.json` | ✅ | Dependencies |
| `tsconfig.json` | ✅ | TypeScript config |

### Screens (15 files)
| File | Status | User Workflow |
|------|--------|---------------|
| `screens/account/AccountScreen.tsx` | ✅ | Account management |
| `screens/account/EditProfileScreen.tsx` | ✅ | Profile editing |
| `screens/advisor/RoomAdvisorScreen.tsx` | ✅ | AI room advisor |
| `screens/ar/ARViewScreen.tsx` | ✅ | AR preview |
| `screens/auth/ForgotPasswordScreen.tsx` | ✅ | Password reset |
| `screens/auth/LoginScreen.tsx` | ✅ | Login |
| `screens/auth/SignUpScreen.tsx` | ✅ | Registration |
| `screens/cart/CartScreen.tsx` | ✅ | Shopping cart |
| `screens/checkout/CheckoutScreen.tsx` | ✅ | Checkout |
| `screens/checkout/EnhancedCheckoutScreen.tsx` | ✅ | Enhanced checkout |
| `screens/create/CreateScreen.tsx` | ✅ | Create prints |
| `screens/gallery/GalleryScreen.tsx` | ✅ | User gallery |
| `screens/home/HomeScreen.tsx` | ✅ | Home screen |
| `screens/orders/OrderConfirmationScreen.tsx` | ✅ | Order confirmation |
| `screens/orders/OrderDetailScreen.tsx` | ✅ | Order details |
| `screens/orders/OrderDetailScreenSimple.tsx` | ✅ | Simple order details |
| `screens/orders/OrderHistoryScreen.tsx` | ✅ | Order history |
| `screens/search/VisualSearchScreen.tsx` | ✅ | Visual search |
| `screens/support/SupportScreen.tsx` | ✅ | Support |

### Navigation (2 files)
| File | Status | Purpose |
|------|--------|---------|
| `navigation/AuthStack.tsx` | ✅ | Auth navigation |
| `navigation/MainTabs.tsx` | ✅ | Main tab navigation |

### Contexts, Hooks, Lib (15+ files)
| File | Status | Purpose |
|------|--------|---------|
| `contexts/AuthContext.tsx` | ✅ | **CRITICAL - Auth state** |
| `hooks/useBiometricAuth.ts` | ✅ | Biometric auth |
| `hooks/useCart.ts` | ✅ | Cart management |
| `hooks/useImagePicker.ts` | ✅ | Image selection |
| `hooks/useImageUpload.ts` | ✅ | Image upload |
| `hooks/useOffline.ts` | ✅ | Offline mode |
| `hooks/usePushNotifications.ts` | ✅ | Push notifications |
| `lib/api/client.ts` | ✅ | **CRITICAL - API client** |
| `lib/api/mockData.ts` | 🧪 | Mock data |
| `lib/haptics.ts` | ✅ | Haptic feedback |
| `lib/notifications/NotificationService.ts` | ✅ | Notifications |
| `lib/offline/OfflineManager.ts` | ✅ | Offline manager |
| `lib/supabase/client.ts` | ✅ | **CRITICAL - Database** |
| `lib/web/openExternal.ts` | ✅ | External links |

---

## Backend (backend/) - 10 files

| File | Status | Purpose |
|------|--------|---------|
| `template.yaml` | ✅ | **CRITICAL - Infrastructure** |
| `package.json` | ✅ | Dependencies |
| `README.md` | 📚 | Documentation |
| `.env.backend.example` | 📚 | Env template |
| `src/handlers/antivirus-scan.js` | 🔧 | **Needs production implementation** |
| `src/handlers/create-order.js` | ✅ | **CRITICAL - Order creation** |
| `src/handlers/create-payment-intent.js` | ✅ | **CRITICAL - Payments** |
| `src/handlers/generate-upload-url.js` | ✅ | **CRITICAL - File uploads** |
| `src/handlers/get-orders.js` | ✅ | Admin order fetching |
| `src/handlers/register-push-token.js` | ✅ | Push token registration |
| `src/handlers/stripe-webhook.js` | ✅ | **CRITICAL - Payment webhooks** |
| `src/handlers/update-order-status.js` | ✅ | Admin order updates |
| `src/utils/auth.js` | ✅ | **CRITICAL - Auth utilities** |

---

## Database (database/ & supabase/) - 15+ files

| File | Status | Purpose |
|------|--------|---------|
| `database/admin_dashboard_functions.sql` | ✅ | Admin functions |
| `database/artist_portal_schema.sql` | ✅ | Artist schema |
| `database/fix-admin-panel.sql` | 🔧 | Admin fixes |
| `database/notifications_schema.sql` | ✅ | Notifications |
| `database/recommendation_functions.sql` | ✅ | Recommendations |
| `database/social_features_schema.sql` | ✅ | Social features |
| `database/migrations/add_push_token_to_profiles.sql` | ✅ | Push tokens |
| `supabase/config.toml` | ✅ | Supabase config |
| `supabase/functions/create-payment-intent/index.ts` | ✅ | Payment intent |
| `supabase/functions/send-message-reply/index.ts` | ✅ | Message replies |
| `supabase/functions/_shared/cors.ts` | ✅ | CORS headers |
| `supabase/functions/_shared/stripe.ts` | ✅ | Stripe client |
| `supabase/migrations/*.sql` (4 files) | ✅ | Database migrations |

---

## Summary

**Total Files:** 263

**Status Breakdown:**
- ✅ Active & Essential: ~200 files
- 🔧 Needs Attention: ~10 files
- 📚 Documentation: ~15 files
- 🧪 Testing/Dev: ~10 files
- ⚠️ Review Needed: ~10 files
- ❌ Can Delete: ~15 files
- 📦 Build Artifacts: ~3 files

**Critical Files (Cannot Delete):** ~50 files
**Orphaned Files (Can Delete):** ~15 files

---

**End of Checklist**

