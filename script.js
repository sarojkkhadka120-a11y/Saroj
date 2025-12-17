(function () {
  const wrapper = document.getElementById("lensStripWrapper");
  const strip = document.getElementById("lensStrip");

  if (!wrapper || !strip) return;

  // Duplicate cards so the loop looks seamless
  strip.innerHTML += strip.innerHTML;

  let scrollPos = 0;
  const speed = 0.3; // pixels per frame (slow)
  let paused = false;

  function step() {
    if (!paused) {
      // LEFT → RIGHT scrolling: decrease "virtual" position
      scrollPos -= speed;

      const halfWidth = strip.scrollWidth / 2;
      if (scrollPos <= -halfWidth) {
        scrollPos = 0;
      }

      wrapper.scrollLeft = -scrollPos;
    }
    requestAnimationFrame(step);
  }

  wrapper.addEventListener("mouseenter", () => {
    paused = true;
  });

  wrapper.addEventListener("mouseleave", () => {
    paused = false;
  });

  requestAnimationFrame(step);
})();

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.querySelector(".nav__links");

  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.classList.remove("is-open");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.toggle("is-open");
    menu.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close when clicking a link
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });

  // Close if clicking outside
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });
});

