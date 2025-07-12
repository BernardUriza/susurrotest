#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function checkCommand(command, name) {
  try {
    await execPromise(`which ${command}`);
    console.log(`✅ ${name} found`);
    return true;
  } catch {
    console.log(`❌ ${name} NOT found`);
    return false;
  }
}

async function checkWhisperCli() {
  const whisperPath = path.join(__dirname, '../node_modules/nodejs-whisper/cpp/whisper.cpp/bin/whisper-cli');
  if (fs.existsSync(whisperPath)) {
    console.log('✅ whisper-cli binary found');
    return true;
  } else {
    console.log('❌ whisper-cli binary NOT found');
    return false;
  }
}

async function checkModel() {
  const modelPath = path.join(__dirname, '../node_modules/nodejs-whisper/cpp/whisper.cpp/models/ggml-base.bin');
  if (fs.existsSync(modelPath)) {
    console.log('✅ Whisper model found');
    return true;
  } else {
    console.log('❌ Whisper model NOT found');
    return false;
  }
}

async function main() {
  console.log('🔍 Checking dependencies...\n');
  
  let allChecksPass = true;

  // Check system dependencies
  const ffmpegInstalled = await checkCommand('ffmpeg', 'ffmpeg');
  const cmakeInstalled = await checkCommand('cmake', 'cmake');
  const makeInstalled = await checkCommand('make', 'make');
  
  if (!ffmpegInstalled || !cmakeInstalled || !makeInstalled) {
    allChecksPass = false;
    console.log('\n⚠️  Missing system dependencies. Please install:');
    if (!ffmpegInstalled) console.log('  - ffmpeg: sudo apt-get install ffmpeg');
    if (!cmakeInstalled) console.log('  - cmake: sudo apt-get install cmake');
    if (!makeInstalled) console.log('  - make: sudo apt-get install build-essential');
  }

  // Check whisper-cli
  const whisperCliExists = await checkWhisperCli();
  if (!whisperCliExists) {
    allChecksPass = false;
    console.log('\n⚠️  whisper-cli not built. Run: npm run build-whisper');
  }

  // Check model
  const modelExists = await checkModel();
  if (!modelExists) {
    allChecksPass = false;
    console.log('\n⚠️  Whisper model not found. Run: npm run download-model');
  }

  console.log('\n' + (allChecksPass ? '✅ All checks passed!' : '❌ Some checks failed'));
  process.exit(allChecksPass ? 0 : 1);
}

main().catch(console.error);