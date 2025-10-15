# ChartedArt Mobile App

A React Native mobile application for ChartedArt, built with Expo. This app allows users to create custom art prints from their photos, manage their cart, and complete purchases.

## Features

### ✅ Implemented Features

1. **Authentication**
   - Email/password sign up and login
   - Secure session management with Supabase
   - Session persistence with expo-secure-store

2. **Navigation**
   - Bottom tab navigation (Home, Create, Cart, Account)
   - Conditional routing based on authentication state
   - Stack navigation for detailed screens

3. **Image Management**
   - Camera capture
   - Gallery selection
   - Image upload to S3 with presigned URLs
   - Permission handling

4. **Product Creation**
   - Image selection and preview
   - Size selection (8x10, 11x14, 16x20, 24x36)
   - Frame selection (None, Black, White, Wood)
   - Dynamic price calculation
   - Add to cart functionality

5. **Shopping Cart**
   - View cart items
   - Update quantities
   - Remove items
   - Pull-to-refresh
   - Empty state handling

6. **Checkout & Payment**
   - Stripe payment integration
   - Order summary
   - Payment processing
   - Order confirmation

7. **Gallery**
   - Grid view of created prints
   - Reorder functionality
   - Pull-to-refresh

8. **Order History**
   - List of past orders
   - Order status tracking
   - Order details view
   - Reorder from past orders

9. **Account Management**
   - User profile display
   - Profile editing
   - Navigation to Gallery and Order History
   - Logout functionality

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **Authentication**: Supabase
- **Payments**: Stripe React Native SDK
- **Image Handling**: expo-image-picker, expo-file-system
- **Secure Storage**: expo-secure-store
- **Network Detection**: @react-native-community/netinfo
- **Language**: TypeScript

## Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── common/          # Reusable components (Button, Card, LoadingSpinner)
│   ├── constants/           # App constants (colors, typography, spacing)
│   ├── contexts/            # React contexts (AuthContext)
│   ├── hooks/               # Custom hooks (useAuth, useCart, useImagePicker, useImageUpload)
│   ├── lib/                 # Core libraries
│   │   ├── api/            # API client
│   │   └── supabase/       # Supabase client
│   ├── navigation/          # Navigation configuration
│   ├── screens/             # App screens
│   │   ├── account/        # Account and profile screens
│   │   ├── auth/           # Login and signup screens
│   │   ├── cart/           # Shopping cart screen
│   │   ├── checkout/       # Checkout screen
│   │   ├── create/         # Product creation screen
│   │   ├── gallery/        # Gallery screen
│   │   ├── home/           # Home screen
│   │   └── orders/         # Order history and details
│   └── types/              # TypeScript type definitions
├── App.js                  # App entry point
├── package.json
└── .env                    # Environment variables
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. **Install dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env` file in the mobile directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_API_URL=your-api-gateway-url
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on a device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your physical device

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_API_URL` | AWS API Gateway URL |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

## API Integration

The app communicates with the AWS serverless backend through the API client (`src/lib/api/client.ts`). All requests automatically include:
- Authentication token in headers
- Network connectivity detection
- Error handling
- Retry logic

### API Endpoints Used

- `POST /generate-upload-url` - Get S3 presigned URL for image upload
- `GET /cart` - Fetch cart items
- `POST /cart` - Add item to cart
- `PUT /cart/:id` - Update cart item quantity
- `DELETE /cart/:id` - Remove cart item
- `POST /create-payment-intent` - Create Stripe payment intent
- `POST /orders` - Create order after successful payment
- `GET /orders` - Fetch order history
- `GET /orders/:id` - Fetch order details
- `GET /gallery` - Fetch user's gallery items
- `GET /profile` - Fetch user profile
- `PUT /profile` - Update user profile

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Known Limitations

1. **Push Notifications**: Infrastructure is in place but requires backend Lambda endpoints
2. **Offline Support**: Basic caching not yet implemented
3. **Animations**: Basic transitions in place, advanced animations pending

## Future Enhancements

- [ ] Push notifications for order updates
- [ ] Offline data caching with AsyncStorage
- [ ] Advanced animations and transitions
- [ ] Social sharing of gallery items
- [ ] Favorites/wishlist functionality
- [ ] Multiple shipping addresses
- [ ] Order tracking with real-time updates

## Troubleshooting

### Common Issues

**Issue**: "Cannot connect to Metro bundler"
- **Solution**: Clear cache with `expo start -c`

**Issue**: "Network request failed"
- **Solution**: Check that API_URL is correctly set in .env and backend is running

**Issue**: "Stripe payment sheet not showing"
- **Solution**: Verify STRIPE_PUBLISHABLE_KEY is correct and matches backend secret key

**Issue**: "Image upload fails"
- **Solution**: Check S3 bucket permissions and CORS configuration

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on both iOS and Android
4. Submit a pull request

## License

Proprietary - ChartedArt

## Support

For issues or questions, contact the development team.
