/**
 * Cart Screen
 * ChartedArt Mobile App - Task 14
 * Display cart items with ability to remove and proceed to checkout
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCart, CartItem } from '../../hooks/useCart';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

export default function CartScreen() {
    const navigation = useNavigation();
    const { cartItems, loading, error, fetchCart, removeItem, updateQuantity, totalAmount, itemCount } = useCart();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCart();
        setRefreshing(false);
    };

    const handleRemoveItem = (itemId: string, itemName: string) => {
        Alert.alert(
            'Remove Item',
            `Remove ${itemName} from cart?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeItem(itemId);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove item');
                        }
                    },
                },
            ]
        );
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert('Cart Empty', 'Please add items to your cart first');
            return;
        }
        // Navigate to checkout
        navigation.navigate('Checkout' as never);
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <Card style={styles.cartItem}>
            <View style={styles.itemContent}>
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSize}>Size: {item.size}</Text>
                    <Text style={styles.itemFrame}>Frame: {item.frame}</Text>
                    <Text style={styles.itemPrice}>R{item.price.toFixed(2)}</Text>
                </View>
            </View>
            <View style={styles.itemActions}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.id, item.name)}
                >
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    if (loading) {
        return <LoadingSpinner message="Loading cart..." />;
    }

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>Add items to get started</Text>
                    <Button
                        title="Start Shopping"
                        onPress={() => navigation.navigate('Create' as never)}
                        style={styles.emptyButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary}
                    />
                }
                ListFooterComponent={
                    <View style={styles.footer}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total ({itemCount} items)</Text>
                            <Text style={styles.totalAmount}>R{totalAmount.toFixed(2)}</Text>
                        </View>
                        <Button
                            title="Proceed to Checkout"
                            onPress={handleCheckout}
                            style={styles.checkoutButton}
                        />
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: SPACING.md,
    },
    cartItem: {
        marginBottom: SPACING.md,
    },
    itemContent: {
        flexDirection: 'row',
        marginBottom: SPACING.sm,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: COLORS.charcoal[100],
    },
    itemDetails: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: TYPOGRAPHY.weights.semibold as any,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    itemSize: {
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.textSecondary,
    },
    itemFrame: {
        fontSize: TYPOGRAPHY.sizes.sm,
        color: COLORS.textSecondary,
    },
    itemPrice: {
        fontSize: TYPOGRAPHY.sizes.lg,
        fontWeight: TYPOGRAPHY.weights.bold as any,
        color: COLORS.sage[400],
        marginTop: SPACING.xs,
    },
    itemActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cream[50],
        borderRadius: 8,
        padding: SPACING.xs,
    },
    quantityButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.sage[400],
        borderRadius: 6,
    },
    quantityButtonText: {
        fontSize: TYPOGRAPHY.sizes.lg,
        fontWeight: TYPOGRAPHY.weights.bold as any,
        color: COLORS.surface,
    },
    quantityText: {
        fontSize: TYPOGRAPHY.sizes.md,
        fontWeight: TYPOGRAPHY.weights.semibold as any,
        color: COLORS.text,
        marginHorizontal: SPACING.md,
        minWidth: 30,
        textAlign: 'center',
    },
    removeButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    removeButtonText: {
        fontSize: TYPOGRAPHY.sizes.sm,
        fontWeight: TYPOGRAPHY.weights.semibold as any,
        color: COLORS.error,
    },
    footer: {
        marginTop: SPACING.lg,
        paddingTop: SPACING.lg,
        borderTopWidth: 2,
        borderTopColor: COLORS.sage[400],
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.sizes.lg,
        fontWeight: TYPOGRAPHY.weights.semibold as any,
        color: COLORS.text,
    },
    totalAmount: {
        fontSize: TYPOGRAPHY.sizes.xxl,
        fontWeight: TYPOGRAPHY.weights.bold as any,
        color: COLORS.sage[400],
    },
    checkoutButton: {
        marginTop: SPACING.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.sizes.xxl,
        fontWeight: TYPOGRAPHY.weights.bold as any,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.sizes.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    emptyButton: {
        minWidth: 200,
    },
});
