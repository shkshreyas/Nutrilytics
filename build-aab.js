#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting AAB Build Process for Play Store...\n');

// Check if eas.json exists
if (!fs.existsSync('eas.json')) {
  console.error('❌ eas.json not found. Please ensure you have configured EAS build.');
  process.exit(1);
}

// Check if user is logged in to EAS
try {
  execSync('eas whoami', { stdio: 'pipe' });
  console.log('✅ EAS login verified');
} catch (error) {
  console.error('❌ Not logged in to EAS. Please run: eas login');
  process.exit(1);
}

// Build options
const buildOptions = process.argv.slice(2);
const profile = buildOptions.includes('--standalone') ? 'standalone' : 'production';

console.log(`📦 Building with profile: ${profile}`);
console.log('⏳ This may take 10-15 minutes...\n');

try {
  // Execute the build command
  const buildCommand = `eas build --platform android --profile ${profile}`;
  console.log(`Running: ${buildCommand}\n`);
  
  execSync(buildCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ AAB Build completed successfully!');
  console.log('📱 Your AAB file is ready for Play Store submission');
  console.log('🔗 Check the link above to download your AAB file');
  
} catch (error) {
  console.error('\n❌ Build failed!');
  console.error('Please check:');
  console.error('1. Firebase credentials in eas.json');
  console.error('2. EAS project configuration');
  console.error('3. Network connection');
  process.exit(1);
} 