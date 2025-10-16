/**
 * Feature Flags System
 * 
 * Controls visibility and availability of optional features
 * following the "Graceful Degradation" principle
 */

import React from 'react';

export interface FeatureFlags {
  ENABLE_MOVEMENTS: boolean;
  ENABLE_PUZZLE_PIECES: boolean;
  ENABLE_EVENTS: boolean;
  ENABLE_BLOG: boolean;
  ENABLE_AR_FEATURES: boolean;
  ENABLE_AI_SEARCH: boolean;
  ENABLE_BIOMETRIC_AUTH: boolean;
}

// Default feature flags (can be overridden by environment variables)
const defaultFlags: FeatureFlags = {
  ENABLE_MOVEMENTS: true,
  ENABLE_PUZZLE_PIECES: true,
  ENABLE_EVENTS: true,
  ENABLE_BLOG: true,
  ENABLE_AR_FEATURES: false, // Mobile only
  ENABLE_AI_SEARCH: false, // Mobile only
  ENABLE_BIOMETRIC_AUTH: false, // Mobile only
};

// Parse environment variables
const getEnvFlag = (key: string, defaultValue: boolean): boolean => {
  const envValue = (import.meta as any).env?.[`VITE_${key}`];
  if (envValue === undefined) return defaultValue;
  return envValue === 'true' || envValue === '1';
};

// Initialize feature flags
export const featureFlags: FeatureFlags = {
  ENABLE_MOVEMENTS: getEnvFlag('ENABLE_MOVEMENTS', defaultFlags.ENABLE_MOVEMENTS),
  ENABLE_PUZZLE_PIECES: getEnvFlag('ENABLE_PUZZLE_PIECES', defaultFlags.ENABLE_PUZZLE_PIECES),
  ENABLE_EVENTS: getEnvFlag('ENABLE_EVENTS', defaultFlags.ENABLE_EVENTS),
  ENABLE_BLOG: getEnvFlag('ENABLE_BLOG', defaultFlags.ENABLE_BLOG),
  ENABLE_AR_FEATURES: getEnvFlag('ENABLE_AR_FEATURES', defaultFlags.ENABLE_AR_FEATURES),
  ENABLE_AI_SEARCH: getEnvFlag('ENABLE_AI_SEARCH', defaultFlags.ENABLE_AI_SEARCH),
  ENABLE_BIOMETRIC_AUTH: getEnvFlag('ENABLE_BIOMETRIC_AUTH', defaultFlags.ENABLE_BIOMETRIC_AUTH),
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

/**
 * HOC to conditionally render components based on feature flags
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  feature: keyof FeatureFlags,
  fallback: React.ReactNode = null
): React.FC<P> {
  const WithFeatureFlag: React.FC<P> = (props) => {
    if (!isFeatureEnabled(feature)) {
      return <>{fallback}</>;
    }
    return React.createElement(Component, props);
  };
  return WithFeatureFlag;
}

// Log feature flags in development
if ((import.meta as any).env?.DEV) {
  console.log('🚩 Feature Flags:', featureFlags);
}
