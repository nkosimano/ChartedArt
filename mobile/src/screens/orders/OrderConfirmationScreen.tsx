import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { ROUTES } from '../../navigation/routes';
import { STRINGS } from '../../constants/strings';

// Use the centralized route types
import type { RootStackParamList } from '../../navigation/routes';

type OrderConfirmationRouteProp = RouteProp<RootStackParamList, typeof ROUTES.ORDER_CONFIRMATION>;
type OrderConfirmationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  typeof ROUTES.ORDER_CONFIRMATION
>;

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<OrderConfirmationNavigationProp>();
  const route = useRoute<OrderConfirmationRouteProp>();
  
  const order = route.params?.order;

  if (!order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{STRINGS.errors.orderDetailsNotFound}</Text>
        <Button 
          title={STRINGS.orderConfirmation.goHome} 
          onPress={() => navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.HOME })}
          style={styles.primaryButton}
        />
      </View>
    );
  }

  const { id: orderId, totalAmount, itemCount } = order;
  const { orderConfirmation: text } = STRINGS;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.subtitle}>{text.subtitle}</Text>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>{text.orderId}</Text>
            <Text style={styles.value}>#{String(orderId).slice(0, 10)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{text.items}</Text>
            <Text style={styles.value}>{itemCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{text.totalPaid}</Text>
            <Text style={styles.total}>${totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        <Button
          title={text.viewOrderHistory}
          onPress={() => navigation.navigate(ROUTES.ORDER_HISTORY)}
          style={styles.primaryButton}
        />
        <Button
          title={text.backToHome}
          onPress={() => navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.HOME })}
        />
      </View>
    </ScrollView>
  );
}

// Define styles with proper typing
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
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
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  primaryButton: {
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.error,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
} as const);
