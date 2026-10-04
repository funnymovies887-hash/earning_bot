import React from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { ReferTab } from './components/ReferTab';
import { EarnTab } from './components/EarnTab';
import { RankTab } from './components/RankTab';
import { ProfileTab } from './components/ProfileTab';
import { SplashLoader } from './components/SplashLoader';
import { NotificationModal } from './components/NotificationModal';
import { SettingsModal } from './components/SettingsModal';
import { CategoryModal } from './components/CategoryModal';
import { MegaContestModal } from './components/MegaContestModal';
import { WithdrawModal } from './components/WithdrawModal';
import { HistoryModal } from './components/HistoryModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AdLockedVideoPlayerModal } from './components/AdLockedVideoPlayerModal';
import { DigitalStoreModal } from './components/DigitalStoreModal';
import { AuthModal } from './components/AuthModal';
import { SupportModal } from './components/SupportModal';
import { PushNotificationToast, PushMessage } from './components/PushNotificationToast';
import { AdWatchingModal } from './components/AdWatchingModal';
import { UserPersonalWarningModal } from './components/UserPersonalWarningModal';
// Lazy load AdminDashboard for performance and resilient builds
const AdminDashboard = React.lazy(() =>
  import('./components/AdminDashboard').then((mod: any) => ({
    default: mod.AdminDashboard || mod.default || (() => (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-lg font-bold text-amber-400 mb-2">অ্যাডমিন ড্যাশবোর্ড লোড হচ্ছে...</h2>
          <p className="text-sm text-slate-300">দয়া করে কিছুক্ষণ পর পেজটি রিফ্রেশ করুন।</p>
        </div>
      </div>
    )),
  })).catch(() => ({
    default: () => (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-lg font-bold text-amber-400 mb-2">অ্যাডমিন প্যানেল</h2>
          <p className="text-sm text-slate-300">দয়া করে পেজটি রিফ্রেশ করুন।</p>
        </div>
      </div>
    ),
  }))
);
import { OfficialNoticeModal } from './components/OfficialNoticeModal';
import { INITIAL_USER, INITIAL_VIDEOS, DAILY_REFERRAL_TIERS } from './data';
import { UserProfile, VideoItem, Language, Currency, ReferralCommissionLog, AdLockedVideo } from './types';
import { NotificationInboxModal, NotificationItem } from './components/NotificationInboxModal';
import { Headphones, Bell, X, Check, ArrowRight, Gift, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { initMonetagInAppAds } from './utils/monetag';
import { initAdsterraPopunder, triggerAdsterraPopunder } from './utils/adsterra';

function getInitialTelegramUser() {
  try {
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      try {
        tg.disableVerticalSwipes?.();
        tg.setHeaderColor?.('#0f172a');
        tg.setBackgroundColor?.('#0f172a');
      } catch {}
      tg.enableClosingConfirmation?.();
      const u = tg.initDataUnsafe?.user;
      if (u && u.id) {
        const dName = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `User #${u.id}`;
        const uName = u.username ? `@${u.username}` : `@user_${String(u.id).slice(-4)}`;
        return {
          id: String(u.id),
          displayName: dName,
          username: uName,
          avatarUrl: u.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
          isTelegram: true,
          tgRaw: u,
        };
      }
    }
  } catch {}
  return null;
}

function extractTelegramStartParam(): string | null {
  try {
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
    if (tg?.initDataUnsafe?.start_param) {
      const p = String(tg.initDataUnsafe.start_param);
      try { sessionStorage.setItem('tg_start_param', p); } catch {}
      return p;
    }

    if (tg?.initData) {
      try {
        const initDataParams = new URLSearchParams(tg.initData);
        const fromInitData =
          initDataParams.get('start_param') ||
          initDataParams.get('startapp') ||
          initDataParams.get('video');
        if (fromInitData) {
          try { sessionStorage.setItem('tg_start_param', fromInitData); } catch {}
          return fromInitData;
        }
      } catch {}
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fromSearch =
      urlParams.get('tgWebAppStartParam') ||
      urlParams.get('startapp') ||
      urlParams.get('start_param') ||
      urlParams.get('video') ||
      urlParams.get('vid');
    if (fromSearch) {
      try { sessionStorage.setItem('tg_start_param', fromSearch); } catch {}
      return fromSearch;
    }

    // Check tgWebAppData inside search
    const rawSearchTgData = urlParams.get('tgWebAppData');
    if (rawSearchTgData) {
      try {
        const innerParams = new URLSearchParams(rawSearchTgData);
        const innerStart = innerParams.get('start_param') || innerParams.get('startapp') || innerParams.get('video');
        if (innerStart) {
          try { sessionStorage.setItem('tg_start_param', innerStart); } catch {}
          return innerStart;
        }
      } catch {}
    }

    if (window.location.hash) {
      const hashContent = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashContent);
      const fromHash =
        hashParams.get('tgWebAppStartParam') ||
        hashParams.get('startapp') ||
        hashParams.get('start_param') ||
        hashParams.get('video') ||
        hashParams.get('vid');
      if (fromHash) {
        try { sessionStorage.setItem('tg_start_param', fromHash); } catch {}
        return fromHash;
      }

      // Check tgWebAppData inside hash
      const rawHashTgData = hashParams.get('tgWebAppData');
      if (rawHashTgData) {
        try {
          const innerHashParams = new URLSearchParams(rawHashTgData);
          const innerStart = innerHashParams.get('start_param') || innerHashParams.get('startapp') || innerHashParams.get('video');
          if (innerStart) {
            try { sessionStorage.setItem('tg_start_param', innerStart); } catch {}
            return innerStart;
          }
        } catch {}
      }
    }

    try {
      const saved = sessionStorage.getItem('tg_start_param');
      if (saved) return saved;
    } catch {}
  } catch {}
  return null;
}

function matchAdLockedVideo(vids: any[], param: string): any | null {
  if (!Array.isArray(vids) || vids.length === 0 || !param) return null;
  const clean = decodeURIComponent(param).trim();
  const stripped = clean.replace(/^video_/, '').replace(/^vid_/, '').trim();

  // 1. Direct ID match
  let found = vids.find((v) => v.id === clean || v.id === stripped);
  if (found) return found;

  // 2. Partial ID match
  found = vids.find((v) => v.id.includes(stripped) || stripped.includes(v.id));
  if (found) return found;

  // 3. Number index (e.g. 1 -> 1st video, 2 -> 2nd video) only for small integers
  if (/^\d{1,2}$/.test(stripped)) {
    const num = parseInt(stripped, 10);
    if (!isNaN(num) && num >= 1 && num <= vids.length) {
      return vids[num - 1];
    }
  }

  // 4. Title match
  found = vids.find((v) => v.title && v.title.toLowerCase().includes(stripped.toLowerCase()));
  if (found) return found;

  // 5. Default to the latest active video if parameter exists
  return vids[0] || null;
}

function getLocalOrNewUserId(): string {
  try {
    let savedUid = localStorage.getItem('smart_earning_uid');
    // Never allow regular visitors to inherit the admin ID
    if (!savedUid || savedUid === 'usr_78912' || savedUid.toLowerCase().includes('rubi')) {
      savedUid = 'u_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('smart_earning_uid', savedUid);
    }
    return savedUid;
  } catch {
    return 'guest_' + Math.random().toString(36).substring(2, 7);
  }
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = React.useState<boolean>(() => {
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash.startsWith('#admin') ||
      new URLSearchParams(window.location.search).get('view') === 'admin'
    );
  });

  const mainContentRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const checkPath = () => {
      setIsAdminRoute(
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.startsWith('#admin') ||
        new URLSearchParams(window.location.search).get('view') === 'admin'
      );
    };
    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);

    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
    };
  }, []);

  const [user, setUser] = React.useState<UserProfile>(() => {
    const tgIdentity = getInitialTelegramUser();
    const effectiveId = tgIdentity ? tgIdentity.id : getLocalOrNewUserId();
    const initialName = tgIdentity ? tgIdentity.displayName : `ইউজার #${effectiveId.slice(-4)}`;
    const initialUsername = tgIdentity ? tgIdentity.username : `@user_${effectiveId.slice(-4)}`;
    const initialAvatar = tgIdentity ? tgIdentity.avatarUrl : `https://api.dicebear.com/7.x/bottts/svg?seed=${effectiveId}`;

    const defaultProfile: UserProfile = {
      ...INITIAL_USER,
      id: effectiveId,
      displayName: initialName,
      username: initialUsername,
      avatarUrl: initialAvatar,
      balanceUsd: 0.00,
    };

    try {
      const savedStr = localStorage.getItem('smart_earning_user');
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        if (parsed && typeof parsed === 'object') {
          // If stored cache is from Salauddin / Admin while current user is NOT admin, purge it!
          if (parsed.id === 'usr_78912' || (parsed.displayName && parsed.displayName.includes('SALAUDDIN'))) {
            if (effectiveId !== 'usr_78912') {
              localStorage.removeItem('smart_earning_user');
              return defaultProfile;
            }
          }

          // If cache matches this user's ID:
          if (parsed.id === effectiveId) {
            const todayStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
            const isDifferentDay = parsed.lastActiveDate && parsed.lastActiveDate !== todayStr;
            return {
              ...defaultProfile,
              ...parsed,
              id: effectiveId,
              displayName: tgIdentity ? tgIdentity.displayName : (parsed.displayName || initialName),
              username: tgIdentity ? tgIdentity.username : (parsed.username || initialUsername),
              avatarUrl: tgIdentity ? tgIdentity.avatarUrl : (parsed.avatarUrl || initialAvatar),
              language: (typeof parsed.language === 'string' && ['en', 'bn', 'hi', 'ur'].includes(parsed.language)) ? parsed.language : 'bn',
              currency: (typeof parsed.currency === 'string' && ['USD', 'BDT', 'INR'].includes(parsed.currency)) ? parsed.currency : 'BDT',
              balanceUsd: typeof parsed.balanceUsd === 'number' && !isNaN(parsed.balanceUsd) ? parsed.balanceUsd : 0.00,
              adsWatchedToday: isDifferentDay ? 0 : (typeof parsed.adsWatchedToday === 'number' ? parsed.adsWatchedToday : 0),
              completedTaskIds: isDifferentDay ? [] : (Array.isArray(parsed.completedTaskIds) ? parsed.completedTaskIds : []),
              lastActiveDate: todayStr,
            };
          }
        }
      }
    } catch {}

    return defaultProfile;
  });
  const [videos, setVideos] = React.useState<VideoItem[]>(INITIAL_VIDEOS);
  const [activeTab, setActiveTab] = React.useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('online-income');
  const [selectedSubCategory, setSelectedSubCategory] = React.useState<string>('All Videos');
  const [onlineCount, setOnlineCount] = React.useState<number>(26);

  // Modals state
  const [showSplash, setShowSplash] = React.useState<boolean>(true);
  const [showWelcome, setShowWelcome] = React.useState<boolean>(false);
  const [showOfficialNotice, setShowOfficialNotice] = React.useState<boolean>(false);
  const [showSettings, setShowSettings] = React.useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = React.useState<boolean>(false);
  const [showMegaContest, setShowMegaContest] = React.useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = React.useState<boolean>(false);
  const [showHistory, setShowHistory] = React.useState<boolean>(false);
  const [showAuth, setShowAuth] = React.useState<boolean>(false);
  const [showSupport, setShowSupport] = React.useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = React.useState<boolean>(false);
  const [activeVideo, setActiveVideo] = React.useState<VideoItem | null>(null);
  const [activeAdLockedVideo, setActiveAdLockedVideo] = React.useState<AdLockedVideo | null>(null);
  const [showDigitalStore, setShowDigitalStore] = React.useState<boolean>(false);
  const [adWatchingSession, setAdWatchingSession] = React.useState<{
    isOpen: boolean;
    title: string;
    duration: number;
    rewardBdt: number;
    rewardUsd: number;
    directAdUrl: string;
  } | null>(null);

  // Real in-app persistent notification items
  const [inboxNotifications, setInboxNotifications] = React.useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('earn_bot_user_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'notif-welcome',
        title: '👋 স্বাগতম Cholo Income Kori এ!',
        body: 'প্রতিদিন কাজ করুন এবং ১০০% পেমেন্ট নিন। ২৫ টাকা হলেই উত্তোলন করতে পারবেন বিকাশ ও নগদে।',
        details: 'Cholo Income Kori অ্যাপে আপনাকে স্বাগতম!\n\n১. প্রতিদিন টাস্ক ও ভিডিও বিজ্ঞাপন দেখে আয় করুন।\n২. বন্ধুদের রেফার করে আজীবন ৫% কমিশন ও প্রতি সফল রেফারে ১০ টাকা বোনাস নিন।\n৩. ন্যূনতম ২৫ টাকা হলেই সরাসরি বিকাশ, নগদ বা রকেটে পেমেন্ট তুলতে পারবেন।\n৪. কোনো সমস্যা হলে ২৪/৭ সাপোর্ট টিমের সাথে টেলিগ্রামে যোগাযোগ করুন।',
        time: 'আজকে',
        read: false,
        type: 'system',
      },
      {
        id: 'notif-rule',
        title: '🔒 উইথড্র ও পেমেন্ট সময়সীমা',
        body: 'টাকা উত্তোলনের জন্য ৩ জন সক্রিয় রেফারেল (১০৳ কাজ করা) প্রয়োজন। ১ম পেমেন্ট ভেরিফিকেশনের জন্য ৭-১৫ দিনের মধ্যে এবং ২য় বার থেকে প্রতিবার মাত্র ৬-১২ ঘণ্টার মধ্যে দ্রুত পৌঁছে যাবে।',
        details: 'উত্তোলন নিয়মাবলী:\n\n১. টাকা উত্তোলনের জন্য সর্বনিম্ন ২৫ টাকা ব্যালেন্স এবং কমপক্ষে ৩ জন সক্রিয় রেফারেল (১০৳ কাজ করা) প্রয়োজন।\n২. ১ম উইথড্র সিকিউরিটি ও স্প্যাম ভেরিফিকেশনের জন্য ৭-১৫ কর্মদিবসের মধ্যে সম্পন্ন হবে।\n৩. ২য় বার থেকে প্রতিবার মাত্র ৬-১২ ঘণ্টার মধ্যে দ্রুত টাকা পেয়ে যাবেন।',
        time: 'আজকে',
        read: false,
        type: 'system',
      },
    ];
  });

  // Save notifications to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('earn_bot_user_notifications', JSON.stringify(inboxNotifications));
    } catch {}
  }, [inboxNotifications]);

  // Push notifications queue (popups)
  const [notifications, setNotifications] = React.useState<PushMessage[]>([]);

  // Dynamic 5 Income Methods and Direct Ad Config from Admin
  const [incomeConfig, setIncomeConfig] = React.useState<any>({
    ads: {
      enabled: true,
      rewardBdt: 1.5,
      rewardUsd: 0.0125,
      dailyLimit: 40,
      directAdUrl: 'https://omg10.com/4/11869572',
    },
  });

  React.useEffect(() => {
    fetch('/api/income-methods')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.config) {
          setIncomeConfig(data.config);
        }
      })
      .catch(() => {});

    // Initialize Monetag In-App Interstitial after 2 minutes (smooth non-blocking)
    const adTimer = setTimeout(() => {
      initMonetagInAppAds();
    }, 2 * 60 * 1000); // 2 minutes delay

    // 90-minute expired video auto-delete verification ping (ensures deletion is always on time)
    const deleteCheckInterval = setInterval(() => {
      fetch('/api/ad-videos/check-deletions').catch(() => {});
    }, 45 * 1000);
    fetch('/api/ad-videos/check-deletions').catch(() => {});

    return () => {
      clearTimeout(adTimer);
      clearInterval(deleteCheckInterval);
    };
  }, []);

  // Handle Telegram startapp deep links (e.g. video_lock-vid-1 from channel 'Watch Full Video' button)
  React.useEffect(() => {
    let isMounted = true;
    const checkAndOpenDeepLink = () => {
      const startParam = extractTelegramStartParam();
      if (!startParam) return;

      fetch('/api/ad-videos')
        .then((res) => res.json())
        .then((vids) => {
          if (!isMounted || !Array.isArray(vids)) return;
          const matched = matchAdLockedVideo(vids, startParam);
          if (matched) {
            console.log('[DeepLink] Matched video from startapp:', matched.title);
            setShowSplash(false);
            setShowWelcome(false);
            setActiveAdLockedVideo(matched);
            setActiveTab('home');
          }
        })
        .catch(() => {});
    };

    // Execute immediately and with short intervals in case Telegram initDataUnsafe populates asynchronously
    checkAndOpenDeepLink();
    const t1 = setTimeout(checkAndOpenDeepLink, 200);
    const t2 = setTimeout(checkAndOpenDeepLink, 700);
    const t3 = setTimeout(checkAndOpenDeepLink, 1500);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Load user data and videos from server on mount
  React.useEffect(() => {
    const currentId = user.id;
    const tgIdentity = getInitialTelegramUser();
    const todayDateStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);

    fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentId,
      },
      body: JSON.stringify({
        id: currentId,
        tgId: currentId,
        first_name: tgIdentity?.tgRaw?.first_name || user.displayName,
        last_name: tgIdentity?.tgRaw?.last_name || '',
        username: tgIdentity?.username || user.username,
        photo_url: tgIdentity?.avatarUrl || user.avatarUrl,
        language: user.language || 'bn',
        currency: user.currency || 'BDT',
        balanceUsd: user.balanceUsd || 0,
        adsWatchedToday: user.adsWatchedToday || 0,
        completedTaskIds: user.completedTaskIds || [],
        lastActiveDate: user.lastActiveDate || todayDateStr,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user) {
          const profile = data.user;
          setUser((prev) => {
            if (profile.id === prev.id) {
              const lang = (typeof profile.language === 'string' && ['en', 'bn', 'hi', 'ur'].includes(profile.language))
                ? profile.language
                : prev.language || 'bn';
              const curr = (typeof profile.currency === 'string' && ['USD', 'BDT', 'INR'].includes(profile.currency))
                ? profile.currency
                : prev.currency || 'BDT';

              // Safely merge balance, ads watched, and completed tasks so progress is NEVER wiped on reload/re-enter
              const mergedBalance = Math.max(Number(prev.balanceUsd || 0), Number(profile.balanceUsd || 0));
              const mergedAds = (prev.lastActiveDate === todayDateStr && profile.lastActiveDate === todayDateStr)
                ? Math.max(Number(prev.adsWatchedToday || 0), Number(profile.adsWatchedToday || 0))
                : (profile.adsWatchedToday ?? prev.adsWatchedToday ?? 0);
              const mergedCompleted = Array.from(new Set([...(prev.completedTaskIds || []), ...(profile.completedTaskIds || [])]));

              const updated: UserProfile = {
                ...prev,
                ...profile,
                balanceUsd: mergedBalance,
                adsWatchedToday: mergedAds,
                completedTaskIds: mergedCompleted,
                lastActiveDate: todayDateStr,
                language: lang,
                currency: curr,
                totalCommissionEarnedUsd: typeof profile.totalCommissionEarnedUsd === 'number' ? profile.totalCommissionEarnedUsd : 0.00,
                claimableCommissionUsd: typeof profile.claimableCommissionUsd === 'number' ? profile.claimableCommissionUsd : 0.00,
                pendingReferralBonusUsd: typeof profile.pendingReferralBonusUsd === 'number' ? profile.pendingReferralBonusUsd : 0.00,
                referralCommissionRate: 5,
                referralCommissionHistory: Array.isArray(profile.referralCommissionHistory) && (profile.joinedCount || 0) > 0
                  ? profile.referralCommissionHistory
                  : [],
              };
              try {
                localStorage.setItem('smart_earning_user', JSON.stringify(updated));
              } catch {}
              return updated;
            }
            return prev;
          });
        }
      })
      .catch(() => {});

    fetch('/api/videos')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setVideos(data);
        }
      })
      .catch(() => {});

    // Prefetch live digital store packages on mount so any browser immediately has fresh data
    fetch('/api/packages')
      .then((res) => res.json())
      .then((pkgs) => {
        if (Array.isArray(pkgs)) {
          const clean = pkgs.filter((p: any) => p && !['pkg-1', 'pkg-2', 'pkg-3'].includes(p.id));
          try {
            localStorage.setItem('earn_digital_packages', JSON.stringify(clean));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Sync user state changes to local storage & backend
  const syncUser = React.useCallback((updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const base = prev || INITIAL_USER;
      const todayDateStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
      let sanitizedLang = base.language;
      if (typeof updated.language === 'string' && ['en', 'bn', 'hi', 'ur'].includes(updated.language)) {
        sanitizedLang = updated.language as Language;
      }
      let sanitizedCurr = base.currency;
      if (typeof updated.currency === 'string' && ['USD', 'BDT', 'INR'].includes(updated.currency)) {
        sanitizedCurr = updated.currency as Currency;
      }

      const next: UserProfile = {
        ...base,
        ...updated,
        lastActiveDate: todayDateStr,
        language: sanitizedLang,
        currency: sanitizedCurr,
      };

      try {
        localStorage.setItem('smart_earning_user', JSON.stringify(next));
      } catch {}

      // Fire asynchronous background sync without stalling React thread
      fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': next.id,
        },
        body: JSON.stringify(next),
        keepalive: true,
      }).catch(() => {});

      return next;
    });
  }, []);

  // Online count fluctuating timer - throttled to 25s for 60fps scrolling
  React.useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next < 22 ? 26 : next > 52 ? 45 : next;
      });
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (notif: PushMessage) => {
    setNotifications((prev) => [notif, ...prev.slice(0, 2)]);
    // Trigger browser Web Notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, { body: notif.body });
      } catch {}
    }
  };

  // 100% Real In-App Notification Adder
  const addInboxNotification = (
    item: Omit<NotificationItem, 'time' | 'read'> & { time?: string; read?: boolean }
  ) => {
    const fullItem: NotificationItem = {
      ...item,
      time: item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: item.read ?? false,
    };
    setInboxNotifications((prev) => {
      const updated = [fullItem, ...prev.filter((n) => n.id !== item.id)].slice(0, 100);
      try {
        localStorage.setItem('earn_bot_user_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    // Also display as instant toast
    addNotification({
      id: 'toast-' + fullItem.id,
      title: fullItem.title,
      body: fullItem.body,
    });
  };

  const handleMarkAsRead = (id: string) => {
    setInboxNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setInboxNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setInboxNotifications((prev) => prev.filter((n) => n.actionable && !n.claimed));
  };

  const handleDismissNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Test push notification trigger
  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    addInboxNotification({
      id: 'test-' + Date.now(),
      type: 'system',
      title: '🔔 টেস্ট নোটিফিকেশন অ্যালার্ট',
      body: 'আপনার পুশ ও ইনবক্স নোটিফিকেশন সম্পূর্ণ সক্রিয় রয়েছে এবং সঠিকভাবে কাজ করছে!',
      details: 'আপনার ডিভাইসে রিয়েল-টাইম নোটিফিকেশন সিস্টেম সম্পূর্ণভাবে যুক্ত হয়েছে। সকল কাজের আসল আপডেট সাথে সাথে এখানে পাবেন।',
    });
  };

  // Splash complete -> open Welcome Modal (always enforces verification on every app visit)
  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowWelcome(true);
  };

  // Tab change handler - fast responsive tab navigation
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Settings save handler
  const handleSaveSettings = (language: Language, currency: Currency) => {
    const validLang: Language = (typeof language === 'string' && ['en', 'bn', 'hi', 'ur'].includes(language)) ? language : 'bn';
    const validCurr: Currency = (typeof currency === 'string' && ['USD', 'BDT', 'INR'].includes(currency)) ? currency : 'BDT';
    syncUser({ language: validLang, currency: validCurr });
    addNotification({
      id: 'settings-' + Date.now(),
      title: '⚙️ Settings Updated!',
      body: `ভাষা: ${validLang === 'bn' ? 'বাংলা' : validLang === 'en' ? 'English' : validLang} | কারেন্সি: ${validCurr}`,
    });
  };

  // Claim 5% Referral Commission to main balance
  const handleClaimCommission = () => {
    const claimable = user.claimableCommissionUsd || 0;
    if (claimable <= 0) return;

    const formattedClaim =
      user.currency === 'BDT'
        ? `৳ ${(claimable * 120).toFixed(2)}`
        : user.currency === 'INR'
        ? `₹ ${(claimable * 87).toFixed(2)}`
        : `$ ${claimable.toFixed(2)}`;

    syncUser({
      balanceUsd: +(user.balanceUsd + claimable).toFixed(2),
      claimableCommissionUsd: 0,
    });

    addInboxNotification({
      id: 'comm-claim-' + Date.now(),
      type: 'commission',
      title: '🎉 ৫% রেফারেল কমিশন গ্রহণ সফল!',
      body: `${formattedClaim} সরাসরি আপনার মূল ব্যালেন্সে যুক্ত হয়েছে।`,
      details: `আপনি বন্ধুদের আয়ের ওপর অর্জিত ৫% রেফারেল কমিশন (${formattedClaim}) সফলভাবে মূল ব্যালেন্সে স্থানান্তর করেছেন। এটি যেকোনো সময় উত্তোলন করতে পারবেন।`,
    });
  };

  // Simulate friend referral completing task and generating 5% commission
  const handleSimulateCommissionActivity = () => {
    const friendList = ['@sakib_bd', '@tanvir_77', '@monir_earn', '@hasan_pro', '@rubel_vip'];
    const randomFriend = friendList[Math.floor(Math.random() * friendList.length)];
    const taskEarnings = [0.30, 0.50, 0.40, 0.80, 0.25];
    const earnedUsd = taskEarnings[Math.floor(Math.random() * taskEarnings.length)];
    const commUsd = +(earnedUsd * 0.05).toFixed(3);

    const newLog: ReferralCommissionLog = {
      id: 'comm-' + Date.now(),
      userFrom: randomFriend,
      activity: 'টাস্ক ও ভিডিও অ্যাড দেখেছেন',
      userEarnedUsd: earnedUsd,
      commissionUsd: commUsd,
      time: 'এইমাত্র',
    };

    const currentHistory = user.referralCommissionHistory || [];
    const updatedHistory = [newLog, ...currentHistory].slice(0, 15);

    syncUser({
      totalCommissionEarnedUsd: +((user.totalCommissionEarnedUsd || 0) + commUsd).toFixed(2),
      claimableCommissionUsd: +((user.claimableCommissionUsd || 0) + commUsd).toFixed(2),
      referralCommissionHistory: updatedHistory,
    });

    const commFormatted =
      user.currency === 'BDT'
        ? `৳ ${(commUsd * 120).toFixed(2)}`
        : user.currency === 'INR'
        ? `₹ ${(commUsd * 87).toFixed(2)}`
        : `$ ${commUsd.toFixed(2)}`;

    addInboxNotification({
      id: 'comm-recv-' + Date.now(),
      type: 'commission',
      title: '💸 ৫% আজীবন রেফারেল কমিশন!',
      body: `রেফারেল ${randomFriend} কাজ সম্পন্ন করায় আপনি ${commFormatted} কমিশন পেয়েছেন!`,
      details: `রেফারেল সদস্য: ${randomFriend}\nকাজের বিবরণ: ${newLog.activity}\nতার মোট আয়: $${earnedUsd}\nআপনার প্রাপ্য ৫% কমিশন: ${commFormatted} ($${commUsd})\nকমিশন ব্যালেন্সে স্বয়ংক্রিয়ভাবে জমা করা হয়েছে।`,
    });
  };

  // Category select handler
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubCategory('All Videos');
  };

  // Claim Video Ad Reward
  const handleRewardClaimed = (video: VideoItem) => {
    syncUser({
      balanceUsd: user.balanceUsd + video.rewardUsd,
      adsWatchedToday: user.adsWatchedToday + 1,
    });
    const bdtAmount = +(video.rewardUsd * 120).toFixed(2);
    addInboxNotification({
      id: 'reward-' + Date.now(),
      type: 'video',
      title: '🎬 ভিডিও বিজ্ঞাপন দেখা সম্পন্ন!',
      body: `"${video.title}" ভিডিও সফলভাবে দেখার জন্য +৳${bdtAmount} ($${video.rewardUsd.toFixed(4)}) যোগ হয়েছে!`,
      details: `ভিডিওর নাম: ${video.title}\nক্যাটাগরি: ${video.category}\nপারিশ্রমিক: ৳${bdtAmount} BDT ($${video.rewardUsd} USD)\nব্যালেন্স সফলভাবে আপডেট করা হয়েছে। আজ মোট দেখা হয়েছে: ${user.adsWatchedToday + 1} টি ভিডিও।`,
    });
  };

  // Complete Task (5 Income Methods Tasks - Counts towards daily 40 limit)
  const handleCompleteTask = React.useCallback((taskId: string, rewardUsd: number, type: string) => {
    const maxDailyLimit = incomeConfig?.ads?.dailyLimit || user.dailyAdLimit || 40;
    if ((user.adsWatchedToday || 0) >= maxDailyLimit) {
      addNotification({
        id: 'limit-err-' + Date.now(),
        title: '⚠️ আজকের কাজের লিমিট পূর্ণ',
        body: `আজকের সর্বোচ্চ কাজের লিমিট (${maxDailyLimit} টি) পূর্ণ হয়েছে। আগামী কাল আবার কাজ করতে পারবেন।`,
      });
      return;
    }

    const validReward = typeof rewardUsd === 'number' && !isNaN(rewardUsd) ? rewardUsd : 0.0125;
    const currentCompleted = user.completedTaskIds || [];
    if (currentCompleted.includes(taskId)) return;

    const nextCount = (user.adsWatchedToday || 0) + 1;
    const updatedTasks = [...currentCompleted, taskId];
    syncUser({
      balanceUsd: +(Number(user.balanceUsd || 0) + validReward).toFixed(4),
      completedTaskIds: updatedTasks,
      adsWatchedToday: nextCount,
    });

    // Notify server to increment totalCompletions by 1 for this exact task
    fetch('/api/tasks/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({ taskId }),
    }).catch(() => {});

    const bdtAmount = +(validReward * 120).toFixed(2);
    addInboxNotification({
      id: 'task-' + Date.now(),
      type: 'task',
      title: '✅ ১টি কাজ সফলভাবে সম্পন্ন হয়েছে!',
      body: `আপনি এই কাজটি সম্পন্ন করে +৳${bdtAmount} ($${validReward.toFixed(4)}) পেয়েছেন! (${nextCount}/${maxDailyLimit})`,
      details: `টাস্ক আইডি: ${taskId}\nক্যাটাগরি: ${type.toUpperCase()}\nপারিশ্রমিক: ৳${bdtAmount} BDT ($${validReward} USD)\nআজকের সম্পন্ন কাজ: ${nextCount}/${maxDailyLimit} টি\nটাকা তাৎক্ষণিকভাবে আপনার মূল অ্যাকাউন্টে যোগ করা হয়েছে।`,
    });
  }, [incomeConfig, user, syncUser]);

  // Referral tier claim
  const handleClaimTier = (tierIndex: number, rewardUsd: number) => {
    const tier = DAILY_REFERRAL_TIERS[tierIndex];
    if (!tier || (user.todayReferrals || 0) < tier.count) {
      addNotification({
        id: 'tier-err-' + Date.now(),
        title: '⚠️ ক্লেইম করা সম্ভব নয়',
        body: `এই রিওয়ার্ড ক্লেইম করতে আজ কমপক্ষে ${tier ? tier.count : ''} জন বন্ধুকে সফলভাবে রেফার করতে হবে।`,
      });
      return;
    }
    if (user.claimedDailyTiers?.includes(tierIndex)) {
      return;
    }

    const updatedTiers = [...(user.claimedDailyTiers || []), tierIndex];
    syncUser({
      balanceUsd: user.balanceUsd + rewardUsd,
      claimedDailyTiers: updatedTiers,
    });
    const bdt = +(rewardUsd * 120).toFixed(2);
    addInboxNotification({
      id: 'tier-' + Date.now(),
      type: 'bonus',
      title: '👑 দৈনিক রেফারেল টায়ার রিওয়ার্ড!',
      body: `আজকের ${tier.count} রেফারেলের লক্ষ্য পূরণ করে +৳${bdt} ($${rewardUsd.toFixed(2)}) বোনাস পেয়েছেন!`,
      details: `দৈনিক রেফারেল মাইলস্টোন:\nলক্ষ্যমাত্রা: ${tier.count} জন বন্ধু\nবোনাস রিওয়ার্ড: ৳${bdt} BDT ($${rewardUsd} USD)\nরিওয়ার্ড আপনার মূল অ্যাকাউন্টে যুক্ত করা হয়েছে।`,
    });
  };

  // Simulate friend referral (10 Taka Instant Claimable Bonus + 5% first commission)
  const handleSimulateReferral = () => {
    const bonusTaka = 10;
    const bonusUsd = +(bonusTaka / 120).toFixed(2);
    const firstTaskCommUsd = 0.02; // 5% on initial onboarding task
    const newNotifId = 'bonus-ref-' + Date.now();

    const newLog: ReferralCommissionLog = {
      id: 'comm-' + Date.now(),
      userFrom: `@friend_${user.joinedCount + 1}`,
      activity: 'রেফারেল জয়েন ও ১ম কাজ সম্পন্ন',
      userEarnedUsd: 0.40,
      commissionUsd: firstTaskCommUsd,
      time: 'এইমাত্র',
    };

    const updatedHistory = [newLog, ...(user.referralCommissionHistory || [])].slice(0, 15);

    syncUser({
      todayReferrals: user.todayReferrals + 1,
      joinedCount: user.joinedCount + 1,
      pendingReferralBonusUsd: user.pendingReferralBonusUsd + bonusUsd,
      totalCommissionEarnedUsd: +((user.totalCommissionEarnedUsd || 0) + firstTaskCommUsd).toFixed(2),
      claimableCommissionUsd: +((user.claimableCommissionUsd || 0) + firstTaskCommUsd).toFixed(2),
      referralCommissionHistory: updatedHistory,
    });

    // Add claimable ৳10 notification to real Notification Inbox
    addInboxNotification({
      id: newNotifId,
      type: 'referral',
      title: '🎁 নতুন রেফারেল ও ১০ টাকা বোনাস!',
      body: 'আপনার রেফারেল লিংক ব্যবহার করে একজন বন্ধু যুক্ত হয়েছেন! ব্যালেন্সে ১০ টাকা নিতে Claim বাটনে চাপুন।',
      actionable: true,
      claimAmount: bonusTaka,
      claimed: false,
      details: `রেফারেল বোনাস বিজ্ঞপ্তি:\nআপনার আমন্ত্রণে একজন নতুন বন্ধু আমাদের প্ল্যাটফর্মে যুক্ত হয়েছেন।\n\nবোনাস অ্যামাউন্ট: ৳${bonusTaka} টাকা\nনিচের "Claim Now" বাটনে চাপলে সাথে সাথে এটি মূল ব্যালেন্সে ক্রেডিট হয়ে যাবে। এছাড়া ভবিষ্যতে তিনি প্রতিটি টাস্ক সম্পন্ন করলেই আপনি ৫% আজীবন কমিশন পাবেন।`,
    });
  };

  // Claim 10 Taka Bonus from Notification Center
  const handleClaimInboxBonus = (notifId: string, amountTaka: number) => {
    const notif = inboxNotifications.find((n) => n.id === notifId);
    if (!notif || notif.claimed) return;

    if ((user.pendingReferralBonusUsd || 0) <= 0 && (user.joinedCount || 0) <= 0) {
      addNotification({
        id: 'claim-err-' + Date.now(),
        title: '⚠️ কোনো ক্লেইমযোগ্য বোনাস নেই',
        body: 'বন্ধুদের রেফারেল লিংক দিয়ে যুক্ত করার পর এখানে বোনাস ক্লেইম করতে পারবেন।',
      });
      return;
    }

    const amountUsd = +(amountTaka / 120).toFixed(2);
    setInboxNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, claimed: true, read: true } : n))
    );
    syncUser({
      balanceUsd: +(user.balanceUsd + amountUsd).toFixed(2),
      pendingReferralBonusUsd: Math.max(0, +(user.pendingReferralBonusUsd - amountUsd).toFixed(2)),
    });
    addNotification({
      id: 'claim-' + Date.now(),
      title: '💰 বোনাস গ্রহণ সম্পন্ন!',
      body: `৳${amountTaka} টাকা সরাসরি আপনার মূল ব্যালেন্সে যুক্ত করা হয়েছে!`,
    });
  };

  // Withdraw success handler
  const handleWithdrawSuccess = (amount: number, method: string) => {
    const amountInUsd =
      user.currency === 'BDT' ? amount / 120 : user.currency === 'INR' ? amount / 87 : amount;
    syncUser({
      balanceUsd: Math.max(0, +(user.balanceUsd - amountInUsd).toFixed(4)),
    });
    const displayAmount = `${user.currency === 'BDT' ? '৳' : user.currency === 'INR' ? '₹' : '$'}${amount}`;
    addInboxNotification({
      id: 'withdraw-' + Date.now(),
      type: 'withdrawal',
      title: '⏳ উত্তোলন আবেদন সফল হয়েছে!',
      body: `আপনার ${displayAmount} (${method}) টাকা উত্তোলনের আবেদন সফলভাবে গৃহীত হয়েছে। ভেরিফিকেশন চলছে।`,
      details: `উত্তোলনের বিস্তারিত:\nপরিমাণ: ${displayAmount}\nপেমেন্ট মেথড: ${method}\nস্ট্যাটাস: পেন্ডিং (অ্যাডমিন ভেরিফিকেশনে আছে)\nসময়সীমা: ১ম পেমেন্ট ৭-১৫ কর্মদিবস এবং ২য় বার থেকে প্রতিবার ৬-১২ ঘণ্টার মধ্যে পৌঁছে যাবে।`,
    });
  };

  if (isAdminRoute) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 text-sm font-bold">অ্যাডমিন প্যানেল লোড হচ্ছে...</div>}>
        <AdminDashboard />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex justify-center selection:bg-purple-500 selection:text-white">
      {/* Mobile container - Responsive frame matching Telegram Mini App */}
      <div className="w-full max-w-md min-h-screen bg-slate-100 text-slate-900 flex flex-col shadow-2xl relative">
        {/* Splash screen */}
        {showSplash && <SplashLoader onComplete={handleSplashComplete} />}

        {/* Top Navbar */}
        <Navbar
          user={user}
          language={user?.language || 'bn'}
          onlineCount={onlineCount}
          unreadCount={inboxNotifications.filter((n) => !n.read || (n.actionable && !n.claimed)).length}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenStore={() => setShowDigitalStore(true)}
        />

        {/* Main Content View with Dynamic Tabs */}
        <main
          ref={mainContentRef}
          className="flex-1 px-4 pb-28"
        >
          {activeTab === 'home' && (
            <HomeTab
              user={user}
              videos={videos}
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              onOpenCategoryModal={() => setShowCategoryModal(true)}
              onSelectSubCategory={setSelectedSubCategory}
              onVideoClick={(v) => setActiveVideo(v)}
              onOpenWithdraw={() => setShowWithdraw(true)}
              onTabChange={handleTabChange}
              language={user?.language || 'bn'}
              onOpenAdLockedVideo={(v) => setActiveAdLockedVideo(v)}
              onOpenDigitalStore={() => setShowDigitalStore(true)}
            />
          )}

          {activeTab === 'refer' && (
            <ReferTab
              user={user}
              language={user?.language || 'bn'}
              onClaimTier={handleClaimTier}
              onClaimCommission={handleClaimCommission}
            />
          )}

          {activeTab === 'earn' && (
            <EarnTab
              user={user}
              language={user?.language || 'bn'}
              onWatchAd={() => {
                triggerAdsterraPopunder();
                const maxDailyLimit = incomeConfig?.ads?.dailyLimit || user.dailyAdLimit || 40;
                if ((user.adsWatchedToday || 0) >= maxDailyLimit) {
                  addNotification({
                    id: 'limit-err-' + Date.now(),
                    title: '⚠️ দৈনিক কাজের লিমিট পূর্ণ',
                    body: `আজকের সর্বোচ্চ কাজের লিমিট (${maxDailyLimit} টি) পূর্ণ হয়েছে। আগামী কাল আবার কাজ করতে পারবেন।`,
                  });
                  return;
                }
                const directAdLink = incomeConfig?.ads?.directAdUrl || 'https://omg10.com/4/11869572';
                const adRewardUsd = Number(incomeConfig?.ads?.rewardUsd) || 0.0125;
                const bdtVal = Number(incomeConfig?.ads?.rewardBdt) || +(adRewardUsd * 120).toFixed(2);

                // Open active security ad watcher modal enforcing 15s timer & mandatory click
                setAdWatchingSession({
                  isOpen: true,
                  title: '🎬 স্পন্সরড বিজ্ঞাপন ভেরিফিকেশন',
                  duration: 15,
                  rewardBdt: bdtVal,
                  rewardUsd: adRewardUsd,
                  directAdUrl: directAdLink,
                });
              }}
              onCompleteTask={handleCompleteTask}
              onOpenOfficialNotice={() => setShowOfficialNotice(true)}
              onTabChange={handleTabChange}
              incomeConfig={incomeConfig}
            />
          )}

          {activeTab === 'rank' && (
            <RankTab
              user={user}
              language={user?.language || 'bn'}
              onOpenMegaContest={() => setShowMegaContest(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              language={user?.language || 'bn'}
              onOpenWithdraw={() => setShowWithdraw(true)}
              onOpenHistory={() => setShowHistory(true)}
              onOpenSettings={() => setShowSettings(true)}
              onOpenAuth={() => setShowAuth(true)}
              onTestNotification={handleTestNotification}
            />
          )}
        </main>

        {/* Floating 24/7 Live Support Button (Bottom Left) */}
        <button
          id="floating-live-support-btn"
          onClick={() => setShowSupport(true)}
          className="fixed bottom-18 left-4 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white shadow-xl flex items-center justify-center border-2 border-white transition-all active:scale-95 group cursor-pointer"
          title="24/7 Live Support"
        >
          <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
        </button>

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          language={user?.language || 'bn'}
        />

        {/* Push Notification Toasts */}
        <PushNotificationToast
          notifications={notifications}
          onDismiss={handleDismissNotification}
        />

        {/* Modals */}
        <NotificationInboxModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={inboxNotifications}
          onClaimBonus={handleClaimInboxBonus}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearNotifications={handleClearNotifications}
        />

        <NotificationModal
          isOpen={showWelcome}
          onClose={() => setShowWelcome(false)}
          language={user?.language || 'bn'}
          user={user}
        />

        <OfficialNoticeModal
          isOpen={showOfficialNotice}
          onClose={() => setShowOfficialNotice(false)}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          user={user}
          currentLanguage={user?.language || 'bn'}
          currentCurrency={user?.currency || 'USD'}
          onSave={handleSaveSettings}
        />

        <CategoryModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          currentCategory={selectedCategory}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          language={user?.language || 'bn'}
        />

        <MegaContestModal
          isOpen={showMegaContest}
          onClose={() => setShowMegaContest(false)}
          language={user?.language || 'bn'}
        />

        <WithdrawModal
          isOpen={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          user={user}
          language={user?.language || 'bn'}
          onWithdrawSuccess={handleWithdrawSuccess}
        />

        <HistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          language={user?.language || 'bn'}
        />

        <VideoPlayerModal
          video={activeVideo}
          isOpen={activeVideo !== null}
          onClose={() => setActiveVideo(null)}
          user={user}
          onRewardClaimed={handleRewardClaimed}
        />

        {/* 15 Ad-Locked Video Player with 90-min Auto-Expiry & DRM */}
        <AdLockedVideoPlayerModal
          video={activeAdLockedVideo}
          isOpen={activeAdLockedVideo !== null}
          onClose={() => setActiveAdLockedVideo(null)}
          user={user}
          onUnlockSuccess={(videoId) => {
            setInboxNotifications((prev) => {
              if (prev.some((n) => n.id === `ad-video-unlocked-${videoId}`)) {
                return prev;
              }
              const newNotif = {
                id: `ad-video-unlocked-${videoId}`,
                type: 'video' as const,
                title: '🎉 সম্পূর্ণ ভিডিও ৯০ মিনিটের জন্য আনলক হয়েছে!',
                body: 'অভিনন্দন! বিজ্ঞাপন দেখা সম্পন্ন হওয়ায় সম্পূর্ণ ভিডিও দেখার এক্সেস দেওয়া হয়েছে।',
                details: 'পরবর্তী ৯০ মিনিট পর্যন্ত এই ভিডিওটি যেকোনো সময় কোনো বাধা ছাড়াই দেখতে পারবেন। ৯০ মিনিট পর ভিডিওটি স্বয়ংক্রিয়ভাবে পুনরায় লক হবে।',
                time: 'এইমাত্র',
                read: false,
              };
              return [newNotif, ...prev];
            });
          }}
        />

        {/* VIP Digital Store & Manual Payment Order Modal */}
        <DigitalStoreModal
          isOpen={showDigitalStore}
          onClose={() => setShowDigitalStore(false)}
          user={user}
          onOrderSuccess={(pkgTitle, amount) => {
            addInboxNotification({
              id: 'order-submitted-' + Date.now(),
              type: 'store',
              title: '📝 প্যাকেজ অর্ডার জমা হয়েছে',
              body: `"${pkgTitle}" প্যাকেজের জন্য ৳${amount} এর অর্ডার জমা হয়েছে। অ্যাডমিন ভেরিফিকেশন চলছে।`,
              details: `অর্ডারকৃত প্যাকেজ: ${pkgTitle}\nমূল্য: ৳${amount} টাকা\nপেমেন্ট ভেরিফিকেশন সম্পন্ন ও অনুমোদিত হলে আপনার ফাইলে ডাউনলোড লিংক যোগ হবে। বাতিল হলে বাতিল কারণ জানানো হবে।`,
            });
          }}
          onOrderStatusUpdate={(order, status) => {
            if (status === 'Approved') {
              addInboxNotification({
                id: 'order-approved-' + order.id,
                type: 'store',
                title: '🎉 প্যাকেজ ক্রয় অনুমোদিত ও সফল হয়েছে!',
                body: `অভিনন্দন! আপনার "${order.packageTitle}" প্যাকেজের পেমেন্ট অনুমোদিত হয়েছে।`,
                details: `প্যাকেজ: ${order.packageTitle}\nমূল্য: ৳${order.amountBdt}\nTrxID: ${order.transactionId}\nফাইল ও ভিডিও ডাউনলোড লিংক রেডি। স্টোরের "আমার ক্রয়কৃত ফাইল" অপশন থেকে এখনই এক্সেস করুন।`,
              });
            } else if (status === 'Rejected') {
              addInboxNotification({
                id: 'order-rejected-' + order.id,
                type: 'store',
                title: '❌ প্যাকেজ অর্ডার বাতিল করা হয়েছে',
                body: `দুঃখিত, "${order.packageTitle}" প্যাকেজের অর্ডারটি বাতিল করা হয়েছে।`,
                details: `প্যাকেজ: ${order.packageTitle}\nঅর্ডার আইডি: ${order.id}\nবাতিলের কারণ: ${order.rejectionReason || 'ভুল বা অসত্য TrxID / পেমেন্ট ভেরিফাই হয়নি'}।\nএই অর্ডারের জন্য কোনো ফাইল প্রদান করা হয়নি। সঠিক তথ্য দিয়ে পুনরায় অর্ডার করুন।`,
              });
            }
          }}
        />

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          currentUser={user}
          onUpdateUser={syncUser}
        />

        <SupportModal
          isOpen={showSupport}
          onClose={() => setShowSupport(false)}
          language={user?.language || 'bn'}
        />

        {/* Mandatory Full Time Watching & Click Verified Ad Modal */}
        {adWatchingSession && (
          <AdWatchingModal
            isOpen={adWatchingSession.isOpen}
            onClose={() => setAdWatchingSession(null)}
            title={adWatchingSession.title}
            duration={adWatchingSession.duration}
            rewardBdt={adWatchingSession.rewardBdt}
            rewardUsd={adWatchingSession.rewardUsd}
            directAdUrl={adWatchingSession.directAdUrl}
            onClaimReward={() => {
              const maxDailyLimit = incomeConfig?.ads?.dailyLimit || user.dailyAdLimit || 40;
              const nextCount = (user.adsWatchedToday || 0) + 1;
              syncUser({
                balanceUsd: +(user.balanceUsd + adWatchingSession.rewardUsd).toFixed(4),
                adsWatchedToday: nextCount,
              });
              fetch('/api/tasks/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId: 'ad-watch-' + Date.now(),
                  rewardUsd: adWatchingSession.rewardUsd,
                  type: 'ad',
                }),
              }).catch(() => {});
              addInboxNotification({
                id: 'direct-ad-' + Date.now(),
                type: 'ad_locked',
                title: '🎉 বিজ্ঞাপন দেখা সম্পন্ন!',
                body: `বিজ্ঞাপন দেখার জন্য সফলভাবে +৳${adWatchingSession.rewardBdt.toFixed(2)} ($${adWatchingSession.rewardUsd.toFixed(4)}) অ্যাকাউন্টে যোগ হয়েছে! (${nextCount}/${maxDailyLimit})`,
                details: `বিজ্ঞাপন লিংক: ${adWatchingSession.directAdUrl}\nপারিশ্রমিক: ৳${adWatchingSession.rewardBdt.toFixed(2)} ($${adWatchingSession.rewardUsd})\nআজ মোট কাজ করা হয়েছে: ${nextCount}/${maxDailyLimit} টি।`,
              });
            }}
          />
        )}

        {/* Personal Warning / Notice Modal sent from Admin */}
        <UserPersonalWarningModal
          notifications={user.personalNotifications || []}
          onDismiss={(notifId) => {
            fetch('/api/user/notifications/mark-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notificationId: notifId }),
            }).catch(() => {});
            syncUser({
              personalNotifications: (user.personalNotifications || []).map((n) =>
                n.id === notifId ? { ...n, isRead: true } : n
              ),
            });
          }}
        />
      </div>
    </div>
  );
}
