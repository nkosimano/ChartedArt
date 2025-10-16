import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '@/hooks/useCart';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { apiClient } from '@/lib/api/client';
import HapticFeedback from '@/lib/haptics';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

interface EnhancedCheckoutScreenProps {
  navigation: any;
}

export default function EnhancedCheckoutScreen({ navigation }: EnhancedCheckoutScreenProps) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { cartItems, totalAmount, itemCount, clearCart } = useCart();
  const {
    isAvailable: isBiometricAvailable,
    isEnrolled: isBiometricEnrolled,
    biometricType,
    authenticateForPayment,
    getBiometricIcon,
    getBiometricLabel,
  } = useBiometricAuth();

  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [useBiometric, setUseBiometric] = useState(true);

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);
      await HapticFeedback.light();

      // Create payment intent on backend
      const response = await apiClient.post('/create-payment-intent', {
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
      });

      const { clientSecret, ephemeralKey, customer } = (response as any).data;

      // Initialize payment sheet with Apple Pay / Google Pay
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'ChartedArt',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },
        defaultBillingDetails: {
          name: 'Customer',
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        await HapticFeedback.error();
      } else {
        setPaymentReady(true);
        await HapticFeedback.success();
      }
    } catch (error) {
      console.error('Payment sheet initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      await HapticFeedback.error();
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricPayment = async () => {
    try {
      await HapticFeedback.medium();

      // Authenticate with biometrics
      const authResult = await authenticateForPayment(totalAmount);

      if (!authResult.success) {
        await HapticFeedback.error();
        Alert.alert('Authentication Failed', authResult.error || 'Please try again');
        return;
      }

      // Proceed with payment
      await processPayment();
    } catch (error) {
      console.error('Biometric payment error:', error);
      await HapticFeedback.error();
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  const handleStandardPayment = async () => {
    await HapticFeedback.medium();
    await processPayment();
  };

  const processPayment = async () => {
    try {
      setLoading(true);

      // Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        await HapticFeedback.error();
        Alert.alert('Payment Failed', error.message);
        return;
      }

      // Payment successful
      await HapticFeedback.purchaseComplete();

      // Create order
      await createOrder();

      // Clear cart
      await clearCart();

      // Navigate to success screen
      Alert.alert(
        'Payment Successful! 🎉',
        'Your order has been placed successfully.',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('OrderHistory'),
          },
        ]
      );
    } catch (error) {
      console.error('Payment processing error:', error);
      await HapticFeedback.error();
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    try {
      await apiClient.post('/orders', {
        items: cartItems,
        total: totalAmount,
        status: 'confirmed',
      });
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  };

  const renderOrderSummary = () => (
    <Card style={styles.summaryCard}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      
      {cartItems.map((item, index) => (
        <View key={index} style={styles.orderItem}>
          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle}>{(item as any).title || 'Custom Print'}</Text>
            <Text style={styles.itemSpecs}>
              {item.size} • {item.frame || 'No Frame'} • Qty: {item.quantity}
            </Text>
          </View>
          <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total ({itemCount} items)</Text>
        <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
      </View>
    </Card>
  );

  const renderPaymentOptions = () => (
    <Card style={styles.paymentCard}>
      <Text style={styles.sectionTitle}>Payment Method</Text>

      {/* Biometric Payment Option */}
      {isBiometricAvailable && isBiometricEnrolled && (
        <TouchableOpacity
          style={[
            styles.paymentOption,
            useBiometric && styles.paymentOptionSelected,
          ]}
          onPress={() => {
            HapticFeedback.selection();
            setUseBiometric(true);
          }}
        >
          <View style={styles.paymentOptionContent}>
            <Ionicons
              name={getBiometricIcon() as any}
              size={24}
              color={useBiometric ? '#FF6B6B' : '#666'}
            />
            <View style={styles.paymentOptionText}>
              <Text style={styles.paymentOptionTitle}>
                {getBiometricLabel()}
              </Text>
              <Text style={styles.paymentOptionSubtitle}>
                Fast & Secure with {biometricType}
              </Text>
            </View>
          </View>
          {useBiometric && (
            <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
          )}
        </TouchableOpacity>
      )}

      {/* Standard Payment Option */}
      <TouchableOpacity
        style={[
          styles.paymentOption,
          !useBiometric && styles.paymentOptionSelected,
        ]}
        onPress={() => {
          HapticFeedback.selection();
          setUseBiometric(false);
        }}
      >
        <View style={styles.paymentOptionContent}>
          <Ionicons
            name="card"
            size={24}
            color={!useBiometric ? '#FF6B6B' : '#666'}
          />
          <View style={styles.paymentOptionText}>
            <Text style={styles.paymentOptionTitle}>
              {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'} / Card
            </Text>
            <Text style={styles.paymentOptionSubtitle}>
              Credit/Debit Card or Digital Wallet
            </Text>
          </View>
        </View>
        {!useBiometric && (
          <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
        )}
      </TouchableOpacity>

      {/* Security Badge */}
      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
        <Text style={styles.securityText}>
          Secured by Stripe • Your payment info is encrypted
        </Text>
      </View>
    </Card>
  );

  if (loading && !paymentReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Preparing checkout...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {renderOrderSummary()}
        {renderPaymentOptions()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={
            useBiometric && isBiometricAvailable && isBiometricEnrolled
              ? `Pay $${totalAmount.toFixed(2)} with ${biometricType}`
              : `Pay $${totalAmount.toFixed(2)}`
          }
          onPress={
            useBiometric && isBiometricAvailable && isBiometricEnrolled
              ? handleBiometricPayment
              : handleStandardPayment
          }
          disabled={!paymentReady || loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    marginBottom: 16,
  },
  paymentCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemSpecs: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  paymentOptionSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  paymentOptionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    padding: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
