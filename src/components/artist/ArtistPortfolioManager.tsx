import React, { useState, useRef } from 'react';
import { useArtistPortal } from '../../hooks/useArtistPortal';
import { useAuth } from '../../hooks/useAuth';
import { useImageUpload, createDragAndDropHandlers, createFileInputHandler } from '../../utils/imageUpload';
import {
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image,
  Star,
  Eye,
  EyeOff,
  Grid,
  List,
  Search,
  Filter,
  Tag,
  Calendar,
  Palette,
  Maximize2
} from 'lucide-react';

const ArtistPortfolioManager: React.FC = () => {
  const { user } = useAuth();
  const {
    portfolios,
    portfoliosLoading,
    addPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem
  } = useArtistPortal();
  
  const { uploadWithProgress, isUploading, uploadErrors } = useImageUpload();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter portfolios based on search and category
  const filteredPortfolios = portfolios?.filter(portfolio => {
    const matchesSearch = portfolio.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portfolio.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         portfolio.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || portfolio.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = ['all', ...new Set(portfolios?.map(p => p.category).filter(Boolean))];

  const handleAddNew = () => {
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      await deletePortfolioItem(id);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    await updatePortfolioItem(id, { is_featured: !currentFeatured });
  };

  const handleToggleCommissionAvailable = async (id: string, currentAvailable: boolean) => {
    await updatePortfolioItem(id, { is_available_for_commission: !currentAvailable });
  };

  if (portfoliosLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Manager</h2>
          <p className="mt-1 text-sm text-gray-600">
            Showcase your artwork and manage your creative portfolio
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Artwork
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search artworks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-4 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Grid/List */}
      {filteredPortfolios.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
        }>
          {filteredPortfolios.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              viewMode={viewMode}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item.id)}
              onToggleFeatured={() => handleToggleFeatured(item.id, item.is_featured)}
              onToggleCommissionAvailable={() => handleToggleCommissionAvailable(item.id, item.is_available_for_commission)}
              onView={() => setSelectedItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Image className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No artwork found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Start building your portfolio by adding your first artwork'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={handleAddNew}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Artwork
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <PortfolioModal
          item={editingItem}
          onClose={() => setShowAddModal(false)}
          onSave={editingItem ? updatePortfolioItem : addPortfolioItem}
        />
      )}

      {/* Detail View Modal */}
      {selectedItem && (
        <PortfolioDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEdit={() => {
            setSelectedItem(null);
            handleEdit(selectedItem);
          }}
        />
      )}
    </div>
  );
};

// Portfolio Card Component
const PortfolioCard: React.FC<{
  item: any;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  onToggleCommissionAvailable: () => void;
  onView: () => void;
}> = ({ item, viewMode, onEdit, onDelete, onToggleFeatured, onToggleCommissionAvailable, onView }) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-20 h-20 rounded-lg object-cover cursor-pointer"
            onClick={onView}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{item.title}</h3>
              <div className="flex items-center space-x-2">
                {item.is_featured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
                {item.is_available_for_commission && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Commission Available
                  </span>
                )}
              </div>
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                {item.category && (
                  <span className="flex items-center">
                    <Palette className="w-4 h-4 mr-1" />
                    {item.category}
                  </span>
                )}
                {item.year_created && (
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {item.year_created}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={onView}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={onEdit}
                  className="p-1 text-gray-400 hover:text-indigo-600"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={item.image_url}
          alt={item.title}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={onView}
        />
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          <button
            onClick={onView}
            className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badges */}
        <div className="absolute top-2 right-2 space-y-1">
          {item.is_featured && (
            <button
              onClick={onToggleFeatured}
              className="block p-1 bg-yellow-500 rounded-full text-white"
              title="Featured"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          )}
          <button
            onClick={onToggleCommissionAvailable}
            className={`block p-1 rounded-full text-white ${
              item.is_available_for_commission ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={item.is_available_for_commission ? 'Commission Available' : 'Commission Not Available'}
          >
            {item.is_available_for_commission ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">{item.title}</h3>
        
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            {item.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {item.category}
              </span>
            )}
          </div>
          {item.year_created && (
            <span>{item.year_created}</span>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Portfolio Modal Component
const PortfolioModal: React.FC<{
  item: any;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<boolean> | ((data: any) => Promise<boolean>);
}> = ({ item, onClose, onSave }) => {
  const { user } = useAuth();
  const { uploadWithProgress, isUploading } = useImageUpload();
  
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || '',
    medium: item?.medium || '',
    dimensions: item?.dimensions || '',
    year_created: item?.year_created || new Date().getFullYear(),
    is_featured: item?.is_featured || false,
    is_available_for_commission: item?.is_available_for_commission || false,
    tags: item?.tags || [],
    sort_order: item?.sort_order || 0
  });
  
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (files: File[]) => {
    if (!user || files.length === 0) return;
    
    try {
      const results = await uploadWithProgress(files, user.id, {
        folder: 'portfolio',
        maxWidth: 2048,
        quality: 0.9,
        generateThumbnail: true
      });
      
      if (results.length > 0) {
        setImageUrl(results[0].url);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const dragHandlers = createDragAndDropHandlers(handleImageUpload, 1);
  const fileInputHandler = createFileInputHandler(handleImageUpload, 1);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !imageUrl) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        image_url: imageUrl
      };

      let success;
      if (item) {
        success = await (onSave as any)(item.id, data);
      } else {
        success = await (onSave as any)(data);
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save portfolio item:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {item ? 'Edit Artwork' : 'Add New Artwork'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Artwork Image *
              </label>
              
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  {...dragHandlers}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={fileInputHandler}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Drop your artwork here, or <span className="text-indigo-600">click to browse</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300 w-1/2" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Uploading...</p>
                </div>
              )}
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select category</option>
                    <option value="painting">Painting</option>
                    <option value="drawing">Drawing</option>
                    <option value="sculpture">Sculpture</option>
                    <option value="digital">Digital Art</option>
                    <option value="photography">Photography</option>
                    <option value="mixed_media">Mixed Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Medium</label>
                  <input
                    type="text"
                    value={formData.medium}
                    onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Oil on canvas, Digital, Charcoal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 24x36 inches"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Year Created</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.year_created}
                    onChange={(e) => setFormData({ ...formData, year_created: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag"
                    className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Featured artwork
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_available_for_commission}
                    onChange={(e) => setFormData({ ...formData, is_available_for_commission: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Available for commission
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isUploading || !formData.title || !imageUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : item ? 'Update Artwork' : 'Add Artwork'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Portfolio Detail Modal
const PortfolioDetailModal: React.FC<{
  item: any;
  onClose: () => void;
  onEdit: () => void;
}> = ({ item, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-indigo-600"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {item.description && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.category && (
                <div>
                  <span className="font-medium text-gray-900">Category:</span>
                  <p className="text-gray-700">{item.category}</p>
                </div>
              )}

              {item.medium && (
                <div>
                  <span className="font-medium text-gray-900">Medium:</span>
                  <p className="text-gray-700">{item.medium}</p>
                </div>
              )}

              {item.dimensions && (
                <div>
                  <span className="font-medium text-gray-900">Dimensions:</span>
                  <p className="text-gray-700">{item.dimensions}</p>
                </div>
              )}

              {item.year_created && (
                <div>
                  <span className="font-medium text-gray-900">Year:</span>
                  <p className="text-gray-700">{item.year_created}</p>
                </div>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              {item.is_featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <Star className="w-4 h-4 mr-1" />
                  Featured
                </span>
              )}
              {item.is_available_for_commission && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Available for Commission
                </span>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>Created: {new Date(item.created_at).toLocaleDateString()}</p>
              {item.updated_at !== item.created_at && (
                <p>Updated: {new Date(item.updated_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistPortfolioManager;