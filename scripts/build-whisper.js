#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const whisperDir = path.join(__dirname, '../node_modules/nodejs-whisper/cpp/whisper.cpp');

console.log('🔨 Building whisper-cli...\n');

if (!fs.existsSync(whisperDir)) {
  console.error('❌ whisper.cpp directory not found. Run npm install first.');
  process.exit(1);
}

try {
  process.chdir(whisperDir);
  
  console.log('📁 Working directory:', process.cwd());
  
  // Clean any previous builds
  console.log('🧹 Cleaning previous builds...');
  try {
    execSync('rm -rf build CMakeCache.txt CMakeFiles', { stdio: 'inherit' });
  } catch (e) {
    // Ignore errors if files don't exist
  }
  
  // Configure with cmake
  console.log('\n⚙️  Configuring with cmake...');
  execSync('cmake .', { stdio: 'inherit' });
  
  // Build with make
  console.log('\n🏗️  Building with make (this may take a few minutes)...');
  execSync('make -j 4', { stdio: 'inherit' });
  
  // Check if binary was created
  const binaryPath = path.join(whisperDir, 'bin/whisper-cli');
  if (fs.existsSync(binaryPath)) {
    console.log('\n✅ whisper-cli built successfully!');
    console.log(`📍 Binary location: ${binaryPath}`);
  } else {
    console.error('\n❌ Build succeeded but whisper-cli binary not found');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}