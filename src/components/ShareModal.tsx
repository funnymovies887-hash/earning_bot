import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Share2,
  Send,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Language } from '../types';
import { toLocalizedDigits } from '../utils/formatters';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  language?: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  user,
  language = 'bn',
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen) return null;

  const botUsername = user.referralCode || 'choloincomekori_bot';
  const referralUrl = `https://t.me/${botUsername}?start=${user.id || 'ref101'}`;

  const shareText = `🔥 ঘরে বসে প্রতিদিন ভিডিও দেখে ও সহজ কাজ করে ফ্রি ইনকাম করুন!
🎁 প্রতি সফল রেফারে পাবেন ১০ টাকা বোনাস এবং ৫% আজীবন কমিশন!
💰 মাত্র ২৫ টাকা হলেই সরাসরি বিকাশ বা নগদে উত্তোলন!
👇 এখনই নিচের লিংকে ক্লিক করে টেলিগ্রাম বটের সাথে যুক্ত হন:`;

  const fullMessage = `${shareText}\n${referralUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(referralUrl);
    setCopiedLink(true);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyFullMessage = () => {
    navigator.clipboard?.writeText(fullMessage);
    setCopiedMessage(true);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // Social Share Handlers
  const handleShareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank');
  };

  const handleShareMessenger = () => {
    // Try web share or copy fallback
    if (navigator.share) {
      navigator
        .share({
          title: 'Cholo Income Kori',
          text: shareText,
          url: referralUrl,
        })
        .catch(() => {});
    } else {
      const fbMessenger = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(referralUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(referralUrl)}`;
      window.open(fbMessenger, '_blank');
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cholo Income Kori - Earn Money Daily',
          text: shareText,
          url: referralUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyFullMessage();
    }
  };

  return (
    <AnimatePresence>
      <div
        id="share-modal-overlay"
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs cursor-pointer"
      >
        <motion.div
          id="share-modal-container"
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-purple-500/30 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white cursor-default"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>রেফারেল লিংক শেয়ার করুন</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                    {toLocalizedDigits(10, language)}৳ বোনাস
                  </span>
                </h3>
                <p className="text-[11px] text-purple-200">
                  বন্ধুরা জয়েন করলেই পাবেন ১০ টাকা ও আজীবন ৫% কমিশন
                </p>
              </div>
            </div>

            <button
              id="close-share-modal-btn"
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-4">
            {/* Direct Social Media Platform Buttons */}
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                সোশ্যাল মিডিয়ায় সরাসরি শেয়ার করুন:
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
                {/* Telegram */}
                <button
                  id="share-telegram-btn"
                  type="button"
                  onClick={handleShareTelegram}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border border-[#0088cc]/40 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-md shadow-[#0088cc]/30 mb-1.5">
                    <Send className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-sky-300">Telegram</span>
                  <span className="text-[9px] text-slate-400">টেলিগ্রাম</span>
                </button>

                {/* WhatsApp */}
                <button
                  id="share-whatsapp-btn"
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-[#25D366]/30 mb-1.5">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300">WhatsApp</span>
                  <span className="text-[9px] text-slate-400">হোয়াটসঅ্যাপ</span>
                </button>

                {/* Facebook */}
                <button
                  id="share-facebook-btn"
                  type="button"
                  onClick={handleShareFacebook}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-[#1877F2]/30 mb-1.5">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-blue-300">Facebook</span>
                  <span className="text-[9px] text-slate-400">ফেসবুক</span>
                </button>

                {/* Messenger */}
                <button
                  id="share-messenger-btn"
                  type="button"
                  onClick={handleShareMessenger}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 border border-indigo-400/40 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00B2FF] to-[#006AFF] text-white flex items-center justify-center shadow-md shadow-indigo-500/30 mb-1.5">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300">Messenger</span>
                  <span className="text-[9px] text-slate-400">মেসেঞ্জার</span>
                </button>

                {/* Twitter / X */}
                <button
                  id="share-twitter-btn"
                  type="button"
                  onClick={handleShareTwitter}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center border border-slate-700 shadow-md mb-1.5">
                    <span className="font-black text-sm">𝕏</span>
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-slate-300">Twitter (X)</span>
                  <span className="text-[9px] text-slate-400">টুইটার</span>
                </button>

                {/* More / Device Share */}
                <button
                  id="share-more-btn"
                  type="button"
                  onClick={handleNativeShare}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-400/30 mb-1.5">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300">অন্যান্য</span>
                  <span className="text-[9px] text-slate-400">ডিভাইস শেয়ার</span>
                </button>
              </div>
            </div>

            {/* Quick Referral Link Box */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">আপনার ব্যক্তিগত রেফারেল লিংক:</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  Code: {user.id || 'ref101'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-purple-200 font-mono outline-none select-all"
                />
                <button
                  id="copy-link-modal-btn"
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:from-amber-300 hover:to-yellow-400 font-black'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি লিংক</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ready-to-Send Invitation Message */}
            <div className="p-3.5 bg-purple-950/40 rounded-2xl border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">
                  ইনভাইটেশন মেসেজ (প্রস্তুত মেসেজ):
                </span>
                <button
                  id="copy-full-message-btn"
                  type="button"
                  onClick={handleCopyFullMessage}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedMessage ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-black">মেসেজ কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>পুরো মেসেজ কপি</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl leading-relaxed whitespace-pre-line border border-slate-800">
                {fullMessage}
              </p>
            </div>

            {/* How real referrals work notice */}
            <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <span className="font-bold text-emerald-300 block mb-0.5">
                  কীভাবে রেফারেল কাউন্ট হবে?
                </span>
                আপনার পাঠানো লিংকে ক্লিক করে বন্ধু যখন টেলিগ্রাম বটের সাথে যুক্ত হবে এবং কাজ শুরু করবে, তখন স্বয়ংক্রিয়ভাবে আপনার একাউন্টে রেফার কাউন্ট বাড়বে এবং বোনাস নোটিফিকেশন পাবেন।
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
