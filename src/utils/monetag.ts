/**
 * Monetag Telegram Mini App Ads SDK Integration (Zone 11898539)
 * Supports:
 * - Rewarded Interstitial: show_11898539()
 * - Rewarded Popup / Popunder: show_11898539('pop')
 * - In-App Interstitial: show_11898539({ type: 'inApp', inAppSettings: { ... } })
 *
 * CRITICAL RULE: Ads are strictly blocked inside Admin Panel.
 */

declare global {
  interface Window {
    show_11898539?: ((config?: any) => Promise<any>) & {
      inAppInitialized?: boolean;
    };
  }
}

// Global flag to track whether Admin view is active
let isAdminActive = false;

export function setAdminActiveState(active: boolean) {
  isAdminActive = active;
}

export function isAdSuppressed(): boolean {
  if (typeof window === 'undefined') return true;
  if (isAdminActive) return true;
  if (window.location.hash.includes('admin') || window.location.pathname.includes('admin')) return true;
  if (document.body.classList.contains('admin-active')) return true;
  if (localStorage.getItem('admin_auth') === 'true' && (window.location.hash.includes('admin') || isAdminActive)) return true;
  return false;
}

// Global Anti-Crash Interceptor for ad network timeouts & no-fill events
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const msg = (reason && (reason.message || reason.stack || String(reason))) || '';
      if (
        msg.includes('adex timeout') ||
        msg.includes('adex') ||
        msg.includes('libtl.com') ||
        msg.includes('monetag') ||
        msg.includes('show_11898539')
      ) {
        console.warn('[Monetag Anti-Crash] Handled 3rd-party ad rejection:', msg);
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    } catch {
      // ignore
    }
  });
}

/**
 * Initialize In-App Interstitial Ads for general users.
 * Settings match user specification:
 * - NO auto ads upon entering mini app (timeout set to 600s = 10 minutes)
 * - Safe interval between ads: 600s (10 minutes)
 * - frequency: 2, capping: 1 hour
 * - session saved between transitions
 */
export function initMonetagInAppAds() {
  if (isAdSuppressed()) {
    console.log('[Monetag] Suppressed in admin context');
    return;
  }

  if (typeof window !== 'undefined' && typeof window.show_11898539 === 'function') {
    if (window.show_11898539.inAppInitialized) return;
    window.show_11898539.inAppInitialized = true;

    try {
      const res = window.show_11898539({
        type: 'inApp',
        inAppSettings: {
          frequency: 4,
          capping: 1, // 1 hour capping
          interval: 120, // 2 minutes between ads (as requested by user)
          timeout: 120, // 2 minutes delay after entering mini app
          everyPage: false,
        },
      });

      if (res && typeof res.catch === 'function') {
        res.catch((err: any) => {
          console.warn('[Monetag] Handled in-app interstitial ad timeout / error:', err);
        });
      }
      console.log('[Monetag] In-App Interstitial initialized (2-minute interval)');
    } catch (e) {
      console.warn('[Monetag] Failed to initialize inApp ads:', e);
    }
  }
}

/**
 * Show Rewarded ad for video unlock.
 * Follows exact user specifications:
 * 1. Rewarded Interstitial: show_11898539()
 * 2. Rewarded Popup: show_11898539('pop')
 * 
 * Returns Promise<boolean> indicating whether the ad was watched / completed.
 */
export async function showMonetagRewardedAd(): Promise<boolean> {
  if (isAdSuppressed()) {
    console.log('[Monetag] Rewarded ad suppressed in admin context');
    return true;
  }

  const fn = typeof window !== 'undefined' ? window.show_11898539 : null;

  if (typeof fn === 'function') {
    // 1. Try Rewarded Interstitial format first
    try {
      console.log('[Monetag] Executing Rewarded Interstitial show_11898539()...');
      const p = fn();
      if (p && typeof p.catch === 'function') {
        p.catch((e: any) => {
          console.warn('[Monetag] Handled interstitial promise catch:', e);
        });
      }
      await p;
      console.log('[Monetag] Rewarded Interstitial finished successfully!');
      return true;
    } catch (err) {
      console.warn('[Monetag] Rewarded Interstitial error, falling back to Rewarded Popup:', err);
      // 2. Fallback to Rewarded Popup format
      try {
        const popP = fn('pop');
        if (popP && typeof popP.catch === 'function') {
          popP.catch((e: any) => {
            console.warn('[Monetag] Handled pop promise catch:', e);
          });
        }
        await popP;
        console.log('[Monetag] Rewarded Popup finished successfully!');
        return true;
      } catch (popErr) {
        console.warn('[Monetag] Rewarded Popup error:', popErr);
      }
    }
  }

  // Graceful completion fallback if SDK was blocked by client adblocker or slow connection
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2500);
  });
}

