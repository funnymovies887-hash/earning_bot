import React from 'react';
import { Save, CheckCircle2, Loader2, Sparkles, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface AdminSaveButtonProps {
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
  defaultText?: string;
  savingText?: string;
  savedText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  className?: string;
  id?: string;
  icon?: React.ReactNode;
}

export const AdminSaveButton: React.FC<AdminSaveButtonProps> = ({
  isDirty,
  isSaving,
  isSaved,
  defaultText = 'সেভ করুন (Save)',
  savingText = 'সংরক্ষণ হচ্ছে...',
  savedText = 'সফলভাবে সেভ হয়েছে! ✓',
  onClick,
  type = 'submit',
  className = '',
  id,
  icon,
}) => {
  // Fire confetti on save completion
  React.useEffect(() => {
    if (isSaved) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#fbbf24', '#34d399', '#f59e0b'],
        });
      } catch {}
    }
  }, [isSaved]);

  if (isSaved) {
    return (
      <button
        id={id}
        type="button"
        disabled
        className={`relative py-3 px-6 rounded-xl font-black text-xs sm:text-sm bg-emerald-600 text-white border-2 border-emerald-300 shadow-xl shadow-emerald-500/40 ring-4 ring-emerald-500/25 flex items-center justify-center gap-2 transform scale-[1.02] transition-all duration-300 pointer-events-none ${className}`}
      >
        <CheckCircle2 className="w-5 h-5 text-white animate-bounce shrink-0" />
        <span className="tracking-wide">{savedText}</span>
      </button>
    );
  }

  if (isSaving) {
    return (
      <button
        id={id}
        type="button"
        disabled
        className={`relative py-3 px-6 rounded-xl font-extrabold text-xs sm:text-sm bg-amber-500 text-slate-950 border-2 border-amber-300 shadow-lg flex items-center justify-center gap-2 opacity-90 cursor-wait ${className}`}
      >
        <Loader2 className="w-5 h-5 text-slate-950 animate-spin shrink-0" />
        <span className="tracking-wide">{savingText}</span>
      </button>
    );
  }

  if (!isDirty) {
    // ঝাপসা / হালকা অবস্থা (Dimmed / Faint / Inactive)
    return (
      <div className="relative group inline-block">
        <button
          id={id}
          type="button"
          disabled
          aria-disabled="true"
          className={`py-3 px-6 rounded-xl font-bold text-xs sm:text-sm bg-slate-800/60 text-slate-400 border border-slate-700/50 opacity-40 grayscale-[40%] blur-[0.4px] flex items-center justify-center gap-2 cursor-not-allowed select-none transition-all duration-200 ${className}`}
        >
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>{defaultText}</span>
        </button>
        {/* Subtle tooltip hint */}
        <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-300 text-[10px] font-semibold rounded-lg border border-slate-700 whitespace-nowrap shadow-lg z-20 pointer-events-none">
          কিছু যোগ বা পরিবর্তন করলে সেভ বাটন সক্রিয় হবে
        </span>
      </div>
    );
  }

  // ভেসে উঠবে (Highlighted / Floating / Glowing Active State)
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      className={`relative py-3 px-6 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-slate-950 border-2 border-amber-200 shadow-xl shadow-amber-500/30 ring-4 ring-amber-400/25 flex items-center justify-center gap-2 cursor-pointer transform -translate-y-0.5 scale-[1.02] active:scale-98 transition-all duration-200 ${className}`}
    >
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white"></span>
      </span>
      {icon ? icon : <Save className="w-4 h-4 text-slate-950 shrink-0" />}
      <span className="tracking-wide">{defaultText}</span>
      <Sparkles className="w-3.5 h-3.5 text-slate-950/70 shrink-0" />
    </button>
  );
};
