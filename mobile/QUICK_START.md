# Quick Start Guide - ChartedArt Mobile App

## Prerequisites
- Node.js v16+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Environment
Create `.env` file in the mobile directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://nmfalijsgoqokxjlhzha.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
```

### 3. Start Development Server
```bash
npm start
```

### 4. Run on Device
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Test User Flow

### 1. Sign Up
- Open app → Sign Up screen
- Enter email and password
- Click "Sign Up"

### 2. Create Product
- Navigate to "Create" tab
- Select image from gallery or take photo
- Choose size and frame
- Click "Add to Cart"

### 3. Checkout
- Navigate to "Cart" tab
- Review items
- Click "Proceed to Checkout"
- Complete payment with test card:
  - Card: 4242 4242 4242 4242
  - Expiry: Any future date
  - CVC: Any 3 digits

### 4. View Orders
- Navigate to "Account" tab
- Click "Order History"
- View order details

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --clear
```

### iOS Simulator Not Opening
```bash
expo start --ios
```

### Android Emulator Not Opening
```bash
expo start --android
```

### Network Errors
- Verify backend URL in .env
- Check backend is running
- Verify network connectivity

## Development Tips

### Hot Reload
- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- Enable "Fast Refresh"

### Debug Menu
- iOS: `Cmd+D`
- Android: `Cmd+M`
- Physical device: Shake

### View Logs
```bash
npx react-native log-ios
npx react-native log-android
```

## Common Commands

```bash
# Start development server
npm start

# Clear cache and start
npm start -- --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Type check
npx tsc --noEmit

# Install new package
npm install package-name
```

## Project Structure Overview

```
mobile/
├── src/
│   ├── screens/        # All app screens
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # API & Supabase clients
│   ├── navigation/     # Navigation config
│   └── contexts/       # React contexts
├── App.js              # Entry point
└── .env                # Environment variables
```

## Key Features Implemented

✅ Authentication (Login/SignUp)  
✅ Image Upload (Camera/Gallery)  
✅ Product Creation (Size/Frame selection)  
✅ Shopping Cart (Add/Update/Remove)  
✅ Checkout & Payment (Stripe)  
✅ Order History  
✅ Gallery  
✅ Profile Management  

## Need Help?

- Check `README.md` for detailed documentation
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review error messages in Metro bundler console
- Check network tab in React Native Debugger

## Next Steps

1. Test all features on device
2. Verify backend integration
3. Test payment flow with Stripe test cards
4. Review and customize UI/UX
5. Add app icon and splash screen
6. Prepare for production build

---

**Ready to build something amazing! 🚀**
