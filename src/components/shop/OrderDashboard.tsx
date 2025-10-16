import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  MessageSquare,
  Star,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  CreditCard,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  total: number;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingNumber?: string;
  paymentMethod: string;
}

interface OrderItem {
  id: string;
  title: string;
  artist_name: string;
  price: number;
  quantity: number;
  image_url: string;
  dimensions?: string;
  medium?: string;
}

const OrderDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    orders,
    ordersLoading,
    ordersError,
    fetchOrders,
    trackOrder,
    cancelOrder,
    downloadInvoice
  } = useOrders();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Mock orders data
  const [mockOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'CA-2024-001',
      status: 'delivered',
      orderDate: '2024-01-15T10:00:00Z',
      expectedDelivery: '2024-01-22T10:00:00Z',
      actualDelivery: '2024-01-21T14:30:00Z',
      total: 1468.37,
      items: [
        {
          id: '1',
          title: 'Abstract Symphony #1',
          artist_name: 'Maya Chen',
          price: 1299.99,
          quantity: 1,
          image_url: '/api/placeholder/100/100',
          dimensions: '24" x 36"',
          medium: 'Acrylic on Canvas'
        }
      ],
      shippingAddress: {
        name: 'John Doe',
        address: '123 Art Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      trackingNumber: '1Z999AA1012345675',
      paymentMethod: 'Credit Card ending in 4242'
    },
    {
      id: '2',
      orderNumber: 'CA-2024-002',
      status: 'shipped',
      orderDate: '2024-01-20T14:00:00Z',
      expectedDelivery: '2024-01-27T10:00:00Z',
      total: 279.98,
      items: [
        {
          id: '2',
          title: 'Digital Dreams Collection',
          artist_name: 'Alex Rivera',
          price: 89.99,
          quantity: 2,
          image_url: '/api/placeholder/100/100',
          dimensions: '16" x 20"',
          medium: 'Digital Print'
        }
      ],
      shippingAddress: {
        name: 'John Doe',
        address: '123 Art Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      trackingNumber: '1Z999AA1012345676',
      paymentMethod: 'PayPal'
    },
    {
      id: '3',
      orderNumber: 'CA-2024-003',
      status: 'processing',
      orderDate: '2024-01-22T09:00:00Z',
      expectedDelivery: '2024-01-29T10:00:00Z',
      total: 899.99,
      items: [
        {
          id: '3',
          title: 'Coastal Serenity',
          artist_name: 'Sarah Thompson',
          price: 899.99,
          quantity: 1,
          image_url: '/api/placeholder/100/100',
          dimensions: '20" x 24"',
          medium: 'Oil on Canvas'
        }
      ],
      shippingAddress: {
        name: 'John Doe',
        address: '123 Art Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      },
      paymentMethod: 'Credit Card ending in 1234'
    }
  ]);

  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);

  useEffect(() => {
    let filtered = [...mockOrders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort orders
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
        break;
      case 'amount_high':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'amount_low':
        filtered.sort((a, b) => a.total - b.total);
        break;
    }

    setFilteredOrders(filtered);
  }, [statusFilter, searchTerm, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case 'processing':
        return { icon: Package, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'shipped':
        return { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-100' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' };
      case 'cancelled':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Order Placed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleTrackOrder = async (order: Order) => {
    if (order.trackingNumber) {
      // In a real app, this would open a tracking page or modal
      window.open(`https://www.ups.com/track?loc=en_US&tracknum=${order.trackingNumber}`, '_blank');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      await downloadInvoice(orderId);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId);
      } catch (error) {
        console.error('Failed to cancel order:', error);
      }
    }
  };

  if (ordersLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-lg text-gray-600">
          Track and manage your artwork purchases
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number or artwork..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Highest Amount</option>
              <option value="amount_low">Lowest Amount</option>
            </select>

            <button
              onClick={() => fetchOrders?.()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Refresh Orders"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {ordersError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <p className="text-red-700">{ordersError}</p>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-6">
            {statusFilter !== 'all' || searchTerm
              ? 'Try adjusting your filters or search terms.'
              : 'Start shopping to see your orders here.'}
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Start Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const { icon: StatusIcon, color, bg } = getStatusIcon(order.status);
            
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className={`p-2 rounded-full ${bg}`}>
                        <StatusIcon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Order {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Placed on {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:items-end">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  {(order.expectedDelivery || order.actualDelivery) && (
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {order.status === 'delivered' && order.actualDelivery ? (
                        <span>Delivered on {new Date(order.actualDelivery).toLocaleDateString()}</span>
                      ) : order.expectedDelivery ? (
                        <span>Expected delivery: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                  )}

                  {/* Tracking Number */}
                  {order.trackingNumber && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <Truck className="w-4 h-4 mr-2" />
                      <span>Tracking: {order.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">by {item.artist_name}</p>
                          {item.dimensions && (
                            <p className="text-xs text-gray-500">
                              {item.dimensions} • {item.medium}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${item.price.toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {order.trackingNumber && (
                      <button
                        onClick={() => handleTrackOrder(order)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Track Package
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Invoice
                    </button>

                    {order.status === 'delivered' && (
                      <button className="flex items-center px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors">
                        <Star className="w-4 h-4 mr-2" />
                        Leave Review
                      </button>
                    )}

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}

                    <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Seller
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal: React.FC<{
  order: Order;
  onClose: () => void;
}> = ({ order, onClose }) => {
  const { icon: StatusIcon, color, bg } = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    processing: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-100' },
    shipped: { icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    cancelled: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' }
  }[order.status] || { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100' };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${bg}`}>
              <StatusIcon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Order {order.orderNumber}
              </h2>
              <p className="text-sm text-gray-600">
                Placed on {new Date(order.orderDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Address */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Shipping Address
            </h3>
            <div className="text-sm text-gray-600">
              <p>{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Method
            </h3>
            <p className="text-sm text-gray-600">{order.paymentMethod}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">by {item.artist_name}</p>
                  {item.dimensions && (
                    <p className="text-xs text-gray-500">
                      {item.dimensions} • {item.medium}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-lg font-semibold text-gray-900">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDashboard;