import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Mail, Archive, ChevronDown, Reply } from 'lucide-react';
import MessageReplyDialog from '@/components/MessageReplyDialog';
import type { Database } from '@/lib/supabase/types';

type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
};

const MESSAGE_STATUS_INFO = {
  pending: {
    color: 'bg-amber-100 text-amber-700',
    label: 'Pending'
  },
  read: {
    color: 'bg-blue-100 text-blue-700',
    label: 'Read'
  },
  replied: {
    color: 'bg-green-100 text-green-700',
    label: 'Replied'
  },
  archived: {
    color: 'bg-gray-100 text-gray-700',
    label: 'Archived'
  }
};

export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [updatingMessage, setUpdatingMessage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const checkAdminAndFetchMessages = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth/login');
          return;
        }

        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (adminError) throw adminError;

        if (!adminUser) {
          setIsAdmin(false);
          navigate('/');
          return;
        }

        setIsAdmin(true);

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .not('status', 'eq', 'archived')
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        // Subscribe to message changes
        const channel = supabase
          .channel('messages_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages'
            },
            async () => {
              const { data: refreshedMessages } = await supabase
                .from('messages')
                .select('*')
                .not('status', 'eq', 'archived')
                .order('created_at', { ascending: false });
              
              if (refreshedMessages) {
                setMessages(refreshedMessages);
              }
            }
          )
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      } catch (err) {
        console.error('Error in admin messages page:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchMessages();
  }, [navigate]);

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      setFilteredMessages(messages);
      return;
    }

    const filtered = messages.filter(message => {
      const matchesName = message.name.toLowerCase().includes(search);
      const matchesEmail = message.email.toLowerCase().includes(search);
      const matchesMessage = message.message.toLowerCase().includes(search);
      return matchesName || matchesEmail || matchesMessage;
    });

    setFilteredMessages(filtered);
  }, [searchTerm, messages]);

  const handleStatusUpdate = async (messageId: string, newStatus: Message['status']) => {
    try {
      setUpdatingMessage(messageId);
      setError(null);

      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) throw updateError;

      setMessages(messages.map(message => 
        message.id === messageId 
          ? { ...message, status: newStatus, updated_at: new Date().toISOString() }
          : message
      ));

      // If the message was archived, remove it from the list
      if (newStatus === 'archived') {
        setMessages(messages.filter(message => message.id !== messageId));
      }

    } catch (err) {
      console.error('Error updating message status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update message status');
    } finally {
      setUpdatingMessage(null);
    }
  };

  const handleReply = async (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400"></div>
            <span className="ml-3">Loading messages...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen py-12 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            Access denied. You must be an admin to view this page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-charcoal-300 mb-12">
          Message Management
        </h1>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search messages by name, email, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-charcoal-300">No messages found</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-charcoal-300">No messages found matching your search</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredMessages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{message.name}</h2>
                      <a 
                        href={`mailto:${message.email}`}
                        className="text-sage-400 hover:text-sage-500"
                      >
                        {message.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        MESSAGE_STATUS_INFO[message.status].color
                      }`}>
                        {MESSAGE_STATUS_INFO[message.status].label}
                      </span>
                      <select
                        value={message.status}
                        onChange={(e) => handleStatusUpdate(message.id, e.target.value as Message['status'])}
                        disabled={updatingMessage === message.id}
                        className="px-3 py-1 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                      >
                        {Object.entries(MESSAGE_STATUS_INFO).map(([value, { label }]) => (
                          <option key={value} value={value}>
                            Mark as {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSelectedMessage(message)}
                        className="px-3 py-1 rounded-lg text-sm border border-sage-400 text-sage-400 hover:bg-sage-50 flex items-center gap-2"
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
                    </div>
                  </div>

                  <div className="bg-cream-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-charcoal-300">
                      {message.message}
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-charcoal-200">
                    Received: {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedMessage && (
        <MessageReplyDialog
          isOpen={true}
          onClose={() => setSelectedMessage(null)}
          message={selectedMessage}
          onSuccess={() => {
            handleStatusUpdate(selectedMessage.id, 'replied');
            setSelectedMessage(null);
          }}
        />
      )}
    </div>
  );
}