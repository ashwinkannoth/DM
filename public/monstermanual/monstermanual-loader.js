(function(){
  const MONSTER_XLSX_URL = '/monstermanual/MM.xlsx';

  async function fetchMonstersFromExcel() {
    const res = await fetch(MONSTER_XLSX_URL);
    if (!res.ok) throw new Error('Failed to load monster manual');
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.map((r) => ({
      name: r['Name'] || '',
      ac: Number(r['AC']) || '',
      hp: r['HP'],
      size: r['Size'] || '',
      type: r['Type'] || '',
      align: r['Align.'] || '',
    })).filter((r) => r.name);
  }

  window.fetchMonstersFromExcel = fetchMonstersFromExcel;
})();
