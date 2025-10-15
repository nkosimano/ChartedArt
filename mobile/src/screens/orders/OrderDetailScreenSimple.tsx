import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface OrderDetailScreenProps {
  route: any;
  navigation: any;
}

export default function OrderDetailScreen({ route, navigation }: OrderDetailScreenProps) {
  const { orderId } = route.params || { orderId: 'test' };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Details</Text>
      <Text style={styles.subtitle}>Order ID: {orderId}</Text>
      <Text style={styles.text}>This screen is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
});