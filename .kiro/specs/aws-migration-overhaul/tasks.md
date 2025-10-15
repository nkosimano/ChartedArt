# Implementation Plan

- [x] 1. Project Setup and Preparation


  - Create feature branch `feature/aws-migration-overhaul`
  - Create `backend/` directory structure with `src/handlers/` and `src/utils/` subdirectories
  - Create `.env.example` file with all required environment variables documented
  - Install Framer Motion: `npm install framer-motion`
  - _Requirements: 11.1, 11.2, 12.1_



- [ ] 2. Eliminate Critical Security Vulnerability
  - Delete `src/lib/supabase/admin-client.ts` file
  - Remove all imports of `supabaseAdmin` from codebase (search and remove)



  - Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env` file
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ] 3. Create AWS SAM Infrastructure Template
  - Create `backend/template.yaml` with basic structure
  - Define API Gateway resource with CORS configuration and WAF integration


  - Define global Lambda function configuration (Node.js 20, 256MB memory, 10s timeout)
  - Add SAM parameters for Supabase URL, service key, and Stripe secret key
  - Configure JWT authorizer with Supabase issuer and audience
  - Add rate limiting and throttling configuration to API Gateway
  - _Requirements: 2.2, 2.3, 2.5, 2.6_

- [x] 4. Set Up S3 Bucket for File Storage


  - Add S3 bucket resource to `backend/template.yaml`
  - Configure bucket with public access blocking
  - Add CORS configuration for file uploads
  - Add lifecycle rule to delete unscanned files after 1 day
  - Configure S3 event notification for ObjectCreated events
  - _Requirements: 3.5, 3.6_



- [ ] 5. Implement Generate Upload URL Lambda Function
- [ ] 5.1 Create handler file and implement presigned URL generation
  - Create `backend/src/handlers/generate-upload-url.js`
  - Implement file type validation (jpeg, png, webp only)


  - Generate presigned S3 PUT URL with 5-minute expiration
  - Tag uploaded files with `scanned=false`
  - Return upload URL and file key to client
  - _Requirements: 3.1, 3.2_

- [x] 5.2 Add Lambda function definition to SAM template


  - Define `GenerateUploadUrlFunction` in `backend/template.yaml`
  - Add S3 write policy
  - Create POST `/generate-upload-url` API Gateway event
  - _Requirements: 3.1_



- [ ] 6. Implement Antivirus Scan Lambda Function
- [ ] 6.1 Create antivirus scan handler
  - Create `backend/src/handlers/antivirus-scan.js`
  - Implement S3 event trigger handling


  - Add file scanning logic (ClamAV or AWS Marketplace solution)
  - Update file tags based on scan result
  - Delete infected files and notify user
  - _Requirements: 3.3, 3.4_



- [ ] 6.2 Add antivirus function to SAM template
  - Define `AntivirusScanFunction` in `backend/template.yaml`
  - Configure S3 event trigger
  - Add S3 read/write/delete policies
  - _Requirements: 3.3_



- [ ] 7. Implement Admin Orders Lambda Functions
- [ ] 7.1 Create admin authorization utility
  - Create `backend/src/utils/auth.js`
  - Implement `verifyAdmin()` function to validate JWT and check admin role


  - Handle authentication and authorization errors
  - _Requirements: 4.3, 4.4_

- [ ] 7.2 Create get orders handler
  - Create `backend/src/handlers/get-orders.js`
  - Call `verifyAdmin()` to validate request


  - Query orders with related profiles and order items from Supabase
  - Return formatted order list
  - _Requirements: 4.1_

- [x] 7.3 Create update order status handler


  - Create `backend/src/handlers/update-order-status.js`
  - Call `verifyAdmin()` to validate request
  - Update order status in Supabase
  - Return updated order
  - _Requirements: 4.2_



- [ ] 7.4 Add admin functions to SAM template
  - Define `GetOrdersFunction` with GET `/admin/orders` endpoint
  - Define `UpdateOrderStatusFunction` with PUT `/admin/orders/{id}` endpoint
  - Configure JWT authorizer for both endpoints
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 8. Implement Order Creation Lambda Function
- [ ] 8.1 Create order creation handler
  - Create `backend/src/handlers/create-order.js`
  - Validate cart items and calculate totals
  - Create order record in Supabase with transaction


  - Clear user's cart after successful order creation
  - Return order confirmation with order ID
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8.2 Add order creation function to SAM template

  - Define `CreateOrderFunction` in `backend/template.yaml`
  - Create POST `/orders` API Gateway event
  - Configure JWT authorizer
  - _Requirements: 5.1, 5.5_

- [ ] 9. Implement Payment Intent Lambda Function
- [ ] 9.1 Create payment intent handler
  - Create `backend/src/handlers/create-payment-intent.js`


  - Validate payment amount (minimum $0.50)
  - Create Stripe payment intent using secret key from environment
  - Return only client secret to frontend
  - _Requirements: 6.1, 6.2, 6.3_


- [ ] 9.2 Add payment intent function to SAM template
  - Define `CreatePaymentIntentFunction` in `backend/template.yaml`
  - Create POST `/create-payment-intent` API Gateway event
  - Configure JWT authorizer



  - _Requirements: 6.1_

- [ ]* 9.3 Create Stripe webhook handler
  - Create `backend/src/handlers/stripe-webhook.js`


  - Verify webhook signature
  - Handle payment success and failure events
  - Update order status in database
  - _Requirements: 6.5_



- [ ] 10. Create Frontend API Client Layer
- [ ] 10.1 Create base API client
  - Create `src/lib/api/client.ts`
  - Implement `fetchAPI()` helper with JWT token injection
  - Create `APIError` class for error handling


  - Add retry logic for network failures
  - _Requirements: 1.2_

- [x] 10.2 Implement API client methods

  - Add `api.orders.create()` method
  - Add `api.orders.list()` method for admin
  - Add `api.orders.update()` method for admin
  - Add `api.payments.createIntent()` method
  - Add `api.uploads.generateUrl()` method
  - _Requirements: 1.2, 4.1, 4.2, 5.1, 6.1, 3.1_



- [ ] 11. Refactor Admin Pages to Use API Client
- [ ] 11.1 Update AdminOrdersPage
  - Replace `supabaseAdmin` calls with `api.orders.list()`

  - Update error handling to use `APIError`
  - Add loading states during API calls
  - _Requirements: 1.1, 1.2, 4.1_

- [ ] 11.2 Update order status update logic
  - Replace direct Supabase calls with `api.orders.update()`



  - Add optimistic UI updates
  - Handle errors with user-friendly messages
  - _Requirements: 4.2_



- [ ] 11.3 Update ArchivePage
  - Remove `supabaseAdmin` imports
  - Use regular `supabase` client with API endpoints
  - Update data fetching logic
  - _Requirements: 1.1, 1.2_

- [x] 12. Refactor File Upload Flow

- [ ] 12.1 Update CreatePage file upload
  - Replace direct Supabase storage upload with two-step process
  - Call `api.uploads.generateUrl()` to get presigned URL
  - Upload file directly to S3 using presigned URL
  - Store returned file key in database
  - _Requirements: 3.1, 3.2_



- [ ] 12.2 Add upload progress and error handling
  - Show upload progress indicator
  - Handle upload failures with retry option
  - Display success confirmation

  - _Requirements: 3.1_

- [ ] 13. Refactor Order Creation Flow
- [ ] 13.1 Update CheckoutPage order creation
  - Replace direct Supabase order creation with `api.orders.create()`
  - Pass cart items and shipping address to API


  - Handle validation errors from backend
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 13.2 Update order confirmation flow
  - Navigate to confirmation page on success
  - Display order ID and details

  - Clear local cart state
  - _Requirements: 5.3_

- [ ] 14. Refactor Payment Processing Flow
- [ ] 14.1 Update PaymentForm component
  - Replace Supabase function call with `api.payments.createIntent()`
  - Use returned client secret with Stripe Elements

  - Handle payment intent creation errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 14.2 Update payment confirmation handling
  - Verify payment status after Stripe confirmation
  - Update order status
  - Show success/failure messages
  - _Requirements: 6.3_


- [ ] 15. Implement Design System Updates
- [ ] 15.1 Update Tailwind configuration with production color palette
  - Update `tailwind.config.js` with new color system: Sage (primary), Cream (background), Terracotta (accent), Lavender (support), Charcoal (text)
  - Add semantic colors: Soft Green (success), Warming Red (error), Amber (warning), Soft Blue (info)
  - Define all color shades (50, 100, 300, 400) for each color family

  - Remove old color definitions (sienna, mustard, brown) if not matching new spec
  - _Requirements: 7.2, 7.4_

- [ ] 15.2 Add custom CSS animations and utilities
  - Add `@keyframes gradient-x` for animated gradient backgrounds
  - Add `.animate-ripple` utility with ripple effect on button press


  - Add `@keyframes pulse-success` with green box-shadow pulse
  - Add `@keyframes shake-error` for horizontal shake on validation errors
  - Add `@keyframes glow-warning` for amber glow effect
  - Create utility classes: `.animate-gradient-x`, `.animate-ripple`, `.animate-pulse-success`, `.animate-shake-error`, `.animate-glow-warning`
  - _Requirements: 7.3_


- [ ] 15.3 Configure accessibility and motion preferences
  - Add `prefers-reduced-motion` media query to disable non-critical animations
  - Ensure all color combinations meet WCAG AA contrast requirements
  - Add visible focus outlines with distinct colors for all interactive elements
  - _Requirements: 7.4_

- [x] 16. Implement Page Transition Animations

- [ ] 16.1 Update RootLayout with AnimatePresence
  - Import `AnimatePresence` and `motion` from Framer Motion
  - Wrap `<Outlet />` with `AnimatePresence` component
  - Add `motion.main` wrapper with page transition variants
  - Key animations by `location.pathname`
  - _Requirements: 8.1, 8.2, 8.4, 8.5_



- [ ] 16.2 Configure transition timing
  - Set transition duration to 500ms
  - Use `easeInOut` easing function
  - Configure `mode="wait"` for AnimatePresence

  - _Requirements: 8.3_

- [ ] 17. Implement Interactive Component Animations
- [ ] 17.1 Create animation variants library
  - Create `src/components/animations/variants.ts`
  - Define page transition variants: `initial={{ opacity: 0, y: 30 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: 50 }}`
  - Define button variants: `buttonHover` (scale 1.05), `buttonTap` (scale 0.95)

  - Define feedback variants: `fadeIn`, `slideUp`, `staggerChildren`
  - Export all reusable animation configurations
  - _Requirements: 9.1, 9.2_

- [ ] 17.2 Update button components with hover/tap/ripple animations
  - Convert primary action buttons to `motion.button`

  - Add `whileHover={{ scale: 1.05 }}` with color transition
  - Add `whileTap={{ scale: 0.95 }}` for tactile feedback
  - Add `.animate-ripple` class for Sage/Cream ripple effect on click
  - Apply to all CTA buttons: Sign Up, Log In, Add to Cart, Checkout, Submit forms

  - _Requirements: 9.1, 9.2_

- [ ] 17.3 Implement form state animations
  - Update form components to use `FormStatus` type ('idle' | 'loading' | 'success' | 'error')
  - Add gradient spinner animation during submission (`.animate-gradient-x`)
  - Add shake animation to error inputs using `animate-shake-error` class
  - Add success feedback with pulse animation (`.animate-pulse-success`)
  - Add toast notifications with slide-in/fade-out animations

  - Apply to LoginPage, SignUpPage, CreatePage, CheckoutPage, AccountPage
  - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [ ] 17.4 Implement gallery and card animations
  - Add scale and gradient sweep on hover for gallery tiles
  - Add bounce with drop shadow on tap/click
  - Use Framer Motion for smooth transitions

  - Implement stagger animation for grid items
  - _Requirements: 9.1, 9.2_

- [ ] 17.5 Implement accordion/FAQ animations
  - Add chevron SVG rotation on expand/collapse
  - Add slide-in/out animation for panel content

  - Use Framer Motion `AnimatePresence` for smooth transitions
  - _Requirements: 9.1_

- [ ] 18. Create CI/CD Pipeline Configuration
- [ ] 18.1 Create buildspec.yml
  - Define install phase with Node.js 20 runtime
  - Add pre_build phase for linting and tests

  - Add build phase for frontend and SAM backend
  - Add post_build phase for SAM packaging
  - Define artifacts output
  - _Requirements: 10.2, 10.3, 10.4_

- [x] 18.2 Configure AWS CodePipeline

  - Create pipeline with Source, Build, and Deploy stages
  - Connect to GitHub repository
  - Configure CodeBuild project with buildspec.yml
  - Set up deployment to Lambda and S3
  - _Requirements: 10.1, 10.5_


- [ ] 19. Environment Configuration and Documentation
- [ ] 19.1 Update environment variable documentation
  - Document all `VITE_*` variables in `.env.example`
  - Add comments explaining each variable's purpose
  - Separate variables by service (Supabase, AWS, Stripe, Google Maps)
  - Ensure no service-level keys (service role, secret keys) use `VITE_` prefix
  - _Requirements: 11.1, 11.2, 11.3_


- [ ] 19.2 Create deployment documentation
  - Document SAM deployment commands (`sam build`, `sam deploy --guided`)
  - Create README for backend setup with prerequisites
  - Document environment-specific configurations (dev, staging, production)
  - Add API documentation with endpoint descriptions and examples
  - _Requirements: 11.4_


- [ ] 19.3 Add monitoring and logging configuration
  - Configure CloudWatch log groups for all Lambda functions
  - Set up CloudWatch alarms for error rates and latency
  - Configure Sentry for frontend error tracking
  - Document alerting thresholds and escalation procedures

  - _Requirements: 11.4_

- [ ] 20. Deploy and Test Backend Infrastructure
- [ ] 20.1 Deploy SAM application to AWS
  - Run `sam build` to build Lambda functions

  - Run `sam deploy --guided` for initial deployment
  - Save deployment configuration
  - Verify all resources created successfully
  - _Requirements: 2.1, 2.4, 12.2_


- [ ] 20.2 Update frontend environment variables
  - Add `VITE_API_GATEWAY_URL` with deployed API Gateway URL
  - Update `.env` and `.env.example` files
  - _Requirements: 11.5_

- [ ] 20.3 Test all API endpoints
  - Test order creation endpoint

  - Test admin orders endpoints
  - Test payment intent creation
  - Test file upload URL generation
  - Verify JWT authorization works correctly
  - _Requirements: 12.3_


- [ ] 21. Integration Testing and Validation
- [ ] 21.1 Test complete user flows
  - Test user registration and login
  - Test artwork creation with file upload
  - Test cart and checkout flow

  - Test payment processing
  - Test order confirmation
  - _Requirements: 12.3, 12.5_

- [ ] 21.2 Test admin flows
  - Test admin login

  - Test viewing all orders
  - Test updating order status
  - Verify non-admin users cannot access admin endpoints
  - _Requirements: 12.3_

- [x] 21.3 Verify animations and UX

  - Test page transitions on all routes
  - Verify button hover and tap animations
  - Test form loading and error states
  - Verify animation performance (60fps)
  - _Requirements: 12.5_


- [ ] 22. Implement Additional Backend Features
- [ ] 22.1 Add archive order Lambda function
  - Create `backend/src/handlers/archive-order.js`
  - Implement admin authorization check
  - Update order status to archived in database
  - Return updated order with success status
  - _Requirements: 4.2_


- [ ] 22.2 Add unarchive order Lambda function
  - Create `backend/src/handlers/unarchive-order.js`
  - Implement admin authorization check
  - Update order status to restore from archive
  - Return updated order with success status

  - _Requirements: 4.2_

- [ ] 22.3 Add refund payment Lambda function
  - Create `backend/src/handlers/refund-payment.js`
  - Implement admin authorization check
  - Process Stripe refund using payment intent ID

  - Update order status in database
  - Return refund confirmation
  - _Requirements: 6.1_

- [ ] 22.4 Add Lambda functions to SAM template
  - Define `ArchiveOrderFunction` with PUT `/admin/orders/{id}/archive` endpoint
  - Define `UnarchiveOrderFunction` with PUT `/admin/orders/{id}/unarchive` endpoint

  - Define `RefundPaymentFunction` with POST `/admin/orders/{id}/refund` endpoint
  - Configure JWT authorizer and admin role validation
  - _Requirements: 4.1, 4.2, 6.1_

- [ ] 23. Implement Gallery and Like Features
- [x] 23.1 Add like/unlike Lambda function

  - Create `backend/src/handlers/like-artwork.js`
  - Validate user authentication
  - Toggle like status in database
  - Return updated like count and user's like status
  - _Requirements: 5.1_

- [ ] 23.2 Add gallery filter Lambda function
  - Create `backend/src/handlers/filter-gallery.js`

  - Implement search and filter logic (by tags, artist, date)
  - Return filtered artwork list with pagination
  - _Requirements: 5.1_

- [ ] 23.3 Update API client with gallery methods
  - Add `api.gallery.like()` method
  - Add `api.gallery.unlike()` method
  - Add `api.gallery.filter()` method


  - _Requirements: 5.1_

- [ ] 23.4 Update GalleryPage with animations
  - Implement tile scale and gradient sweep on hover
  - Add bounce animation on tap/click
  - Add fade-in/out for filtered results
  - Implement stagger animation for grid items
  - _Requirements: 9.1, 9.2_

- [ ] 24. Implement Email Notifications with AWS SES
- [ ] 24.1 Configure AWS SES in SAM template
  - Add SES permissions to Lambda execution role
  - Configure verified sender email address
  - Add email templates for order confirmation, status updates
  - _Requirements: 5.3_

- [ ] 24.2 Create email notification utility
  - Create `backend/src/utils/email.js`
  - Implement `sendOrderConfirmation()` function
  - Implement `sendOrderStatusUpdate()` function
  - Implement `sendPasswordReset()` function
  - _Requirements: 5.3_

- [ ] 24.3 Integrate email notifications in handlers
  - Add email notification to order creation handler
  - Add email notification to order status update handler
  - Add email notification to refund handler
  - _Requirements: 5.3_

- [ ] 25. Security Validation and Hardening
- [ ] 25.1 Verify no secrets in client bundle
  - Build production frontend
  - Inspect bundle for any service keys
  - Verify only public keys (VITE_ prefixed) are present
  - Run automated secrets scanning tool
  - _Requirements: 1.1, 1.3_

- [ ] 25.2 Test authorization and authentication
  - Verify JWT validation on all protected endpoints
  - Test admin-only endpoint access control
  - Test expired token handling
  - Test MFA/2FA flow for admin users
  - _Requirements: 4.3, 4.4_

- [ ] 25.3 Test file upload security
  - Verify file type validation (client and server)
  - Test presigned URL expiration (5 minutes)
  - Verify antivirus scanning triggers on upload
  - Test infected file quarantine and deletion
  - Test file size limits
  - _Requirements: 3.3, 3.4_

- [ ] 25.4 Configure WAF and rate limiting
  - Set up AWS WAF rules for API Gateway
  - Configure rate limiting per user and per IP
  - Add bot detection and CAPTCHA for public endpoints
  - Test rate limit enforcement
  - _Requirements: 2.6_

- [ ] 25.5 Enable database Row-Level Security (RLS)
  - Review and enable RLS policies on all Supabase tables
  - Test that users can only access their own data
  - Verify admin access patterns work correctly
  - _Requirements: 1.5_

- [ ] 26. Production Readiness and Compliance
- [ ] 26.1 Set up monitoring and alerting
  - Configure CloudWatch dashboards for Lambda metrics
  - Set up alarms for error rates, latency, and throttling
  - Configure Sentry for frontend error tracking
  - Set up LogRocket for session replay
  - Test alert notifications
  - _Requirements: 10.5_

- [ ] 26.2 Implement automated backups
  - Configure Supabase PITR (Point-in-Time Recovery)
  - Set up automated database backups
  - Document backup restoration procedures
  - Test backup and restore process
  - _Requirements: 2.4_

- [ ] 26.3 Create legal and compliance documentation
  - Create Terms of Service page
  - Create Privacy Policy page
  - Create Cookie Policy page
  - Create Refund Policy page
  - Ensure GDPR compliance (data retention, right to deletion)
  - Ensure PCI-DSS compliance for payment processing
  - _Requirements: 12.5_

- [ ] 26.4 Perform accessibility audit
  - Run automated accessibility testing (axe, Lighthouse)
  - Test keyboard navigation on all pages
  - Verify ARIA labels on all interactive elements
  - Test with screen readers
  - Verify color contrast meets WCAG AA standards
  - Test with `prefers-reduced-motion` enabled
  - _Requirements: 7.4, 9.6_

- [ ] 26.5 Create production launch checklist
  - Verify all features implemented and tested
  - Verify all secrets are server-side only
  - Verify monitoring and alerting is active
  - Verify backups are configured
  - Verify legal documentation is published
  - Verify accessibility standards are met
  - Create release notes and user documentation
  - _Requirements: 12.5_
