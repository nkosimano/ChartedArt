import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { api, APIError } from '@/lib/api/client';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { CreditCard, Wallet } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type CartItem = Database['public']['Tables']['cart_items']['Row'] & {
  products: Database['public']['Tables']['products']['Row'] | null
};

type ShippingAddress = {
  street: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
};

type PaymentMethod = 'cash' | 'card' | 'ozow';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    suburb: '',
    city: '',
    province: '',
    postal_code: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/login');
          return;
        }

        setEmail(session.user.email || '');

        // Query cart_items with products join (LEFT JOIN for custom prints)
        const { data: cartItems, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            *,
            products (id, name, price, image_url, artist_id)
          `)
          .eq('user_id', session.user.id);

        if (itemsError) throw itemsError;
        setItems(cartItems || []);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [navigate]);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const handleCashPayment = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!address.street || !address.suburb || !address.city || !address.province || !address.postal_code) {
        throw new Error('Please fill in all address fields');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login');
        return;
      }

      // CRITICAL: Revalidate cart items before placing order
      console.log('Validating cart items...');
      
      // Filter out custom prints (they don't need product validation)
      const regularItems = items.filter(item => item.product_id);
      const productIds = regularItems.map(item => item.product_id);
      
      // Only query products if there are regular items
      let currentProducts: any[] = [];
      if (productIds.length > 0) {
        const { data, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, stock_quantity, available')
          .in('id', productIds);

        if (productsError) {
          throw new Error('Failed to validate cart items. Please try again.');
        }
        currentProducts = data || [];
      }

      // Check each regular item in cart (skip custom prints)
      const validationErrors: string[] = [];
      for (const cartItem of regularItems) {
        const currentProduct = currentProducts?.find(p => p.id === cartItem.product_id);
        
        if (!currentProduct) {
          validationErrors.push(`Product no longer available: ${cartItem.product_id}`);
          continue;
        }

        if (!currentProduct.available) {
          validationErrors.push(`${currentProduct.name} is no longer available`);
          continue;
        }

        if (currentProduct.stock_quantity < (cartItem.quantity || 1)) {
          validationErrors.push(
            `Insufficient stock for ${currentProduct.name}. ` +
            `Available: ${currentProduct.stock_quantity}, In cart: ${cartItem.quantity || 1}`
          );
          continue;
        }

        // Check if price has changed significantly (more than 1%)
        const priceDiff = Math.abs(currentProduct.price - cartItem.price);
        if (priceDiff > cartItem.price * 0.01) {
          validationErrors.push(
            `Price for ${currentProduct.name} has changed. ` +
            `Was R${cartItem.price.toFixed(2)}, now R${currentProduct.price.toFixed(2)}`
          );
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(
          'Cart validation failed:\n' + validationErrors.join('\n') +
          '\n\nPlease update your cart and try again.'
        );
      }

      // Prepare order data (handle both regular products and custom prints)
      const orderData = {
        items: items.map(item => {
          const isCustomPrint = !item.product_id;
          
          if (isCustomPrint) {
            // Custom print - include all custom fields
            return {
              product_id: null,
              quantity: item.quantity || 1,
              customization: {
                image_url: item.image_url,
                name: item.name,
                size: item.size,
                frame: item.frame,
                price: item.price
              }
            };
          } else {
            // Regular product
            return {
              product_id: item.product_id,
              quantity: item.quantity || 1,
              customization: null
            };
          }
        }),
        shipping_address: {
          street: address.street,
          city: address.city,
          state: address.province,
          zip: address.postal_code,
          country: 'South Africa'
        },
        payment_method: 'cash' as const
      };

      // Create order using secure API
      console.log('Creating order via API...');
      const response = await api.orders.create(orderData);

      console.log('Order created successfully:', response.order.id);

      // Navigate to confirmation page
      navigate('/order-confirmation', { 
        state: { orderId: response.order.id } 
      });

    } catch (err) {
      console.error('Error processing order:', err);
      
      if (err instanceof APIError) {
        if (err.status === 401) {
          setError('Please log in to place an order');
          navigate('/auth/login');
        } else if (err.status === 400) {
          setError(err.message || 'Invalid order data. Please check your cart and try again.');
        } else {
          setError('Failed to place order. Please try again.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to place order');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddressSelect = (selectedAddress: ShippingAddress) => {
    setAddress(selectedAddress);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center text-charcoal-300 mb-12">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-charcoal-300 mb-12">
          Checkout
        </h1>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Address
                </label>
                <AddressAutocomplete
                  onAddressSelect={handleAddressSelect}
                  defaultValue={address.street}
                />
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'cash' 
                      ? 'border-sage-400 bg-sage-50' 
                      : 'border-gray-300 hover:border-sage-300'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-sage-400" />
                      <div>
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-charcoal-200">Pay when you receive your order</div>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 border rounded-lg cursor-pointer transition-colors opacity-50`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      disabled
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Card Payment</div>
                        <div className="text-sm text-charcoal-200">Coming soon</div>
                      </div>
                    </div>
                  </label>

                  <label className={`block p-4 border rounded-lg cursor-pointer transition-colors opacity-50`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ozow"
                      disabled
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Ozow</div>
                        <div className="text-sm text-charcoal-200">Coming soon</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="space-y-4 mb-6">
                {items.map((item) => {
                  const isCustomPrint = !item.product_id;
                  const displayName = isCustomPrint ? item.name : item.products?.name;
                  const displaySize = isCustomPrint ? item.size : item.products?.size;
                  const displayFrame = isCustomPrint ? item.frame : item.products?.frame_type;
                  
                  return (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-semibold">
                          {displayName || 'Unknown Item'}
                        </p>
                        <p className="text-sm text-charcoal-200">
                          {displaySize && `Size: ${displaySize}`}
                          {displayFrame && ` • Frame: ${displayFrame}`}
                        </p>
                        <p className="text-sm text-charcoal-200">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        R{(item.price * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-semibold">R{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Shipping</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>R{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCashPayment}
                disabled={submitting || !address.street}
                className="w-full bg-sage-400 text-white py-4 rounded-lg text-lg font-semibold hover:bg-sage-500 transition-colors mt-6 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}