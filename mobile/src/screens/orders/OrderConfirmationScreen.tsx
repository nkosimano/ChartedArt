import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface OrderConfirmationProps {
  route: any;
  navigation: any;
}

export default function OrderConfirmationScreen({ route, navigation }: OrderConfirmationProps) {
  const { orderId, totalAmount, itemCount } = route.params || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Thank you for your purchase!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully.</Text>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{String(orderId || '').slice(0, 10)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Items</Text>
            <Text style={styles.value}>{itemCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Paid</Text>
            <Text style={styles.total}>${Number(totalAmount || 0).toFixed(2)}</Text>
          </View>
        </Card>

        <Button
          title="View Order History"
          onPress={() => navigation.navigate('OrderHistory')}
          style={styles.primaryButton}
        />
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  total: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  primaryButton: {
    marginBottom: SPACING.md,
  },
});
