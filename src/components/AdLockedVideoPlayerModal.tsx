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
  Film,
  Zap,
  Eye,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdLockedVideo, UserProfile } from '../types';
import { showMonetagRewardedAd } from '../utils/monetag';

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

  // Active watching Monetag ad state
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

  // Sending to channel status
  const [isSendingToChannel, setIsSendingToChannel] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize data on open
  useEffect(() => {
    if (!isOpen || !video) return;

    setIsExpired(false);
    setIsAdPlaying(false);
    setIsAdSubmitting(false);
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

  if (!isOpen || !video) return null;

  const requiredAds = video.requiredAds || 1;
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

  // Handle Watch Demo in Inbox (Top Button)
  const handleWatchDemoInInbox = () => {
    const targetUrl =
      video.previewVideoUrl && video.previewVideoUrl.includes('t.me')
        ? video.previewVideoUrl
        : video.demoChannelUrl || 'https://t.me/demovideos24';
    openTelegramLinkSafe(targetUrl);
  };

  // Trigger real Monetag rewarded ad (show_11898539 / show_11898539('pop'))
  const handleWatchMonetagAd = async () => {
    if (isAdPlaying || isAdSubmitting) return;
    setIsAdPlaying(true);
    setStatusNotification(null);

    try {
      // 1. Invoke official Monetag Rewarded format
      const completed = await showMonetagRewardedAd();

      if (completed) {
        setIsAdSubmitting(true);
        const res = await fetch('/api/ad-videos/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: video.id, userId: user.id }),
        });
        const data = await res.json();

        if (data.success) {
          setAdsWatched(data.adsWatched);

          if (data.canSendInbox || data.adsWatched >= requiredAds) {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
            setStatusNotification({
              type: 'success',
              text: '🎉 বিজ্ঞাপন দেখা সম্পন্ন হয়েছে! এবার নিচের নীল বাটনে ক্লিক করে ইনবক্সে ফুল ভিডিও নিন।',
            });
            onUnlockSuccess?.(video.id);
          } else {
            setStatusNotification({
              type: 'success',
              text: `একটি বিজ্ঞাপন সম্পন্ন হয়েছে! বাকি আছে ${Math.max(0, requiredAds - data.adsWatched)}টি।`,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[Monetag] Ad watch error:', err);
      // Fallback increment so users are never permanently blocked
      setAdsWatched((prev) => prev + 1);
    } finally {
      setIsAdPlaying(false);
      setIsAdSubmitting(false);
    }
  };

  // User clicks "Send Inbox": Bot uploads video and IMMEDIATELY opens Telegram channel
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

        // Haptic feedback
        try {
          (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        } catch {}

        confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 } });

        setStatusNotification({
          type: 'success',
          text: data.message || '✅ ফুল ভিডিও চ্যানেলে আপলোড হয়েছে!',
        });

        if (onUnlockSuccess) onUnlockSuccess(video.id);

        // INSTANT REDIRECT: Immediately open the Telegram Channel so user has ZERO wait!
        if (data.postUrl) {
          setTimeout(() => {
            openTelegramLinkSafe(data.postUrl);
          }, 350);
        }
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
        {/* Modal Container: Yellow / Gold Telegram Theme as requested by user */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          id="ad-locked-video-container"
          className="bg-gradient-to-b from-[#fef08a] via-[#fde047] to-[#eab308] border-2 border-amber-400 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[94vh] text-slate-900 relative select-none"
        >
          {/* Top Header */}
          <div className="p-3 px-4 bg-amber-400/90 border-b border-amber-500/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse" />
              <span className="text-xs font-black tracking-wide text-slate-900 uppercase">
                🎁 স্পেশাল আনলক ভিডিও
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-90 text-slate-900 flex items-center justify-center transition-all cursor-pointer font-bold shadow-xs"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hero Thumbnail Banner Card (No in-app player) */}
          <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden border-b-2 border-amber-400">
            <img
              src={video.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=70'}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            {/* Badges on Thumbnail */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>প্রাইভেট মেথড</span>
              </span>
            </div>

            <div className="absolute top-2.5 right-2.5">
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow-md flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>৯০ মি. অটো-ডিলিট</span>
              </span>
            </div>

            {/* Duration Badges at bottom of image */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-black text-white">
              <span className="bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/20 flex items-center gap-1">
                <Film className="w-3 h-3 text-amber-300" />
                <span>ডেমো: {video.previewDuration || '02:00'}</span>
              </span>

              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md shadow-sm font-black flex items-center gap-1">
                <Zap className="w-3 h-3 fill-slate-950" />
                <span>ফুল: {video.fullDuration || '18:40'}</span>
              </span>
            </div>
          </div>

          {/* Modal Content Body on Yellow Canvas */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-amber-50/70">
            {/* Title & Description */}
            <div>
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  {video.description}
                </p>
              )}
            </div>

            {/* 3 Info Badges Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/90 border border-amber-300 rounded-xl p-2 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 block font-bold">প্রয়োজনীয় এডস</span>
                <span className="text-xs font-black text-amber-600">{requiredAds} টি</span>
              </div>
              <div className="bg-white/90 border border-amber-300 rounded-xl p-2 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 block font-bold">লাইভ থাকবে</span>
                <span className="text-xs font-black text-rose-600">{video.expiryMinutes || 90} মিনিট</span>
              </div>
              <div className="bg-white/90 border border-amber-300 rounded-xl p-2 text-center shadow-xs">
                <span className="text-[10px] text-slate-600 block font-bold">সুরক্ষা</span>
                <span className="text-xs font-black text-emerald-600">নো-ডাউনলোড</span>
              </div>
            </div>

            {/* Status Notifications */}
            {statusNotification && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs ${
                  statusNotification.type === 'success'
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                    : 'bg-rose-100 border-rose-400 text-rose-900'
                }`}
              >
                {statusNotification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusNotification.text}</span>
              </div>
            )}

            {/* If Delivered & Active in Telegram Channel */}
            {isDelivered && !isExpired && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black text-emerald-900">ফুল ভিডিও চ্যানেলে আপলোড হয়েছে!</span>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                    ⏱ {formatExpiryTime(remainingExpireSeconds)} বাকি
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  বট দ্বারা @demovideos24 চ্যানেলে ভিডিওটি আপলোড করা হয়েছে। ডাউনলোড বা ফরওয়ার্ড করা যাবে না। ৯০ মিনিট পর স্বয়ংক্রিয়ভাবে মুছে যাবে।
                </p>
              </div>
            )}

            {/* If Expired */}
            {isExpired && (
              <div className="bg-rose-50 border border-rose-300 rounded-2xl p-2.5 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>৯০ মিনিটের মেয়াদ শেষ হয়েছে</span>
                </div>
                <p className="text-[11px] text-slate-600">ভিডিওটি চ্যানেল থেকে স্বয়ংক্রিয়ভাবে ডিলিট হয়ে গেছে।</p>
              </div>
            )}

            {/* Ad Progress Bar */}
            {!isDelivered && (
              <div className="bg-white/90 border border-amber-300 rounded-2xl p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    বিজ্ঞাপন অগ্রগতি:
                  </span>
                  <span className={isAdsComplete ? 'text-emerald-600' : 'text-amber-700'}>
                    {adsWatched} / {requiredAds} সম্পন্ন
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAdsComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-600'
                    }`}
                    style={{ width: `${Math.min(100, (adsWatched / requiredAds) * 100)}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  {isAdsComplete
                    ? '✅ বিজ্ঞাপন শেষ! নিচের নীল বাটনে ক্লিক করলেই বট চ্যানেলে ফুল ভিডিও আপলোড করবে।'
                    : `ফুল ভিডিও পেতে আর ${Math.max(0, requiredAds - adsWatched)}টি স্পন্সর বিজ্ঞাপন দেখুন।`}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Footer: WATCH DEMO ON TOP, WATCH FULL VIDEO ON BOTTOM (Exact User Request) */}
          <div className="p-4 bg-amber-400/90 border-t border-amber-500/50 flex flex-col gap-2.5">
            {/* 1. TOP BUTTON: Watch Demo in Inbox (ওপরে) */}
            <button
              id="watch-demo-inbox-top-btn"
              type="button"
              onClick={handleWatchDemoInInbox}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer border border-slate-700"
            >
              <Film className="w-4 h-4 text-amber-300" />
              <span>Watch Demo in Inbox (ইনবক্সে ডেমো ভিডিও দেখুন)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 2. BOTTOM BUTTON: Watch Full Video / Send Inbox (নিচে, ছবিতে থাকা হুবহু Vibrant Telegram Blue রঙ!) */}
            {isDelivered && !isExpired ? (
              <button
                type="button"
                onClick={() => {
                  const targetUrl = channelPostUrl || 'https://t.me/demovideos24';
                  openTelegramLinkSafe(targetUrl);
                }}
                className="w-full py-3.5 px-4 bg-[#007aff] hover:bg-[#0069d9] active:scale-98 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>চ্যানেলে সম্পূর্ণ ফুল ভিডিও দেখুন (Open in Channel)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : isAdsComplete ? (
              <button
                id="send-inbox-bottom-btn"
                type="button"
                disabled={isSendingToChannel}
                onClick={handleSendInbox}
                className="w-full py-4 px-4 bg-[#007aff] hover:bg-[#0069d9] active:scale-98 text-white rounded-2xl font-black text-base shadow-2xl flex items-center justify-center gap-2 transition-all cursor-pointer animate-bounce"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingToChannel
                    ? 'বট চ্যানেলে ভিডিও আপলোড করছে...'
                    : 'ইনবক্সে ফুল ভিডিও পাঠান (Send Inbox) 🚀'}
                </span>
              </button>
            ) : (
              <button
                id="watch-ad-bottom-btn"
                type="button"
                disabled={isAdPlaying || isAdSubmitting}
                onClick={handleWatchMonetagAd}
                className="w-full py-3.5 px-4 bg-[#007aff] hover:bg-[#0069d9] active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isAdPlaying || isAdSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>বিজ্ঞাপন চলছে... (Watching Monetag Ad)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      বিজ্ঞাপন দেখুন ({adsWatched + 1}/{requiredAds}) - Watch Ad
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
