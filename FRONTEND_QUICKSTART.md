# Frontend Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Backend API running (see backend README)
- Stripe account for payments

### Web Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your keys:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173/movements
```

### Mobile Setup

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Install additional packages
npm install @gorhom/bottom-sheet expo-linear-gradient

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your keys

# 5. Start Expo
npm start

# 6. Scan QR code with Expo Go app
```

## 📁 Key Files

### Web
```
src/
├── components/
│   ├── movements/          # Movement components
│   │   ├── MovementCard.tsx
│   │   ├── MovementDetailHero.tsx
│   │   ├── DonationModal.tsx
│   │   └── ...
│   ├── puzzle/             # Puzzle piece components
│   │   ├── PuzzlePieceGallery.tsx
│   │   ├── PuzzlePieceDetailModal.tsx
│   │   └── ReservationTimer.tsx
│   └── ui/                 # Base UI components
├── pages/
│   ├── MovementsPage.tsx
│   └── MovementDetailPage.tsx
└── hooks/
    ├── useMovements.ts
    └── usePuzzlePieces.ts
```

### Mobile
```
mobile/src/
├── components/
│   ├── movements/
│   └── puzzle/
├── screens/
│   ├── movements/
│   │   ├── MovementListScreen.tsx
│   │   └── MovementDetailScreen.tsx
│   └── puzzle/
│       └── PuzzlePieceGalleryScreen.tsx
└── hooks/
    ├── useMovements.ts
    └── usePuzzlePieces.ts
```

## 🔗 Adding to Your App

### Web - Add Routes

```tsx
// In your main router file (e.g., App.tsx)
import { MovementsPage, MovementDetailPage } from '@/pages';

<Routes>
  <Route path="/movements" element={<MovementsPage />} />
  <Route path="/movements/:slug" element={<MovementDetailPage />} />
</Routes>
```

### Mobile - Add Navigation

```tsx
// In your navigation stack
import { MovementListScreen, MovementDetailScreen } from './screens/movements';
import { PuzzlePieceGalleryScreen } from './screens/puzzle';

<Stack.Navigator>
  <Stack.Screen 
    name="MovementList" 
    component={MovementListScreen}
    options={{ title: 'Movements' }}
  />
  <Stack.Screen 
    name="MovementDetail" 
    component={MovementDetailScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen 
    name="PuzzlePieceGallery" 
    component={PuzzlePieceGalleryScreen}
  />
</Stack.Navigator>
```

## 🎨 Customization

### Change Colors

**Web** - Edit `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',  // Change this
      // ...
    }
  }
}
```

**Mobile** - Edit component styles:
```tsx
const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#3B82F6',  // Change this
  }
});
```

### Modify Reservation Time

In both `ReservationTimer` components, change:
```tsx
const RESERVATION_DURATION = 15 * 60; // 15 minutes in seconds
```

## 🧪 Testing

### Test a Movement

```tsx
// Create test data in your database
const testMovement = {
  slug: 'test-movement',
  title: 'Test Movement',
  description: 'A test movement',
  banner_image: 'https://picsum.photos/800/400',
  goal_amount: 10000,
  current_amount: 5000,
  participant_count: 42,
  status: 'active'
};
```

### Test Navigation

**Web**: Navigate to `http://localhost:5173/movements/test-movement`

**Mobile**: 
```tsx
navigation.navigate('MovementDetail', { slug: 'test-movement' });
```

## 🐛 Common Issues

### Issue: Components not found
**Solution**: Check import paths and ensure all files are created

### Issue: Stripe not working
**Solution**: 
1. Verify environment variables are set
2. Check Stripe keys are valid
3. Ensure backend endpoint is running

### Issue: Images not loading
**Solution**: 
1. Check image URLs are valid
2. Verify CORS settings on image host
3. Use placeholder images for testing

### Issue: Real-time updates not working
**Solution**:
1. Verify Supabase real-time is enabled
2. Check database permissions
3. Ensure subscription is properly set up

## 📚 Learn More

- **Full Documentation**: See `FRONTEND_IMPLEMENTATION.md`
- **Backend Setup**: See `backend/README.md`
- **API Docs**: See backend API documentation
- **Design System**: See Figma files (if available)

## 💡 Tips

1. **Use React DevTools** to inspect component state
2. **Enable Supabase logs** for debugging database queries
3. **Test on real devices** for mobile (not just simulator)
4. **Use Stripe test cards** for payment testing
5. **Check browser console** for errors

## 🆘 Need Help?

1. Check the full implementation docs
2. Review component source code
3. Check backend API logs
4. Verify database schema
5. Test with sample data

## ✅ Checklist

Before going to production:

- [ ] Environment variables configured
- [ ] Backend API connected
- [ ] Stripe configured with production keys
- [ ] Database schema created
- [ ] Real-time subscriptions working
- [ ] Images optimized
- [ ] Error handling tested
- [ ] Accessibility verified
- [ ] Mobile tested on real devices
- [ ] Payment flow tested end-to-end

---

**Ready to build!** 🎉

For detailed implementation info, see `FRONTEND_IMPLEMENTATION.md`
