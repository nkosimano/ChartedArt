import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility for consistent tactile responses across the app
 */

export const HapticFeedback = {
  /**
   * Light impact - for UI interactions like button taps, selections
   */
  light: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact - for more significant actions like adding to cart
   */
  medium: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact - for important actions like completing a purchase
   */
  heavy: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Selection - for picker/slider changes
   */
  selection: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.selectionAsync();
    }
  },

  /**
   * Success notification - for successful operations
   */
  success: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Warning notification - for warnings
   */
  warning: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Error notification - for errors
   */
  error: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  /**
   * Button press - light haptic for button interactions
   */
  buttonPress: async () => {
    await HapticFeedback.light();
  },

  /**
   * Add to cart - medium haptic for adding items
   */
  addToCart: async () => {
    await HapticFeedback.medium();
  },

  /**
   * Remove item - light haptic for removing items
   */
  removeItem: async () => {
    await HapticFeedback.light();
  },

  /**
   * Purchase complete - success haptic for completed purchases
   */
  purchaseComplete: async () => {
    await HapticFeedback.success();
  },

  /**
   * Payment failed - error haptic for failed payments
   */
  paymentFailed: async () => {
    await HapticFeedback.error();
  },

  /**
   * Swipe action - selection haptic for swipe gestures
   */
  swipe: async () => {
    await HapticFeedback.selection();
  },

  /**
   * Toggle - selection haptic for toggle switches
   */
  toggle: async () => {
    await HapticFeedback.selection();
  },

  /**
   * Refresh - light haptic for pull-to-refresh
   */
  refresh: async () => {
    await HapticFeedback.light();
  },

  /**
   * Navigation - light haptic for navigation changes
   */
  navigation: async () => {
    await HapticFeedback.light();
  },

  /**
   * AR placement - medium haptic for AR object placement
   */
  arPlacement: async () => {
    await HapticFeedback.medium();
  },

  /**
   * Photo capture - heavy haptic for camera shutter
   */
  photoCapture: async () => {
    await HapticFeedback.heavy();
  },
};

/**
 * Haptic patterns for complex interactions
 */
export const HapticPatterns = {
  /**
   * Double tap pattern
   */
  doubleTap: async () => {
    await HapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 100));
    await HapticFeedback.light();
  },

  /**
   * Success sequence - for multi-step success
   */
  successSequence: async () => {
    await HapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 50));
    await HapticFeedback.medium();
    await new Promise(resolve => setTimeout(resolve, 50));
    await HapticFeedback.success();
  },

  /**
   * Loading complete - for completed loading operations
   */
  loadingComplete: async () => {
    await HapticFeedback.light();
    await new Promise(resolve => setTimeout(resolve, 100));
    await HapticFeedback.success();
  },
};

export default HapticFeedback;
