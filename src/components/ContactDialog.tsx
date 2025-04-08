import { useState } from 'react';
import { Mail, Phone, MapPin, X, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactDialog({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert([{
          name,
          email: email.trim().toLowerCase(),
          message
        }]);

      if (insertError) throw insertError;

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-charcoal-200 hover:text-charcoal-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-charcoal-300 mb-6">Contact Support</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-sage-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-charcoal-300">Email</h3>
                  <a 
                    href="mailto:malebogo@chartedart.co.za" 
                    className="text-sage-400 hover:text-sage-500"
                  >
                    malebogo@chartedart.co.za
                  </a>
                  <p className="text-sm text-charcoal-200 mt-1">
                    Response time: Within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-sage-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-charcoal-300">Phone</h3>
                  <a 
                    href="tel:+27813335458" 
                    className="text-sage-400 hover:text-sage-500"
                  >
                    081 333 5458
                  </a>
                  <p className="text-sm text-charcoal-200 mt-1">
                    Monday - Friday: 8:00 - 17:00 SAST
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-sage-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-charcoal-300">Address</h3>
                  <p className="text-charcoal-300">
                    123 Art Street<br />
                    Sandton<br />
                    Johannesburg, 2196<br />
                    South Africa
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cream-50 p-6 rounded-lg">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-sage-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal-300 mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-charcoal-200 mb-6">
                    We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={onClose}
                    className="text-sage-400 hover:text-sage-500 font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-charcoal-300 mb-1">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-charcoal-300 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-charcoal-300 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-sage-400 text-white py-2 rounded-lg font-medium hover:bg-sage-500 transition-colors disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}