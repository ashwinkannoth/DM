document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('trackList');
  const player = document.getElementById('player');
  let currentItem = null;

  async function loadTracks() {
    try {
      const res = await fetch('/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      const tracks = await res.json();
      renderTracks(tracks);
    } catch (err) {
      list.innerHTML = `<li class="error">${err.message}</li>`;
    }
  }

  function renderTracks(tracks) {
    if (!tracks || tracks.length === 0) {
      list.innerHTML = '<li class="empty">No audio files found in /music — drop MP3s into the music folder.</li>';
      return;
    }

    list.innerHTML = '';
    tracks.forEach((filename) => {
      const li = document.createElement('li');
      li.className = 'trackItem';
      const btn = document.createElement('button');
      btn.textContent = filename;
      btn.addEventListener('click', () => playTrack(filename, li));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function playTrack(filename, li) {
    const url = '/music/' + encodeURIComponent(filename);
    player.src = url;
    player.play().catch(() => {
      // autoplay might be blocked by the browser; user can press play
    });

    if (currentItem) currentItem.classList.remove('current');
    li.classList.add('current');
    currentItem = li;
  }

  loadTracks();
});
