/**
 * Get Movement Details Handler
 * GET /movements/:id
 * Returns detailed movement information with participants and updates
 */

const { getSupabaseClient } = require('../utils/supabase');
const { success, notFound, internalError, handleOptions } = require('../utils/response');

exports.handler = async (event) => {
  console.log('Get movement request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    const movementId = event.pathParameters?.id;
    
    if (!movementId) {
      return notFound('Movement');
    }
    
    const supabase = getSupabaseClient();
    
    // Get movement with all related data
    const { data: movement, error } = await supabase
      .from('movements')
      .select(`
        *,
        movement_metrics (
          total_raised,
          total_donations,
          average_donation,
          largest_donation,
          participant_count,
          active_participants,
          linked_products_count,
          linked_events_count,
          engagement_score,
          last_donation_at
        ),
        movement_products (
          id,
          product:products (
            id,
            size,
            frame_type,
            base_price
          ),
          donation_percentage,
          is_featured
        ),
        movement_events (
          id,
          event:events (
            id,
            title,
            description,
            event_date,
            location
          ),
          is_primary_event
        ),
        movement_updates (
          id,
          title,
          excerpt,
          featured_image,
          published_at,
          views_count
        )
      `)
      .eq('id', movementId)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .is('archived_at', null)
      .single();
    
    if (error || !movement) {
      console.error('Movement not found:', error);
      return notFound('Movement');
    }
    
    // Get recent participants (public profiles only)
    const { data: participants } = await supabase
      .from('movement_participants')
      .select(`
        id,
        joined_at,
        role,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('movement_id', movementId)
      .eq('public_profile', true)
      .order('joined_at', { ascending: false })
      .limit(20);
    
    // Get top donors (anonymous excluded)
    const { data: topDonors } = await supabase
      .from('movement_donations')
      .select(`
        amount,
        donor_name,
        completed_at,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('movement_id', movementId)
      .eq('status', 'completed')
      .eq('donor_anonymous', false)
      .order('amount', { ascending: false })
      .limit(10);
    
    // Calculate progress
    const metrics = movement.movement_metrics || {};
    const progress = movement.goal_amount > 0 
      ? Math.min(100, (metrics.total_raised / movement.goal_amount) * 100)
      : 0;
    
    const participantProgress = movement.goal_participants > 0
      ? Math.min(100, (metrics.participant_count / movement.goal_participants) * 100)
      : 0;
    
    // Format response
    const response = {
      id: movement.id,
      name: movement.name,
      slug: movement.slug,
      description: movement.description,
      tagline: movement.tagline,
      cover_image: movement.cover_image,
      logo_image: movement.logo_image,
      hero_video: movement.hero_video,
      status: movement.status,
      goal_amount: movement.goal_amount,
      goal_participants: movement.goal_participants,
      goal_description: movement.goal_description,
      start_date: movement.start_date,
      end_date: movement.end_date,
      beneficiary_organization: movement.beneficiary_organization,
      beneficiary_contact: movement.beneficiary_contact,
      tags: movement.tags,
      featured: movement.featured,
      created_at: movement.created_at,
      metrics: {
        total_raised: metrics.total_raised || 0,
        total_donations: metrics.total_donations || 0,
        average_donation: metrics.average_donation || 0,
        largest_donation: metrics.largest_donation || 0,
        participant_count: metrics.participant_count || 0,
        active_participants: metrics.active_participants || 0,
        linked_products_count: metrics.linked_products_count || 0,
        linked_events_count: metrics.linked_events_count || 0,
        engagement_score: metrics.engagement_score || 0,
        last_donation_at: metrics.last_donation_at,
        progress: Math.round(progress * 10) / 10,
        participant_progress: Math.round(participantProgress * 10) / 10
      },
      products: movement.movement_products?.map(mp => ({
        id: mp.id,
        product_id: mp.product?.id,
        donation_percentage: mp.donation_percentage,
        is_featured: mp.is_featured,
        ...mp.product
      })) || [],
      events: movement.movement_events?.map(me => ({
        id: me.id,
        event_id: me.event?.id,
        is_primary_event: me.is_primary_event,
        ...me.event
      })) || [],
      recent_participants: participants?.map(p => ({
        id: p.id,
        joined_at: p.joined_at,
        role: p.role,
        user: p.profiles
      })) || [],
      top_donors: topDonors?.map(d => ({
        amount: d.amount,
        name: d.donor_name || d.profiles?.full_name,
        avatar: d.profiles?.avatar_url,
        completed_at: d.completed_at
      })) || [],
      updates: movement.movement_updates
        ?.filter(u => u.published_at)
        ?.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        ?.slice(0, 5) || []
    };
    
    return success(response);
    
  } catch (error) {
    console.error('Error fetching movement:', error);
    return internalError('Failed to fetch movement details', error);
  }
};
