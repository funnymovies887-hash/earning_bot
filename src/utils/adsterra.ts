/**
 * Adsterra Popunder & Monetization Utilities
 * Script: https://researchingsweatexit.com/da/bd/cb/dabdcb221f24811589a079216d6d2fe7.js
 *
 * CRITICAL RULE: Ads are strictly blocked inside Admin Panel.
 */

import { isAdSuppressed } from './monetag';

const ADSTERRA_POPUNDER_SRC = 'https://researchingsweatexit.com/da/bd/cb/dabdcb221f24811589a079216d6d2fe7.js';

let isScriptInjected = false;
let lastPopunderTime = 0;

/**
 * Injects the Adsterra Popunder script into the DOM for regular users.
 * Automatically bypassed if the user is in Admin view.
 */
export function initAdsterraPopunder() {
  if (typeof window === 'undefined') return;
  if (isAdSuppressed()) {
    console.log('[Adsterra] Suppressed in admin context');
    return;
  }

  if (isScriptInjected || document.querySelector(`script[src="${ADSTERRA_POPUNDER_SRC}"]`)) {
    isScriptInjected = true;
    return;
  }

  try {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = ADSTERRA_POPUNDER_SRC;
    script.async = true;
    script.onload = () => {
      isScriptInjected = true;
      console.log('[Adsterra] Popunder script loaded successfully');
    };
    script.onerror = (e) => {
      console.warn('[Adsterra] Popunder script load notice:', e);
    };
    document.head.appendChild(script);
    isScriptInjected = true;
  } catch (err) {
    console.warn('[Adsterra] Initialization error:', err);
  }
}

/**
 * Triggers the Adsterra Popunder when a user clicks on "Start Task" / "কাজ শুরু করুন" button.
 * Respects cooldown (minimum 60s between force triggers) to maintain great user experience.
 */
export function triggerAdsterraPopunder() {
  if (isAdSuppressed()) return;

  // Ensure script is ready
  initAdsterraPopunder();

  const now = Date.now();
  // Safe cooldown between popunder interactions
  if (now - lastPopunderTime < 30 * 1000) {
    return;
  }
  lastPopunderTime = now;

  try {
    // If Adsterra or standard popunder functions are exposed on window
    const win = window as any;
    if (typeof win.adsterraPopunderTrigger === 'function') {
      win.adsterraPopunderTrigger();
    } else {
      // Simulate synthetic user click if Adsterra attached a document click listener
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(clickEvent);
    }
  } catch (e) {
    // Ignore synthetic trigger errors
  }
}
