import { useState, useCallback } from "react";
import { Upload, Frame, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { api, APIError } from "@/lib/api/client";
import { uploadFileSecurely } from "@/lib/utils/file-upload";
import { useNavigate } from "react-router-dom";

const SIZES = [
  { id: "A4", name: "A4", dimensions: "210 x 297 mm", price: 499.99, minPixels: 1748 },
  { id: "A3", name: "A3", dimensions: "297 x 420 mm", price: 699.99, minPixels: 2480 },
  { id: "A2", name: "A2", dimensions: "420 x 594 mm", price: 899.99, minPixels: 3508 },
  { id: "A1", name: "A1", dimensions: "594 x 841 mm", price: 1299.99, minPixels: 4961 },
  { id: "A0", name: "A0", dimensions: "841 x 1189 mm", price: 1699.99, minPixels: 7016 },
];

const FRAMES = [
  { id: "none", name: "No Frame", price: 0 },
  { id: "standard", name: "Standard Frame", price: 349.99 },
  { id: "premium", name: "Premium Frame", price: 699.99 },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png"];
const MIN_RECOMMENDED_DPI = 300;

export default function CreatePage() {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const totalPrice = selectedSize.price + selectedFrame.price;

  const checkImageQuality = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      setQualityWarning(null);
      
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        throw new Error("Please upload a JPG or PNG file");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be less than 10MB");
      }

      setUploading(true);

      const dimensions = await checkImageQuality(file);
      const smallerDimension = Math.min(dimensions.width, dimensions.height);
      
      if (smallerDimension < selectedSize.minPixels) {
        const recommendedSize = SIZES.find(size => size.minPixels <= smallerDimension);
        setQualityWarning(
          recommendedSize
            ? `This image might be too small for ${selectedSize.name} prints. We recommend using ${recommendedSize.name} or smaller for best quality.`
            : `This image resolution (${dimensions.width}x${dimensions.height}) might be too low for high-quality prints. We recommend using images with at least ${selectedSize.minPixels}px for the smallest dimension.`
        );
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login');
        return;
      }

      // Step 1: Get presigned URL from backend
      console.log('Requesting presigned URL for file upload...');
      try {
        const { uploadUrl, fileKey } = await api.uploads.generateUrl(
          file.name,
          file.type,
          file.size
        );

        // Step 2: Upload file directly to S3
        console.log('Uploading file to S3...');
        await api.uploads.uploadFile(file, uploadUrl);

        // Step 3: Store file key for later use
        console.log('File uploaded successfully');
        
        // For now, construct a temporary URL (in production, use CloudFront or signed URLs)
        const tempUrl = URL.createObjectURL(file);
        
        setImage(tempUrl);
        setImagePath(fileKey);
      } catch (uploadError) {
        // Fallback to local preview if upload fails
        console.warn('Upload failed, using local preview:', uploadError);
        const tempUrl = URL.createObjectURL(file);
        setImage(tempUrl);
        setImagePath(null);
      }
      
    } catch (err) {
      console.error('File upload error:', err);
      
      if (err instanceof APIError) {
        if (err.status === 401) {
          setError('Please log in to upload files.');
          navigate('/auth/login');
        } else if (err.status === 400) {
          setError(err.message);
        } else {
          setError('Failed to upload file. Please try again.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while uploading');
      }
      
      setImage(null);
      setImagePath(null);
    } finally {
      setUploading(false);
    }
  }, [navigate, selectedSize.minPixels]);

  const handleRemoveImage = useCallback(async () => {
    if (!imagePath) return;

    try {
      setDeleting(true);
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from('uploads')
        .remove([imagePath]);

      if (deleteError) throw deleteError;

      setImage(null);
      setImagePath(null);
      setQualityWarning(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while removing the image');
    } finally {
      setDeleting(false);
    }
  }, [imagePath]);

  const handleAddToCart = async () => {
    try {
      setError(null);
      setAddingToCart(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth/login');
        return;
      }

      if (!session.user.email) {
        throw new Error('User email is required');
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Create profile if it doesn't exist
      if (!profile) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            email: session.user.email
          }]);

        if (createProfileError) throw new Error('Failed to create user profile');
      }

      // Add item directly to cart_items - no parent carts table needed
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert([{
          user_id: session.user.id,
          image_url: image,
          name: `Custom Print - ${selectedSize.name}`,
          size: selectedSize.id,
          frame: selectedFrame.id,
          price: totalPrice,
          quantity: 1
        }]);

      if (itemError) throw itemError;

      navigate('/cart');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-charcoal-300 mb-12">
          Create Your Custom ChartedArt Kit
        </h1>

        {error && (
          <div className="mb-8 bg-red-50 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Upload Your Photo</h2>
            <div
              className={`border-2 border-dashed border-sage-200 rounded-lg p-8 ${
                uploading || deleting ? 'opacity-50' : ''
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {image ? (
                <div className="space-y-4">
                  <div className="relative aspect-square">
                    <img
                      src={image}
                      alt="Uploaded photo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={handleRemoveImage}
                      disabled={deleting}
                      className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-cream-100 disabled:opacity-50"
                    >
                      {deleting ? (
                        <div className="w-5 h-5 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-5 h-5 text-charcoal-300" />
                      )}
                    </button>
                  </div>
                  {qualityWarning && (
                    <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">{qualityWarning}</p>
                    </div>
                  )}
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={uploading || deleting}
                  />
                  <div className="text-center">
                    {uploading ? (
                      <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-400 rounded-full animate-spin mx-auto mb-4" />
                    ) : (
                      <Upload className="w-12 h-12 text-sage-400 mx-auto mb-4" />
                    )}
                    <p className="text-charcoal-300 mb-2">
                      {uploading ? "Uploading..." : "Drag and drop your photo here, or click to browse"}
                    </p>
                    <p className="text-sm text-charcoal-300">
                      Supported formats: JPG, PNG (max 10MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
              <h2 className="text-2xl font-semibold mb-6">Choose Your Size</h2>
              <div className="space-y-4">
                {SIZES.map((size) => (
                  <div
                    key={size.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedSize.id === size.id
                        ? "bg-sage-100 border-2 border-sage-300"
                        : "border-2 border-transparent hover:bg-cream-50"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{size.name}</h3>
                        <p className="text-sm text-charcoal-300">
                          {size.dimensions}
                        </p>
                      </div>
                      <div className="text-lg font-semibold">R{size.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
              <h2 className="text-2xl font-semibold mb-6">Select Framing</h2>
              <div className="space-y-4">
                {FRAMES.map((frame) => (
                  <div
                    key={frame.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedFrame.id === frame.id
                        ? "bg-sage-100 border-2 border-sage-300"
                        : "border-2 border-transparent hover:bg-cream-50"
                    }`}
                    onClick={() => setSelectedFrame(frame)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Frame className="w-5 h-5 text-sage-400" />
                        <h3 className="font-semibold">{frame.name}</h3>
                      </div>
                      <div className="text-lg font-semibold">
                        {frame.price === 0 ? "Free" : `R${frame.price.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Total</h2>
                <div className="text-3xl font-bold text-sage-500">
                  R{totalPrice.toFixed(2)}
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="w-full bg-sage-400 text-white py-4 rounded-lg text-lg font-semibold hover:bg-sage-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!image || uploading || deleting || addingToCart}
              >
                {addingToCart ? "Adding to Cart..." : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}