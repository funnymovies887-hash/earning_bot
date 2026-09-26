import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trash2, AlertCircle, Info, X } from 'lucide-react';

export interface AdminToastData {
  type: 'success' | 'delete' | 'error' | 'info';
  title?: string;
  message: string;
}

interface AdminFloatingToastProps {
  toast: AdminToastData | null;
  onClose: () => void;
}

export const AdminFloatingToast: React.FC<AdminFloatingToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[92%] sm:w-auto min-w-[320px] pointer-events-auto"
        >
          <div
            className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                : toast.type === 'delete'
                ? 'bg-slate-900/95 border-rose-500/80 text-rose-100 shadow-rose-950/60 ring-2 ring-rose-500/30'
                : toast.type === 'error'
                ? 'bg-slate-900/95 border-amber-500/80 text-amber-100 shadow-amber-950/60 ring-2 ring-amber-500/30'
                : 'bg-slate-900/95 border-sky-500/80 text-sky-100 shadow-sky-950/60 ring-2 ring-sky-500/30'
            }`}
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : toast.type === 'delete'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : toast.type === 'error'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-6 h-6 animate-pulse" />}
              {toast.type === 'delete' && <Trash2 className="w-5 h-5 animate-bounce" />}
              {toast.type === 'error' && <AlertCircle className="w-6 h-6" />}
              {toast.type === 'info' && <Info className="w-6 h-6" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                {toast.title ||
                  (toast.type === 'success'
                    ? 'সফলভাবে সংরক্ষিত!'
                    : toast.type === 'delete'
                    ? 'সফলভাবে ডিলিট হয়েছে!'
                    : toast.type === 'error'
                    ? 'ত্রুটি হয়েছে'
                    : 'বিজ্ঞপ্তি')}
              </h4>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug font-medium">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
