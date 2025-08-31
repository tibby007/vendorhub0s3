#!/usr/bin/env node

import { readFileSync } from 'fs';

console.log('🔍 Build Environment Check');
console.log('========================');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Memory limit:', process.memoryUsage());
console.log('');

console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS || 'Not set');
console.log('NPM_FLAGS:', process.env.NPM_FLAGS || 'Not set');
console.log('');

console.log('Build Configuration:');

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  console.log('Package name:', packageJson.name);
  console.log('Build script:', packageJson.scripts.build);
  console.log('Dependencies count:', Object.keys(packageJson.dependencies || {}).length);
  console.log('DevDependencies count:', Object.keys(packageJson.devDependencies || {}).length);
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

try {
  const netlifyToml = readFileSync('netlify.toml', 'utf8');
  console.log('Netlify config exists: ✅');
  console.log('Publish directory:', netlifyToml.includes('publish = "dist"') ? 'dist ✅' : '❌ Not dist');
} catch (error) {
  console.log('❌ Error reading netlify.toml:', error.message);
}

console.log('');
console.log('🏗️ Starting build verification...');