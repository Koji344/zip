const PASSWORD_HASH = '$2y$10$Qz7vNzMxiEDgeKiNIpdGV.18dTrL9wVdj8rHPjBYgQt.hcaw1XBiq';
const UNLOCK_KEY = 'zipUnlocked';

const lockScreen = document.getElementById('lock-screen');
const appContent = document.getElementById('app-content');
const lockForm = document.getElementById('lock-form');
const lockPassword = document.getElementById('lock-password');
const lockMessage = document.getElementById('lock-message');
const logoutBtn = document.getElementById('logout-btn');

function unlock() {
  lockScreen.hidden = true;
  appContent.hidden = false;
}

function lock() {
  sessionStorage.removeItem(UNLOCK_KEY);
  lockPassword.value = '';
  lockMessage.hidden = true;
  appContent.hidden = true;
  lockScreen.hidden = false;
}

if (sessionStorage.getItem(UNLOCK_KEY) === '1') {
  unlock();
}

logoutBtn.addEventListener('click', lock);

lockForm.addEventListener('submit', (e) => {
  e.preventDefault();
  lockMessage.hidden = true;

  const submitBtn = lockForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  dcodeIO.bcrypt.compare(lockPassword.value, PASSWORD_HASH, (err, isMatch) => {
    submitBtn.disabled = false;

    if (err || !isMatch) {
      lockMessage.textContent = 'パスワードが違います。';
      lockMessage.hidden = false;
      return;
    }

    sessionStorage.setItem(UNLOCK_KEY, '1');
    unlock();
  });
});
