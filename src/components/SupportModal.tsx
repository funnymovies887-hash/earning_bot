import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, X, Send, MessageCircle, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [message, setMessage] = React.useState('');
  const [sent, setSent] = React.useState(false);

  if (!isOpen) return null;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage('');
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          id="support-modal"
          className="w-full max-w-sm bg-white rounded-3xl p-6 text-slate-800 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">24/7 Live Support</h3>
              <p className="text-xs text-slate-500">Official Telegram Assistant Helpdesk</p>
            </div>
          </div>

          <div className="space-y-3 mb-4 text-xs text-slate-600">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="font-bold text-slate-800 block">Telegram Support</span>
                  <span className="text-[10px] text-purple-600 font-semibold block">@nabirmia</span>
                </div>
              </div>
              <a
                href="https://t.me/nabirmia"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-[#2AABEE] hover:bg-[#2297d4] text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
              >
                Chat
              </a>
            </div>
          </div>

          {sent ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-center rounded-2xl font-bold text-xs">
              Message received! Our support team will reply within 5 minutes.
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-3">
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask your question or report an issue..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-purple-500 resize-none"
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Send to Support</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
