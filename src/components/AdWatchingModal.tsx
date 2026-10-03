import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdWatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  duration: number; // in seconds (e.g. 15)
  rewardBdt: number;
  rewardUsd: number;
  directAdUrl: string;
  onClaimReward: () => void;
}

export const AdWatchingModal: React.FC<AdWatchingModalProps> = ({
  isOpen,
  onClose,
  title,
  duration = 15,
  rewardBdt,
  rewardUsd,
  directAdUrl,
  onClaimReward,
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [hasClickedAd, setHasClickedAd] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(duration);
    setHasClickedAd(false);
    setHasClaimed(false);
    setShowWarningModal(false);

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
  }, [isOpen, duration]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((duration - countdown) / duration) * 100));

  const handleAdClick = () => {
    setHasClickedAd(true);

    // Record click on server to register CTR & daily work record
    fetch('/api/user/record-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adType: 'direct_link', url: directAdUrl }),
    }).catch(() => {});

    // Open target ad URL in browser or Telegram
    try {
      if ((window as any).Telegram?.WebApp?.openLink) {
        (window as any).Telegram.WebApp.openLink(directAdUrl);
      } else {
        window.open(directAdUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(directAdUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClaim = () => {
    if (countdown > 0 || !hasClickedAd || hasClaimed) return;
    setHasClaimed(true);
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.6 } });
    onClaimReward();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleAttemptClose = () => {
    if (countdown > 0 && !hasClaimed) {
      setShowWarningModal(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-5 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wide">
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

        {/* Big Circular/Progress Countdown Timer */}
        <div className="text-center py-2 space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-950 border-4 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)] relative">
            <span className="text-2xl font-black font-mono text-amber-300">
              {countdown > 0 ? `${countdown}s` : '✓'}
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-300 font-medium">
            {countdown > 0
              ? `⏳ সম্পূর্ণ ${duration} সেকেন্ড অপেক্ষা করতে হবে। সময়ের আগে বের হলে কোনো টাকা জমা হবে না!`
              : '✅ নির্ধারিত দেখার সময় সম্পন্ন হয়েছে!'}
          </p>
        </div>

        {/* MANDATORY CLICK VERIFICATION SECTION */}
        <div className="p-3.5 bg-slate-950/90 border border-blue-500/30 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-300 flex items-center gap-1.5">
              <MousePointer className="w-4 h-4 text-blue-400" />
              <span>বিজ্ঞাপনে ক্লিক ভেরিফিকেশন:</span>
            </span>
            {hasClickedAd ? (
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                ক্লিক ভেরিফাইড
              </span>
            ) : (
              <span className="text-[10px] font-black text-amber-400 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-full animate-pulse">
                ক্লিক আবশ্যক
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            বিজ্ঞাপনদাতাদের নিয়ম অনুযায়ী রিওয়ার্ড নিশ্চিত করতে বিজ্ঞাপনের লিংকে অবশ্যই অন্তত একবার ক্লিক করে ভিজিট নিশ্চিত করতে হবে।
          </p>

          <button
            type="button"
            onClick={handleAdClick}
            className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              hasClickedAd
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-300 hover:bg-emerald-900'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30 animate-bounce'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>
              {hasClickedAd
                ? '✅ বিজ্ঞাপনে ক্লিক সম্পন্ন হয়েছে (পুনরায় দেখতে চাপুন)'
                : '👉 বিজ্ঞাপনে ক্লিক করুন ও ভেরিফাই করুন (Click Ad)'}
            </span>
          </button>
        </div>

        {/* REWARD CLAIM BUTTON */}
        <div className="pt-1">
          {countdown > 0 ? (
            <button
              disabled
              className="w-full py-3.5 bg-slate-800 text-slate-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
            >
              <Clock className="w-4 h-4" />
              <span>অনুগ্রহ করে অপেক্ষা করুন ({countdown}s)...</span>
            </button>
          ) : !hasClickedAd ? (
            <button
              onClick={handleAdClick}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 animate-pulse cursor-pointer"
            >
              <MousePointer className="w-4 h-4" />
              <span>👆 প্রথমে বিজ্ঞাপনে ক্লিক করুন (Click Ad to Unlock)</span>
            </button>
          ) : (
            <button
              onClick={handleClaim}
              disabled={hasClaimed}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/40 transition-all active:scale-98 cursor-pointer"
            >
              {hasClaimed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span>🎉 রিওয়ার্ড সফলভাবে যুক্ত হয়েছে!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>🎁 রিওয়ার্ড গ্রহণ করুন (+৳{rewardBdt.toFixed(2)} যোগ করুন)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>১০০% সুরক্ষিত অ্যাড কাউন্টডাউন ও অ্যান্টি-ফ্রড সিস্টেম</span>
        </div>
      </div>

      {/* Early Close Warning Prompt */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-xs bg-slate-900 border-2 border-rose-500 rounded-2xl p-4 text-center space-y-3 text-white">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
            <h4 className="text-sm font-black text-rose-400">সতর্কবার্তা!</h4>
            <p className="text-xs text-slate-300">
              আপনি এখনো সম্পূর্ণ সময় ({countdown} সেকেন্ড বাকি) অপেক্ষা করেননি! এখন বের হয়ে গেলে <b>কোনো রিওয়ার্ড যোগ হবে না</b>।
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                অ্যাড চালিয়ে যান
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  onClose();
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-300 text-xs"
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
