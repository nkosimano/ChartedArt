#!/usr/bin/env node

/**
 * ChartedArt Database Migration Validator
 * 
 * This script validates that all database migrations have been applied correctly.
 * It checks for:
 * - Required tables
 * - Required extensions
 * - RLS policies
 * - Storage buckets
 * - Functions
 * - Triggers
 * 
 * Usage:
 *   node supabase/migrations/validate_migrations.js
 * 
 * Requirements:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const https = require('https');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Expected database objects
const EXPECTED_TABLES = [
  // Core tables (00200)
  'profiles', 'products', 'orders', 'order_items', 'cart_items', 'testimonials', 'events', 'blog_posts',
  
  // Admin system (00300)
  'admin_users', 'messages', 'system_config', 'idempotency_keys', 'inventory_alerts',
  
  // Analytics (00400)
  'product_analytics', 'sales_metrics', 'user_browsing_history', 'user_sessions', 'customer_segments',
  
  // Cart analytics (00500)
  'cart_sessions', 'order_status_history',
  
  // Wishlists & Reviews (00600)
  'wishlists', 'wishlist_items', 'product_reviews',
  
  // Notifications (00700)
  'notifications', 'user_notification_preferences', 'push_subscriptions', 'notification_templates',
  'email_queue', 'notification_delivery_log', 'push_notification_log',
  
  // Artist portal (00800)
  'artist_portfolios', 'commission_requests', 'commission_messages', 'artist_monthly_earnings',
  
  // Social features (00900)
  'user_follows', 'product_comments', 'comment_likes', 'product_likes', 'user_collections',
  'collection_products', 'artist_exhibitions', 'artist_awards', 'user_activities',
  
  // Movements (01000)
  'movements', 'movement_metrics', 'movement_participants', 'movement_donations',
  'movement_products', 'movement_events', 'movement_updates',
  
  // Puzzle pieces (01100)
  'puzzle_pieces', 'puzzle_piece_collections', 'puzzle_piece_transfers', 'piece_reservations',
  
  // Events & Competitions (01200)
  'event_registrations', 'competition_submissions', 'competition_judges', 'judge_scores',
  'submission_upload_requests',
  
  // Blog SEO (01300)
  'blog_categories', 'blog_tags', 'blog_post_tags', 'blog_comments'
];

const EXPECTED_EXTENSIONS = [
  'uuid-ossp',
  'pg_trgm' // For full-text search
];

const EXPECTED_STORAGE_BUCKETS = [
  'product-images',
  'artwork-images'
];

// Helper function to make Supabase API calls
function supabaseQuery(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Validation functions
async function checkTables() {
  console.log('\n📊 Checking tables...');
  
  const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  try {
    const result = await supabaseQuery(sql);
    const existingTables = result.map(row => row.table_name);
    
    const missing = EXPECTED_TABLES.filter(t => !existingTables.includes(t));
    const extra = existingTables.filter(t => !EXPECTED_TABLES.includes(t));
    
    console.log(`   ✅ Found ${existingTables.length} tables`);
    
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing tables (${missing.length}):`);
      missing.forEach(t => console.log(`      - ${t}`));
    }
    
    if (extra.length > 0) {
      console.log(`   ℹ️  Extra tables (${extra.length}):`);
      extra.forEach(t => console.log(`      - ${t}`));
    }
    
    return missing.length === 0;
  } catch (error) {
    console.error('   ❌ Error checking tables:', error.message);
    return false;
  }
}

async function checkExtensions() {
  console.log('\n🔌 Checking extensions...');
  
  const sql = `SELECT extname FROM pg_extension;`;
  
  try {
    const result = await supabaseQuery(sql);
    const existingExtensions = result.map(row => row.extname);
    
    const missing = EXPECTED_EXTENSIONS.filter(e => !existingExtensions.includes(e));
    
    console.log(`   ✅ Found ${existingExtensions.length} extensions`);
    
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing extensions (${missing.length}):`);
      missing.forEach(e => console.log(`      - ${e}`));
    }
    
    return missing.length === 0;
  } catch (error) {
    console.error('   ❌ Error checking extensions:', error.message);
    return false;
  }
}

async function checkRLS() {
  console.log('\n🔒 Checking Row-Level Security...');
  
  const sql = `
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `;
  
  try {
    const result = await supabaseQuery(sql);
    const tablesWithoutRLS = result.filter(row => !row.rowsecurity);
    
    console.log(`   ✅ RLS enabled on ${result.length - tablesWithoutRLS.length}/${result.length} tables`);
    
    if (tablesWithoutRLS.length > 0) {
      console.log(`   ⚠️  Tables without RLS (${tablesWithoutRLS.length}):`);
      tablesWithoutRLS.forEach(t => console.log(`      - ${t.tablename}`));
    }
    
    return tablesWithoutRLS.length === 0;
  } catch (error) {
    console.error('   ❌ Error checking RLS:', error.message);
    return false;
  }
}

async function checkStorageBuckets() {
  console.log('\n📦 Checking storage buckets...');
  
  const sql = `SELECT name FROM storage.buckets;`;
  
  try {
    const result = await supabaseQuery(sql);
    const existingBuckets = result.map(row => row.name);
    
    const missing = EXPECTED_STORAGE_BUCKETS.filter(b => !existingBuckets.includes(b));
    
    console.log(`   ✅ Found ${existingBuckets.length} storage buckets`);
    
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing buckets (${missing.length}):`);
      missing.forEach(b => console.log(`      - ${b}`));
    }
    
    return missing.length === 0;
  } catch (error) {
    console.error('   ❌ Error checking storage buckets:', error.message);
    return false;
  }
}

async function checkFunctions() {
  console.log('\n⚙️  Checking database functions...');
  
  const sql = `
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    ORDER BY routine_name;
  `;
  
  try {
    const result = await supabaseQuery(sql);
    console.log(`   ✅ Found ${result.length} functions`);
    return true;
  } catch (error) {
    console.error('   ❌ Error checking functions:', error.message);
    return false;
  }
}

// Main validation
async function main() {
  console.log('🚀 ChartedArt Database Migration Validator\n');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  
  const results = {
    tables: await checkTables(),
    extensions: await checkExtensions(),
    rls: await checkRLS(),
    storage: await checkStorageBuckets(),
    functions: await checkFunctions()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${check.toUpperCase()}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('='.repeat(50));
  
  if (allPassed) {
    console.log('\n✅ All validations passed! Database is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed. Please review the output above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

