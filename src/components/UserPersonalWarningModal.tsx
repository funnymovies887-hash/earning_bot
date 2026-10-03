import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  X,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Info,
  Gift,
} from 'lucide-react';
import { UserPersonalMessage } from '../types';

interface UserPersonalWarningModalProps {
  notifications: UserPersonalMessage[];
  onDismiss: (notificationId: string) => void;
}

export const UserPersonalWarningModal: React.FC<UserPersonalWarningModalProps> = ({
  notifications,
  onDismiss,
}) => {
  const unreadNotifs = (notifications || []).filter((n) => !n.isRead);
  if (unreadNotifs.length === 0) return null;

  const currentNotif = unreadNotifs[0];

  const isWarning = currentNotif.type === 'warning';
  const isBonus = currentNotif.type === 'bonus';
  const isNotice = currentNotif.type === 'notice';

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-4 border-2 ${
          isWarning
            ? 'bg-gradient-to-b from-rose-950 via-slate-900 to-rose-950 border-rose-500 shadow-rose-900/40'
            : isBonus
            ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500 shadow-emerald-900/40'
            : 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-900 border-amber-500 shadow-amber-900/40'
        }`}
      >
        {/* Top Badge Icon */}
        <div className="text-center pt-1">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border-2 mb-3 shadow-lg ${
              isWarning
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-rose-500/20 animate-bounce'
                : isBonus
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/20'
                : 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-amber-500/20'
            }`}
          >
            {isWarning ? (
              <ShieldAlert className="w-8 h-8" />
            ) : isBonus ? (
              <Gift className="w-8 h-8" />
            ) : (
              <Bell className="w-8 h-8" />
            )}
          </div>

          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isWarning
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : isBonus
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {isWarning
              ? '⚠️ অ্যাডমিন জরুরি সতর্কবার্তা (Warning)'
              : isBonus
              ? '🎁 বিশেষ পুরস্কার বার্তা (Bonus)'
              : '📢 অ্যাডমিন নোটিশ (Admin Notice)'}
          </span>

          <h3 className="text-base font-black text-white mt-2 leading-tight">
            {currentNotif.title}
          </h3>

          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
            {currentNotif.createdAt ? new Date(currentNotif.createdAt).toLocaleString('bn-BD') : 'Recent'}
          </span>
        </div>

        {/* Message Content Box */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {currentNotif.message}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onDismiss(currentNotif.id)}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg cursor-pointer ${
            isWarning
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/30'
              : isBonus
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/30'
              : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-400/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>আমি বার্তাটি পড়েছি ও সতর্ক থাকবো (Understood)</span>
        </button>
      </div>
    </div>
  );
};
