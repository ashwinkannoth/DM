document.addEventListener('DOMContentLoaded', () => {
  const themePlayer = document.getElementById('player');
  const playPause = document.getElementById('playPause');
  const vol = document.getElementById('vol');
  const nowPlaying = document.getElementById('nowPlaying');

  let currentThemeItem = null; // currently-selected theme <li>
  const activeEffects = new Map(); // map from track url to {audio, li}

  const chooserEl = document.querySelector('.chooser');
  const tracksEl = document.querySelector('.tracks');
  const playerEl = document.querySelector('.player');

  function showChooser(show) {
    chooserEl.style.display = show ? 'block' : 'none';
  }

  function showTrackSection(show) {
    tracksEl.style.display = show ? 'block' : 'none';
    playerEl.style.display = show ? 'block' : 'none';
  }

  async function fetchTracks(subdir) {
    const url = subdir ? `/tracks?subdir=${encodeURIComponent(subdir)}` : '/tracks';
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 404) return null; // missing subdir, fallback later
    const data = await res.json().catch(() => ({}));
    const msg = data.error || `Failed to fetch ${subdir || 'tracks'}`;
    throw new Error(msg);
  }

  // Load themes/effects; if no subfolders exist, fall back to root music files
  async function loadBoth() {
    try {
      const [rootTracks, themesTracks, effectsTracks] = await Promise.all([
        fetchTracks(),
        fetchTracks('themes'),
        fetchTracks('effects'),
      ]);

      const fallback = rootTracks || [];
      renderTracksFor('themes', themesTracks || fallback);
      renderTracksFor('effects', effectsTracks || fallback);
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
      const displayName = t.name.replace(/\.[^/.]+$/, '');
      const btn = document.createElement('button');
      btn.textContent = displayName;
      if (kind === 'themes') {
        btn.addEventListener('click', () => playTheme(t, li));
      } else {
        btn.addEventListener('click', () => toggleEffect(t, li));
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

  function cleanupEffect(url) {
    const entry = activeEffects.get(url);
    if (!entry) return;
    entry.li.classList.remove('playing-effect');
    activeEffects.delete(url);
  }

  function toggleEffect(track, li) {
    const url = track.url;

    // if already playing, stop it immediately
    const existing = activeEffects.get(url);
    if (existing) {
      existing.audio.pause();
      existing.audio.currentTime = 0;
      cleanupEffect(url);
      return;
    }

    const fx = new Audio(url);
    fx.loop = false;
    fx.volume = parseFloat(vol.value || themePlayer.volume || 1);
    li.classList.add('playing-effect');
    activeEffects.set(url, { audio: fx, li });
    fx.play().catch(() => {});
    fx.addEventListener('ended', () => cleanupEffect(url));
    fx.addEventListener('error', () => cleanupEffect(url));
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
    activeEffects.forEach(({ audio }) => { try { audio.volume = v; } catch (err) {} });
  });

  // Initiative Tracker logic
  const initInput = document.getElementById('initName');
  const initHPInput = document.getElementById('initHP');
  const initHero = document.getElementById('initHero');
  const initMonster = document.getElementById('initMonster');
  const initClear = document.getElementById('initClear');
  const initList = document.getElementById('initList');
  let draggedItem = null;

  function createInitRow(name, type, hp) {
    const li = document.createElement('li');
    li.className = 'init-item';
    li.dataset.type = type;
    li.draggable = true;

    const main = document.createElement('div');
    main.className = 'init-main';

    const label = document.createElement('span');
    label.className = 'init-name';
    label.textContent = name;

    const typeBadge = document.createElement('span');
    typeBadge.className = 'init-type';
    typeBadge.textContent = type === 'hero' ? 'Hero' : 'Monster';

    main.appendChild(label);
    main.appendChild(typeBadge);

    const meta = document.createElement('div');
    meta.className = 'init-meta';

    const hpLabel = document.createElement('label');
    hpLabel.className = 'init-hp-label-inline';
    hpLabel.textContent = 'HP';

    const hpInput = document.createElement('input');
    hpInput.type = 'number';
    hpInput.min = '0';
    hpInput.className = 'init-hp';
    hpInput.value = hp;
    hpInput.addEventListener('click', (e) => e.stopPropagation());

    hpLabel.appendChild(hpInput);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'init-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => li.remove());

    meta.appendChild(hpLabel);
    meta.appendChild(removeBtn);

    li.appendChild(main);
    li.appendChild(meta);

    addDragHandlers(li);
    return li;
  }

  function addInitiative(type) {
    if (!initInput) return;
    const name = initInput.value.trim();
    if (!name) return;
    const hp = (initHPInput?.value || '').trim() || '0';
    const row = createInitRow(name, type, hp);
    initList.appendChild(row);
    initInput.value = '';
    if (initHPInput) initHPInput.value = '';
    initInput.focus();
  }

  function clearInitiative() {
    if (initList) initList.innerHTML = '';
    initInput?.focus();
  }

  function addDragHandlers(li) {
    li.addEventListener('dragstart', (e) => {
      draggedItem = li;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', li.querySelector('.init-name')?.textContent || '');
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      draggedItem = null;
    });
  }

  function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll('.init-item:not(.dragging)')];
    return items.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  initHero?.addEventListener('click', () => addInitiative('hero'));
  initMonster?.addEventListener('click', () => addInitiative('monster'));
  initClear?.addEventListener('click', clearInitiative);
  initInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInitiative('hero');
    }
  });

  initList?.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(initList, e.clientY);
    if (!draggedItem) return;
    if (!afterElement) {
      initList.appendChild(draggedItem);
    } else {
      initList.insertBefore(draggedItem, afterElement);
    }
  });

  initList?.addEventListener('drop', (e) => {
    e.preventDefault();
  });

  // initial state — load both lists and show page
  showChooser(false);
  showTrackSection(true);
  loadBoth();
});
