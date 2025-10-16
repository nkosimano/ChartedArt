import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Bell, Send, Users, UserCheck, User, X, AlertCircle } from 'lucide-react';

interface NotificationComposerProps {
  onClose?: () => void;
}

export default function NotificationComposer({ onClose }: NotificationComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'specific'>('all');
  const [specificUserId, setSpecificUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    fetchUserCount();
  }, [targetAudience]);

  async function fetchUserCount() {
    try {
      let query = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('push_token', 'is', null);

      if (targetAudience === 'active') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('last_login', thirtyDaysAgo);
      } else if (targetAudience === 'specific') {
        setUserCount(specificUserId ? 1 : 0);
        return;
      }

      const { count } = await query;
      setUserCount(count || 0);
    } catch (err) {
      console.error('Error fetching user count:', err);
    }
  }

  async function sendNotifications() {
    if (!title || !body) {
      setError('Please enter title and message');
      return;
    }

    if (targetAudience === 'specific' && !specificUserId) {
      setError('Please enter a user ID');
      return;
    }

    setSending(true);
    setResult(null);
    setError(null);

    try {
      // Get target users based on audience selection
      let query = supabase
        .from('profiles')
        .select('id, push_token, full_name, email')
        .not('push_token', 'is', null);

      if (targetAudience === 'active') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('last_login', thirtyDaysAgo);
      } else if (targetAudience === 'specific') {
        query = query.eq('id', specificUserId);
      }

      const { data: users, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!users || users.length === 0) {
        setError('No users found with push tokens');
        return;
      }

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Send notifications via backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/admin/send-bulk-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          body,
          userIds: users.map(u => u.id),
          type: 'admin_broadcast',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notifications: ${response.statusText}`);
      }

      const data = await response.json();
      setResult({ sent: data.sent || 0, failed: data.failed || 0 });

      // Clear form on success
      if (data.sent > 0) {
        setTitle('');
        setBody('');
        setSpecificUserId('');
      }
    } catch (err) {
      console.error('Error sending notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Send Push Notification</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Products Available!"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/50 characters</p>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your message here..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{body.length}/200 characters</p>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Target Audience
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="all"
                checked={targetAudience === 'all'}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <Users className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <span className="font-medium">All Users with Push Enabled</span>
                <p className="text-sm text-gray-500">{userCount} users</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="active"
                checked={targetAudience === 'active'}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <UserCheck className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <span className="font-medium">Active Users (Last 30 Days)</span>
                <p className="text-sm text-gray-500">{userCount} users</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="specific"
                checked={targetAudience === 'specific'}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <span className="font-medium">Specific User</span>
              </div>
            </label>
          </div>

          {targetAudience === 'specific' && (
            <input
              type="text"
              value={specificUserId}
              onChange={(e) => setSpecificUserId(e.target.value)}
              placeholder="Enter User ID (UUID)"
              className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-3">PREVIEW</p>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {title || 'Notification Title'}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {body || 'Your message will appear here'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Just now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              ✅ Successfully sent to {result.sent} user{result.sent !== 1 ? 's' : ''}
              {result.failed > 0 && ` (${result.failed} failed)`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={sendNotifications}
            disabled={sending || !title || !body || userCount === 0}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {userCount} User{userCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={sending}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
