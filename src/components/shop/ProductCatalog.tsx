import React, { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  Eye,
  ChevronDown,
  SlidersHorizontal,
  X,
  ArrowUpDown
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  artist_name: string;
  artist_id: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
  image_url: string;
  images: string[];
  dimensions?: string;
  medium?: string;
  created_at: string;
  is_featured: boolean;
  stock_quantity: number;
  rating: number;
  reviews_count: number;
  is_commission_available: boolean;
}

const ProductCatalog: React.FC = () => {
  const {
    products,
    categories,
    loading,
    error,
    searchProducts,
    filterProducts
  } = useProducts();
  
  const { addToCart, cartItems } = useCart();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  // Mock data for demonstration
  const [mockProducts] = useState<Product[]>([
    {
      id: '1',
      title: 'Abstract Symphony #1',
      artist_name: 'Maya Chen',
      artist_id: 'artist_1',
      price: 1299.99,
      description: 'A vibrant abstract painting that captures the essence of music in visual form.',
      category: 'painting',
      tags: ['abstract', 'colorful', 'large'],
      image_url: '/api/placeholder/400/400',
      images: ['/api/placeholder/400/400', '/api/placeholder/400/400'],
      dimensions: '24" x 36"',
      medium: 'Acrylic on Canvas',
      created_at: '2024-01-15T10:00:00Z',
      is_featured: true,
      stock_quantity: 1,
      rating: 4.8,
      reviews_count: 12,
      is_commission_available: true
    },
    {
      id: '2',
      title: 'Digital Dreams Collection',
      artist_name: 'Alex Rivera',
      artist_id: 'artist_2',
      price: 89.99,
      description: 'Limited edition digital art prints exploring futuristic themes.',
      category: 'digital',
      tags: ['digital', 'futuristic', 'print'],
      image_url: '/api/placeholder/400/400',
      images: ['/api/placeholder/400/400'],
      dimensions: '16" x 20"',
      medium: 'Digital Print',
      created_at: '2024-01-10T09:00:00Z',
      is_featured: false,
      stock_quantity: 25,
      rating: 4.6,
      reviews_count: 8,
      is_commission_available: false
    },
    {
      id: '3',
      title: 'Coastal Serenity',
      artist_name: 'Sarah Thompson',
      artist_id: 'artist_3',
      price: 899.99,
      description: 'A peaceful seascape capturing the tranquil beauty of the coastline.',
      category: 'painting',
      tags: ['landscape', 'blue', 'peaceful'],
      image_url: '/api/placeholder/400/400',
      images: ['/api/placeholder/400/400', '/api/placeholder/400/400'],
      dimensions: '20" x 24"',
      medium: 'Oil on Canvas',
      created_at: '2024-01-08T14:30:00Z',
      is_featured: true,
      stock_quantity: 1,
      rating: 4.9,
      reviews_count: 15,
      is_commission_available: true
    }
  ]);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(mockProducts);
  const [wishlistedItems, setWishlistedItems] = useState<string[]>([]);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...mockProducts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(product =>
        selectedTags.every(tag => product.tags.includes(tag))
      );
    }

    // Wishlist filter
    if (showWishlistOnly) {
      filtered = filtered.filter(product => wishlistedItems.includes(product.id));
    }

    // Sort products
    switch (sortBy) {
      case 'featured':
        filtered.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, priceRange, selectedTags, sortBy, showWishlistOnly, wishlistedItems]);

  const toggleWishlist = (productId: string) => {
    setWishlistedItems(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      artist_name: product.artist_name,
      quantity: 1
    });
  };

  const isInCart = (productId: string) => {
    return cartItems?.some(item => item.id === productId) || false;
  };

  const allTags = Array.from(new Set(mockProducts.flatMap(p => p.tags)));
  const categories = ['all', 'painting', 'digital', 'sculpture', 'photography'];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Art</h1>
        <p className="text-lg text-gray-600">
          Explore unique artwork from talented artists around the world
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search artwork, artists, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : 
                   category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${priceRange.min}</span>
                    <span>${priceRange.max}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 6).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      } border`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showWishlistOnly}
                      onChange={(e) => setShowWishlistOnly(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Wishlist only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Controls and Results */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${
              viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${
              viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No artwork found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-6'
        }>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              isWishlisted={wishlistedItems.includes(product.id)}
              isInCart={isInCart(product.id)}
              onToggleWishlist={toggleWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{
  product: Product;
  viewMode: 'grid' | 'list';
  isWishlisted: boolean;
  isInCart: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product) => void;
}> = ({ product, viewMode, isWishlisted, isInCart, onToggleWishlist, onAddToCart }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex">
          <div className="flex-shrink-0 w-48 h-48">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover rounded-l-lg"
            />
          </div>
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-2">by {product.artist_name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-2 rounded-full transition-colors ${
                    isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 rounded-full text-gray-400 hover:text-gray-600">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
            
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {product.rating} ({product.reviews_count} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                {product.dimensions && (
                  <p className="text-sm text-gray-600">{product.dimensions} • {product.medium}</p>
                )}
              </div>
              
              <button
                onClick={() => onAddToCart(product)}
                disabled={product.stock_quantity === 0 || isInCart}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  product.stock_quantity === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isInCart
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {product.stock_quantity === 0
                  ? 'Out of Stock'
                  : isInCart
                  ? 'Added to Cart'
                  : 'Add to Cart'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="relative group">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-64 object-cover rounded-t-lg"
        />
        {product.is_featured && (
          <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded">
            Featured
          </span>
        )}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleWishlist(product.id)}
            className={`p-2 rounded-full bg-white shadow-md transition-colors ${
              isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button className="p-2 rounded-full bg-white shadow-md text-gray-400 hover:text-gray-600">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {product.artist_name}</p>
        
        <div className="flex items-center mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-gray-600">({product.reviews_count})</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock_quantity === 0 || isInCart}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              product.stock_quantity === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isInCart
                ? 'bg-green-100 text-green-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {product.stock_quantity === 0
              ? 'Out of Stock'
              : isInCart
              ? <ShoppingCart className="w-4 h-4" />
              : 'Add to Cart'
            }
          </button>
        </div>
        
        {product.dimensions && (
          <p className="text-xs text-gray-500 mt-2">{product.dimensions}</p>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;