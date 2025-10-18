/**
 * List Event Submissions Handler
 * GET /events/:id/submissions
 * Returns submissions with optional blind judging mode
 */

const { getSupabaseClient } = require('../utils/supabase');
const { success, notFound, internalError, handleOptions, paginated, getUserIdFromEvent } = require('../utils/response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  
  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) return notFound('Event');
    
    const params = event.queryStringParameters || {};
    const blindJudging = params.blind === 'true';
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 20;
    const sortBy = params.sort || 'rank'; // rank, submitted_at, score
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const supabase = getSupabaseClient();
    const userId = getUserIdFromEvent(event);
    
    // Verify event exists
    const { data: eventData } = await supabase
      .from('events')
      .select('id, title, event_type')
      .eq('id', eventId)
      .single();
    
    if (!eventData) return notFound('Event');
    
    // Build query based on blind judging mode
    let selectFields;
    if (blindJudging) {
      // Blind judging: hide artist info
      selectFields = `
        id,
        title,
        description,
        submission_url,
        submission_thumbnail,
        submitted_at,
        total_score,
        average_score,
        rank,
        award_place
      `;
    } else {
      // Normal mode: show full info
      selectFields = `
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url
        )
      `;
    }
    
    // Determine sort order
    let orderColumn = 'rank';
    let ascending = true;
    
    if (sortBy === 'score') {
      orderColumn = 'average_score';
      ascending = false;
    } else if (sortBy === 'submitted_at') {
      orderColumn = 'submitted_at';
      ascending = false;
    }
    
    const { data: submissions, error, count } = await supabase
      .from('competition_submissions')
      .select(selectFields, { count: 'exact' })
      .eq('event_id', eventId)
      .eq('submission_status', 'approved')
      .order(orderColumn, { ascending, nullsFirst: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
    
    // Check if current user is a judge for this event
    let isJudge = false;
    if (userId) {
      const { data: judgeData } = await supabase
        .from('competition_judges')
        .select('id')
        .eq('event_id', eventId)
        .eq('judge_id', userId)
        .eq('is_active', true)
        .single();
      
      isJudge = !!judgeData;
    }
    
    // If user is a judge, include their scores
    let judgeScores = {};
    if (isJudge && submissions) {
      const submissionIds = submissions.map(s => s.id);
      const { data: scores } = await supabase
        .from('judge_scores')
        .select('submission_id, total_score, scoring_status')
        .eq('judge_id', userId)
        .in('submission_id', submissionIds);
      
      if (scores) {
        judgeScores = scores.reduce((acc, score) => {
          acc[score.submission_id] = score;
          return acc;
        }, {});
      }
    }
    
    // Enrich submissions
    const enrichedSubmissions = submissions?.map(sub => {
      const result = {
        ...sub,
        is_judged_by_me: isJudge && !!judgeScores[sub.id],
        my_score: judgeScores[sub.id]?.total_score || null,
        my_scoring_status: judgeScores[sub.id]?.scoring_status || null
      };
      
      // Add winner badge for top 3
      if (sub.award_place) {
        const badges = { 1: '🥇', 2: '🥈', 3: '🥉' };
        result.winner_badge = badges[sub.award_place] || '🏆';
      }
      
      return result;
    }) || [];
    
    return paginated(enrichedSubmissions, {
      page,
      limit,
      total: count || 0
    });
    
  } catch (error) {
    console.error('Error listing submissions:', error);
    return internalError('Failed to fetch submissions', error);
  }
};
