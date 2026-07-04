const form = document.getElementById('keyword-form');
const input = document.getElementById('keyword');
const messageEl = document.getElementById('message');
const resultArea = document.getElementById('result-area');

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  messageEl.hidden = false;
}

function clearMessage() {
  messageEl.hidden = true;
  messageEl.textContent = '';
}

function renderResults(results, { truncated, hasOsmResults } = {}) {
  resultArea.innerHTML = '';

  if (truncated) {
    const note = document.createElement('p');
    note.className = 'message info';
    note.textContent = '該当件数が多いため、一部のみ表示しています。キーワードをより詳しくしてください。';
    resultArea.appendChild(note);
  }

  results.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'result-item';

    const zipEl = document.createElement('div');
    zipEl.className = 'result-address';
    zipEl.textContent = `〒${r.zipcode}`;

    const addrEl = document.createElement('div');
    addrEl.className = 'result-sub';
    addrEl.textContent = r.address;

    const kanaEl = document.createElement('div');
    kanaEl.className = 'result-kana';
    kanaEl.textContent = r.kana;

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';

    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = 'use-btn';
    useBtn.textContent = 'この住所を使う';
    useBtn.addEventListener('click', () => {
      setSelectedAddress(r.address);
      location.href = 'index.html';
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '郵便番号をコピー';
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(r.zipcode);
      copyBtn.textContent = 'コピーしました！';
      setTimeout(() => (copyBtn.textContent = '郵便番号をコピー'), 1500);
    });

    btnRow.appendChild(useBtn);
    btnRow.appendChild(copyBtn);

    item.appendChild(zipEl);
    item.appendChild(addrEl);
    if (r.kana) item.appendChild(kanaEl);
    item.appendChild(btnRow);
    resultArea.appendChild(item);
  });

  if (hasOsmResults) {
    const attribution = document.createElement('p');
    attribution.className = 'osm-attribution';
    attribution.textContent = '施設・会社名の情報: © OpenStreetMap contributors';
    resultArea.appendChild(attribution);
  }
}

async function fetchByKeyword(term) {
  try {
    const res = await fetch(`https://geoapi.heartrails.com/api/json?method=suggest&matching=like&keyword=${encodeURIComponent(term)}`);
    const data = await res.json();
    if (data.response.error || !data.response.location) return [];
    return data.response.location.map((r) => ({
      zipcode: r.postal,
      address: `${r.prefecture}${r.city}${r.town}`,
      kana: `${r.city_kana}${r.town_kana}`,
      source: 'zip',
    }));
  } catch (err) {
    return [];
  }
}

async function fetchAddressMatches(terms) {
  const resultSets = await Promise.all(terms.map(fetchByKeyword));

  // A broad term (e.g. a big city name) can get capped at 100 results by the
  // API, which would drop true matches before they ever reach the
  // intersection. So use the smallest (least likely truncated) result set
  // as the base, and check the other terms as plain substrings of the
  // candidate's own address text instead of requiring API-set membership.
  let baseIndex = 0;
  for (let i = 1; i < resultSets.length; i++) {
    if (resultSets[i].length < resultSets[baseIndex].length) baseIndex = i;
  }

  const otherTerms = terms.filter((_, i) => i !== baseIndex);
  const results = resultSets[baseIndex].filter((r) => {
    const haystack = `${r.address}${r.kana}`;
    return otherTerms.every((term) => haystack.includes(term));
  });

  return { results, truncated: resultSets[baseIndex].length >= 100 };
}

async function fetchCompanyMatches(keyword) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=jp&limit=10&q=${encodeURIComponent(keyword)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    return data
      .filter((r) => r.address && r.address.postcode)
      .map((r) => {
        const a = r.address;
        const poiName = a.office || a.commercial || a.shop || a.amenity || a.building || r.name || '';
        const area = [a.province, a.city || a.town || a.county, a.suburb, a.neighbourhood].filter(Boolean).join('');
        return {
          zipcode: a.postcode.replace(/-/g, ''),
          address: [area, poiName].filter(Boolean).join(poiName ? ' ' : ''),
          kana: '',
          source: 'osm',
        };
      });
  } catch (err) {
    return [];
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  resultArea.innerHTML = '';

  const rawKeyword = input.value.trim();
  const terms = rawKeyword.split(/[,、\s]+/u).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) {
    showMessage('キーワードを入力してください。', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  showMessage('検索中...', 'info');

  try {
    const [addressMatch, companyResults] = await Promise.all([
      fetchAddressMatches(terms),
      fetchCompanyMatches(terms.join(' ')),
    ]);

    const seen = new Set();
    const results = [...addressMatch.results, ...companyResults].filter((r) => {
      const key = `${r.zipcode}|${r.address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (results.length === 0) {
      showMessage('該当する場所が見つかりませんでした。', 'error');
      return;
    }

    clearMessage();
    renderResults(results, {
      truncated: addressMatch.truncated,
      hasOsmResults: companyResults.length > 0,
    });
  } catch (err) {
    showMessage('通信エラーが発生しました。', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
