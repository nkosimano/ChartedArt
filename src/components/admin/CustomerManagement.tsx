import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  AlertCircle,
  Star,
  Target,
  Award,
  Activity,
  CreditCard,
  Package
} from 'lucide-react';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
  last_login?: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  days_since_last_order?: number;
  rfm_score?: string;
  segment?: string;
  status: 'active' | 'inactive' | 'churned';
}

interface RFMAnalysis {
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_segment: string;
  customer_id: string;
  last_order_date?: string;
}

interface CustomerSegment {
  segment_name: string;
  customer_count: number;
  avg_order_value: number;
  total_revenue: number;
  description: string;
  color: string;
}

interface CustomerMetrics {
  total_customers: number;
  new_customers_30d: number;
  active_customers_30d: number;
  churned_customers: number;
  avg_customer_value: number;
  customer_retention_rate: number;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rfmAnalysis, setRfmAnalysis] = useState<RFMAnalysis[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'last_order'>('spent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // View modes
  const [viewMode, setViewMode] = useState<'overview' | 'segments' | 'customers'>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchCustomers(),
        fetchRFMAnalysis(),
        fetchCustomerMetrics(),
        generateSegments()
      ]);
    } catch (err) {
      console.error('Error fetching customer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    // Get customer profiles with order data
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Enhance with order statistics
    const enhancedCustomers = await Promise.all(
      (profilesData || []).map(async (profile) => {
        const { data: orderStats } = await supabase
          .rpc('get_customer_order_stats', { customer_id: profile.id });

        const stats = orderStats?.[0] || {
          total_orders: 0,
          total_spent: 0,
          avg_order_value: 0,
          days_since_last_order: null
        };

        // Determine customer status
        let status: 'active' | 'inactive' | 'churned' = 'inactive';
        if (stats.days_since_last_order === null) {
          status = 'inactive';
        } else if (stats.days_since_last_order <= 30) {
          status = 'active';
        } else if (stats.days_since_last_order > 90) {
          status = 'churned';
        }

        return {
          ...profile,
          ...stats,
          status
        };
      })
    );

    setCustomers(enhancedCustomers);
  };

  const fetchRFMAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_customer_rfm');

      if (error) {
        console.warn('RFM analysis not available:', error);
        return;
      }

      setRfmAnalysis(data || []);
    } catch (err) {
      console.warn('RFM analysis failed:', err);
    }
  };

  const fetchCustomerMetrics = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const [
      totalCustomers,
      newCustomers,
      activeCustomers,
      churned,
      avgValue,
      retention
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.rpc('get_avg_customer_lifetime_value'),
      supabase.rpc('get_customer_retention_rate')
    ]);

    setMetrics({
      total_customers: totalCustomers.count || 0,
      new_customers_30d: newCustomers.count || 0,
      active_customers_30d: activeCustomers.count || 0,
      churned_customers: churned.count || 0,
      avg_customer_value: avgValue.data || 0,
      customer_retention_rate: retention.data || 0
    });
  };

  const generateSegments = () => {
    // Generate customer segments based on common e-commerce patterns
    const segmentDefinitions: CustomerSegment[] = [
      {
        segment_name: 'Champions',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'High-value, frequent customers who recently made purchases',
        color: 'bg-green-100 text-green-800'
      },
      {
        segment_name: 'Loyal Customers',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'Regular customers with consistent purchase behavior',
        color: 'bg-blue-100 text-blue-800'
      },
      {
        segment_name: 'Potential Loyalists',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'Recent customers with good potential for loyalty',
        color: 'bg-purple-100 text-purple-800'
      },
      {
        segment_name: 'New Customers',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'Recently acquired customers',
        color: 'bg-yellow-100 text-yellow-800'
      },
      {
        segment_name: 'At Risk',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'Valuable customers who haven\'t purchased recently',
        color: 'bg-orange-100 text-orange-800'
      },
      {
        segment_name: 'Cannot Lose Them',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'High-value customers at risk of churning',
        color: 'bg-red-100 text-red-800'
      },
      {
        segment_name: 'Hibernating',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'Inactive customers with past purchase history',
        color: 'bg-gray-100 text-gray-800'
      },
      {
        segment_name: 'Lost',
        customer_count: 0,
        avg_order_value: 0,
        total_revenue: 0,
        description: 'Customers who have likely churned',
        color: 'bg-red-100 text-red-800'
      }
    ];

    // Calculate segment metrics based on customer data
    customers.forEach(customer => {
      let segment = 'New Customers'; // Default
      
      if (customer.total_orders >= 5 && customer.days_since_last_order! <= 30 && customer.total_spent >= 1000) {
        segment = 'Champions';
      } else if (customer.total_orders >= 3 && customer.days_since_last_order! <= 60) {
        segment = 'Loyal Customers';
      } else if (customer.total_orders >= 2 && customer.days_since_last_order! <= 30) {
        segment = 'Potential Loyalists';
      } else if (customer.total_orders >= 1 && customer.days_since_last_order! <= 14) {
        segment = 'New Customers';
      } else if (customer.total_spent >= 500 && customer.days_since_last_order! > 60 && customer.days_since_last_order! <= 90) {
        segment = 'At Risk';
      } else if (customer.total_spent >= 1000 && customer.days_since_last_order! > 90) {
        segment = 'Cannot Lose Them';
      } else if (customer.total_orders >= 1 && customer.days_since_last_order! > 90 && customer.days_since_last_order! <= 365) {
        segment = 'Hibernating';
      } else if (customer.days_since_last_order! > 365) {
        segment = 'Lost';
      }

      const segmentIndex = segmentDefinitions.findIndex(s => s.segment_name === segment);
      if (segmentIndex >= 0) {
        segmentDefinitions[segmentIndex].customer_count++;
        segmentDefinitions[segmentIndex].total_revenue += customer.total_spent;
        segmentDefinitions[segmentIndex].avg_order_value = 
          segmentDefinitions[segmentIndex].total_revenue / Math.max(1, segmentDefinitions[segmentIndex].customer_count);
      }
    });

    setSegments(segmentDefinitions.filter(s => s.customer_count > 0));
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesSegment = segmentFilter === 'all' || customer.segment === segmentFilter;

    return matchesSearch && matchesStatus && matchesSegment;
  }).sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name':
        return order * a.full_name.localeCompare(b.full_name);
      case 'orders':
        return order * (a.total_orders - b.total_orders);
      case 'spent':
        return order * (a.total_spent - b.total_spent);
      case 'last_order':
        return order * ((a.days_since_last_order || 999) - (b.days_since_last_order || 999));
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading customer data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-charcoal-300 mb-2">Customer Management</h1>
            <p className="text-charcoal-200">Analyze customer behavior, segments, and lifetime value</p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'overview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Activity className="w-4 h-4 mr-1 inline" />
                Overview
              </button>
              <button
                onClick={() => setViewMode('segments')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'segments'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="w-4 h-4 mr-1 inline" />
                Segments
              </button>
              <button
                onClick={() => setViewMode('customers')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'customers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 mr-1 inline" />
                Customers
              </button>
            </div>
            
            <button
              onClick={fetchCustomerData}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            
            <button 
              onClick={() => {
                // Export customer data to CSV
                const csvData = customers.map(c => ({
                  Name: c.full_name,
                  Email: c.email,
                  Phone: c.phone || 'N/A',
                  'Total Orders': c.total_orders,
                  'Total Spent': c.total_spent,
                  'Avg Order Value': c.avg_order_value,
                  Status: c.status,
                  'Days Since Last Order': c.days_since_last_order || 'N/A'
                }));
                
                const csv = [
                  Object.keys(csvData[0]).join(','),
                  ...csvData.map(row => Object.values(row).join(','))
                ].join('\n');
                
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="flex items-center px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-200 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-charcoal-300">{metrics.total_customers}</p>
                </div>
                <Users className="w-8 h-8 text-sage-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-200 text-sm">New (30d)</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.new_customers_30d}</p>
                </div>
                <UserPlus className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-200 text-sm">Active (30d)</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.active_customers_30d}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-200 text-sm">Churned</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.churned_customers}</p>
                </div>
                <UserMinus className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-200 text-sm">Avg. Customer Value</p>
                  <p className="text-2xl font-bold text-charcoal-300">R{metrics.avg_customer_value.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-sage-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-charcoal-200 text-sm">Retention Rate</p>
                  <p className="text-2xl font-bold text-charcoal-300">{metrics.customer_retention_rate.toFixed(1)}%</p>
                </div>
                <Award className="w-8 h-8 text-sage-400" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'overview' && <CustomerOverview customers={customers} segments={segments} />}
        {viewMode === 'segments' && <CustomerSegments segments={segments} />}
        {viewMode === 'customers' && (
          <CustomerList
            customers={filteredCustomers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            segmentFilter={segmentFilter}
            setSegmentFilter={setSegmentFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onSelectCustomer={setSelectedCustomer}
          />
        )}

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <CustomerDetailsModal
            customerId={selectedCustomer}
            customer={customers.find(c => c.id === selectedCustomer)}
            onClose={() => setSelectedCustomer(null)}
          />
        )}
      </div>
    </div>
  );
}

// Customer Overview Component
interface CustomerOverviewProps {
  customers: Customer[];
  segments: CustomerSegment[];
}

const CustomerOverview: React.FC<CustomerOverviewProps> = ({ customers, segments }) => {
  const topCustomers = customers
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Customer Segments Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Customer Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {segments.slice(0, 8).map((segment) => (
            <div key={segment.segment_name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${segment.color}`}>
                  {segment.segment_name}
                </span>
                <span className="text-sm text-gray-500">{segment.customer_count}</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>Avg. Value: R{segment.avg_order_value.toLocaleString()}</div>
                <div>Total: R{segment.total_revenue.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Top Customers by Value</h3>
        <div className="space-y-4">
          {topCustomers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  #{index + 1}
                </div>
                <div>
                  <div className="font-medium">{customer.full_name}</div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">R{customer.total_spent.toLocaleString()}</div>
                <div className="text-sm text-gray-500">{customer.total_orders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Activity Trends */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Customer Activity Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Status Distribution</h4>
            <div className="space-y-2">
              {['active', 'inactive', 'churned'].map((status) => {
                const count = customers.filter(c => c.status === status).length;
                const percentage = customers.length > 0 ? (count / customers.length) * 100 : 0;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize text-sm">{status}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded">
                        <div 
                          className={`h-2 rounded ${
                            status === 'active' ? 'bg-green-500' :
                            status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Order Frequency</h4>
            <div className="space-y-2">
              {[
                { label: '1 order', min: 1, max: 1 },
                { label: '2-5 orders', min: 2, max: 5 },
                { label: '6+ orders', min: 6, max: Infinity }
              ].map((range) => {
                const count = customers.filter(c => 
                  c.total_orders >= range.min && c.total_orders <= range.max
                ).length;
                return (
                  <div key={range.label} className="flex items-center justify-between">
                    <span className="text-sm">{range.label}</span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Spending Tiers</h4>
            <div className="space-y-2">
              {[
                { label: 'Under R500', max: 500 },
                { label: 'R500 - R1,000', min: 500, max: 1000 },
                { label: 'Over R1,000', min: 1000 }
              ].map((tier) => {
                const count = customers.filter(c => 
                  (tier.min ? c.total_spent >= tier.min : true) && 
                  (tier.max ? c.total_spent < tier.max : true)
                ).length;
                return (
                  <div key={tier.label} className="flex items-center justify-between">
                    <span className="text-sm">{tier.label}</span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Segments Component
interface CustomerSegmentsProps {
  segments: CustomerSegment[];
}

const CustomerSegments: React.FC<CustomerSegmentsProps> = ({ segments }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-charcoal-300 mb-4">Customer Segmentation Analysis</h3>
        <p className="text-charcoal-200 mb-6">
          Customer segments based on RFM (Recency, Frequency, Monetary) analysis to understand customer behavior patterns.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <div key={segment.segment_name} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{segment.segment_name}</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${segment.color}`}>
                  {segment.customer_count}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{segment.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Average Order Value:</span>
                  <span className="text-sm font-medium">R{segment.avg_order_value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Revenue:</span>
                  <span className="text-sm font-medium">R{segment.total_revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Avg. per Customer:</span>
                  <span className="text-sm font-medium">
                    R{(segment.total_revenue / Math.max(1, segment.customer_count)).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <button 
                  onClick={() => {
                    // Switch to customers view with segment filter
                    // This would need to be passed down as a prop from parent
                    alert(`Viewing customers in segment: ${segment.segment_name}`);
                  }}
                  className="w-full bg-sage-600 text-white py-2 px-4 rounded-md hover:bg-sage-700 text-sm"
                >
                  View Customers
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Customer List Component
interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  segmentFilter: string;
  setSegmentFilter: (segment: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortBy: string;
  setSortBy: (sort: any) => void;
  sortOrder: string;
  setSortOrder: (order: any) => void;
  onSelectCustomer: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  searchTerm,
  setSearchTerm,
  segmentFilter,
  setSegmentFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSelectCustomer
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100';
      case 'inactive': return 'text-yellow-700 bg-yellow-100';
      case 'churned': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="churned">Churned</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
          >
            <option value="spent">Total Spent</option>
            <option value="orders">Total Orders</option>
            <option value="name">Name</option>
            <option value="last_order">Last Order</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            {customers.length} customers found
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No customers found</h3>
            <p className="mt-2 text-sm text-gray-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.full_name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R{customer.total_spent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R{customer.avg_order_value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.days_since_last_order !== null 
                        ? `${customer.days_since_last_order} days ago`
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onSelectCustomer(customer.id)}
                        className="text-sage-600 hover:text-sage-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Customer Details Modal
interface CustomerDetailsModalProps {
  customerId: string;
  customer?: Customer;
  onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customerId,
  customer,
  onClose
}) => {
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerOrders();
  }, [customerId]);

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            quantity,
            price,
            products (name, image_url)
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">Customer Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">{customer.full_name}</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                
                {customer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
                
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-xl font-bold">{customer.total_orders}</p>
                  </div>
                  <ShoppingCart className="w-6 h-6 text-sage-400" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-xl font-bold">R{customer.total_spent.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-sage-400" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg. Order</p>
                    <p className="text-xl font-bold">R{customer.avg_order_value.toLocaleString()}</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-sage-400" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-xl font-bold capitalize">{customer.status}</p>
                  </div>
                  <Star className="w-6 h-6 text-sage-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-400 mx-auto"></div>
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No orders found
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {customerOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R{order.total_amount}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {order.order_items.slice(0, 2).map((item: any, index: number) => (
                          <div key={index}>
                            {item.quantity}x {item.products?.name}
                          </div>
                        ))}
                        {order.order_items.length > 2 && (
                          <div>+{order.order_items.length - 2} more items</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
          <button 
            onClick={() => {
              // TODO: Implement message modal
              alert(`Message functionality for ${customer.full_name} will be implemented soon`);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};