/**
 * Get Event Details Handler
 * GET /events/:id
 */

const { getSupabaseClient } = require('../utils/supabase');
const { success, notFound, internalError, handleOptions, getUserIdFromEvent } = require('../utils/response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  
  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) return notFound('Event');
    
    const supabase = getSupabaseClient();
    const userId = getUserIdFromEvent(event);
    
    const { data: eventData, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:organizer_id (full_name, avatar_url)
      `)
      .eq('id', eventId)
      .eq('is_approved', true)
      .single();
    
    if (error || !eventData) return notFound('Event');
    
    // Get registration count
    const { count: registrationCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('registration_status', 'confirmed');
    
    // Check if user is registered
    let userRegistration = null;
    if (userId) {
      const { data: reg } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
      userRegistration = reg;
    }
    
    // Get submission count for competitions
    let submissionCount = 0;
    if (eventData.event_type === 'competition') {
      const { count } = await supabase
        .from('competition_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('submission_status', 'approved');
      submissionCount = count || 0;
    }
    
    const spotsLeft = eventData.capacity ? eventData.capacity - (registrationCount || 0) : null;
    
    return success({
      ...eventData,
      registration_count: registrationCount || 0,
      submission_count: submissionCount,
      spots_left: spotsLeft,
      is_full: eventData.capacity && (registrationCount || 0) >= eventData.capacity,
      is_registration_open: eventData.registration_deadline 
        ? new Date(eventData.registration_deadline) > new Date()
        : true,
      user_registration: userRegistration
    });
    
  } catch (error) {
    console.error('Error fetching event:', error);
    return internalError('Failed to fetch event', error);
  }
};
