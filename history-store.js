const HISTORY_KEY = 'zipSearchHistory';
const SELECTED_ADDRESS_KEY = 'zipSelectedAddress';

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function addSearchHistory(zipcode, results) {
  const history = getSearchHistory();
  history.unshift({ zipcode, results, timestamp: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

function setSelectedAddress(address) {
  sessionStorage.setItem(SELECTED_ADDRESS_KEY, address);
}

function takeSelectedAddress() {
  const address = sessionStorage.getItem(SELECTED_ADDRESS_KEY);
  sessionStorage.removeItem(SELECTED_ADDRESS_KEY);
  return address;
}
