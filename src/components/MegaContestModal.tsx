import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Rocket, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n';
import confetti from 'canvas-confetti';

interface MegaContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const MegaContestModal: React.FC<MegaContestModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleJoin = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 25 }}
          id="mega-contest-modal"
          className="w-full max-w-sm bg-gradient-to-b from-amber-400 via-amber-300 to-yellow-200 rounded-3xl p-5 text-slate-900 shadow-2xl relative overflow-hidden border-2 border-yellow-200"
        >
          {/* Top trophy with red star badge */}
          <div className="relative flex justify-center -mt-3 mb-2">
            <div className="w-20 h-20 rounded-2xl bg-white/95 shadow-xl flex items-center justify-center border-2 border-amber-300">
              <Trophy className="w-12 h-12 text-amber-500 fill-amber-400" />
            </div>
            <div className="absolute top-0 right-[35%] w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] shadow-sm">
              ★
            </div>
          </div>

          <h2 className="text-2xl font-black text-center text-slate-900 mb-3 tracking-tight">
            {t.megaContest}
          </h2>

          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 shadow-sm text-xs font-medium text-slate-700 leading-relaxed mb-4 text-center space-y-2">
            <p className="font-semibold text-slate-800">
              🎉 {t.contestText}
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              আজই রেফার শুরু করুন এবং হাজার ডলারের প্রাইজ পুলে অংশগ্রহণ করুন!
            </div>
          </div>

          <button
            id="join-contest-btn"
            onClick={handleJoin}
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 text-sm"
          >
            <Rocket className="w-4 h-4" />
            {t.joinCompetition}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
