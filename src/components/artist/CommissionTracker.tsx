import React, { useState, useEffect } from 'react';
import { useArtistPortal } from '../../hooks/useArtistPortal';
import { useAuth } from '../../hooks/useAuth';
import {
  MessageCircle,
  Send,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Eye,
  Edit3,
  Filter,
  Search,
  Plus,
  Star,
  Image as ImageIcon
} from 'lucide-react';

// Status color mappings
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'reviewing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'quote_sent':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'delivered':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const CommissionTracker: React.FC = () => {
  const {
    commissionRequests,
    commissionMessages,
    updateCommissionStatus,
    sendQuote,
    sendCommissionMessage,
    commissionsLoading,
    commissionsError
  } = useArtistPortal();

  const [selectedCommission, setSelectedCommission] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Filter commissions
  const filteredCommissions = commissionRequests?.filter(commission => {
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    const matchesSearch = 
      commission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  // Get unique statuses for filter
  const availableStatuses = [
    'all',
    ...new Set(commissionRequests?.map(c => c.status) || [])
  ];

  // Status counts for quick stats
  const statusCounts = {
    pending: commissionRequests?.filter(c => c.status === 'pending').length || 0,
    in_progress: commissionRequests?.filter(c => c.status === 'in_progress' || c.status === 'accepted').length || 0,
    completed: commissionRequests?.filter(c => c.status === 'completed' || c.status === 'delivered').length || 0,
    total: commissionRequests?.length || 0
  };

  const selectedCommissionData = selectedCommission 
    ? filteredCommissions.find(c => c.id === selectedCommission)
    : null;

  const selectedMessages = selectedCommission 
    ? commissionMessages[selectedCommission] || []
    : [];

  const handleStatusUpdate = async (commissionId: string, newStatus: string) => {
    try {
      await updateCommissionStatus(commissionId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedCommission || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      await sendCommissionMessage(selectedCommission, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  if (commissionsLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Commission Tracker</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your commission requests and communicate with clients
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{statusCounts.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-lg font-semibold text-gray-900">{statusCounts.in_progress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-lg font-semibold text-gray-900">{statusCounts.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageCircle className="h-6 w-6 text-gray-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{statusCounts.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search commissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : formatStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {commissionsError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-2 text-sm text-red-700">{commissionsError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commission List and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Commission List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Commissions ({filteredCommissions.length})
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredCommissions.length > 0 ? (
                <div className="space-y-0">
                  {filteredCommissions.map((commission) => (
                    <div
                      key={commission.id}
                      onClick={() => setSelectedCommission(commission.id)}
                      className={`p-4 border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedCommission === commission.id ? 'bg-indigo-50 border-indigo-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                          {commission.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(commission.status)}`}>
                          {formatStatus(commission.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <User className="w-3 h-3 mr-1" />
                        {commission.customer?.full_name}
                      </div>
                      
                      {commission.budget_max && (
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${commission.budget_min} - ${commission.budget_max}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(commission.created_at).toLocaleDateString()}
                        </span>
                        
                        {selectedMessages.length > 0 && (
                          <span className="flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {selectedMessages.length}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No commissions match your filters'
                      : 'No commission requests yet'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedCommissionData ? (
            <CommissionDetailView
              commission={selectedCommissionData}
              messages={selectedMessages}
              onStatusUpdate={handleStatusUpdate}
              onSendQuote={() => setShowQuoteModal(selectedCommission)}
              onSendMessage={handleSendMessage}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendingMessage={sendingMessage}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Commission</h3>
                <p className="text-gray-600">
                  Choose a commission from the list to view details and manage the project.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && (
        <QuoteModal
          commissionId={showQuoteModal}
          onClose={() => setShowQuoteModal(null)}
          onSubmit={sendQuote}
        />
      )}
    </div>
  );
};

// Commission Detail View Component
const CommissionDetailView: React.FC<{
  commission: any;
  messages: any[];
  onStatusUpdate: (id: string, status: string) => void;
  onSendQuote: () => void;
  onSendMessage: () => void;
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendingMessage: boolean;
}> = ({ 
  commission, 
  messages, 
  onStatusUpdate, 
  onSendQuote, 
  onSendMessage,
  newMessage,
  setNewMessage,
  sendingMessage
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'quote_sent', label: 'Quote Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{commission.title}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {commission.customer?.full_name}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(commission.created_at).toLocaleDateString()}
              </span>
              {commission.deadline && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Due: {new Date(commission.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 ml-4">
            {commission.status === 'pending' && (
              <button
                onClick={onSendQuote}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Send Quote
              </button>
            )}

            <select
              value={commission.status}
              onChange={(e) => onStatusUpdate(commission.id, e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(commission.status)}`}>
            {formatStatus(commission.status)}
          </span>
          
          {commission.budget_max && (
            <span className="text-lg font-semibold text-gray-900">
              ${commission.budget_min} - ${commission.budget_max}
            </span>
          )}
        </div>
      </div>

      {/* Commission Details */}
      <div className="p-6 border-b border-gray-200">
        <div className="space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
            <div className="text-gray-700">
              {showFullDescription || commission.description.length <= 200 ? (
                <p className="whitespace-pre-wrap">{commission.description}</p>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap">
                    {commission.description.substring(0, 200)}...
                  </p>
                  <button
                    onClick={() => setShowFullDescription(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mt-1"
                  >
                    Read more
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {commission.preferred_medium && (
              <div>
                <span className="font-medium text-gray-900">Medium:</span>
                <p className="text-gray-700">{commission.preferred_medium}</p>
              </div>
            )}

            {commission.preferred_style && (
              <div>
                <span className="font-medium text-gray-900">Style:</span>
                <p className="text-gray-700">{commission.preferred_style}</p>
              </div>
            )}

            {commission.dimensions && (
              <div>
                <span className="font-medium text-gray-900">Dimensions:</span>
                <p className="text-gray-700">{commission.dimensions}</p>
              </div>
            )}

            {commission.deadline && (
              <div>
                <span className="font-medium text-gray-900">Deadline:</span>
                <p className={`${new Date(commission.deadline) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                  {new Date(commission.deadline).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Reference Images */}
          {commission.reference_images && commission.reference_images.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Reference Images</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {commission.reference_images.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quote Information */}
          {commission.quote_amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Quote Details</h4>
              <div className="space-y-1 text-sm">
                <p className="text-blue-800">
                  <span className="font-medium">Amount:</span> ${commission.quote_amount}
                </p>
                {commission.quote_details && (
                  <p className="text-blue-800">
                    <span className="font-medium">Details:</span> {commission.quote_details}
                  </p>
                )}
                {commission.estimated_completion && (
                  <p className="text-blue-800">
                    <span className="font-medium">Estimated Completion:</span>{' '}
                    {new Date(commission.estimated_completion).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Section */}
      <div className="p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Messages</h4>
        
        {/* Messages List */}
        <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === commission.artist_id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_id === commission.artist_id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                } ${message.is_status_update ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : ''}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === commission.artist_id && !message.is_status_update
                      ? 'text-indigo-200' 
                      : message.is_status_update
                      ? 'text-yellow-600'
                      : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center text-sm">No messages yet</p>
          )}
        </div>

        {/* Message Input */}
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={2}
            />
          </div>
          <button
            onClick={onSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingMessage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Quote Modal Component
const QuoteModal: React.FC<{
  commissionId: string;
  onClose: () => void;
  onSubmit: (id: string, amount: number, details: string, estimatedCompletion?: string) => Promise<boolean>;
}> = ({ commissionId, onClose, onSubmit }) => {
  const [quoteData, setQuoteData] = useState({
    amount: '',
    details: '',
    estimatedCompletion: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteData.amount || !quoteData.details) return;

    setSubmitting(true);
    try {
      const success = await onSubmit(
        commissionId,
        parseFloat(quoteData.amount),
        quoteData.details,
        quoteData.estimatedCompletion || undefined
      );
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to send quote:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Send Quote</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Amount ($) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={quoteData.amount}
              onChange={(e) => setQuoteData({ ...quoteData, amount: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter quote amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Details *
            </label>
            <textarea
              rows={4}
              required
              value={quoteData.details}
              onChange={(e) => setQuoteData({ ...quoteData, details: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe what's included, materials, timeline, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Completion Date
            </label>
            <input
              type="date"
              value={quoteData.estimatedCompletion}
              onChange={(e) => setQuoteData({ ...quoteData, estimatedCompletion: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !quoteData.amount || !quoteData.details}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending...' : 'Send Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommissionTracker;