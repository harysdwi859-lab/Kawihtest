/**
 * Kawihfy Backend Server
 * Node.js + Express
 * 
 * Install: npm install express cors
 * Jalankan: node server.js
 * 
 * Requires yt-dlp installed:
 *   Linux/Mac: pip install yt-dlp  ATAU  brew install yt-dlp
 *   Windows:   winget install yt-dlp  ATAU  pip install yt-dlp
 */

const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files (index.html, qr-donate.png, dll)
app.use(express.static(path.join(__dirname)));

// ─────────────────────────────────────────────
// /api  — YouTube search proxy
// Ganti dengan implementasi search YouTube kamu
// ─────────────────────────────────────────────
app.get('/api', async (req, res) => {
  const q = req.query.q;
  const max = parseInt(req.query.max) || 50;
  if (!q) return res.status(400).json({ error: 'Query required' });

  try {
    // Pakai yt-dlp untuk search YouTube
    const cmd = `yt-dlp "ytsearch${max}:${q.replace(/"/g, '\\"')}" --flat-playlist --dump-json --no-warnings 2>/dev/null`;
    exec(cmd, { timeout: 15000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err || !stdout.trim()) return res.json([]);
      try {
        const results = stdout.trim().split('\n')
          .filter(Boolean)
          .map(line => {
            try {
              const d = JSON.parse(line);
              return {
                videoId: d.id,
                title: d.title,
                artist: d.uploader || d.channel || '',
                thumb: d.thumbnail || `https://i.ytimg.com/vi/${d.id}/mqdefault.jpg`,
                duration: d.duration,
              };
            } catch { return null; }
          })
          .filter(Boolean);
        res.json(results);
      } catch {
        res.json([]);
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────
// /api/download  — Download MP3 via yt-dlp
// ─────────────────────────────────────────────
app.get('/api/download', (req, res) => {
  const { videoId, title } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  const safeTitle = (title || videoId)
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80);

  const filename = `Kawihfy-${safeTitle}.mp3`;
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`[Download] ${filename}`);

  // Set headers untuk streaming download
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Transfer-Encoding', 'chunked');

  // Jalankan yt-dlp, pipe langsung ke response
  const ytdlp = spawn('yt-dlp', [
    url,
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '192K',
    '-o', '-',            // output ke stdout
    '--no-playlist',
    '--no-warnings',
    '--quiet',
  ]);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on('data', (data) => {
    console.error('[yt-dlp stderr]', data.toString());
  });

  ytdlp.on('error', (err) => {
    console.error('[yt-dlp error]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'yt-dlp not found. Install with: pip install yt-dlp' });
    }
  });

  ytdlp.on('close', (code) => {
    console.log(`[yt-dlp] exit code ${code} for ${filename}`);
    if (!res.writableEnded) res.end();
  });

  req.on('close', () => {
    ytdlp.kill('SIGTERM');
  });
});

// ─────────────────────────────────────────────
// /api/log-download  — Log download ke Sheet3
// ─────────────────────────────────────────────
app.post('/api/log-download', express.json(), (req, res) => {
  const { user, title, videoId, time } = req.body;
  console.log(`[Log] ${user} downloaded: ${title} (${videoId}) at ${time}`);
  // Di sini bisa kirim ke Google Sheets via Apps Script webhook
  // Contoh: fetch ke GAS Web App URL
  res.json({ ok: true });
});

// ─────────────────────────────────────────────
// Fallback: serve index.html untuk semua route
// ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎵 Kawihfy Server running at http://localhost:${PORT}`);
  console.log(`   Pastikan yt-dlp sudah terinstall: pip install yt-dlp`);
  console.log(`   Atau: winget install yt-dlp (Windows)\n`);
});
