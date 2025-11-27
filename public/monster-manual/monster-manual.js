(() => {
  const tableBody = document.querySelector('#monsterTable tbody');
  const headers = document.querySelectorAll('#monsterTable thead th');
  const searchInput = document.getElementById('monsterSearch');
  const status = document.getElementById('manualStatus');

  const columns = [
    'name',
    'size',
    'type',
    'align',
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
  const dataset = window.MONSTERS || [];
  let filtered = dataset.slice();

  function token(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return value;
    return String(value).toLowerCase();
  }

  function compareBy(field, direction, a, b) {
    const rawA = a[field];
    const rawB = b[field];
    const aNum = typeof rawA === 'number' ? rawA : parseFloat(rawA);
    const bNum = typeof rawB === 'number' ? rawB : parseFloat(rawB);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return (aNum - bNum) * direction;
    }
    const av = token(rawA);
    const bv = token(rawB);
    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return 0;
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

  function applyFilters() {
    const term = (searchInput.value || '').trim().toLowerCase();
    filtered = dataset.filter((monster) => {
      if (!term) return true;
      return columns.some((field) =>
        token(monster[field]).includes(term)
      );
    });
    sortAndRender();
  }

  function sortAndRender() {
    const rows = filtered.slice().sort((a, b) =>
      compareBy(currentSort.field, currentSort.direction, a, b)
    );
    renderTable(rows);
    headers.forEach((th) => {
      const indicator = th.querySelector('.sort-indicator');
      if (!indicator) return;
      if (th.dataset.field === currentSort.field) {
        indicator.textContent = currentSort.direction === 1 ? '▲' : '▼';
      } else {
        indicator.textContent = '';
      }
    });
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

  searchInput.addEventListener('input', () => applyFilters());

  applyFilters();
})();
