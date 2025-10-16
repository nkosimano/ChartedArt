import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
// REMOVED: Stripe requires custom native build - not compatible with Expo Go
// import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainTabs from './src/navigation/MainTabs';
import CheckoutScreen from './src/screens/checkout/CheckoutScreen';
import GalleryScreen from './src/screens/gallery/GalleryScreen';
import OrderHistoryScreen from './src/screens/orders/OrderHistoryScreen';
import OrderDetailScreen from './src/screens/orders/OrderDetailScreenSimple';
import EditProfileScreen from './src/screens/account/EditProfileScreen';
import SupportScreen from './src/screens/support/SupportScreen';
import EventListScreen from './src/screens/events/EventListScreen';
import EventDetailScreen from './src/screens/events/EventDetailScreen';
import SubmissionScreen from './src/screens/events/SubmissionScreen';
import MovementDetailScreen from './src/screens/movements/MovementDetailScreen';
import PuzzlePieceGalleryScreen from './src/screens/puzzle/PuzzlePieceGalleryScreen';
// REMOVED: Push notifications require Apple Developer account for APNs
// import { usePushNotifications } from './src/hooks/usePushNotifications';
import { COLORS } from './src/constants/colors';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();
  // REMOVED: Push notifications require Apple Developer account
  // usePushNotifications(!!user);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is authenticated - show main app
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="Checkout" 
            component={CheckoutScreen}
            options={{ headerShown: true, title: 'Checkout' }}
          />
          <Stack.Screen 
            name="Gallery" 
            component={GalleryScreen}
            options={{ headerShown: true, title: 'My Gallery' }}
          />
          <Stack.Screen 
            name="OrderHistory" 
            component={OrderHistoryScreen}
            options={{ headerShown: true, title: 'Order History' }}
          />
          <Stack.Screen 
            name="OrderDetail" 
            component={OrderDetailScreen}
            options={{ headerShown: true, title: 'Order Details' }}
          />
          <Stack.Screen 
            name="OrderConfirmation" 
            component={require('./src/screens/orders/OrderConfirmationScreen').default}
            options={{ headerShown: true, title: 'Order Confirmation' }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{ headerShown: true, title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="Support"
            component={SupportScreen}
            options={{ headerShown: true, title: 'Support' }}
          />
          <Stack.Screen
            name="EventList"
            component={EventListScreen}
            options={{ headerShown: true, title: 'Events' }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventSubmission"
            component={SubmissionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MovementDetail"
            component={MovementDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PuzzlePieceGallery"
            component={PuzzlePieceGalleryScreen}
            options={{ headerShown: true, title: 'Puzzle Pieces' }}
          />
        </>
      ) : (
        // User is not authenticated - show auth screens
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
