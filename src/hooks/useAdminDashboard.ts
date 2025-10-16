import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAnalytics } from './useAnalytics';

interface DashboardMetrics {
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    currency: string;
    growth_rate: number;
  };
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    average_value: number;
  };
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    retention_rate: number;
  };
  products: {
    total: number;
    active: number;
    out_of_stock: number;
    low_stock: number;
    draft: number;
    top_selling: ProductSalesData[];
  };
  artists: {
    total: number;
    active: number;
    pending_approval: number;
    top_earning: ArtistEarningsData[];
  };
  analytics: {
    page_views: number;
    unique_visitors: number;
    conversion_rate: number;
    bounce_rate: number;
    avg_session_duration: number;
  };
}

interface ProductSalesData {
  id: string;
  name: string;
  artist_name: string;
  total_sales: number;
  units_sold: number;
  revenue: number;
  image_url: string;
}

interface ArtistEarningsData {
  id: string;
  name: string;
  avatar_url?: string;
  total_revenue: number;
  total_sales: number;
  commission_rate: number;
  earnings: number;
}

interface InventoryItem {
  id: string;
  name: string;
  artist_name: string;
  category: string;
  price: number;
  stock_quantity: number;
  status: string;
  created_at: string;
  image_url: string;
  views: number;
  likes: number;
  last_sold: string | null;
}

interface OrderManagement {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_address: any;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  artist_name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface UserManagement {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  is_artist: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string;
  total_orders: number;
  total_spent: number;
  status: 'active' | 'suspended' | 'pending';
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  severity: number;
  created_at: string;
  resolved: boolean;
  data?: Record<string, any>;
}

export function useAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderManagement[]>([]);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() });

  const { trackUserEngagement } = useAnalytics();

  // Load dashboard metrics
  const loadMetrics = useCallback(async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const start = startDate || dateRange.start;
      const end = endDate || dateRange.end;

      const [
        revenueData,
        ordersData,
        usersData,
        productsData,
        artistsData,
        analyticsData
      ] = await Promise.all([
        getRevenueMetrics(start, end),
        getOrderMetrics(start, end),
        getUserMetrics(start, end),
        getProductMetrics(start, end),
        getArtistMetrics(start, end),
        getAnalyticsMetrics(start, end)
      ]);

      setMetrics({
        revenue: revenueData,
        orders: ordersData,
        users: usersData,
        products: productsData,
        artists: artistsData,
        analytics: analyticsData,
      });

      trackUserEngagement({
        action: 'admin_dashboard_loaded',
        element: 'dashboard_metrics',
        value: 'metrics_refreshed',
      });

    } catch (error: any) {
      console.error('Error loading admin metrics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, trackUserEngagement]);

  // Get revenue metrics
  const getRevenueMetrics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.rpc('get_revenue_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) throw error;

    return data || {
      total: 0,
      monthly: 0,
      weekly: 0,
      daily: 0,
      currency: 'USD',
      growth_rate: 0,
    };
  };

  // Get order metrics
  const getOrderMetrics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.rpc('get_order_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) throw error;

    return data || {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      average_value: 0,
    };
  };

  // Get user metrics
  const getUserMetrics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.rpc('get_user_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) throw error;

    return data || {
      total: 0,
      active: 0,
      new_today: 0,
      new_this_week: 0,
      new_this_month: 0,
      retention_rate: 0,
    };
  };

  // Get product metrics
  const getProductMetrics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.rpc('get_product_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) throw error;

    return data || {
      total: 0,
      active: 0,
      out_of_stock: 0,
      low_stock: 0,
      draft: 0,
      top_selling: [],
    };
  };

  // Get artist metrics
  const getArtistMetrics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.rpc('get_artist_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) throw error;

    return data || {
      total: 0,
      active: 0,
      pending_approval: 0,
      top_earning: [],
    };
  };

  // Get analytics metrics
  const getAnalyticsMetrics = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.rpc('get_analytics_metrics', {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    if (error) throw error;

    return data || {
      page_views: 0,
      unique_visitors: 0,
      conversion_rate: 0,
      bounce_rate: 0,
      avg_session_duration: 0,
    };
  };

  // Load inventory management data
  const loadInventory = useCallback(async (filters?: {
    category?: string;
    status?: string;
    stock_level?: 'all' | 'low' | 'out';
    search?: string;
  }) => {
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          price,
          stock_quantity,
          status,
          created_at,
          image_url,
          profiles:artist_id (
            full_name
          ),
          product_analytics (
            total_views,
            total_likes
          ),
          order_items (
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.stock_level === 'low') {
        query = query.lte('stock_quantity', 5).gt('stock_quantity', 0);
      } else if (filters?.stock_level === 'out') {
        query = query.eq('stock_quantity', 0);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      const inventoryData: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        artist_name: item.profiles?.full_name || 'Unknown Artist',
        category: item.category,
        price: item.price,
        stock_quantity: item.stock_quantity,
        status: item.status,
        created_at: item.created_at,
        image_url: item.image_url,
        views: item.product_analytics?.[0]?.total_views || 0,
        likes: item.product_analytics?.[0]?.total_likes || 0,
        last_sold: item.order_items?.[0]?.created_at || null,
      }));

      setInventory(inventoryData);
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      setError(error.message);
    }
  }, []);

  // Load order management data
  const loadOrders = useCallback(async (filters?: {
    status?: string;
    payment_status?: string;
    date_range?: { start: Date; end: Date };
    search?: string;
  }) => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          created_at,
          shipping_address,
          profiles:user_id (
            full_name,
            email
          ),
          order_items (
            id,
            product_name,
            price,
            quantity,
            products (
              image_url,
              profiles:artist_id (
                full_name
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      if (filters?.date_range) {
        query = query
          .gte('created_at', filters.date_range.start.toISOString())
          .lte('created_at', filters.date_range.end.toISOString());
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      const ordersData: OrderManagement[] = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.profiles?.full_name || 'Unknown',
        customer_email: order.profiles?.email || '',
        total_amount: order.total_amount,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        shipping_address: order.shipping_address,
        items: order.order_items.map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          artist_name: item.products?.profiles?.full_name || 'Unknown Artist',
          price: item.price,
          quantity: item.quantity,
          image_url: item.products?.image_url || '',
        })),
      }));

      setOrders(ordersData);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setError(error.message);
    }
  }, []);

  // Load user management data
  const loadUsers = useCallback(async (filters?: {
    user_type?: 'all' | 'artists' | 'customers';
    status?: string;
    search?: string;
  }) => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          is_artist,
          is_verified,
          created_at,
          last_login,
          auth_users:id (
            email,
            email_confirmed_at
          ),
          orders (
            count,
            total_amount:total_amount.sum()
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.user_type === 'artists') {
        query = query.eq('is_artist', true);
      } else if (filters?.user_type === 'customers') {
        query = query.eq('is_artist', false);
      }

      if (filters?.search) {
        query = query.ilike('full_name', `%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      const usersData: UserManagement[] = (data || []).map(user => ({
        id: user.id,
        full_name: user.full_name || 'Unknown',
        email: user.auth_users?.email || '',
        avatar_url: user.avatar_url,
        is_artist: user.is_artist,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login: user.last_login || user.created_at,
        total_orders: user.orders?.length || 0,
        total_spent: user.orders?.[0]?.total_amount || 0,
        status: user.auth_users?.email_confirmed_at ? 'active' : 'pending',
      }));

      setUsers(usersData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.message);
    }
  }, []);

  // Load system alerts
  const loadAlerts = useCallback(async () => {
    try {
      // Check for various system issues
      const alertsData: SystemAlert[] = [];

      // Low stock alerts
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, name, stock_quantity')
        .lte('stock_quantity', 5)
        .gt('stock_quantity', 0)
        .eq('status', 'active');

      if (lowStockProducts && lowStockProducts.length > 0) {
        alertsData.push({
          id: 'low-stock-alert',
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockProducts.length} products are running low on stock`,
          severity: 2,
          created_at: new Date().toISOString(),
          resolved: false,
          data: { products: lowStockProducts },
        });
      }

      // Failed payment alerts
      const { data: failedPayments } = await supabase
        .from('orders')
        .select('id, order_number, total_amount')
        .eq('payment_status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (failedPayments && failedPayments.length > 0) {
        alertsData.push({
          id: 'failed-payments-alert',
          type: 'error',
          title: 'Failed Payments',
          message: `${failedPayments.length} payments failed in the last 24 hours`,
          severity: 3,
          created_at: new Date().toISOString(),
          resolved: false,
          data: { orders: failedPayments },
        });
      }

      // Pending artist approvals
      const { data: pendingArtists } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_artist', true)
        .eq('is_verified', false);

      if (pendingArtists && pendingArtists.length > 0) {
        alertsData.push({
          id: 'pending-artists-alert',
          type: 'info',
          title: 'Pending Artist Approvals',
          message: `${pendingArtists.length} artists are waiting for approval`,
          severity: 1,
          created_at: new Date().toISOString(),
          resolved: false,
          data: { artists: pendingArtists },
        });
      }

      setAlerts(alertsData);
    } catch (error: any) {
      console.error('Error loading alerts:', error);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: string, trackingNumber?: string) => {
    try {
      const updateData: any = { status };
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Refresh orders
      loadOrders();

      trackUserEngagement({
        action: 'admin_order_status_updated',
        element: 'order_management',
        value: `${status}_${orderId}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      setError(error.message);
      return false;
    }
  }, [loadOrders, trackUserEngagement]);

  // Update product inventory
  const updateProductInventory = useCallback(async (productId: string, stockQuantity: number, price?: number) => {
    try {
      const updateData: any = { stock_quantity: stockQuantity };
      if (price !== undefined) {
        updateData.price = price;
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;

      // Refresh inventory
      loadInventory();

      trackUserEngagement({
        action: 'admin_inventory_updated',
        element: 'inventory_management',
        value: `${productId}_${stockQuantity}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      setError(error.message);
      return false;
    }
  }, [loadInventory, trackUserEngagement]);

  // Approve/reject artist
  const updateArtistStatus = useCallback(async (artistId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: approved })
        .eq('id', artistId);

      if (error) throw error;

      // Send notification to artist
      await supabase.from('notifications').insert({
        user_id: artistId,
        type: approved ? 'artist_approved' : 'artist_rejected',
        title: approved ? 'Artist Application Approved' : 'Artist Application Update',
        message: approved 
          ? 'Congratulations! Your artist application has been approved.'
          : 'Your artist application needs additional review.',
      });

      // Refresh users
      loadUsers();

      trackUserEngagement({
        action: 'admin_artist_status_updated',
        element: 'user_management',
        value: `${approved ? 'approved' : 'rejected'}_${artistId}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error updating artist status:', error);
      setError(error.message);
      return false;
    }
  }, [loadUsers, trackUserEngagement]);

  // Export data
  const exportData = useCallback(async (type: 'orders' | 'users' | 'products', format: 'csv' | 'json') => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'orders':
          data = orders;
          filename = `orders_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'users':
          data = users;
          filename = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
        case 'products':
          data = inventory;
          filename = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
          break;
      }

      let content = '';
      let mimeType = '';

      if (format === 'csv') {
        // Convert to CSV
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row => 
              headers.map(field => {
                const value = row[field];
                // Escape CSV values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              }).join(',')
            )
          ].join('\n');
          content = csvContent;
        }
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      trackUserEngagement({
        action: 'admin_data_exported',
        element: 'export_button',
        value: `${type}_${format}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error exporting data:', error);
      setError(error.message);
      return false;
    }
  }, [orders, users, inventory, trackUserEngagement]);

  useEffect(() => {
    loadMetrics();
    loadAlerts();
  }, [loadMetrics, loadAlerts]);

  return {
    // Data
    metrics,
    inventory,
    orders,
    users,
    alerts,

    // State
    loading,
    error,
    dateRange,

    // Actions
    loadMetrics,
    loadInventory,
    loadOrders,
    loadUsers,
    loadAlerts,
    setDateRange,

    // Management actions
    updateOrderStatus,
    updateProductInventory,
    updateArtistStatus,
    exportData,

    // Utils
    setError,
  };
}