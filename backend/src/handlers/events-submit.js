/**
 * Confirm Event Submission Handler
 * POST /events/:id/submissions
 * Creates submission record after successful S3 upload
 */

const { getSupabaseClient, insertRecord } = require('../utils/supabase');
const { created, notFound, badRequest, conflict, unauthorized, internalError, handleOptions, parseBody, validateRequiredFields, getUserIdFromEvent } = require('../utils/response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) return unauthorized('Authentication required');
    
    const eventId = event.pathParameters?.id;
    if (!eventId) return badRequest('Event ID required');
    
    const body = parseBody(event);
    const validation = validateRequiredFields(body, ['upload_token', 'title']);
    if (!validation.valid) return badRequest(validation.message);
    
    const { upload_token, title, description } = body;
    
    const supabase = getSupabaseClient();
    
    // Verify upload request
    const { data: uploadReq, error: uploadError } = await supabase
      .from('submission_upload_requests')
      .select('*')
      .eq('upload_token', upload_token)
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('upload_status', 'pending')
      .single();
    
    if (uploadError || !uploadReq) {
      return badRequest('Invalid or expired upload token');
    }
    
    // Check if upload token is expired
    if (new Date(uploadReq.expires_at) < new Date()) {
      return badRequest('Upload token has expired');
    }
    
    // Get registration
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    // Check for existing submission
    const { data: existing } = await supabase
      .from('competition_submissions')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      return conflict('You have already submitted to this event');
    }
    
    // Create submission record
    const submission = await insertRecord('competition_submissions', {
      event_id: eventId,
      user_id: userId,
      registration_id: registration?.id,
      title,
      description: description || null,
      submission_url: uploadReq.s3_key,
      file_type: uploadReq.file_type,
      file_size: uploadReq.file_size,
      submission_status: 'pending', // Awaiting approval
      is_public: true
    });
    
    // Update upload request status
    await supabase
      .from('submission_upload_requests')
      .update({ 
        upload_status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', uploadReq.id);
    
    // Get enriched submission
    const { data: enrichedSubmission } = await supabase
      .from('competition_submissions')
      .select(`
        *,
        profiles:user_id (full_name, avatar_url),
        events:event_id (title, event_type)
      `)
      .eq('id', submission.id)
      .single();
    
    return created({
      submission: enrichedSubmission,
      message: 'Submission successful! It will be reviewed before appearing in the gallery.'
    }, submission.id);
    
  } catch (error) {
    console.error('Error creating submission:', error);
    if (error.code === '23505') {
      return conflict('You have already submitted to this event');
    }
    return internalError('Failed to create submission', error);
  }
};
