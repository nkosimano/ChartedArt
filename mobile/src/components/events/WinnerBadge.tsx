import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface WinnerBadgeProps {
  place: number;
  eventTitle: string;
  prizeAmount?: number;
  eventDate: string;
  onPress?: () => void;
}

export default function WinnerBadge({
  place,
  eventTitle,
  prizeAmount,
  eventDate,
  onPress,
}: WinnerBadgeProps) {
  const getBadgeConfig = (place: number) => {
    switch (place) {
      case 1:
        return {
          icon: 'trophy' as const,
          color: '#EAB308',
          bgColor: '#FEF3C7',
          label: '1st Place',
          emoji: '🥇',
        };
      case 2:
        return {
          icon: 'medal' as const,
          color: '#9CA3AF',
          bgColor: '#F3F4F6',
          label: '2nd Place',
          emoji: '🥈',
        };
      case 3:
        return {
          icon: 'ribbon' as const,
          color: '#F97316',
          bgColor: '#FFEDD5',
          label: '3rd Place',
          emoji: '🥉',
        };
      default:
        return {
          icon: 'star' as const,
          color: COLORS.primary,
          bgColor: '#E0F2F1',
          label: `${place}th Place`,
          emoji: '⭐',
        };
    }
  };

  const config = getBadgeConfig(place);
  const eventDateObj = new Date(eventDate);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: config.bgColor }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{config.emoji}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.placeLabel, { color: config.color }]}>
            {config.label}
          </Text>
          {prizeAmount && (
            <Text style={[styles.prizeAmount, { color: config.color }]}>
              R{prizeAmount.toLocaleString()}
            </Text>
          )}
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>
          {eventTitle}
        </Text>

        <Text style={styles.eventDate}>
          {eventDateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  emoji: {
    fontSize: 40,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  placeLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  prizeAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
  },
  eventTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  eventDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});

