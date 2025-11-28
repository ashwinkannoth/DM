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
  const typeRadios = document.querySelectorAll('input[name="initType"]');
  const heroACWrapper = document.getElementById('heroACWrapper');
  const monsterACWrapper = document.getElementById('monsterACWrapper');
  const monsterACValue = document.getElementById('monsterACValue');
  const heroACInput = document.getElementById('initHeroAC');
  const initInput = document.getElementById('initName');
  const initHPInput = document.getElementById('initHP');
  const initAdd = document.getElementById('initAdd');
  const initClear = document.getElementById('initClear');
  const monsterSuggestions = document.getElementById('monsterSuggestions');
  const initList = document.getElementById('initList');
  let draggedItem = null;
  let selectedMonster = null;

  const monstersIndex = [];
  const monsterDataPromise = window.fetchMonstersFromExcel ? window.fetchMonstersFromExcel() : Promise.resolve([]);
  monsterDataPromise.then((data) => {
    data.forEach((m) => {
      const hpNum = Number(m.hp);
      const acNum = Number(m.ac);
      monstersIndex.push({
        name: m.name,
        nameLower: (m.name || '').toLowerCase(),
        hp: Number.isFinite(hpNum) ? hpNum : m.hp,
        ac: Number.isFinite(acNum) ? acNum : m.ac,
      });
    });
  }).catch(() => {});

  function currentType() {
    const checked = [...typeRadios].find((r) => r.checked);
    return checked ? checked.value : 'hero';
  }

  function renderTypeUI() {
    const type = currentType();
    if (type === 'monster') {
      if (heroACWrapper) heroACWrapper.style.display = 'none';
      if (monsterACWrapper) monsterACWrapper.style.display = 'flex';
      monsterACValue.textContent = 'AC —';
      if (heroACInput) heroACInput.value = '';
    } else {
      if (heroACWrapper) heroACWrapper.style.display = 'flex';
      if (monsterACWrapper) monsterACWrapper.style.display = 'none';
      monsterACValue.textContent = 'AC —';
      selectedMonster = null;
    }
    if (monsterSuggestions) {
      monsterSuggestions.innerHTML = '';
      monsterSuggestions.style.display = 'none';
    }
  }

  function createInitRow(name, type, hp, acValue = '') {
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
    acBadge.textContent = acValue ? `AC ${acValue}` : 'AC —';

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

  function addHero() {
    const name = initInput?.value.trim();
    if (!name) return;
    const hpValue = Number(initHPInput?.value) || 0;
    const acValue = heroACInput?.value || '';
    const row = createInitRow(name, 'hero', hpValue, acValue);
    initList?.appendChild(row);
    initInput.value = '';
    initHPInput.value = '';
    if (heroACInput) heroACInput.value = '';
    initInput.focus();
  }

  function addMonster() {
    const term = (initInput?.value || '').trim().toLowerCase();
    if (!term) return;
    const matches = monstersIndex.filter((m) => m.nameLower.startsWith(term));
    if (matches.length === 0) return;
    const picked = matches[0];
    const hpValue = Number(picked.hp) || 0;
    const acValue = picked.ac || '';
    const row = createInitRow(picked.name, 'monster', hpValue, acValue);
    initList?.appendChild(row);
    initInput.value = '';
    initHPInput.value = '';
    monsterACValue.textContent = 'AC —';
    selectedMonster = null;
    if (monsterSuggestions) {
      monsterSuggestions.innerHTML = '';
      monsterSuggestions.style.display = 'none';
    }
  }

  function clearInitiative() {
    if (!initList) return;
    initList.querySelectorAll('.init-item[data-type="monster"]').forEach((li) => li.remove());
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

  typeRadios.forEach((radio) => radio.addEventListener('change', renderTypeUI));

  initAdd?.addEventListener('click', () => {
    if (currentType() === 'monster') addMonster();
    else addHero();
  });
  initClear?.addEventListener('click', clearInitiative);
  initInput?.addEventListener('input', () => {
    if (currentType() !== 'monster') return;
    const term = initInput.value.trim();
    if (!term) {
      selectedMonster = null;
      if (monsterSuggestions) {
        monsterSuggestions.innerHTML = '';
        monsterSuggestions.style.display = 'none';
      }
      return;
    }
    const matches = monstersIndex.filter((m) => m.nameLower.startsWith(term.toLowerCase())).slice(0, 8);
    if (monsterSuggestions) {
      if (matches.length === 0) {
        monsterSuggestions.innerHTML = '<li>No matches</li>';
        monsterSuggestions.style.display = 'flex';
      } else {
        monsterSuggestions.innerHTML = matches.map((m) => `<li data-name="${m.name}">${m.name}</li>`).join('');
        monsterSuggestions.style.display = 'flex';
      }
    }
  });

  monsterSuggestions?.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const match = monstersIndex.find((m) => m.name === li.dataset.name);
    if (!match) return;
    selectedMonster = match;
    initInput.value = match.name;
    initHPInput.value = match.hp;
    monsterACValue.textContent = match.ac ? `AC ${match.ac}` : 'AC —';
    monsterSuggestions.innerHTML = '';
    monsterSuggestions.style.display = 'none';
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

  renderTypeUI();
// initial state — load both lists and show page
  showChooser(false);
  showTrackSection(true);
  loadBoth();
});
