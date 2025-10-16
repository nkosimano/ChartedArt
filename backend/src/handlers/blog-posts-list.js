/**
 * Blog Posts List Handler
 * 
 * GET /blog/posts
 * 
 * Public endpoint for browsing blog posts with:
 * - Pagination
 * - Category filtering
 * - Tag filtering (movements, events, artists)
 * - Full-text search
 * - Published posts only (unless admin)
 */

const { createSupabaseClient } = require('../utils/supabase');
const { successResponse, errorResponse } = require('../utils/response');

exports.handler = async (event) => {
  const supabase = createSupabaseClient();

  try {
    const {
      page = '1',
      limit = '12',
      category,
      tag,
      search,
      status = 'published',
    } = event.queryStringParameters || {};

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Validate pagination
    if (pageNum < 1 || limitNum < 1 || limitNum > 50) {
      return errorResponse(400, 'Invalid pagination parameters');
    }

    // Build query
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image,
        category,
        tags,
        author_id,
        author_name,
        author_avatar,
        published_at,
        view_count,
        created_at
      `, { count: 'exact' });

    // Filter by status (public only sees published)
    if (status === 'published') {
      query = query
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString());
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category);
    }

    // Filter by tag (case-insensitive search in array)
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Full-text search
    if (search && search.trim()) {
      query = query.textSearch('search_vector', search.trim(), {
        type: 'websearch',
        config: 'english',
      });
    }

    // Order by published date (newest first)
    query = query
      .order('published_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return errorResponse(500, 'Failed to fetch blog posts');
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    return successResponse({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse(500, 'Internal server error');
  }
};
