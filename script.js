const form = document.getElementById('zip-form');
const input = document.getElementById('zipcode');
const messageEl = document.getElementById('message');
const resultArea = document.getElementById('result-area');
const addressSection = document.getElementById('address-section');
const addressInput = document.getElementById('address-input');
const banchiInput = document.getElementById('banchi-input');
const mapBtn = document.getElementById('map-btn');

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  messageEl.hidden = false;
}

function clearMessage() {
  messageEl.hidden = true;
  messageEl.textContent = '';
}

function useAddress(address) {
  addressInput.value = address;
  addressSection.hidden = false;
  addressInput.focus();
}

async function fetchAreaSummary(pref, city) {
  const candidates = [city, `${city} (${pref})`, pref];

  for (const title of candidates) {
    try {
      const res = await fetch(`https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.type === 'disambiguation' || !data.extract) continue;
      return { title: data.title, extract: data.extract };
    } catch (err) {
      continue;
    }
  }
  return null;
}

function truncate(text, max) {
  const chars = Array.from(text);
  return chars.length > max ? chars.slice(0, max).join('') + '…' : text;
}

function loadAreaInfo(infoEl, pref, city) {
  infoEl.textContent = '地域情報を取得中...';
  infoEl.classList.add('area-info-loading');

  fetchAreaSummary(pref, city).then((summary) => {
    infoEl.classList.remove('area-info-loading');
    if (!summary) {
      infoEl.textContent = '地域情報が見つかりませんでした。';
      return;
    }
    infoEl.textContent = truncate(summary.extract, 300);
  });
}

function renderResults(results) {
  resultArea.innerHTML = '';
  results.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'result-item';

    const address = `${r.pref}${r.city}${r.town}`;

    const addrEl = document.createElement('div');
    addrEl.className = 'result-address';
    addrEl.textContent = address;

    const kanaEl = document.createElement('div');
    kanaEl.className = 'result-kana';
    kanaEl.textContent = r.kana;

    const infoEl = document.createElement('div');
    infoEl.className = 'area-info';
    loadAreaInfo(infoEl, r.pref, r.city);

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';

    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = 'use-btn';
    useBtn.textContent = 'この住所を使う';
    useBtn.addEventListener('click', () => useAddress(address));

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '住所をコピー';
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(address);
      copyBtn.textContent = 'コピーしました！';
      setTimeout(() => (copyBtn.textContent = '住所をコピー'), 1500);
    });

    btnRow.appendChild(useBtn);
    btnRow.appendChild(copyBtn);

    item.appendChild(addrEl);
    item.appendChild(kanaEl);
    item.appendChild(infoEl);
    item.appendChild(btnRow);
    resultArea.appendChild(item);
  });

  if (results.length === 1) {
    useAddress(`${results[0].pref}${results[0].city}${results[0].town}`);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  resultArea.innerHTML = '';
  addressSection.hidden = true;

  const zipcode = input.value.replace(/[^0-9]/g, '');
  if (zipcode.length !== 7) {
    showMessage('郵便番号は7桁の数字で入力してください。', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  showMessage('検索中...', 'info');

  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
    const data = await res.json();

    if (data.status !== 200 || !data.results) {
      showMessage((data.message) || '該当する住所が見つかりませんでした。', 'error');
      return;
    }

    clearMessage();
    const results = data.results.map((r) => ({
      zipcode: r.zipcode,
      pref: r.address1,
      city: r.address2,
      town: r.address3,
      kana: r.kana1 + r.kana2 + r.kana3,
    }));
    addSearchHistory(zipcode, results);
    renderResults(results);
  } catch (err) {
    showMessage('通信エラーが発生しました。', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

input.addEventListener('input', () => {
  input.value = input.value.replace(/[^0-9-]/g, '');
});

mapBtn.addEventListener('click', () => {
  const fullAddress = `${addressInput.value}${banchiInput.value}`.trim();
  if (!fullAddress) {
    showMessage('住所を入力してください。', 'error');
    return;
  }

  const query = encodeURIComponent(fullAddress);
  const link = document.createElement('a');
  link.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
});

const selectedAddress = takeSelectedAddress();
if (selectedAddress) {
  useAddress(selectedAddress);
}
