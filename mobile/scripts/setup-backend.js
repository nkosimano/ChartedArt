#!/usr/bin/env node

/**
 * Setup script to configure the mobile app with real backend
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ChartedArt Mobile Backend Setup');
console.log('==================================');

const envPath = path.join(__dirname, '..', '.env');

// Read current .env file
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

console.log('\n📋 Current Configuration:');
console.log('-------------------------');

// Parse current values
const lines = envContent.split('\n');
const config = {};

lines.forEach(line => {
  if (line.startsWith('EXPO_PUBLIC_')) {
    const [key, value] = line.split('=');
    config[key] = value;
    console.log(`${key}: ${value}`);
  }
});

console.log('\n🔄 Configuration Options:');
console.log('1. Use Mock Data (for UI testing)');
console.log('2. Use Real Backend (requires deployed API)');
console.log('3. Update API URL');
console.log('4. Show current status');

// For now, just show instructions
console.log('\n📝 To switch to real backend:');
console.log('1. Deploy your backend with: sam deploy');
console.log('2. Get the API Gateway URL from AWS Console');
console.log('3. Update EXPO_PUBLIC_API_URL in mobile/.env');
console.log('4. Set EXPO_PUBLIC_USE_MOCK_DATA=false');

console.log('\n🧪 Current Mode:', config.EXPO_PUBLIC_USE_MOCK_DATA === 'true' ? 'MOCK DATA' : 'REAL BACKEND');

if (config.EXPO_PUBLIC_USE_MOCK_DATA === 'true') {
  console.log('\n✅ App is using mock data - perfect for UI testing!');
  console.log('   - All screens will show sample data');
  console.log('   - Authentication works with Supabase');
  console.log('   - No real API calls are made');
} else {
  console.log('\n🌐 App is configured for real backend');
  console.log('   - API URL:', config.EXPO_PUBLIC_API_URL);
  console.log('   - Make sure your backend is deployed and accessible');
}

console.log('\n🚀 Ready to test!');
console.log('Run: npm start');