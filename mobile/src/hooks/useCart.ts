import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import apiClient from '../lib/api/client';

export interface CartItem {
  id: string;
  user_id: string;
  image_url: string;
  name: string;
  size: string;
  frame: string;
  price: number;
  quantity: number;
  created_at: string;
}

interface CartResponse {
  items: CartItem[];
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch cart items from the backend
   */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<CartResponse>('/cart');
      setCartItems(response.items || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update item quantity
   */
  const updateQuantity = async (itemId: string, quantity: number): Promise<void> => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      // Optimistically update UI
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );

      // Update on backend
      await apiClient.put(`/cart/${itemId}`, { quantity });
    } catch (err) {
      console.error('Error updating quantity:', err);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
      
      // Revert on error
      await fetchCart();
    }
  };

  /**
   * Remove item from cart
   */
  const removeItem = async (itemId: string): Promise<void> => {
    try {
      // Optimistically update UI
      const previousItems = [...cartItems];
      setCartItems(prev => prev.filter(item => item.id !== itemId));

      // Remove from backend
      await apiClient.delete(`/cart/${itemId}`);
    } catch (err) {
      console.error('Error removing item:', err);
      Alert.alert('Error', 'Failed to remove item. Please try again.');
      
      // Revert on error
      await fetchCart();
    }
  };

  /**
   * Clear entire cart
   */
  const clearCart = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.delete('/cart');
      setCartItems([]);
    } catch (err) {
      console.error('Error clearing cart:', err);
      Alert.alert('Error', 'Failed to clear cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate total amount
   */
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  /**
   * Calculate total item count
   */
  const itemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cartItems,
    loading,
    error,
    fetchCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    itemCount,
  };
}
