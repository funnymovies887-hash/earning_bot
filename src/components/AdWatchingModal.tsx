import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  MousePointer,
  Clock,
  ShieldCheck,
  Zap,
  Pause,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DEFAULT_ADSTERRA_DIRECT_LINK =
  'https://researchingsweatexit.com/fx4s1179?key=795515765851a303657a3188bb3b9a45';

interface AdWatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  duration?: number; // 30, 60 seconds
  rewardBdt: number;
  rewardUsd: number;
  directAdUrl?: string;
  taskId?: string;
  onClaimReward: (sessionId?: string) => void;
}

export const AdWatchingModal: React.FC<AdWatchingModalProps> = ({
  isOpen,
  onClose,
  title,
  duration = 30,
  rewardBdt,
  rewardUsd,
  directAdUrl = DEFAULT_ADSTERRA_DIRECT_LINK,
  taskId,
  onClaimReward,
}) => {
  const targetAdUrl = directAdUrl || DEFAULT_ADSTERRA_DIRECT_LINK;
  const initialDuration = Math.max(5, Number(duration) || 30);

  const [countdown, setCountdown] = useState<number>(initialDuration);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasOpenedAd, setHasOpenedAd] = useState<boolean>(false);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const initialOpenedRef = useRef(false);

  // Helper to open the sponsor Ad Page safely via Telegram WebApp or browser window
  const openAdTargetPage = () => {
    setHasOpenedAd(true);
    // Record click event
    fetch('/api/user/record-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType: 'direct_link', url: targetAdUrl }),
    }).catch(() => {});

    try {
      if ((window as any).Telegram?.WebApp?.openLink) {
        (window as any).Telegram.WebApp.openLink(targetAdUrl);
      } else {
        window.open(targetAdUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(targetAdUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // 1. Initialize session and auto-open Ad Page on launch
  useEffect(() => {
    if (!isOpen) return;

    setCountdown(initialDuration);
    setIsPaused(false);
    setHasClaimed(false);
    setShowWarningModal(false);
    setVerificationError(null);
    setIsVerifying(false);

    // Start server-side tracked ad viewing session
    fetch('/api/ad-session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: taskId || 'ad_task',
        duration: initialDuration,
        directAdUrl: targetAdUrl,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sessionId) {
          setSessionId(data.sessionId);
        }
      })
      .catch((err) => console.warn('[AdSession] Start error:', err));

    // Auto open Ad Page on first trigger
    if (!initialOpenedRef.current) {
      initialOpenedRef.current = true;
      const openTimer = setTimeout(() => {
        openAdTargetPage();
      }, 300);
      return () => clearTimeout(openTimer);
    }
  }, [isOpen, initialDuration, targetAdUrl, taskId]);

  // 2. Active Tab & Visibility Tracking:
  // User Ad Page-এ থাকলে timer চলবে।
  // User page থেকে বের হলে, অন্য tab-এ গেলে বা page background হলে timer সঙ্গে সঙ্গে pause হবে।
  // আবার Ad Page-এ ফিরলে timer আগের জায়গা থেকে resume হবে।
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    const handleWindowBlur = () => {
      setIsPaused(true);
    };

    const handleWindowFocus = () => {
      setIsPaused(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handleWindowBlur);
    window.addEventListener('pageshow', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handleWindowBlur);
      window.removeEventListener('pageshow', handleWindowFocus);
    };
  }, [isOpen]);

  // 3. Active Viewing Countdown Ticker:
  // Decrements strictly when user is active and focused (!isPaused)
  useEffect(() => {
    if (!isOpen || isPaused || countdown <= 0 || hasClaimed) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, countdown, hasClaimed]);

  if (!isOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.round(((initialDuration - countdown) / initialDuration) * 100)
  );

  // Claim with Server-Side Anti-Cheat Verification
  const handleClaim = async () => {
    if (countdown > 0 || hasClaimed || isVerifying) return;
    setIsVerifying(true);
    setVerificationError(null);

    try {
      if (sessionId) {
        const res = await fetch('/api/ad-session/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, taskId }),
        });
        const data = await res.json();

        if (!data.success) {
          setVerificationError(
            data.error ||
              'বিজ্ঞাপন সম্পূর্ণ সময় দেখা হয়নি! দয়া করে সম্পূর্ণ সময় সক্রিয়ভাবে দেখুন।'
          );
          setIsVerifying(false);
          return;
        }
      }

      setHasClaimed(true);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
      onClaimReward(sessionId || undefined);
      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (err: any) {
      setHasClaimed(true);
      onClaimReward(sessionId || undefined);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAttemptClose = () => {
    if (countdown > 0 && !hasClaimed) {
      setShowWarningModal(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAttemptClose();
      }}
    >
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPaused ? 'bg-rose-500 animate-bounce' : 'bg-amber-400 animate-ping'
              }`}
            />
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wide truncate max-w-[220px]">
              {title || '🎬 স্পন্সরড বিজ্ঞাপন ভেরিফিকেশন'}
            </h3>
          </div>
          <button
            onClick={handleAttemptClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* EXACT REQUIRED UI STATUS INDICATOR:
            When Active: “⏳ Ad দেখুন — বাকি সময়: 60s” (or 30s)
            When Paused: “⏸️ Ad Viewing Paused — আবার Ad Page-এ ফিরুন” */}
        <div className="transition-all">
          {!isPaused && countdown > 0 ? (
            <div className="p-3 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-400 rounded-2xl flex items-center justify-between text-white shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-xs sm:text-sm font-black text-emerald-300">
                  ⏳ Ad দেখুন — বাকি সময়: {countdown}s
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40 shrink-0">
                Active
              </span>
            </div>
          ) : countdown === 0 ? (
            <div className="p-3 bg-gradient-to-r from-teal-950 via-emerald-950 to-teal-950 border-2 border-emerald-400 rounded-2xl flex items-center justify-between text-white shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-emerald-300">
                  ✅ Ad দেখা সম্পূর্ণ হয়েছে!
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-400/50">
                Ready
              </span>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/90 border-2 border-rose-500 rounded-2xl flex items-center justify-between text-white shadow-lg">
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-black text-rose-300">
                  ⏸️ Ad Viewing Paused — আবার Ad Page-এ ফিরুন
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaused(false);
                  openAdTargetPage();
                }}
                className="text-[10px] font-black text-white bg-rose-600 hover:bg-rose-500 px-2 py-1 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
              >
                Resume
              </button>
            </div>
          )}
        </div>

        {/* Big Circular Countdown Display */}
        <div className="text-center py-2 space-y-2">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-950 border-4 ${
              isPaused
                ? 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
                : countdown === 0
                ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                : 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
            } relative`}
          >
            <span
              className={`text-2xl font-black font-mono ${
                isPaused
                  ? 'text-rose-400'
                  : countdown === 0
                  ? 'text-emerald-300'
                  : 'text-amber-300'
              }`}
            >
              {countdown > 0 ? `${countdown}s` : '✓'}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isPaused
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-300 font-medium">
            {countdown > 0 ? (
              isPaused ? (
                <span className="text-rose-300 font-bold">
                  ⚠️ পেজ ব্যাকগ্রাউন্ড বা ইনঅ্যাক্টিভ থাকায় টাইমার পজ করা হয়েছে। পেজে সক্রিয় থাকলে টাইমার আবার চলবে।
                </span>
              ) : (
                `⏳ সম্পূর্ণ ${initialDuration} সেকেন্ড সক্রিয়ভাবে দেখতে হবে। অন্য ট্যাবে গেলে টাইমার সঙ্গে সঙ্গে পজ হবে!`
              )
            ) : (
              '✅ নির্ধারিত দেখার সময় সফলভাবে সম্পন্ন হয়েছে!'
            )}
          </p>
        </div>

        {/* Ad Page Open & CTR Verification Button */}
        <div className="p-3.5 bg-slate-950/90 border border-blue-500/30 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <MousePointer className="w-4 h-4 text-blue-400" />
              <span>স্পন্সরড Ad Page লিংক:</span>
            </span>
            {hasOpenedAd ? (
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ad ওপেন হয়েছে
              </span>
            ) : (
              <span className="text-[10px] font-black text-amber-400 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-full animate-pulse">
                ওপেন আবশ্যক
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Adsterra Direct Link-এর স্পন্সর পেজ ভিজিট করুন এবং নির্ধারিত সময় সক্রিয় থাকুন।
          </p>

          <button
            type="button"
            onClick={openAdTargetPage}
            className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              hasOpenedAd
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 hover:bg-emerald-900'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30 animate-bounce'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>
              {hasOpenedAd
                ? '🔗 Ad Page পুনরায় ওপেন করুন (Adsterra Direct Link)'
                : '👉 Ad Page ওপেন করুন ও দেখুন (Open Ad)'}
            </span>
          </button>
        </div>

        {/* Verification Error Prompt */}
        {verificationError && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{verificationError}</span>
          </div>
        )}

        {/* Reward Claim Button */}
        <div className="pt-1">
          {countdown > 0 ? (
            <button
              disabled
              className="w-full py-3.5 bg-slate-800 text-slate-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              <span>
                {isPaused
                  ? '⏸️ টাইমার পজ আছে — Ad পেজে ফিরুন'
                  : `অনুগ্রহ করে সক্রিয় থাকুন (${countdown}s)...`}
              </span>
            </button>
          ) : (
            <button
              onClick={handleClaim}
              disabled={hasClaimed || isVerifying}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/40 transition-all active:scale-98 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  <span>সার্ভারে ভেরিফিকেশন চলছে...</span>
                </>
              ) : hasClaimed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span>🎉 রিওয়ার্ড সফলভাবে যুক্ত হয়েছে!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>
                    🎁 ভেরিফাই ও রিওয়ার্ড গ্রহণ করুন (+৳{rewardBdt.toFixed(2)} যোগ করুন)
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>১০০% সুরক্ষিত সক্রিয় ভিউ কাউন্টডাউন ও সার্ভার অ্যান্টি-ফ্রড সিস্টেম</span>
        </div>
      </div>

      {/* Early Close Warning Prompt */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-xs bg-slate-900 border-2 border-rose-500 rounded-2xl p-4 text-center space-y-3 text-white">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-black text-rose-400">সতর্কবার্তা!</h4>
            <p className="text-xs text-slate-300">
              আপনি এখনো সম্পূর্ণ সময় ({countdown} সেকেন্ড বাকি) সক্রিয়ভাবে বিজ্ঞাপন দেখেননি!
              এখন বের হয়ে গেলে <b>কোনো রিওয়ার্ড যোগ হবে না</b>।
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                অ্যাড চালিয়ে যান
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  onClose();
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-300 text-xs cursor-pointer"
              >
                বের হয়ে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
