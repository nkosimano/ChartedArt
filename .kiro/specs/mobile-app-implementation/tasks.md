# Implementation Plan

- [x] 1. Set up core infrastructure and API client


  - Create API client with authentication token injection
  - Set up Supabase client for authentication
  - Configure environment variables for backend URL
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.1 Create API client module



  - Implement HTTP methods (GET, POST, PUT, DELETE)
  - Add automatic auth token injection to headers
  - Add error handling and network status detection
  - _Requirements: 3.1, 3.2, 3.3, 3.4_



- [ ] 1.2 Create Supabase client module
  - Initialize Supabase with URL and anon key
  - Implement signIn, signUp, signOut methods


  - Set up session management with expo-secure-store
  - _Requirements: 1.2, 1.3, 1.6_


- [ ] 1.3 Create authentication context and hook
  - Implement AuthContext with user and session state
  - Create useAuth hook with authentication methods
  - Handle session persistence and restoration
  - _Requirements: 1.2, 1.3, 1.4, 1.6_



- [ ] 2. Implement authentication screens
  - Create LoginScreen with email/password inputs
  - Create SignUpScreen with validation
  - Add error handling and loading states


  - _Requirements: 1.1, 1.2, 1.5, 1.6_

- [ ] 2.1 Create LoginScreen component
  - Build form with email and password inputs


  - Add login button with loading state
  - Implement error message display
  - Connect to useAuth hook
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 2.2 Create SignUpScreen component


  - Build form with email, password, and confirm password
  - Add password validation and strength indicator
  - Implement error message display
  - Connect to useAuth hook

  - _Requirements: 1.1, 1.2, 1.5_


- [ ] 3. Set up navigation structure
  - Create AuthStack for login/signup screens
  - Create MainTabs with Home, Create, Cart, Account
  - Implement conditional routing based on auth state
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3.1 Create navigation configuration
  - Set up AuthStack navigator with Login and SignUp screens
  - Set up MainTabs navigator with bottom tabs
  - Configure tab icons and labels
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.2 Implement root navigation logic
  - Check authentication state on app launch
  - Conditionally render AuthStack or MainTabs
  - Handle navigation after login/logout
  - _Requirements: 2.5, 1.3, 1.6_

- [x] 4. Implement image picker and upload functionality

  - Create useImagePicker hook
  - Integrate expo-image-picker for camera/gallery
  - Implement S3 upload with presigned URLs
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.1 Create useImagePicker hook


  - Implement pickImage method for gallery selection
  - Implement takePhoto method for camera capture
  - Request necessary permissions
  - _Requirements: 4.1, 4.2_



- [ ] 4.2 Implement image upload logic
  - Call /generate-upload-url endpoint

  - Upload image to S3 using expo-file-system
  - Handle upload progress and errors
  - _Requirements: 4.3, 4.4, 4.8_

- [ ] 5. Build CreateScreen with full functionality
  - Add image picker buttons
  - Implement size and frame selection


  - Add price calculation and display
  - Implement add to cart functionality
  - _Requirements: 4.1, 4.2, 4.5, 4.6, 4.7, 4.9_

- [x] 5.1 Update CreateScreen UI


  - Add buttons for camera and gallery selection
  - Display selected image preview
  - Create size selector component
  - Create frame selector component


  - _Requirements: 4.1, 4.2, 4.5_

- [x] 5.2 Implement product configuration logic


  - Calculate price based on size and frame selection
  - Display price dynamically
  - Validate selections before adding to cart
  - _Requirements: 4.6_

- [x] 5.3 Implement add to cart functionality


  - Call POST /cart endpoint with product data
  - Show success feedback with animation
  - Provide options to continue shopping or view cart
  - _Requirements: 4.7, 4.9_



- [ ] 6. Complete cart functionality
  - Create useCart hook with full CRUD operations
  - Implement quantity update functionality

  - Add pull-to-refresh for cart data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8_

- [ ] 6.1 Create useCart hook
  - Implement fetchCart method
  - Implement updateQuantity method


  - Implement removeItem method
  - Calculate totalAmount and itemCount
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_


- [ ] 6.2 Update CartScreen with full functionality
  - Connect to useCart hook
  - Implement pull-to-refresh
  - Add loading states
  - Handle empty cart state

  - _Requirements: 5.6, 5.7, 5.8_

- [x] 7. Implement checkout and payment flow

  - Create CheckoutScreen
  - Integrate Stripe payment sheet
  - Handle payment success and failure
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 7.1 Create CheckoutScreen component


  - Display order summary
  - Show total amount


  - Add checkout button
  - _Requirements: 6.1_


- [ ] 7.2 Integrate Stripe payment sheet
  - Call POST /create-payment-intent endpoint


  - Initialize Stripe payment sheet with clientSecret
  - Handle payment confirmation

  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 7.3 Handle payment completion
  - Call POST /orders endpoint on success

  - Navigate to order confirmation screen

  - Handle payment errors with retry option
  - Clear cart after successful order
  - _Requirements: 6.5, 6.6, 6.7, 6.8_

- [ ] 8. Create Gallery and Order History screens
  - Create GalleryScreen with grid layout

  - Create OrderHistoryScreen with list view
  - Create OrderDetailScreen
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ] 8.1 Create GalleryScreen
  - Fetch gallery data from GET /gallery endpoint
  - Display items in grid layout

  - Implement tap to view details
  - Add reorder functionality
  - _Requirements: 7.2, 7.3, 7.4_

- [ ] 8.2 Create OrderHistoryScreen
  - Fetch orders from GET /orders endpoint
  - Display orders in FlatList

  - Show order status, date, and total
  - Implement tap to view details
  - _Requirements: 7.5, 7.6, 7.7_


- [ ] 8.3 Create OrderDetailScreen
  - Display detailed order information
  - Show order items with images
  - Display tracking information if available
  - Add reorder option


  - _Requirements: 7.7_

- [ ] 9. Build Account screen and profile management
  - Create AccountScreen with navigation options
  - Implement profile viewing and editing
  - Add logout functionality

  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 9.1 Create AccountScreen
  - Fetch profile data from GET /profile endpoint

  - Display user information
  - Add navigation to Gallery and Order History
  - Add logout button
  - _Requirements: 8.1, 8.5_

- [x] 9.2 Implement profile editing

  - Create editable form fields
  - Implement save functionality
  - Call profile update endpoint
  - Show success/error feedback
  - _Requirements: 8.2, 8.3, 8.4, 8.6_


- [ ] 10. Implement push notifications
  - Request notification permissions
  - Store push token in backend
  - Handle notification taps

  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 10.1 Set up push notification permissions
  - Request permissions on first launch

  - Obtain push token using expo-notifications
  - Handle permission denial gracefully
  - _Requirements: 9.1, 9.2, 9.7_

- [ ] 10.2 Integrate with backend
  - Create POST /push-token Lambda endpoint

  - Send push token to backend for storage
  - Update update-order-status Lambda to send notifications
  - _Requirements: 9.3, 9.4, 9.5_

- [ ] 10.3 Handle notification interactions
  - Set up notification listeners

  - Navigate to relevant screen on tap
  - Display in-app notifications
  - _Requirements: 9.6_



- [ ] 11. Implement offline support and caching
  - Set up AsyncStorage for data caching
  - Implement cache for orders and gallery
  - Add connectivity detection
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_


- [ ] 11.1 Create caching utilities
  - Implement cache storage functions
  - Add cache retrieval functions
  - Implement cache invalidation logic
  - _Requirements: 10.1, 10.2_


- [ ] 11.2 Add offline support to screens
  - Display cached data when offline
  - Show connectivity indicator
  - Sync data when connectivity restored
  - Handle stale data appropriately
  - _Requirements: 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12. Add animations and polish
  - Implement loading animations
  - Add success/error feedback animations
  - Polish screen transitions
  - _Requirements: Design animations section_

- [ ] 12.1 Create animation utilities
  - Implement shake animation for errors
  - Implement fade-in animation for success
  - Create loading spinner variations
  - _Requirements: Design animations section_

- [ ] 12.2 Apply animations throughout app
  - Add button press feedback
  - Animate cart item additions
  - Animate screen transitions
  - Add pull-to-refresh animations
  - _Requirements: Design animations section_
