(function () {
  const wrapper = document.getElementById("lensStripWrapper");
  const strip = document.getElementById("lensStrip");
  if (!wrapper || !strip) return;

  // Duplicate for seamless loop
  strip.innerHTML += strip.innerHTML;

  let x = 0;
  const speed = 0.35; // px per frame (try 0.25–0.5)
  let paused = false;

  function step() {
    if (!paused) {
      x -= speed;

      const half = strip.scrollWidth / 2;
      if (-x >= half) x = 0;

      // ✅ GPU-friendly animation
      strip.style.transform = `translate3d(${x}px, 0, 0)`;
    }
    requestAnimationFrame(step);
  }

  wrapper.addEventListener("mouseenter", () => (paused = true));
  wrapper.addEventListener("mouseleave", () => (paused = false));

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

// --- CASE STUDY CARDS: open PDF only when clicking the card background ---
document.querySelectorAll(".case-card").forEach((card) => {
  card.addEventListener("click", (e) => {
    const pdfFile = card.dataset.pdf;
    if (!pdfFile) return;

    const page = card.dataset.page || 1;
    const pdfUrl = `${pdfFile}#page=${page}`;

    window.open(pdfUrl, "_blank");
  });
});

// ✅ Allow buttons inside case cards to work independently
document.querySelectorAll(".fw-overlay a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.stopPropagation();
  });
});

document.querySelectorAll(".fw-overlay a").forEach((link) => {
  link.addEventListener("click", (e) => e.stopPropagation());
});



// ✅ Allow buttons inside case cards to work independently
document.querySelectorAll(".fw-overlay a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.stopPropagation(); // 🚨 THIS is the magic line
  });
});


document.querySelectorAll(".fw-overlay a").forEach((link) => {
  link.addEventListener("click", (e) => e.stopPropagation());
});


document.addEventListener("DOMContentLoaded", () => {
  // 1) Make case-card open PDF in new tab ONLY when clicking the card (not the buttons)
  document.querySelectorAll(".case-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // ✅ If user clicked any link/button inside overlay, let the link do its job
      if (e.target.closest("a")) return;

      const pdfFile = card.dataset.pdf;
      if (!pdfFile) return; // ✅ Coming soon cards do nothing

      const page = card.dataset.page || 1;
      const pdfUrl = `${pdfFile}#page=${page}`;

      window.open(pdfUrl, "_blank", "noopener");
    });
  });

  // 2) Optional safety: prevent clicks on COMING SOON spans from doing anything
  document.querySelectorAll(".fw-cta.is-disabled").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
});

// ✅ Prevent case-card click handlers from hijacking CTA clicks
document.addEventListener("click", (e) => {
  // If user clicked a real link button inside overlay, let it open normally
  const ctaLink = e.target.closest(".fw-overlay a.fw-cta");
  if (ctaLink) {
    e.stopPropagation(); // stops card click listeners
    return;
  }

  // If user clicked "COMING SOON", do nothing
  const comingSoon = e.target.closest(".fw-overlay .fw-cta.is-disabled");
  if (comingSoon) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
}, true); // ✅ capture phase (runs before other click listeners)
