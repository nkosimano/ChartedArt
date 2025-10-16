import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit3,
  Eye,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  History,
  BarChart3,
  Settings,
  Trash2,
  Archive,
  CheckSquare,
  Square,
  MoreVertical,
  Upload,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Users,
  DollarSign,
  ShoppingCart,
  Image as ImageIcon
} from 'lucide-react';
import { uploadImage, validateImage } from '../../utils/imageUpload';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'draft';
  image_url?: string;
  category?: string;
  artist_id: string;
  artist?: {
    full_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  total_sales?: number;
  total_revenue?: number;
}

interface InventoryAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  threshold_value: number;
  current_value: number;
  is_resolved: boolean;
  created_at: string;
  product?: Product;
}

interface BulkOperation {
  type: 'update_status' | 'update_stock' | 'delete' | 'archive';
  value?: string | number;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [artistFilter, setArtistFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Bulk operations
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Modals and views
  const [showProductModal, setShowProductModal] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalSales: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchAlerts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_artist_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Enhance products with sales data
      const enhancedProducts = await Promise.all(
        (data || []).map(async (product) => {
          const { data: salesData } = await supabase
            .from('order_items')
            .select(`
              quantity,
              price,
              orders!inner (status)
            `)
            .eq('product_id', product.id)
            .in('orders.status', ['paid', 'delivered']);

          const totalSales = salesData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const totalRevenue = salesData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

          return {
            ...product,
            artist: product.profiles,
            total_sales: totalSales,
            total_revenue: totalRevenue
          };
        })
      );

      setProducts(enhancedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error: alertError } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          products (
            id,
            name
          )
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (alertError) throw alertError;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const calculateStats = () => {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
    const totalSales = products.reduce((sum, p) => sum + (p.total_revenue || 0), 0);

    setStats({
      total,
      active,
      lowStock,
      outOfStock,
      totalValue,
      totalSales
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.artist?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    const matchesStock = 
      stockFilter === 'all' ||
      (stockFilter === 'in_stock' && product.stock_quantity > 0) ||
      (stockFilter === 'low_stock' && product.stock_quantity > 0 && product.stock_quantity <= 5) ||
      (stockFilter === 'out_of_stock' && product.stock_quantity === 0);
    
    const matchesArtist = artistFilter === 'all' || product.artist_id === artistFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesStock && matchesArtist && matchesCategory;
  });

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedProducts.length === 0) return;

    try {
      setLoading(true);
      
      switch (operation.type) {
        case 'update_status':
          await supabase
            .from('products')
            .update({ status: operation.value })
            .in('id', selectedProducts);
          break;
          
        case 'delete':
          await supabase
            .from('products')
            .delete()
            .in('id', selectedProducts);
          break;
          
        case 'archive':
          await supabase
            .from('products')
            .update({ status: 'inactive' })
            .in('id', selectedProducts);
          break;
      }

      await fetchProducts();
      setSelectedProducts([]);
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error performing bulk operation:', err);
      setError(err instanceof Error ? err.message : 'Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProductStock = async (productId: string, newStock: number, reason?: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', productId);

      if (error) throw error;

      // Log the inventory change
      const product = products.find(p => p.id === productId);
      if (product) {
        await supabase
          .from('artist_inventory_logs')
          .insert({
            product_id: productId,
            artist_id: product.artist_id,
            action: 'adjustment',
            quantity_change: newStock - product.stock_quantity,
            previous_stock: product.stock_quantity,
            new_stock: newStock,
            reason: reason || 'Admin adjustment'
          });
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error updating stock:', err);
      return false;
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-700 bg-red-100 border-red-200' };
    if (quantity <= 5) return { label: 'Low Stock', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
    return { label: 'In Stock', color: 'text-green-700 bg-green-100 border-green-200' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'inactive': return 'text-red-700 bg-red-100';
      case 'draft': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const uniqueArtists = [...new Set(products.map(p => p.artist_id))].map(id => 
    products.find(p => p.artist_id === id)
  ).filter(Boolean);

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading products...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-charcoal-300 mb-2">Product Management</h1>
            <p className="text-charcoal-200">Manage inventory, track sales, and monitor product performance</p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => fetchProducts()}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button 
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-charcoal-300">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-sage-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Inventory Value</p>
                <p className="text-2xl font-bold text-charcoal-300">R{stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-sage-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Total Sales</p>
                <p className="text-2xl font-bold text-charcoal-300">R{stats.totalSales.toLocaleString()}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-sage-400" />
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {alerts.length} Inventory Alert{alerts.length > 1 ? 's' : ''}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className="flex items-center space-x-2">
                      <span>{alert.product?.name}: {alert.alert_type.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      +{alerts.length - 3} more alerts
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* Artist Filter */}
            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            >
              <option value="all">All Artists</option>
              {uniqueArtists.map(artist => (
                <option key={artist?.artist_id} value={artist?.artist_id}>
                  {artist?.artist?.full_name || 'Unknown Artist'}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedProducts.length > 0 && (
          <div className="bg-sage-100 border border-sage-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sage-800 font-medium">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="text-sage-600 hover:text-sage-800 text-sm"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkOperation({ type: 'update_status', value: 'active' })}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkOperation({ type: 'archive' })}
                  className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkOperation({ type: 'delete' })}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products Table/Grid */}
        {viewMode === 'table' ? (
          <ProductTable 
            products={filteredProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={(id, selected) => {
              if (selected) {
                setSelectedProducts([...selectedProducts, id]);
              } else {
                setSelectedProducts(selectedProducts.filter(pid => pid !== id));
              }
            }}
            onSelectAll={(selected) => {
              if (selected) {
                setSelectedProducts(filteredProducts.map(p => p.id));
              } else {
                setSelectedProducts([]);
              }
            }}
            onUpdateStock={(id, stock, reason) => updateProductStock(id, stock, reason)}
            onShowDetails={setShowProductModal}
            getStockStatus={getStockStatus}
            getStatusColor={getStatusColor}
          />
        ) : (
          <ProductGrid 
            products={filteredProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={(id, selected) => {
              if (selected) {
                setSelectedProducts([...selectedProducts, id]);
              } else {
                setSelectedProducts(selectedProducts.filter(pid => pid !== id));
              }
            }}
            onUpdateStock={(id, stock, reason) => updateProductStock(id, stock, reason)}
            onShowDetails={setShowProductModal}
            getStockStatus={getStockStatus}
            getStatusColor={getStatusColor}
          />
        )}

        {/* Add Product Modal */}
        {showAddProductModal && (
          <AddProductModal
            onClose={() => setShowAddProductModal(false)}
            onProductAdded={fetchProducts}
          />
        )}

        {/* Stock Update Modal */}
        {showStockModal && (
          <StockUpdateModal
            productId={showStockModal}
            product={products.find(p => p.id === showStockModal)}
            onClose={() => setShowStockModal(null)}
            onUpdate={updateProductStock}
          />
        )}

        {/* Product Details Modal */}
        {showProductModal && (
          <ProductDetailsModal
            product={products.find(p => p.id === showProductModal)}
            onClose={() => setShowProductModal(null)}
            onUpdateStock={(stock, reason) => updateProductStock(showProductModal, stock, reason)}
          />
        )}
      </div>
    </div>
  );
}

// Product Table Component
interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUpdateStock: (id: string, stock: number, reason?: string) => Promise<boolean>;
  onShowDetails: (id: string) => void;
  getStockStatus: (quantity: number) => { label: string; color: string };
  getStatusColor: (status: string) => string;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onUpdateStock,
  onShowDetails,
  getStockStatus,
  getStatusColor
}) => {
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-sm text-gray-600">
            Try adjusting your search or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-sage-600 focus:ring-sage-500"
                  />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artist
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity);
              const isSelected = selectedProducts.includes(product.id);

              return (
                <tr key={product.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-sage-50' : ''}`}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectProduct(product.id, e.target.checked)}
                      className="rounded border-gray-300 text-sage-600 focus:ring-sage-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image_url && (
                        <img
                          className="h-10 w-10 rounded-lg object-cover mr-4"
                          src={product.image_url}
                          alt={product.name}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.artist?.full_name || 'Unknown Artist'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{(product.price || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {product.stock_quantity}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{product.total_sales || 0} units</div>
                      <div className="text-xs text-gray-500">R{(product.total_revenue || 0).toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onShowDetails(product.id)}
                        className="text-sage-600 hover:text-sage-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="More Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Product Grid Component
interface ProductGridProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string, selected: boolean) => void;
  onUpdateStock: (id: string, stock: number, reason?: string) => Promise<boolean>;
  onShowDetails: (id: string) => void;
  getStockStatus: (quantity: number) => { label: string; color: string };
  getStatusColor: (status: string) => string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedProducts,
  onSelectProduct,
  onShowDetails,
  getStockStatus,
  getStatusColor
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-sm text-gray-600">
            Try adjusting your search or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const stockStatus = getStockStatus(product.stock_quantity);
        const isSelected = selectedProducts.includes(product.id);

        return (
          <div
            key={product.id}
            className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
              isSelected ? 'ring-2 ring-sage-500' : ''
            }`}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelectProduct(product.id, e.target.checked)}
                className="absolute top-2 left-2 z-10 rounded border-gray-300 text-sage-600 focus:ring-sage-500"
              />
              
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                  {product.status}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{product.artist?.full_name || 'Unknown Artist'}</p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-charcoal-300">R{product.price.toLocaleString()}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                  {product.stock_quantity} in stock
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{product.total_sales || 0} sold</span>
                <span>R{(product.total_revenue || 0).toLocaleString()} revenue</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onShowDetails(product.id)}
                  className="flex-1 bg-sage-600 text-white py-2 px-3 rounded-md text-sm hover:bg-sage-700"
                >
                  View Details
                </button>
                <button
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  title="More Actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Add Product Modal
interface AddProductModalProps {
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  onClose,
  onProductAdded
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
    status: 'draft' as 'active' | 'inactive' | 'draft'
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user session to get artist_id
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      let imageUrl = formData.image_url;

      // Upload image if file is selected
      if (selectedFile) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadImage(selectedFile, session.user.id, {
            bucket: 'product-images',
            folder: 'products'
          });
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          throw new Error(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        } finally {
          setIsUploading(false);
        }
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          category: formData.category,
          image_url: imageUrl || null,
          status: formData.status,
          artist_id: session.user.id
        });

      if (insertError) throw insertError;

      // Cleanup preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      onProductAdded();
      onClose();
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    setError(null);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Add New Product</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-300 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
                placeholder="Enter product name"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
                placeholder="e.g., Painting, Sculpture, Digital Art"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (R) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
                placeholder="0.00"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
                placeholder="0"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!selectedFile && !formData.image_url ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sage-400 cursor-pointer transition-colors"
                  >
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-sage-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={previewUrl || formData.image_url}
                      alt="Product preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 left-2 bg-white bg-opacity-90 text-gray-700 px-2 py-1 rounded text-sm hover:bg-opacity-100"
                    >
                      Change Image
                    </button>
                  </div>
                )}
              </div>
              
              {/* Optional: URL input as fallback */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Or enter image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    handleInputChange('image_url', e.target.value);
                    if (e.target.value) {
                      clearSelectedFile();
                    }
                  }}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500 text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
              placeholder="Describe the product..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading Image...' : loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Update Modal
interface StockUpdateModalProps {
  productId: string;
  product?: Product;
  onClose: () => void;
  onUpdate: (productId: string, newStock: number, reason?: string) => Promise<boolean>;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  productId,
  product,
  onClose,
  onUpdate
}) => {
  const [newStock, setNewStock] = useState(product?.stock_quantity?.toString() || '0');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockValue = parseInt(newStock);
    
    if (stockValue < 0) {
      alert('Stock quantity cannot be negative');
      return;
    }

    setUpdating(true);
    try {
      const success = await onUpdate(productId, stockValue, reason || 'Admin adjustment');
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Update Stock Level</h3>
          {product && (
            <p className="text-sm text-gray-600">
              {product.name} - Current stock: {product.stock_quantity}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., New shipment, Inventory adjustment..."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Product Details Modal
interface ProductDetailsModalProps {
  product?: Product;
  onClose: () => void;
  onUpdateStock: (stock: number, reason?: string) => Promise<boolean>;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onUpdateStock
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Product Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Image */}
          <div>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h4>
            <p className="text-gray-600 mb-4">{product.description || 'No description available'}</p>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Price:</span>
                <span className="font-medium">R{product.price?.toLocaleString() || '0'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <span className="font-medium">{product.stock_quantity}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium capitalize">{product.status}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium">{product.category || 'Uncategorized'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Artist:</span>
                <span className="font-medium">{product.artist?.full_name || 'Unknown'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Total Sales:</span>
                <span className="font-medium">{product.total_sales || 0} units</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Total Revenue:</span>
                <span className="font-medium">R{(product.total_revenue || 0)?.toLocaleString() || '0'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700">
            Edit Product
          </button>
        </div>
      </div>
    </div>
  );
};