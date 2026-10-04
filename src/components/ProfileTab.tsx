import React from 'react';
import {
  CreditCard,
  History,
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  Headphones,
  Bell,
  LogOut,
  Sparkles,
  Percent,
} from 'lucide-react';
import { UserProfile, Language, Currency } from '../types';
import { LIVE_PAYOUTS } from '../data';
import { TRANSLATIONS } from '../i18n';
import { formatMoney, toLocalizedDigits } from '../utils/formatters';

interface ProfileTabProps {
  user: UserProfile;
  language: Language;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onTestNotification: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  language,
  onOpenWithdraw,
  onOpenHistory,
  onOpenSettings,
  onOpenAuth,
  onTestNotification,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [copied, setCopied] = React.useState(false);
  const [payoutsList, setPayoutsList] = React.useState<any[]>(LIVE_PAYOUTS);

  React.useEffect(() => {
    fetch('/api/live-payouts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPayoutsList(data);
        }
      })
      .catch(() => {});
  }, []);

  const referralUrl = `https://t.me/${user.referralCode || 'CholoIncomeKoriBot'}?start=${user.id || 'ref101'}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedBalance = () => {
    return formatMoney(user.balanceUsd, user.currency, language, { showCode: true });
  };

  return (
    <div id="profile-tab-content" className="space-y-4 pb-20 pt-2">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-800 to-purple-950 p-5 text-white shadow-xl border border-purple-400/30 text-center relative overflow-hidden">
        <div className="relative inline-block mb-3">
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-20 h-20 rounded-full border-4 border-amber-300 object-cover mx-auto shadow-md"
          />
          <span className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-purple-900 flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" /> VERIFIED
          </span>
        </div>

        <h2 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
          {user.displayName}
        </h2>
        <p className="text-xs text-purple-200 font-semibold mb-3">
          {user.username} • <span className="text-amber-300 font-bold">PREMIUM MEMBER</span>
        </p>

        {/* Big Balance Box */}
        <div className="bg-purple-950/80 border border-purple-400/30 rounded-2xl p-3 mb-4">
          <span className="text-[10px] uppercase font-bold text-purple-300 block mb-0.5">
            {t.totalBalance}
          </span>
          <div className="text-2xl font-black text-amber-300 tracking-tight">
            {formattedBalance()}
          </div>
        </div>

        {/* 3 Stats: Joined, Active, Inactive */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="bg-purple-900/50 border border-purple-500/20 rounded-xl p-2">
            <div className="text-sm font-extrabold text-white">{toLocalizedDigits(user.joinedCount, language)}</div>
            <div className="text-[10px] font-semibold text-purple-300 uppercase">{t.joined}</div>
          </div>
          <div className="bg-purple-900/50 border border-purple-500/20 rounded-xl p-2">
            <div className="text-sm font-extrabold text-emerald-400">{toLocalizedDigits(user.activeCount, language)}</div>
            <div className="text-[10px] font-semibold text-emerald-300 uppercase">{t.active}</div>
          </div>
          <div className="bg-purple-900/50 border border-purple-500/20 rounded-xl p-2">
            <div className="text-sm font-extrabold text-rose-400">{toLocalizedDigits(user.inactiveCount, language)}</div>
            <div className="text-[10px] font-semibold text-rose-300 uppercase">{t.inactive}</div>
          </div>
        </div>

        {/* 2 Primary Buttons: Withdraw & History */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="profile-withdraw-btn"
            onClick={onOpenWithdraw}
            className="py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition-all active:scale-98"
          >
            <CreditCard className="w-4 h-4" />
            <span>{t.withdraw}</span>
          </button>

          <button
            id="profile-history-btn"
            onClick={onOpenHistory}
            className="py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs transition-all active:scale-98"
          >
            <History className="w-4 h-4" />
            <span>{t.history}</span>
          </button>
        </div>
      </div>

      {/* Invite Link Card & 5% Lifetime Commission */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {t.yourInviteLink}:
          </label>
          <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Percent className="w-3 h-3 text-amber-600" />
            <span>৫% আজীবন কমিশন</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-600 font-mono truncate pl-1">
            {referralUrl}
          </span>
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
          <span className="text-purple-900 font-medium">অর্জিত রেফারেল কমিশন:</span>
          <span className="font-extrabold text-emerald-600">
            {formatMoney(user.totalCommissionEarnedUsd || 0, user.currency, language)}
          </span>
        </div>
      </div>

      {/* Live Payouts Stream (as seen in video at 03:30 - 03:55) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-900">
              {t.livePayouts}
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Real-Time</span>
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {payoutsList.map((payout, idx) => (
            <div
              key={payout.id || idx}
              className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
            >
              <div>
                <span className="font-extrabold text-slate-900">{payout.userName}</span>
                <p className="text-[10px] text-slate-400">
                  via {payout.method} • {payout.timeAgo || 'সফল'} {payout.trxId ? `• ${payout.trxId}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-600 block">{payout.amount}</span>
                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  ✅ Paid
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
