import React from 'react';
import { Share2, Copy, Gift, Clock, Check, Crown, Percent, Sparkles, Coins, Flame, ArrowUpRight } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { DAILY_REFERRAL_TIERS } from '../data';
import { TRANSLATIONS } from '../i18n';
import confetti from 'canvas-confetti';
import { toLocalizedDigits, formatMoney as formatMoneyUtil } from '../utils/formatters';
import { ShareModal } from './ShareModal';

interface ReferTabProps {
  user: UserProfile;
  language: Language;
  onClaimTier: (index: number, rewardUsd: number) => void;
  onSimulateReferral?: () => void;
  onClaimCommission?: () => void;
  onSimulateCommissionActivity?: () => void;
}

export const ReferTab: React.FC<ReferTabProps> = ({
  user,
  language,
  onClaimTier,
  onSimulateReferral,
  onClaimCommission,
  onSimulateCommissionActivity,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [copied, setCopied] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState('00:02:53');
  const [isClaimingCommission, setIsClaimingCommission] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  const formatMoney = (usd: number) => {
    return formatMoneyUtil(usd, user.currency, language);
  };

  const handleClaimCommissionClick = () => {
    if ((user.claimableCommissionUsd || 0) <= 0) return;
    setIsClaimingCommission(true);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    if (onClaimCommission) {
      onClaimCommission();
    }
    setTimeout(() => {
      setIsClaimingCommission(false);
    }, 500);
  };

  // Countdown timer for 24H Daily Rewards
  React.useEffect(() => {
    let seconds = 173;
    const interval = setInterval(() => {
      seconds = seconds <= 0 ? 173 : seconds - 1;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setTimeLeft(
        `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const referralUrl = `https://t.me/${user.referralCode || 'CholoIncomeKoriBot'}?start=${user.id || 'ref101'}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenShare = () => {
    setShowShareModal(true);
  };

  return (
    <div id="refer-tab-content" className="space-y-4 pb-20 pt-2">
      {/* Invite Friends Top Gradient Card */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-purple-700 to-indigo-900 p-5 text-white shadow-xl border border-purple-500/40 relative overflow-hidden">
        {/* Crown Badge */}
        <div className="flex justify-center mb-1">
          <div className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" />
            PREMIUM REWARDS
          </div>
        </div>

        <h2 className="text-2xl font-black text-center text-white mb-2">
          {t.inviteFriends}
        </h2>

        <p className="text-xs text-purple-200 text-center leading-relaxed mb-4 max-w-xs mx-auto">
          প্রতিটি সফল রেফারে পাবেন{' '}
          <span className="text-amber-300 font-extrabold">
            {toLocalizedDigits(10, language)} টাকা (৳{toLocalizedDigits('10.00', language)})
          </span>{' '}
          ইন্সট্যান্ট বোনাস! বোনাসটি নোটিফিকেশন বার থেকে ক্লেইম করলেই মূল ব্যালেন্সে যোগ হবে।
        </p>

        {/* Pending referral bonus badge */}
        <div className="bg-purple-950/70 border border-purple-400/30 rounded-2xl p-3.5 mb-4 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block mb-1">
            রেফারেল ক্লেইমযোগ্য বোনাস
          </span>
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            ৳ {toLocalizedDigits((user.pendingReferralBonusUsd * 120 || 0).toFixed(0), language)}
          </div>
          <span className="text-[10px] text-purple-200 mt-1 block">
            {(user.pendingReferralBonusUsd || 0) > 0
              ? '(নোটিফিকেশন বার থেকে Claim বাটনে ক্লিক করে সংগ্রহ করুন)'
              : '(কোনো ক্লেইমযোগ্য বোনাস নেই। বন্ধুদের ইনভাইট করলে এখানে বোনাস যুক্ত হবে)'}
          </span>
        </div>

        {/* Share / Invite Friends Button */}
        <button
          id="send-to-inbox-btn"
          type="button"
          onClick={handleOpenShare}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-98 mb-4 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>বন্ধু কে ইনভাইট করুন (শেয়ার লিংক)</span>
        </button>

        {/* 4 Stats: Joined, Active (10 TK), Active total, Inactive */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="bg-purple-900/50 border border-purple-500/20 rounded-xl p-2.5">
            <div className="text-base font-extrabold text-white">{toLocalizedDigits(user.joinedCount, language)}</div>
            <div className="text-[10px] font-semibold text-purple-300">মোট রেফার</div>
          </div>
          <div className="bg-purple-900/50 border border-purple-500/20 rounded-xl p-2.5">
            <div className="text-base font-extrabold text-emerald-400">
              {toLocalizedDigits(user.activeReferralsWithActivity || 0, language)} / {toLocalizedDigits(3, language)}
            </div>
            <div className="text-[10px] font-semibold text-emerald-300">সক্রিয় ({toLocalizedDigits(10, language)}৳ কাজ)</div>
          </div>
          <div className="bg-purple-900/50 border border-purple-500/20 rounded-xl p-2.5">
            <div className="text-base font-extrabold text-amber-400">{toLocalizedDigits(user.todayReferrals, language)}</div>
            <div className="text-[10px] font-semibold text-amber-300">আজকের রেফার</div>
          </div>
        </div>

        {/* Referral URL Box */}
        <div className="bg-purple-950/80 border border-purple-400/30 rounded-2xl p-2 flex items-center justify-between gap-2">
          <span className="text-xs text-purple-200 font-mono truncate pl-2">
            {referralUrl}
          </span>
          <button
            id="copy-referral-link-btn"
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-white text-purple-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 hover:bg-purple-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 5% Lifetime Referral Commission Card */}
      <div id="referral-commission-card" className="rounded-3xl bg-white p-5 text-slate-800 shadow-md border-2 border-amber-400/50 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/40 text-amber-900 font-black text-xs px-3 py-1 rounded-full">
            <Percent className="w-3.5 h-3.5 text-amber-600" />
            <span>৫% আজীবন রেফার কমিশন</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            অ্যাক্টিভ (Active)
          </span>
        </div>

        <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mb-1">
          <Flame className="w-5 h-5 text-orange-500" />
          বন্ধু রেফার করুন, পান ৫% কমিশন
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          আপনার রেফারকৃত বন্ধুরা প্রতিদিন ভিডিও দেখে বা যেকোনো কাজ সম্পন্ন করে যা ইনকাম করবে, তার <strong className="text-amber-700 font-extrabold">৫% কমিশন আজীবন সরাসরি</strong> আপনার ব্যালেন্সে জমা হবে!
        </p>

        {/* 3 Metrics Box */}
        <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">কমিশন রেট</span>
            <div className="text-base font-black text-purple-700 flex items-center justify-center gap-0.5">
              <span>5%</span>
            </div>
            <span className="text-[9px] text-purple-600 font-semibold">আজীবন</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-500 block mb-0.5">মোট কমিশন আয়</span>
            <div className="text-sm font-black text-slate-900 truncate">
              {formatMoney(user.totalCommissionEarnedUsd || 0)}
            </div>
            <span className="text-[9px] text-emerald-600 font-semibold">অর্জিত</span>
          </div>

          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-amber-800 block mb-0.5">ক্লেইমযোগ্য</span>
            <div className="text-sm font-black text-amber-700 truncate">
              {formatMoney(user.claimableCommissionUsd || 0)}
            </div>
            <span className="text-[9px] text-amber-600 font-semibold">ব্যালেন্সে নেওয়ার জন্য</span>
          </div>
        </div>

        {/* Action Button: Claim to Main Balance */}
        <div className="space-y-2 mb-4">
          <button
            id="claim-commission-btn"
            type="button"
            onClick={handleClaimCommissionClick}
            disabled={(user.claimableCommissionUsd || 0) <= 0 || isClaimingCommission}
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
              (user.claimableCommissionUsd || 0) > 0
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-900" />
            <span>
              {(user.claimableCommissionUsd || 0) > 0
                ? `ক্লেইম করুন: ${formatMoney(user.claimableCommissionUsd || 0)} মূল ব্যালেন্সে নিন`
                : 'ক্লেইম করার মতো কমিশন জমা নেই'}
            </span>
          </button>
        </div>

        {/* Recent Commission Activity Feed */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>লাইভ রেফারেল কমিশন হিস্ট্রি</span>
            </h4>
            <span className="text-[10px] text-slate-400">সর্বশেষ কার্যক্রম</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
            {user.referralCommissionHistory && user.referralCommissionHistory.length > 0 ? (
              user.referralCommissionHistory.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      5%
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <span>{log.userFrom}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({log.time})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {log.activity} ({formatMoney(log.userEarnedUsd)})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-emerald-600 text-xs">
                      +{formatMoney(log.commissionUsd)}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">কমিশন</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                <p>এখনো কোনো রেফারেল কাজ সম্পন্ন করেনি।</p>
                <p className="text-[11px] text-purple-600 font-semibold mt-0.5">
                  বন্ধুদের ইনভাইট করলেই তাদের আয়ের ৫% এখানে দেখা যাবে!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Free Unlock Guide Card */}
      <div className="rounded-3xl bg-white p-5 text-slate-800 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-purple-700 font-black text-base">
          <Gift className="w-5 h-5 text-pink-500" />
          <span>{t.freeUnlockGuide}</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="text-slate-600 leading-snug">
              <strong className="text-slate-900">Invite Friends:</strong> Get free video access per referral.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p className="text-slate-600 leading-snug">
              <strong className="text-slate-900">Milestones:</strong> Watch ads to automatically get a Gift Card!
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="text-slate-600 leading-snug">
              <strong className="text-slate-900">Daily Rewards:</strong> Complete tasks to claim referral packages.
            </p>
          </div>
        </div>

        <div className="bg-amber-100/70 border border-amber-300 rounded-2xl py-2 px-3 text-center text-xs font-black text-amber-900 tracking-wider">
          WORK DAILY, GET PAID 100%! 💸
        </div>
      </div>

      {/* 24H Daily Rewards Section */}
      <div className="rounded-3xl bg-white p-5 text-slate-800 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm">
            <Gift className="w-4 h-4 text-purple-600" />
            <span>{t.dailyRewards}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Today's Referrals Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-700">{t.todaysReferral}:</span>
          <span className="text-lg font-black text-purple-700">{user.todayReferrals}</span>
        </div>

        {/* Tier list */}
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
          {DAILY_REFERRAL_TIERS.map((tier, idx) => {
            const isClaimed = user.claimedDailyTiers?.includes(idx);
            const canClaim = user.todayReferrals >= tier.count && !isClaimed;

            return (
              <div
                key={tier.count}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isClaimed
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : canClaim
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Invite {tier.count} Friends
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                    <span className="font-extrabold text-emerald-600">
                      +${tier.rewardUsd.toFixed(2)}
                    </span>
                    <span className="font-semibold text-purple-600">
                      +{tier.freeVideos} Free Videos
                    </span>
                  </div>
                </div>

                <button
                  id={`claim-tier-btn-${tier.count}`}
                  type="button"
                  disabled={!canClaim || isClaimed}
                  onClick={() => {
                    if (!canClaim || isClaimed) return;
                    onClaimTier(idx, tier.rewardUsd);
                    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isClaimed
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : canClaim
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm animate-pulse cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isClaimed ? t.claimed : canClaim ? t.claim : `অপেক্ষমান (${tier.count})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Media Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        language={language}
      />
    </div>
  );
};
