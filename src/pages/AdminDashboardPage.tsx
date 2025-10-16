import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { 
  BarChart3, 
  ShoppingCart, 
  MessageSquare, 
  Package, 
  Users,
  Settings,
  Bell,
  TrendingUp
} from 'lucide-react';
import SalesDashboard from '@/components/admin/SalesDashboard';
import ProductManagement from '@/components/admin/ProductManagement';
import CustomerManagement from '@/components/admin/CustomerManagement';
import SystemSettings from '@/components/admin/SystemSettings';
import MovementManagement from '@/components/admin/MovementManagement';
import AdminOrdersPage from './AdminOrdersPage';
import AdminMessagesPage from './AdminMessagesPage';

type TabType = 'dashboard' | 'orders' | 'messages' | 'products' | 'customers' | 'movements' | 'settings';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    checkAdminAccess();
    fetchNotifications();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth/login');
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select(`
          *,
          profiles!admin_users_user_id_fkey(*)
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminError) throw adminError;

      if (!adminData) {
        setIsAdmin(false);
        navigate('/');
        return;
      }

      setIsAdmin(true);
      setAdminUser(adminData);
    } catch (err) {
      console.error('Error checking admin access:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get counts for notifications
      const [pendingMessages, activeAlerts] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('inventory_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('is_resolved', false)
      ]);

      setNotifications((pendingMessages.count || 0) + (activeAlerts.count || 0));
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading admin panel...</span>
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

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Dashboard', icon: BarChart3, description: 'Sales & Analytics' },
    { id: 'orders' as TabType, name: 'Orders', icon: ShoppingCart, description: 'Order Management' },
    { id: 'messages' as TabType, name: 'Messages', icon: MessageSquare, description: 'Customer Support' },
    { id: 'products' as TabType, name: 'Products', icon: Package, description: 'Inventory Management' },
    { id: 'customers' as TabType, name: 'Customers', icon: Users, description: 'Customer Insights' },
    { id: 'movements' as TabType, name: 'Movements', icon: TrendingUp, description: 'Social Impact Campaigns' },
    { id: 'settings' as TabType, name: 'Settings', icon: Settings, description: 'System Configuration' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SalesDashboard />;
      case 'orders':
        return <AdminOrdersPage />;
      case 'messages':
        return <AdminMessagesPage />;
      case 'products':
        return <ProductManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'movements':
        return <MovementManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <SalesDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-sage-400 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-charcoal-300">
                  ChartedArt Admin
                </h1>
                <p className="text-sm text-charcoal-200">
                  Welcome back, {adminUser?.profiles?.full_name || adminUser?.profiles?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-charcoal-300" />
                {notifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  adminUser?.role === 'super_admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {adminUser?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 transition-colors ${
                    isActive
                      ? 'border-sage-400 text-sage-600'
                      : 'border-transparent text-charcoal-200 hover:text-charcoal-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sage-600' : 'text-charcoal-200'}`} />
                    <span>{tab.name}</span>
                  </div>
                  {!isActive && (
                    <div className="text-xs text-charcoal-200 mt-1">
                      {tab.description}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}