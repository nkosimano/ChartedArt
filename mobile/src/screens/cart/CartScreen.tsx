/**
 * Cart Screen
 * ChartedArt Mobile App - Task 14
 * Display cart items with ability to remove and proceed to checkout
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '@/hooks/useCart';
import { Button, LoadingSpinner, Card } from '@/components/common';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { CartItem } from '@/types';

export default function CartScreen() {
    const navigation = useNavigation();
    const { cartItems, loading, removeItem, updateQuantity, totalAmount, itemCount } = useCart();

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
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.md,
    },
    cartItem: {
        marginBottom: spacing.md,
    },
    itemContent: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: colors.charcoal[100],
    },
    itemDetails: {
        flex: 1,
        marginLeft: spacing.md,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    itemSize: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    itemFrame: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    itemPrice: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.sage[400],
        marginTop: spacing.xs,
    },
    itemActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cream[50],
        borderRadius: 8,
        padding: spacing.xs,
    },
    quantityButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.sage[400],
        borderRadius: 6,
    },
    quantityButtonText: {
        fontSize: typography.fontSize.lg,
        fontWeight: '700',
        color: colors.surface,
    },
    quantityText: {
        fontSize: typography.fontSize.base,
        fontWeight: '600',
        color: colors.text.primary,
        marginHorizontal: spacing.md,
        minWidth: 30,
        textAlign: 'center',
    },
    removeButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    removeButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: '600',
        color: colors.error,
    },
    footer: {
        marginTop: spacing.lg,
        paddingTop: spacing.lg,
        borderTopWidth: 2,
        borderTopColor: colors.sage[400],
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    totalLabel: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        color: colors.text.primary,
    },
    totalAmount: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: '700',
        color: colors.sage[400],
    },
    checkoutButton: {
        marginTop: spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
    },
    emptyButton: {
        minWidth: 200,
    },
});
