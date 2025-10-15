import { useState, useEffect } from 'react';
import { CartItem } from '@/types';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const removeItem = async (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    cartItems,
    loading,
    removeItem,
    updateQuantity,
    totalAmount,
    itemCount,
  };
}
