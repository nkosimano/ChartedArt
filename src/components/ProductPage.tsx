import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_url: string;
  artist_name: string;
  dimensions: string;
  medium: string;
  year_created: number;
  stock_quantity: number;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const { 
    trackProductView, 
    trackAddToCart, 
    trackUserEngagement 
  } = useAnalytics();

  const { 
    isSupported: biometricSupported, 
    hasRegisteredCredentials 
  } = useBiometricAuth();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:artist_id (
            full_name,
            avatar_url
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      const productData = {
        ...data,
        artist_name: data.profiles?.full_name || 'Unknown Artist',
      };

      setProduct(productData);

      // Track product view
      trackProductView({
        product_id: productData.id,
        name: productData.name,
        category: productData.category,
        price: productData.price,
        currency: productData.currency,
      });

      // Track user engagement - product page view
      trackUserEngagement({
        action: 'product_page_view',
        element: 'product_details',
        value: productId,
      });

    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Add to cart in database
      // For regular products, only send product_id and quantity
      // Price will be fetched from products table when needed
      const { error } = await supabase.from('cart_items').insert({
        user_id: session.user.id,
        product_id: product.id,
        quantity: quantity,
        // DO NOT include price, image_url, name, size, frame for regular products
      });

      if (error) {
        console.error('Cart insert error:', error);
        throw error;
      }

      // Track add to cart event
      trackAddToCart({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
      });

      // Track user engagement
      trackUserEngagement({
        action: 'add_to_cart',
        element: 'add_to_cart_button',
        value: product.id,
      });

      // Show success message or redirect to cart
      alert('Added to cart successfully!');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleImageClick = () => {
    // Track image interaction
    trackUserEngagement({
      action: 'image_interaction',
      element: 'product_image',
      value: product?.id,
    });
  };

  const handleArtistClick = () => {
    // Track artist profile click
    trackUserEngagement({
      action: 'artist_click',
      element: 'artist_link',
      value: product?.artist_name,
    });
    
    // Navigate to artist profile (implement as needed)
    // navigate(`/artist/${product.artist_id}`);
  };

  const handleShareProduct = () => {
    // Track sharing
    trackUserEngagement({
      action: 'share_product',
      element: 'share_button',
      value: product?.id,
    });

    if (navigator.share && product) {
      navigator.share({
        title: product.name,
        text: `Check out this artwork by ${product.artist_name}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <button
            onClick={() => navigate('/gallery')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <button
                onClick={() => navigate('/gallery')}
                className="text-gray-400 hover:text-gray-500"
              >
                Gallery
              </button>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-500">{product.category}</span>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          
          {/* Product Image */}
          <div className="flex flex-col-reverse">
            <div className="mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
              <div 
                className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden cursor-zoom-in"
                onClick={handleImageClick}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-center object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {product.name}
            </h1>

            {/* Artist Info */}
            <div className="mt-3">
              <button
                onClick={handleArtistClick}
                className="text-lg text-indigo-600 hover:text-indigo-500 font-medium"
              >
                by {product.artist_name}
              </button>
            </div>

            {/* Price */}
            <div className="mt-3">
              <p className="text-3xl tracking-tight text-gray-900">
                ${product.price.toLocaleString()} {product.currency}
              </p>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <p className="text-base text-gray-700">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Details</h3>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Medium:</span> {product.medium}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Dimensions:</span> {product.dimensions}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Year:</span> {product.year_created}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Category:</span> {product.category}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-6">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-1 block w-20 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {[...Array(Math.min(product.stock_quantity, 10))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col space-y-4">
              
              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock_quantity === 0}
                className={`
                  w-full flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white
                  ${product.stock_quantity === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : addingToCart
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }
                `}
              >
                {addingToCart ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : product.stock_quantity === 0 ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </button>

              {/* Secondary Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleShareProduct}
                  className="flex-1 bg-white border border-gray-300 rounded-md py-3 px-8 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Share
                </button>
                
                <button
                  onClick={() => {
                    trackUserEngagement({
                      action: 'wishlist_add',
                      element: 'wishlist_button',
                      value: product.id,
                    });
                    // Implement wishlist functionality
                    alert('Added to wishlist!');
                  }}
                  className="flex-1 bg-white border border-gray-300 rounded-md py-3 px-8 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add to Wishlist
                </button>
              </div>
              
            </div>

            {/* Biometric Payment Option */}
            {biometricSupported && hasRegisteredCredentials && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="ml-2 text-sm text-green-700">
                    Biometric authentication available for secure checkout
                  </p>
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mt-6">
              {product.stock_quantity > 0 ? (
                <p className="text-sm text-green-600">
                  ✓ In stock ({product.stock_quantity} available)
                </p>
              ) : (
                <p className="text-sm text-red-600">
                  ✗ Currently out of stock
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}