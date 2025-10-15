# Requirements Document

## Introduction

The ChartedArt mobile application is a native iOS app built with React Native and Expo that provides users with a mobile-first experience for creating, purchasing, and managing custom art prints. The app will leverage the existing AWS serverless backend infrastructure, acting as a new client without requiring backend modifications. This spec focuses on completing the remaining 70-80% of features needed to bring the mobile app to feature parity with the web application.

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely sign up and log in to my ChartedArt account on my mobile device, so that I can access my personalized content and make purchases.

#### Acceptance Criteria

1. WHEN a user opens the app for the first time THEN the system SHALL display authentication screens (login or sign up)
2. WHEN a user enters valid credentials and submits the login form THEN the system SHALL authenticate via Supabase and store the session securely using expo-secure-store
3. WHEN a user successfully authenticates THEN the system SHALL navigate to the main app experience with bottom tab navigation
4. WHEN a user's session expires THEN the system SHALL redirect to the authentication flow
5. IF a user enters invalid credentials THEN the system SHALL display an appropriate error message
6. WHEN a user logs out THEN the system SHALL clear the secure session storage and return to the authentication screens

### Requirement 2: Navigation Structure

**User Story:** As a user, I want intuitive navigation between different sections of the app, so that I can easily access all features.

#### Acceptance Criteria

1. WHEN a user is not authenticated THEN the system SHALL display a stack navigator with Login and Sign Up screens
2. WHEN a user is authenticated THEN the system SHALL display a bottom tab navigator with Home, Create, Cart, and Account tabs
3. WHEN a user taps a tab THEN the system SHALL navigate to the corresponding screen with native transition animations
4. WHEN a user navigates deeper into a section THEN the system SHALL use stack navigation with native back gestures
5. WHEN the app initializes THEN the system SHALL check for an existing session and route accordingly

### Requirement 3: API Client and Backend Integration

**User Story:** As a developer, I want a centralized API client that handles authentication and requests to the AWS backend, so that all screens can easily communicate with the backend.

#### Acceptance Criteria

1. WHEN the API client is initialized THEN the system SHALL configure the base URL for the AWS Lambda backend
2. WHEN making an API request THEN the system SHALL automatically include the authentication token in headers
3. WHEN a request fails due to authentication THEN the system SHALL redirect the user to login
4. WHEN a request fails due to network issues THEN the system SHALL display an appropriate error message
5. WHEN the user's token is refreshed THEN the system SHALL update the stored token automatically

### Requirement 4: Image Upload and Print Creation

**User Story:** As a user, I want to select or capture photos from my mobile device and create custom art prints, so that I can easily turn my memories into physical products.

#### Acceptance Criteria

1. WHEN a user navigates to the Create screen THEN the system SHALL provide options to select from camera roll or take a new photo
2. WHEN a user selects an image THEN the system SHALL display a preview of the selected image
3. WHEN the image is selected THEN the system SHALL call the /generate-upload-url Lambda endpoint to obtain a presigned S3 URL
4. WHEN the presigned URL is received THEN the system SHALL upload the selected image directly to S3 using expo-file-system
5. WHEN the upload completes THEN the system SHALL display size and frame selection options
6. WHEN a user selects size and frame options THEN the system SHALL calculate and display the price
7. WHEN a user taps "Add to Cart" THEN the system SHALL call the POST /cart Lambda endpoint with the product configuration
8. IF the upload fails THEN the system SHALL display an error message with retry option
9. WHEN an item is successfully added to cart THEN the system SHALL provide visual feedback and option to continue shopping or view cart

### Requirement 5: Shopping Cart Functionality

**User Story:** As a user, I want to view and manage items in my shopping cart on my mobile device, so that I can review my selections before purchasing.

#### Acceptance Criteria

1. WHEN a user navigates to the Cart screen THEN the system SHALL fetch cart data from the GET /cart Lambda endpoint
2. WHEN cart data is received THEN the system SHALL display items in a FlatList with product images, descriptions, and prices
3. WHEN a user taps quantity buttons THEN the system SHALL update the quantity via the backend API
4. WHEN a user taps remove on a cart item THEN the system SHALL call the DELETE /cart/{itemId} endpoint
5. WHEN an item is removed THEN the system SHALL update the cart display and recalculate the total
6. IF the cart is empty THEN the system SHALL display an empty state message with a call-to-action to create prints
7. WHEN cart data is loading THEN the system SHALL display a native loading indicator
8. WHEN the cart screen is pulled down THEN the system SHALL refresh the cart data

### Requirement 6: Checkout and Payment Processing

**User Story:** As a user, I want to securely complete my purchase using my mobile device, so that I can receive my custom art prints.

#### Acceptance Criteria

1. WHEN a user taps "Checkout" from the cart THEN the system SHALL navigate to the checkout screen
2. WHEN the checkout screen loads THEN the system SHALL call POST /create-payment-intent Lambda to obtain a Stripe clientSecret
3. WHEN the clientSecret is received THEN the system SHALL initialize the Stripe React Native payment sheet
4. WHEN a user enters payment information and confirms THEN the Stripe SDK SHALL process the payment securely
5. IF payment succeeds THEN the system SHALL call POST /orders Lambda to finalize the order
6. WHEN the order is finalized THEN the system SHALL display a success message and navigate to order confirmation
7. IF payment fails THEN the system SHALL display an error message and allow the user to retry
8. WHEN payment is processing THEN the system SHALL display a loading state and prevent duplicate submissions

### Requirement 7: Gallery and Order History

**User Story:** As a user, I want to view my past orders and gallery of created prints on my mobile device, so that I can track my purchases and reorder favorites.

#### Acceptance Criteria

1. WHEN a user navigates to the Account screen THEN the system SHALL display options for Gallery and Order History
2. WHEN a user taps Gallery THEN the system SHALL fetch gallery data from the GET /gallery Lambda endpoint
3. WHEN gallery data is received THEN the system SHALL display items in a scrollable grid layout optimized for mobile
4. WHEN a user taps on a gallery item THEN the system SHALL display full details and option to reorder
5. WHEN a user taps Order History THEN the system SHALL fetch order data from GET /orders endpoint
6. WHEN order data is received THEN the system SHALL display orders in a FlatList with order status, date, and items
7. WHEN a user taps on an order THEN the system SHALL display detailed order information including tracking if available
8. IF no orders exist THEN the system SHALL display an empty state with encouragement to create first order

### Requirement 8: User Profile Management

**User Story:** As a user, I want to view and update my profile information on my mobile device, so that I can manage my account settings and preferences.

#### Acceptance Criteria

1. WHEN a user navigates to the Account screen THEN the system SHALL fetch profile data from GET /profile endpoint
2. WHEN profile data is received THEN the system SHALL display user information in native form components
3. WHEN a user updates profile information and saves THEN the system SHALL call the appropriate update endpoint
4. WHEN profile update succeeds THEN the system SHALL display success feedback and refresh the display
5. WHEN a user taps "Log Out" THEN the system SHALL clear session and return to authentication flow
6. IF profile data fails to load THEN the system SHALL display an error message with retry option

### Requirement 9: Push Notifications

**User Story:** As a user, I want to receive push notifications about my order status, so that I stay informed about shipping and delivery.

#### Acceptance Criteria

1. WHEN a user first launches the app THEN the system SHALL request push notification permissions
2. IF the user grants permission THEN the system SHALL obtain a push token using expo-notifications
3. WHEN a push token is obtained THEN the system SHALL send it to a POST /push-token Lambda endpoint for storage
4. WHEN an order status changes to "shipped" THEN the backend SHALL send a push notification to the user's device
5. WHEN an order status changes to "delivered" THEN the backend SHALL send a push notification to the user's device
6. WHEN a user taps a notification THEN the system SHALL navigate to the relevant order details screen
7. IF the user denies permission THEN the system SHALL continue to function without push notifications

### Requirement 10: Offline Support and Data Caching

**User Story:** As a user, I want to view my order history and gallery even when offline, so that I can access my content regardless of connectivity.

#### Acceptance Criteria

1. WHEN the app fetches order history THEN the system SHALL cache the data locally using AsyncStorage
2. WHEN the app fetches gallery data THEN the system SHALL cache the data locally
3. WHEN the user is offline and navigates to cached screens THEN the system SHALL display the cached data
4. WHEN the user is offline THEN the system SHALL display a connectivity indicator
5. WHEN connectivity is restored THEN the system SHALL sync with the backend and update cached data
6. WHEN the user attempts to create or purchase while offline THEN the system SHALL display a message requiring connectivity
7. IF cached data is stale (older than 24 hours) THEN the system SHALL indicate this to the user
