import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Truck, Package, AlertTriangle } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row']
  })[];
};

const ORDER_STATUS_INFO = {
  pending: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
    message: 'Your order has been received and is being reviewed'
  },
  processing: {
    icon: Package,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    message: 'Your order is being prepared for shipping'
  },
  shipped: {
    icon: Truck,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    message: 'Your order is on its way'
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-sage-500',
    bgColor: 'bg-sage-100',
    message: 'Your order has been delivered'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    message: 'This order has been cancelled'
  }
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/login');
          return;
        }

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            )
          `)
          .eq('user_id', session.user.id)
          .not('status', 'eq', 'archived')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Set up real-time subscription for order updates
        const channel = supabase
          .channel('orders_channel')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${session.user.id}`
            },
            async () => {
              // Refresh orders when changes occur
              const { data: refreshedOrders, error: refreshError } = await supabase
                .from('orders')
                .select(`
                  *,
                  order_items (
                    *,
                    products (*)
                  )
                `)
                .eq('user_id', session.user.id)
                .not('status', 'eq', 'archived')
                .order('created_at', { ascending: false });

              if (!refreshError) {
                setOrders(refreshedOrders || []);
              }
            }
          )
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => {
      const matchesId = order.id.toLowerCase().includes(search);
      const matchesStatus = order.status.toLowerCase().includes(search);
      const matchesPaymentRef = order.payment_reference?.toLowerCase().includes(search);
      return matchesId || matchesStatus || matchesPaymentRef;
    });

    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading orders...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-charcoal-300 mb-8">
          Your Orders
        </h1>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search orders by ID, status, or payment reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-charcoal-300 mb-6">You haven't placed any orders yet</p>
            <button
              onClick={() => navigate('/create')}
              className="bg-sage-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors"
            >
              Create Your First Kit
            </button>
          </div>
        )}

        {orders.length > 0 && filteredOrders.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-charcoal-300">No orders found matching your search</p>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="space-y-8">
            {filteredOrders.map((order) => {
              const statusInfo = ORDER_STATUS_INFO[order.status as keyof typeof ORDER_STATUS_INFO];
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">Order #{order.id}</h2>
                      <p className="text-charcoal-300">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mb-3">R{order.total_amount.toFixed(2)}</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                        <span className={`text-sm font-medium ${statusInfo.color}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-24 h-24 flex-shrink-0">
                            <img
                              src={item.image_url}
                              alt="Product preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex-grow">
                            <p className="font-semibold">
                              {item.products.size} - {item.products.frame_type} Frame
                            </p>
                            <p className="text-charcoal-300">Quantity: {item.quantity}</p>
                            <p className="text-charcoal-300">Price: R{item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t mt-6 pt-6">
                    <h3 className="font-semibold mb-4">Shipping Address</h3>
                    <div className="text-charcoal-300">
                      <p>{(order.shipping_address as any).street}</p>
                      <p>{(order.shipping_address as any).suburb}</p>
                      <p>
                        {(order.shipping_address as any).city},{' '}
                        {(order.shipping_address as any).province}
                      </p>
                      <p>{(order.shipping_address as any).postal_code}</p>
                    </div>
                  </div>

                  {order.payment_reference && (
                    <div className="border-t mt-6 pt-6">
                      <h3 className="font-semibold mb-2">Payment Information</h3>
                      <p className="text-charcoal-200">Reference: {order.payment_reference}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}