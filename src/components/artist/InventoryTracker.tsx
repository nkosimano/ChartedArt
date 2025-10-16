import React, { useState } from 'react';
import { useArtistPortal } from '../../hooks/useArtistPortal';
import { useProducts } from '../../hooks/useProducts'; // Assuming you have this hook
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
  Settings
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  status: 'active' | 'inactive' | 'draft';
  image_url?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

const InventoryTracker: React.FC = () => {
  const {
    inventoryLogs,
    inventoryLoading,
    inventoryError,
    updateProductStock
  } = useArtistPortal();

  // Mock products data - in a real app, this would come from useProducts or similar
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Abstract Canvas #1',
      price: 299.99,
      stock_quantity: 5,
      status: 'active',
      image_url: '/api/placeholder/100/100',
      category: 'painting',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'Digital Print Collection',
      price: 49.99,
      stock_quantity: 0,
      status: 'active',
      image_url: '/api/placeholder/100/100',
      category: 'digital',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-18T11:20:00Z'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [showStockModal, setShowStockModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'products' | 'logs'>('products');

  // Filter products based on search and stock level
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = 
      stockFilter === 'all' ||
      (stockFilter === 'in_stock' && product.stock_quantity > 0) ||
      (stockFilter === 'low_stock' && product.stock_quantity > 0 && product.stock_quantity <= 5) ||
      (stockFilter === 'out_of_stock' && product.stock_quantity === 0);
    
    return matchesSearch && matchesStock;
  });

  // Calculate stock metrics
  const stockMetrics = {
    total: products.length,
    inStock: products.filter(p => p.stock_quantity > 0).length,
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0)
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-700 bg-red-100 border-red-200' };
    if (quantity <= 5) return { label: 'Low Stock', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
    return { label: 'In Stock', color: 'text-green-700 bg-green-100 border-green-200' };
  };

  const getStockIcon = (quantity: number) => {
    if (quantity === 0) return AlertTriangle;
    if (quantity <= 5) return TrendingDown;
    return Package;
  };

  if (inventoryLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Tracker</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor your product stock levels and inventory changes
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('products')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'products'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 mr-1 inline" />
              Products
            </button>
            <button
              onClick={() => setViewMode('logs')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'logs'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4 mr-1 inline" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Stock Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-6 w-6 text-gray-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-lg font-semibold text-gray-900">{stockMetrics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Stock</p>
              <p className="text-lg font-semibold text-gray-900">{stockMetrics.inStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-lg font-semibold text-gray-900">{stockMetrics.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-lg font-semibold text-gray-900">{stockMetrics.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-gray-900">${stockMetrics.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {inventoryError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{inventoryError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Stock Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="pl-10 pr-4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'products' ? (
        <ProductsView
          products={filteredProducts}
          onUpdateStock={updateProductStock}
          onShowStockModal={setShowStockModal}
        />
      ) : (
        <InventoryLogsView logs={inventoryLogs || []} />
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
    </div>
  );
};

// Products View Component
const ProductsView: React.FC<{
  products: Product[];
  onUpdateStock: (productId: string, newStock: number, reason?: string) => Promise<boolean>;
  onShowStockModal: (productId: string) => void;
}> = ({ products, onUpdateStock, onShowStockModal }) => {
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-700 bg-red-100 border-red-200' };
    if (quantity <= 5) return { label: 'Low Stock', color: 'text-yellow-700 bg-yellow-100 border-yellow-200' };
    return { label: 'In Stock', color: 'text-green-700 bg-green-100 border-green-200' };
  };

  const getStockIcon = (quantity: number) => {
    if (quantity === 0) return AlertTriangle;
    if (quantity <= 5) return TrendingDown;
    return Package;
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Product Inventory</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock_quantity);
              const StockIcon = getStockIcon(product.stock_quantity);
              
              return (
                <tr key={product.id} className="hover:bg-gray-50">
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
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StockIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {product.stock_quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${(product.price * product.stock_quantity).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onShowStockModal(product.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Update Stock"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
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

// Inventory Logs View Component
const InventoryLogsView: React.FC<{ logs: any[] }> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'stock_added':
        return { icon: Plus, color: 'text-green-600' };
      case 'stock_removed':
        return { icon: Minus, color: 'text-red-600' };
      case 'sale':
        return { icon: TrendingDown, color: 'text-blue-600' };
      case 'adjustment':
        return { icon: Settings, color: 'text-yellow-600' };
      default:
        return { icon: Package, color: 'text-gray-600' };
    }
  };

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <History className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No inventory changes</h3>
          <p className="mt-2 text-sm text-gray-600">
            Inventory changes will appear here when they occur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Inventory History</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {logs.map((log) => {
          const { icon: ActionIcon, color } = getActionIcon(log.action);
          
          return (
            <div key={log.id} className="px-6 py-4">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${color}`}>
                  <ActionIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {log.product?.image_url && (
                        <img
                          className="h-8 w-8 rounded object-cover"
                          src={log.product.image_url}
                          alt={log.product.name}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {log.action.replace('_', ' ').charAt(0).toUpperCase() + 
                           log.action.replace('_', ' ').slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.previous_stock} → {log.new_stock}
                      </p>
                    </div>
                  </div>
                  {log.reason && (
                    <p className="mt-1 text-sm text-gray-600">{log.reason}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Stock Update Modal
const StockUpdateModal: React.FC<{
  productId: string;
  product?: Product;
  onClose: () => void;
  onUpdate: (productId: string, newStock: number, reason?: string) => Promise<boolean>;
}> = ({ productId, product, onClose, onUpdate }) => {
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
      const success = await onUpdate(productId, stockValue, reason || 'Manual update');
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
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryTracker;