# Design Document

## Overview

The ChartedArt mobile app will be built using React Native with Expo, providing a native iOS experience that connects to the existing AWS serverless backend. The architecture follows a component-based approach with clear separation between UI, business logic, and data layers. The app will use React Navigation for routing, Supabase for authentication, Stripe for payments, and AsyncStorage for offline caching.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                          │
│  ├─ Screens (Auth, Home, Create, Cart, Checkout, etc.)     │
│  ├─ Components (Button, Card, LoadingSpinner, etc.)        │
│  └─ Navigation (Auth Stack, Main Tabs)                     │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                        │
│  ├─ Hooks (useAuth, useCart, useOrders, useGallery)       │
│  ├─ Context (AuthContext, CartContext)                     │
│  └─ Utils (validation, formatting, animations)             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├─ API Client (HTTP requests with auth)                   │
│  ├─ Supabase Client (authentication)                       │
│  ├─ Stripe Client (payments)                               │
│  └─ Storage (AsyncStorage for caching)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Existing AWS Serverless Backend                 │
│  ├─ Lambda Functions (API endpoints)                        │
│  ├─ S3 (image storage)                                      │
│  ├─ DynamoDB (data storage)                                 │
│  └─ Stripe (payment processing)                             │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Structure

```
App Root
├─ AuthStack (when not authenticated)
│  ├─ LoginScreen
│  └─ SignUpScreen
│
└─ MainTabs (when authenticated)
   ├─ HomeTab
   │  └─ HomeScreen
   ├─ CreateTab
   │  ├─ CreateScreen
   │  └─ PreviewScreen
   ├─ CartTab
   │  ├─ CartScreen
   │  └─ CheckoutScreen
   └─ AccountTab
      ├─ AccountScreen
      ├─ GalleryScreen
      ├─ OrderHistoryScreen
      └─ OrderDetailScreen
```

## Components and Interfaces

### Core Components

#### 1. Authentication Components

**LoginScreen**
- Email/password input fields
- Login button with loading state
- Link to sign up screen
- Error message display
- Integration with Supabase auth

**SignUpScreen**
- Email/password/confirm password fields
- Sign up button with loading state
- Link to login screen
- Password strength indicator
- Error message display

#### 2. API Client

**Location:** `mobile/src/lib/api/client.ts`

```typescript
interface APIClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
  uploadImage(uri: string, presignedUrl: string): Promise<void>;
}
```

**Features:**
- Automatic auth token injection
- Request/response interceptors
- Error handling and retry logic
- Network status detection

#### 3. Supabase Client

**Location:** `mobile/src/lib/supabase/client.ts`

```typescript
interface SupabaseClient {
  signIn(email: string, password: string): Promise<Session>;
  signUp(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(callback: (session: Session | null) => void): void;
}
```

#### 4. Custom Hooks

**useAuth**
```typescript
interface UseAuth {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**useCart**
```typescript
interface UseCart {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  addItem: (item: CartItemInput) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalAmount: number;
  itemCount: number;
  refreshCart: () => Promise<void>;
}
```

**useImagePicker**
```typescript
interface UseImagePicker {
  pickImage: () => Promise<ImageResult | null>;
  takePhoto: () => Promise<ImageResult | null>;
  uploadImage: (uri: string) => Promise<string>;
  uploading: boolean;
  progress: number;
}
```

#### 5. Screen Components

**CreateScreen**
- Image picker button (camera/gallery)
- Image preview
- Size selector (dropdown or picker)
- Frame selector (dropdown or picker)
- Price display
- Add to cart button
- Loading states during upload

**CartScreen** (already implemented, needs integration)
- FlatList of cart items
- Item cards with image, details, quantity controls
- Remove button per item
- Total price display
- Checkout button
- Empty state

**CheckoutScreen**
- Order summary
- Stripe payment sheet integration
- Loading states
- Success/error handling
- Navigation to order confirmation

**GalleryScreen**
- Grid layout of user's created prints
- Image thumbnails
- Tap to view details
- Reorder functionality
- Pull to refresh

**OrderHistoryScreen**
- List of past orders
- Order status badges
- Order date and total
- Tap to view details
- Pull to refresh

**AccountScreen**
- User profile information
- Navigation to Gallery
- Navigation to Order History
- Settings options
- Logout button

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}
```

### CartItem
```typescript
interface CartItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  size: string;
  frame: string;
  price: number;
  quantity: number;
  created_at: string;
}
```

### Order
```typescript
interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: Address;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}
```

### GalleryItem
```typescript
interface GalleryItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  size: string;
  frame: string;
  created_at: string;
}
```

## Error Handling

### Error Types

1. **Network Errors**
   - Display user-friendly message
   - Provide retry option
   - Cache data when possible

2. **Authentication Errors**
   - Clear session
   - Redirect to login
   - Display appropriate message

3. **Validation Errors**
   - Display inline error messages
   - Highlight invalid fields
   - Prevent form submission

4. **Payment Errors**
   - Display Stripe error messages
   - Allow retry
   - Don't clear cart on failure

### Error Display Strategy

- Use Alert for critical errors
- Use inline text for form validation
- Use toast/snackbar for success messages
- Use error boundaries for component crashes

## Testing Strategy

### Unit Tests
- Custom hooks (useAuth, useCart, etc.)
- Utility functions
- API client methods
- Data transformations

### Integration Tests
- Authentication flow
- Cart operations
- Image upload process
- Payment flow

### Component Tests
- Screen rendering
- User interactions
- Navigation flows
- Form validation

### Manual Testing
- Test on physical iOS device
- Test with Expo Go
- Test offline scenarios
- Test push notifications
- Test payment flow with test cards

## Performance Considerations

### Image Optimization
- Compress images before upload
- Use appropriate image sizes
- Implement progressive loading
- Cache images locally

### List Performance
- Use FlatList for long lists
- Implement pagination where needed
- Use keyExtractor properly
- Optimize renderItem

### State Management
- Use React Context for global state
- Minimize re-renders with useMemo/useCallback
- Lazy load screens
- Debounce search/filter inputs

### Caching Strategy
- Cache gallery and order data
- Implement stale-while-revalidate pattern
- Clear cache on logout
- Set appropriate cache expiration

## Security Considerations

### Authentication
- Store tokens in expo-secure-store
- Implement token refresh
- Clear tokens on logout
- Validate session on app resume

### API Communication
- Use HTTPS only
- Include auth tokens in headers
- Validate responses
- Handle expired sessions

### Data Storage
- Encrypt sensitive data
- Don't store payment information
- Clear cache on logout
- Use secure storage for tokens

## Push Notifications

### Implementation
- Request permissions on first launch
- Store push token in backend
- Handle notification taps
- Display in-app notifications

### Notification Types
- Order shipped
- Order delivered
- Order status updates
- Promotional (optional)

### Backend Integration
- Create POST /push-token endpoint
- Modify update-order-status Lambda to send notifications
- Use Expo Push Notification service

## Offline Support

### Cached Data
- Order history
- Gallery items
- User profile

### Sync Strategy
- Check connectivity on app launch
- Sync when connectivity restored
- Display offline indicator
- Queue actions for later (optional)

### Implementation
- Use AsyncStorage for cache
- Implement cache invalidation
- Handle stale data gracefully
- Provide manual refresh option

## Animations and Transitions

### Screen Transitions
- Use react-navigation default transitions
- Customize for iOS feel
- Smooth tab switching

### Micro-interactions
- Button press feedback
- Loading spinners
- Success animations
- Error shake animations

### Implementation
- Use React Native Animated API
- Keep animations under 300ms
- Use native driver when possible
- Test on device for performance
