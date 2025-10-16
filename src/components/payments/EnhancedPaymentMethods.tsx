import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'apple_pay' | 'google_pay' | 'card' | 'paypal';
  name: string;
  icon: React.ReactNode;
  available: boolean;
  fee?: number;
  description: string;
}

interface EnhancedPaymentMethodsProps {
  amount: number;
  currency?: string;
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
}

export default function EnhancedPaymentMethods({
  amount,
  currency = 'ZAR',
  onPaymentMethodSelect,
  onPaymentSuccess,
  onPaymentError,
}: EnhancedPaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    detectAvailablePaymentMethods();
  }, []);

  const detectAvailablePaymentMethods = async () => {
    const methods: PaymentMethod[] = [
      {
        id: 'apple_pay',
        type: 'apple_pay',
        name: 'Apple Pay',
        icon: <ApplePayIcon />,
        available: await isApplePayAvailable(),
        description: 'Pay securely with Face ID, Touch ID, or passcode',
      },
      {
        id: 'google_pay',
        type: 'google_pay', 
        name: 'Google Pay',
        icon: <GooglePayIcon />,
        available: await isGooglePayAvailable(),
        description: 'Pay quickly and securely with Google Pay',
      },
      {
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        icon: <CreditCard className="w-6 h-6" />,
        available: true,
        description: 'Visa, Mastercard, American Express',
      },
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        icon: <PayPalIcon />,
        available: true,
        description: 'Pay with your PayPal account',
      },
    ];

    setPaymentMethods(methods);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    if (!method.available) return;
    
    setSelectedMethod(method);
    onPaymentMethodSelect(method);
  };

  const processApplePay = async () => {
    if (!window.ApplePaySession) {
      onPaymentError('Apple Pay is not supported on this device');
      return;
    }

    try {
      setIsProcessing(true);

      const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
        countryCode: 'ZA',
        currencyCode: currency,
        merchantCapabilities: ['supports3DS'],
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        total: {
          label: 'ChartedArt',
          amount: amount.toFixed(2),
          type: 'final',
        },
        lineItems: [
          {
            label: 'Custom Canvas Art',
            amount: amount.toFixed(2),
            type: 'final',
          }
        ],
        merchantIdentifier: 'merchant.com.chartedart.app', // Configure in Apple Developer Console
      };

      const session = new ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event) => {
        try {
          // Validate merchant with your backend
          const response = await fetch('/api/payments/apple-pay/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validationURL: event.validationURL,
              displayName: 'ChartedArt',
            }),
          });

          if (!response.ok) throw new Error('Merchant validation failed');
          
          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          console.error('Apple Pay merchant validation error:', error);
          session.abort();
          onPaymentError('Apple Pay setup failed. Please try another payment method.');
        }
      };

      session.onpaymentauthorized = async (event) => {
        try {
          // Process payment with your backend
          const response = await fetch('/api/payments/apple-pay/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentToken: event.payment.token,
              amount: amount,
              currency: currency,
            }),
          });

          if (!response.ok) throw new Error('Payment processing failed');

          const result = await response.json();
          
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          onPaymentSuccess(result);
        } catch (error) {
          console.error('Apple Pay processing error:', error);
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          onPaymentError('Payment failed. Please try again.');
        }
      };

      session.oncancel = () => {
        setIsProcessing(false);
      };

      session.begin();
    } catch (error) {
      console.error('Apple Pay error:', error);
      onPaymentError('Apple Pay failed to start');
    } finally {
      setIsProcessing(false);
    }
  };

  const processGooglePay = async () => {
    if (!window.google?.payments?.api) {
      onPaymentError('Google Pay is not available');
      return;
    }

    try {
      setIsProcessing(true);

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'stripe', // Or your payment processor
                gatewayMerchantId: 'your-stripe-merchant-id',
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: 'your-google-merchant-id',
          merchantName: 'ChartedArt',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toFixed(2),
          currencyCode: currency,
          countryCode: 'ZA',
        },
      };

      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST', // Change to 'PRODUCTION' for live
      });

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      
      // Process payment with your backend
      const response = await fetch('/api/payments/google-pay/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentToken: paymentData.paymentMethodData.tokenizationData.token,
          amount: amount,
          currency: currency,
        }),
      });

      if (!response.ok) throw new Error('Payment processing failed');

      const result = await response.json();
      onPaymentSuccess(result);
    } catch (error: any) {
      if (error.statusCode === 'CANCELED') {
        // User cancelled payment
        return;
      }
      console.error('Google Pay error:', error);
      onPaymentError('Google Pay failed. Please try another payment method.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedMethod || isProcessing) return;

    switch (selectedMethod.type) {
      case 'apple_pay':
        await processApplePay();
        break;
      case 'google_pay':
        await processGooglePay();
        break;
      case 'card':
        // Handle regular card payment (existing Stripe Elements)
        break;
      case 'paypal':
        // Handle PayPal payment
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-charcoal-300 mb-2">
          Choose Payment Method
        </h3>
        <p className="text-charcoal-200">
          Total: <span className="font-bold text-sage-600">R{amount.toFixed(2)}</span>
        </p>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            selected={selectedMethod?.id === method.id}
            onSelect={handlePaymentMethodSelect}
          />
        ))}
      </div>

      {selectedMethod && (
        <div className="mt-6">
          <button
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className={`w-full py-4 rounded-lg text-lg font-semibold transition-all duration-200 ${
              isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-sage-400 hover:bg-sage-500 text-white'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </div>
            ) : (
              `Pay with ${selectedMethod.name}`
            )}
          </button>

          <div className="flex items-center justify-center mt-4 text-sm text-charcoal-200">
            <Shield className="w-4 h-4 mr-2" />
            Your payment information is secure and encrypted
          </div>
        </div>
      )}
    </div>
  );
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (method: PaymentMethod) => void;
}

function PaymentMethodCard({ method, selected, onSelect }: PaymentMethodCardProps) {
  const cardClass = `
    relative p-4 border rounded-lg cursor-pointer transition-all duration-200
    ${method.available 
      ? selected 
        ? 'border-sage-400 bg-sage-50 ring-2 ring-sage-400' 
        : 'border-gray-200 hover:border-sage-300 bg-white'
      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
    }
  `;

  return (
    <div
      className={cardClass}
      onClick={() => method.available && onSelect(method)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {method.icon}
          </div>
          <div>
            <div className="font-medium text-charcoal-300">
              {method.name}
              {method.fee && (
                <span className="text-sm text-charcoal-200 ml-2">
                  (+R{method.fee.toFixed(2)} fee)
                </span>
              )}
            </div>
            <div className="text-sm text-charcoal-200">
              {method.description}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {!method.available && (
            <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
          )}
          {selected && method.available && (
            <CheckCircle className="w-5 h-5 text-sage-500" />
          )}
        </div>
      </div>

      {selected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-sage-400 pointer-events-none" />
      )}
    </div>
  );
}

// Payment Method Icons
function ApplePayIcon() {
  return (
    <div className="w-10 h-6 bg-black rounded flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.19 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
      </svg>
    </div>
  );
}

function GooglePayIcon() {
  return (
    <div className="w-10 h-6 flex items-center">
      <svg viewBox="0 0 24 24" className="w-8 h-5">
        <path fill="#4285F4" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
        <path fill="#34A853" d="M5.277 14.268l-.811 3.03-2.977.061C.928 15.441.24 13.818.24 12c0-1.917.746-3.629 1.97-4.92l2.653.487.969 2.201C5.651 10.239 5.451 11.08 5.451 12c0 1.125.313 2.177.826 3.268z"/>
        <path fill="#FBBC05" d="M12.24 4.765c1.32 0 2.22.57 2.729 1.046L17.697 3.1C15.916 1.473 13.553.24 12.24.24 7.896.24 4.289 2.725 2.862 6.291L5.894 8.834c.808-2.393 3.046-4.069 6.346-4.069z"/>
        <path fill="#EA4335" d="M12.24 19.425c-3.186 0-5.892-1.543-7.566-3.931L1.686 17.96c1.454 2.893 4.466 4.88 8.554 4.88 2.1 0 4.29-.777 6.014-2.176l-2.929-2.277c-.819.578-1.851.938-3.085.938z"/>
      </svg>
    </div>
  );
}

function PayPalIcon() {
  return (
    <div className="w-10 h-6 flex items-center">
      <svg viewBox="0 0 24 24" className="w-8 h-5">
        <path fill="#003087" d="M8.445 20.4l1.37-8.685H7.29c-.432 0-.832-.275-.96-.69-.13-.415.04-.87.407-1.09L8.525 8.69c.18-.11.39-.17.605-.17h4.29c3.625 0 6.56 2.94 6.56 6.565 0 .45-.05.89-.13 1.32l-1.04 6.605c-.07.44-.46.76-.91.76H9.355c-.51 0-.91-.41-.91-.91z"/>
        <path fill="#0070E0" d="M7.29 9.825h2.525l-1.37 8.685c0 .5.4.91.91.91h8.545c.45 0 .84-.32.91-.76L19.85 12c.08-.43.13-.87.13-1.32 0-3.625-2.935-6.565-6.56-6.565h-4.29c-.215 0-.425.06-.605.17L6.737 5.53c-.367.22-.537.675-.407 1.09.128.415.528.69.96.69z"/>
        <path fill="#003087" d="M13.42 4.115h-4.29c-.215 0-.425.06-.605.17L6.737 5.53c-.367.22-.537.675-.407 1.09.128.415.528.69.96.69h2.525l-1.37 8.685c0 .5.4.91.91.91h8.545c.45 0 .84-.32.91-.76l1.04-6.605c.08-.43.13-.87.13-1.32 0-3.625-2.935-6.565-6.56-6.565z"/>
      </svg>
    </div>
  );
}

// Payment Method Detection
async function isApplePayAvailable(): Promise<boolean> {
  if (!window.ApplePaySession) return false;
  
  try {
    return ApplePaySession.canMakePayments() && 
           (await ApplePaySession.canMakePaymentsWithActiveCard('merchant.com.chartedart.app'));
  } catch {
    return false;
  }
}

async function isGooglePayAvailable(): Promise<boolean> {
  if (!window.google?.payments?.api) return false;
  
  try {
    const paymentsClient = new google.payments.api.PaymentsClient({
      environment: 'TEST', // Change to 'PRODUCTION' for live
    });
    
    const isReadyToPay = await paymentsClient.isReadyToPay({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA'],
          },
        },
      ],
    });
    
    return isReadyToPay.result;
  } catch {
    return false;
  }
}

// Type declarations for external APIs
declare global {
  interface Window {
    ApplePaySession?: typeof ApplePaySession;
    google?: {
      payments?: {
        api?: {
          PaymentsClient: any;
        };
      };
    };
  }
}