import React, { useState, useEffect } from 'react';
import { useArtistPortal } from '../hooks/useArtistPortal';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users,
  Upload,
  MessageCircle,
  Calendar,
  Settings,
  BarChart3,
  Camera,
  Wallet,
  AlertTriangle,
  Star,
  Eye
} from 'lucide-react';
import { uploadImage, useImageUpload, createDragAndDropHandlers, createFileInputHandler } from '../utils/imageUpload';

// Sub-components
import ArtistPortfolioManager from './artist/ArtistPortfolioManager';
import CommissionTracker from './artist/CommissionTracker';
import SalesAnalytics from './artist/SalesAnalytics';
import PayoutManager from './artist/PayoutManager';
import InventoryTracker from './artist/InventoryTracker';

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

const ArtistDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    earnings,
    topProducts,
    commissionMetrics,
    commissionRequests,
    portfolios,
    payouts,
    analyticsLoading,
    commissionsLoading,
    loading,
    error,
    refreshData
  } = useArtistPortal();

  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is an artist
  if (!profile?.is_artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Artist Access Required</h1>
          <p className="text-gray-600">You need to be a verified artist to access this dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs: DashboardTab[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, component: OverviewTab },
    { id: 'portfolio', label: 'Portfolio', icon: Camera, component: ArtistPortfolioManager },
    { id: 'commissions', label: 'Commissions', icon: MessageCircle, component: CommissionTracker },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, component: SalesAnalytics },
    { id: 'inventory', label: 'Inventory', icon: Package, component: InventoryTracker },
    { id: 'payouts', label: 'Payouts', icon: Wallet, component: PayoutManager },
    { id: 'settings', label: 'Settings', icon: Settings, component: SettingsTab }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Artist Dashboard</h1>
              {profile && (
                <span className="ml-4 text-sm text-gray-600">
                  Welcome back, {profile.full_name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh Data
              </button>
              {profile.is_verified ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Star className="w-3 h-3 mr-1" />
                  Verified Artist
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Pending Verification
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 border border-red-300 rounded-md bg-red-50">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <div
                key={tab.id}
                className={activeTab === tab.id ? 'block' : 'hidden'}
              >
                <Component />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC = () => {
  const {
    earnings,
    topProducts,
    commissionMetrics,
    commissionRequests,
    portfolios,
    monthlyEarnings,
    analyticsLoading
  } = useArtistPortal();

  if (analyticsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Prepare monthly earnings chart data
  const monthlyChartData = monthlyEarnings
    ?.slice(0, 6)
    .reverse()
    .map(item => ({
      month: `${item.year}-${String(item.month).padStart(2, '0')}`,
      revenue: item.gross_revenue,
      earnings: item.commission_earnings,
      orders: item.total_orders
    }));

  // Commission status chart data
  const commissionStatusData = commissionMetrics ? [
    { name: 'Pending', value: commissionMetrics.pending_requests, color: '#fbbf24' },
    { name: 'Active', value: commissionMetrics.active_commissions, color: '#3b82f6' },
    { name: 'Completed', value: commissionMetrics.completed_commissions, color: '#10b981' },
    { name: 'Declined', value: commissionMetrics.declined_requests, color: '#ef4444' }
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${earnings?.commission_earnings?.toFixed(2) || '0.00'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {earnings?.total_orders || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Commissions</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {commissionMetrics?.active_commissions || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Camera className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Portfolio Items</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {portfolios?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Earnings Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings Trend</h3>
          {monthlyChartData && monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Earnings"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Gross Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No earnings data available
            </div>
          )}
        </div>

        {/* Commission Status Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Status</h3>
          {commissionStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commissionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {commissionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              No commission data available
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Products</h3>
        </div>
        <div className="p-6">
          {topProducts && topProducts.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProducts.slice(0, 5).map((product) => (
                    <tr key={product.product_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.image_url && (
                            <img 
                              className="h-10 w-10 rounded-lg object-cover mr-4" 
                              src={product.image_url} 
                              alt={product.product_name}
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.total_sales} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.total_revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.current_stock > 10 ? 'bg-green-100 text-green-800' :
                          product.current_stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.current_stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding products to your store
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Commissions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Commission Requests</h3>
        </div>
        <div className="p-6">
          {commissionRequests && commissionRequests.length > 0 ? (
            <div className="space-y-4">
              {commissionRequests.slice(0, 5).map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{commission.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      From {commission.customer?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(commission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {commission.budget_max && (
                      <span className="text-sm font-medium text-gray-900">
                        ${commission.budget_min} - ${commission.budget_max}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      commission.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      commission.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {commission.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No commission requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commission requests will appear here when customers contact you
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC = () => {
  const { updateArtistProfile } = useArtistPortal();
  const { profile } = useAuth();
  const [settings, setSettings] = useState({
    bio: profile?.bio || '',
    website: profile?.website || '',
    instagram: profile?.instagram || '',
    twitter: profile?.twitter || '',
    commission_rate: profile?.commission_rate || 15,
    accept_commissions: profile?.accept_commissions || false,
    min_commission_price: profile?.min_commission_price || 100,
    max_commission_price: profile?.max_commission_price || 5000
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateArtistProfile(settings);
      // Show success message
    } catch (error) {
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Artist Profile Settings</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              rows={4}
              value={settings.bio}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Tell people about your artistic journey and style..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Commission Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.commission_rate}
                onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram Handle</label>
              <input
                type="text"
                value={settings.instagram}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Twitter Handle</label>
              <input
                type="text"
                value={settings.twitter}
                onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="@username"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Commission Settings</h4>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={settings.accept_commissions}
                onChange={(e) => setSettings({ ...settings, accept_commissions: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Accept commission requests
              </label>
            </div>

            {settings.accept_commissions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Commission Price</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.min_commission_price}
                    onChange={(e) => setSettings({ ...settings, min_commission_price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Commission Price</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.max_commission_price}
                    onChange={(e) => setSettings({ ...settings, max_commission_price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDashboard;