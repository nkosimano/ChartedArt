/**
 * Event Registration Handler
 * POST /events/:id/register
 */

const { getSupabaseClient, insertRecord } = require('../utils/supabase');
const { created, notFound, badRequest, conflict, unauthorized, internalError, handleOptions, parseBody, getUserIdFromEvent } = require('../utils/response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) return unauthorized('Authentication required');
    
    const eventId = event.pathParameters?.id;
    if (!eventId) return badRequest('Event ID required');
    
    const body = event.body ? parseBody(event) : {};
    const { team_name, team_members, custom_fields } = body;
    
    const supabase = getSupabaseClient();
    
    // Verify event exists and is open
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (!eventData) return notFound('Event');
    
    // Check registration deadline
    if (eventData.registration_deadline && new Date(eventData.registration_deadline) < new Date()) {
      return badRequest('Registration deadline has passed');
    }
    
    // Check capacity
    if (eventData.capacity) {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('registration_status', 'confirmed');
      
      if (count >= eventData.capacity) {
        return badRequest('Event is full');
      }
    }
    
    // Check if already registered
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      return conflict('Already registered for this event');
    }
    
    // Create registration
    const registration = await insertRecord('event_registrations', {
      event_id: eventId,
      user_id: userId,
      registration_status: eventData.entry_fee > 0 ? 'pending' : 'confirmed',
      payment_status: eventData.entry_fee > 0 ? 'unpaid' : 'waived',
      payment_amount: eventData.entry_fee || 0,
      team_name: team_name || null,
      team_members: team_members || null,
      custom_fields: custom_fields || null,
      confirmed_at: eventData.entry_fee > 0 ? null : new Date().toISOString()
    });
    
    return created({
      registration,
      message: eventData.entry_fee > 0 
        ? 'Registration pending payment'
        : 'Successfully registered!'
    }, registration.id);
    
  } catch (error) {
    console.error('Error registering:', error);
    if (error.code === '23505') return conflict('Already registered');
    return internalError('Registration failed', error);
  }
};
