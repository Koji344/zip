const menuBtn = document.getElementById('menu-btn');
const navMenu = document.getElementById('nav-menu');

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !navMenu.hidden;
  navMenu.hidden = isOpen;
  menuBtn.setAttribute('aria-expanded', String(!isOpen));
});

document.addEventListener('click', (e) => {
  if (!navMenu.hidden && !navMenu.contains(e.target) && e.target !== menuBtn) {
    navMenu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  }
});

document.querySelectorAll('.nav-link').forEach((link) => {
  if (link.getAttribute('href') === location.pathname.split('/').pop()) {
    link.classList.add('nav-link-active');
  }
});
