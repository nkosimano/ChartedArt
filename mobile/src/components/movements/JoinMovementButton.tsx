import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface JoinMovementButtonProps {
  movementId: string;
  isJoined: boolean;
  onJoin: (movementId: string) => Promise<void>;
  optimistic?: boolean;
  style?: any;
}

export const JoinMovementButton: React.FC<JoinMovementButtonProps> = ({
  movementId,
  isJoined: initialIsJoined,
  onJoin,
  optimistic = true,
  style,
}) => {
  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (isJoined || isLoading) return;

    setError(null);

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Optimistic UI update
    if (optimistic) {
      setIsJoined(true);
    }

    setIsLoading(true);

    try {
      await onJoin(movementId);
      
      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // If not optimistic, update after success
      if (!optimistic) {
        setIsJoined(true);
      }
    } catch (err) {
      // Revert optimistic update on error
      if (optimistic) {
        setIsJoined(false);
      }
      
      // Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      setError(err instanceof Error ? err.message : 'Failed to join movement');
      console.error('Error joining movement:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity
        style={[
          styles.button,
          isJoined && styles.buttonJoined,
          (isJoined || isLoading) && styles.buttonDisabled,
        ]}
        onPress={handleJoin}
        disabled={isJoined || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons
              name={isJoined ? 'checkmark-circle' : 'people'}
              size={20}
              color="#fff"
            />
            <Text style={styles.buttonText}>
              {isJoined ? 'Joined!' : 'Join the Movement'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonJoined: {
    backgroundColor: '#10B981',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
