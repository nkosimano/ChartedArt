/**
 * Calculate Engagement Metrics Background Job
 * 
 * Runs every 10 minutes via EventBridge
 * 
 * Calculates complex engagement scores for movements based on:
 * - Participant count
 * - Donation frequency
 * - Social shares
 * - Comments/updates
 * - Puzzle piece sales
 * - Event participation
 */

const { createSupabaseClient } = require('../utils/supabase');

exports.handler = async () => {
  const supabase = createSupabaseClient();

  try {
    console.log('Starting engagement score calculation...');

    // Fetch all active movements
    const { data: movements, error: movementError } = await supabase
      .from('movements')
      .select('id, slug')
      .eq('status', 'active')
      .is('archived_at', null);

    if (movementError) {
      console.error('Error fetching movements:', movementError);
      return { statusCode: 500, body: 'Failed to fetch movements' };
    }

    console.log(`Found ${movements.length} active movements to process`);

    // Process each movement
    for (const movement of movements) {
      try {
        // Get metrics
        const { data: metrics } = await supabase
          .from('movement_metrics')
          .select('*')
          .eq('movement_id', movement.id)
          .single();

        if (!metrics) continue;

        // Calculate engagement score components
        
        // 1. Participant growth (weight: 25%)
        const participantScore = Math.min(metrics.participant_count / 100, 1) * 25;

        // 2. Donation activity (weight: 30%)
        const { data: recentDonations } = await supabase
          .from('donations')
          .select('id')
          .eq('movement_id', movement.id)
          .eq('status', 'completed')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const donationScore = Math.min((recentDonations?.length || 0) / 50, 1) * 30;

        // 3. Puzzle piece activity (weight: 20%)
        const { data: recentPuzzleSales } = await supabase
          .from('puzzle_pieces')
          .select('id')
          .eq('movement_id', movement.id)
          .eq('status', 'sold')
          .gte('purchased_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const puzzleScore = Math.min((recentPuzzleSales?.length || 0) / 20, 1) * 20;

        // 4. Event participation (weight: 15%)
        const { data: eventRegistrations } = await supabase
          .from('event_registrations')
          .select('er.id')
          .from('event_registrations as er')
          .innerJoin('events as e', 'e.id', 'er.event_id')
          .eq('e.movement_id', movement.id)
          .gte('er.created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const eventScore = Math.min((eventRegistrations?.length || 0) / 30, 1) * 15;

        // 5. Content engagement (weight: 10%)
        const { data: blogMentions } = await supabase
          .from('blog_posts')
          .select('view_count')
          .contains('tags', [movement.slug])
          .eq('status', 'published');

        const totalBlogViews = blogMentions?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;
        const contentScore = Math.min(totalBlogViews / 1000, 1) * 10;

        // Calculate total engagement score (0-100)
        const engagementScore = Math.round(
          participantScore + donationScore + puzzleScore + eventScore + contentScore
        );

        // Update the engagement score
        const { error: updateError } = await supabase
          .from('movement_metrics')
          .update({
            engagement_score: engagementScore,
            last_calculated_at: new Date().toISOString(),
          })
          .eq('movement_id', movement.id);

        if (updateError) {
          console.error(`Failed to update engagement for ${movement.slug}:`, updateError);
        } else {
          console.log(`Updated ${movement.slug}: engagement_score = ${engagementScore}`);
        }

      } catch (err) {
        console.error(`Error processing movement ${movement.slug}:`, err);
      }
    }

    console.log('Engagement score calculation completed');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Engagement scores calculated',
        processed: movements.length,
      }),
    };

  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
