/**
 * List Movements Handler
 * GET /movements
 * Returns active movements with metrics and filtering
 */

const { queryTable } = require('../utils/supabase');
const { success, internalError, handleOptions, paginated } = require('../utils/response');
const { cacheWrapper } = require('../utils/redis');

exports.handler = async (event) => {
  console.log('List movements request:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return handleOptions();
  }
  
  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 12;
    const status = params.status || 'active';
    const featured = params.featured === 'true';
    const tag = params.tag;
    
    // Generate cache key
    const cacheKey = `movements:list:${status}:${featured}:${tag || 'all'}:${page}:${limit}`;
    
    // Use cache wrapper with 5 minute TTL
    const result = await cacheWrapper(cacheKey, async () => {
      return await fetchMovements(page, limit, status, featured, tag);
    }, 300); // 5 minutes
    
    return result;
    
  } catch (error) {
    console.error('Error listing movements:', error);
    return internalError('Failed to fetch movements', error);
  }
};

async function fetchMovements(page, limit, status, featured, tag) {
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Build filters
    const filters = {
      status,
      visibility: 'public',
      archived_at: { operator: 'is', value: null }
    };
    
    if (featured) {
      filters.featured = true;
    }
    
    // Query movements with metrics
    const { data: movements, count } = await queryTable('movements', {
      select: `
        *,
        movement_metrics (
          total_raised,
          total_donations,
          participant_count,
          engagement_score,
          last_donation_at
        )
      `,
      filters,
      order: featured ? { column: 'featured_order', ascending: true } : { column: 'created_at', ascending: false },
      range: { from, to }
    });
    
    // Filter by tag if provided (post-query since it's an array column)
    let filteredMovements = movements;
    if (tag && movements) {
      filteredMovements = movements.filter(m => m.tags && m.tags.includes(tag));
    }
    
    // Calculate progress for each movement
    const enrichedMovements = filteredMovements.map(movement => {
      const metrics = movement.movement_metrics || {};
      const progress = movement.goal_amount > 0 
        ? Math.min(100, (metrics.total_raised / movement.goal_amount) * 100)
        : 0;
      
      return {
        id: movement.id,
        name: movement.name,
        slug: movement.slug,
        description: movement.description,
        tagline: movement.tagline,
        cover_image: movement.cover_image,
        logo_image: movement.logo_image,
        status: movement.status,
        goal_amount: movement.goal_amount,
        goal_participants: movement.goal_participants,
        start_date: movement.start_date,
        end_date: movement.end_date,
        tags: movement.tags,
        featured: movement.featured,
        created_at: movement.created_at,
        metrics: {
          total_raised: metrics.total_raised || 0,
          total_donations: metrics.total_donations || 0,
          participant_count: metrics.participant_count || 0,
          engagement_score: metrics.engagement_score || 0,
          progress: Math.round(progress * 10) / 10 // Round to 1 decimal
        }
      };
    });
    
    return paginated(enrichedMovements, {
      page,
      limit,
      total: tag ? filteredMovements.length : (count || 0)
    });
}
