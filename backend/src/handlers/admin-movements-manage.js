/**
 * Admin Movements Management Handler
 * 
 * POST /admin/movements (create)
 * PUT /admin/movements/:id (update)
 * DELETE /admin/movements/:id (soft delete/archive)
 * 
 * Requires authentication and admin role.
 */

const { createSupabaseClient, authenticateUser } = require('../utils/supabase');
const { successResponse, errorResponse } = require('../utils/response');

exports.handler = async (event) => {
  const supabase = createSupabaseClient();

  try {
    // Authenticate and check admin role
    const user = await authenticateUser(event, supabase);
    if (!user) {
      return errorResponse(401, 'Unauthorized');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return errorResponse(403, 'Admin access required');
    }

    const method = event.httpMethod;
    const movementId = event.pathParameters?.id;

    // CREATE
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        title,
        slug,
        description,
        banner_image,
        cause_description,
        impact_metrics,
        goal_amount,
        start_date,
        end_date,
        status = 'draft',
      } = body;

      // Validation
      if (!title || title.trim().length < 3) {
        return errorResponse(400, 'Title must be at least 3 characters');
      }

      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        return errorResponse(400, 'Slug must be lowercase alphanumeric with hyphens');
      }

      if (!description || description.length < 20) {
        return errorResponse(400, 'Description must be at least 20 characters');
      }

      if (goal_amount && (isNaN(goal_amount) || goal_amount < 0)) {
        return errorResponse(400, 'Goal amount must be a positive number');
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('movements')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        return errorResponse(400, 'A movement with this slug already exists');
      }

      // Create movement
      const { data: movement, error } = await supabase
        .from('movements')
        .insert([{
          title: title.trim(),
          slug,
          description: description.trim(),
          banner_image,
          cause_description: cause_description?.trim(),
          impact_metrics,
          goal_amount,
          start_date,
          end_date,
          status,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating movement:', error);
        return errorResponse(500, 'Failed to create movement');
      }

      return successResponse({
        movement,
        message: 'Movement created successfully',
      }, 201);
    }

    // UPDATE
    if (method === 'PUT' && movementId) {
      const body = JSON.parse(event.body || '{}');
      const {
        title,
        description,
        banner_image,
        cause_description,
        impact_metrics,
        goal_amount,
        start_date,
        end_date,
        status,
      } = body;

      const updateData = {};

      if (title) updateData.title = title.trim();
      if (description) updateData.description = description.trim();
      if (banner_image !== undefined) updateData.banner_image = banner_image;
      if (cause_description !== undefined) updateData.cause_description = cause_description?.trim();
      if (impact_metrics !== undefined) updateData.impact_metrics = impact_metrics;
      if (goal_amount !== undefined) updateData.goal_amount = goal_amount;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (status) updateData.status = status;

      updateData.updated_at = new Date().toISOString();

      const { data: movement, error } = await supabase
        .from('movements')
        .update(updateData)
        .eq('id', movementId)
        .is('archived_at', null)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(404, 'Movement not found');
        }
        console.error('Error updating movement:', error);
        return errorResponse(500, 'Failed to update movement');
      }

      return successResponse({
        movement,
        message: 'Movement updated successfully',
      });
    }

    // DELETE (Soft Delete)
    if (method === 'DELETE' && movementId) {
      const { data: movement, error } = await supabase
        .from('movements')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', movementId)
        .is('archived_at', null)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(404, 'Movement not found or already archived');
        }
        console.error('Error archiving movement:', error);
        return errorResponse(500, 'Failed to archive movement');
      }

      return successResponse({
        movement,
        message: 'Movement archived successfully',
      });
    }

    return errorResponse(405, 'Method not allowed');

  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse(500, 'Internal server error');
  }
};
