# ChartedArt - Complete Codebase Inventory & Documentation

**Generated:** 2025-10-16  
**Project:** ChartedArt - Art Print Customization Platform  
**Architecture:** Monorepo with Web (React), Mobile (React Native/Expo), and Serverless Backend (AWS SAM)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Root Directory Files](#root-directory-files)
3. [Web Application (src/)](#web-application-src)
4. [Mobile Application (mobile/)](#mobile-application-mobile)
5. [Backend Services (backend/)](#backend-services-backend)
6. [Database & Migrations](#database--migrations)
7. [Configuration Files](#configuration-files)
8. [Documentation Files](#documentation-files)
9. [Orphaned & Deprecated Files](#orphaned--deprecated-files)
10. [Dependency Graph](#dependency-graph)

---

## Project Overview

**ChartedArt** is a full-stack art marketplace platform that allows users to:
- Upload photos and convert them to custom art prints
- Browse and purchase artwork from artists
- Manage orders, commissions, and payments
- Access the platform via web or mobile (iOS/Android)

**Tech Stack:**
- **Frontend Web:** React 18 + TypeScript + Vite + TailwindCSS
- **Mobile:** React Native + Expo 54 + TypeScript
- **Backend:** AWS Lambda (Node.js 20) + API Gateway + S3
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Auth:** Supabase Auth (JWT)

---

## Root Directory Files

### Configuration Files

#### `.env` (Git-ignored)
- **Type:** Environment Variables
- **Purpose:** Stores sensitive configuration for local development
- **User Workflow:** No direct connection
- **Technical Workflow:** Loaded by Vite at build time; contains API keys for Supabase, Stripe, Google Maps, AWS
- **Dependencies:** Referenced by `vite.config.ts`, all client-side code via `import.meta.env`
- **Dependents:** All application code requiring environment variables

#### `.env.example`
- **Type:** Environment Template
- **Purpose:** Template showing required environment variables
- **User Workflow:** No direct connection
- **Technical Workflow:** Developer reference for setting up `.env` file
- **Dependencies:** None
- **Dependents:** None (documentation only)
- **Status:** ✅ Active

#### `.gitignore`
- **Type:** Git Configuration
- **Purpose:** Specifies files/folders to exclude from version control
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Prevents committing node_modules, .env, build artifacts, logs
- **Dependencies:** None
- **Dependents:** Git version control system

#### `.eslintrc.json`
- **Type:** Linting Configuration
- **Purpose:** ESLint rules for code quality and consistency
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Enforces TypeScript/React best practices during development
- **Dependencies:** None
- **Dependents:** Used by `npm run lint` script

#### `tsconfig.json`
- **Type:** TypeScript Configuration
- **Purpose:** TypeScript compiler options for web app
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Configures module resolution, path aliases (@/*), JSX handling
- **Dependencies:** None
- **Dependents:** All TypeScript files in `src/`

#### `vite.config.ts`
- **Type:** Build Configuration
- **Purpose:** Vite bundler configuration for web app
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Configures dev server (port 3000), path aliases, React plugin, build output
- **Dependencies:** `@vitejs/plugin-react`
- **Dependents:** Build and dev server processes

#### `tailwind.config.js` & `tailwind.config.ts`
- **Type:** Styling Configuration
- **Purpose:** TailwindCSS utility class configuration
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Defines custom colors (sage, cream, charcoal), spacing, animations
- **Dependencies:** `tailwindcss`, `tailwindcss-animate`
- **Dependents:** All component files using Tailwind classes
- **Note:** ⚠️ Duplicate files - `tailwind.config.ts` is likely the active one

#### `postcss.config.js`
- **Type:** CSS Processing Configuration
- **Purpose:** PostCSS plugins for CSS transformation
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Enables TailwindCSS and Autoprefixer
- **Dependencies:** `tailwindcss`, `autoprefixer`
- **Dependents:** Build process

#### `components.json`
- **Type:** UI Component Configuration
- **Purpose:** Shadcn/ui component library configuration
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Defines component paths, styling approach, aliases
- **Dependencies:** None
- **Dependents:** Shadcn CLI for generating UI components

#### `package.json`
- **Type:** Node.js Package Manifest
- **Purpose:** Defines dependencies, scripts, and project metadata for web app
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** 
  - Scripts: `dev` (start dev server), `build` (production build), `lint`, `preview`
  - Dependencies: React, Supabase, Stripe, Radix UI, Framer Motion, etc.
- **Dependencies:** None
- **Dependents:** npm/yarn package manager

#### `package-lock.json`
- **Type:** Dependency Lock File
- **Purpose:** Locks exact versions of all dependencies
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Ensures consistent installs across environments
- **Dependencies:** None
- **Dependents:** npm package manager

### Build & Deployment Files

#### `buildspec.yml`
- **Type:** AWS CodeBuild Configuration
- **Purpose:** CI/CD build instructions for AWS deployment
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Defines build phases, environment variables, artifacts for AWS CodePipeline
- **Dependencies:** None
- **Dependents:** AWS CodeBuild service

#### `index.html`
- **Type:** HTML Entry Point
- **Purpose:** Root HTML file for web application
- **User Workflow:** First file loaded when user visits the website
- **Technical Workflow:** 
  - Loads Vite dev server or production bundle
  - Contains root div for React mounting
  - Includes meta tags, title, favicon
- **Dependencies:** None
- **Dependents:** `src/main.tsx` (React app mounts here)

#### `app.json`
- **Type:** Application Metadata
- **Purpose:** Expo/React Native app configuration (root level)
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** May be legacy/duplicate of `mobile/app.json`
- **Status:** ⚠️ Potentially orphaned - check if used

#### `next-env.d.ts`
- **Type:** TypeScript Declarations
- **Purpose:** Next.js TypeScript definitions
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Provides type definitions for Next.js (if used)
- **Status:** ⚠️ Orphaned - Project uses Vite, not Next.js
- **Recommendation:** Can be deleted

### Database Files (Root Level)

#### `complete_foundation_migration.sql`
- **Type:** Database Migration Script
- **Purpose:** Complete database schema setup for Supabase
- **User Workflow:** No direct connection
- **Technical Workflow:** Creates tables, RLS policies, functions for the entire application
- **Dependencies:** Supabase PostgreSQL
- **Dependents:** Application database queries

#### `phase_0_foundation_manual.sql`
- **Type:** Database Migration Script
- **Purpose:** Initial phase 0 database setup
- **User Workflow:** No direct connection
- **Technical Workflow:** Foundation schema for core tables
- **Dependencies:** Supabase PostgreSQL
- **Dependents:** Later migration scripts

#### `fix_database_functions.sql`
- **Type:** Database Patch Script
- **Purpose:** Fixes for database functions
- **User Workflow:** No direct connection
- **Technical Workflow:** Corrects issues in stored procedures/functions
- **Dependencies:** Existing database schema
- **Dependents:** Application RPC calls

#### `verify_and_setup_admin.sql`
- **Type:** Database Setup Script
- **Purpose:** Creates admin user and verifies admin panel setup
- **User Workflow:** Enables admin users to access admin dashboard
- **Technical Workflow:** Inserts admin records, sets up permissions
- **Dependencies:** `profiles`, `admin_users` tables
- **Dependents:** Admin authentication flow

#### `dashboard_test_queries.sql`
- **Type:** Test/Development Script
- **Purpose:** SQL queries for testing dashboard functionality
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Developer tool for testing database queries
- **Status:** 🧪 Development/Testing only

### Utility Files

#### `test-admin.js`
- **Type:** Node.js Test Script
- **Purpose:** Tests admin user creation and authentication
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Validates admin setup in Supabase
- **Dependencies:** `@supabase/supabase-js`
- **Status:** 🧪 Development/Testing only

#### `directus.config.js`
- **Type:** CMS Configuration
- **Purpose:** Directus headless CMS configuration
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Configures Directus admin panel (if used)
- **Status:** ⚠️ Unclear if Directus is actively used - may be orphaned

### Documentation Files (Root Level)

#### `WARP.md`
- **Type:** Developer Documentation
- **Purpose:** Guidance for WARP terminal/AI assistants
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Documents project structure, commands, architecture
- **Status:** 📚 Documentation

#### `PROJECT_COMPLETE.md`
- **Type:** Project Documentation
- **Purpose:** Overview of completed project features
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** High-level project summary
- **Status:** 📚 Documentation

#### `COMPLETION_SUMMARY.md`
- **Type:** Project Documentation
- **Purpose:** Summary of implementation completion status
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `IMPLEMENTATION_SUMMARY.md`
- **Type:** Project Documentation
- **Purpose:** Details of implementation approach
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `MIGRATION_STATUS.md`
- **Type:** Project Documentation
- **Purpose:** Status of database/infrastructure migrations
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `PHASE_1_IMPLEMENTATION.md`
- **Type:** Project Documentation
- **Purpose:** Phase 1 implementation plan and status
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `DEPLOYMENT.md`
- **Type:** Deployment Documentation
- **Purpose:** Instructions for deploying the application
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** Deployment procedures for AWS, Supabase, Stripe
- **Status:** 📚 Documentation

#### `SETUP_GUIDE.md`
- **Type:** Setup Documentation
- **Purpose:** Developer setup instructions
- **User Workflow:** No connection to user workflow
- **Technical Workflow:** How to set up local development environment
- **Status:** 📚 Documentation

#### `ERROR_FIXES.md`
- **Type:** Troubleshooting Documentation
- **Purpose:** Common errors and their fixes
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `BUTTON_FIXES_SUMMARY.md`
- **Type:** Bug Fix Documentation
- **Purpose:** Summary of button-related bug fixes
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `MOBILE_FEATURES_SUMMARY.md`
- **Type:** Feature Documentation
- **Purpose:** Summary of mobile app features
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `ORDER_WORKFLOW_GAP_ANALYSIS.md`
- **Type:** Analysis Documentation
- **Purpose:** Analysis of gaps in order workflow
- **User Workflow:** No connection to user workflow
- **Status:** 📚 Documentation

#### `CreatePage_clean.txt`
- **Type:** Code Backup/Reference
- **Purpose:** Clean version of CreatePage component
- **User Workflow:** No connection to user workflow
- **Status:** ⚠️ Backup file - can be deleted if CreatePage.tsx is working

---

## Web Application (src/)

### Entry Points

#### `src/main.tsx`
- **Type:** Application Entry Point
- **Purpose:** Bootstraps React application
- **User Workflow:** First code executed when user loads the website
- **Technical Workflow:**
  - Renders React app to DOM
  - Wraps app in `BrowserRouter` for routing
  - Wraps app in `CartProvider` for global cart state
  - Enables React StrictMode
- **Dependencies:** `react`, `react-dom`, `react-router-dom`, `App.tsx`, `CartContext.tsx`
- **Dependents:** `index.html` (loads this via Vite)

#### `src/App.tsx`
- **Type:** Root Component
- **Purpose:** Main application component with routing
- **User Workflow:** Determines which page user sees based on URL
- **Technical Workflow:**
  - Defines all application routes
  - Handles authentication state changes
  - Redirects unauthenticated users to login
  - Wraps protected routes in `ProtectedRoute` component
- **Routes:**
  - `/` - HomePage
  - `/create` - CreatePage (protected)
  - `/cart` - CartPage (protected)
  - `/checkout` - CheckoutPage (protected)
  - `/account` - AccountPage (protected)
  - `/orders` - OrdersPage (protected)
  - `/admin/*` - Admin pages (protected)
  - `/auth/login` - LoginPage
  - `/auth/signup` - SignUpPage
  - `/faq` - FAQPage
  - `/shipping` - ShippingPage
  - `/gallery` - GalleryPage
  - `/events` - EventsPage
  - `/blog` - BlogPage
- **Dependencies:** All page components, `ProtectedRoute`, `supabase/client`, `react-router-dom`
- **Dependents:** `main.tsx`

#### `src/index.css`
- **Type:** Global Styles
- **Purpose:** Global CSS styles and Tailwind directives
- **User Workflow:** Affects visual appearance of entire application
- **Technical Workflow:**
  - Imports Tailwind base, components, utilities
  - Defines CSS custom properties
  - Global resets and base styles
- **Dependencies:** TailwindCSS
- **Dependents:** `main.tsx` (imports this)

### Layouts

#### `src/layouts/RootLayout.tsx`
- **Type:** Layout Component
- **Purpose:** Provides consistent layout structure (header, footer, content area)
- **User Workflow:** Visible on every page - provides navigation and branding
- **Technical Workflow:**
  - Renders header with navigation
  - Renders page content via `<Outlet />`
  - Renders footer
- **Dependencies:** `react-router-dom` (Outlet)
- **Dependents:** `App.tsx` (wraps all routes)

### Pages (src/pages/)

#### `src/pages/HomePage.tsx`
- **Type:** Page Component
- **Purpose:** Landing page of the application
- **User Workflow:**
  - First page users see when visiting the site
  - Shows hero section with call-to-action
  - Displays features, testimonials, and how-it-works sections
  - Different content for authenticated vs. unauthenticated users
- **Technical Workflow:**
  - Checks authentication status
  - Conditionally renders "Sign In" or "Create Your Kit" button
  - Links to `/create` for authenticated users, `/auth/login` for guests
- **Dependencies:** `supabase/client`, `react-router-dom`, `lucide-react`
- **Dependents:** `App.tsx` (route: `/`)

#### `src/pages/CreatePage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** Custom art print creation interface
- **User Workflow:**
  - Users upload photos
  - Select size (A4, A3, A2, A1, A0)
  - Choose frame options
  - Add to cart
  - Core revenue-generating feature
- **Technical Workflow:**
  - Handles image upload to S3 via presigned URLs
  - Validates image quality and dimensions
  - Creates product in database
  - Adds to cart
  - Uses `uploadFileSecurely` utility
- **Dependencies:** `supabase/client`, `api/client`, `utils/file-upload`, `CartContext`
- **Dependents:** `App.tsx` (route: `/create`)
- **Status:** ✅ Active - Primary user workflow

#### `src/pages/CreatePage.tsx.backup`
- **Type:** Backup File
- **Purpose:** Backup of CreatePage component
- **User Workflow:** No connection to user workflow
- **Status:** ⚠️ Orphaned - Can be deleted if CreatePage.tsx is stable

#### `src/pages/CartPage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** Shopping cart management
- **User Workflow:**
  - Users view items in cart
  - Update quantities
  - Remove items
  - Proceed to checkout
- **Technical Workflow:**
  - Fetches cart items from Supabase
  - Handles cart item deletion
  - Calculates total amount
  - Redirects to `/checkout`
- **Dependencies:** `supabase/client`, `CartContext`, `react-router-dom`
- **Dependents:** `App.tsx` (route: `/cart`)
- **Status:** ✅ Active - Core e-commerce workflow

#### `src/pages/CheckoutPage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** Payment and order completion
- **User Workflow:**
  - Users enter shipping address
  - Enter payment information (Stripe)
  - Complete purchase
  - Critical conversion point
- **Technical Workflow:**
  - Integrates Stripe Elements for payment
  - Creates payment intent via API
  - Creates order in database
  - Redirects to order confirmation
- **Dependencies:** `@stripe/stripe-js`, `@stripe/react-stripe-js`, `api/client`, `supabase/client`
- **Dependents:** `App.tsx` (route: `/checkout`)
- **Status:** ✅ Active - Critical revenue workflow

#### `src/pages/OrderConfirmationPage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** Order success confirmation
- **User Workflow:**
  - Users see order confirmation after successful payment
  - View order details
  - Download receipt
  - Navigate to order history
- **Technical Workflow:**
  - Fetches order details by ID from URL params
  - Displays order summary
- **Dependencies:** `supabase/client`, `react-router-dom`
- **Dependents:** `App.tsx` (route: `/order-confirmation/:orderId`)
- **Status:** ✅ Active

#### `src/pages/OrdersPage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** User's order history
- **User Workflow:**
  - Users view all their past orders
  - Track order status
  - View order details
- **Technical Workflow:**
  - Fetches orders for authenticated user
  - Displays order list with status
  - Links to individual order details
- **Dependencies:** `supabase/client`
- **Dependents:** `App.tsx` (route: `/orders`)
- **Status:** ✅ Active

#### `src/pages/AccountPage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** User account management
- **User Workflow:**
  - Users view/edit profile information
  - Manage account settings
  - View order history
  - Access gallery
- **Technical Workflow:**
  - Fetches user profile from Supabase
  - Allows profile updates
  - Links to orders, gallery
- **Dependencies:** `supabase/client`
- **Dependents:** `App.tsx` (route: `/account`)
- **Status:** ✅ Active

#### `src/pages/GalleryPage.tsx`
- **Type:** Page Component (Protected)
- **Purpose:** User's personal gallery of created prints
- **User Workflow:**
  - Users view all their created art prints
  - Re-order previous designs
  - Share gallery with others
- **Technical Workflow:**
  - Fetches user's products from database
  - Displays in grid layout
- **Dependencies:** `supabase/client`
- **Dependents:** `App.tsx` (route: `/gallery`)
- **Status:** ✅ Active

#### `src/pages/FAQPage.tsx`
- **Type:** Page Component (Public)
- **Purpose:** Frequently asked questions
- **User Workflow:**
  - Users find answers to common questions
  - Learn about product, shipping, returns
- **Technical Workflow:** Static content page
- **Dependencies:** None
- **Dependents:** `App.tsx` (route: `/faq`)
- **Status:** ✅ Active

#### `src/pages/ShippingPage.tsx`
- **Type:** Page Component (Public)
- **Purpose:** Shipping information and policies
- **User Workflow:**
  - Users learn about shipping options, costs, timelines
- **Technical Workflow:** Static content page
- **Dependencies:** None
- **Dependents:** `App.tsx` (route: `/shipping`)
- **Status:** ✅ Active

#### `src/pages/BlogPage.tsx`
- **Type:** Page Component (Public)
- **Purpose:** Blog/articles listing
- **User Workflow:**
  - Users read blog posts about art, tips, company news
- **Technical Workflow:** May fetch blog posts from CMS or database
- **Dependencies:** TBD (may use Directus or Supabase)
- **Dependents:** `App.tsx` (route: `/blog`)
- **Status:** ⚠️ Check if fully implemented

#### `src/pages/EventsPage.tsx`
- **Type:** Page Component (Public)
- **Purpose:** Events and workshops listing
- **User Workflow:**
  - Users discover art workshops, community events
  - Register for events
- **Technical Workflow:** Fetches events from database
- **Dependencies:** `supabase/client`
- **Dependents:** `App.tsx` (route: `/events`)
- **Status:** ⚠️ Check if fully implemented

### Admin Pages (src/pages/)

#### `src/pages/AdminDashboardPage.tsx`
- **Type:** Page Component (Protected - Admin Only)
- **Purpose:** Admin dashboard with business metrics
- **User Workflow:**
  - Admins view sales analytics
  - Monitor orders, products, customers
  - Access system settings
- **Technical Workflow:**
  - Verifies admin role
  - Fetches business overview data
  - Tabbed interface for different admin functions
- **Dependencies:** `supabase/client`, admin components
- **Dependents:** `App.tsx` (route: `/admin`)
- **Status:** ✅ Active

#### `src/pages/AdminOrdersPage.tsx`
- **Type:** Page Component (Protected - Admin Only)
- **Purpose:** Order management for admins
- **User Workflow:**
  - Admins view all orders
  - Update order status
  - Process refunds
  - Archive orders
- **Technical Workflow:**
  - Fetches all orders (not just user's)
  - Allows status updates
  - Integrates with Stripe for refunds
- **Dependencies:** `supabase/client`, `api/client`
- **Dependents:** `App.tsx` (route: `/admin/orders`)
- **Status:** ✅ Active

#### `src/pages/AdminMessagesPage.tsx`
- **Type:** Page Component (Protected - Admin Only)
- **Purpose:** Customer message management
- **User Workflow:**
  - Admins view customer inquiries
  - Reply to messages
  - Mark as resolved
- **Technical Workflow:**
  - Fetches messages from database
  - Sends replies via Supabase function
- **Dependencies:** `supabase/client`
- **Dependents:** `App.tsx` (route: `/admin/messages`)
- **Status:** ✅ Active

#### `src/pages/ArchivePage.tsx`
- **Type:** Page Component (Protected - Admin Only)
- **Purpose:** Archived orders view
- **User Workflow:**
  - Admins view archived/completed orders
  - Restore archived orders
- **Technical Workflow:**
  - Fetches archived orders
  - Allows unarchiving
- **Dependencies:** `supabase/client`
- **Dependents:** `App.tsx` (route: `/admin/archive`)
- **Status:** ✅ Active

### Auth Pages (src/pages/auth/)

#### `src/pages/auth/LoginPage.tsx`
- **Type:** Page Component (Public)
- **Purpose:** User login
- **User Workflow:**
  - Users enter email/password to log in
  - Access to "Forgot Password" link
  - Link to sign up page
- **Technical Workflow:**
  - Authenticates via Supabase Auth
  - Redirects to intended page or `/account` on success
- **Dependencies:** `supabase/client`, `react-router-dom`
- **Dependents:** `App.tsx` (route: `/auth/login`)
- **Status:** ✅ Active

#### `src/pages/auth/SignUpPage.tsx`
- **Type:** Page Component (Public)
- **Purpose:** User registration
- **User Workflow:**
  - New users create account
  - Enter email, password, name
  - Receive verification email
- **Technical Workflow:**
  - Creates user via Supabase Auth
  - Creates profile record
  - Sends verification email
- **Dependencies:** `supabase/client`, `react-router-dom`
- **Dependents:** `App.tsx` (route: `/auth/signup`)
- **Status:** ✅ Active

### Components (src/components/)

#### Core Components

**`src/components/ProtectedRoute.tsx`**
- **Purpose:** Route guard for authenticated-only pages
- **User Workflow:** Redirects unauthenticated users to login
- **Technical Workflow:** Checks auth state, redirects if not authenticated
- **Dependencies:** `supabase/client`, `react-router-dom`
- **Status:** ✅ Active - Critical security component

**`src/components/PaymentForm.tsx`**
- **Purpose:** Stripe payment form component
- **User Workflow:** Users enter credit card details for payment
- **Technical Workflow:** Integrates Stripe Elements, handles payment submission
- **Dependencies:** `@stripe/react-stripe-js`
- **Status:** ✅ Active - Critical for checkout

**`src/components/AddressAutocomplete.tsx`**
- **Purpose:** Google Maps address autocomplete
- **User Workflow:** Users type address, get suggestions
- **Technical Workflow:** Uses Google Places API
- **Dependencies:** `use-places-autocomplete`, Google Maps API
- **Status:** ✅ Active

**`src/components/Map.tsx`**
- **Purpose:** Google Maps display component
- **User Workflow:** Shows location on map
- **Technical Workflow:** Renders Google Map
- **Dependencies:** Google Maps API
- **Status:** ✅ Active

**`src/components/ContactDialog.tsx`**
- **Purpose:** Contact form modal
- **User Workflow:** Users send messages to support/admin
- **Technical Workflow:** Submits message to database
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/MessageReplyDialog.tsx`**
- **Purpose:** Admin message reply modal
- **User Workflow:** Admins reply to customer messages
- **Technical Workflow:** Sends reply via Supabase function
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/BiometricSettings.tsx`**
- **Purpose:** Biometric authentication settings
- **User Workflow:** Users enable/disable biometric login
- **Technical Workflow:** Manages WebAuthn credentials
- **Dependencies:** `@simplewebauthn/browser`
- **Status:** ✅ Active

**`src/components/AudioPlayer.tsx`**
- **Purpose:** Audio playback component
- **User Workflow:** Users play audio content
- **Technical Workflow:** HTML5 audio player
- **Status:** ⚠️ Check if used

**`src/components/CommissionSystem.tsx`**
- **Purpose:** Commission request and management system
- **User Workflow:**
  - Customers request custom commissions from artists
  - Artists manage commission requests
- **Technical Workflow:** Handles commission workflow
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/ArtistDashboard.tsx`**
- **Purpose:** Artist portal dashboard (root level)
- **User Workflow:** Artists view their sales, commissions, analytics
- **Technical Workflow:** Aggregates artist data
- **Dependencies:** `hooks/useArtistPortal`, `hooks/useAuth`
- **Status:** ✅ Active
- **Note:** Also exists in `src/components/artist/` - may be duplicate

**`src/components/CheckoutPage.tsx`**
- **Purpose:** Checkout component (root level)
- **User Workflow:** Checkout process
- **Status:** ⚠️ Duplicate of `src/pages/CheckoutPage.tsx` - check which is used

**`src/components/ProductPage.tsx`**
- **Purpose:** Product detail page component
- **User Workflow:** Users view product details
- **Status:** ⚠️ Check if used or if product details are in pages/

#### Admin Components (src/components/admin/)

**`src/components/admin/SalesDashboard.tsx`**
- **Purpose:** Sales analytics dashboard for admins
- **User Workflow:** Admins view revenue, orders, conversion metrics
- **Technical Workflow:** Fetches and displays business metrics
- **Dependencies:** `supabase/client`, `recharts`
- **Status:** ✅ Active

**`src/components/admin/ProductManagement.tsx`**
- **Purpose:** Product CRUD interface for admins
- **User Workflow:** Admins create, edit, delete products
- **Technical Workflow:** Manages product catalog
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/admin/CustomerManagement.tsx`**
- **Purpose:** Customer management interface
- **User Workflow:** Admins view and manage customer accounts
- **Technical Workflow:** Fetches user profiles, allows updates
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/admin/SystemSettings.tsx`**
- **Purpose:** System configuration interface
- **User Workflow:** Admins configure app settings, integrations
- **Technical Workflow:** Manages system config in database
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

#### Artist Components (src/components/artist/)

**`src/components/artist/ArtistDashboard.tsx`**
- **Purpose:** Main artist portal dashboard
- **User Workflow:** Artists access all their tools and analytics
- **Technical Workflow:** Tabbed interface for portfolio, commissions, analytics, inventory, payouts
- **Dependencies:** All other artist components
- **Status:** ✅ Active

**`src/components/artist/ArtistPortfolioManager.tsx`**
- **Purpose:** Artist portfolio management
- **User Workflow:** Artists upload and manage their artwork
- **Technical Workflow:** Image upload, product creation
- **Dependencies:** `supabase/client`, `utils/imageUpload`
- **Status:** ✅ Active

**`src/components/artist/CommissionTracker.tsx`**
- **Purpose:** Commission request tracking
- **User Workflow:** Artists view and respond to commission requests
- **Technical Workflow:** Manages commission workflow
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/artist/SalesAnalytics.tsx`**
- **Purpose:** Artist sales analytics
- **User Workflow:** Artists view their sales performance
- **Technical Workflow:** Charts and metrics for artist sales
- **Dependencies:** `supabase/client`, `recharts`
- **Status:** ✅ Active

**`src/components/artist/PayoutManager.tsx`**
- **Purpose:** Artist payout management
- **User Workflow:** Artists view earnings and request payouts
- **Technical Workflow:** Tracks earnings, payout requests
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/artist/InventoryTracker.tsx`**
- **Purpose:** Artist inventory management
- **User Workflow:** Artists track stock levels
- **Technical Workflow:** Manages product inventory
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/artist/index.ts`**
- **Purpose:** Barrel export for artist components
- **Technical Workflow:** Exports all artist components
- **Status:** ✅ Active

#### Shop Components (src/components/shop/)

**`src/components/shop/ProductCatalog.tsx`**
- **Purpose:** Product browsing and filtering
- **User Workflow:** Users browse available artwork
- **Technical Workflow:** Fetches products, filtering, sorting
- **Dependencies:** `supabase/client`, `hooks/useProducts`
- **Status:** ✅ Active

**`src/components/shop/ShoppingCart.tsx`**
- **Purpose:** Shopping cart component
- **User Workflow:** Users manage cart items
- **Technical Workflow:** Cart state management
- **Dependencies:** `hooks/useCart`
- **Status:** ✅ Active

**`src/components/shop/CheckoutProcess.tsx`**
- **Purpose:** Checkout flow component
- **User Workflow:** Users complete purchase
- **Technical Workflow:** Multi-step checkout process
- **Dependencies:** `supabase/client`, Stripe
- **Status:** ✅ Active

**`src/components/shop/OrderDashboard.tsx`**
- **Purpose:** Customer order dashboard
- **User Workflow:** Users view their orders
- **Technical Workflow:** Fetches and displays user orders
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/shop/CommissionRequest.tsx`**
- **Purpose:** Commission request form
- **User Workflow:** Users request custom commissions
- **Technical Workflow:** Submits commission request
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/shop/CustomerProfile.tsx`**
- **Purpose:** Customer profile component
- **User Workflow:** Users view/edit their profile
- **Technical Workflow:** Profile management
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/components/shop/index.ts`**
- **Purpose:** Barrel export for shop components
- **Status:** ✅ Active

#### Payment Components (src/components/payments/)

**`src/components/payments/EnhancedPaymentMethods.tsx`**
- **Purpose:** Advanced payment method selection
- **User Workflow:** Users choose payment method (card, wallet, etc.)
- **Technical Workflow:** Stripe payment methods integration
- **Dependencies:** `@stripe/stripe-js`
- **Status:** ✅ Active

#### UI Components (src/components/ui/)

**`src/components/ui/card.tsx`**
- **Purpose:** Reusable card component (Shadcn/ui)
- **User Workflow:** Visual container for content
- **Technical Workflow:** Styled card component
- **Status:** ✅ Active

#### Animation Utilities (src/components/animations/)

**`src/components/animations/variants.ts`**
- **Purpose:** Framer Motion animation variants
- **User Workflow:** Smooth animations throughout app
- **Technical Workflow:** Reusable animation configurations
- **Dependencies:** `framer-motion`
- **Status:** ✅ Active

### Contexts (src/contexts/)

**`src/contexts/CartContext.tsx`**
- **Purpose:** Global cart state management
- **User Workflow:** Maintains cart state across pages
- **Technical Workflow:**
  - Provides cart item count
  - Updates cart badge in header
  - Syncs with Supabase cart table
- **Dependencies:** `supabase/client`, React Context API
- **Dependents:** All components needing cart state
- **Status:** ✅ Active - Critical for e-commerce

### Custom Hooks (src/hooks/)

**`src/hooks/useAdminDashboard.ts`**
- **Purpose:** Admin dashboard data fetching
- **Technical Workflow:** Fetches business metrics, orders, analytics
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/hooks/useAnalytics.ts`**
- **Purpose:** User analytics tracking
- **Technical Workflow:** Tracks page views, events, user behavior
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/hooks/useArtistPortal.ts`**
- **Purpose:** Artist portal data management
- **Technical Workflow:** Fetches artist-specific data
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/hooks/useBiometricAuth.ts`**
- **Purpose:** Biometric authentication (WebAuthn)
- **User Workflow:** Users log in with fingerprint/face ID
- **Technical Workflow:** Manages WebAuthn credentials
- **Dependencies:** `@simplewebauthn/browser`
- **Status:** ✅ Active

**`src/hooks/useNotifications.ts`**
- **Purpose:** Notification system
- **User Workflow:** Users receive real-time notifications
- **Technical Workflow:**
  - Subscribes to Supabase real-time notifications
  - Manages notification preferences
  - Push notification support
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/hooks/usePWA.ts`**
- **Purpose:** Progressive Web App functionality
- **User Workflow:** Users can install app, receive push notifications
- **Technical Workflow:**
  - Service worker registration
  - Install prompt handling
  - Offline detection
- **Dependencies:** Service Worker API
- **Status:** ✅ Active

**`src/hooks/useRecommendations.ts`**
- **Purpose:** Product recommendation engine
- **User Workflow:** Users see personalized product recommendations
- **Technical Workflow:**
  - Collaborative filtering
  - Content-based filtering
  - Trending products
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/hooks/useSmartSearch.ts`**
- **Purpose:** Intelligent search functionality
- **User Workflow:** Users search for products
- **Technical Workflow:** Full-text search, filters
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

**`src/hooks/useSocialFeatures.ts`**
- **Purpose:** Social features (likes, follows, comments)
- **User Workflow:** Users interact with artists and products
- **Technical Workflow:** Manages social interactions
- **Dependencies:** `supabase/client`
- **Status:** ✅ Active

### Libraries & Utilities (src/lib/)

**`src/lib/supabase/client.ts`**
- **Purpose:** Supabase client initialization
- **Technical Workflow:** Creates authenticated Supabase client
- **Dependencies:** `@supabase/supabase-js`, environment variables
- **Dependents:** All components/hooks using Supabase
- **Status:** ✅ Active - Critical infrastructure

**`src/lib/supabase/types.ts`**
- **Purpose:** TypeScript types for database schema
- **Technical Workflow:** Auto-generated types from Supabase
- **Dependencies:** Supabase CLI
- **Status:** ✅ Active

**`src/lib/api/client.ts`**
- **Purpose:** API client for backend Lambda functions
- **Technical Workflow:**
  - Attaches Supabase JWT to requests
  - Handles retries and errors
  - Endpoints: orders, payments, uploads
- **Dependencies:** Supabase client
- **Dependents:** All components making API calls
- **Status:** ✅ Active - Critical infrastructure

**`src/lib/stripe.ts`**
- **Purpose:** Stripe client initialization
- **Technical Workflow:** Loads Stripe.js with publishable key
- **Dependencies:** `@stripe/stripe-js`, environment variables
- **Dependents:** Payment components
- **Status:** ✅ Active

**`src/lib/directus.ts`**
- **Purpose:** Directus CMS client
- **Technical Workflow:** Connects to Directus API
- **Status:** ⚠️ Check if Directus is actively used

**`src/lib/inventory.ts`**
- **Purpose:** Inventory management utilities
- **Technical Workflow:** Helper functions for inventory tracking
- **Status:** ✅ Active

**`src/lib/utils.ts`**
- **Purpose:** General utility functions
- **Technical Workflow:** Common helpers (classNames, formatting, etc.)
- **Dependencies:** `clsx`, `tailwind-merge`
- **Status:** ✅ Active

**`src/lib/utils/file-upload.ts`**
- **Purpose:** Secure file upload utilities
- **Technical Workflow:**
  - Generates presigned S3 URLs
  - Uploads files directly to S3
  - Validates file types and sizes
- **Dependencies:** `api/client`
- **Dependents:** CreatePage, ArtistPortfolioManager
- **Status:** ✅ Active - Critical for uploads

### Data & Types (src/)

**`src/data/mockData.ts`**
- **Purpose:** Mock data for development/testing
- **Technical Workflow:** Sample products, users, orders
- **Status:** 🧪 Development only

**`src/types/global.d.ts`**
- **Purpose:** Global TypeScript type declarations
- **Technical Workflow:** Ambient type definitions
- **Status:** ✅ Active

### Utilities (src/utils/)

**`src/utils/imageUpload.ts`**
- **Purpose:** Image upload utilities
- **Technical Workflow:** Image processing, upload helpers
- **Dependencies:** File upload utilities
- **Status:** ✅ Active

### API Routes (src/api/)

**`src/api/webauthn/authenticate/begin.ts`**
- **Purpose:** WebAuthn authentication initiation
- **Technical Workflow:** Starts biometric auth flow
- **Dependencies:** `@simplewebauthn/server`
- **Status:** ✅ Active

**`src/api/webauthn/authenticate/finish.ts`**
- **Purpose:** WebAuthn authentication completion
- **Technical Workflow:** Verifies biometric auth
- **Dependencies:** `@simplewebauthn/server`
- **Status:** ✅ Active

**`src/api/webauthn/register/begin.ts`**
- **Purpose:** WebAuthn registration initiation
- **Technical Workflow:** Starts biometric registration
- **Dependencies:** `@simplewebauthn/server`
- **Status:** ✅ Active

**`src/api/webauthn/register/finish.ts`**
- **Purpose:** WebAuthn registration completion
- **Technical Workflow:** Completes biometric registration
- **Dependencies:** `@simplewebauthn/server`
- **Status:** ✅ Active

### Public Assets (public/)

**`public/manifest.json`**
- **Purpose:** PWA manifest file
- **User Workflow:** Enables "Add to Home Screen" on mobile
- **Technical Workflow:** Defines app name, icons, theme colors
- **Status:** ✅ Active

**`public/sw.js`**
- **Purpose:** Service Worker for PWA
- **User Workflow:** Enables offline functionality, push notifications
- **Technical Workflow:** Caches assets, handles background sync
- **Status:** ✅ Active

### Shared Libraries (lib/ - Root Level)

**`lib/supabase/client.ts`**
- **Purpose:** Shared Supabase client (root level)
- **Status:** ⚠️ Duplicate of `src/lib/supabase/client.ts` - check which is used

**`lib/supabase/types.ts`**
- **Purpose:** Shared Supabase types (root level)
- **Status:** ⚠️ Duplicate of `src/lib/supabase/types.ts`

**`lib/utils.ts`**
- **Purpose:** Shared utilities (root level)
- **Status:** ⚠️ Duplicate of `src/lib/utils.ts`

### Shared Hooks (hooks/ - Root Level)

**`hooks/use-toast.ts`**
- **Purpose:** Toast notification hook
- **User Workflow:** Shows toast messages to users
- **Technical Workflow:** Manages toast state
- **Dependencies:** `sonner` or similar toast library
- **Status:** ✅ Active

---

## Mobile Application (mobile/)

### Overview
- **Platform:** React Native with Expo 54
- **Language:** TypeScript
- **Navigation:** React Navigation
- **State:** React Context API
- **Auth:** Supabase Auth
- **Payments:** Stripe React Native SDK

### Entry Point

**`mobile/App.js`**
- **Purpose:** Mobile app entry point
- **User Workflow:** First component loaded in mobile app
- **Technical Workflow:**
  - Wraps app in AuthProvider, StripeProvider, NavigationContainer
  - Conditional rendering based on auth state
  - Defines root navigation structure
- **Dependencies:** All navigation stacks, contexts
- **Status:** ✅ Active

**`mobile/index.ts`**
- **Purpose:** Expo entry point
- **Technical Workflow:** Registers root component
- **Status:** ✅ Active

### Configuration

**`mobile/app.json`**
- **Purpose:** Expo app configuration
- **Technical Workflow:**
  - App name, version, icons
  - Platform-specific settings
  - Permissions
- **Status:** ✅ Active

**`mobile/eas.json`**
- **Purpose:** EAS Build configuration
- **Technical Workflow:** Build profiles for development, preview, production
- **Status:** ✅ Active

**`mobile/babel.config.js`**
- **Purpose:** Babel transpiler configuration
- **Technical Workflow:** Configures Expo preset
- **Status:** ✅ Active

**`mobile/tsconfig.json`**
- **Purpose:** TypeScript configuration for mobile
- **Technical Workflow:** Mobile-specific TS settings
- **Status:** ✅ Active

**`mobile/package.json`**
- **Purpose:** Mobile app dependencies and scripts
- **Scripts:**
  - `start` - Start Expo dev server
  - `android` - Run on Android
  - `ios` - Run on iOS
  - `test` - Run Jest tests
- **Status:** ✅ Active

### Navigation (mobile/src/navigation/)

**`mobile/src/navigation/AuthStack.tsx`**
- **Purpose:** Authentication navigation stack
- **User Workflow:** Login, signup, forgot password screens
- **Technical Workflow:** Stack navigator for auth flows
- **Status:** ✅ Active

**`mobile/src/navigation/MainTabs.tsx`**
- **Purpose:** Main app tab navigation
- **User Workflow:** Home, Create, Cart, Account tabs
- **Technical Workflow:** Bottom tab navigator
- **Status:** ✅ Active

### Screens (mobile/src/screens/)

#### Auth Screens (mobile/src/screens/auth/)

**`LoginScreen.tsx`**
- **User Workflow:** Users log in to mobile app
- **Status:** ✅ Active

**`SignUpScreen.tsx`**
- **User Workflow:** Users create account
- **Status:** ✅ Active

**`ForgotPasswordScreen.tsx`**
- **User Workflow:** Users reset password
- **Status:** ✅ Active

#### Main Screens

**`mobile/src/screens/home/HomeScreen.tsx`**
- **User Workflow:** Mobile app home screen
- **Status:** ✅ Active

**`mobile/src/screens/create/CreateScreen.tsx`**
- **User Workflow:** Create custom prints on mobile
- **Status:** ✅ Active

**`mobile/src/screens/cart/CartScreen.tsx`**
- **User Workflow:** View and manage cart on mobile
- **Status:** ✅ Active

**`mobile/src/screens/checkout/CheckoutScreen.tsx`**
- **User Workflow:** Complete purchase on mobile
- **Status:** ✅ Active

**`mobile/src/screens/checkout/EnhancedCheckoutScreen.tsx`**
- **User Workflow:** Enhanced checkout with additional features
- **Status:** ✅ Active

**`mobile/src/screens/account/AccountScreen.tsx`**
- **User Workflow:** User account management on mobile
- **Status:** ✅ Active

**`mobile/src/screens/account/EditProfileScreen.tsx`**
- **User Workflow:** Edit profile information
- **Status:** ✅ Active

**`mobile/src/screens/gallery/GalleryScreen.tsx`**
- **User Workflow:** View personal gallery on mobile
- **Status:** ✅ Active

**`mobile/src/screens/orders/OrderHistoryScreen.tsx`**
- **User Workflow:** View order history on mobile
- **Status:** ✅ Active

**`mobile/src/screens/orders/OrderDetailScreen.tsx`**
- **User Workflow:** View order details
- **Status:** ✅ Active

**`mobile/src/screens/orders/OrderDetailScreenSimple.tsx`**
- **User Workflow:** Simplified order details view
- **Status:** ✅ Active

**`mobile/src/screens/orders/OrderConfirmationScreen.tsx`**
- **User Workflow:** Order confirmation after purchase
- **Status:** ✅ Active

**`mobile/src/screens/support/SupportScreen.tsx`**
- **User Workflow:** Contact support
- **Status:** ✅ Active

#### Advanced Features

**`mobile/src/screens/ar/ARViewScreen.tsx`**
- **User Workflow:** View artwork in AR (augmented reality)
- **Technical Workflow:** Uses device camera and AR libraries
- **Status:** ✅ Active - Advanced feature

**`mobile/src/screens/search/VisualSearchScreen.tsx`**
- **User Workflow:** Search for similar artwork using images
- **Technical Workflow:** Image-based search
- **Status:** ✅ Active - Advanced feature

**`mobile/src/screens/advisor/RoomAdvisorScreen.tsx`**
- **User Workflow:** Get AI recommendations for room decoration
- **Technical Workflow:** AI-powered room advisor
- **Status:** ✅ Active - Advanced feature

### Mobile Contexts (mobile/src/contexts/)

**`mobile/src/contexts/AuthContext.tsx`**
- **Purpose:** Authentication state management for mobile
- **User Workflow:** Maintains login state across mobile app
- **Technical Workflow:** Supabase auth integration
- **Status:** ✅ Active

### Mobile Hooks (mobile/src/hooks/)

**`useCart.ts`** - Cart management for mobile
**`useImagePicker.ts`** - Image selection from device
**`useImageUpload.ts`** - Image upload to S3
**`useBiometricAuth.ts`** - Biometric authentication (Face ID, Touch ID)
**`useOffline.ts`** - Offline mode management
**`usePushNotifications.ts`** - Push notification handling
- **Status:** ✅ All active

### Mobile Libraries (mobile/src/lib/)

**`mobile/src/lib/supabase/client.ts`**
- **Purpose:** Supabase client for mobile with secure storage
- **Technical Workflow:** Uses Expo SecureStore for token storage
- **Status:** ✅ Active

**`mobile/src/lib/api/client.ts`**
- **Purpose:** API client for mobile
- **Technical Workflow:** HTTP client with JWT auth
- **Status:** ✅ Active

**`mobile/src/lib/api/mockData.ts`**
- **Purpose:** Mock data for mobile development
- **Status:** 🧪 Development only

**`mobile/src/lib/haptics.ts`**
- **Purpose:** Haptic feedback utilities
- **User Workflow:** Provides tactile feedback on interactions
- **Status:** ✅ Active

**`mobile/src/lib/offline/OfflineManager.ts`**
- **Purpose:** Offline data caching and sync
- **User Workflow:** App works without internet
- **Technical Workflow:** AsyncStorage caching, background sync
- **Status:** ✅ Active

**`mobile/src/lib/notifications/NotificationService.ts`**
- **Purpose:** Push notification service
- **User Workflow:** Users receive push notifications
- **Technical Workflow:** Expo Notifications API
- **Status:** ✅ Active

**`mobile/src/lib/web/openExternal.ts`**
- **Purpose:** Open external URLs in browser
- **Technical Workflow:** Linking API
- **Status:** ✅ Active

### Mobile Components (mobile/src/components/common/)

**`Button.tsx`** - Reusable button component
**`Card.tsx`** - Card container component
**`LoadingSpinner.tsx`** - Loading indicator
**`index.ts`** - Barrel export
- **Status:** ✅ All active

### Mobile Constants (mobile/src/constants/)

**`colors.ts`** - Color palette
**`spacing.ts`** - Spacing scale
**`typography.ts`** - Font styles
- **Purpose:** Design system constants
- **Status:** ✅ Active

### Mobile Configuration (mobile/src/config/)

**`app.ts`** - App configuration (API URLs, feature flags)
**`links.ts`** - External links (blog, FAQ, etc.)
- **Status:** ✅ Active

### Mobile Types (mobile/src/types/)

**`index.ts`** - TypeScript type definitions for mobile
- **Status:** ✅ Active

### Mobile Tests (mobile/__tests__/)

**`Button.test.tsx`** - Button component tests
**`LoginScreen.test.tsx`** - Login screen tests
**`OrderConfirmationScreen.test.tsx`** - Order confirmation tests
- **Status:** 🧪 Test files

**`mobile/jest.setup.ts`** - Jest test configuration
- **Status:** 🧪 Test configuration

### Mobile Build Artifacts

**`mobile/ChartedArt.apk`** - Android APK build
**`mobile/ChartedArt-NoAnalytics.apk`** - APK without analytics
- **Status:** 📦 Build artifacts (excluded from git)

### Mobile iOS Widget (mobile/ios/)

**`mobile/ios/ChartedArtWidget/ChartedArtWidget.swift`**
- **Purpose:** iOS home screen widget
- **User Workflow:** Users see widget on iOS home screen
- **Technical Workflow:** SwiftUI widget
- **Status:** ✅ Active - iOS only

### Mobile Scripts (mobile/scripts/)

**`build.sh`** - Build script for Unix/Mac
**`build.bat`** - Build script for Windows
**`setup-backend.js`** - Backend setup automation
- **Status:** 🛠️ Build/deployment scripts

---

## Backend Services (backend/)

### Overview
- **Platform:** AWS Lambda (Serverless)
- **Runtime:** Node.js 20
- **Framework:** AWS SAM (Serverless Application Model)
- **API:** API Gateway (REST)
- **Storage:** S3 for file uploads
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe

### Configuration

**`backend/template.yaml`**
- **Purpose:** AWS SAM infrastructure as code
- **Technical Workflow:**
  - Defines Lambda functions
  - API Gateway routes
  - S3 bucket configuration
  - IAM roles and permissions
- **Status:** ✅ Active - Critical infrastructure

**`backend/package.json`**
- **Purpose:** Backend dependencies
- **Dependencies:** `@aws-sdk/client-s3`, `@supabase/supabase-js`, `stripe`
- **Status:** ✅ Active

**`backend/README.md`**
- **Purpose:** Backend documentation
- **Status:** 📚 Documentation

**`backend/.env.backend.example`**
- **Purpose:** Backend environment variable template
- **Status:** 📚 Documentation

### Lambda Handlers (backend/src/handlers/)

**`generate-upload-url.js`**
- **Purpose:** Generate S3 presigned URLs for file uploads
- **User Workflow:** Users upload images securely
- **API Endpoint:** `POST /generate-upload-url`
- **Technical Workflow:**
  - Validates file type and size
  - Generates presigned S3 URL
  - Returns URL to client
- **Dependencies:** AWS S3 SDK, auth utilities
- **Status:** ✅ Active - Critical for uploads

**`antivirus-scan.js`**
- **Purpose:** Scan uploaded files for viruses
- **User Workflow:** Protects users from malicious files
- **Technical Workflow:**
  - Triggered by S3 ObjectCreated event
  - Scans file (placeholder - needs ClamAV integration)
  - Tags file as scanned
- **Status:** ⚠️ Placeholder implementation - needs production antivirus

**`create-order.js`**
- **Purpose:** Create new order
- **User Workflow:** Users place orders
- **API Endpoint:** `POST /orders`
- **Technical Workflow:**
  - Validates cart items
  - Calculates totals (subtotal, shipping, tax)
  - Creates order in database
  - Creates order items
- **Dependencies:** Supabase, auth utilities
- **Status:** ✅ Active - Critical for e-commerce

**`get-orders.js`**
- **Purpose:** Fetch orders (admin only)
- **User Workflow:** Admins view all orders
- **API Endpoint:** `GET /admin/orders`
- **Technical Workflow:**
  - Verifies admin role
  - Fetches orders with filters
  - Returns paginated results
- **Dependencies:** Supabase, auth utilities
- **Status:** ✅ Active

**`update-order-status.js`**
- **Purpose:** Update order status (admin only)
- **User Workflow:** Admins update order status
- **API Endpoint:** `PUT /admin/orders/:id`
- **Technical Workflow:**
  - Verifies admin role
  - Updates order status
  - Sends notification to customer
- **Dependencies:** Supabase, auth utilities
- **Status:** ✅ Active

**`create-payment-intent.js`**
- **Purpose:** Create Stripe payment intent
- **User Workflow:** Users initiate payment
- **API Endpoint:** `POST /create-payment-intent`
- **Technical Workflow:**
  - Validates amount
  - Creates Stripe payment intent
  - Returns client secret
- **Dependencies:** Stripe SDK, auth utilities
- **Status:** ✅ Active - Critical for payments

**`stripe-webhook.js`**
- **Purpose:** Handle Stripe webhook events
- **User Workflow:** Updates order status after payment
- **API Endpoint:** `POST /webhooks/stripe`
- **Technical Workflow:**
  - Verifies webhook signature
  - Handles payment events (succeeded, failed, refunded)
  - Updates order status in database
- **Dependencies:** Stripe SDK, Supabase
- **Status:** ✅ Active - Critical for payment processing

**`register-push-token.js`**
- **Purpose:** Register mobile push notification token
- **User Workflow:** Mobile users receive push notifications
- **API Endpoint:** `POST /register-push-token`
- **Technical Workflow:**
  - Validates Expo push token
  - Stores token in user profile
- **Dependencies:** Supabase, auth utilities
- **Status:** ✅ Active

### Backend Utilities (backend/src/utils/)

**`auth.js`**
- **Purpose:** Authentication utilities
- **Technical Workflow:**
  - Verifies JWT tokens
  - Checks admin role
  - Extracts user from token
- **Dependencies:** Supabase
- **Dependents:** All protected Lambda handlers
- **Status:** ✅ Active - Critical security component

---

## Database & Migrations

### Supabase Migrations (supabase/migrations/)

**`20241015_create_get_business_overview_function.sql`**
- **Purpose:** Creates RPC function for business overview
- **User Workflow:** Admins see dashboard metrics
- **Status:** ✅ Active

**`20241015_create_rpc_functions_clean.sql`**
- **Purpose:** Creates clean RPC functions
- **Status:** ✅ Active

**`20241015_drop_existing_functions.sql`**
- **Purpose:** Drops old functions before recreation
- **Status:** ✅ Active

**`20241016_add_inventory_constraints.sql`**
- **Purpose:** Adds inventory constraints
- **Status:** ✅ Active

### Database Schema Files (database/)

**`admin_dashboard_functions.sql`**
- **Purpose:** Admin dashboard SQL functions
- **Functions:** Business metrics, analytics queries
- **Status:** ✅ Active

**`artist_portal_schema.sql`**
- **Purpose:** Artist portal database schema
- **Tables:** Artist profiles, portfolios, commissions
- **Status:** ✅ Active

**`notifications_schema.sql`**
- **Purpose:** Notification system schema
- **Tables:** Notifications, preferences
- **Status:** ✅ Active

**`recommendation_functions.sql`**
- **Purpose:** Recommendation engine SQL functions
- **Functions:** Collaborative filtering, content-based recommendations
- **Status:** ✅ Active

**`social_features_schema.sql`**
- **Purpose:** Social features schema
- **Tables:** Likes, follows, comments
- **Status:** ✅ Active

**`fix-admin-panel.sql`**
- **Purpose:** Fixes for admin panel
- **Status:** 🔧 Patch file

**`database/migrations/add_push_token_to_profiles.sql`**
- **Purpose:** Adds push token column to profiles
- **Status:** ✅ Active

### Supabase Functions (supabase/functions/)

**`create-payment-intent/index.ts`**
- **Purpose:** Supabase Edge Function for payment intents
- **Status:** ✅ Active (alternative to Lambda)

**`send-message-reply/index.ts`**
- **Purpose:** Send message replies
- **Status:** ✅ Active

**`_shared/cors.ts`** - CORS headers
**`_shared/stripe.ts`** - Stripe client
- **Purpose:** Shared utilities for Edge Functions
- **Status:** ✅ Active

### Supabase Configuration

**`supabase/config.toml`**
- **Purpose:** Supabase local development configuration
- **Status:** ✅ Active

---

## Orphaned & Deprecated Files

### Likely Orphaned (Recommend Deletion)

1. **Next.js Files** (Project uses Vite + React Router):
   - `next-env.d.ts`
   - `src/pages/page.tsx`
   - `src/pages/layout.tsx`
   - `src/pages/globals.css`
   - `src/pages/auth/login/page.tsx`
   - `src/pages/auth/signup/page.tsx`
   - `src/pages/create/page.tsx`

2. **Duplicate Files**:
   - `lib/` directory (root level) - duplicates `src/lib/`
   - `tailwind.config.js` (if `tailwind.config.ts` is active)
   - `src/components/ArtistDashboard.tsx` (if `src/components/artist/ArtistDashboard.tsx` is used)
   - `src/components/CheckoutPage.tsx` (if `src/pages/CheckoutPage.tsx` is used)

3. **Backup Files**:
   - `CreatePage_clean.txt`
   - `src/pages/CreatePage.tsx.backup`

4. **Unclear Usage**:
   - `directus.config.js` (check if Directus is used)
   - `src/lib/directus.ts`
   - `src/components/AudioPlayer.tsx`
   - `src/components/ProductPage.tsx`
   - `app.json` (root level - mobile has its own)

### Development/Testing Only

- `test-admin.js`
- `dashboard_test_queries.sql`
- `src/data/mockData.ts`
- `mobile/src/lib/api/mockData.ts`
- All files in `mobile/__tests__/`

---

## Dependency Graph Summary

### Critical User Workflows

**1. User Registration & Login**
```
LoginPage/SignUpPage → Supabase Auth → Profile Creation → Redirect to Account
```

**2. Create Custom Print (Primary Revenue)**
```
CreatePage → Image Upload (S3) → Product Creation (Supabase) → Add to Cart → CartContext Update
```

**3. Purchase Flow (Critical Revenue)**
```
CartPage → CheckoutPage → Stripe Payment → create-payment-intent (Lambda) → Order Creation → stripe-webhook → Order Confirmation
```

**4. Admin Order Management**
```
AdminOrdersPage → get-orders (Lambda) → Display Orders → update-order-status (Lambda) → Notification
```

**5. Artist Portal**
```
ArtistDashboard → Portfolio/Commissions/Analytics → Supabase Queries → Display Data
```

### Infrastructure Dependencies

**Authentication Flow:**
```
All Protected Pages → ProtectedRoute → Supabase Auth → JWT Token → Backend Verification
```

**File Upload Flow:**
```
CreatePage → generate-upload-url (Lambda) → S3 Presigned URL → Direct S3 Upload → antivirus-scan (Lambda)
```

**Payment Flow:**
```
CheckoutPage → create-payment-intent (Lambda) → Stripe → stripe-webhook (Lambda) → Order Update
```

---

## File Count Summary

- **Total Files:** 263 (excluding node_modules)
- **Web App (src/):** ~80 files
- **Mobile App (mobile/src/):** ~50 files
- **Backend (backend/):** ~10 files
- **Database Scripts:** ~15 files
- **Configuration Files:** ~20 files
- **Documentation Files:** ~15 files
- **Test Files:** ~5 files
- **Build Artifacts:** ~5 files
- **Orphaned/Deprecated:** ~15 files (recommended for cleanup)

---

## Recommendations

### Immediate Actions

1. **Remove Orphaned Files:**
   - Delete Next.js-related files
   - Remove duplicate files in `lib/` (root)
   - Clean up backup files

2. **Clarify Directus Usage:**
   - If not using Directus, remove `directus.config.js` and `src/lib/directus.ts`
   - If using, document integration

3. **Antivirus Implementation:**
   - `backend/src/handlers/antivirus-scan.js` is a placeholder
   - Implement production antivirus (ClamAV Lambda layer or third-party service)

4. **Documentation:**
   - Update README.md in root (currently missing)
   - Document which Tailwind config is active
   - Document mobile build process

### Code Quality

1. **Consolidate Duplicates:**
   - Determine if `src/components/ArtistDashboard.tsx` or `src/components/artist/ArtistDashboard.tsx` is canonical
   - Remove unused duplicate

2. **Type Safety:**
   - Ensure all Supabase types are up-to-date
   - Run type generation regularly

3. **Testing:**
   - Expand test coverage (currently minimal)
   - Add integration tests for critical workflows

---

**End of Inventory**

*This document provides a comprehensive overview of all 263 files in the ChartedArt codebase. Each file is categorized by purpose, user workflow impact, technical integration, dependencies, and status.*

