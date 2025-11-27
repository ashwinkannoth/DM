(() => {
  const ALIGNMENT_MAP = {
    LG: 'Lawful Good',
    NG: 'Neutral Good',
    CG: 'Chaotic Good',
    LN: 'Lawful Neutral',
    N: 'True Neutral',
    CN: 'Chaotic Neutral',
    LE: 'Lawful Evil',
    NE: 'Neutral Evil',
    CE: 'Chaotic Evil',
    U: 'Unaligned',
    ANY: 'Any Alignment',
    'ANY EVIL': 'Any Evil Alignment'
  };

  const tableBody = document.querySelector('#monsterTable tbody');
  const headers = document.querySelectorAll('#monsterTable thead th');
  const searchInput = document.getElementById('monsterSearch');
  const status = document.getElementById('manualStatus');
  const suggestionNode = document.getElementById('manualSuggestion');

  const columns = [
    'name',
    'size',
    'type',
    'align_label',
    'ac',
    'hp',
    'speeds',
    'str',
    'dex',
    'con',
    'int',
    'wis',
    'cha',
    'cr',
    'sav_throws',
    'skills',
    'senses',
    'languages',
    'additional'
  ];

  let currentSort = { field: 'cr', direction: -1 };
  const dataset = (window.MONSTERS || []).map((monster) => ({
    ...monster,
    align_label: ALIGNMENT_MAP[monster.align] || monster.align
  }));
  let filtered = dataset.slice();

  const names = dataset.map((monster) => monster.name.toLowerCase());

  function token(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return value;
    return String(value).toLowerCase();
  }

  function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[b.length][a.length];
  }

  function bestSuggestion(term) {
    if (!term) return '';
    const normalized = term.toLowerCase();
    let best = '';
    let bestDist = Infinity;
    names.forEach((entry) => {
      const distance = levenshtein(normalized, entry);
      if (distance < bestDist) {
        bestDist = distance;
        best = entry;
      }
    });
    if (bestDist <= Math.max(1, normalized.length * 0.4) && best !== normalized) {
      return best;
    }
    return '';
  }

  function renderTable(rows) {
    tableBody.innerHTML = '';
    rows.forEach((monster) => {
      const tr = document.createElement('tr');
      tr.innerHTML = columns.map((field) => `<td>${monster[field] ?? ''}</td>`).join('');
      tableBody.appendChild(tr);
    });
    status.textContent = `Showing ${rows.length} of ${dataset.length} creatures`;
  }

  function compareBy(field, direction, a, b) {
    const av = token(a[field]);
    const bv = token(b[field]);
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * direction;
    }
    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return 0;
  }

  function sortAndRender() {
    const rows = filtered.slice().sort((a, b) =>
      compareBy(currentSort.field, currentSort.direction, a, b)
    );
    renderTable(rows);
    headers.forEach((th) => {
      const indicator = th.querySelector('.sort-indicator');
      if (!indicator) return;
      indicator.textContent = th.dataset.field === currentSort.field
        ? (currentSort.direction === 1 ? '▲' : '▼')
        : '';
    });
  }

  function updateSuggestion(term) {
    const suggestion = bestSuggestion(term);
    suggestionNode.textContent = suggestion ? `Did you mean "${suggestion}"?` : '';
  }

  function applyFilters() {
    const term = (searchInput.value || '').trim().toLowerCase();
    filtered = dataset.filter((monster) => {
      if (!term) return true;
      return monster.name.toLowerCase().includes(term);
    });
    updateSuggestion(term && filtered.length === 0 ? term : '');
    sortAndRender();
  }

  headers.forEach((th) => {
    th.addEventListener('click', () => {
      const field = th.dataset.field;
      if (!field) return;
      if (currentSort.field === field) {
        currentSort.direction = -currentSort.direction;
      } else {
        currentSort.field = field;
        currentSort.direction = -1;
      }
      sortAndRender();
    });
  });

  searchInput.addEventListener('input', applyFilters);

  applyFilters();
})();
