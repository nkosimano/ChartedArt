import { useState } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api/client';

interface SubmissionFormProps {
  eventId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type Step = 'upload' | 'details' | 'confirm';

export default function SubmissionForm({ eventId, onSuccess, onCancel }: SubmissionFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      // Step 1: Request upload URL
      const { uploadUrl, submissionId: newSubmissionId } = await api.submissions.createUploadRequest(
        eventId,
        {
          title: title || 'Untitled Submission',
          description: description || '',
          filename: selectedFile.name,
          contentType: selectedFile.type,
          fileSize: selectedFile.size,
        }
      );

      setSubmissionId(newSubmissionId);

      // Step 2: Upload file to S3
      await api.uploads.uploadFile(selectedFile, uploadUrl);

      // Step 3: Confirm submission
      await api.submissions.confirmSubmission(eventId, newSubmissionId);

      setCurrentStep('confirm');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload submission');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'upload' && selectedFile) {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      handleUpload();
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('upload');
    } else if (currentStep === 'upload') {
      onCancel();
    }
  };

  const steps = [
    { id: 'upload', label: 'Upload Artwork' },
    { id: 'details', label: 'Add Details' },
    { id: 'confirm', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    index <= currentStepIndex
                      ? 'bg-sage-400 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-2 text-center">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    index < currentStepIndex ? 'bg-sage-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-charcoal-300 mb-2">Upload Your Artwork</h2>
              <p className="text-charcoal-200">
                Select the image you'd like to submit to this competition
              </p>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-sage-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-charcoal-200">
                      {selectedFile?.name} ({(selectedFile!.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    <button
                      type="button"
                      className="text-sage-400 hover:text-sage-500 text-sm font-semibold"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-semibold text-charcoal-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-charcoal-200 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </motion.div>
        )}

        {currentStep === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-charcoal-300 mb-2">Add Details</h2>
              <p className="text-charcoal-200">
                Give your submission a title and description
              </p>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-contain bg-gray-100"
                />
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-charcoal-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your artwork"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-charcoal-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your artwork (optional)"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-charcoal-300 mb-2">Submission Complete!</h2>
              <p className="text-charcoal-200">
                Your artwork has been successfully submitted to the competition.
              </p>
            </div>
            <button
              onClick={onSuccess}
              className="bg-sage-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors"
            >
              View My Submissions
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep !== 'confirm' && (
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-charcoal-300 hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            {currentStep === 'upload' ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            disabled={
              (currentStep === 'upload' && !selectedFile) ||
              (currentStep === 'details' && !title.trim()) ||
              uploading
            }
            className="flex-1 px-6 py-3 bg-sage-400 text-white rounded-lg font-semibold hover:bg-sage-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : currentStep === 'details' ? 'Submit' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

