import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  DollarSign, 
  Clock,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import api from '@/lib/api/client';
import SubmissionGallery from '@/components/events/SubmissionGallery';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchEventDetails();
    checkUserAuth();
  }, [id]);

  const checkUserAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchEventDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch submissions if it's a competition
      if (eventData.event_type === 'competition') {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('competition_submissions')
          .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq('event_id', id)
          .eq('is_public', true)
          .eq('submission_status', 'approved')
          .order('total_score', { ascending: false });

        if (!submissionsError) {
          setSubmissions(submissionsData || []);
        }
      }

      // Check if user is registered
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: registrationData } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .single();

        setUserRegistration(registrationData);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/auth/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      setRegistering(true);
      setError(null);

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: id,
          user_id: user.id,
          registration_status: 'confirmed',
          registration_type: event.event_type === 'competition' ? 'competitor' : 'participant',
          payment_status: event.entry_fee > 0 ? 'unpaid' : 'waived',
          payment_amount: event.entry_fee || 0,
        })
        .select()
        .single();

      if (error) throw error;

      setUserRegistration(data);
      alert('Successfully registered for the event!');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-400"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-charcoal-300 mb-2">Event Not Found</h2>
          <p className="text-charcoal-200 mb-6">{error || 'The event you\'re looking for doesn\'t exist'}</p>
          <Link to="/events" className="text-sage-400 hover:text-sage-500 font-semibold">
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const registrationDeadline = new Date(event.registration_deadline);
  const now = new Date();
  const canRegister = now < registrationDeadline && !userRegistration;
  const canSubmit = userRegistration && event.event_type === 'competition' && now < eventDate;

  return (
    <div className="min-h-screen bg-cream-50 pb-12">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-sage-100 to-sage-200">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-32 h-32 text-sage-400 opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-sage-600 mb-4">
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {event.title}
              </h1>
              <p className="text-xl text-white/90">
                {event.description}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Registration Status */}
            {userRegistration && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4"
              >
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-1">You're Registered!</h3>
                  <p className="text-green-700 text-sm">
                    You're all set for this event. 
                    {canSubmit && ' You can now submit your artwork for the competition.'}
                  </p>
                </div>
                {canSubmit && (
                  <Link
                    to={`/events/${id}/submit`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Submit Entry
                  </Link>
                )}
              </motion.div>
            )}

            {/* Event Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-8"
            >
              <h2 className="text-2xl font-bold text-charcoal-300 mb-6">Event Details</h2>
              
              {event.rules_and_guidelines && (
                <div className="mb-6">
                  <h3 className="font-semibold text-charcoal-300 mb-2">Rules & Guidelines</h3>
                  <p className="text-charcoal-200 whitespace-pre-line">{event.rules_and_guidelines}</p>
                </div>
              )}

              {event.prizes && event.prizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-charcoal-300 mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Prizes
                  </h3>
                  <div className="space-y-2">
                    {event.prizes.map((prize: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-semibold text-charcoal-300">
                          {prize.place === 1 ? '🥇' : prize.place === 2 ? '🥈' : prize.place === 3 ? '🥉' : `#${prize.place}`} {prize.description}
                        </span>
                        <span className="text-sage-600 font-bold">R{prize.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Submissions Gallery */}
            {event.event_type === 'competition' && submissions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-md p-8"
              >
                <SubmissionGallery submissions={submissions} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-4"
            >
              <h3 className="text-xl font-bold text-charcoal-300 mb-4">Event Information</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-sage-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-charcoal-200">Event Date</div>
                    <div className="font-semibold text-charcoal-300">
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-sage-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-charcoal-200">Registration Deadline</div>
                    <div className="font-semibold text-charcoal-300">
                      {registrationDeadline.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-sage-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-charcoal-200">Location</div>
                      <div className="font-semibold text-charcoal-300">{event.location}</div>
                    </div>
                  </div>
                )}

                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-sage-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-charcoal-200">Capacity</div>
                      <div className="font-semibold text-charcoal-300">{event.capacity} participants</div>
                    </div>
                  </div>
                )}

                {event.entry_fee > 0 && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-sage-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-charcoal-200">Entry Fee</div>
                      <div className="font-semibold text-charcoal-300">R{event.entry_fee.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                {event.prize_pool && (
                  <div className="flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-charcoal-200">Total Prize Pool</div>
                      <div className="font-semibold text-green-600 text-lg">
                        R{event.prize_pool.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {canRegister && (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full bg-sage-400 text-white py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              )}

              {!user && (
                <Link
                  to="/auth/login"
                  state={{ from: `/events/${id}` }}
                  className="block w-full bg-sage-400 text-white py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors text-center"
                >
                  Sign In to Register
                </Link>
              )}

              {userRegistration && !canSubmit && (
                <div className="text-center text-sm text-charcoal-200">
                  Registration confirmed
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

