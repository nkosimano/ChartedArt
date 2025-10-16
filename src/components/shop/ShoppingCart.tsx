import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import {
  ShoppingCart as CartIcon,
  Plus,
  Minus,
  X,
  Heart,
  ArrowRight,
  ShoppingBag,
  Trash2,
  Gift,
  Tag,
  Clock,
  Shield
} from 'lucide-react';

interface CartItem {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  image_url: string;
  quantity: number;
  stock_quantity?: number;
  dimensions?: string;
  medium?: string;
}

interface CartProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout?: () => void;
}

const ShoppingCart: React.FC<CartProps> = ({ 
  isOpen = false, 
  onClose, 
  onCheckout 
}) => {
  const { user } = useAuth();
  const {
    cartItems,
    cartLoading,
    cartError,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState('');

  // Mock cart items for demonstration
  const [mockCartItems] = useState<CartItem[]>([
    {
      id: '1',
      title: 'Abstract Symphony #1',
      artist_name: 'Maya Chen',
      price: 1299.99,
      image_url: '/api/placeholder/200/200',
      quantity: 1,
      stock_quantity: 1,
      dimensions: '24" x 36"',
      medium: 'Acrylic on Canvas'
    },
    {
      id: '2',
      title: 'Digital Dreams Collection',
      artist_name: 'Alex Rivera',
      price: 89.99,
      image_url: '/api/placeholder/200/200',
      quantity: 2,
      stock_quantity: 25,
      dimensions: '16" x 20"',
      medium: 'Digital Print'
    }
  ]);

  const [items, setItems] = useState<CartItem[]>(mockCartItems);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal * (promoDiscount / 100);
  const shipping = subtotal > 500 ? 0 : 29.99; // Free shipping over $500
  const tax = (subtotal - discount) * 0.08; // 8% tax
  const total = subtotal - discount + shipping + tax;

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleApplyPromo = () => {
    // Mock promo code validation
    const validPromoCodes: { [key: string]: number } = {
      'SAVE10': 10,
      'WELCOME15': 15,
      'ARTIST20': 20
    };

    if (validPromoCodes[promoCode.toUpperCase()]) {
      setPromoDiscount(validPromoCodes[promoCode.toUpperCase()]);
      setAppliedPromo(promoCode.toUpperCase());
      setShowPromoInput(false);
      setPromoCode('');
    } else {
      alert('Invalid promo code');
    }
  };

  const handleRemovePromo = () => {
    setPromoDiscount(0);
    setAppliedPromo('');
    setPromoCode('');
  };

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login
      alert('Please sign in to continue with checkout');
      return;
    }
    onCheckout?.();
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setItems([]);
    }
  };

  if (cartLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">
            Discover beautiful artwork and add items to your cart to get started.
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CartIcon className="w-6 h-6 text-gray-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">
              Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {cartError && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{cartError}</p>
        </div>
      )}

      {/* Cart Items */}
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div key={item.id} className="px-6 py-4">
            <div className="flex items-start space-x-4">
              {/* Product Image */}
              <div className="flex-shrink-0 w-20 h-20">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">by {item.artist_name}</p>
                    {item.dimensions && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.dimensions} • {item.medium}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quantity and Price */}
                <div className="flex justify-between items-end mt-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Qty:</label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.stock_quantity !== undefined && item.quantity >= item.stock_quantity}
                        className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    )}
                  </div>
                </div>

                {/* Stock warning */}
                {item.stock_quantity !== undefined && item.stock_quantity <= 3 && (
                  <div className="mt-2 flex items-center text-xs text-orange-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Only {item.stock_quantity} left in stock
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Section */}
      <div className="px-6 py-4 border-t border-gray-200">
        {!appliedPromo && !showPromoInput ? (
          <button
            onClick={() => setShowPromoInput(true)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Tag className="w-4 h-4 mr-1" />
            Add promo code
          </button>
        ) : showPromoInput ? (
          <div className="flex space-x-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleApplyPromo}
              disabled={!promoCode.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setShowPromoInput(false);
                setPromoCode('');
              }}
              className="px-4 py-2 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-green-600">
              <Tag className="w-4 h-4 mr-1" />
              <span className="font-medium">{appliedPromo}</span>
              <span className="ml-1">applied ({promoDiscount}% off)</span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Cart Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          
          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Discount ({promoDiscount}%):</span>
              <span className="text-green-600">-${discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Shipping:
              {shipping === 0 && (
                <span className="text-xs text-green-600 ml-1">(Free over $500)</span>
              )}
            </span>
            <span className="text-gray-900">
              {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax:</span>
            <span className="text-gray-900">${tax.toFixed(2)}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
          <Shield className="w-3 h-3 mr-1" />
          <span>Secure checkout with SSL encryption</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={handleClearCart}
              className="flex items-center px-4 py-2 text-red-600 font-medium border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center">
            <Gift className="w-3 h-3 mr-1" />
            <span>Gift wrapping available</span>
          </div>
          <div className="flex items-center">
            <ArrowRight className="w-3 h-3 mr-1" />
            <span>Free returns within 30 days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Cart Component for Header
export const MiniCart: React.FC<{
  onOpenFullCart: () => void;
}> = ({ onOpenFullCart }) => {
  const { cartItems, getCartCount, getCartTotal } = useCart();
  const [mockItems] = useState<CartItem[]>([
    {
      id: '1',
      title: 'Abstract Symphony #1',
      artist_name: 'Maya Chen',
      price: 1299.99,
      image_url: '/api/placeholder/200/200',
      quantity: 1
    },
    {
      id: '2',
      title: 'Digital Dreams Collection',
      artist_name: 'Alex Rivera',
      price: 89.99,
      image_url: '/api/placeholder/200/200',
      quantity: 2
    }
  ]);

  const itemCount = mockItems.length;
  const total = mockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (itemCount === 0) {
    return (
      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
        <CartIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onOpenFullCart}
        className="p-2 text-gray-700 hover:text-gray-900 transition-colors relative"
      >
        <CartIcon className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      </button>
      
      {/* Mini Cart Preview */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 hidden hover:block group-hover:block">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-900">Cart ({itemCount})</h3>
            <span className="text-sm font-medium text-gray-900">${total.toFixed(2)}</span>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {mockItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    ${item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={onOpenFullCart}
            className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;