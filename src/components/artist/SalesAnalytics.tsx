import React, { useState, useEffect } from 'react';
import { useArtistPortal } from '../../hooks/useArtistPortal';
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
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Eye
} from 'lucide-react';

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

interface DateRange {
  start: string;
  end: string;
  label: string;
}

const SalesAnalytics: React.FC = () => {
  const {
    earnings,
    topProducts,
    monthlyEarnings,
    analyticsLoading,
    fetchEarnings
  } = useArtistPortal();

  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    label: 'Last 30 Days'
  });

  const [activeMetric, setActiveMetric] = useState('revenue');

  // Predefined date ranges
  const dateRanges = [
    {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 7 Days'
    },
    {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 30 Days'
    },
    {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'Last 90 Days'
    },
    {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: 'This Year'
    }
  ];

  // Prepare monthly earnings chart data
  const monthlyChartData = monthlyEarnings
    ?.slice(0, 12)
    .reverse()
    .map(item => ({
      month: `${new Date(item.year, item.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${item.year}`,
      grossRevenue: item.gross_revenue,
      commissionEarnings: item.commission_earnings,
      orders: item.total_orders,
      unitsSold: item.total_units_sold
    })) || [];

  // Prepare top products pie chart data
  const topProductsChartData = topProducts?.slice(0, 8).map((product, index) => ({
    name: product.product_name.length > 20 ? 
      product.product_name.substring(0, 20) + '...' : 
      product.product_name,
    value: product.total_revenue,
    color: COLORS[index % COLORS.length]
  })) || [];

  const handleDateRangeChange = async (range: DateRange) => {
    setDateRange(range);
    await fetchEarnings(range.start, range.end);
  };

  const handleCustomDateRange = async () => {
    await fetchEarnings(dateRange.start, dateRange.end);
  };

  const exportData = () => {
    const data = {
      earnings,
      topProducts,
      monthlyEarnings,
      dateRange,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-analytics-${dateRange.start}-to-${dateRange.end}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (analyticsLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Sales Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">
            Track your performance and sales insights
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={exportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => handleDateRangeChange(dateRange)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            {dateRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => handleDateRangeChange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange.label === range.label
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value, label: 'Custom' })}
              className="text-sm border-gray-300 rounded-md"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value, label: 'Custom' })}
              className="text-sm border-gray-300 rounded-md"
            />
            {dateRange.label === 'Custom' && (
              <button
                onClick={handleCustomDateRange}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${earnings?.gross_revenue?.toFixed(2) || '0.00'}`}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <MetricCard
          title="Commission Earnings"
          value={`$${earnings?.commission_earnings?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <MetricCard
          title="Total Orders"
          value={earnings?.total_orders?.toString() || '0'}
          icon={Package}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <MetricCard
          title="Unique Customers"
          value={earnings?.unique_customers?.toString() || '0'}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Performance</h3>
            <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeMetric === 'revenue'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveMetric('orders')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeMetric === 'orders'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveMetric('units')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeMetric === 'units'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Units
              </button>
            </div>
          </div>
          
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey={
                    activeMetric === 'revenue' ? 'commissionEarnings' :
                    activeMetric === 'orders' ? 'orders' : 'unitsSold'
                  }
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No monthly data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Products Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Product</h3>
          
          {topProductsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProductsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {topProductsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No product data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${earnings?.avg_order_value?.toFixed(2) || '0.00'}
              </div>
              <div className="text-sm text-gray-600">Average Order Value</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {earnings?.total_units_sold || 0}
              </div>
              <div className="text-sm text-gray-600">Total Units Sold</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {earnings?.commission_rate || 0}%
              </div>
              <div className="text-sm text-gray-600">Commission Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {((earnings?.commission_earnings || 0) / (earnings?.gross_revenue || 1) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Earnings Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
        </div>
        <div className="overflow-x-auto">
          {topProducts && topProducts.length > 0 ? (
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
                    Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image_url && (
                          <img 
                            className="h-10 w-10 rounded-lg object-cover mr-4" 
                            src={product.image_url} 
                            alt={product.product_name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                          <div className="flex items-center mt-1">
                            {index < 3 && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                            )}
                            <span className="text-xs text-gray-500">
                              Rank #{index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.total_sales} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-sm text-gray-600">
                Start selling products to see your top performers here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}> = ({ title, value, icon: Icon, color, bgColor }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${bgColor} rounded-lg p-3`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;