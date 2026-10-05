import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

// ========================================================================================
// 📝 [লোড পেইজের লেখা পরিবর্তন করার স্থান / EDIT LOADING PAGE TEXT HERE]:
// আপনি যদি "Explore Your Earnings" বা "Smart Earning" পরিবর্তন করতে চান, তবে নিচের টেক্সটগুলো এডিট করুন:
// ========================================================================================
export const SPLASH_CONFIG = {
  // 👈 ১. বড় শিরোনাম লেখা পরিবর্তন করতে এখানে এডিট করুন:
  MAIN_HEADING: "Explore Your Earnings",

  // 👈 ২. অ্যাপের নাম পরিবর্তন করতে এখানে এডিট করুন:
  APP_NAME: "Cholo Income Kori",

  // 👈 ৩. স্বাগতম বার্তার প্রিফিক্স:
  WELCOME_PREFIX: "Welcome to 🎁",

  // 👈 ৪. লোডিং বারের নিচের টেক্সট:
  LOADING_TEXT: "CONNECTING TO DATABASE...",
};
// ========================================================================================

interface SplashLoaderProps {
  onComplete: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = React.useState(25);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onCompleteRef.current(), 80);
          return 100;
        }
        return Math.min(100, prev + 6);
      });
    }, 55);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="splash-screen"
      onClick={() => onCompleteRef.current()}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-gradient-to-b from-[#6b21a8] via-[#7e22ce] to-[#581c87] text-white px-6 cursor-pointer select-none overscroll-none"
    >
      {/* Main glowing circular icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-32 h-32 rounded-full border-4 border-purple-300/40 bg-purple-600/30 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.6)] mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-inner">
          <Play className="w-12 h-12 text-white fill-white ml-1.5" />
        </div>
      </motion.div>

      {/* 👉 [MAIN HEADING]: Explore Your Earnings */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-extrabold tracking-tight text-white mb-2 text-center"
      >
        {SPLASH_CONFIG.MAIN_HEADING}
      </motion.h1>

      {/* 👉 [APP NAME / SUBTITLE]: Welcome to Smart Earning */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-purple-200 text-sm font-medium mb-10 flex items-center gap-1"
      >
        {SPLASH_CONFIG.WELCOME_PREFIX} <span className="font-bold text-white">{SPLASH_CONFIG.APP_NAME}</span> 💸
      </motion.p>

      {/* Progress Bar with glowing neon fill */}
      <div className="w-full max-w-xs space-y-2">
        <div className="w-full h-2.5 bg-purple-950/70 rounded-full overflow-hidden p-0.5 border border-purple-400/30 shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 via-green-400 to-lime-300 rounded-full shadow-[0_0_12px_#4ade80]"
            style={{ width: `${Math.min(100, progress)}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
        <p className="text-[11px] font-bold tracking-widest text-center text-purple-200 uppercase animate-pulse">
          {SPLASH_CONFIG.LOADING_TEXT} {Math.min(100, progress)}%
        </p>

        {/* Tap to enter hint */}
        <div className="pt-3 text-center">
          <span className="text-[10px] text-purple-300/80 bg-purple-900/50 border border-purple-500/30 px-3 py-1 rounded-full">
            সরাসরি ঢুকতে স্ক্রিনে টাচ করুন ⚡
          </span>
        </div>
      </div>
    </div>
  );
};
