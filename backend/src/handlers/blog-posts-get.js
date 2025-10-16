/**
 * Blog Post Detail Handler
 * 
 * GET /blog/posts/:slug
 * 
 * Returns full content of a blog post and increments view count.
 */

const { createSupabaseClient } = require('../utils/supabase');
const { successResponse, errorResponse } = require('../utils/response');

exports.handler = async (event) => {
  const supabase = createSupabaseClient();

  try {
    const { slug } = event.pathParameters || {};

    if (!slug) {
      return errorResponse(400, 'Missing post slug');
    }

    // Fetch post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        featured_image,
        category,
        tags,
        author_id,
        author_name,
        author_avatar,
        author_bio,
        published_at,
        view_count,
        created_at,
        updated_at,
        seo_title,
        seo_description
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse(404, 'Blog post not found');
      }
      console.error('Error fetching blog post:', error);
      return errorResponse(500, 'Failed to fetch blog post');
    }

    // Increment view count (fire and forget)
    supabase
      .from('blog_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', post.id)
      .then(() => {})
      .catch((err) => console.error('Failed to increment view count:', err));

    // Fetch related posts (same category, different post)
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image, published_at')
      .eq('category', post.category)
      .eq('status', 'published')
      .neq('id', post.id)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(3);

    return successResponse({
      post: {
        ...post,
        view_count: post.view_count + 1, // Return incremented count immediately
      },
      relatedPosts: relatedPosts || [],
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse(500, 'Internal server error');
  }
};
