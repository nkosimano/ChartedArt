import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: string;
    name: string;
    email: string;
    message: string;
  };
  onSuccess: () => void;
};

export default function MessageReplyDialog({ isOpen, onClose, message, onSuccess }: Props) {
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setError('Please enter a reply message');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'send-message-reply',
        {
          body: JSON.stringify({
            messageId: message.id,
            replyContent: replyContent.trim()
          }),
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Failed to send reply');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      onSuccess();
      onClose();
      setReplyContent('');
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to send reply. Please try again later.'
      );
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Reply to {message.name}</h2>
          <button
            onClick={onClose}
            className="text-charcoal-200 hover:text-charcoal-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-cream-50 p-4 rounded-lg">
            <div className="text-sm text-charcoal-200 mb-2">Original Message:</div>
            <p className="text-charcoal-300 whitespace-pre-wrap">{message.message}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal-300 mb-2">
                Your Reply
              </label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                required
                placeholder="Type your reply here..."
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-500 p-4 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-sage-400 text-white rounded-lg hover:bg-sage-500 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}