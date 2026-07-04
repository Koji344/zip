const historyArea = document.getElementById('history-area');
const emptyMessage = document.getElementById('empty-message');
const clearHistoryBtn = document.getElementById('clear-history-btn');

function formatTimestamp(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderHistory() {
  const history = getSearchHistory();
  historyArea.innerHTML = '';

  if (history.length === 0) {
    emptyMessage.hidden = false;
    clearHistoryBtn.hidden = true;
    return;
  }

  emptyMessage.hidden = true;
  clearHistoryBtn.hidden = false;

  history.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'history-entry';

    const headerEl = document.createElement('div');
    headerEl.className = 'history-entry-header';
    headerEl.textContent = `〒${entry.zipcode} — ${formatTimestamp(entry.timestamp)}`;
    card.appendChild(headerEl);

    entry.results.forEach((r) => {
      const address = `${r.pref}${r.city}${r.town}`;

      const item = document.createElement('div');
      item.className = 'result-item';

      const addrEl = document.createElement('div');
      addrEl.className = 'result-address';
      addrEl.textContent = address;

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
        setSelectedAddress(address);
        location.href = 'index.html';
      });

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
      item.appendChild(btnRow);
      card.appendChild(item);
    });

    historyArea.appendChild(card);
  });
}

clearHistoryBtn.addEventListener('click', () => {
  clearSearchHistory();
  renderHistory();
});

renderHistory();
