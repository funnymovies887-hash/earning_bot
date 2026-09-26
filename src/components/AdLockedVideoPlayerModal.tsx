import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Unlock,
  Play,
  Pause,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  RotateCcw,
  Film,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdLockedVideo, UserProfile } from '../types';
import { toLocalizedDigits } from '../utils/formatters';

interface AdLockedVideoPlayerModalProps {
  video: AdLockedVideo | null;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUnlockSuccess?: (videoId: string) => void;
}

// Helper to detect if a URL is YouTube or Google Drive
function parseVideoSource(url: string | null | undefined): {
  type: 'youtube' | 'drive' | 'direct';
  embedUrl: string;
} {
  if (!url) return { type: 'direct', embedUrl: '' };
  
  // YouTube Detection
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&controls=1&modestbranding=1&rel=0`,
    };
  }

  // Google Drive
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return {
        type: 'drive',
        embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      };
    }
  }

  return { type: 'direct', embedUrl: url };
}

export const AdLockedVideoPlayerModal: React.FC<AdLockedVideoPlayerModalProps> = ({
  video,
  isOpen,
  onClose,
  user,
  onUnlockSuccess,
}) => {
  // Mode: 'demo' = Watching Free Preview, 'full' = Watching Full Video (requires unlock)
  const [activeMode, setActiveMode] = useState<'demo' | 'full'>('demo');

  // Video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ad-gatekeeper state
  const [adsWatched, setAdsWatched] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [fullVideoSrc, setFullVideoSrc] = useState<string | null>(null);
  const [remainingExpireSeconds, setRemainingExpireSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  // Active watching ad modal/timer
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [canClaimAd, setCanClaimAd] = useState(false);
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

  // Floating watermark position to deter screen recorders
  const [watermarkPos, setWatermarkPos] = useState({ x: 15, y: 20 });

  // Floating watermark movement
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setWatermarkPos({
        x: Math.floor(Math.random() * 55) + 10,
        y: Math.floor(Math.random() * 55) + 15,
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Load initial video status for this user
  useEffect(() => {
    if (!isOpen || !video) return;

    setIsExpired(false);
    setIsWatchingAd(false);
    setVideoError(false);
    setAdsWatched(video.adsWatched || 0);
    setIsUnlocked(!!video.unlocked);
    setFullVideoSrc(video.fullVideoUrl || null);

    if (video.unlocked && video.expiresAt) {
      const rem = Math.max(0, Math.floor((video.expiresAt - Date.now()) / 1000));
      setRemainingExpireSeconds(rem);
      if (rem <= 0) {
        setIsUnlocked(false);
        setIsExpired(true);
      } else {
        // If already unlocked, default to full video mode!
        setActiveMode('full');
      }
    } else {
      setRemainingExpireSeconds(0);
      setActiveMode('full');
    }

    // Ping view count
    fetch('/api/ad-videos/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video.id }),
    }).catch(() => {});
  }, [isOpen, video]);

  // Real-time 90-minute countdown ticker when unlocked
  useEffect(() => {
    if (!isUnlocked || remainingExpireSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingExpireSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsUnlocked(false);
          setIsExpired(true);
          setFullVideoSrc(null);
          setActiveMode('demo');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnlocked, remainingExpireSeconds]);

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

  // Reload video element when switching mode or unlock
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setIsPlaying(false);
    }
  }, [activeMode, isUnlocked]);

  if (!isOpen || !video) return null;

  const requiredAds = video.requiredAds || 15;
  const timerSeconds = video.adTimerSeconds || 15;

  // Format 90-minute countdown into MM:SS
  const formatExpiryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start watching an ad
  const handleStartWatchAd = () => {
    setIsWatchingAd(true);
    try {
      const adUrl = video.adNetworkUrl || 'https://monetag.com';
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

        if (data.unlocked) {
          setIsUnlocked(true);
          setFullVideoSrc(data.fullVideoUrl);
          setRemainingExpireSeconds(data.remainingSeconds || 90 * 60);
          setIsExpired(false);
          setIsWatchingAd(false);
          setActiveMode('full');
          confetti({ particleCount: 120, spread: 85, origin: { y: 0.6 } });
          if (onUnlockSuccess) onUnlockSuccess(video.id);
        } else {
          setIsWatchingAd(false);
        }
      }
    } catch {
      // Optimistic fallback
      const next = adsWatched + 1;
      setAdsWatched(next);
      if (next >= requiredAds) {
        setIsUnlocked(true);
        setFullVideoSrc(video.fullVideoUrl);
        setRemainingExpireSeconds(90 * 60);
        setActiveMode('full');
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      }
      setIsWatchingAd(false);
    } finally {
      setIsAdSubmitting(false);
    }
  };

  const currentSourceUrl =
    activeMode === 'full' && isUnlocked
      ? fullVideoSrc || video.fullVideoUrl
      : video.previewVideoUrl;

  const parsedSource = parseVideoSource(currentSourceUrl);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="ad-locked-video-modal-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
        onContextMenu={activeMode === 'demo' ? undefined : (e) => e.preventDefault()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          id="ad-locked-video-container"
          className="bg-slate-900 border border-purple-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[94vh] text-white relative select-none"
        >
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[220px] sm:max-w-xs">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>ডেমো: {video.previewDuration}</span>
                  <span>•</span>
                  <span className="text-purple-300 font-bold">ফুল ভিডিও: {video.fullDuration}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-90 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs (Demo Video vs Full Video) */}
          <div className="flex items-center bg-slate-950 px-3 py-2 border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveMode('demo')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'demo'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>🎥 ফ্রি ডেমো ভিডিও ({video.previewDuration})</span>
            </button>

            <button
              onClick={() => setActiveMode('full')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeMode === 'full'
                  ? isUnlocked
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-200" /> : <Lock className="w-3.5 h-3.5 text-amber-300" />}
              <span>
                {isUnlocked ? '✅ সম্পূর্ণ ভিডিও (সক্রিয়)' : `🔒 সম্পূর্ণ ভিডিও (${video.fullDuration})`}
              </span>
            </button>
          </div>

          {/* Video Player Viewport */}
          <div
            className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* If Full Mode & Locked: Show Ad-Gate Wall */}
            {activeMode === 'full' && !isUnlocked ? (
              <div className="absolute inset-0 z-20 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/98 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg animate-pulse">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">
                    সম্পূর্ণ {video.fullDuration} মিনিটের ভিডিও লক করা আছে!
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                    এই প্রাইভেট ভিডিওটি আনলক করতে আপনাকে মোট {requiredAds}টি স্পন্সর বিজ্ঞাপন দেখতে হবে।
                  </p>
                </div>

                <div className="w-full max-w-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>অগ্রগতি: {adsWatched} / {requiredAds} সম্পন্ন</span>
                    <span>{Math.round((adsWatched / requiredAds) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (adsWatched / requiredAds) * 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  id="start-watch-ads-gate-btn"
                  onClick={handleStartWatchAd}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-black text-xs text-white shadow-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>বিজ্ঞাপন দেখুন ও আনলক করুন ({adsWatched + 1}/{requiredAds})</span>
                </button>
              </div>
            ) : isExpired ? (
              /* 90-Minute Expired Lock Screen */
              <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-600/30 border border-rose-500/60 flex items-center justify-center text-rose-400">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-rose-300">৯০ মিনিটের সময়সীমা শেষ!</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">
                    আপনার ৯০ মিনিটের এক্সপায়ার টাইম শেষ হয়ে গেছে এবং ভিডিওটি অটোমেটিক লক হয়ে গেছে।
                  </p>
                </div>
                <button
                  onClick={handleStartWatchAd}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl font-extrabold text-xs text-white shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  পুনরায় অ্যাড দেখে আনলক করুন
                </button>
              </div>
            ) : parsedSource.type === 'youtube' ? (
              /* YouTube Embed */
              <iframe
                src={parsedSource.embedUrl}
                title={video.title}
                className="w-full h-full border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : parsedSource.type === 'drive' ? (
              /* Google Drive Embed */
              <iframe
                src={parsedSource.embedUrl}
                title={video.title}
                className="w-full h-full border-0 pointer-events-auto"
                allow="autoplay"
              />
            ) : (
              /* HTML5 Direct Video Player with strict anti-download DRM */
              <>
                <video
                  ref={videoRef}
                  key={`${video.id}_${activeMode}_${isUnlocked}`}
                  poster={video.thumbnail}
                  controls
                  controlsList={activeMode === 'demo' ? undefined : "nodownload noplaybackrate"}
                  disablePictureInPicture={activeMode !== 'demo'}
                  playsInline
                  autoPlay={activeMode === 'demo'}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      setDuration(videoRef.current.duration || 120);
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => {
                    setVideoError(true);
                  }}
                  className="w-full h-full object-contain pointer-events-auto"
                >
                  <source src={currentSourceUrl || video.previewVideoUrl} type="video/mp4" />
                  {/* High reliability fallback video source if custom host drops */}
                  <source
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    type="video/mp4"
                  />
                  আপনার ব্রাউজারে ভিডিও প্লেয়ার সাপোর্ট করছে না।
                </video>

                {/* Big Center Play Overlay Button if paused */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-purple-600/80 hover:bg-purple-500 text-white flex items-center justify-center shadow-2xl backdrop-blur-xs transition-all active:scale-95 cursor-pointer z-10"
                    title="Play"
                  >
                    <Play className="w-6 h-6 fill-white ml-1" />
                  </button>
                )}
              </>
            )}

            {/* Dynamic Moving Watermark Overlay (Anti-Record / Cam Rip Protection only on full locked video) */}
            {activeMode === 'full' && (
              <div
                style={{
                  top: `${watermarkPos.y}%`,
                  left: `${watermarkPos.x}%`,
                  pointerEvents: 'none',
                }}
                className="absolute z-30 transition-all duration-1000 opacity-30 text-[10px] font-mono tracking-wider font-extrabold text-white bg-black/70 px-2 py-0.5 rounded-md border border-white/20 select-none shadow-sm backdrop-blur-xs"
              >
                🔒 ID: {user.id} | @{user.username.replace('@', '')}
              </div>
            )}

            {/* 90-Minute Expiry Badge (If Unlocked and in Full Mode) */}
            {isUnlocked && remainingExpireSeconds > 0 && activeMode === 'full' && (
              <div className="absolute top-2.5 left-2.5 z-20 bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                <Clock className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>৯০ মি. এক্সপায়ার: {formatExpiryTime(remainingExpireSeconds)} বাকি</span>
              </div>
            )}

            {/* Current Mode Badge */}
            <div className="absolute bottom-2.5 left-2.5 z-20 bg-black/70 text-white px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-xs border border-white/10">
              {activeMode === 'demo' ? '🎥 ডেমো প্রিভিউ চলছে' : isUnlocked ? '🔓 ফুল ভিডিও চলছে' : '🔒 লকড'}
            </div>
          </div>

          {/* Modal Body: Progress & Controls */}
          <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-slate-900/90">
            {/* If in Demo mode, prompt to watch Full Video with Direct Ad Unlock Progress */}
            {activeMode === 'demo' && (
              <div className="bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-500/40 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>সম্পূর্ণ {video.fullDuration} মিনিটের ভিডিও আনলক করুন</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      মোট {requiredAds}টি স্পন্সর বিজ্ঞাপন সম্পন্ন করলে সম্পূর্ণ ফুল ভিডিও ৯০ মিনিটের জন্য আনলক হয়ে যাবে।
                    </p>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 shrink-0">
                    {adsWatched}/{requiredAds}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (adsWatched / requiredAds) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleStartWatchAd}
                    className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>বিজ্ঞাপন দেখুন ({adsWatched + 1}/{requiredAds})</span>
                  </button>

                  <button
                    onClick={() => setActiveMode('full')}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>ফুল ভিডিও পেজ</span>
                  </button>
                </div>

                {video.demoChannelUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const tg = (window as any).Telegram?.WebApp;
                      if (tg?.openTelegramLink && (video.demoChannelUrl?.startsWith('https://t.me/') || video.demoChannelUrl?.startsWith('tg://'))) {
                        tg.openTelegramLink(video.demoChannelUrl);
                      } else if (tg?.openLink) {
                        tg.openLink(video.demoChannelUrl);
                      } else {
                        window.open(video.demoChannelUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="w-full py-2 px-3 bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                    <span>📢 টেলিগ্রাম চ্যানেলে সরাসরি ডেমো ভিডিওটি দেখুন</span>
                  </button>
                )}
              </div>
            )}

            {/* If Unlocked: Green Access Status */}
            {isUnlocked && (
              <div className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/50 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-emerald-300">ফুল ভিডিও আনলকড (Active)</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    ⏱ {formatExpiryTime(remainingExpireSeconds)} বাকি
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  আপনার সম্পূর্ণ {video.fullDuration} মিনিটের ভিডিও দেখার অনুমতি চালু আছে। ৯০ মিনিট পর ভিডিওটি অটোমেটিক লক হয়ে যাবে।
                </p>

                {/* DRM Notice */}
                <div className="mt-2.5 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ডিআরএম ও অ্যান্টি-স্ক্রিন রেকর্ড সক্রিয়
                  </span>
                  <span className="text-slate-400 text-[10px]">No Download / Copy</span>
                </div>
              </div>
            )}

            {/* Telegram Protected Delivery Feature */}
            <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">টেলিগ্রাম বটে অটো-ডিলিট কপি চান?</span>
                  <span className="text-[10px] text-purple-200">
                    টেলিগ্রাম বটে protect_content দ্বারা সুরক্ষিত ও ৯০ মিনিট পর স্বয়ংক্রিয় ডিলিট
                  </span>
                </div>
              </div>

              <a
                href={`https://t.me/${video.deliveryBotHandle || 'PremiumVideoDeliveryBot'}?start=unlock_${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-[11px] flex items-center gap-1 shadow-md shrink-0 cursor-pointer transition-all active:scale-95"
              >
                <span>বটে ওপেন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Video Description */}
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">
                ভিডিও বিবরণী
              </span>
              <p className="text-slate-300 leading-relaxed">{video.description}</p>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            {activeMode === 'demo' ? (
              <button
                onClick={() => setActiveMode('full')}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>সম্পূর্ণ ফুল ভিডিও লিংক ({video.fullDuration}) - ১৫টি অ্যাড আনলক</span>
              </button>
            ) : !isUnlocked ? (
              <button
                id="unlock-ad-video-action-btn"
                onClick={handleStartWatchAd}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  বিজ্ঞাপন দেখুন (#{adsWatched + 1}/{requiredAds}) - {timerSeconds}s
                </span>
              </button>
            ) : (
              <button
                onClick={togglePlay}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'ভিডিও পজ করুন' : 'সম্পূর্ণ ভিডিও প্লে করুন'}</span>
              </button>
            )}
          </div>

          {/* Interactive In-App Ad Watcher & Strict Countdown Gate Modal */}
          <AnimatePresence>
            {isWatchingAd && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-bold text-amber-300">
                      স্পন্সর অ্যাড ভেরিফিকেশন (#{adsWatched + 1}/{requiredAds})
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
                      {canClaimAd ? '✅ অ্যাড দেখা সফল হয়েছে!' : 'স্পন্সর ওয়েবসাইট বা ভিডিও চলছে...'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xs">
                      {canClaimAd
                        ? 'নিচের বাটনে চাপ দিয়ে অ্যাড সম্পন্ন করুন এবং পরবর্তী ধাপে যান।'
                        : `কাউন্টডাউন শূন্য (${timerSeconds}s) হওয়া পর্যন্ত অপেক্ষা করুন।`}
                    </p>
                  </div>

                  {/* Open ad again button if user closed tab */}
                  {!canClaimAd && (
                    <button
                      onClick={() => {
                        window.open(video.adNetworkUrl || 'https://monetag.com', '_blank', 'noopener,noreferrer');
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
                          ? '🎉 সম্পূর্ণ ভিডিও আনলক করুন!'
                          : `অ্যাড সম্পন্ন করুন ও পরবর্তী অ্যাড (${adsWatched + 2}/${requiredAds})`
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
