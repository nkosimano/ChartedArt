import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Truck, Package, AlertTriangle, Archive, ChevronDown } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row']
  })[];
  profiles: Database['public']['Tables']['profiles']['Row'];
};

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-100 text-blue-700' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-green-100 text-green-700' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-sage-100 text-sage-700' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700' }
];

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [archivingOrder, setArchivingOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    const checkAdminAndFetchOrders = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth/login');
          return;
        }

        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (adminError) {
          throw adminError;
        }

        if (!adminUser) {
          setIsAdmin(false);
          navigate('/');
          return;
        }

        setIsAdmin(true);

        // Fetch orders directly from Supabase
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (*)
            ),
            profiles (*)
          `)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
      } catch (err) {
        console.error('Error in admin page:', err);
        
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchOrders();
  }, [navigate]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => {
      const matchesId = order.id.toLowerCase().includes(search);
      const matchesCustomer = (order.profiles.full_name || order.profiles.email).toLowerCase().includes(search);
      const matchesPaymentRef = order.payment_reference?.toLowerCase().includes(search);
      return matchesId || matchesCustomer || matchesPaymentRef;
    });

    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrder(orderId);
      setError(null);

      // Update order status directly with Supabase
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Optimistic UI update
      setOrders(orders.map(order => 
        order.id === orderId ? {
          ...order,
          status: newStatus,
          updated_at: new Date().toISOString()
        } : order
      ));

      // If the order was archived, remove it from the list
      if (newStatus === 'archived') {
        setOrders(orders.filter(order => order.id !== orderId));
      }

    } catch (err) {
      console.error('Error updating order status:', err);
      
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      setArchivingOrder(orderId);
      setError(null);

      // Get the current order to store its status
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update status to archived directly with Supabase
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'archived',
          notes: `Archived from status: ${order.status}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Remove the archived order from the list
      setOrders(orders.filter(order => order.id !== orderId));

    } catch (err) {
      console.error('Error archiving order:', err);
      
      setError(err instanceof Error ? err.message : 'Failed to archive order');
    } finally {
      setArchivingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading orders...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            Access denied. You must be an admin to view this page.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-charcoal-300 mb-12">
          Order Management
        </h1>
          
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search orders by ID, customer name, or payment reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
          />
        </div>

        <div className="grid gap-8">
          {orders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-charcoal-300">No orders found</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-charcoal-300">No orders found matching your search</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm">
                <div className="flex justify-between items-center p-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold">#{order.id.slice(-8)}</h2>
                      <span className="text-charcoal-300">•</span>
                      <span className="text-charcoal-300">{order.profiles?.full_name || order.profiles?.email}</span>
                      <span className="text-charcoal-300">•</span>
                      <span className="text-sm text-charcoal-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">R{order.total_amount.toFixed(2)}</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={updatingOrder === order.id || order.status === 'archived'}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          ORDER_STATUSES.find(s => s.value === order.status)?.color || ''
                        }`}
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {order.status !== 'archived' && (
                        <button
                          onClick={() => handleArchiveOrder(order.id)}
                          disabled={archivingOrder === order.id}
                          className="px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Archive className="w-4 h-4" />
                          {archivingOrder === order.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Archive'
                          )}
                        </button>
                      )}
                      {updatingOrder === order.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sage-400"></div>
                      )}
                    </div>
                  </div>
                </div>

                <details className="group">
                  <summary className="cursor-pointer p-4 border-t flex items-center justify-between hover:bg-gray-50">
                    <span className="font-medium">Order Details</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 border-t space-y-6 bg-gray-50">
                    <div>
                      <h3 className="font-medium mb-3">Items</h3>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg">
                            <div className="w-16 h-16 flex-shrink-0">
                              <img
                                src={item.image_url}
                                alt="Product preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-grow">
                              <p className="font-medium text-sm">
                                {item.products.size} - {item.products.frame_type} Frame
                              </p>
                              <p className="text-sm text-charcoal-200">
                                {item.quantity}x · R{item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-3">Shipping Address</h3>
                      <div className="bg-white p-3 rounded-lg text-sm text-charcoal-300">
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
                      <div>
                        <h3 className="font-medium mb-3">Payment Information</h3>
                        <div className="bg-white p-3 rounded-lg text-sm">
                          <p className="text-charcoal-300">
                            Reference: <span className="font-medium">{order.payment_reference}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}