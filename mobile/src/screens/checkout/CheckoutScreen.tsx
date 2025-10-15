import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../../hooks/useCart';
import apiClient from '../../lib/api/client';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface CheckoutScreenProps {
  navigation: any;
}

export default function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { cartItems, totalAmount, itemCount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);

      // Create payment intent on backend
      const response = await apiClient.post<{ clientSecret: string; ephemeralKey: string; customer: string }>('/create-payment-intent', {
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
      });

      const { clientSecret, ephemeralKey, customer } = response;

      // Initialize payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'ChartedArt',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: 'Customer',
        },
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      } else {
        setPaymentReady(true);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', 'Failed to prepare checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!paymentReady) {
      Alert.alert('Please Wait', 'Payment is being prepared...');
      return;
    }

    try {
      setLoading(true);

      // Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message);
        }
        return;
      }

      // Payment successful - create order
      await handlePaymentSuccess();
    } catch (error) {
      console.error('Error during checkout:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Create order on backend
      const order = await apiClient.post<{ id: string }>('\/orders', {
        items: cartItems.map(item => ({
          imageUrl: item.image_url,
          name: item.name,
          size: item.size,
          frame: item.frame,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
      });

      // Clear cart
      await clearCart();

      // Navigate to confirmation screen
      navigation.replace('OrderConfirmation', {
        orderId: order?.id || 'order',
        totalAmount,
        itemCount,
      });
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert(
        'Order Error',
        'Payment was successful but there was an issue creating your order. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Go Shopping"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Create' })}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Order Summary</Text>

        {/* Order Items */}
        <Card style={styles.summaryCard}>
          {cartItems.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.size} • {item.frame}
                  </Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              {index < cartItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Total */}
        <Card style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({itemCount} items)</Text>
            <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Checkout Button */}
        <Button
          title={loading ? 'Processing...' : 'Pay Now'}
          onPress={handleCheckout}
          disabled={loading || !paymentReady}
          style={styles.checkoutButton}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Preparing payment...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemDetails: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemQuantity: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primary + '10',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  checkoutButton: {
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
});
