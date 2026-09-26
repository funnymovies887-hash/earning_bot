import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X } from 'lucide-react';

interface OfficialNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialNoticeModal: React.FC<OfficialNoticeModalProps> = ({ isOpen, onClose }) => {
  const [notice, setNotice] = useState({
    title: 'Official Notice',
    description: '📢 গুরুত্বপূর্ণ নোটিশ 📢 সবাই অ্যাড ভালোভাবে দেখতেছেন, ধন্যবাদ — কিন্তু অনেকেই এখনো অ্যাডে ক্লিক করছেন না।',
    rules: [
      '1️⃣ প্রতি ১০টা অ্যাড দেখার পর অন্তত ১টা অ্যাডে ক্লিক করবেন।',
      '2️⃣ ক্লিক করার পর কমপক্ষে ১ মিনিট সেই ওয়েবপেজে অবস্থান করবেন।',
      '3️⃣ তারপর পরবর্তী অ্যাডে যান।',
    ],
    warning: '⚠️ যদি নিয়ম অনুযায়ী ক্লিক ও ভিজিট না করেন, তাহলে সেই কাজের পেমেন্ট দেওয়া হবে না।',
    footer: 'ধন্যবাদ সবাইকে 🙏 — টিম ম্যানেজমেন্ট',
    isActive: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/notices')
      .then((res) => res.json())
      .then((data) => {
        if (data?.officialNotice) {
          setNotice((prev) => ({
            ...prev,
            ...data.officialNotice,
          }));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen || !notice.isActive) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs cursor-pointer"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          id="official-notice-modal"
          className="bg-white rounded-3xl w-full max-w-sm p-6 text-slate-900 shadow-2xl relative border border-slate-100 cursor-default"
        >
          {/* Top Right Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Megaphone Icon Badge */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 flex items-center justify-center shadow-md">
              <Megaphone className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
          </div>

          {/* Header Title */}
          <h2 className="text-xl font-black text-center text-slate-900 mb-3 tracking-tight">
            {notice.title}
          </h2>

          {/* Notice Content Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed space-y-2.5 mb-6 text-center">
            <p className="font-bold text-slate-900">
              {notice.description}
            </p>

            {notice.rules && notice.rules.length > 0 && (
              <>
                <p className="font-semibold text-emerald-800">
                  👉 অনুগ্রহ করে নিয়ম মেনে কাজ করুন:
                </p>

                <div className="space-y-1.5 text-left bg-white p-3 rounded-xl border border-slate-200/70 font-semibold text-slate-800 text-[11px]">
                  {notice.rules.map((rule, idx) => (
                    <p key={idx}>{rule}</p>
                  ))}
                </div>
              </>
            )}

            {notice.warning && (
              <p className="text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px]">
                {notice.warning}
              </p>
            )}

            {notice.footer && (
              <p className="font-bold text-slate-800 text-xs pt-1">
                {notice.footer}
              </p>
            )}
          </div>

          {/* Large Green Action Button */}
          <button
            id="official-notice-got-it-btn"
            onClick={onClose}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm tracking-wide rounded-full shadow-lg shadow-emerald-700/25 transition-all cursor-pointer"
          >
            GOT IT
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OfficialNoticeModal;
