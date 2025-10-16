/**
 * STUBBED VERSION - Stripe Payments Disabled
 *
 * This screen has been stubbed because @stripe/stripe-react-native was removed.
 * Reason: Requires custom native build (not compatible with Expo Go).
 *
 * To re-enable:
 * 1. Get Apple Developer account ($99/year)
 * 2. npm install @stripe/stripe-react-native@0.50.3
 * 3. Create custom development build with EAS Build
 * 4. Restore original implementation from git history
 *
 * Alternative: Use web-based Stripe Checkout via expo-web-browser
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useCart } from '../../hooks/useCart';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface CheckoutScreenProps {
  navigation: any;
}

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { cartItems, totalAmount, itemCount } = useCart();

  const handleLearnMore = () => {
    Linking.openURL('https://docs.expo.dev/guides/using-stripe/');
  };

  if (itemCount === 0) {
    return (
      <View style={styles.container}>
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some items to your cart to checkout</Text>
          <Button title="Continue Shopping" onPress={() => navigation.goBack()} />
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>⚠️ Checkout Unavailable</Text>
        <Text style={styles.message}>
          Native Stripe payments require a custom development build and are not available in Expo Go.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why is this disabled?</Text>
          <Text style={styles.infoText}>
            • Stripe's native SDK requires custom native code{'\n'}
            • Custom builds require an Apple Developer account ($99/year){'\n'}
            • Expo Go only supports pre-built native modules
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Your Cart Summary:</Text>
          <Text style={styles.infoText}>
            Items: {itemCount}{'\n'}
            Total: ${totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Alternative Solutions:</Text>
          <Text style={styles.infoText}>
            1. Use web-based Stripe Checkout{'\n'}
            2. Get an Apple Developer account{'\n'}
            3. Create a custom development build with EAS
          </Text>
        </View>

        <TouchableOpacity style={styles.learnMoreButton} onPress={handleLearnMore}>
          <Text style={styles.learnMoreText}>Learn More About Stripe in Expo</Text>
        </TouchableOpacity>

        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  card: {
    padding: SPACING.lg,
  },
  emptyCard: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  learnMoreButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
  },
});
