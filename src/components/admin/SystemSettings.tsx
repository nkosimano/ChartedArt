import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Settings,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Key,
  Mail,
  Bell,
  Globe,
  Database,
  Upload,
  Download,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Palette,
  CreditCard,
  Webhook,
  Lock,
  BarChart3
} from 'lucide-react';

interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  is_public: boolean;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  config: any;
  last_sync?: string;
}

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'admins' | 'system' | 'integrations' | 'security'>('admins');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showEditConfig, setShowEditConfig] = useState<string | null>(null);
  const [showIntegrationModal, setShowIntegrationModal] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchAdminUsers(),
        fetchSystemConfig(),
        fetchIntegrations()
      ]);
    } catch (err) {
      console.error('Error fetching settings data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        *,
        profiles!admin_users_user_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAdminUsers(data || []);
  };

  const fetchSystemConfig = async () => {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      // If table doesn't exist, create default config
      setSystemConfig([
        {
          id: '1',
          key: 'site_name',
          value: 'ChartedArt',
          description: 'Website name displayed in titles and headers',
          category: 'general',
          is_public: true
        },
        {
          id: '2',
          key: 'maintenance_mode',
          value: 'false',
          description: 'Enable maintenance mode to temporarily disable public access',
          category: 'general',
          is_public: false
        },
        {
          id: '3',
          key: 'commission_rate',
          value: '15',
          description: 'Default commission rate for artists (%)',
          category: 'business',
          is_public: false
        },
        {
          id: '4',
          key: 'email_notifications',
          value: 'true',
          description: 'Enable email notifications for orders and updates',
          category: 'notifications',
          is_public: false
        }
      ]);
      return;
    }
    
    setSystemConfig(data || []);
  };

  const fetchIntegrations = async () => {
    // Mock integrations data - in real app this would come from database
    setIntegrations([
      {
        id: '1',
        name: 'Stripe Payment Processing',
        type: 'payment',
        status: 'active',
        config: { publishable_key: 'pk_test_...', webhook_endpoint: '/api/stripe/webhook' },
        last_sync: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'SendGrid Email Service',
        type: 'email',
        status: 'active',
        config: { api_key: 'SG...', sender_email: 'noreply@chartedart.com' },
        last_sync: '2024-01-15T09:30:00Z'
      },
      {
        id: '3',
        name: 'Google Analytics',
        type: 'analytics',
        status: 'inactive',
        config: { tracking_id: 'GA-...', property_id: '...' }
      },
      {
        id: '4',
        name: 'AWS S3 Storage',
        type: 'storage',
        status: 'active',
        config: { bucket_name: 'chartedart-storage', region: 'us-east-1' },
        last_sync: '2024-01-15T11:00:00Z'
      }
    ]);
  };

  const addAdminUser = async (email: string, role: 'admin' | 'super_admin') => {
    try {
      // First check if user exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError) {
        throw new Error('User not found. Please make sure the user has an account first.');
      }

      // Add to admin_users table
      const { error } = await supabase
        .from('admin_users')
        .insert({
          user_id: profileData.id,
          role: role,
          is_active: true
        });

      if (error) throw error;

      await fetchAdminUsers();
      setSuccess('Admin user added successfully');
      setShowAddAdmin(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin user');
    }
  };

  const updateAdminUser = async (id: string, updates: Partial<AdminUser>) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchAdminUsers();
      setSuccess('Admin user updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin user');
    }
  };

  const removeAdminUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this admin user?')) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAdminUsers();
      setSuccess('Admin user removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin user');
    }
  };

  const updateSystemConfig = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: key,
          value: value
        });

      if (error) throw error;

      await fetchSystemConfig();
      setSuccess('Configuration updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    }
  };

  const tabs = [
    { id: 'admins' as const, name: 'Admin Users', icon: Users, description: 'Manage administrator accounts' },
    { id: 'system' as const, name: 'System Config', icon: Settings, description: 'System-wide settings' },
    { id: 'integrations' as const, name: 'Integrations', icon: Globe, description: 'Third-party services' },
    { id: 'security' as const, name: 'Security', icon: Shield, description: 'Security & access control' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading system settings...</span>
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
            <h1 className="text-4xl font-bold text-charcoal-300 mb-2">System Settings</h1>
            <p className="text-charcoal-200">Manage system configuration, users, and integrations</p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={fetchData}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            
            <button 
              onClick={() => {
                // Export system configuration to JSON
                const configData = systemConfig.reduce((acc, item) => {
                  acc[item.key] = item.value;
                  return acc;
                }, {} as Record<string, string>);
                
                const json = JSON.stringify(configData, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="flex items-center px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Config
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-300 rounded-md p-4 mb-6">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 rounded-t-lg">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none transition-colors ${
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

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-sm">
          {activeTab === 'admins' && (
            <AdminUsersTab 
              adminUsers={adminUsers}
              onAddAdmin={() => setShowAddAdmin(true)}
              onUpdateAdmin={updateAdminUser}
              onRemoveAdmin={removeAdminUser}
            />
          )}
          {activeTab === 'system' && (
            <SystemConfigTab 
              config={systemConfig}
              onUpdateConfig={updateSystemConfig}
              onEditConfig={setShowEditConfig}
            />
          )}
          {activeTab === 'integrations' && (
            <IntegrationsTab 
              integrations={integrations}
              onConfigureIntegration={setShowIntegrationModal}
            />
          )}
          {activeTab === 'security' && <SecurityTab />}
        </div>

        {/* Modals */}
        {showAddAdmin && (
          <AddAdminModal 
            onClose={() => setShowAddAdmin(false)}
            onAdd={addAdminUser}
          />
        )}

        {showEditConfig && (
          <EditConfigModal
            config={systemConfig.find(c => c.id === showEditConfig)}
            onClose={() => setShowEditConfig(null)}
            onSave={updateSystemConfig}
          />
        )}

        {showIntegrationModal && (
          <IntegrationConfigModal
            integration={integrations.find(i => i.id === showIntegrationModal)}
            onClose={() => setShowIntegrationModal(null)}
          />
        )}
      </div>
    </div>
  );
}

// Admin Users Tab Component
interface AdminUsersTabProps {
  adminUsers: AdminUser[];
  onAddAdmin: () => void;
  onUpdateAdmin: (id: string, updates: Partial<AdminUser>) => void;
  onRemoveAdmin: (id: string) => void;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  adminUsers,
  onAddAdmin,
  onUpdateAdmin,
  onRemoveAdmin
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-charcoal-300">Administrator Users</h3>
          <p className="text-charcoal-200">Manage users with administrative access to the system</p>
        </div>
        <button
          onClick={onAddAdmin}
          className="flex items-center px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Admin
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adminUsers.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {admin.profiles.avatar_url ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={admin.profiles.avatar_url}
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.profiles.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {admin.profiles.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.role === 'super_admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {admin.role.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateAdmin(admin.id, { is_active: !admin.is_active })}
                      className="text-indigo-600 hover:text-indigo-900"
                      title={admin.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveAdmin(admin.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Remove Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// System Config Tab Component
interface SystemConfigTabProps {
  config: SystemConfig[];
  onUpdateConfig: (key: string, value: string) => void;
  onEditConfig: (id: string) => void;
}

const SystemConfigTab: React.FC<SystemConfigTabProps> = ({
  config,
  onUpdateConfig,
  onEditConfig
}) => {
  const configByCategory = config.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-charcoal-300">System Configuration</h3>
        <p className="text-charcoal-200">Configure system-wide settings and preferences</p>
      </div>

      <div className="space-y-8">
        {Object.entries(configByCategory).map(([category, items]) => (
          <div key={category} className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4 capitalize">
              {category} Settings
            </h4>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        {item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      {!item.is_public && (
                        <Lock className="w-3 h-3 text-gray-400" title="Internal setting" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.key === 'maintenance_mode' || item.key === 'email_notifications' ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.value === 'true'}
                          onChange={(e) => onUpdateConfig(item.key, e.target.checked.toString())}
                          className="rounded border-gray-300 text-sage-600 focus:ring-sage-500"
                        />
                      </label>
                    ) : (
                      <input
                        type={item.key.includes('rate') ? 'number' : 'text'}
                        value={item.value}
                        onChange={(e) => onUpdateConfig(item.key, e.target.value)}
                        className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500 text-sm"
                      />
                    )}
                    <button
                      onClick={() => onEditConfig(item.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Integrations Tab Component
interface IntegrationsTabProps {
  integrations: Integration[];
  onConfigureIntegration: (id: string) => void;
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  integrations,
  onConfigureIntegration
}) => {
  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'payment': return CreditCard;
      case 'email': return Mail;
      case 'analytics': return BarChart3;
      case 'storage': return Database;
      default: return Globe;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-charcoal-300">Third-Party Integrations</h3>
        <p className="text-charcoal-200">Manage connections to external services and APIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const Icon = getIntegrationIcon(integration.type);
          
          return (
            <div key={integration.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Icon className="w-8 h-8 text-sage-400" />
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{integration.type}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  integration.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {integration.status}
                </span>
              </div>
              
              {integration.last_sync && (
                <div className="text-xs text-gray-500 mb-4">
                  Last sync: {new Date(integration.last_sync).toLocaleDateString()}
                </div>
              )}
              
              <div className="space-y-2 mb-4">
                {Object.entries(integration.config).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-900 font-mono">
                      {typeof value === 'string' && value.length > 20 
                        ? `${value.substring(0, 20)}...` 
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onConfigureIntegration(integration.id)}
                  className="flex-1 bg-sage-600 text-white py-2 px-3 rounded-md text-sm hover:bg-sage-700"
                >
                  Configure
                </button>
                <button 
                  onClick={() => {
                    // Open integration documentation or external link
                    const docs: Record<string, string> = {
                      '1': 'https://stripe.com/docs',
                      '2': 'https://sendgrid.com/docs',
                      '3': 'https://analytics.google.com',
                      '4': 'https://aws.amazon.com/s3'
                    };
                    window.open(docs[integration.id] || '#', '_blank');
                  }}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  title="View Documentation"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Security Tab Component
const SecurityTab: React.FC = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = 'ca_1234567890abcdef1234567890abcdef';

  const securitySettings = [
    {
      title: 'Two-Factor Authentication',
      description: 'Require 2FA for all admin accounts',
      enabled: false,
      type: 'toggle'
    },
    {
      title: 'Session Timeout',
      description: 'Automatically log out users after inactivity',
      value: '30 minutes',
      type: 'select',
      options: ['15 minutes', '30 minutes', '1 hour', '2 hours']
    },
    {
      title: 'IP Whitelist',
      description: 'Restrict admin access to specific IP addresses',
      enabled: false,
      type: 'toggle'
    },
    {
      title: 'Audit Logging',
      description: 'Log all administrative actions',
      enabled: true,
      type: 'toggle'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-charcoal-300">Security Settings</h3>
        <p className="text-charcoal-200">Configure security policies and access controls</p>
      </div>

      <div className="space-y-8">
        {/* API Keys Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">API Keys</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
              <div>
                <label className="text-sm font-medium text-gray-700">Admin API Key</label>
                <p className="text-xs text-gray-500">Used for administrative API operations</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                  {showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Security Policies</h4>
          <div className="space-y-4">
            {securitySettings.map((setting, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                <div>
                  <label className="text-sm font-medium text-gray-700">{setting.title}</label>
                  <p className="text-xs text-gray-500">{setting.description}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {setting.type === 'toggle' ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        className="rounded border-gray-300 text-sage-600 focus:ring-sage-500"
                      />
                    </label>
                  ) : setting.type === 'select' ? (
                    <select
                      value={setting.value}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500 text-sm"
                    >
                      {setting.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Admin Modal
interface AddAdminModalProps {
  onClose: () => void;
  onAdd: (email: string, role: 'admin' | 'super_admin') => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({ onClose, onAdd }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(email, role);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add Administrator</h3>
          <p className="text-sm text-gray-600">
            Add a new user with administrative privileges
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700"
            >
              Add Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Config Modal
interface EditConfigModalProps {
  config?: SystemConfig;
  onClose: () => void;
  onSave: (key: string, value: string) => void;
}

const EditConfigModal: React.FC<EditConfigModalProps> = ({ config, onClose, onSave }) => {
  const [value, setValue] = useState(config?.value || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config) {
      onSave(config.key, value);
      onClose();
    }
  };

  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Configuration</h3>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
            <input
              type="text"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Integration Config Modal
interface IntegrationConfigModalProps {
  integration?: Integration;
  onClose: () => void;
}

const IntegrationConfigModal: React.FC<IntegrationConfigModalProps> = ({ integration, onClose }) => {
  if (!integration) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{integration.name} Configuration</h3>
            <p className="text-sm text-gray-600">Configure settings for this integration</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(integration.config).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input
                type={key.includes('key') || key.includes('secret') ? 'password' : 'text'}
                value={String(value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-sage-500 focus:border-sage-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-sage-600 border border-transparent rounded-md hover:bg-sage-700">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};