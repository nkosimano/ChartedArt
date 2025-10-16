import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type CartItem = {
  quantity: number;
};

type CartContextType = {
  itemCount: number;
  updateItemCount: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  itemCount: 0,
  updateItemCount: async () => {},
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const updateItemCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setItemCount(0);
        return;
      }

      // Query cart_items directly - no parent carts table
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', session.user.id);

      // If cart_items table doesn't exist, just set count to 0
      if (itemsError && itemsError.code === 'PGRST116') {
        setItemCount(0);
        return;
      }

      if (itemsError) throw itemsError;

      const count = items?.length || 0;
      setItemCount(count);
    } catch (error) {
      // Silently handle database errors for missing tables
      console.log('Cart functionality not available:', error);
      setItemCount(0);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id) {
        setUserId(session.user.id);
      }
    };

    checkSession();
    updateItemCount();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user.id) {
        setUserId(session.user.id);
        updateItemCount();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setItemCount(0);
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Only subscribe to cart changes if tables exist
    let cartChannel: any;
    try {
      cartChannel = supabase.channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setItemCount(prev => prev + 1);
            } else if (payload.eventType === 'DELETE') {
              setItemCount(prev => Math.max(0, prev - 1));
            } else {
              // For other changes, refresh the count
              updateItemCount();
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.log('Cart realtime updates not available:', error);
    }

    return () => {
      if (cartChannel) {
        cartChannel.unsubscribe();
      }
    };
  }, [userId]);

  return (
    <CartContext.Provider value={{ itemCount, updateItemCount }}>
      {children}
    </CartContext.Provider>
  );
}