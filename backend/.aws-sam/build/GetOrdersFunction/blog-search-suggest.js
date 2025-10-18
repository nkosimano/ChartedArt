/**
 * Blog Search Autocomplete Handler
 * 
 * GET /blog/search/suggest
 * 
 * Returns autocomplete suggestions for blog search including:
 * - Post titles
 * - Categories
 * - Tags
 */

const { createSupabaseClient } = require('../utils/supabase');
const { successResponse, errorResponse } = require('../utils/response');

exports.handler = async (event) => {
  const supabase = createSupabaseClient();

  try {
    const { q, limit = '5' } = event.queryStringParameters || {};

    if (!q || q.trim().length < 2) {
      return errorResponse(400, 'Query must be at least 2 characters');
    }

    const query = q.trim();
    const limitNum = Math.min(parseInt(limit, 10), 10);

    // Search post titles (case-insensitive)
    const { data: postSuggestions } = await supabase
      .from('blog_posts')
      .select('title, slug')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .ilike('title', `%${query}%`)
      .order('view_count', { ascending: false })
      .limit(limitNum);

    // Get unique categories that match
    const { data: categorySuggestions } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published')
      .ilike('category', `%${query}%`)
      .limit(limitNum);

    const uniqueCategories = [...new Set(
      (categorySuggestions || []).map(item => item.category)
    )];

    // Get tags that match (searching in the tags array)
    const { data: tagData } = await supabase
      .from('blog_posts')
      .select('tags')
      .eq('status', 'published')
      .not('tags', 'is', null);

    const allTags = new Set();
    (tagData || []).forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            allTags.add(tag);
          }
        });
      }
    });

    const tagSuggestions = Array.from(allTags).slice(0, limitNum);

    return successResponse({
      posts: (postSuggestions || []).map(p => ({
        type: 'post',
        title: p.title,
        slug: p.slug,
      })),
      categories: uniqueCategories.map(cat => ({
        type: 'category',
        name: cat,
      })),
      tags: tagSuggestions.map(tag => ({
        type: 'tag',
        name: tag,
      })),
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse(500, 'Internal server error');
  }
};
