const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin';
const MODEL_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.cache', 'nodejs-whisper', 'models');
const MODEL_FILE = 'ggml-tiny.en.bin';

async function downloadModel() {
  try {
    // Create model directory
    if (!fs.existsSync(MODEL_DIR)) {
      fs.mkdirSync(MODEL_DIR, { recursive: true });
      console.log(`✅ Created model directory: ${MODEL_DIR}`);
    }

    const modelPath = path.join(MODEL_DIR, MODEL_FILE);

    // Check if model already exists
    if (fs.existsSync(modelPath)) {
      console.log(`✅ Model already exists at: ${modelPath}`);
      return;
    }

    console.log(`📥 Downloading Whisper tiny.en model...`);
    console.log(`   URL: ${MODEL_URL}`);
    console.log(`   Destination: ${modelPath}`);

    // Download model
    const file = fs.createWriteStream(modelPath);
    
    const downloadFile = (url) => {
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          console.log(`   Redirecting to: ${response.headers.location}`);
          downloadFile(response.headers.location);
          return;
        }

        if (response.statusCode !== 200) {
          console.error(`❌ Failed to download. Status code: ${response.statusCode}`);
          process.exit(1);
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r   Progress: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(1)} MB / ${(totalSize / 1024 / 1024).toFixed(1)} MB)`);
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('\n✅ Model downloaded successfully!');
          console.log(`📂 Model location: ${modelPath}`);
          console.log(`📊 File size: ${(fs.statSync(modelPath).size / 1024 / 1024).toFixed(1)} MB`);
        });
      }).on('error', (err) => {
        fs.unlink(modelPath, () => {});
        console.error('❌ Download failed:', err.message);
        process.exit(1);
      });
    };

    downloadFile(MODEL_URL);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run download
downloadModel();