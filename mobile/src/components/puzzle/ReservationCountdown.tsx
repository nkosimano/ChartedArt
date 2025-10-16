import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface ReservationCountdownProps {
  pieceNumber: number;
  expiresAt: string;
  onExpire: () => void;
  onCheckout: () => void;
  onCancel: () => void;
}

export const ReservationCountdown: React.FC<ReservationCountdownProps> = ({
  pieceNumber,
  expiresAt,
  onExpire,
  onCheckout,
  onCancel,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        onExpire();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return 0;
      }

      return Math.floor(diff / 1000);
    };

    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  useEffect(() => {
    const isUrgent = timeLeft <= 120;
    
    if (isUrgent && !isExpired) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [timeLeft, isExpired, pulseAnim]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 120;
  const progressPercentage = (timeLeft / (15 * 60)) * 100;

  if (isExpired) {
    return (
      <View style={[styles.container, styles.expiredContainer]}>
        <View style={styles.content}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <View style={styles.textContainer}>
            <Text style={styles.expiredTitle}>Reservation Expired</Text>
            <Text style={styles.expiredText}>
              Piece #{pieceNumber} is now available for others
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isUrgent ? styles.urgentContainer : styles.normalContainer,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name="time"
          size={24}
          color={isUrgent ? '#EF4444' : '#3B82F6'}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Piece #{pieceNumber} Reserved</Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>Complete purchase in</Text>
            <Text style={[styles.timer, isUrgent && styles.timerUrgent]}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={onCheckout}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={18} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: isUrgent ? '#EF4444' : '#3B82F6',
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  normalContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  urgentContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  expiredContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerLabel: {
    fontSize: 12,
    color: '#666',
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#3B82F6',
  },
  timerUrgent: {
    color: '#EF4444',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  checkoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressFill: {
    height: '100%',
  },
  expiredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  expiredText: {
    fontSize: 12,
    color: '#666',
  },
});
