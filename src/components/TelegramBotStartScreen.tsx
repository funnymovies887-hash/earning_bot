import React from 'react';
import {
  ExternalLink,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Tv,
  Globe,
  Send,
  Target,
  Users,
  Wallet,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

interface TelegramBotStartScreenProps {
  onTabChange?: (tab: 'home' | 'refer' | 'earn' | 'rank' | 'profile') => void;
  className?: string;
}

export const TelegramBotStartScreen: React.FC<TelegramBotStartScreenProps> = ({
  onTabChange,
  className = '',
}) => {
  const handleOpenTelegramLink = (url: string) => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div
      id="telegram-bot-start-screen"
      className={`rounded-3xl bg-[#17212b] border border-[#2b3a4a] text-white shadow-xl overflow-hidden font-sans ${className}`}
    >
      {/* Telegram Bot Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0e1621] border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Avatar with CIK logo */}
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex flex-col items-center justify-center text-center p-0.5 border border-emerald-400">
              <span className="text-[10px] font-black text-emerald-400 leading-none">CIK</span>
              <span className="text-[5.5px] font-bold text-amber-300 tracking-tighter scale-90">INCOME</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                Cholo Income Kori
              </h3>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#50a2e9] fill-[#50a2e9] shrink-0" />
            </div>
            <span className="text-[11px] text-[#50a2e9] font-mono">@CholoIncomeKoriBot</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#182533] px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Bot</span>
        </div>
      </div>

      {/* Main Telegram Card: "What can this bot do?" */}
      <div className="p-4 space-y-3.5 text-[12.5px] leading-relaxed">
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white tracking-tight">
              What can this bot do?
            </h4>
          </div>
          <span className="text-[10px] bg-[#242f3d] text-slate-300 px-2 py-0.5 rounded-full border border-white/5">
            বট পরিচিতি ও নিয়মাবলী
          </span>
        </div>

        {/* Welcome greeting */}
        <div className="bg-[#1e2c3a] p-3 rounded-2xl border border-white/5 space-y-1">
          <p className="font-bold text-white text-[13.5px]">
            🎉🌹 স্বাগতম Cholo Income Kori 🥰
          </p>
          <p className="font-semibold text-amber-300 text-xs">
            প্রিয় টিম মেম্বার 👦
          </p>
          <p className="text-slate-300 text-xs">
            প্রতিদিন আপনার অনলাইন ইনকামের যাত্রা শুরু হোক আমাদের সাথে 🥰✅
          </p>
        </div>

        {/* 5 Ways to Earn Section */}
        <div className="bg-[#1e2c3a] p-3.5 rounded-2xl border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
              <span>আমাদের বট এ ৫ ভাবে ইনকাম করতে পারবেন 👇</span>
            </p>
            <span className="text-[10px] text-emerald-300 font-extrabold bg-emerald-500/20 px-1.5 py-0.5 rounded">
              ৫টি মেথড
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Method 1: Views ads */}
            <div
              onClick={() => onTabChange && onTabChange('earn')}
              className="flex items-start gap-2 p-2 rounded-xl bg-[#17212b] border border-white/5 hover:border-purple-400/40 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  ✅ Views ads
                </p>
                <p className="text-[10.5px] text-slate-400">ভিডিও অ্যাড দেখে নিশ্চিত আয়</p>
              </div>
            </div>

            {/* Method 2: Web visit */}
            <div
              onClick={() => onTabChange && onTabChange('earn')}
              className="flex items-start gap-2 p-2 rounded-xl bg-[#17212b] border border-white/5 hover:border-purple-400/40 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  ✅ Web visit
                </p>
                <p className="text-[10.5px] text-slate-400">ওয়েবসাইট ভিজিট ও ব্রাউজিং কাজ</p>
              </div>
            </div>

            {/* Method 3: Telegram task */}
            <div
              onClick={() => onTabChange && onTabChange('earn')}
              className="flex items-start gap-2 p-2 rounded-xl bg-[#17212b] border border-white/5 hover:border-purple-400/40 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  ✅ Telegram task
                </p>
                <p className="text-[10.5px] text-slate-400">চ্যানেল ও গ্রুপে জয়েন করার কাজ</p>
              </div>
            </div>

            {/* Method 4: Mission task */}
            <div
              onClick={() => onTabChange && onTabChange('earn')}
              className="flex items-start gap-2 p-2 rounded-xl bg-[#17212b] border border-white/5 hover:border-purple-400/40 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                  ✅ Mission task
                </p>
                <p className="text-[10.5px] text-slate-400">স্পেশাল মিশন ও অ্যাপ ইন্সটল টাস্ক</p>
              </div>
            </div>

            {/* Method 5: Referral */}
            <div
              onClick={() => onTabChange && onTabChange('refer')}
              className="flex items-start gap-2 p-2 rounded-xl bg-[#17212b] border border-amber-400/30 hover:border-amber-400 transition-all cursor-pointer group sm:col-span-2"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-amber-300 group-hover:text-yellow-200 transition-colors">
                  ✅ Referral (১০৳ ইনস্ট্যান্ট + ৫% আজীবন কমিশন)
                </p>
                <p className="text-[10.5px] text-slate-300">
                  প্রতি রেফারে ১০ টাকা বোনাস এবং আজীবন ৫% প্যাসিভ কমিশন
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdraw System Box */}
        <div className="bg-[#1e2c3a] p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>withdraw system 👇 ( ৫৳ ফি)</span>
            </p>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
              ২৪ ঘণ্টা পেমেন্ট
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#17212b] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">মিনিমাম উত্তোলন:</span>
              <span className="font-extrabold text-white text-sm">২৫ টাকা (BDT 25)</span>
            </div>
            <div className="bg-[#17212b] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">ম্যাক্সিমাম উত্তোলন:</span>
              <span className="font-extrabold text-emerald-400 text-sm">Unlimited 🤑</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 bg-[#17212b] p-2 rounded-xl border border-white/5">
            💳 মাধ্যম: <span className="font-bold text-white">(বিকাশ, নগদ, Binance id / USDT)</span>
          </p>
        </div>

        {/* Ad Rules Box */}
        <div className="bg-[#1e2c3a] p-3.5 rounded-2xl border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>অ্যাড দেখা ও ক্লিকের গুরুত্বপূর্ণ নিয়ম 👇</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 bg-[#17212b] p-2.5 rounded-xl border border-white/5 leading-relaxed">
            <p>1️⃣ প্রতি ১০টা অ্যাড দেখার পর অন্তত ১টা অ্যাডে ক্লিক করবেন।</p>
            <p>2️⃣ ক্লিক করার পর কমপক্ষে ১ মিনিট সেই ওয়েবপেজে অবস্থান করবেন।</p>
            <p className="text-amber-300 font-medium">
              ⚠️ যদি নিয়ম অনুযায়ী ক্লিক ও ভিজিট না করেন, তাহলে সেই কাজের পেমেন্ট দেওয়া হবে না।
            </p>
          </div>
        </div>

        {/* Official Channels Box */}
        <div className="bg-[#1e2c3a] p-3.5 rounded-2xl border border-blue-500/20 space-y-2.5">
          <p className="font-bold text-[#50a2e9] text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#50a2e9]" />
            <span>আমাদের অফিসিয়াল চ্যানেলে জয়েন করুন 👇</span>
          </p>

          <div className="space-y-1.5">
            {/* Channel 1 */}
            <button
              id="tg-start-channel-1"
              type="button"
              onClick={() => handleOpenTelegramLink('https://t.me/CholoIncomeKori')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#17212b] hover:bg-[#233140] border border-white/5 text-xs transition-colors cursor-pointer group text-left"
            >
              <div className="truncate pr-2">
                <span className="font-bold text-white group-hover:text-[#50a2e9] block truncate">
                  📢 অফিসিয়াল আপডেট চ্যানেল
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">
                  https://t.me/CholoIncomeKori
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#50a2e9] shrink-0" />
            </button>

            {/* Channel 2 */}
            <button
              id="tg-start-channel-2"
              type="button"
              onClick={() => handleOpenTelegramLink('https://t.me/IncomeBD_Online')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#17212b] hover:bg-[#233140] border border-white/5 text-xs transition-colors cursor-pointer group text-left"
            >
              <div className="truncate pr-2">
                <span className="font-bold text-white group-hover:text-[#50a2e9] block truncate">
                  💳 লাইভ পেমেন্ট প্রুফ চ্যানেল
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">
                  https://t.me/IncomeBD_Online
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#50a2e9] shrink-0" />
            </button>

            {/* Helpline */}
            <button
              id="tg-start-channel-3"
              type="button"
              onClick={() => handleOpenTelegramLink('https://t.me/choloincomekori_help')}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#17212b] hover:bg-[#233140] border border-white/5 text-xs transition-colors cursor-pointer group text-left"
            >
              <div className="truncate pr-2">
                <span className="font-bold text-white group-hover:text-[#50a2e9] block truncate">
                  💬 অফিসিয়াল হেল্প ও সাপোর্ট
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">
                  https://t.me/choloincomekori_help
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#50a2e9] shrink-0" />
            </button>
          </div>
        </div>

        {/* Bot launch date footer */}
        <div className="pt-1 flex items-center justify-between text-slate-400 text-xs border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>bot launch date:</span>
            <span className="font-bold text-slate-200">22/05/2026</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400">
            ১০০% রিয়েল পেমেন্ট ✅
          </span>
        </div>
      </div>
    </div>
  );
};

export default TelegramBotStartScreen;
