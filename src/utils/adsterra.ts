/**
 * Adsterra & Monetization Utilities
 * Safe non-intrusive implementation:
 * Eliminates invasive DOM overlay traps that block touch and freeze scrolling in Telegram Mini App.
 */

import { isAdSuppressed } from './monetag';

export const ADSTERRA_DIRECT_LINK = 'https://researchingsweatexit.com/fx4s1179?key=795515765851a303657a3188bb3b9a45';

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
