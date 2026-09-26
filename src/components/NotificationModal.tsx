import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Send, CheckCircle2, Loader2, AlertCircle, ShieldCheck, UserX, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

import { Language, UserProfile } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  user?: UserProfile;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, user }) => {
  const [status, setStatus] = useState<'initial' | 'checking' | 'verified'>('initial');
  const [channel1Visited, setChannel1Visited] = useState<boolean>(false);
  const [channel2Visited, setChannel2Visited] = useState<boolean>(false);
  const [channel1Left, setChannel1Left] = useState<boolean>(false);
  const [channel2Left, setChannel2Left] = useState<boolean>(false);
  const [joinClickTime, setJoinClickTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tgConfig, setTgConfig] = useState({
    channel1Handle: '@CholoIncomeKori',
    channel1Url: 'https://t.me/CholoIncomeKori',
    channel2Handle: '@IncomeBD_Online',
    channel2Url: 'https://t.me/IncomeBD_Online',
    botConfigured: false,
  });

  useEffect(() => {
    fetch('/api/telegram/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.channel1Handle) {
          setTgConfig({
            channel1Handle: data.channel1Handle || '@CholoIncomeKori',
            channel1Url: data.channel1Url || 'https://t.me/CholoIncomeKori',
            channel2Handle: data.channel2Handle || '@IncomeBD_Online',
            channel2Url: data.channel2Url || 'https://t.me/IncomeBD_Online',
            botConfigured: Boolean(data.botConfigured),
          });
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const openLink = (url: string) => {
    try {
      if ((window as any).Telegram?.WebApp?.openTelegramLink) {
        (window as any).Telegram.WebApp.openTelegramLink(url);
        return;
      }
    } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleJoinChannel1 = () => {
    openLink(tgConfig.channel1Url);
    setChannel1Visited(true);
    setChannel1Left(false);
    setJoinClickTime(Date.now());
    setErrorMessage(null);
  };

  const handleJoinChannel2 = () => {
    openLink(tgConfig.channel2Url);
    setChannel2Visited(true);
    setChannel2Left(false);
    setJoinClickTime(Date.now());
    setErrorMessage(null);
  };

  const handleVerify = async () => {
    // Get Telegram user id if running inside Telegram WebApp
    let tgUserId: string | null = null;
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser?.id) {
        tgUserId = String(tgUser.id);
      } else if (tgUser?.username) {
        tgUserId = tgUser.username;
      }
    } catch {}

    if (!tgUserId && user?.id && user.id !== 'guest-101' && user.id !== 'tg_user_101') {
      tgUserId = user.id;
    }

    // Strict mandatory verification: User MUST have clicked & visited BOTH channels
    if (!channel1Visited && !channel2Visited) {
      setErrorMessage('⚠️ আপনি এখনও কোনো চ্যানেলেই জয়েন করেননি! দয়া করে নিচের দুটি চ্যানেলের "Join" বাটনে ক্লিক করে জয়েন করুন।');
      return;
    }
    if (!channel1Visited) {
      setErrorMessage(`⚠️ আপনি ১ম চ্যানেলে (${tgConfig.channel1Handle}) এখনও জয়েন করেননি! "Join" বাটনে ক্লিক করে চ্যানেলে যুক্ত হন।`);
      return;
    }
    if (!channel2Visited) {
      setErrorMessage(`⚠️ আপনি ২য় চ্যানেলে (${tgConfig.channel2Handle}) এখনও জয়েন করেননি! "Join" বাটনে ক্লিক করে চ্যানেলে যুক্ত হন।`);
      return;
    }

    const elapsed = Date.now() - joinClickTime;
    if (joinClickTime > 0 && elapsed < 4000) {
      setErrorMessage('⏳ দয়া করে টেলিগ্রামে গিয়ে চ্যানেলে জয়েন করুন এবং ৪ সেকেন্ড পর "যাচাই করুন" বাটনে চাপুন।');
      return;
    }

    setErrorMessage(null);
    setStatus('checking');

    try {
      const response = await fetch('/api/telegram/verify-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramUserId: tgUserId || 'guest',
          channel1Visited: Boolean(channel1Visited),
          channel2Visited: Boolean(channel2Visited),
        }),
      });

      const data = await response.json();

      if (data.isMember === false) {
        setStatus('initial');
        // If user left a specific channel, mark it so they see which one they left
        if (data.leftChannel) {
          if (data.leftChannel === tgConfig.channel1Handle) {
            setChannel1Left(true);
            setChannel1Visited(false);
          } else if (data.leftChannel === tgConfig.channel2Handle) {
            setChannel2Left(true);
            setChannel2Visited(false);
          }
        }
        setErrorMessage(data.message || '❌ আপনি এখনও উভয় টেলিগ্রাম চ্যানেলে যুক্ত হননি বা চ্যানেল থেকে লিভ নিয়েছেন! চ্যানেলে যুক্ত হয়ে পুনরায় চেষ্টা করুন।');
        return;
      }

      // Verified successfully
      setStatus('verified');
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      setStatus('initial');
      setErrorMessage('❌ নেটওয়ার্ক ত্রুটি বা যাচাই ব্যর্থ হয়েছে। নিশ্চিত করুন আপনি দুটি চ্যানেলে যুক্ত আছেন এবং পুনরায় চাপুন।');
    }
  };

  const handleFinish = () => {
    // Verified for this session
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        id="strict-welcome-modal-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          id="welcome-notification-modal"
          className="w-full max-w-sm bg-gradient-to-b from-amber-400 via-amber-300 to-yellow-200 rounded-3xl p-5 text-slate-900 shadow-2xl relative overflow-hidden border-2 border-yellow-200 cursor-default max-h-[92vh] overflow-y-auto"
        >
          {/* Crown badge matching screenshot */}
          <div className="flex justify-center -mt-1 mb-2">
            <div className="w-16 h-16 rounded-full bg-white/95 shadow-lg flex items-center justify-center border-2 border-amber-300">
              <Crown className="w-9 h-9 text-amber-500 fill-amber-400" />
            </div>
          </div>

          <h2 className="text-xl font-black text-center text-slate-900 mb-1">
            Notification
          </h2>

          <div className="flex justify-center mb-3">
            <span className="text-[11px] font-extrabold text-amber-950 bg-amber-500/25 py-0.5 px-3 rounded-full border border-amber-500/30 shadow-xs">
              🔒 চ্যানেলে জয়েন বাধ্যতামূলক (No Bypass)
            </span>
          </div>

          <div className="bg-white/95 rounded-2xl p-3.5 shadow-xs text-xs font-medium text-slate-800 leading-relaxed mb-3.5 text-center border border-amber-200/60">
            🎉 <strong>Cholo Income Kori</strong> তে আপনাকে স্বাগতম! প্রতিদিন কাজ করুন এবং ১০০% পেমেন্ট নিন। মাত্র ১০ টাকা হলেই উত্তোলন করতে পারবেন বিকাশ ও নগদে 💖
          </div>

          <p className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            📌 নিচের ২টি চ্যানেলে জয়েন করুন (বাধ্যতামূলক):
          </p>

          {/* Channel list with strict join tracking */}
          <div className="space-y-2.5 mb-4">
            {/* Channel 1 */}
            <div className={`bg-white/95 rounded-xl p-2.5 flex items-center justify-between shadow-xs border transition-all ${
              channel1Left ? 'border-rose-500 bg-rose-50/90 ring-1 ring-rose-400' : 'border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ${
                  channel1Left ? 'bg-rose-600' : 'bg-blue-500'
                }`}>
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">১ম চ্যানেল</span>
                    {channel1Left && (
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-md animate-pulse">
                        লিভ নিয়েছেন!
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block font-mono">{tgConfig.channel1Handle}</span>
                </div>
              </div>
              <button
                type="button"
                id="join-channel-1-btn"
                onClick={handleJoinChannel1}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-transform active:scale-95 cursor-pointer shadow-xs shrink-0 flex items-center gap-1 ${
                  channel1Left
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                    : channel1Visited
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                }`}
              >
                {channel1Left ? 'পুনরায় Join করুন' : channel1Visited ? 'Joined ✅' : 'Join'}
              </button>
            </div>

            {/* Channel 2 */}
            <div className={`bg-white/95 rounded-xl p-2.5 flex items-center justify-between shadow-xs border transition-all ${
              channel2Left ? 'border-rose-500 bg-rose-50/90 ring-1 ring-rose-400' : 'border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs ${
                  channel2Left ? 'bg-rose-600' : 'bg-blue-500'
                }`}>
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">২য় চ্যানেল</span>
                    {channel2Left && (
                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-md animate-pulse">
                        লিভ নিয়েছেন!
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block font-mono">{tgConfig.channel2Handle}</span>
                </div>
              </div>
              <button
                type="button"
                id="join-channel-2-btn"
                onClick={handleJoinChannel2}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-transform active:scale-95 cursor-pointer shadow-xs shrink-0 flex items-center gap-1 ${
                  channel2Left
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                    : channel2Visited
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                }`}
              >
                {channel2Left ? 'পুনরায় Join করুন' : channel2Visited ? 'Joined ✅' : 'Join'}
              </button>
            </div>
          </div>

          {/* Validation Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-2.5 rounded-xl mb-3 text-center leading-snug flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action button states: Verify & Continue -> Checking... -> Enter App */}
          {status === 'initial' && (
            <button
              type="button"
              id="verify-continue-btn"
              onClick={handleVerify}
              className={`w-full py-3.5 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 text-sm cursor-pointer ${
                channel1Visited && channel2Visited
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-emerald-700/30'
                  : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:from-amber-700 hover:to-yellow-700 shadow-amber-700/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {channel1Visited && channel2Visited
                ? 'সদস্যপদ যাচাই ও প্রবেশ করুন'
                : 'উভয় চ্যানেলে জয়েন করে যাচাই করুন'}
            </button>
          )}

          {status === 'checking' && (
            <button
              type="button"
              disabled
              className="w-full py-3.5 bg-amber-500 text-slate-900 font-black rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm cursor-wait"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              টেলিগ্রাম মেম্বারশিপ যাচাই করা হচ্ছে...
            </button>
          )}

          {status === 'verified' && (
            <button
              type="button"
              id="ok-understood-btn"
              onClick={handleFinish}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 text-sm cursor-pointer animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              ✅ সফল হয়েছে! অ্যাপে প্রবেশ করুন
            </button>
          )}

          <p className="text-[10px] text-center text-amber-900/80 font-semibold mt-2.5">
            উভয় চ্যানেলে জয়েন নিশ্চিত না হওয়া পর্যন্ত অ্যাপে প্রবেশ করা যাবে না।
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotificationModal;
