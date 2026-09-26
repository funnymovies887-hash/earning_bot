import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  Check,
  ArrowRight,
  Gift,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Video,
  Users,
  Wallet,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Clock,
  Trash2,
  CheckCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type NotificationType =
  | 'bonus'
  | 'withdrawal'
  | 'task'
  | 'video'
  | 'ad_locked'
  | 'referral'
  | 'commission'
  | 'store'
  | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: NotificationType;
  actionable?: boolean;
  claimAmount?: number; // In BDT
  claimed?: boolean;
  details?: string;
}

export interface NotificationInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClaimBonus: (id: string, amount: number) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearNotifications?: () => void;
}

export const NotificationInboxModal: React.FC<NotificationInboxModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClaimBonus,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  if (!isOpen) return null;

  const handleItemClick = (item: NotificationItem) => {
    setSelectedNotif(item);
    if (!item.read && onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  };

  const getNotifMeta = (type: NotificationType) => {
    switch (type) {
      case 'bonus':
        return {
          icon: <Gift className="w-4 h-4 text-amber-500" />,
          bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeText: 'বোনাস ও রিওয়ার্ড',
        };
      case 'task':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeText: 'টাস্ক সম্পন্ন',
        };
      case 'video':
        return {
          icon: <Video className="w-4 h-4 text-sky-500" />,
          bgColor: 'bg-sky-50 text-sky-800 border-sky-200',
          badgeText: 'ভিডিও বিজ্ঞাপন',
        };
      case 'ad_locked':
        return {
          icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
          bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          badgeText: 'প্রিমিয়াম ভিডিও',
        };
      case 'referral':
        return {
          icon: <Users className="w-4 h-4 text-blue-500" />,
          bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
          badgeText: 'রেফারেল জয়েন',
        };
      case 'commission':
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-500" />,
          bgColor: 'bg-purple-50 text-purple-800 border-purple-200',
          badgeText: 'রেফারেল কমিশন',
        };
      case 'withdrawal':
        return {
          icon: <Wallet className="w-4 h-4 text-rose-500" />,
          bgColor: 'bg-rose-50 text-rose-800 border-rose-200',
          badgeText: 'উত্তোলন রিকোয়েস্ট',
        };
      case 'store':
        return {
          icon: <ShoppingBag className="w-4 h-4 text-fuchsia-500" />,
          bgColor: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
          badgeText: 'প্যাকেজ অর্ডার',
        };
      default:
        return {
          icon: <ShieldAlert className="w-4 h-4 text-purple-600" />,
          bgColor: 'bg-slate-100 text-slate-800 border-slate-200',
          badgeText: 'অফিশিয়াল নোটিশ',
        };
    }
  };

  const unreadCount = notifications.filter((n) => !n.read || (n.actionable && !n.claimed)).length;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs cursor-pointer overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[88vh] border border-slate-100 cursor-default relative"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-900 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-700/60 border border-purple-400/40 flex items-center justify-center text-amber-300">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight">নোটিফিকেশন সেন্টার</h3>
                  {unreadCount > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full">
                      {unreadCount} নতুন
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-purple-200">আপনার কাজের আসল নোটিফিকেশন ও মেসেজ</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          {notifications.length > 0 && (
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600 shrink-0">
              <span className="text-slate-500 font-mono">
                মোট বার্তা: {notifications.length}
              </span>
              <div className="flex items-center gap-2">
                {onMarkAllAsRead && unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer font-bold"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>সব পড়া হয়েছে</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notification List */}
          <div className="p-3 overflow-y-auto space-y-2 flex-1">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-600">কোন নোটিফিকেশন নেই</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  টাস্ক সম্পন্ন করলে, ভিডিও দেখলে, রেফার করলে কিংবা টাকা উত্তোলন করলে এখানে আসল মেসেজ দেখতে পাবেন।
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getNotifMeta(item.type);
                const isUnread = !item.read || (item.actionable && !item.claimed);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                      isUnread
                        ? 'bg-amber-50/60 border-amber-300 shadow-xs hover:bg-amber-50'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                        {meta.icon}
                      </div>

                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${meta.bgColor}`}
                          >
                            {meta.badgeText}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {item.time}
                          </span>
                        </div>

                        <h4
                          className={`text-xs leading-snug line-clamp-1 mb-1 ${
                            isUnread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.body}
                        </p>

                        {/* Actionable Bonus (e.g. ৳10 referral) */}
                        {item.actionable && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between pt-2 mt-2 border-t border-amber-200/80"
                          >
                            <span className="text-[11px] font-black text-amber-700 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              বোনাস: ৳{item.claimAmount || 10} টাকা
                            </span>

                            {item.claimed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">
                                <Check className="w-3 h-3" /> ক্লেইম সম্পন্ন
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  onClaimBonus(item.id, item.claimAmount || 10);
                                  confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-black rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Claim Now</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        <div className="mt-1 flex items-center justify-end text-[10px] text-purple-700 font-semibold group-hover:underline">
                          <span>বিস্তারিত দেখুন</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
            <p className="text-[10px] text-slate-500">
              💡 ব্যবহারকারীদের সকল বাস্তব কাজের নোটিফিকেশন এখানে সংরক্ষিত থাকে
            </p>
          </div>
        </motion.div>
      </div>

      {/* Message Details Modal (বিস্তারিত বার্তা) */}
      {selectedNotif && (
        <div
          onClick={() => setSelectedNotif(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 border border-slate-100 cursor-default relative"
          >
            <button
              onClick={() => setSelectedNotif(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Badge & Time */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  getNotifMeta(selectedNotif.type).bgColor
                }`}
              >
                {getNotifMeta(selectedNotif.type).badgeText}
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedNotif.time}
              </span>
            </div>

            {/* Title */}
            <div className="flex items-start gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                {getNotifMeta(selectedNotif.type).icon}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {selectedNotif.title}
              </h3>
            </div>

            {/* Body Description */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-4 text-xs text-slate-700 leading-relaxed font-medium">
              {selectedNotif.details || selectedNotif.body}
            </div>

            {/* If actionable bonus */}
            {selectedNotif.actionable && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-bold block">রিওয়ার্ড বোনাস:</span>
                  <span className="text-sm font-black text-amber-900">
                    ৳ {selectedNotif.claimAmount || 10} টাকা
                  </span>
                </div>
                {selectedNotif.claimed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl">
                    <Check className="w-4 h-4" /> গ্রহণ করা হয়েছে
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onClaimBonus(selectedNotif.id, selectedNotif.claimAmount || 10);
                      setSelectedNotif((prev) => (prev ? { ...prev, claimed: true } : null));
                      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Claim Now</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedNotif(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              ঠিক আছে / বন্ধ করুন
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
