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
  const typeSelect = document.getElementById('initType');
  const acInput = document.getElementById('initAC');
  const initInput = document.getElementById('initName');
  const initHPInput = document.getElementById('initHP');
  const initAdd = document.getElementById('initAdd');
  const monsterSuggestions = document.getElementById('monsterSuggestions');
  const initClear = document.getElementById('initClear');
  const initList = document.getElementById('initList');
  let draggedItem = null;

  const monstersIndex = (window.MONSTERS || []).map((monster) => ({
    name: monster.name,
    nameLower: monster.name.toLowerCase(),
    hp: monster.hp,
    ac: monster.ac
  }));
  let selectedMonster = null;

  function updateSuggestions(term) {
    if (typeSelect?.value !== 'monster' || !term) {
      monsterSuggestions.innerHTML = '';
      if (monsterSuggestions) monsterSuggestions.style.display = 'none';
      return;
    }
    const matches = monstersIndex
      .filter((m) => m.nameLower.includes(term.toLowerCase()))
      .slice(0, 6);
    if (monsterSuggestions) {
      if (matches.length === 0) {
        monsterSuggestions.innerHTML = '<li>No matches</li>';
        monsterSuggestions.style.display = 'flex';
        return;
      }
      monsterSuggestions.innerHTML = matches
        .map((m) => `<li data-name="${m.name}">${m.name}</li>`)
        .join('');
      monsterSuggestions.style.display = 'flex';
    }
  }

  function clearMonsterSelection() {
    selectedMonster = null;
    acInput.value = '';
    if (monsterSuggestions) {
      monsterSuggestions.innerHTML = '';
      monsterSuggestions.style.display = 'none';
    }
  }

  typeSelect?.addEventListener('change', () => {
    if (typeSelect.value !== 'monster') {
      clearMonsterSelection();
      initHPInput.value = '';
      acInput.value = '';
    }
    initInput.value = '';
  });

  monsterSuggestions?.addEventListener('click', (event) => {
    const li = event.target.closest('li');
    if (!li || typeSelect?.value !== 'monster') return;
    const match = monstersIndex.find((m) => m.name === li.dataset.name);
    if (!match) return;
    selectedMonster = match;
    initInput.value = match.name;
    initHPInput.value = match.hp;
    acInput.value = match.ac;
    monsterSuggestions.innerHTML = '';
    monsterSuggestions.style.display = 'none';
  });

  function createInitRow(name, type, hp, ac = '') {
    const li = document.createElement('li');
    li.className = 'init-item';
    li.dataset.type = type;
    li.dataset.hp = Number(hp) || 0;
    li.draggable = true;

    const main = document.createElement('div');
    main.className = 'init-main';

    const labelWrap = document.createElement('div');
    labelWrap.className = 'init-title';

    const label = document.createElement('span');
    label.className = 'init-name';
    label.textContent = name;

    const typeBadge = document.createElement('span');
    typeBadge.className = 'init-type';
    typeBadge.textContent = type === 'hero' ? 'Hero' : 'Monster';

    const acBadge = document.createElement('span');
    acBadge.className = 'init-ac-badge';
    acBadge.textContent = ac ? `AC ${ac}` : 'AC —';

    const hpControls = document.createElement('div');
    hpControls.className = 'hp-controls';

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.className = 'hp-btn';
    minusBtn.textContent = '−';
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setHP(li, hpInput, (Number(li.dataset.hp) || 0) - 1);
    });

    const hpInput = document.createElement('input');
    hpInput.type = 'number';
    hpInput.className = 'init-hp';
    hpInput.value = hp || '';
    hpInput.addEventListener('click', (e) => e.stopPropagation());
    hpInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      adjustHP(li, hpInput);
    });
    hpInput.addEventListener('blur', () => {
      const next = parseHPInput(hpInput.value, Number(li.dataset.hp) || 0);
      if (next === null) {
        hpInput.value = li.dataset.hp;
        hpDisplay.textContent = `HP: ${li.dataset.hp}`;
        return;
      }
      setHP(li, hpInput, next);
    });

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'hp-btn';
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setHP(li, hpInput, (Number(li.dataset.hp) || 0) + 1);
    });

    hpControls.appendChild(minusBtn);
    hpControls.appendChild(hpInput);
    hpControls.appendChild(plusBtn);

    const hpDisplay = document.createElement('span');
    hpDisplay.className = 'init-hp-display';
    hpDisplay.textContent = `HP: ${li.dataset.hp}`;

    labelWrap.appendChild(label);
    labelWrap.appendChild(typeBadge);
    labelWrap.appendChild(acBadge);
    labelWrap.appendChild(hpDisplay);

    main.appendChild(labelWrap);
    main.appendChild(hpControls);

    const meta = document.createElement('div');
    meta.className = 'init-meta';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'init-remove';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => li.remove());

    meta.appendChild(removeBtn);

    li.appendChild(main);
    li.appendChild(meta);

    addDragHandlers(li);
    return li;
  }

  function setHP(li, hpInput, next) {
    li.dataset.hp = next;
    hpInput.value = next;
    const display = li.querySelector('.init-hp-display');
    if (display) display.textContent = `HP: ${next}`;
    if (next <= 0 && li.dataset.type === 'monster') {
      li.remove();
    }
  }

  function parseHPInput(raw, current) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
      const delta = Number(trimmed);
      if (Number.isFinite(delta)) return current + delta;
    }

    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) return asNumber;

    if (/^[0-9+\-*/().\s]+$/.test(trimmed)) {
      try {
        // eslint-disable-next-line no-new-func
        const val = Function(`"use strict"; return (${trimmed});`)();
        if (Number.isFinite(val)) return val;
      } catch (err) {
        return null;
      }
    }

    return null;
  }

  function adjustHP(li, hpInput) {
    const raw = hpInput.value;
    const current = Number(li.dataset.hp) || 0;
    const next = parseHPInput(raw, current);
    if (next === null) return;
    setHP(li, hpInput, next);
  }

  function addInitiative() {
    const name = initInput?.value.trim();
    if (!name) return;
    const type = typeSelect?.value || 'hero';
    let hpValue = Number(initHPInput?.value) || 0;
    let acValue = '';
    if (type === 'monster') {
      if (!selectedMonster) return;
      hpValue = Number(selectedMonster.hp) || hpValue;
      acValue = selectedMonster.ac || '';
    }
    const row = createInitRow(name, type, hpValue, acValue);
    initList?.appendChild(row);
    initInput.value = '';
    if (type === 'monster') {
      initHPInput.value = hpValue;
      clearMonsterSelection();
      acInput.value = '';
    } else {
      initHPInput.value = '';
    }
    initInput.focus();
  }

  function clearInitiative() {
    if (!initList) return;
    initList.querySelectorAll('.init-item[data-type="monster"]').forEach((li) => li.remove());
    initInput?.focus();
  }

  function handleNameInput() {
    if (typeSelect?.value !== 'monster') return;
    const term = (initInput.value || '').trim();
    if (!term) {
      clearMonsterSelection();
      return;
    }
    selectedMonster = null;
    acInput.value = '';
    updateSuggestions(term);
  }

  initAdd?.addEventListener('click', addInitiative);
  initClear?.addEventListener('click', clearInitiative);
  initInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInitiative();
    }
  });
  initInput?.addEventListener('input', handleNameInput);

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
