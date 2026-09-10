const fs = require('fs');
const path = require('path');
const https = require('https');

const karaokeDir = path.join(__dirname, '../public/karaoke');
if (!fs.existsSync(karaokeDir)) {
  fs.mkdirSync(karaokeDir, { recursive: true });
}

const sampleVideos = [
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    filename: 'song-1.mp4'
  },
  {
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    filename: 'song-2.mp4'
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    filename: 'song-3.mp4'
  },
  {
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    filename: 'song-4.mp4'
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    filename: 'song-5.mp4'
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
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function main() {
  for (const video of sampleVideos) {
    const dest = path.join(karaokeDir, video.filename);
    console.log(`Downloading ${video.filename}...`);
    try {
      await downloadFile(video.url, dest);
    } catch (e) {
      console.error(`Failed to download ${video.filename}:`, e.message);
    }
  }
}

main();
