import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { supabase } from '@/lib/supabase/client';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
    artist_name: string;
  };
}

interface ShippingAddress {
  full_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [useBiometricAuth, setUseBiometricAuth] = useState(false);

  // Hooks
  const { 
    trackCheckoutStart, 
    trackPurchase, 
    trackUserEngagement 
  } = useAnalytics();

  const { 
    isSupported: biometricSupported, 
    hasRegisteredCredentials,
    confirmPaymentWithBiometric,
    isAuthenticating,
  } = useBiometricAuth();

  const {
    paymentMethods,
    processPayment,
    isProcessing: paymentProcessing,
  } = usePaymentMethods();

  useEffect(() => {
    loadCartItems();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      const cartTotal = calculateTotal();
      trackCheckoutStart({
        cart_total: cartTotal.total,
        currency: 'USD',
        item_count: cartItems.length,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }
  }, [cartItems, trackCheckoutStart]);

  const loadCartItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products (
            name,
            image_url,
            profiles:artist_id (
              full_name
            )
          )
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;

      const formattedItems = items?.map(item => ({
        ...item,
        product: {
          name: item.product.name,
          image_url: item.product.image_url,
          artist_name: item.product.profiles?.full_name || 'Unknown Artist',
        },
      })) || [];

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const handleNextStep = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('payment');
      trackUserEngagement({
        action: 'checkout_step_complete',
        element: 'shipping_form',
        value: 'shipping',
      });
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
      trackUserEngagement({
        action: 'checkout_step_complete',
        element: 'payment_form',
        value: 'payment',
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const totals = calculateTotal();

      // Handle biometric authentication if enabled
      if (useBiometricAuth && biometricSupported && hasRegisteredCredentials) {
        const biometricResult = await confirmPaymentWithBiometric({
          amount: totals.total,
          currency: 'USD',
        });

        if (!biometricResult.success) {
          alert(biometricResult.error || 'Biometric authentication failed');
          return;
        }

        trackUserEngagement({
          action: 'biometric_payment_success',
          element: 'checkout_form',
          value: totals.total.toString(),
        });
      }

      // Process payment
      const paymentResult = await processPayment({
        method: selectedPaymentMethod,
        amount: totals.total,
        currency: 'USD',
        shipping_address: shippingAddress,
        items: cartItems,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed');
      }

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          total_amount: totals.total,
          subtotal: totals.subtotal,
          shipping_cost: totals.shipping,
          tax_amount: totals.tax,
          currency: 'USD',
          status: 'paid',
          payment_method: selectedPaymentMethod,
          payment_intent_id: paymentResult.paymentIntentId,
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.product.name,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      if (cartError) console.error('Error clearing cart:', cartError);

      // Track purchase
      trackPurchase({
        order_id: order.id,
        amount: totals.total,
        currency: 'USD',
        payment_method: selectedPaymentMethod,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.product.name,
          category: 'artwork', // You might want to get this from the product
          price: item.price,
          quantity: item.quantity,
        })),
      });

      // Navigate to success page
      navigate(`/order-confirmation/${order.id}`);

    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <button
            onClick={() => navigate('/gallery')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {[
                { name: 'Shipping', value: 'shipping' },
                { name: 'Payment', value: 'payment' },
                { name: 'Review', value: 'review' },
              ].map((step, stepIdx) => (
                <li key={step.name} className={`${stepIdx !== 2 ? 'pr-8 sm:pr-20' : ''} relative`}>
                  <div className="flex items-center">
                    <div
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-full border-2
                        ${currentStep === step.value || 
                          (currentStep === 'payment' && step.value === 'shipping') ||
                          (currentStep === 'review' && (step.value === 'shipping' || step.value === 'payment'))
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-gray-300 text-gray-500'
                        }
                      `}
                    >
                      <span className="text-sm font-medium">{stepIdx + 1}</span>
                    </div>
                    <span className="ml-4 text-sm font-medium text-gray-500">{step.name}</span>
                  </div>
                  {stepIdx !== 2 && (
                    <div className="absolute top-5 right-0 hidden h-0.5 w-full bg-gray-300 sm:block" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          
          {/* Main Content */}
          <div className="lg:col-span-7">
            
            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-lg shadow px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={shippingAddress.full_name}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      value={shippingAddress.address_line_1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={shippingAddress.address_line_2}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address_line_2: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                      <input
                        type="text"
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="MX">Mexico</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handleNextStep}
                    disabled={!shippingAddress.full_name || !shippingAddress.address_line_1 || !shippingAddress.city}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-300"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-lg shadow px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <div className="ml-3 flex items-center">
                        <span className="font-medium text-gray-900">{method.name}</span>
                        {method.logo && (
                          <img src={method.logo} alt={method.name} className="ml-2 h-6" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Biometric Authentication Option */}
                {biometricSupported && hasRegisteredCredentials && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useBiometricAuth}
                        onChange={(e) => setUseBiometricAuth(e.target.checked)}
                        className="h-4 w-4 text-green-600"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-green-800">
                          Use biometric authentication for secure payment
                        </div>
                        <div className="text-sm text-green-600">
                          Authenticate with Face ID, Touch ID, or Windows Hello
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={handlePreviousStep}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!selectedPaymentMethod}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-300"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <div className="bg-white rounded-lg shadow px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Order</h2>
                
                {/* Order Summary */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900">Shipping Address</h3>
                    <p className="text-sm text-gray-600">
                      {shippingAddress.full_name}<br />
                      {shippingAddress.address_line_1}<br />
                      {shippingAddress.address_line_2 && `${shippingAddress.address_line_2}\n`}
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}<br />
                      {shippingAddress.country}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">Payment Method</h3>
                    <p className="text-sm text-gray-600">
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                      {useBiometricAuth && (
                        <span className="ml-2 text-green-600">+ Biometric Authentication</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={handlePreviousStep}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={processing || paymentProcessing || isAuthenticating}
                    className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-300"
                  >
                    {processing || paymentProcessing || isAuthenticating ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isAuthenticating ? 'Authenticating...' : 'Processing...'}
                      </div>
                    ) : (
                      `Place Order - $${totals.total.toFixed(2)}`
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Order Summary Sidebar */}
          <div className="mt-10 lg:mt-0 lg:col-span-5">
            <div className="bg-white rounded-lg shadow px-6 py-8 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {item.product.artist_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 py-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{totals.shipping === 0 ? 'Free' : `$${totals.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}