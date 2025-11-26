const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const MUSIC_DIR = path.join(__dirname, 'music');

// Serve music folder at /music
app.use('/music', express.static(MUSIC_DIR));

// Serve public static files
app.use(express.static(path.join(__dirname, 'public')));

// GET /tracks -> list filenames in the music directory
app.get('/tracks', async (req, res) => {
  try {
    // check exists
    if (!fs.existsSync(MUSIC_DIR)) {
      return res.status(500).json({ error: 'music directory not found on server' });
    }

    const files = await fs.promises.readdir(MUSIC_DIR);
    const audioExts = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']);

    const tracks = files.filter((f) => audioExts.has(path.extname(f).toLowerCase()));
    res.json(tracks);
  } catch (err) {
    console.error('Error reading music dir:', err);
    res.status(500).json({ error: 'failed to list tracks' });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
