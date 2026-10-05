import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Award, CheckCircle2, AlertTriangle } from 'lucide-react';
import { VideoItem, UserProfile } from '../types';
import confetti from 'canvas-confetti';

interface VideoPlayerModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onRewardClaimed: (video: VideoItem) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  isOpen,
  onClose,
  user,
  onRewardClaimed,
}) => {
  const [countdown, setCountdown] = React.useState(15);
  const [canClaim, setCanClaim] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [showExitWarning, setShowExitWarning] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && video) {
      setCountdown(15);
      setCanClaim(false);
      setIsPlaying(true);
      setIsCompleted(false);
      setShowExitWarning(false);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const handleAttemptClose = () => {
    if (countdown > 0 && !isCompleted) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const handleClaim = () => {
    setIsCompleted(true);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
    onRewardClaimed(video);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleAttemptClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          id="video-player-modal"
          className="w-full max-w-sm bg-slate-900 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl text-white relative"
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-300">Sponsored Ad & Video Stream</span>
            </div>
            <button
              onClick={handleAttemptClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video Mockup Viewport */}
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <img
              src={video.thumbnail}
              alt={video.title}
              className={`w-full h-full object-cover transition-opacity ${isPlaying ? 'opacity-70' : 'opacity-30'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

            {/* Glowing playback wave */}
            {isPlaying && (
              <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                AD PLAYING
              </div>
            )}

            {/* Countdown Badge */}
            <div className="absolute top-3 right-3 bg-black/80 border border-slate-700 text-yellow-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span>⏱</span>
              <span>{countdown > 0 ? `${countdown}s remaining` : 'Reward Ready!'}</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
              <span className="font-bold text-white truncate max-w-[200px]">{video.title}</span>
              <span className="text-emerald-400 font-extrabold">+${video.rewardUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* Body and Action */}
          <div className="p-5 space-y-4 text-center">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
                <span>Watching Reward</span>
                <span className="text-emerald-400 font-bold">
                  {user.currency === 'BDT' ? `৳ ${(video.rewardUsd * 120).toFixed(1)}` : `$ ${video.rewardUsd.toFixed(2)}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 text-left">
                Keep the ad playing for the full duration to instantly credit rewards to your live synced balance.
              </p>
            </div>

            {/* If user reached daily limit */}
            {(user.adsWatchedToday || 0) >= (user.dailyAdLimit || 40) ? (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl text-rose-300 text-xs font-semibold">
                ⚠️ আপনার আজকের অ্যাড দেখার লিমিট ({user.dailyAdLimit || 40} টি) পূর্ণ হয়ে গেছে। Adsterra / Monetag অ্যাকাউন্ট সুরক্ষিত রাখতে আজ আর অ্যাড দেখা সম্ভব নয়।
              </div>
            ) : isCompleted ? (
              <div className="py-2 flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Reward Added to Balance!
              </div>
            ) : (
              <button
                id="claim-video-reward-btn"
                disabled={!canClaim}
                onClick={handleClaim}
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                  canClaim
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white cursor-pointer active:scale-98 animate-bounce'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4" />
                {canClaim ? 'Claim Reward Now 🎉' : `Please wait (${countdown}s)`}
              </button>
            )}
          </div>
        </motion.div>

        {/* Early Exit Warning Modal */}
        {showExitWarning && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90">
            <div className="w-full max-w-xs bg-slate-900 border-2 border-rose-500 rounded-2xl p-4 text-center space-y-3 text-white">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
              <h4 className="text-sm font-black text-rose-400">সতর্কবার্তা!</h4>
              <p className="text-xs text-slate-300">
                বিজ্ঞাপন এখনো সম্পূর্ণ শেষ হয়নি ({countdown} সেকেন্ড বাকি)! সম্পূর্ণ সময় না দেখলে <b>কোনো রিওয়ার্ড ব্যালেন্সে যোগ হবে না</b>।
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  বিজ্ঞাপন দেখুন
                </button>
                <button
                  onClick={() => {
                    setShowExitWarning(false);
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
    </AnimatePresence>
  );
};
