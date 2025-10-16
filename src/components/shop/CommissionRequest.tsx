import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCommissions } from '../../hooks/useCommissions';
import {
  Palette,
  Upload,
  Calendar,
  DollarSign,
  MessageSquare,
  Image,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
  Trash2
} from 'lucide-react';

interface CommissionRequest {
  id?: string;
  artistId: string;
  artistName: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  projectDetails: {
    title: string;
    description: string;
    artType: string;
    dimensions: string;
    medium: string;
    style: string;
    colorPreferences: string;
    inspirationImages: string[];
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  timeline: {
    deadline: string;
    flexibility: 'strict' | 'somewhat_flexible' | 'very_flexible';
  };
  additionalRequirements: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'in_progress' | 'completed' | 'rejected';
}

const CommissionRequest: React.FC<{
  artistId?: string;
  artistName?: string;
  onClose?: () => void;
}> = ({ artistId, artistName, onClose }) => {
  const { user } = useAuth();
  const {
    submitCommissionRequest,
    uploadReference,
    commissionLoading,
    commissionError
  } = useCommissions();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CommissionRequest>({
    artistId: artistId || '',
    artistName: artistName || '',
    customerInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: ''
    },
    projectDetails: {
      title: '',
      description: '',
      artType: '',
      dimensions: '',
      medium: '',
      style: '',
      colorPreferences: '',
      inspirationImages: []
    },
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    timeline: {
      deadline: '',
      flexibility: 'somewhat_flexible'
    },
    additionalRequirements: '',
    status: 'draft'
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const artTypes = [
    'Painting', 'Digital Art', 'Sculpture', 'Drawing', 'Photography',
    'Mixed Media', 'Illustration', 'Portrait', 'Landscape', 'Abstract'
  ];

  const mediums = [
    'Oil Paint', 'Acrylic Paint', 'Watercolor', 'Digital', 'Pencil',
    'Charcoal', 'Ink', 'Pastel', 'Mixed Media', 'Other'
  ];

  const styles = [
    'Realistic', 'Abstract', 'Impressionistic', 'Modern', 'Traditional',
    'Contemporary', 'Minimalist', 'Expressionist', 'Surreal', 'Custom Style'
  ];

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedFiles(prev => [...prev, ...fileArray]);

    // In a real app, you'd upload these files and get URLs
    const mockUrls = fileArray.map((file, index) => 
      `/api/placeholder/400/300?${Date.now()}-${index}`
    );

    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        inspirationImages: [...prev.projectDetails.inspirationImages, ...mockUrls]
      }
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        inspirationImages: prev.projectDetails.inspirationImages.filter((_, i) => i !== index)
      }
    }));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        status: 'submitted' as const
      };
      
      await submitCommissionRequest(submissionData);
      
      // Show success message
      alert('Commission request submitted successfully! The artist will review and respond soon.');
      onClose?.();
    } catch (error) {
      console.error('Failed to submit commission request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.customerInfo.name && formData.customerInfo.email;
      case 2:
        return formData.projectDetails.title && 
               formData.projectDetails.description && 
               formData.projectDetails.artType &&
               formData.projectDetails.dimensions;
      case 3:
        return formData.budget.min > 0 && formData.budget.max >= formData.budget.min;
      case 4:
        return formData.timeline.deadline;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.customerInfo.name}
                onChange={(e) => handleInputChange('customerInfo', 'name', e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.customerInfo.email}
                onChange={(e) => handleInputChange('customerInfo', 'email', e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={formData.customerInfo.phone}
                onChange={(e) => handleInputChange('customerInfo', 'phone', e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.customerInfo.address}
                onChange={(e) => handleInputChange('customerInfo', 'address', e.target.value)}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {artistId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center">
            <Palette className="w-5 h-5 text-indigo-600 mr-2" />
            <div>
              <h4 className="font-medium text-indigo-900">Commission Request for {artistName}</h4>
              <p className="text-sm text-indigo-700">
                You're requesting a custom artwork from this artist.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              value={formData.projectDetails.title}
              onChange={(e) => handleInputChange('projectDetails', 'title', e.target.value)}
              placeholder="e.g., Custom Family Portrait, Abstract Landscape..."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description *
            </label>
            <textarea
              value={formData.projectDetails.description}
              onChange={(e) => handleInputChange('projectDetails', 'description', e.target.value)}
              rows={4}
              placeholder="Describe your vision, what you want the artwork to convey, any specific elements to include..."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Art Type *
              </label>
              <select
                value={formData.projectDetails.artType}
                onChange={(e) => handleInputChange('projectDetails', 'artType', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select art type</option>
                {artTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions *
              </label>
              <input
                type="text"
                value={formData.projectDetails.dimensions}
                onChange={(e) => handleInputChange('projectDetails', 'dimensions', e.target.value)}
                placeholder="e.g., 24x36 inches, 60x80 cm"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Medium
              </label>
              <select
                value={formData.projectDetails.medium}
                onChange={(e) => handleInputChange('projectDetails', 'medium', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select medium</option>
                {mediums.map(medium => (
                  <option key={medium} value={medium}>{medium}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Style
              </label>
              <select
                value={formData.projectDetails.style}
                onChange={(e) => handleInputChange('projectDetails', 'style', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select style</option>
                {styles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Preferences
            </label>
            <input
              type="text"
              value={formData.projectDetails.colorPreferences}
              onChange={(e) => handleInputChange('projectDetails', 'colorPreferences', e.target.value)}
              placeholder="e.g., warm earth tones, vibrant blues and greens, monochromatic..."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Reference Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Images (Optional)
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Upload images that inspire your vision or show what you have in mind.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop files here or click to upload
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-600">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {/* Preview uploaded images */}
            {formData.projectDetails.inspirationImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.projectDetails.inspirationImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Reference ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Range</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Budget *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.budget.min}
                  onChange={(e) => handleInputChange('budget', 'min', parseInt(e.target.value))}
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Budget *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min={formData.budget.min}
                  value={formData.budget.max}
                  onChange={(e) => handleInputChange('budget', 'max', parseInt(e.target.value))}
                  className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Budget Guidelines</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Custom artwork pricing varies based on size, complexity, and medium</p>
                  <p>• Digital art: $50-$500 • Small paintings: $200-$800 • Large paintings: $500-$3000+</p>
                  <p>• The artist will provide a detailed quote based on your requirements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline & Additional Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Completion Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={formData.timeline.deadline}
                onChange={(e) => handleInputChange('timeline', 'deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeline Flexibility
            </label>
            <select
              value={formData.timeline.flexibility}
              onChange={(e) => handleInputChange('timeline', 'flexibility', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="strict">Strict - Must be completed by this date</option>
              <option value="somewhat_flexible">Somewhat Flexible - Can extend by 1-2 weeks</option>
              <option value="very_flexible">Very Flexible - Quality over timeline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Requirements or Notes
            </label>
            <textarea
              value={formData.additionalRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
              rows={4}
              placeholder="Any specific requirements, questions for the artist, shipping instructions, etc."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Request Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Project:</span>
              <span className="text-gray-900">{formData.projectDetails.title || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Art Type:</span>
              <span className="text-gray-900">{formData.projectDetails.artType || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dimensions:</span>
              <span className="text-gray-900">{formData.projectDetails.dimensions || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget:</span>
              <span className="text-gray-900">
                ${formData.budget.min} - ${formData.budget.max}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deadline:</span>
              <span className="text-gray-900">
                {formData.timeline.deadline ? 
                  new Date(formData.timeline.deadline).toLocaleDateString() : 
                  'Not specified'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Custom Artwork</h1>
            <p className="text-lg text-gray-600">
              Tell us about your vision and we'll help bring it to life
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step <= currentStep
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {step < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              {step < 4 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step < currentStep ? 'bg-indigo-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex space-x-16 text-xs text-gray-600">
            <span>Contact</span>
            <span>Details</span>
            <span>Budget</span>
            <span>Timeline</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {commissionError && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-red-700">{commissionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {currentStep === 4 ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceedToNext() || isSubmitting}
            className="flex items-center px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={!canProceedToNext()}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default CommissionRequest;