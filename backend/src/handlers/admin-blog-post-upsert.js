/**
 * Admin Blog Post Create/Update Handler
 * 
 * POST /admin/blog/posts (create)
 * PUT /admin/blog/posts/:id (update)
 * 
 * Requires authentication and admin role.
 */

const { createSupabaseClient, authenticateUser } = require('../utils/supabase');
const { successResponse, errorResponse } = require('../utils/response');

// Generate URL-friendly slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

exports.handler = async (event) => {
  const supabase = createSupabaseClient();

  try {
    // Authenticate and check admin role
    const user = await authenticateUser(event, supabase);
    if (!user) {
      return errorResponse(401, 'Unauthorized');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return errorResponse(403, 'Admin access required');
    }

    const isUpdate = event.httpMethod === 'PUT' || event.pathParameters?.id;
    const postId = event.pathParameters?.id;
    const body = JSON.parse(event.body || '{}');

    const {
      title,
      content,
      excerpt,
      featured_image,
      category,
      tags,
      status = 'draft',
      seo_title,
      seo_description,
      published_at,
    } = body;

    // Validation
    if (!title || title.trim().length < 3) {
      return errorResponse(400, 'Title must be at least 3 characters');
    }

    if (!content || content.trim().length < 50) {
      return errorResponse(400, 'Content must be at least 50 characters');
    }

    if (!category) {
      return errorResponse(400, 'Category is required');
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      return errorResponse(400, 'Invalid status');
    }

    // Generate slug from title
    const slug = generateSlug(title);

    // Check for slug uniqueness (except for current post when updating)
    let slugQuery = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug);

    if (isUpdate && postId) {
      slugQuery = slugQuery.neq('id', postId);
    }

    const { data: existingPost } = await slugQuery.maybeSingle();

    if (existingPost) {
      return errorResponse(400, `A post with slug "${slug}" already exists`);
    }

    // Prepare post data
    const postData = {
      title: title.trim(),
      slug,
      content: content.trim(),
      excerpt: excerpt?.trim() || content.trim().substring(0, 200) + '...',
      featured_image,
      category,
      tags: Array.isArray(tags) ? tags : [],
      status,
      seo_title: seo_title || title,
      seo_description: seo_description || excerpt,
      author_id: user.id,
      author_name: user.user_metadata?.full_name || 'Admin',
      author_avatar: user.user_metadata?.avatar_url,
      author_bio: user.user_metadata?.bio,
    };

    // Set published_at timestamp
    if (status === 'published' && !published_at) {
      postData.published_at = new Date().toISOString();
    } else if (published_at) {
      postData.published_at = published_at;
    }

    let result;

    if (isUpdate && postId) {
      // Update existing post
      postData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('Error updating blog post:', error);
        return errorResponse(500, 'Failed to update blog post');
      }

      result = data;

    } else {
      // Create new post
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post:', error);
        return errorResponse(500, 'Failed to create blog post');
      }

      result = data;
    }

    return successResponse({
      post: result,
      message: isUpdate ? 'Blog post updated successfully' : 'Blog post created successfully',
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse(500, 'Internal server error');
  }
};
