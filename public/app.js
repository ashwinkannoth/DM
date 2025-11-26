document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('trackList');
  // main theme player (only one theme at a time)
  const themePlayer = document.getElementById('player');
  const btnThemes = document.getElementById('btnThemes');
  const btnEffects = document.getElementById('btnEffects');
  const backBtn = document.getElementById('back');
  const tracksTitle = document.getElementById('tracksTitle');
  const playPause = document.getElementById('playPause');
  const vol = document.getElementById('vol');
  const nowPlaying = document.getElementById('nowPlaying');

  let currentThemeItem = null; // currently-selected theme <li>
  let activeEffects = []; // array of currently playing effect Audio objects {audio, li}

  function showChooser(show) {
    document.querySelector('.chooser').style.display = show ? 'block' : 'none';
  }

  function showTrackSection(show) {
    document.querySelector('.tracks').style.display = show ? 'block' : 'none';
    document.querySelector('.player').style.display = show ? 'block' : 'none';
  }

  // load both folders and render onto the main page
  async function loadBoth() {
    try {
      const [themesRes, effectsRes] = await Promise.all([
        fetch('/tracks?subdir=themes'),
        fetch('/tracks?subdir=effects'),
      ]);

      if (!themesRes.ok || !effectsRes.ok) {
        const tErr = await themesRes.json().catch(()=>({}));
        const eErr = await effectsRes.json().catch(()=>({}));
        const msg = (tErr && tErr.error) || (eErr && eErr.error) || 'Failed to fetch tracks';
        throw new Error(msg);
      }

      const themes = await themesRes.json();
      const effects = await effectsRes.json();

      renderTracksFor('themes', themes);
      renderTracksFor('effects', effects);
    } catch (err) {
      // show errors in both lists
      const themesList = document.getElementById('themesList');
      const effectsList = document.getElementById('effectsList');
      themesList.innerHTML = `<li class="error">${err.message}</li>`;
      effectsList.innerHTML = `<li class="error">${err.message}</li>`;
    }
  }

  function renderTracksFor(kind, tracks) {
    const target = kind === 'themes' ? document.getElementById('themesList') : document.getElementById('effectsList');
    if (!tracks || tracks.length === 0) {
      target.innerHTML = '<li class="empty">No audio files found in this folder — drop mp3s into the music folder.</li>';
      return;
    }

    target.innerHTML = '';
    tracks.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'trackItem';
      const btn = document.createElement('button');
      btn.textContent = t.name;
      if (kind === 'themes') {
        btn.addEventListener('click', () => playTheme(t, li));
      } else {
        btn.addEventListener('click', () => playEffect(t, li));
      }
      li.appendChild(btn);
      target.appendChild(li);
    });
  }

  // Fade helpers for theme crossfade
  let themeFadeTimer = null;
  function setThemeVolumeGradually(from, to, duration = 700) {
    if (themeFadeTimer) clearInterval(themeFadeTimer);
    const start = performance.now();
    const diff = to - from;
    themePlayer.volume = from;
    themeFadeTimer = setInterval(() => {
      const now = performance.now();
      const t = Math.min(1, (now - start) / duration);
      themePlayer.volume = Math.max(0, Math.min(1, from + diff * t));
      if (t === 1) {
        clearInterval(themeFadeTimer);
        themeFadeTimer = null;
      }
    }, 30);
  }

  function playTrack(track, li) {
    const url = track.url; // server returns proper path including subdir
    themePlayer.src = url;
    themePlayer.loop = true;
    themePlayer.play().catch(() => {});
    if (currentThemeItem) currentThemeItem.classList.remove('current');
    li.classList.add('current');
    currentThemeItem = li;
    nowPlaying.textContent = `Theme: ${track.name}`;
  }

  function playTheme(track, li) {
    // If same theme clicked toggle pause/resume
    const url = track.url;
    if (themePlayer.src && themePlayer.src.endsWith(url)) {
      // toggle play/pause
      if (themePlayer.paused) themePlayer.play();
      else themePlayer.pause();
      return;
    }

    // Crossfade from current theme to new one
    const targetVol = parseFloat(vol.value || 1);
    if (!themePlayer.src) {
      // nothing playing, just start at 0 and fade in
      themePlayer.src = url;
      themePlayer.loop = true;
      themePlayer.volume = 0;
      themePlayer.play().catch(() => {});
      setThemeVolumeGradually(0, targetVol);
    } else {
      // fade out, then switch and fade in
      const currentVol = themePlayer.volume || targetVol;
      setThemeVolumeGradually(currentVol, 0, 500);
      // wait for fade-out to complete then switch
      setTimeout(() => {
        themePlayer.pause();
        themePlayer.src = url;
        themePlayer.loop = true;
        themePlayer.currentTime = 0;
        themePlayer.volume = 0;
        themePlayer.play().catch(() => {});
        setThemeVolumeGradually(0, targetVol, 700);
      }, 520);
    }

    if (currentThemeItem) currentThemeItem.classList.remove('current');
    li.classList.add('current');
    currentThemeItem = li;
    nowPlaying.textContent = `Theme: ${track.name}`;
  }
      // autoplay may be blocked; user can use play button
    });

  function playEffect(track, li) {
    const url = track.url;
    const fx = new Audio(url);
    fx.loop = false;
    fx.volume = parseFloat(vol.value || themePlayer.volume || 1);
    // highlight while effect is playing
    li.classList.add('playing-effect');
    activeEffects.push({ audio: fx, li });
    fx.play().catch(() => {});
    fx.addEventListener('ended', () => {
      li.classList.remove('playing-effect');
      // remove from activeEffects
      activeEffects = activeEffects.filter(e => e.audio !== fx);
    });
    fx.addEventListener('error', () => {
      li.classList.remove('playing-effect');
      activeEffects = activeEffects.filter(e => e.audio !== fx);
    });
  }
  }

  // Play/pause controls (affect theme only)
  playPause.addEventListener('click', () => {
    if (!themePlayer.src) return;
    if (themePlayer.paused) {
      themePlayer.play();
      playPause.textContent = 'Pause';
    } else {
      themePlayer.pause();
      playPause.textContent = 'Play';
    }
  });

  // Update play/pause button when playback state changes
  themePlayer.addEventListener('play', () => (playPause.textContent = 'Pause'));
  themePlayer.addEventListener('pause', () => (playPause.textContent = 'Play'));

  // Volume slider
  vol.addEventListener('input', () => {
    const v = parseFloat(vol.value);
    themePlayer.volume = v;
    // update all active effects volumes too
    activeEffects.forEach(e => { try { e.audio.volume = v; } catch(e){} });
  });

  // initial state — load both lists and show page
  showChooser(false);
  showTrackSection(true);
  loadBoth();
});
