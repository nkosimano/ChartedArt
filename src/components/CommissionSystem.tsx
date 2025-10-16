import React, { useState, useEffect } from 'react';
import { useArtistPortal } from '../hooks/useArtistPortal';
import { useSocialFeatures } from '../hooks/useSocialFeatures';
import { useAuth } from '../hooks/useAuth';
import { useImageUpload, createDragAndDropHandlers, createFileInputHandler } from '../utils/imageUpload';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  FileText,
  Upload,
  Eye,
  Edit3,
  AlertTriangle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface CommissionSystemProps {
  // Can be used as standalone component or within artist dashboard
  standalone?: boolean;
  customerId?: string; // For customer-facing commission request form
  artistId?: string;   // For browsing specific artist's commission options
}

// Commission Request Form (Customer Side)
const CommissionRequestForm: React.FC<{ artistId: string; onSubmit: () => void }> = ({ artistId, onSubmit }) => {
  const { user } = useAuth();
  const { uploadWithProgress, isUploading, uploadErrors } = useImageUpload();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    preferred_medium: '',
    preferred_style: '',
    dimensions: '',
    deadline: ''
  });
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dragHandlers = createDragAndDropHandlers((files) => {
    handleImageUpload(files);
  }, 5);

  const fileInputHandler = createFileInputHandler((files) => {
    handleImageUpload(files);
  }, 5);

  const handleImageUpload = async (files: File[]) => {
    if (!user) return;
    
    try {
      const results = await uploadWithProgress(files, user.id, {
        folder: 'commission-references',
        maxWidth: 1200,
        quality: 0.8
      });
      
      const newImageUrls = results.map(result => result.url);
      setReferenceImages(prev => [...prev, ...newImageUrls]);
    } catch (error) {
      console.error('Failed to upload reference images:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          artist_id: artistId,
          customer_id: user.id,
          reference_images: referenceImages,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null
        })
      });

      if (response.ok) {
        onSubmit();
        // Reset form
        setFormData({
          title: '',
          description: '',
          budget_min: '',
          budget_max: '',
          preferred_medium: '',
          preferred_style: '',
          dimensions: '',
          deadline: ''
        });
        setReferenceImages([]);
      }
    } catch (error) {
      console.error('Failed to submit commission request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Request a Custom Commission</h2>
        <p className="mt-1 text-sm text-gray-600">
          Describe your vision and the artist will provide a quote and timeline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Commission Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Custom Portrait, Abstract Landscape..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Detailed Description *</label>
          <textarea
            rows={4}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Provide as much detail as possible about what you want..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Budget Range</label>
            <div className="mt-1 flex space-x-2">
              <input
                type="number"
                min="0"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Min $"
              />
              <input
                type="number"
                min="0"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Max $"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Medium</label>
            <select
              value={formData.preferred_medium}
              onChange={(e) => setFormData({ ...formData, preferred_medium: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Any medium</option>
              <option value="oil">Oil Paint</option>
              <option value="acrylic">Acrylic Paint</option>
              <option value="watercolor">Watercolor</option>
              <option value="digital">Digital Art</option>
              <option value="charcoal">Charcoal</option>
              <option value="pencil">Pencil</option>
              <option value="mixed_media">Mixed Media</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Style</label>
            <select
              value={formData.preferred_style}
              onChange={(e) => setFormData({ ...formData, preferred_style: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Any style</option>
              <option value="realistic">Realistic</option>
              <option value="abstract">Abstract</option>
              <option value="impressionist">Impressionist</option>
              <option value="minimalist">Minimalist</option>
              <option value="pop_art">Pop Art</option>
              <option value="surreal">Surreal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dimensions (Optional)</label>
          <input
            type="text"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 16x20 inches, 30x40 cm..."
          />
        </div>

        {/* Reference Images Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images (Optional)</label>
          <div
            {...dragHandlers}
            className={`relative border-2 border-dashed rounded-lg p-6 ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={fileInputHandler}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Drop reference images here, or <span className="text-indigo-600">click to browse</span>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
              </div>
            </div>
          </div>

          {/* Uploaded Images Preview */}
          {referenceImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {referenceImages.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setReferenceImages(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }} />
              </div>
              <p className="text-sm text-gray-600 mt-1">Uploading images...</p>
            </div>
          )}

          {/* Upload Errors */}
          {uploadErrors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-md">
              <p className="text-sm text-red-800">Upload errors:</p>
              <ul className="text-xs text-red-700 mt-1">
                {uploadErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || isUploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Commission Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Commission Management (Artist Side)
const CommissionManagement: React.FC = () => {
  const { 
    commissionRequests, 
    commissionMessages, 
    updateCommissionStatus, 
    sendQuote, 
    sendCommissionMessage,
    commissionsLoading 
  } = useArtistPortal();
  
  const [selectedCommission, setSelectedCommission] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [quoteModal, setQuoteModal] = useState<{ commissionId: string; isOpen: boolean }>({
    commissionId: '',
    isOpen: false
  });

  const filteredCommissions = commissionRequests?.filter(commission => {
    switch (activeTab) {
      case 'pending':
        return commission.status === 'pending' || commission.status === 'reviewing';
      case 'active':
        return commission.status === 'accepted' || commission.status === 'in_progress';
      case 'completed':
        return commission.status === 'completed' || commission.status === 'delivered';
      default:
        return true;
    }
  }) || [];

  if (commissionsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Requests', count: commissionRequests?.length || 0 },
            { key: 'pending', label: 'Pending Review', count: commissionRequests?.filter(c => c.status === 'pending' || c.status === 'reviewing').length || 0 },
            { key: 'active', label: 'Active Projects', count: commissionRequests?.filter(c => c.status === 'accepted' || c.status === 'in_progress').length || 0 },
            { key: 'completed', label: 'Completed', count: commissionRequests?.filter(c => c.status === 'completed' || c.status === 'delivered').length || 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 inline-block bg-gray-200 text-gray-900 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Commission List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {filteredCommissions.length > 0 ? (
              filteredCommissions.map((commission) => (
                <div
                  key={commission.id}
                  onClick={() => setSelectedCommission(commission.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCommission === commission.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{commission.title}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      commission.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      commission.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {commission.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4 mr-1" />
                    {commission.customer?.full_name}
                  </div>
                  
                  {commission.budget_max && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${commission.budget_min} - ${commission.budget_max}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(commission.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No commission requests found</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedCommission ? (
            <CommissionDetail 
              commissionId={selectedCommission}
              commission={filteredCommissions.find(c => c.id === selectedCommission)!}
              messages={commissionMessages[selectedCommission] || []}
              onStatusUpdate={updateCommissionStatus}
              onSendQuote={sendQuote}
              onSendMessage={sendCommissionMessage}
              onOpenQuoteModal={(id) => setQuoteModal({ commissionId: id, isOpen: true })}
            />
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Select a Commission</h3>
                <p className="text-gray-600">Choose a commission request to view details and manage the project.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {quoteModal.isOpen && (
        <QuoteModal
          commissionId={quoteModal.commissionId}
          onClose={() => setQuoteModal({ commissionId: '', isOpen: false })}
          onSubmit={sendQuote}
        />
      )}
    </div>
  );
};

// Commission Detail Component
const CommissionDetail: React.FC<{
  commissionId: string;
  commission: any;
  messages: any[];
  onStatusUpdate: (id: string, status: any, notes?: string) => Promise<boolean>;
  onSendQuote: (id: string, amount: number, details: string, estimatedCompletion?: string) => Promise<boolean>;
  onSendMessage: (commissionId: string, message: string, attachments?: string[]) => Promise<boolean>;
  onOpenQuoteModal: (id: string) => void;
}> = ({ commissionId, commission, messages, onStatusUpdate, onSendQuote, onSendMessage, onOpenQuoteModal }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      await onSendMessage(commissionId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await onStatusUpdate(commissionId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{commission.title}</h2>
          <div className="flex items-center space-x-2">
            {commission.status === 'pending' && (
              <button
                onClick={() => onOpenQuoteModal(commissionId)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Send Quote
              </button>
            )}
            <select
              value={commission.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Commission Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-gray-700">Customer:</p>
            <p className="text-gray-900">{commission.customer?.full_name}</p>
          </div>
          
          {commission.budget_max && (
            <div>
              <p className="font-medium text-gray-700">Budget:</p>
              <p className="text-gray-900">${commission.budget_min} - ${commission.budget_max}</p>
            </div>
          )}
          
          {commission.deadline && (
            <div>
              <p className="font-medium text-gray-700">Deadline:</p>
              <p className="text-gray-900">{new Date(commission.deadline).toLocaleDateString()}</p>
            </div>
          )}
          
          {commission.preferred_medium && (
            <div>
              <p className="font-medium text-gray-700">Preferred Medium:</p>
              <p className="text-gray-900">{commission.preferred_medium}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mt-4">
          <p className="font-medium text-gray-700 mb-2">Description:</p>
          <p className="text-gray-900 whitespace-pre-wrap">{commission.description}</p>
        </div>

        {/* Reference Images */}
        {commission.reference_images && commission.reference_images.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-gray-700 mb-2">Reference Images:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commission.reference_images.map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quote Information */}
        {commission.quote_amount && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-900 mb-2">Quote Sent:</p>
            <p className="text-blue-800">Amount: ${commission.quote_amount}</p>
            {commission.quote_details && (
              <p className="text-blue-800 mt-1">Details: {commission.quote_details}</p>
            )}
            {commission.estimated_completion && (
              <p className="text-blue-800 mt-1">
                Estimated Completion: {new Date(commission.estimated_completion).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Messages</h3>
        
        {/* Message List */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
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
                } ${message.is_status_update ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                  <p className="text-sm">{message.message}</p>
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
            <p className="text-gray-500 text-center">No messages yet</p>
          )}
        </div>

        {/* Message Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {sending ? (
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

// Quote Modal
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
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Send Quote</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quote Amount ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={quoteData.amount}
                onChange={(e) => setQuoteData({ ...quoteData, amount: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quote Details *</label>
              <textarea
                rows={3}
                required
                value={quoteData.details}
                onChange={(e) => setQuoteData({ ...quoteData, details: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe what's included, timeline, etc..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estimated Completion</label>
              <input
                type="date"
                value={quoteData.estimatedCompletion}
                onChange={(e) => setQuoteData({ ...quoteData, estimatedCompletion: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Quote'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Commission System Component
const CommissionSystem: React.FC<CommissionSystemProps> = ({ 
  standalone = false, 
  customerId, 
  artistId 
}) => {
  const { user, profile } = useAuth();
  const [view, setView] = useState<'request' | 'manage'>('request');

  // Show request form for customers or if specific artist is targeted
  if (customerId || (artistId && !profile?.is_artist)) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <CommissionRequestForm 
          artistId={artistId || ''}
          onSubmit={() => {
            // Handle successful submission
            console.log('Commission request submitted successfully');
          }}
        />
      </div>
    );
  }

  // Show management interface for artists
  if (profile?.is_artist) {
    if (standalone) {
      return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your commission requests and communicate with customers.
            </p>
          </div>
          <CommissionManagement />
        </div>
      );
    }
    
    return <CommissionManagement />;
  }

  // Default view
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Commission System</h2>
        <p className="text-gray-600">
          Artists can manage commission requests, customers can request custom artwork.
        </p>
      </div>
    </div>
  );
};

export default CommissionSystem;