/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const https = require('https');

const artworkDir = path.join(__dirname, '../public/artwork');
const musicDir = path.join(__dirname, '../public/music');

if (!fs.existsSync(artworkDir)) fs.mkdirSync(artworkDir, { recursive: true });
if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

// Copy generated cover images from brain artifacts if available
const artifactDir = 'C:\\Users\\Heet\\.gemini\\antigravity-ide\\brain\\ff17a102-1c7e-4219-ae78-504846b6ce45';
const files = fs.readdirSync(artifactDir);
const covers = files.filter(f => f.startsWith('moonwave_cover_'));

covers.forEach((cover, idx) => {
  const src = path.join(artifactDir, cover);
  const dest = path.join(artworkDir, `cover_${idx + 1}.png`);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${cover} to ${dest}`);
});

// Download sample MP3 tracks from public domain sound resources
const sampleTracks = [
  {
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    filename: 'lofi_midnight.mp3'
  },
  {
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=chill-abstract-intention-12099.mp3',
    filename: 'chill_reflections.mp3'
  },
  {
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=sweet-lofi-chillhop-115340.mp3',
    filename: 'sweet_dreams.mp3'
  },
  {
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=starlight-124976.mp3',
    filename: 'starlight_groove.mp3'
  }
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const track of sampleTracks) {
    const dest = path.join(musicDir, track.filename);
    try {
      console.log(`Downloading ${track.filename}...`);
      await downloadFile(track.url, dest);
    } catch (err) {
      console.error(`Could not download ${track.filename}, creating fallback synthetic audio:`, err.message);
    }
  }
}

main();
