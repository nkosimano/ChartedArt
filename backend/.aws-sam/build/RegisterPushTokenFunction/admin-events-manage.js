/**
 * Admin Events Management Handler
 * 
 * POST /admin/events (create event)
 * PUT /admin/events/:id (update event)
 * PUT /admin/events/:eventId/submissions/:submissionId/approve (approve submission)
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
    const path = event.path || '';
    const { id, eventId, submissionId } = event.pathParameters || {};

    // APPROVE SUBMISSION
    if (path.includes('/submissions/') && method === 'PUT' && submissionId) {
      const body = JSON.parse(event.body || '{}');
      const { approved, rejection_reason } = body;

      const updateData = {
        status: approved ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      };

      if (!approved && rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data: submission, error } = await supabase
        .from('event_submissions')
        .update(updateData)
        .eq('id', submissionId)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission:', error);
        return errorResponse(500, 'Failed to update submission');
      }

      return successResponse({
        submission,
        message: approved ? 'Submission approved' : 'Submission rejected',
      });
    }

    // CREATE EVENT
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const {
        title,
        slug,
        description,
        event_type,
        banner_image,
        start_date,
        end_date,
        submission_deadline,
        max_participants,
        entry_fee,
        prize_details,
        rules,
        judging_criteria,
        movement_id,
        status = 'draft',
      } = body;

      // Validation
      if (!title || title.trim().length < 3) {
        return errorResponse(400, 'Title must be at least 3 characters');
      }

      if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        return errorResponse(400, 'Slug must be lowercase alphanumeric with hyphens');
      }

      if (!event_type || !['competition', 'workshop', 'fundraiser', 'exhibition'].includes(event_type)) {
        return errorResponse(400, 'Invalid event type');
      }

      if (!start_date || !end_date) {
        return errorResponse(400, 'Start and end dates are required');
      }

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        return errorResponse(400, 'An event with this slug already exists');
      }

      // Create event
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert([{
          title: title.trim(),
          slug,
          description: description?.trim(),
          event_type,
          banner_image,
          start_date,
          end_date,
          submission_deadline,
          max_participants,
          entry_fee: entry_fee || 0,
          prize_details,
          rules,
          judging_criteria,
          movement_id,
          status,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return errorResponse(500, 'Failed to create event');
      }

      return successResponse({
        event: newEvent,
        message: 'Event created successfully',
      }, 201);
    }

    // UPDATE EVENT
    if (method === 'PUT' && id) {
      const body = JSON.parse(event.body || '{}');
      const {
        title,
        description,
        event_type,
        banner_image,
        start_date,
        end_date,
        submission_deadline,
        max_participants,
        entry_fee,
        prize_details,
        rules,
        judging_criteria,
        movement_id,
        status,
      } = body;

      const updateData = {};

      if (title) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim();
      if (event_type) updateData.event_type = event_type;
      if (banner_image !== undefined) updateData.banner_image = banner_image;
      if (start_date) updateData.start_date = start_date;
      if (end_date) updateData.end_date = end_date;
      if (submission_deadline !== undefined) updateData.submission_deadline = submission_deadline;
      if (max_participants !== undefined) updateData.max_participants = max_participants;
      if (entry_fee !== undefined) updateData.entry_fee = entry_fee;
      if (prize_details !== undefined) updateData.prize_details = prize_details;
      if (rules !== undefined) updateData.rules = rules;
      if (judging_criteria !== undefined) updateData.judging_criteria = judging_criteria;
      if (movement_id !== undefined) updateData.movement_id = movement_id;
      if (status) updateData.status = status;

      updateData.updated_at = new Date().toISOString();

      const { data: updatedEvent, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(404, 'Event not found');
        }
        console.error('Error updating event:', error);
        return errorResponse(500, 'Failed to update event');
      }

      return successResponse({
        event: updatedEvent,
        message: 'Event updated successfully',
      });
    }

    return errorResponse(405, 'Method not allowed');

  } catch (err) {
    console.error('Unexpected error:', err);
    return errorResponse(500, 'Internal server error');
  }
};
