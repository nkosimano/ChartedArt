import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useArtistPortal } from '../../hooks/useArtistPortal';
import {
  BarChart3,
  Package,
  CreditCard,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Star,
  Eye,
  Edit,
  Clock
} from 'lucide-react';

// Import other artist components
import CommissionTracker from './CommissionTracker';
import SalesAnalytics from './SalesAnalytics';
import PayoutManager from './PayoutManager';
import InventoryTracker from './InventoryTracker';
import ArtistPortfolioManager from './ArtistPortfolioManager';

type DashboardView = 'overview' | 'portfolio' | 'commissions' | 'analytics' | 'inventory' | 'payouts';

const ArtistDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    refreshDashboard
  } = useArtistPortal();

  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [quickStats, setQuickStats] = useState({
    totalRevenue: 0,
    pendingCommissions: 0,
    activeProducts: 0,
    recentSales: 0,
    pendingPayouts: 0
  });

  useEffect(() => {
    refreshDashboard();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      setQuickStats({
        totalRevenue: dashboardData.revenue?.total || 0,
        pendingCommissions: dashboardData.commissions?.pending || 0,
        activeProducts: dashboardData.inventory?.active || 0,
        recentSales: dashboardData.sales?.recent || 0,
        pendingPayouts: dashboardData.payouts?.pending || 0
      });
    }
  }, [dashboardData]);

  const navigationItems = [
    {
      id: 'overview' as DashboardView,
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard home'
    },
    {
      id: 'portfolio' as DashboardView,
      label: 'Portfolio',
      icon: Star,
      description: 'Manage artwork'
    },
    {
      id: 'commissions' as DashboardView,
      label: 'Commissions',
      icon: MessageSquare,
      description: 'Track commission orders',
      badge: quickStats.pendingCommissions
    },
    {
      id: 'analytics' as DashboardView,
      label: 'Analytics',
      icon: TrendingUp,
      description: 'Sales insights'
    },
    {
      id: 'inventory' as DashboardView,
      label: 'Inventory',
      icon: Package,
      description: 'Stock management'
    },
    {
      id: 'payouts' as DashboardView,
      label: 'Payouts',
      icon: CreditCard,
      description: 'Payment management',
      badge: quickStats.pendingPayouts
    }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewView stats={quickStats} onNavigate={setCurrentView} />;
      case 'portfolio':
        return <ArtistPortfolioManager />;
      case 'commissions':
        return <CommissionTracker />;
      case 'analytics':
        return <SalesAnalytics />;
      case 'inventory':
        return <InventoryTracker />;
      case 'payouts':
        return <PayoutManager />;
      default:
        return <OverviewView stats={quickStats} onNavigate={setCurrentView} />;
    }
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Artist Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.name || 'Artist'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshDashboard}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
                title="Refresh Data"
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Navigation</h3>
              </div>
              <div className="p-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <div>{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {dashboardError && (
              <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-2 text-sm text-red-700">{dashboardError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview View Component
const OverviewView: React.FC<{
  stats: {
    totalRevenue: number;
    pendingCommissions: number;
    activeProducts: number;
    recentSales: number;
    pendingPayouts: number;
  };
  onNavigate: (view: DashboardView) => void;
}> = ({ stats, onNavigate }) => {
  const quickActions = [
    {
      title: 'Upload New Artwork',
      description: 'Add new pieces to your portfolio',
      action: () => onNavigate('portfolio'),
      icon: Star,
      color: 'bg-purple-500'
    },
    {
      title: 'Check Commissions',
      description: 'Review pending commission requests',
      action: () => onNavigate('commissions'),
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      title: 'View Analytics',
      description: 'See your sales performance',
      action: () => onNavigate('analytics'),
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Request Payout',
      description: 'Withdraw your earnings',
      action: () => onNavigate('payouts'),
      icon: CreditCard,
      color: 'bg-indigo-500'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'commission',
      title: 'New commission request',
      description: 'Portrait painting from Sarah Johnson',
      time: '2 hours ago',
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'sale',
      title: 'Artwork sold',
      description: 'Abstract Canvas #3 - $299.99',
      time: '5 hours ago',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'payout',
      title: 'Payout completed',
      description: '$450.00 transferred to your account',
      time: '1 day ago',
      icon: CreditCard,
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Commissions</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pendingCommissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-6 w-6 text-purple-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Products</p>
              <p className="text-lg font-semibold text-gray-900">{stats.activeProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Sales</p>
              <p className="text-lg font-semibold text-gray-900">{stats.recentSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
              <p className="text-lg font-semibold text-gray-900">{stats.pendingPayouts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className={`flex-shrink-0 p-2 rounded-md ${action.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{action.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${activity.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">$1,234</div>
              <div className="text-sm text-gray-600">This Month</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">23</div>
              <div className="text-sm text-gray-600">Orders This Month</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+8.3%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">4.8</div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="flex items-center justify-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;