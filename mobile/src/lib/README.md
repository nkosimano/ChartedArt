# Core Infrastructure

This directory contains the core infrastructure modules for the ChartedArt mobile app.

## API Client (`api/client.ts`)

A centralized HTTP client for communicating with the AWS Lambda backend.

**Features:**
- Automatic authentication token injection from secure storage
- Network connectivity detection
- Error handling with user-friendly messages
- Support for GET, POST, PUT, DELETE methods
- Image upload to S3 with presigned URLs

**Usage:**
```typescript
import apiClient from '@/lib/api/client';

// GET request
const data = await apiClient.get('/cart');

// POST request
await apiClient.post('/cart', { productId: '123', quantity: 1 });

// Upload image
await apiClient.uploadImage(imageUri, presignedUrl);
```

## Supabase Client (`supabase/client.ts`)

Authentication client using Supabase with secure session management.

**Features:**
- Email/password authentication
- Secure session storage using expo-secure-store
- Automatic token refresh
- Auth state change listeners

**Usage:**
```typescript
import { supabaseAuth } from '@/lib/supabase/client';

// Sign in
const { session, error } = await supabaseAuth.signIn(email, password);

// Sign up
const { session, error } = await supabaseAuth.signUp(email, password);

// Sign out
await supabaseAuth.signOut();

// Get current session
const session = await supabaseAuth.getSession();

// Listen to auth changes
const subscription = supabaseAuth.onAuthStateChange((session) => {
  console.log('Auth state changed:', session);
});
```

## Auth Context (`../contexts/AuthContext.tsx`)

React context and hook for managing authentication state throughout the app.

**Features:**
- Global authentication state
- User and session management
- Loading states
- Session persistence and restoration

**Usage:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, session, loading, signIn, signUp, signOut } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MainApp />;
}
```

## Environment Variables

Required environment variables in `mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=your-api-gateway-url
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

## Dependencies

- `@supabase/supabase-js` - Supabase client
- `expo-secure-store` - Secure token storage
- `@react-native-community/netinfo` - Network connectivity detection
