import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import SubmissionForm from '@/components/events/SubmissionForm';

export default function EventSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEligibility();
  }, [id]);

  const checkEligibility = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login', { state: { from: `/events/${id}/submit` } });
        return;
      }

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Check if user is registered
      const { data: registrationData, error: regError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .single();

      if (regError || !registrationData) {
        setError('You must be registered for this event to submit an entry');
        return;
      }

      setUserRegistration(registrationData);

      // Check if event is a competition
      if (eventData.event_type !== 'competition') {
        setError('This event does not accept submissions');
        return;
      }

      // Check if submissions are still open
      const eventDate = new Date(eventData.event_date);
      const now = new Date();
      if (now >= eventDate) {
        setError('Submissions for this event are now closed');
        return;
      }

    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Failed to load submission page');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate(`/events/${id}`);
  };

  const handleCancel = () => {
    navigate(`/events/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-400"></div>
      </div>
    );
  }

  if (error || !event || !userRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-charcoal-300 mb-2">Cannot Submit</h2>
          <p className="text-charcoal-200 mb-6">
            {error || 'You are not eligible to submit to this event'}
          </p>
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center gap-2 text-sage-400 hover:text-sage-500 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to={`/events/${id}`}
            className="inline-flex items-center gap-2 text-sage-400 hover:text-sage-500 font-semibold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-charcoal-300 mb-2">
            Submit Your Entry
          </h1>
          <p className="text-lg text-charcoal-200">
            {event.title}
          </p>
        </motion.div>

        {/* Submission Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <SubmissionForm
            eventId={id!}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </motion.div>

        {/* Guidelines */}
        {event.rules_and_guidelines && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <h3 className="font-bold text-blue-900 mb-2">Submission Guidelines</h3>
            <p className="text-blue-700 text-sm whitespace-pre-line">
              {event.rules_and_guidelines}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

