// Simple Node.js script to test admin access
// Run with: node test-admin.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://uuqfobbkjhrpylygauwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWZvYmJramhycHlseWdhdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NTc4MTEsImV4cCI6MjA1MDIzMzgxMX0.k4BbIu12wFQO9aqSe3SYdB_lz4mNmm6a_SvGr3Ek_qQ'; // Get this from your Supabase project settings

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAccess() {
  try {
    console.log('Testing admin_users table...');
    
    // Test if admin_users table exists
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('❌ admin_users table does not exist');
      console.log('You need to create the admin_users table first.');
      return;
    }
    
    if (error) {
      console.log('❌ Error accessing admin_users table:', error.message);
      return;
    }
    
    console.log('✅ admin_users table exists');
    console.log('Admin users found:', data.length);
    
    if (data.length === 0) {
      console.log('⚠️  No admin users found. You need to add yourself as an admin.');
      console.log('Run this SQL in your Supabase dashboard:');
      console.log(`
INSERT INTO admin_users (user_id, role, is_active)
SELECT id, 'super_admin', true 
FROM profiles 
WHERE email = 'your-email@example.com';
      `);
    } else {
      console.log('✅ Admin users found:', data);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testAdminAccess();