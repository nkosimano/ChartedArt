import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Alert, Platform } from 'react-native';

interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'facial' | 'iris' | 'none';
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsAvailable(compatible);

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris');
        }
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const authenticate = async (
    promptMessage: string = 'Authenticate to continue'
  ): Promise<BiometricAuthResult> => {
    try {
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      if (!isEnrolled) {
        Alert.alert(
          'Biometric Not Set Up',
          `Please set up ${biometricType} in your device settings to use this feature.`,
          [{ text: 'OK' }]
        );
        return {
          success: false,
          error: 'Biometric authentication not enrolled',
        };
      }

      // Provide haptic feedback before authentication
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        // Success haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return {
          success: true,
          biometricType: biometricType as any,
        };
      } else {
        // Error haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return {
        success: false,
        error: 'An error occurred during authentication',
      };
    }
  };

  const authenticateForPayment = async (amount: number): Promise<BiometricAuthResult> => {
    const message = Platform.select({
      ios: `Confirm payment of $${amount.toFixed(2)}`,
      android: `Authenticate to pay $${amount.toFixed(2)}`,
      default: `Confirm payment of $${amount.toFixed(2)}`,
    });

    return authenticate(message);
  };

  const getBiometricIcon = (): string => {
    if (biometricType === 'Face ID') return 'face-recognition';
    if (biometricType === 'Touch ID') return 'fingerprint';
    if (biometricType === 'Iris') return 'eye';
    return 'lock-closed';
  };

  const getBiometricLabel = (): string => {
    if (!isAvailable) return 'Biometric Not Available';
    if (!isEnrolled) return 'Set Up Biometric';
    return `Pay with ${biometricType}`;
  };

  return {
    isAvailable,
    isEnrolled,
    biometricType,
    authenticate,
    authenticateForPayment,
    getBiometricIcon,
    getBiometricLabel,
    checkBiometricAvailability,
  };
};
