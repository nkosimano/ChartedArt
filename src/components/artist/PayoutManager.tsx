import React, { useState } from 'react';
import { useArtistPortal } from '../../hooks/useArtistPortal';
import { useAuth } from '../../hooks/useAuth';
import {
  Wallet,
  DollarSign,
  Calendar,
  CreditCard,
  Bank,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Eye,
  Settings,
  History
} from 'lucide-react';

interface PayoutMethod {
  type: 'bank_transfer' | 'paypal' | 'stripe';
  details: {
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    email?: string;
    [key: string]: any;
  };
  isDefault: boolean;
}

const PayoutManager: React.FC = () => {
  const { user, profile } = useAuth();
  const {
    payouts,
    payoutsLoading,
    payoutsError,
    requestPayout,
    earnings
  } = useArtistPortal();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMethodsModal, setShowMethodsModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Mock payout methods - in a real app, this would come from the database
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([
    {
      type: 'paypal',
      details: { email: 'artist@example.com' },
      isDefault: true
    }
  ]);

  // Filter payouts
  const filteredPayouts = payouts?.filter(payout => {
    if (filter === 'all') return true;
    return payout.status === filter;
  }) || [];

  // Calculate available balance (mock calculation)
  const availableBalance = earnings?.commission_earnings || 0;
  const pendingPayouts = payouts?.filter(p => p.status === 'processing' || p.status === 'requested')
    .reduce((sum, p) => sum + p.amount, 0) || 0;
  const withdrawableBalance = Math.max(0, availableBalance - pendingPayouts);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'processing':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'completed':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'cancelled':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return Clock;
      case 'processing':
        return AlertTriangle;
      case 'completed':
        return CheckCircle;
      case 'failed':
        return AlertTriangle;
      case 'cancelled':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  if (payoutsLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Payout Manager</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your earnings and payout requests
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowMethodsModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Payment Methods
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            disabled={withdrawableBalance <= 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Payout
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wallet className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-100">Available Balance</p>
              <p className="text-2xl font-bold">${withdrawableBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Payouts</p>
              <p className="text-2xl font-semibold text-gray-900">${pendingPayouts.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${availableBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {payoutsError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{payoutsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {['all', 'requested', 'processing', 'completed', 'failed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All Payouts' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Payout History
          </h3>
        </div>

        {filteredPayouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayouts.map((payout) => {
                  const StatusIcon = getStatusIcon(payout.status);
                  return (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${payout.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          {payout.payout_method === 'paypal' && <CreditCard className="w-4 h-4 mr-2" />}
                          {payout.payout_method === 'bank_transfer' && <Bank className="w-4 h-4 mr-2" />}
                          {payout.payout_method === 'stripe' && <CreditCard className="w-4 h-4 mr-2" />}
                          {payout.payout_method || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payout.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {payout.transaction_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Wallet className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No payouts found</h3>
            <p className="mt-2 text-sm text-gray-600">
              {filter === 'all' 
                ? "You haven't requested any payouts yet."
                : `No payouts with status "${filter}" found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {showRequestModal && (
        <RequestPayoutModal
          availableBalance={withdrawableBalance}
          payoutMethods={payoutMethods}
          onClose={() => setShowRequestModal(false)}
          onSubmit={requestPayout}
        />
      )}

      {/* Payment Methods Modal */}
      {showMethodsModal && (
        <PaymentMethodsModal
          methods={payoutMethods}
          onClose={() => setShowMethodsModal(false)}
          onUpdate={setPayoutMethods}
        />
      )}
    </div>
  );
};

// Request Payout Modal
const RequestPayoutModal: React.FC<{
  availableBalance: number;
  payoutMethods: PayoutMethod[];
  onClose: () => void;
  onSubmit: (amount: number, method: string, details: any) => Promise<boolean>;
}> = ({ availableBalance, payoutMethods, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(
    payoutMethods.find(m => m.isDefault)?.type || payoutMethods[0]?.type || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payoutAmount = parseFloat(amount);
    if (payoutAmount <= 0 || payoutAmount > availableBalance) {
      setError('Invalid payout amount');
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payout method');
      return;
    }

    const method = payoutMethods.find(m => m.type === selectedMethod);
    if (!method) {
      setError('Selected payout method not found');
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit(payoutAmount, selectedMethod, method.details);
      if (success) {
        onClose();
      } else {
        setError('Failed to request payout. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while requesting payout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Request Payout</h3>
          <p className="text-sm text-gray-600">Available balance: ${availableBalance.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payout Amount ($) *
            </label>
            <input
              type="number"
              min="0.01"
              max={availableBalance}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payout Method *
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              required
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a method</option>
              {payoutMethods.map((method) => (
                <option key={method.type} value={method.type}>
                  {method.type === 'paypal' ? 'PayPal' : 
                   method.type === 'bank_transfer' ? 'Bank Transfer' : 
                   method.type === 'stripe' ? 'Stripe' : method.type}
                  {method.isDefault && ' (Default)'}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

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
              disabled={submitting || !amount || !selectedMethod}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Requesting...' : 'Request Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Methods Modal
const PaymentMethodsModal: React.FC<{
  methods: PayoutMethod[];
  onClose: () => void;
  onUpdate: (methods: PayoutMethod[]) => void;
}> = ({ methods, onClose, onUpdate }) => {
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {methods.length > 0 ? (
            methods.map((method, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  {method.type === 'paypal' && <CreditCard className="w-5 h-5 mr-3 text-blue-600" />}
                  {method.type === 'bank_transfer' && <Bank className="w-5 h-5 mr-3 text-green-600" />}
                  {method.type === 'stripe' && <CreditCard className="w-5 h-5 mr-3 text-purple-600" />}
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.type === 'paypal' ? 'PayPal' : 
                       method.type === 'bank_transfer' ? 'Bank Transfer' : 
                       method.type === 'stripe' ? 'Stripe' : method.type}
                    </p>
                    <p className="text-sm text-gray-600">
                      {method.type === 'paypal' && method.details.email}
                      {method.type === 'bank_transfer' && 
                        `${method.details.accountName} - ****${method.details.accountNumber?.slice(-4)}`}
                      {method.type === 'stripe' && method.details.email}
                    </p>
                    {method.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingMethod(method)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No payment methods configured</p>
            </div>
          )}

          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </button>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayoutManager;