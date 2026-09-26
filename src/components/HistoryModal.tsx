import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, X, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { WithdrawalRequest, Language } from '../types';
import { TRANSLATIONS } from '../i18n';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, language }) => {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<WithdrawalRequest[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/withdrawals')
        .then((res) => res.json())
        .then((data) => {
          setTimeout(() => {
            setItems(data || []);
            setLoading(false);
          }, 600);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          id="history-modal"
          className="w-full max-w-sm bg-white rounded-3xl p-6 text-slate-800 shadow-2xl relative min-h-[220px]"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t.history}</h3>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-xs font-medium">Loading...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">No History</p>
              <p className="text-xs text-slate-400 mt-1">You haven't requested any withdrawals yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{item.method}</span>
                    <p className="text-[11px] text-slate-500">{item.accountNumber}</p>
                    <span className="text-[10px] text-slate-400">{item.createdAt}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm">
                      {item.currency === 'BDT' ? '৳' : item.currency === 'INR' ? '₹' : '$'} {item.amount}
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-amber-600 font-medium mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-amber-500" />
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
