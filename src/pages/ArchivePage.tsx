import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { api, APIError } from '@/lib/api/client';
import { CheckCircle, XCircle, Truck, Package, AlertTriangle, Archive, History, ChevronDown } from 'lucide-react';
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

export default function ArchivePage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unarchivingOrder, setUnarchivingOrder] = useState<string | null>(null);
  const [originalStatuses] = useState<Map<string, string>>(new Map());
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

        // Use new API client to fetch archived orders
        const response = await api.orders.list({ status: 'archived' });

        // Store original statuses before they were archived
        response.orders?.forEach(order => {
          const metadata = order.metadata as { previousStatus?: string } | null;
          if (metadata?.previousStatus) {
            originalStatuses.set(order.id, metadata.previousStatus);
          }
        });

        setOrders(response.orders || []);
      } catch (err) {
        console.error('Error in archive page:', err);
        
        if (err instanceof APIError) {
          if (err.status === 401 || err.status === 403) {
            setError('Access denied. Admin privileges required.');
            setIsAdmin(false);
            navigate('/');
            return;
          }
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch archived orders');
        }
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

  const handleUnarchiveOrder = async (orderId: string, previousStatus: string) => {
    try {
      setUnarchivingOrder(orderId);
      setError(null);

      // Get the original status or default to 'delivered'
      const statusToRestore = originalStatuses.get(orderId) || 'delivered';

      // Use new API client to update status
      // TODO: Create dedicated /admin/orders/{id}/unarchive endpoint for better semantics
      await api.orders.update(orderId, { 
        status: statusToRestore,
        notes: `Unarchived and restored to status: ${statusToRestore}`
      });

      setOrders(orders.filter(order => order.id !== orderId));

    } catch (err) {
      console.error('Error unarchiving order:', err);
      
      if (err instanceof APIError) {
        if (err.status === 401 || err.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to unarchive order');
      }
    } finally {
      setUnarchivingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading archived orders...</span>
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

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-charcoal-300">
            Archived Orders
          </h1>
          <Link
            to="/admin/orders"
            className="flex items-center gap-2 text-sage-400 hover:text-sage-500"
          >
            <History className="w-5 h-5" />
            Back to Active Orders
          </Link>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search archived orders by ID, customer name, or payment reference..."
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
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-charcoal-300">No archived orders found</p>
          </div>
        )}

        {orders.length > 0 && filteredOrders.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-charcoal-300">No archived orders found matching your search</p>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="grid gap-8">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm">
                <div className="flex justify-between items-center p-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold">#{order.id.slice(-8)}</h2>
                      <span className="text-charcoal-300">•</span>
                      <span className="text-charcoal-300">{order.profiles.full_name || order.profiles.email}</span>
                      <span className="text-charcoal-300">•</span>
                      <span className="text-sm text-charcoal-300">
                        Archived {new Date(order.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">R{order.total_amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleUnarchiveOrder(order.id, order.status)}
                        disabled={unarchivingOrder === order.id}
                        className="px-3 py-1 rounded-full text-sm border border-sage-400 text-sage-400 hover:bg-sage-50 flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        {unarchivingOrder === order.id ? (
                          <div className="w-4 h-4 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Unarchive'
                        )}
                      </button>
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
                          <p className="text-sm text-charcoal-300">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}