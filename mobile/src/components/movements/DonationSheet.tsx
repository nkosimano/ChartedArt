import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface DonationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  movementId: string;
  movementTitle: string;
  onSuccess?: (amount: number) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

// Mock stripe hook for web platform
const useMockStripe = () => ({
  initPaymentSheet: async () => ({ error: { message: 'Stripe not available on web' } }),
  presentPaymentSheet: async () => ({ error: { code: 'Canceled', message: 'Stripe not available on web' } }),
});

// Get the appropriate hook based on platform
const getStripeHook = () => {
  if (Platform.OS === 'web') {
    return useMockStripe;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useStripe } = require('@stripe/stripe-react-native');
    return useStripe;
  } catch {
    return useMockStripe;
  }
};

const useStripeHook = getStripeHook();

export const DonationSheet: React.FC<DonationSheetProps> = ({
  isOpen,
  onClose,
  movementId,
  movementTitle,
  onSuccess,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);
  
  // Use the platform-appropriate Stripe hook
  const { initPaymentSheet, presentPaymentSheet } = useStripeHook();

  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleAmountSelect = async (value: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const initializePaymentSheet = async () => {
    // Web platform doesn't support Stripe native payments
    if (Platform.OS === 'web') {
      setError('Payment processing is only available in the mobile app');
      return false;
    }

    try {
      const response = await fetch('/api/movements/create-donation-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movementId,
          amount: Math.round(amount * 100),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, ephemeralKey, customer } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'ChartedArt',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      return false;
    }
  };

  const handleDonate = async () => {
    if (amount < 1) {
      setError('Please enter an amount of at least $1');
      return;
    }

    // Show alert on web platform
    if (Platform.OS === 'web') {
      setError('Donations are only available in the ChartedArt mobile app. Please download the app to contribute.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const initialized = await initializePaymentSheet();
      if (!initialized) {
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          setError(paymentError.message);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.(amount);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="heart" size={28} color="#EF4444" />
            <Text style={styles.title}>Support {movementTitle}</Text>
          </View>
          <Text style={styles.subtitle}>
            Your donation will directly support this movement
          </Text>
        </View>

        {/* Preset Amounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select or enter an amount</Text>
          <View style={styles.amountGrid}>
            {PRESET_AMOUNTS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.amountButton,
                  amount === preset && !customAmount && styles.amountButtonSelected,
                ]}
                onPress={() => handleAmountSelect(preset)}
              >
                <Text
                  style={[
                    styles.amountButtonText,
                    amount === preset && !customAmount && styles.amountButtonTextSelected,
                  ]}
                >
                  ${preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
            />
          </View>
        </View>

        {/* Selected Amount Display */}
        <View style={styles.selectedAmountContainer}>
          <Text style={styles.selectedAmountLabel}>Your donation</Text>
          <Text style={styles.selectedAmount}>${amount.toFixed(2)}</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.donateButton, isProcessing && styles.donateButtonDisabled]}
            onPress={handleDonate}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.donateButtonText}>
                  Donate ${amount.toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  amountButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  amountButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  amountButtonTextSelected: {
    color: '#3B82F6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  selectedAmountContainer: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  donateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
  },
  donateButtonDisabled: {
    opacity: 0.6,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
