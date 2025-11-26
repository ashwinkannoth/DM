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

    // optional subdir (e.g. ?subdir=effects or ?subdir=themes)
    const requested = req.query.subdir;

    // resolve target dir
    let targetDir = MUSIC_DIR;
    let dirName = '';
    if (requested) {
      // find a child directory case-insensitively to avoid confusion (supports Effects / effects)
      const children = await fs.promises.readdir(MUSIC_DIR, { withFileTypes: true });
      const match = children.find(c => c.isDirectory() && c.name.toLowerCase() === String(requested).toLowerCase());
      if (!match) return res.status(404).json({ error: 'subdirectory not found' });
      dirName = match.name; // preserve actual on-disk casing
      targetDir = path.join(MUSIC_DIR, dirName);
    }

    const files = await fs.promises.readdir(targetDir);
    const audioExts = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac']);

    const tracks = files
      .filter((f) => audioExts.has(path.extname(f).toLowerCase()))
      .map((f) => ({ name: f, url: path.posix.join('/music', dirName || '', f) }));

    res.json(tracks);
  } catch (err) {
    console.error('Error reading music dir:', err);
    res.status(500).json({ error: 'failed to list tracks' });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
