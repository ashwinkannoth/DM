document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('trackList');
  const player = document.getElementById('player');
  const btnThemes = document.getElementById('btnThemes');
  const btnEffects = document.getElementById('btnEffects');
  const backBtn = document.getElementById('back');
  const tracksTitle = document.getElementById('tracksTitle');
  const playPause = document.getElementById('playPause');
  const vol = document.getElementById('vol');
  const nowPlaying = document.getElementById('nowPlaying');

  let currentItem = null;
  let currentFolder = null; // 'themes' | 'effects'

  function showChooser(show) {
    document.querySelector('.chooser').style.display = show ? 'block' : 'none';
  }

  function showTrackSection(show) {
    document.querySelector('.tracks').style.display = show ? 'block' : 'none';
    document.querySelector('.player').style.display = show ? 'block' : 'none';
  }

  async function loadTracks(folder) {
    try {
      const res = await fetch('/tracks' + (folder ? '?subdir=' + encodeURIComponent(folder) : ''));
      if (!res.ok) {
        const text = await res.json().catch(() => ({}));
        throw new Error(text && text.error ? text.error : 'Failed to fetch tracks');
      }
      const tracks = await res.json();
      renderTracks(tracks);
    } catch (err) {
      list.innerHTML = `<li class="error">${err.message}</li>`;
    }
  }

  function renderTracks(tracks) {
    if (!tracks || tracks.length === 0) {
      list.innerHTML = '<li class="empty">No audio files found in this folder — drop mp3s into the music folder.</li>';
      return;
    }

    list.innerHTML = '';
    tracks.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'trackItem';
      const btn = document.createElement('button');
      btn.textContent = t.name;
      btn.addEventListener('click', () => playTrack(t, li));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function playTrack(track, li) {
    const url = track.url; // server returns proper path including subdir
    player.src = url;
    player.loop = currentFolder === 'themes';
    player.play().catch(() => {
      // autoplay may be blocked; user can use play button
    });

    if (currentItem) currentItem.classList.remove('current');
    li.classList.add('current');
    currentItem = li;
    nowPlaying.textContent = `Now playing: ${track.name}`;

    // If this is an effect (play once), remove highlight when finished
    if (currentFolder === 'effects') {
      player.onended = () => {
        if (currentItem) currentItem.classList.remove('current');
        currentItem = null;
        nowPlaying.textContent = '';
      };
    } else {
      player.onended = null;
    }
  }

  // Play/pause controls
  playPause.addEventListener('click', () => {
    if (!player.src) return;
    if (player.paused) {
      player.play();
      playPause.textContent = 'Pause';
    } else {
      player.pause();
      playPause.textContent = 'Play';
    }
  });

  // Update play/pause button when playback state changes
  player.addEventListener('play', () => (playPause.textContent = 'Pause'));
  player.addEventListener('pause', () => (playPause.textContent = 'Play'));

  // Volume slider
  vol.addEventListener('input', () => {
    player.volume = parseFloat(vol.value);
  });

  // Mode buttons
  btnThemes.addEventListener('click', () => openFolder('themes'));
  btnEffects.addEventListener('click', () => openFolder('effects'));

  backBtn.addEventListener('click', () => {
    currentFolder = null;
    showChooser(true);
    showTrackSection(false);
    nowPlaying.textContent = '';
  });

  function openFolder(folder) {
    currentFolder = folder;
    showChooser(false);
    showTrackSection(true);
    tracksTitle.textContent = folder.charAt(0).toUpperCase() + folder.slice(1);
    loadTracks(folder);
    // set loop behavior for themes permanently
    player.loop = folder === 'themes';
  }

  // initial state
  showChooser(true);
  showTrackSection(false);
});
