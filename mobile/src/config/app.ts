// App Configuration
export const APP_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api-gateway-url.amazonaws.com/prod',
  
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Feature Flags
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true' || 
                 process.env.EXPO_PUBLIC_API_URL?.includes('example.com') ||
                 process.env.EXPO_PUBLIC_API_URL?.includes('your-api-gateway-url') ||
                 false,
  
  // Development Settings
  ENABLE_LOGGING: __DEV__ || process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true',
  
  // App Information
  APP_NAME: 'ChartedArt',
  APP_VERSION: '1.0.0',
  
  // Default Values
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCALE: 'en-US',
};

// Helper functions
export const isDevelopment = () => __DEV__;
export const isProduction = () => !__DEV__;
export const shouldUseMockData = () => APP_CONFIG.USE_MOCK_DATA;
export const shouldEnableLogging = () => APP_CONFIG.ENABLE_LOGGING;

// API Endpoints (when real backend is available)
export const API_ENDPOINTS = {
  // Auth
  PROFILE: '/profile',
  
  // Cart
  CART: '/cart',
  CART_ITEM: (id: string) => `/cart/${id}`,
  
  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  
  // Gallery
  GALLERY: '/gallery',
  
  // Images
  GENERATE_UPLOAD_URL: '/generate-upload-url',
  
  // Payments
  CREATE_PAYMENT_INTENT: '/create-payment-intent',
  
  // Push Notifications
  PUSH_TOKEN: '/push-token',
};

export default APP_CONFIG;