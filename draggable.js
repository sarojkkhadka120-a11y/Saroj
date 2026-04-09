// draggable.js – Premium Physics Draggable Hero
// Features: auto-save/restore, bouncy ball physics, momentum, wall bounce, smooth damping

document.addEventListener('DOMContentLoaded', () => {
  const draggableSelector = '.hero-layer, .hero-avatar';
  const containerSelector = '.hero-canvas';

  const container = document.querySelector(containerSelector);
  const draggables = document.querySelectorAll(draggableSelector);

  if (!container || draggables.length === 0) return;

  // ── Configuration ──────────────────────────────────────────────
  const PHYSICS = {
    friction: 0.92,          // velocity damping per frame (0.90 = floaty, 0.96 = icy)
    bounceFriction: 0.55,    // energy retained on wall bounce (0 = dead stop, 1 = perfect bounce)
    minVelocity: 0.3,        // stop simulating below this speed
    bounceScale: 1.08,       // scale pop on wall collision
    bounceScaleDuration: 150, // ms for bounce scale animation
    dragScale: 1.06,         // scale while dragging
    velocitySamples: 5,      // number of pointer samples for release velocity
    velocityMultiplier: 8,   // amplify release velocity for satisfying momentum
    maxVelocity: 40,         // cap velocity to prevent elements from flying off
    springiness: 0.25,       // how much the element "squishes" on bounce (0 = none)
  };

  // Disable drag on very small screens
  function isScreenTooSmall() {
    return window.innerWidth < 375;
  }

  // ── Unique ID helper ─────────────────────────────────────────
  function getElementId(el) {
    const classList = Array.from(el.classList);
    const uniqueClass = classList.find(c => c.startsWith('hero-layer--') || c === 'hero-avatar');
    return uniqueClass || classList.join('-');
  }

  // ── Physics state per element ────────────────────────────────
  const physicsState = new Map();

  function initPhysicsState(el) {
    physicsState.set(el, {
      vx: 0,
      vy: 0,
      animating: false,
      pointerHistory: [],    // { x, y, time } samples for velocity calculation
    });
  }

  // ── Save / Restore positions ─────────────────────────────────
  function savePosition(el) {
    const id = getElementId(el);
    if (!id) return;
    const x = parseFloat(el.getAttribute('data-x')) || 0;
    const y = parseFloat(el.getAttribute('data-y')) || 0;
    localStorage.setItem('hero-pos-' + id, JSON.stringify({ x, y }));
  }

  function restorePositions() {
    draggables.forEach(el => {
      const computedTransform = window.getComputedStyle(el).transform;
      const baseTransform = computedTransform !== 'none' ? computedTransform : '';
      el.setAttribute('data-base-transform', baseTransform);

      const id = getElementId(el);
      if (!id) return;

      const saved = localStorage.getItem('hero-pos-' + id);
      if (saved) {
        try {
          const { x, y } = JSON.parse(saved);
          if (typeof x === 'number' && typeof y === 'number') {
            el.setAttribute('data-x', x);
            el.setAttribute('data-y', y);
            el.style.transform = `${baseTransform} translate(${x}px, ${y}px)`;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      initPhysicsState(el);
    });
  }

  restorePositions();

  // ── Boundary helpers ─────────────────────────────────────────
  function getContainerBounds() {
    return container.getBoundingClientRect();
  }

  function getElementBounds(el) {
    // Use the original (non-translated) dimensions
    return {
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
  }

  function clampPosition(el, x, y) {
    const cRect = getContainerBounds();
    const eSize = getElementBounds(el);

    // Calculate max drag offset from original CSS position
    const elRect = el.getBoundingClientRect();
    const currentX = parseFloat(el.getAttribute('data-x')) || 0;
    const currentY = parseFloat(el.getAttribute('data-y')) || 0;

    // Element's original position (without drag offset)
    const origLeft = elRect.left - cRect.left - currentX;
    const origTop = elRect.top - cRect.top - currentY;

    const minX = -origLeft;
    const maxX = cRect.width - origLeft - eSize.width;
    const minY = -origTop;
    const maxY = cRect.height - origTop - eSize.height;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
      hitLeft: x <= minX,
      hitRight: x >= maxX,
      hitTop: y <= minY,
      hitBottom: y >= maxY,
    };
  }

  // ── Apply transform ──────────────────────────────────────────
  function applyTransform(el, x, y, scale = 1) {
    const baseTransform = el.getAttribute('data-base-transform') || '';
    let transform = `${baseTransform} translate(${x}px, ${y}px)`;
    if (scale !== 1) {
      transform += ` scale(${scale})`;
    }
    el.style.transform = transform;
    el.setAttribute('data-x', x);
    el.setAttribute('data-y', y);
  }

  // ── Wall bounce visual feedback ──────────────────────────────
  function triggerBounceEffect(el) {
    el.classList.add('is-bouncing');
    setTimeout(() => el.classList.remove('is-bouncing'), PHYSICS.bounceScaleDuration);
  }

  // ── Physics animation loop ───────────────────────────────────
  function animatePhysics(el) {
    const state = physicsState.get(el);
    if (!state || !state.animating) return;

    // Apply friction
    state.vx *= PHYSICS.friction;
    state.vy *= PHYSICS.friction;

    // Stop if velocity is negligible
    if (Math.abs(state.vx) < PHYSICS.minVelocity && Math.abs(state.vy) < PHYSICS.minVelocity) {
      state.vx = 0;
      state.vy = 0;
      state.animating = false;
      savePosition(el);
      return;
    }

    // Calculate new position
    let currentX = parseFloat(el.getAttribute('data-x')) || 0;
    let currentY = parseFloat(el.getAttribute('data-y')) || 0;
    let newX = currentX + state.vx;
    let newY = currentY + state.vy;

    // Wall collision detection & bounce
    const clamped = clampPosition(el, newX, newY);

    if (clamped.hitLeft || clamped.hitRight) {
      state.vx *= -PHYSICS.bounceFriction;
      triggerBounceEffect(el);
    }
    if (clamped.hitTop || clamped.hitBottom) {
      state.vy *= -PHYSICS.bounceFriction;
      triggerBounceEffect(el);
    }

    applyTransform(el, clamped.x, clamped.y);

    requestAnimationFrame(() => animatePhysics(el));
  }

  // ── Velocity calculation from pointer history ────────────────
  function calculateReleaseVelocity(state) {
    const history = state.pointerHistory;
    if (history.length < 2) return { vx: 0, vy: 0 };

    // Use the last few samples to compute average velocity
    const recent = history.slice(-PHYSICS.velocitySamples);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = (last.time - first.time) / 1000; // seconds

    if (dt === 0) return { vx: 0, vy: 0 };

    let vx = ((last.x - first.x) / dt) * (1 / 60) * PHYSICS.velocityMultiplier;
    let vy = ((last.y - first.y) / dt) * (1 / 60) * PHYSICS.velocityMultiplier;

    // Cap velocity
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > PHYSICS.maxVelocity) {
      const ratio = PHYSICS.maxVelocity / speed;
      vx *= ratio;
      vy *= ratio;
    }

    return { vx, vy };
  }

  // ── Interact.js integration ──────────────────────────────────
  if (typeof interact !== 'undefined') {
    interact(draggableSelector).draggable({
      inertia: false, // We handle our own physics, so disable interact.js inertia
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: containerSelector,
          endOnly: false,
        }),
      ],
      autoScroll: false,
      listeners: {
        start(event) {
          if (isScreenTooSmall()) return false;

          const target = event.target;
          const state = physicsState.get(target);

          // Stop any ongoing physics animation
          if (state) {
            state.animating = false;
            state.vx = 0;
            state.vy = 0;
            state.pointerHistory = [];
          }

          target.classList.add('is-dragging');
          target.classList.remove('is-bouncing');
        },

        move(event) {
          if (isScreenTooSmall()) return;

          const target = event.target;
          const state = physicsState.get(target);

          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          const baseTransform = target.getAttribute('data-base-transform') || '';
          target.style.transform = `${baseTransform} translate(${x}px, ${y}px) scale(${PHYSICS.dragScale})`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

          // Record pointer position for velocity calculation
          if (state) {
            state.pointerHistory.push({
              x: event.client.x,
              y: event.client.y,
              time: Date.now(),
            });
            // Keep only recent samples
            if (state.pointerHistory.length > PHYSICS.velocitySamples * 2) {
              state.pointerHistory = state.pointerHistory.slice(-PHYSICS.velocitySamples);
            }
          }
        },

        end(event) {
          if (isScreenTooSmall()) return;

          const target = event.target;
          target.classList.remove('is-dragging');

          const state = physicsState.get(target);
          if (!state) {
            savePosition(target);
            return;
          }

          // Calculate release velocity from pointer history
          const { vx, vy } = calculateReleaseVelocity(state);

          // Reset scale smoothly
          const currentX = parseFloat(target.getAttribute('data-x')) || 0;
          const currentY = parseFloat(target.getAttribute('data-y')) || 0;
          applyTransform(target, currentX, currentY, 1);

          // If there's meaningful velocity, start physics simulation
          if (Math.abs(vx) > PHYSICS.minVelocity || Math.abs(vy) > PHYSICS.minVelocity) {
            state.vx = vx;
            state.vy = vy;
            state.animating = true;
            state.pointerHistory = [];
            requestAnimationFrame(() => animatePhysics(target));
          } else {
            // No momentum — just save
            savePosition(target);
          }
        },
      },
    });
  } else {
    console.warn('Interact.js is not loaded. Draggable hero elements will not work.');
  }
});
