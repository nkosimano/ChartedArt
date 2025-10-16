import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useCheckout } from '../../hooks/useCheckout';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CreditCard,
  Truck,
  MapPin,
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  AlertTriangle,
  Gift,
  FileText,
  Calendar,
  Star
} from 'lucide-react';

type CheckoutStep = 'shipping' | 'payment' | 'review' | 'confirmation';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
}

interface OrderSummary {
  items: any[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  promoCode?: string;
}

const CheckoutProcess: React.FC = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const {
    submitOrder,
    validateAddress,
    calculateTax,
    processPayment,
    checkoutLoading,
    checkoutError
  } = useCheckout();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
  
  // Form Data
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [billingAddressSame, setBillingAddressSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({ ...shippingAddress });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({ type: 'card' });
  const [orderNotes, setOrderNotes] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [orderId, setOrderId] = useState<string | null>(null);

  // Mock order summary
  const orderSummary: OrderSummary = {
    items: [
      {
        id: '1',
        title: 'Abstract Symphony #1',
        artist_name: 'Maya Chen',
        price: 1299.99,
        quantity: 1,
        image_url: '/api/placeholder/100/100'
      },
      {
        id: '2',
        title: 'Digital Dreams Collection',
        artist_name: 'Alex Rivera',
        price: 89.99,
        quantity: 2,
        image_url: '/api/placeholder/100/100'
      }
    ],
    subtotal: 1479.97,
    discount: 147.99,
    shipping: 29.99,
    tax: 106.40,
    total: 1468.37,
    promoCode: 'SAVE10'
  };

  const steps = [
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: FileText },
    { id: 'confirmation', label: 'Confirmation', icon: Check }
  ];

  const shippingOptions = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 29.99
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 49.99
    },
    {
      id: 'overnight',
      name: 'Overnight Shipping',
      description: 'Next business day',
      price: 89.99
    }
  ];

  const handleStepComplete = (step: CheckoutStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const handleNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      handleStepComplete(currentStep);
      setCurrentStep(steps[currentIndex + 1].id as CheckoutStep);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as CheckoutStep);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const orderData = {
        shippingAddress,
        billingAddress: billingAddressSame ? shippingAddress : billingAddress,
        paymentMethod,
        items: orderSummary.items,
        total: orderSummary.total,
        shipping: selectedShipping,
        giftWrap,
        giftMessage,
        orderNotes
      };

      const result = await submitOrder(orderData);
      setOrderId(result.orderId);
      handleStepComplete('review');
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Order submission failed:', error);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = completedSteps.includes(step.id as CheckoutStep);
        const isCurrent = currentStep === step.id;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : isCurrent
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : 'bg-gray-100 border-gray-300 text-gray-400'
            }`}>
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <StepIcon className="w-5 h-5" />
              )}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${
                isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`ml-8 mr-8 w-16 h-0.5 ${
                completedSteps.includes(steps[index + 1].id as CheckoutStep) || 
                (isCurrent && index < steps.length - 1)
                  ? 'bg-indigo-500'
                  : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderShippingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={shippingAddress.firstName}
              onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={shippingAddress.lastName}
              onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={shippingAddress.email}
              onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            value={shippingAddress.address1}
            onChange={(e) => setShippingAddress({...shippingAddress, address1: e.target.value})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            value={shippingAddress.address2}
            onChange={(e) => setShippingAddress({...shippingAddress, address2: e.target.value})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              value={shippingAddress.state}
              onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              type="text"
              value={shippingAddress.zipCode}
              onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              value={shippingAddress.country}
              onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipping Options */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Shipping Method</h4>
        <div className="space-y-2">
          {shippingOptions.map((option) => (
            <label key={option.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="shipping"
                value={option.id}
                checked={selectedShipping === option.id}
                onChange={(e) => setSelectedShipping(e.target.value)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  <div className="font-medium text-gray-900">
                    ${option.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        
        {/* Payment Method Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { type: 'card', label: 'Credit Card', icon: CreditCard },
            { type: 'paypal', label: 'PayPal', icon: CreditCard },
            { type: 'apple_pay', label: 'Apple Pay', icon: CreditCard },
            { type: 'google_pay', label: 'Google Pay', icon: CreditCard }
          ].map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.type}
                onClick={() => setPaymentMethod({ ...paymentMethod, type: method.type as any })}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  paymentMethod.type === method.type
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">{method.label}</div>
              </button>
            );
          })}
        </div>

        {/* Credit Card Form */}
        {paymentMethod.type === 'card' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={paymentMethod.cardholderName || ''}
                onChange={(e) => setPaymentMethod({...paymentMethod, cardholderName: e.target.value})}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                value={paymentMethod.cardNumber || ''}
                onChange={(e) => setPaymentMethod({...paymentMethod, cardNumber: e.target.value})}
                placeholder="1234 5678 9012 3456"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Month *
                </label>
                <select
                  value={paymentMethod.expiryMonth || ''}
                  onChange={(e) => setPaymentMethod({...paymentMethod, expiryMonth: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">MM</option>
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={String(i+1).padStart(2, '0')}>
                      {String(i+1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Year *
                </label>
                <select
                  value={paymentMethod.expiryYear || ''}
                  onChange={(e) => setPaymentMethod({...paymentMethod, expiryYear: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">YY</option>
                  {Array.from({length: 10}, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={String(year).slice(-2)}>
                        {String(year).slice(-2)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV *
                </label>
                <input
                  type="text"
                  value={paymentMethod.cvv || ''}
                  onChange={(e) => setPaymentMethod({...paymentMethod, cvv: e.target.value})}
                  placeholder="123"
                  maxLength={4}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billing Address */}
      <div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="billing-same"
            checked={billingAddressSame}
            onChange={(e) => setBillingAddressSame(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="billing-same" className="ml-2 text-sm text-gray-700">
            Billing address is the same as shipping address
          </label>
        </div>

        {!billingAddressSame && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Billing Address</h4>
            {/* Billing address form would go here - similar to shipping form */}
            <div className="text-sm text-gray-500">
              Billing address form would be implemented here...
            </div>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-green-500 mr-2" />
          <div className="text-sm text-green-700">
            Your payment information is secured with 256-bit SSL encryption
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Order</h3>
      
      {/* Order Items */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
        <div className="space-y-3">
          {orderSummary.items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{item.title}</h5>
                <p className="text-sm text-gray-600">by {item.artist_name}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
          <div className="text-sm text-gray-600">
            <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
            <p>{shippingAddress.address1}</p>
            {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
            <p>{shippingAddress.country}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
          <div className="text-sm text-gray-600">
            {paymentMethod.type === 'card' && paymentMethod.cardNumber && (
              <p>**** **** **** {paymentMethod.cardNumber.slice(-4)}</p>
            )}
            {paymentMethod.type !== 'card' && (
              <p>{paymentMethod.type.replace('_', ' ').toUpperCase()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">${orderSummary.subtotal.toFixed(2)}</span>
          </div>
          {orderSummary.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-green-600">Discount ({orderSummary.promoCode}):</span>
              <span className="text-green-600">-${orderSummary.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span className="text-gray-900">${orderSummary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span className="text-gray-900">${orderSummary.tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">${orderSummary.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="gift-wrap"
            checked={giftWrap}
            onChange={(e) => setGiftWrap(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="gift-wrap" className="ml-2 text-sm text-gray-700">
            Add gift wrapping (+$5.99)
          </label>
        </div>

        {giftWrap && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gift Message
            </label>
            <textarea
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              rows={3}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a gift message..."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Notes (Optional)
          </label>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            rows={3}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Any special instructions or notes..."
          />
        </div>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. Your order has been successfully placed.
      </p>

      {orderId && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
          <div className="text-sm text-gray-600 mb-1">Order Number</div>
          <div className="font-mono text-lg font-semibold text-gray-900">{orderId}</div>
        </div>
      )}

      <div className="space-y-4 max-w-md mx-auto text-sm text-gray-600">
        <div className="flex items-center justify-center">
          <Mail className="w-4 h-4 mr-2" />
          <span>Confirmation email sent to {shippingAddress.email}</span>
        </div>
        <div className="flex items-center justify-center">
          <Truck className="w-4 h-4 mr-2" />
          <span>Estimated delivery: 5-7 business days</span>
        </div>
        <div className="flex items-center justify-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>You can track your order in your account</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          View Order Status
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          Continue Shopping
        </button>
      </div>
    </div>
  );

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'shipping':
        return shippingAddress.firstName && 
               shippingAddress.lastName && 
               shippingAddress.email && 
               shippingAddress.address1 && 
               shippingAddress.city && 
               shippingAddress.state && 
               shippingAddress.zipCode;
      case 'payment':
        return paymentMethod.type === 'card' 
          ? paymentMethod.cardholderName && 
            paymentMethod.cardNumber && 
            paymentMethod.expiryMonth && 
            paymentMethod.expiryYear && 
            paymentMethod.cvv
          : true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Error Display */}
      {checkoutError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-red-700">{checkoutError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        {currentStep === 'shipping' && renderShippingStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'review' && renderReviewStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </div>

      {/* Navigation Buttons */}
      {currentStep !== 'confirmation' && (
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 'shipping'}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          {currentStep === 'review' ? (
            <button
              onClick={handlePlaceOrder}
              disabled={checkoutLoading || !canProceedToNext()}
              className="flex items-center px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  Place Order
                  <Lock className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={!canProceedToNext()}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckoutProcess;