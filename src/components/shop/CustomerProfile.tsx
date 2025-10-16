import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Settings,
  Heart,
  Package,
  MessageSquare,
  Shield
} from 'lucide-react';

interface CustomerProfile {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    profileImage?: string;
  };
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  preferences: {
    newsletter: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    artistUpdates: boolean;
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showPurchaseHistory: boolean;
    showWishlist: boolean;
  };
}

interface Address {
  id: string;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  isDefault: boolean;
  cardBrand?: string;
  lastFour?: string;
  expiryMonth?: string;
  expiryYear?: string;
  email?: string; // for PayPal
  bankName?: string; // for bank accounts
}

const CustomerProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const {
    profile,
    profileLoading,
    profileError,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    addPaymentMethod,
    deletePaymentMethod,
    changePassword
  } = useProfile();

  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Mock profile data
  const [profileData, setProfileData] = useState<CustomerProfile>({
    personalInfo: {
      firstName: user?.firstName || 'John',
      lastName: user?.lastName || 'Doe',
      email: user?.email || 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1990-01-15',
      profileImage: '/api/placeholder/150/150'
    },
    addresses: [
      {
        id: '1',
        type: 'shipping',
        isDefault: true,
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Art Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      },
      {
        id: '2',
        type: 'billing',
        isDefault: false,
        firstName: 'John',
        lastName: 'Doe',
        address1: '456 Gallery Ave',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        country: 'US'
      }
    ],
    paymentMethods: [
      {
        id: '1',
        type: 'card',
        isDefault: true,
        cardBrand: 'Visa',
        lastFour: '4242',
        expiryMonth: '12',
        expiryYear: '25'
      },
      {
        id: '2',
        type: 'paypal',
        isDefault: false,
        email: 'john.doe@example.com'
      }
    ],
    preferences: {
      newsletter: true,
      orderUpdates: true,
      promotions: false,
      artistUpdates: true,
      language: 'en',
      currency: 'USD',
      theme: 'light'
    },
    privacy: {
      profileVisibility: 'private',
      showPurchaseHistory: false,
      showWishlist: true
    }
  });

  const [formData, setFormData] = useState(profileData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security & Privacy', icon: Shield }
  ];

  const handleSave = async (section: string) => {
    try {
      await updateProfile(formData);
      setEditMode(null);
      setProfileData(formData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = (section: string) => {
    setFormData(profileData);
    setEditMode(null);
  };

  const handleAddressAction = async (action: 'add' | 'update' | 'delete', address: Partial<Address>) => {
    try {
      switch (action) {
        case 'add':
          await addAddress(address as Address);
          break;
        case 'update':
          await updateAddress(address.id!, address as Address);
          break;
        case 'delete':
          await deleteAddress(address.id!);
          break;
      }
      // Refresh profile data
    } catch (error) {
      console.error(`Failed to ${action} address:`, error);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        <button
          onClick={() => editMode === 'personal' ? handleCancel('personal') : setEditMode('personal')}
          className="flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700"
        >
          {editMode === 'personal' ? (
            <>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={formData.personalInfo.profileImage || '/api/placeholder/150/150'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
          {editMode === 'personal' && (
            <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700">
              <Edit className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-medium text-gray-900">
            {formData.personalInfo.firstName} {formData.personalInfo.lastName}
          </h4>
          <p className="text-gray-600">{formData.personalInfo.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          {editMode === 'personal' ? (
            <input
              type="text"
              value={formData.personalInfo.firstName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, firstName: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{formData.personalInfo.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          {editMode === 'personal' ? (
            <input
              type="text"
              value={formData.personalInfo.lastName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, lastName: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{formData.personalInfo.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          {editMode === 'personal' ? (
            <input
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, email: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{formData.personalInfo.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          {editMode === 'personal' ? (
            <input
              type="tel"
              value={formData.personalInfo.phone || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, phone: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{formData.personalInfo.phone || 'Not provided'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          {editMode === 'personal' ? (
            <input
              type="date"
              value={formData.personalInfo.dateOfBirth || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          ) : (
            <p className="text-gray-900">
              {formData.personalInfo.dateOfBirth ? 
                new Date(formData.personalInfo.dateOfBirth).toLocaleDateString() : 
                'Not provided'
              }
            </p>
          )}
        </div>
      </div>

      {editMode === 'personal' && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => handleCancel('personal')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave('personal')}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 mr-1" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );

  const renderAddresses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
        <button
          onClick={() => setShowNewAddressForm(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.addresses.map((address) => (
          <div key={address.id} className="border rounded-lg p-4 relative">
            {address.isDefault && (
              <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                Default
              </span>
            )}
            
            <div className="mb-2">
              <h4 className="font-medium text-gray-900 capitalize">{address.type} Address</h4>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="font-medium">{address.firstName} {address.lastName}</p>
              <p>{address.address1}</p>
              {address.address2 && <p>{address.address2}</p>}
              <p>{address.city}, {address.state} {address.zipCode}</p>
              <p>{address.country}</p>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setEditMode(`address-${address.id}`)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edit Address"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAddressAction('delete', { id: address.id })}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete Address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Form */}
      {showNewAddressForm && (
        <AddressForm
          onSave={(address) => {
            handleAddressAction('add', address);
            setShowNewAddressForm(false);
          }}
          onCancel={() => setShowNewAddressForm(false)}
        />
      )}
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
        <button
          onClick={() => setShowNewPaymentForm(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Payment Method
        </button>
      </div>

      <div className="space-y-4">
        {formData.paymentMethods.map((method) => (
          <div key={method.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-gray-400" />
              <div>
                {method.type === 'card' ? (
                  <>
                    <p className="font-medium text-gray-900">
                      {method.cardBrand} •••• {method.lastFour}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </>
                ) : method.type === 'paypal' ? (
                  <>
                    <p className="font-medium text-gray-900">PayPal</p>
                    <p className="text-sm text-gray-600">{method.email}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-900">Bank Account</p>
                    <p className="text-sm text-gray-600">{method.bankName}</p>
                  </>
                )}
                {method.isDefault && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                    Default
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => deletePaymentMethod(method.id)}
              className="p-2 text-gray-400 hover:text-red-600"
              title="Remove Payment Method"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>

      {/* Notification Preferences */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Notifications</h4>
        <div className="space-y-3">
          {Object.entries({
            newsletter: 'Newsletter and updates',
            orderUpdates: 'Order status updates',
            promotions: 'Promotional emails',
            artistUpdates: 'New artwork from followed artists'
          }).map(([key, label]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferences[key as keyof typeof formData.preferences] as boolean}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, [key]: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Language and Region */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Language & Region</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={formData.preferences.language}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, language: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={formData.preferences.currency}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, currency: e.target.value }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('preferences')}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-1" />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security & Privacy</h3>

      {/* Password Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-900">Password</h4>
          <button
            onClick={() => setShowPasswordForm(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Change Password
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Last changed 3 months ago
        </p>
      </div>

      {/* Privacy Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Privacy Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Visibility
            </label>
            <select
              value={formData.privacy.profileVisibility}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                privacy: { ...prev.privacy, profileVisibility: e.target.value as 'public' | 'private' }
              }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.privacy.showPurchaseHistory}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, showPurchaseHistory: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show purchase history to other users</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.privacy.showWishlist}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, showWishlist: e.target.checked }
                }))}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show wishlist to other users</span>
            </label>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      {showPasswordForm && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPasswordForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('security')}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          <Save className="w-4 h-4 mr-1" />
          Save Privacy Settings
        </button>
      </div>
    </div>
  );

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-lg text-gray-600">
          Manage your profile, preferences, and account security
        </p>
      </div>

      {/* Error Display */}
      {profileError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-red-700">{profileError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-sm border">
            <div className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            {activeTab === 'personal' && renderPersonalInfo()}
            {activeTab === 'addresses' && renderAddresses()}
            {activeTab === 'payment' && renderPaymentMethods()}
            {activeTab === 'preferences' && renderPreferences()}
            {activeTab === 'security' && renderSecurity()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Address Form Component
const AddressForm: React.FC<{
  address?: Address;
  onSave: (address: Address) => void;
  onCancel: () => void;
}> = ({ address, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Address>>(
    address || {
      type: 'shipping',
      isDefault: false,
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Address);
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h4 className="font-medium text-gray-900 mb-4">
        {address ? 'Edit Address' : 'Add New Address'}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'shipping' | 'billing' }))}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="shipping">Shipping</option>
            <option value="billing">Billing</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 *
          </label>
          <input
            type="text"
            required
            value={formData.address1}
            onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            value={formData.address2 || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              type="text"
              required
              value={formData.zipCode}
              onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Set as default address</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            Save Address
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerProfile;