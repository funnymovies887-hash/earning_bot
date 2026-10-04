/**
 * Adsterra & Monetization Utilities
 * Safe non-intrusive implementation:
 * Eliminates invasive DOM overlay traps that block touch and freeze scrolling in Telegram Mini App.
 */

import { isAdSuppressed } from './monetag';

/**
 * Safe initializer: Does NOT inject full-page click-trap overlays into DOM.
 */
export function initAdsterraPopunder() {
  // Intentionally non-intrusive to prevent invisible full-screen overlays from locking touch/scroll
  if (typeof window === 'undefined') return;
  // Clean up any rogue ad overlays if present
  try {
    const rogueScripts = document.querySelectorAll('script[src*="researchingsweatexit.com"]');
    rogueScripts.forEach((s) => s.remove());
  } catch {}
}

/**
 * Triggers task/ad action safely without capturing touch events or freezing screen.
 */
export function triggerAdsterraPopunder() {
  if (isAdSuppressed()) return;
  // Non-blocking safe hook
}
