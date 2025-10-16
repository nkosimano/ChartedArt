/**
 * Cleanup Expired Puzzle Reservations - Background Job
 * Triggered by EventBridge every 5 minutes
 * Releases pieces that have expired reservations
 */

const { callDatabaseFunction } = require('../utils/supabase');
const { success, internalError } = require('../utils/response');

exports.handler = async (event) => {
  console.log('Starting puzzle reservation cleanup job');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const startTime = Date.now();
    
    // Call database function to cleanup expired reservations
    const result = await callDatabaseFunction('cleanup_expired_puzzle_reservations');
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Cleanup completed in ${duration}ms`);
    console.log(`Released ${result.released_count} expired reservations`);
    
    return success({
      job: 'cleanup_puzzle_reservations',
      released_count: result.released_count,
      duration_ms: duration,
      timestamp: result.timestamp,
      success: true
    });
    
  } catch (error) {
    console.error('❌ Cleanup job failed:', error);
    
    // Still return 200 to prevent EventBridge from retrying
    // Log error for monitoring/alerting
    return internalError('Cleanup job failed', error);
  }
};
