/**
 * List Events Handler
 * GET /events
 * Returns events with filtering, pagination, and registration counts
 */

const { getSupabaseClient } = require('../utils/supabase');
const { success, internalError, handleOptions, paginated } = require('../utils/response');

exports.handler = async (event) => {
  console.log('List events request:', JSON.stringify(event, null, 2));
  
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const supabase = getSupabaseClient();
    const params = event.queryStringParameters || {};
    
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 12;
    const event_type = params.type;
    const status = params.status || 'published';
    const upcoming = params.upcoming === 'true';
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build query
    let query = supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        event_date,
        registration_deadline,
        capacity,
        entry_fee,
        prize_pool,
        cover_image,
        event_type,
        status,
        visibility,
        tags,
        prizes,
        created_at
      `, { count: 'exact' })
      .eq('is_approved', true)
      .eq('status', status);
    
    if (event_type) {
      query = query.eq('event_type', event_type);
    }
    
    if (upcoming) {
      query = query.gte('event_date', new Date().toISOString());
    }
    
    query = query
      .order('event_date', { ascending: true })
      .range(from, to);
    
    const { data: events, error, count } = await query;
    
    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
    
    // Get registration counts for each event
    const eventIds = events?.map(e => e.id) || [];
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('event_id, registration_status')
      .in('event_id', eventIds)
      .eq('registration_status', 'confirmed');
    
    // Count registrations per event
    const registrationCounts = registrations?.reduce((acc, reg) => {
      acc[reg.event_id] = (acc[reg.event_id] || 0) + 1;
      return acc;
    }, {}) || {};
    
    // Enrich events with registration data
    const enrichedEvents = events?.map(evt => {
      const registrationCount = registrationCounts[evt.id] || 0;
      const spotsLeft = evt.capacity ? evt.capacity - registrationCount : null;
      const isFull = evt.capacity && registrationCount >= evt.capacity;
      
      return {
        ...evt,
        registration_count: registrationCount,
        spots_left: spotsLeft,
        is_full: isFull,
        is_registration_open: evt.registration_deadline 
          ? new Date(evt.registration_deadline) > new Date()
          : true
      };
    }) || [];
    
    return paginated(enrichedEvents, { page, limit, total: count || 0 });
    
  } catch (error) {
    console.error('Error listing events:', error);
    return internalError('Failed to fetch events', error);
  }
};
