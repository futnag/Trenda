#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Edge Functions...\n');

// Check if Supabase CLI is installed
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI is installed');
} catch (error) {
  console.error('❌ Supabase CLI is not installed. Please install it first:');
  console.error('npm install -g supabase');
  process.exit(1);
}

// Check if we're in a Supabase project
const supabaseConfigPath = path.join(process.cwd(), 'supabase', 'config.toml');
if (!fs.existsSync(supabaseConfigPath)) {
  console.error('❌ Not in a Supabase project directory');
  console.error('Run this script from your project root directory');
  process.exit(1);
}

// Check if functions directory exists
const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
if (!fs.existsSync(functionsDir)) {
  console.error('❌ Functions directory not found');
  process.exit(1);
}

// List available functions
const functions = fs.readdirSync(functionsDir)
  .filter(item => {
    const itemPath = path.join(functionsDir, item);
    return fs.statSync(itemPath).isDirectory() && 
           fs.existsSync(path.join(itemPath, 'index.ts'));
  });

console.log(`📁 Found ${functions.length} function(s): ${functions.join(', ')}\n`);

// Deploy each function
for (const functionName of functions) {
  try {
    console.log(`🔄 Deploying ${functionName}...`);
    
    // Deploy the function
    execSync(`supabase functions deploy ${functionName}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`✅ Successfully deployed ${functionName}\n`);
    
  } catch (error) {
    console.error(`❌ Failed to deploy ${functionName}`);
    console.error(error.message);
    
    // Continue with other functions
    continue;
  }
}

console.log('🎉 Edge Functions deployment completed!');
console.log('\n📋 Next steps:');
console.log('1. Set up environment variables in Supabase Dashboard');
console.log('2. Configure API keys for external services');
console.log('3. Test the functions using the Supabase Dashboard or CLI');
console.log('4. Update your frontend to call the new functions');

// Display environment variables that need to be set
console.log('\n🔑 Required Environment Variables:');
console.log('- SUPABASE_URL (automatically set)');
console.log('- SUPABASE_ANON_KEY (automatically set)');
console.log('- REDDIT_CLIENT_ID (optional)');
console.log('- REDDIT_CLIENT_SECRET (optional)');
console.log('- TWITTER_BEARER_TOKEN (optional)');
console.log('- PRODUCT_HUNT_ACCESS_TOKEN (optional)');
console.log('- GITHUB_ACCESS_TOKEN (optional)');

console.log('\n💡 Tip: Functions will skip data sources without API keys');
console.log('💡 Tip: Use "supabase functions serve" for local development');