import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SalesMetric {
  date: string;
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  average_order_value: number;
  conversion_rate: number;
}

interface BusinessOverview {
  total_products: number;
  total_users: number;
  total_orders: number;
  pending_messages: number;
  active_alerts: number;
}

interface RecentActivity {
  new_users_7d: number;
  orders_7d: number;
  sessions_7d: number;
  page_views_7d: number;
}

export default function SalesDashboard() {
  const [salesMetrics, setSalesMetrics] = useState<SalesMetric[]>([]);
  const [businessOverview, setBusinessOverview] = useState<BusinessOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch sales metrics (last 30 days)
      const { data: salesData, error: salesError } = await supabase
        .from('sales_metrics')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (salesError) throw salesError;

      // Fetch business overview
      const { data: overviewData, error: overviewError } = await supabase
        .rpc('get_business_overview');

      if (overviewError) {
        // Fallback: manual queries if RPC doesn't exist
        const [products, users, orders, messages, alerts] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('inventory_alerts').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
        ]);

        setBusinessOverview({
          total_products: products.count || 0,
          total_users: users.count || 0,
          total_orders: orders.count || 0,
          pending_messages: messages.count || 0,
          active_alerts: alerts.count || 0,
        });
      } else {
        setBusinessOverview(overviewData[0]);
      }

      // Fetch recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const [newUsers, orders, sessions, pageViews] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('user_sessions').select('id', { count: 'exact', head: true }).gte('started_at', sevenDaysAgo),
        supabase.from('user_browsing_history').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      ]);

      setRecentActivity({
        new_users_7d: newUsers.count || 0,
        orders_7d: orders.count || 0,
        sessions_7d: sessions.count || 0,
        page_views_7d: pageViews.count || 0,
      });

      setSalesMetrics(salesData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
    if (previous === 0) return { percentage: 0, isPositive: true };
    const percentage = ((current - previous) / previous) * 100;
    return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
  };

  const getRevenueGrowth = () => {
    if (salesMetrics.length < 2) return { percentage: 0, isPositive: true };
    
    const thisWeek = salesMetrics.slice(0, 7).reduce((sum, day) => sum + Number(day.total_revenue), 0);
    const lastWeek = salesMetrics.slice(7, 14).reduce((sum, day) => sum + Number(day.total_revenue), 0);
    
    return calculateGrowth(thisWeek, lastWeek);
  };

  const getOrdersGrowth = () => {
    if (salesMetrics.length < 2) return { percentage: 0, isPositive: true };
    
    const thisWeek = salesMetrics.slice(0, 7).reduce((sum, day) => sum + day.total_orders, 0);
    const lastWeek = salesMetrics.slice(7, 14).reduce((sum, day) => sum + day.total_orders, 0);
    
    return calculateGrowth(thisWeek, lastWeek);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }

  const revenueGrowth = getRevenueGrowth();
  const ordersGrowth = getOrdersGrowth();
  const totalRevenue = salesMetrics.reduce((sum, day) => sum + Number(day.total_revenue), 0);
  const totalOrders = salesMetrics.reduce((sum, day) => sum + day.total_orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal-300 mb-2">Sales Dashboard</h1>
          <p className="text-charcoal-200">Overview of your ChartedArt business performance</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Total Revenue (30d)</p>
                <p className="text-2xl font-bold text-charcoal-300">
                  R{totalRevenue.toFixed(2)}
                </p>
                <div className="flex items-center mt-2">
                  {revenueGrowth.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${revenueGrowth.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueGrowth.percentage.toFixed(1)}% vs last week
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-sage-400" />
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Total Orders (30d)</p>
                <p className="text-2xl font-bold text-charcoal-300">{totalOrders}</p>
                <div className="flex items-center mt-2">
                  {ordersGrowth.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${ordersGrowth.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {ordersGrowth.percentage.toFixed(1)}% vs last week
                  </span>
                </div>
              </div>
              <ShoppingCart className="w-8 h-8 text-sage-400" />
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-charcoal-300">
                  R{avgOrderValue.toFixed(2)}
                </p>
                <p className="text-sm text-charcoal-200 mt-2">Last 30 days</p>
              </div>
              <Calendar className="w-8 h-8 text-sage-400" />
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal-200 text-sm">Active Users (7d)</p>
                <p className="text-2xl font-bold text-charcoal-300">
                  {recentActivity?.sessions_7d || 0}
                </p>
                <p className="text-sm text-charcoal-200 mt-2">
                  {recentActivity?.page_views_7d || 0} page views
                </p>
              </div>
              <Eye className="w-8 h-8 text-sage-400" />
            </div>
          </div>
        </div>

        {/* Business Overview */}
        {businessOverview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Business Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Products</span>
                  <span className="font-medium">{businessOverview.total_products}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Total Users</span>
                  <span className="font-medium">{businessOverview.total_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Total Orders</span>
                  <span className="font-medium">{businessOverview.total_orders}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-charcoal-200">New Users (7d)</span>
                  <span className="font-medium text-green-600">{recentActivity?.new_users_7d || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Orders (7d)</span>
                  <span className="font-medium text-blue-600">{recentActivity?.orders_7d || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Sessions (7d)</span>
                  <span className="font-medium">{recentActivity?.sessions_7d || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Alerts & Messages</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Pending Messages</span>
                  <span className={`font-medium ${businessOverview.pending_messages > 0 ? 'text-amber-600' : 'text-charcoal-300'}`}>
                    {businessOverview.pending_messages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-200">Inventory Alerts</span>
                  <span className={`font-medium ${businessOverview.active_alerts > 0 ? 'text-red-600' : 'text-charcoal-300'}`}>
                    {businessOverview.active_alerts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sales Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Revenue Trend (Last 10 Days)</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {salesMetrics.slice(0, 10).reverse().map((day, index) => {
              const maxRevenue = Math.max(...salesMetrics.slice(0, 10).map(d => Number(d.total_revenue)));
              const height = maxRevenue > 0 ? (Number(day.total_revenue) / maxRevenue) * 200 : 0;
              
              return (
                <div key={day.date} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-sage-400 rounded-t-sm w-full transition-all duration-300 hover:bg-sage-500"
                    style={{ height: `${Math.max(height, 4)}px` }}
                    title={`${new Date(day.date).toLocaleDateString()}: R${Number(day.total_revenue).toFixed(2)}`}
                  ></div>
                  <span className="text-xs text-charcoal-200 mt-2 transform -rotate-45 origin-center">
                    {new Date(day.date).toLocaleDateString('en-GB', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}