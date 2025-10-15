import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../lib/api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

interface OrderItem {
  id: string;
  image_url: string;
  name: string;
  size: string;
  frame: string;
  price: number;
  quantity: number;
}

interface OrderDetail {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

interface OrderDetailScreenProps {
  route: any;
  navigation: any;
}

export default function OrderDetailScreen({ route, navigation }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<OrderDetail>(`/orders/${orderId}`);
      setOrder(response);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      Alert.alert('Error', 'Failed to load order details', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;

    try {
      // Add all items from this order to cart
      for (const item of order.items) {
        await apiClient.post('/cart', {
          imageUrl: item.image_url,
          name: item.name,
          size: item.size,
          frame: item.frame,
          price: item.price,
          quantity: item.quantity,
        });
      }

      Alert.alert('Added to Cart', 'All items have been added to your cart!', [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
        },
      ]);
    } catch (error) {
      console.error('Error reordering:', error);
      Alert.alert('Error', 'Failed to add items to cart');
    }
  };

  const getStatusColor = (status: OrderDetail['status']) => {
    switch (status) {
      case 'delivered':
        return '#10b981';
      case 'shipped':
        return '#3b82f6';
      case 'processing':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Order Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>Placed on {formatDate(order.created_at)}</Text>
        
        {order.tracking_number && (
          <View style={styles.trackingContainer}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <View style={styles.trackingInfo}>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingNumber}>{order.tracking_number}</Text>
            </View>
          </View>
        )}
      </Card>

      {/* Order Items */}
      <Text style={styles.sectionTitle}>Order Items</Text>
      {order.items.map((item) => (
        <Card key={item.id} style={styles.itemCard}>
          <View style={styles.itemContent}>
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSpec}>Size: {item.size}</Text>
              <Text style={styles.itemSpec}>Frame: {item.frame}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        </Card>
      ))}

      {/* Order Total */}
      <Card style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${order.total_amount.toFixed(2)}</Text>
        </View>
      </Card>

      {/* Reorder Button */}
      {order.status === 'delivered' && (
        <Button
          title="Reorder"
          onPress={handleReorder}
          style={styles.reorderButton}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  statusCard: {
    marginBottom: SPACING.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  trackingNumber: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  itemCard: {
    marginBottom: SPACING.md,
  },
  itemContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemSpec: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemQuantity: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.text,
  },
  totalCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primary + '10',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.primary,
  },
  reorderButton: {
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
  },
});
