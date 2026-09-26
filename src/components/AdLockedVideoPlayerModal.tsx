import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Clock,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Send,
  RotateCcw,
  Check,
  Eye,
  Film,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdLockedVideo, UserProfile } from '../types';

interface AdLockedVideoPlayerModalProps {
  video: AdLockedVideo | null;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUnlockSuccess?: (videoId: string) => void;
}

export const AdLockedVideoPlayerModal: React.FC<AdLockedVideoPlayerModalProps> = ({
  video,
  isOpen,
  onClose,
  user,
  onUnlockSuccess,
}) => {
  // Ads progress state
  const [adsWatched, setAdsWatched] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [channelPostUrl, setChannelPostUrl] = useState<string | null>(null);
  const [remainingExpireSeconds, setRemainingExpireSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  // Active watching ad modal/timer
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [canClaimAd, setCanClaimAd] = useState(false);
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

  // Sending to channel status
  const [isSendingToChannel, setIsSendingToChannel] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize data on open
  useEffect(() => {
    if (!isOpen || !video) return;

    setIsExpired(false);
    setIsWatchingAd(false);
    setStatusNotification(null);
    setAdsWatched(video.adsWatched || 0);
    setIsUnlocked(Boolean(video.unlocked || video.isUnlocked));
    setIsDelivered(Boolean(video.delivered));
    setChannelPostUrl(video.channelPostUrl || null);

    if (video.expiresAt) {
      const rem = Math.max(0, Math.floor((video.expiresAt - Date.now()) / 1000));
      setRemainingExpireSeconds(rem);
      if (rem <= 0 && video.delivered) {
        setIsExpired(true);
        setIsDelivered(false);
      }
    } else if (video.remainingSeconds && video.remainingSeconds > 0) {
      setRemainingExpireSeconds(video.remainingSeconds);
    } else {
      setRemainingExpireSeconds(0);
    }

    // Ping view count
    fetch('/api/ad-videos/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {});
  }, [isOpen, video]);

  // Real-time 90-minute countdown ticker when video is active
  useEffect(() => {
    if (!isDelivered || remainingExpireSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingExpireSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDelivered(false);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDelivered, remainingExpireSeconds]);

  // Active Ad Countdown Timer
  useEffect(() => {
    if (!isWatchingAd) return;

    setCanClaimAd(false);
    const targetSeconds = video?.adTimerSeconds || 15;
    setAdCountdown(targetSeconds);

    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClaimAd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWatchingAd, video]);

  if (!isOpen || !video) return null;

  const requiredAds = video.requiredAds || 1;
  const timerSeconds = video.adTimerSeconds || 15;
  const isAdsComplete = adsWatched >= requiredAds;

  // Format 90-minute countdown into MM:SS
  const formatExpiryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Safe Telegram Link opener
  const openTelegramLinkSafe = (targetUrl: string) => {
    if (!targetUrl) return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink && (targetUrl.startsWith('https://t.me/') || targetUrl.startsWith('tg://'))) {
      tg.openTelegramLink(targetUrl);
    } else if (tg?.openLink) {
      tg.openLink(targetUrl);
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle Watch Demo in Inbox (Demo Video Channel)
  const handleWatchDemoInInbox = () => {
    // Priority: specific post link -> channel url -> default demo channel
    const targetUrl =
      video.previewVideoUrl && video.previewVideoUrl.includes('t.me')
        ? video.previewVideoUrl
        : video.demoChannelUrl || 'https://t.me/demovideos24';
    openTelegramLinkSafe(targetUrl);
  };

  // Start watching an ad
  const handleStartWatchAd = () => {
    setIsWatchingAd(true);
    try {
      const adUrl = video.adNetworkUrl || 'https://omg10.com/4/11882677';
      window.open(adUrl, '_blank', 'noopener,noreferrer');
    } catch {}
  };

  // Complete ad step and sync with backend
  const handleClaimAdStep = async () => {
    if (!canClaimAd || isAdSubmitting) return;
    setIsAdSubmitting(true);

    try {
      const res = await fetch('/api/ad-videos/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id, userId: user.id }),
      });
      const data = await res.json();

      if (data.success) {
        setAdsWatched(data.adsWatched);

        if (data.canSendInbox || data.adsWatched >= requiredAds) {
          setIsWatchingAd(false);
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          setStatusNotification({
            type: 'success',
            text: '🎉 বিজ্ঞাপন দেখা সম্পন্ন হয়েছে! এবার নিচের "Send Inbox" বাটনে ক্লিক করুন।',
          });
        } else {
          setIsWatchingAd(false);
          setStatusNotification({
            type: 'success',
            text: `একটি বিজ্ঞাপন সম্পন্ন হয়েছে! বাকি আছে ${Math.max(0, requiredAds - data.adsWatched)}টি।`,
          });
        }
      }
    } catch {
      // Fallback
      const next = adsWatched + 1;
      setAdsWatched(next);
      setIsWatchingAd(false);
    } finally {
      setIsAdSubmitting(false);
    }
  };

  // User clicks "Send Inbox": Bot uploads full video to demo video channel
  const handleSendInbox = async () => {
    if (isSendingToChannel) return;
    setIsSendingToChannel(true);
    setStatusNotification(null);

    try {
      const res = await fetch('/api/ad-videos/send-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id, userId: user.id }),
      });
      const data = await res.json();

      if (data.success) {
        setIsDelivered(true);
        setIsUnlocked(true);
        setChannelPostUrl(data.postUrl);
        setRemainingExpireSeconds(data.remainingSeconds || 90 * 60);
        setIsExpired(false);

        // Haptic feedback & Confetti
        try {
          (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        } catch {}
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 } });

        setStatusNotification({
          type: 'success',
          text: data.message || '✅ সম্পূর্ণ ফুল ভিডিওটি টেলিগ্রাম চ্যানেলে সফলভাবে আপলোড হয়েছে!',
        });

        if (onUnlockSuccess) onUnlockSuccess(video.id);
      } else {
        setStatusNotification({
          type: 'error',
          text: data.error || 'চ্যানেলে ভিডিও পোস্ট পাঠাতে সমস্যা হয়েছে। বট এডমিন আছে কিনা চেক করুন।',
        });
      }
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        text: 'নেটওয়ার্ক সমস্যা: ' + err.message,
      });
    } finally {
      setIsSendingToChannel(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="ad-locked-video-modal-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          id="ad-locked-video-container"
          className="bg-slate-950 border border-purple-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white relative select-none"
        >
          {/* Header */}
          <div className="p-3 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-black tracking-wide text-purple-200 uppercase">
                প্রিমিয়াম ভিডিও মেথড
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hero Thumbnail Banner Card (No in-app video player as requested) */}
          <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
            <img
              src={video.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=70'}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

            {/* Badges on Thumbnail */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-extrabold text-[10px] shadow-md backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>প্রাইভেট মেথড</span>
              </span>
            </div>

            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-black text-[10px] shadow-md backdrop-blur-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>৯০ মি. অটো-ডিলিট</span>
              </span>
            </div>

            {/* Duration Badges at bottom of image */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-black text-white">
              <span className="bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/10 flex items-center gap-1">
                <Film className="w-3 h-3 text-purple-400" />
                <span>ডেমো: {video.previewDuration || '02:00'}</span>
              </span>

              <span className="bg-amber-500/90 text-slate-950 px-2 py-0.5 rounded-md shadow-sm font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 fill-slate-950" />
                <span>ফুল ভিডিও: {video.fullDuration || '18:40'}</span>
              </span>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-4 space-y-3.5 overflow-y-auto flex-1 bg-slate-950">
            {/* Title & Description */}
            <div>
              <h3 className="text-base font-black text-white leading-snug">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {video.description}
                </p>
              )}
            </div>

            {/* 3 Info Badges Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">প্রয়োজনীয় এডস</span>
                <span className="text-xs font-black text-amber-400">{requiredAds} টি</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">লাইভ থাকবে</span>
                <span className="text-xs font-black text-rose-400">{video.expiryMinutes || 90} মিনিট</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-center">
                <span className="text-[10px] text-slate-400 block font-medium">সুরক্ষা (DRM)</span>
                <span className="text-xs font-black text-emerald-400">নো-ডাউনলোড</span>
              </div>
            </div>

            {/* Status Notifications */}
            {statusNotification && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  statusNotification.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                }`}
              >
                {statusNotification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{statusNotification.text}</span>
              </div>
            )}

            {/* If Delivered & Active in Telegram Channel */}
            {isDelivered && !isExpired && (
              <div className="bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/60 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-extrabold text-emerald-300">চ্যানেলে ফুল ভিডিও আপলোড হয়েছে</span>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    ⏱ {formatExpiryTime(remainingExpireSeconds)} বাকি
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  বট দ্বারা @demovideos24 চ্যানেলে সম্পূর্ণ ফুল ভিডিওটি আপলোড করা হয়েছে। Telegram DRM সুরক্ষার কারণে ভিডিওটি কেউ ডাউনলোড বা ফরওয়ার্ড করতে পারবে না। ৯০ মিনিট পর স্বয়ংক্রিয়ভাবে চ্যানেল থেকে মুছে যাবে।
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-emerald-400 font-semibold border-t border-emerald-800/40">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> DRM Protected
                  </span>
                  <span>Auto-delete after 90m</span>
                </div>
              </div>
            )}

            {/* If 90-Minute Expired */}
            {isExpired && (
              <div className="bg-rose-950/70 border border-rose-800/60 rounded-2xl p-3 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-300">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>৯০ মিনিটের সময়সীমা শেষ হয়েছে</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  চ্যানেল থেকে ভিডিওটি অটোমেটিক ডিলিট হয়ে গেছে। পুনরায় ফুল ভিডিও পেতে বিজ্ঞাপন দেখুন।
                </p>
              </div>
            )}

            {/* Ad Progress Bar */}
            {!isDelivered && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    বিজ্ঞাপন দেখার অগ্রগতি:
                  </span>
                  <span className={isAdsComplete ? 'text-emerald-400' : 'text-amber-400'}>
                    {adsWatched} / {requiredAds} সম্পন্ন
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAdsComplete
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, (adsWatched / requiredAds) * 100)}%` }}
                  />
                </div>

                {/* Status Notice text */}
                <p className="text-[11px] text-slate-400 leading-normal">
                  {isAdsComplete
                    ? '✅ বিজ্ঞাপন দেখা শেষ! এবার নিচে থাকা "Send Inbox" বাটনে ক্লিক করলে বট চ্যানেলে ফুল ভিডিওটি আপলোড করবে।'
                    : `ভিডিওটি আনলক করতে আর ${Math.max(0, requiredAds - adsWatched)}টি স্পন্সর বিজ্ঞাপন দেখতে হবে।`}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Footer matching user instructions */}
          <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex flex-col gap-2.5">
            {/* Primary Action Button based on state */}
            {isDelivered && !isExpired ? (
              /* State 1: Already Delivered -> Open in Telegram Channel */
              <button
                type="button"
                onClick={() => {
                  const targetUrl = channelPostUrl || 'https://t.me/demovideos24';
                  openTelegramLinkSafe(targetUrl);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer animate-pulse"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>চ্যানেলে সম্পূর্ণ ফুল ভিডিও দেখুন (Open in Channel)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : isAdsComplete ? (
              /* State 2: Ads Finished -> Send Inbox Button */
              <button
                id="send-inbox-btn"
                type="button"
                disabled={isSendingToChannel}
                onClick={handleSendInbox}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl font-black text-sm shadow-2xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer animate-bounce"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingToChannel
                    ? 'বট চ্যানেলে ভিডিও আপলোড করছে...'
                    : 'ইনবক্সে পাঠান (Send Inbox) 🚀'}
                </span>
              </button>
            ) : (
              /* State 3: Ads Pending -> Watch Ad Button */
              <button
                id="watch-ad-btn"
                type="button"
                onClick={handleStartWatchAd}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>
                  বিজ্ঞাপন দেখুন ({adsWatched + 1}/{requiredAds}) - {timerSeconds}s
                </span>
              </button>
            )}

            {/* Secondary Action: Watch Demo in Inbox (Always Available) */}
            <button
              id="watch-demo-inbox-btn"
              type="button"
              onClick={handleWatchDemoInInbox}
              className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700/90 text-purple-300 hover:text-white border border-purple-500/30 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Watch Demo in Inbox (ইনবক্সে ডেমো ভিডিও দেখুন)</span>
              <ExternalLink className="w-3 h-3 text-purple-400" />
            </button>
          </div>

          {/* Interactive In-App Ad Watcher & Strict Countdown Gate Modal */}
          <AnimatePresence>
            {isWatchingAd && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-md p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-bold text-amber-300">
                      স্পন্সর বিজ্ঞাপন ভেরিফিকেশন (#{adsWatched + 1}/{requiredAds})
                    </span>
                  </div>
                  <button
                    onClick={() => setIsWatchingAd(false)}
                    className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  {/* Circular Timer Visual */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="text-slate-800 stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="text-purple-500 stroke-current transition-all duration-1000"
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * (timerSeconds - adCountdown)) / timerSeconds}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">{adCountdown}</span>
                      <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold">সেকেন্ড</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-white">
                      {canClaimAd ? '✅ বিজ্ঞাপন দেখা সফল হয়েছে!' : 'স্পন্সর ওয়েবসাইট ওপেন হয়েছে...'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                      {canClaimAd
                        ? 'নিচের বাটনে ক্লিক করে বিজ্ঞাপন সম্পন্ন করুন এবং পরবর্তী ধাপে যান।'
                        : `কাউন্টডাউন শূন্য (${timerSeconds}s) হওয়া পর্যন্ত অপেক্ষা করুন।`}
                    </p>
                  </div>

                  {/* Open ad again button if popup was blocked */}
                  {!canClaimAd && (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(video.adNetworkUrl || 'https://omg10.com/4/11882677', '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      স্পন্সর লিংক পুনরায় ওপেন করুন
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    id="claim-ad-step-btn"
                    disabled={!canClaimAd || isAdSubmitting}
                    onClick={handleClaimAdStep}
                    className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                      canClaimAd
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white cursor-pointer active:scale-98 animate-bounce'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isAdSubmitting
                        ? 'ভেরিফাই করা হচ্ছে...'
                        : canClaimAd
                        ? adsWatched + 1 >= requiredAds
                          ? '🎉 বিজ্ঞাপন সম্পন্ন করুন ও ইনবক্স আনলক করুন!'
                          : `বিজ্ঞাপন সম্পন্ন করুন (${adsWatched + 1}/${requiredAds})`
                        : `অপেক্ষা করুন (${adCountdown}s)`}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
