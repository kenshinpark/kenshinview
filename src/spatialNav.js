// Spatial (D-pad style) focus navigation for Android TV remotes.
// Arrow keys move focus to the nearest visible control in that direction,
// so the remote always follows what is actually on screen.

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex="0"], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

// These elements must keep their native arrow-key behaviour.
const NATIVE_ARROWS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

function isVisible(el) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2 || el.disabled) return false;
  const s = getComputedStyle(el);
  return s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity || '1') > 0.05;
}

function collect() {
  return Array.from(document.querySelectorAll(FOCUSABLE)).filter(isVisible);
}

function center(r) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function moveFocus(dir) {
  const items = collect();
  if (!items.length) return false;

  const active = document.activeElement;
  const from =
    active && active !== document.body && items.includes(active)
      ? center(active.getBoundingClientRect())
      : null;

  // Nothing focused yet -> focus the first control (top-left-most).
  if (!from) {
    const first = items.reduce((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return Math.abs(rb.top - ra.top) < 40 && rb.left < ra.left ? b : a;
    });
    first.focus({ preventScroll: true });
    first.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return true;
  }

  let best = null;
  let bestScore = Infinity;

  for (const el of items) {
    if (el === active) continue;
    const c = center(el.getBoundingClientRect());
    const dx = c.x - from.x;
    const dy = c.y - from.y;

    let primary, secondary;
    switch (dir) {
      case 'left':  if (dx >= -6) continue; primary = -dx; secondary = Math.abs(dy); break;
      case 'right': if (dx <= 6)  continue; primary = dx;  secondary = Math.abs(dy); break;
      case 'up':    if (dy >= -6) continue; primary = -dy; secondary = Math.abs(dx); break;
      case 'down':  if (dy <= 6)  continue; primary = dy;  secondary = Math.abs(dx); break;
      default: return false;
    }

    // Small deviation off the main axis is much better than raw distance.
    const score = primary + secondary * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (!best) return false;
  best.focus({ preventScroll: true });
  best.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  return true;
}

export function initSpatialNav() {
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const t = e.target;
      // Let text fields, selects and checkboxes keep their own arrow keys.
      if (t && NATIVE_ARROWS.has(t.tagName)) return;
      // Never fight the player inside an iframe: events from it never reach
      // here anyway, but a focus resting on <body> over the watch page should
      // still let the native embed handle keys after it is clicked.
      if (document.fullscreenElement) return;

      let dir = null;
      switch (e.key) {
        case 'ArrowLeft':  dir = 'left'; break;
        case 'ArrowRight': dir = 'right'; break;
        case 'ArrowUp':    dir = 'up'; break;
        case 'ArrowDown':  dir = 'down'; break;
        case 'Enter':
        case ' ':
          // Ensure the focused control gets activated even if focus was lost.
          if (document.activeElement && document.activeElement !== document.body) return;
          break;
        default: return;
      }

      if (dir && moveFocus(dir)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // New page -> start at the top with a clean focus.
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 60);
  });
}
