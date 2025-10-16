/**
 * Feature Flags System (Mobile)
 * 
 * Controls visibility and availability of optional features
 * following the "Graceful Degradation" principle
 */

import Constants from 'expo-constants';

export interface FeatureFlags {
  ENABLE_MOVEMENTS: boolean;
  ENABLE_PUZZLE_PIECES: boolean;
  ENABLE_EVENTS: boolean;
  ENABLE_AR_FEATURES: boolean;
  ENABLE_AI_SEARCH: boolean;
  ENABLE_AI_ROOM_ADVISOR: boolean;
  ENABLE_BIOMETRIC_AUTH: boolean;
  ENABLE_HAPTIC_FEEDBACK: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_WIDGETS: boolean;
}

// Default feature flags for mobile
const defaultFlags: FeatureFlags = {
  ENABLE_MOVEMENTS: true,
  ENABLE_PUZZLE_PIECES: true,
  ENABLE_EVENTS: true,
  ENABLE_AR_FEATURES: true,
  ENABLE_AI_SEARCH: true,
  ENABLE_AI_ROOM_ADVISOR: true,
  ENABLE_BIOMETRIC_AUTH: true,
  ENABLE_HAPTIC_FEEDBACK: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_WIDGETS: true,
};

// Parse environment variables from Expo config
const getEnvFlag = (key: string, defaultValue: boolean): boolean => {
  const envValue = Constants.expoConfig?.extra?.[key];
  if (envValue === undefined) return defaultValue;
  return envValue === true || envValue === 'true' || envValue === '1';
};

// Initialize feature flags
export const featureFlags: FeatureFlags = {
  ENABLE_MOVEMENTS: getEnvFlag('ENABLE_MOVEMENTS', defaultFlags.ENABLE_MOVEMENTS),
  ENABLE_PUZZLE_PIECES: getEnvFlag('ENABLE_PUZZLE_PIECES', defaultFlags.ENABLE_PUZZLE_PIECES),
  ENABLE_EVENTS: getEnvFlag('ENABLE_EVENTS', defaultFlags.ENABLE_EVENTS),
  ENABLE_AR_FEATURES: getEnvFlag('ENABLE_AR_FEATURES', defaultFlags.ENABLE_AR_FEATURES),
  ENABLE_AI_SEARCH: getEnvFlag('ENABLE_AI_SEARCH', defaultFlags.ENABLE_AI_SEARCH),
  ENABLE_AI_ROOM_ADVISOR: getEnvFlag('ENABLE_AI_ROOM_ADVISOR', defaultFlags.ENABLE_AI_ROOM_ADVISOR),
  ENABLE_BIOMETRIC_AUTH: getEnvFlag('ENABLE_BIOMETRIC_AUTH', defaultFlags.ENABLE_BIOMETRIC_AUTH),
  ENABLE_HAPTIC_FEEDBACK: getEnvFlag('ENABLE_HAPTIC_FEEDBACK', defaultFlags.ENABLE_HAPTIC_FEEDBACK),
  ENABLE_PUSH_NOTIFICATIONS: getEnvFlag('ENABLE_PUSH_NOTIFICATIONS', defaultFlags.ENABLE_PUSH_NOTIFICATIONS),
  ENABLE_OFFLINE_MODE: getEnvFlag('ENABLE_OFFLINE_MODE', defaultFlags.ENABLE_OFFLINE_MODE),
  ENABLE_WIDGETS: getEnvFlag('ENABLE_WIDGETS', defaultFlags.ENABLE_WIDGETS),
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return featureFlags[feature];
};

/**
 * React hook for feature flags
 */
export const useFeatureFlag = (feature: keyof FeatureFlags): boolean => {
  return isFeatureEnabled(feature);
};

// Log feature flags in development
if (__DEV__) {
  console.log('🚩 Mobile Feature Flags:', featureFlags);
}
