/**
 * Judge Scoring Handler
 * POST /admin/submissions/:id/score
 * Allows judges to score competition submissions
 */

const { getSupabaseClient, insertRecord } = require('../utils/supabase');
const { success, notFound, badRequest, forbidden, conflict, unauthorized, internalError, handleOptions, parseBody, validateRequiredFields, getUserIdFromEvent } = require('../utils/response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  
  try {
    const userId = getUserIdFromEvent(event);
    if (!userId) return unauthorized('Authentication required');
    
    const submissionId = event.pathParameters?.id;
    if (!submissionId) return badRequest('Submission ID required');
    
    const body = parseBody(event);
    const validation = validateRequiredFields(body, ['criteria_scores']);
    if (!validation.valid) return badRequest(validation.message);
    
    const { criteria_scores, comments, private_notes } = body;
    
    // Validate criteria_scores is an object
    if (typeof criteria_scores !== 'object' || Array.isArray(criteria_scores)) {
      return badRequest('criteria_scores must be an object');
    }
    
    const supabase = getSupabaseClient();
    
    // Get submission details
    const { data: submission } = await supabase
      .from('competition_submissions')
      .select('event_id, submission_status')
      .eq('id', submissionId)
      .single();
    
    if (!submission) return notFound('Submission');
    
    if (submission.submission_status !== 'approved') {
      return badRequest('Can only score approved submissions');
    }
    
    // Verify user is a judge for this event
    const { data: judge } = await supabase
      .from('competition_judges')
      .select('*')
      .eq('event_id', submission.event_id)
      .eq('judge_id', userId)
      .eq('is_active', true)
      .single();
    
    if (!judge) {
      return forbidden('You are not authorized to judge this event');
    }
    
    // Check if already scored
    const { data: existing } = await supabase
      .from('judge_scores')
      .select('id, scoring_status')
      .eq('submission_id', submissionId)
      .eq('judge_id', userId)
      .single();
    
    if (existing && existing.scoring_status === 'submitted') {
      return conflict('You have already scored this submission');
    }
    
    // Calculate total score
    const scores = Object.values(criteria_scores);
    if (scores.length === 0) {
      return badRequest('At least one criteria score is required');
    }
    
    // Validate all scores are numbers between 0 and 10
    for (const score of scores) {
      if (typeof score !== 'number' || score < 0 || score > 10) {
        return badRequest('All scores must be numbers between 0 and 10');
      }
    }
    
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    
    // Create or update score
    if (existing) {
      // Update existing draft
      await supabase
        .from('judge_scores')
        .update({
          criteria_scores,
          total_score: totalScore,
          comments: comments || null,
          private_notes: private_notes || null,
          scoring_status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new score
      await insertRecord('judge_scores', {
        submission_id: submissionId,
        judge_id: userId,
        criteria_scores,
        total_score: totalScore,
        comments: comments || null,
        private_notes: private_notes || null,
        scoring_status: 'submitted',
        submitted_at: new Date().toISOString()
      });
    }
    
    // Get updated submission with new average
    const { data: updatedSubmission } = await supabase
      .from('competition_submissions')
      .select('average_score, total_score, judges_count')
      .eq('id', submissionId)
      .single();
    
    return success({
      scored: true,
      message: 'Score submitted successfully',
      submission: {
        id: submissionId,
        your_score: totalScore,
        average_score: updatedSubmission?.average_score,
        total_score: updatedSubmission?.total_score,
        judges_count: updatedSubmission?.judges_count
      }
    });
    
  } catch (error) {
    console.error('Error submitting score:', error);
    return internalError('Failed to submit score', error);
  }
};
