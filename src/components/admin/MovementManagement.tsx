import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Plus, 
  Edit, 
  Archive, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Movement {
  id: string;
  title: string;
  slug: string;
  description: string;
  banner_image: string | null;
  cause_description: string | null;
  goal_amount: number;
  start_date: string | null;
  end_date: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  current_amount?: number;
  participant_count?: number;
}

interface MovementFormData {
  title: string;
  slug: string;
  description: string;
  banner_image: string;
  cause_description: string;
  goal_amount: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export default function MovementManagement() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MovementFormData>({
    title: '',
    slug: '',
    description: '',
    banner_image: '',
    cause_description: '',
    goal_amount: '',
    start_date: '',
    end_date: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('movements')
        .select(`
          *,
          movement_metrics (
            total_raised,
            participant_count
          )
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const movementsWithMetrics = data.map(m => ({
        ...m,
        current_amount: m.movement_metrics?.[0]?.total_raised || 0,
        participant_count: m.movement_metrics?.[0]?.participant_count || 0
      }));

      setMovements(movementsWithMetrics);
    } catch (err) {
      console.error('Error fetching movements:', err);
      toast.error('Failed to load movements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        banner_image: formData.banner_image.trim() || null,
        cause_description: formData.cause_description.trim() || null,
        goal_amount: parseFloat(formData.goal_amount) || 0,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status
      };

      if (editingId) {
        // Update existing movement
        const { error } = await supabase
          .from('movements')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Movement updated successfully');
      } else {
        // Create new movement
        const { error } = await supabase
          .from('movements')
          .insert([payload]);

        if (error) throw error;
        toast.success('Movement created successfully');
      }

      resetForm();
      fetchMovements();
    } catch (err: any) {
      console.error('Error saving movement:', err);
      toast.error(err.message || 'Failed to save movement');
    }
  };

  const handleEdit = (movement: Movement) => {
    setEditingId(movement.id);
    setFormData({
      title: movement.title,
      slug: movement.slug,
      description: movement.description,
      banner_image: movement.banner_image || '',
      cause_description: movement.cause_description || '',
      goal_amount: movement.goal_amount.toString(),
      start_date: movement.start_date ? movement.start_date.split('T')[0] : '',
      end_date: movement.end_date ? movement.end_date.split('T')[0] : '',
      status: movement.status as any
    });
    setShowForm(true);
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this movement?')) return;

    try {
      const { error } = await supabase
        .from('movements')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Movement archived successfully');
      fetchMovements();
    } catch (err) {
      console.error('Error archiving movement:', err);
      toast.error('Failed to archive movement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      banner_image: '',
      cause_description: '',
      goal_amount: '',
      start_date: '',
      end_date: '',
      status: 'draft'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-300">Movement Management</h1>
          <p className="text-charcoal-200 mt-1">Create and manage social impact campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-sage-400 text-white px-4 py-2 rounded-lg hover:bg-sage-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Movement</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal-300">
                {editingId ? 'Edit Movement' : 'Create New Movement'}
              </h2>
              <button onClick={resetForm} className="text-charcoal-200 hover:text-charcoal-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      title: e.target.value,
                      slug: editingId ? formData.slug : generateSlug(e.target.value)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  placeholder="e.g., Art for Education"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent font-mono text-sm"
                  placeholder="art-for-education"
                  pattern="[a-z0-9-]+"
                />
                <p className="text-xs text-charcoal-200 mt-1">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Short Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  placeholder="Brief description for cards and previews"
                />
              </div>

              {/* Cause Description */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Detailed Cause Description
                </label>
                <textarea
                  value={formData.cause_description}
                  onChange={(e) => setFormData({ ...formData, cause_description: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  placeholder="Full description of the cause and impact"
                />
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  value={formData.banner_image}
                  onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              {/* Goal Amount */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Fundraising Goal ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.goal_amount}
                  onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  placeholder="10000.00"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-charcoal-300 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-charcoal-300 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-sage-400 text-white px-4 py-2 rounded-lg hover:bg-sage-500 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Update' : 'Create'} Movement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movements List */}
      {movements.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <TrendingUp className="w-12 h-12 text-charcoal-200 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-charcoal-300 mb-1">No movements yet</h3>
          <p className="text-charcoal-200">Create your first social impact campaign</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {movements.map((movement) => (
            <div key={movement.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex">
                {/* Banner Image */}
                {movement.banner_image && (
                  <div className="w-48 h-48 flex-shrink-0">
                    <img
                      src={movement.banner_image}
                      alt={movement.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-charcoal-300">{movement.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(movement.status)}`}>
                          {movement.status}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal-200 mb-1">/{movement.slug}</p>
                      <p className="text-charcoal-200">{movement.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(movement)}
                        className="p-2 text-charcoal-300 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleArchive(movement.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-charcoal-200">Raised</p>
                        <p className="font-semibold text-charcoal-300">
                          ${movement.current_amount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-charcoal-200">Goal</p>
                        <p className="font-semibold text-charcoal-300">
                          ${movement.goal_amount?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-charcoal-200">Participants</p>
                        <p className="font-semibold text-charcoal-300">
                          {movement.participant_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  {(movement.start_date || movement.end_date) && (
                    <div className="flex items-center space-x-4 mt-3 text-sm text-charcoal-200">
                      <Calendar className="w-4 h-4" />
                      {movement.start_date && (
                        <span>Start: {new Date(movement.start_date).toLocaleDateString()}</span>
                      )}
                      {movement.end_date && (
                        <span>End: {new Date(movement.end_date).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
