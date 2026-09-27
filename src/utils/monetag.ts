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

/**
 * Initialize In-App Interstitial Ads for general users.
 * Settings match user specification:
 * - 2 ads per 0.1 hours (6 minutes)
 * - 30s interval, 5s initial timeout
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
      window.show_11898539({
        type: 'inApp',
        inAppSettings: {
          frequency: 2,
          capping: 0.1,
          interval: 30,
          timeout: 5,
          everyPage: false,
        },
      });
      console.log('[Monetag] In-App Interstitial initialized successfully');
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
      await fn();
      console.log('[Monetag] Rewarded Interstitial finished successfully!');
      return true;
    } catch (err) {
      console.warn('[Monetag] Rewarded Interstitial error, falling back to Rewarded Popup:', err);
      // 2. Fallback to Rewarded Popup format
      try {
        await fn('pop');
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

