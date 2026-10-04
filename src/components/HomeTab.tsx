import React from 'react';
import {
  ListChecks,
  Video,
  Users,
  Building2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  Bell,
  ShoppingBag,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, VideoItem, Language, AdLockedVideo } from '../types';
import { TRANSLATIONS } from '../i18n';
import { toLocalizedDigits } from '../utils/formatters';
import { INITIAL_AD_LOCKED_VIDEOS } from '../data';

interface HomeTabProps {
  user: UserProfile;
  videos: VideoItem[];
  selectedCategory: string;
  selectedSubCategory: string;
  onOpenCategoryModal: () => void;
  onSelectSubCategory: (sub: string) => void;
  onVideoClick?: (video: VideoItem) => void;
  onOpenWithdraw: () => void;
  onTabChange: (tab: 'home' | 'refer' | 'earn' | 'rank' | 'profile') => void;
  language: Language;
  onOpenAdLockedVideo?: (video: AdLockedVideo) => void;
  onOpenDigitalStore?: () => void;
  adVideos?: AdLockedVideo[];
}

const SUB_CATEGORIES = [
  'All Videos',
  'Monitag',
  'Adsterra',
  'Telegram',
  'পেইড মার্কেটিং',
  'Viral Video',
  'Advertica',
];

export const HomeTab: React.FC<HomeTabProps> = ({
  user,
  videos,
  selectedCategory,
  selectedSubCategory,
  onOpenCategoryModal,
  onSelectSubCategory,
  onVideoClick,
  onOpenWithdraw,
  onTabChange,
  language,
  onOpenAdLockedVideo,
  onOpenDigitalStore,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const subCategoryScrollRef = React.useRef<HTMLDivElement>(null);

  // Ad-locked videos state
  const [adLockedVideos, setAdLockedVideos] = React.useState<AdLockedVideo[]>([]);
  const [livePayouts, setLivePayouts] = React.useState<any[]>([]);
  const [activePayoutIndex, setActivePayoutIndex] = React.useState<number>(0);

  React.useEffect(() => {
    fetch(`/api/ad-videos?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAdLockedVideos(data);
      })
      .catch(() => {});

    fetch('/api/live-payouts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLivePayouts(data);
      })
      .catch(() => {});
  }, [user.id]);

  React.useEffect(() => {
    if (livePayouts.length <= 1) return;
    const interval = setInterval(() => {
      setActivePayoutIndex((prev) => (prev + 1) % livePayouts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [livePayouts.length]);

  // Currency formatted balance with localized digits
  const formatBalance = () => {
    const bUsd = Number(user.balanceUsd) || 0;
    let rawStr = '0.00';
    let symbol = '৳';
    let code = 'BDT';

    if (user.currency === 'BDT') {
      rawStr = (bUsd * 120).toFixed(2);
      symbol = '৳';
      code = 'BDT';
    } else if (user.currency === 'INR') {
      rawStr = (bUsd * 87).toFixed(2);
      symbol = '₹';
      code = 'INR';
    } else {
      rawStr = bUsd > 0 && bUsd < 0.01 ? bUsd.toFixed(4) : bUsd.toFixed(2);
      symbol = '$';
      code = 'USD';
    }

    return {
      symbol,
      amount: toLocalizedDigits(rawStr, language),
      code,
    };
  };

  const balanceInfo = formatBalance();

  const scrollSubCategories = (direction: 'left' | 'right') => {
    if (subCategoryScrollRef.current) {
      const offset = direction === 'left' ? -150 : 150;
      subCategoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filter videos
  const filteredVideos = videos.filter((v) => {
    if (v.category !== selectedCategory) return false;
    if (selectedSubCategory !== 'All Videos' && v.subCategory !== selectedSubCategory) {
      return false;
    }
    return true;
  });

  return (
    <div id="home-tab-content" className="space-y-4 pb-20 pt-2">
      {/* Total Balance Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800 p-5 text-white shadow-xl overflow-hidden border border-purple-400/30">
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
            {t.totalBalance}
          </span>
          <span className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center text-xs">
            💸
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-black text-amber-300">{balanceInfo.symbol}</span>
          <span className="text-4xl font-extrabold tracking-tight text-white">{balanceInfo.amount}</span>
          <span className="text-xs font-bold text-purple-200">{balanceInfo.code}</span>
        </div>

        {/* Daily Ad Safe Limit Indicator (Adsterra / Monetag account protection) */}
        <div className="bg-purple-950/60 border border-purple-400/30 rounded-2xl p-2.5 mb-3 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-purple-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              আজকের অ্যাড দেখার লিমিট (অ্যাকাউন্ট সেফটি)
            </div>
            <div className="text-white font-bold text-xs mt-0.5">
              দেখা হয়েছে: <span className="text-amber-300 font-extrabold">{toLocalizedDigits(user.adsWatchedToday || 0, language)}</span> / {toLocalizedDigits(user.dailyAdLimit || 40, language)} টি
            </div>
          </div>
          <div className="text-right">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
              (user.adsWatchedToday || 0) >= (user.dailyAdLimit || 40)
                ? 'bg-rose-500 text-white'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}>
              {(user.adsWatchedToday || 0) >= (user.dailyAdLimit || 40) ? 'লিমিট শেষ ⛔' : 'অ্যাকাউন্ট সুরক্ষিত ✅'}
            </span>
          </div>
        </div>

        {/* Withdraw reminder button inside balance card */}
        <button
          id="balance-card-withdraw-btn"
          onClick={onOpenWithdraw}
          className="w-full py-2 px-3.5 bg-purple-900/60 hover:bg-purple-900/80 border border-purple-400/40 rounded-full text-xs font-semibold text-purple-100 flex items-center justify-center gap-1.5 transition-all active:scale-98"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>
            {t.withdrawReminder}{' '}
            {user.currency === 'USD'
              ? `$${toLocalizedDigits('0.25', language)}!`
              : user.currency === 'BDT'
              ? `৳${toLocalizedDigits('25.00', language)}!`
              : `₹${toLocalizedDigits('20.00', language)}!`}
          </span>
        </button>
      </div>

      {/* Live Payment Proof Verified Ticker (সব ইউজারদের জন্য লাইভ প্রমাণ) */}
      {livePayouts.length > 0 && (
        <div
          onClick={() => onTabChange('profile')}
          className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 rounded-2xl p-2.5 px-3.5 shadow-md flex items-center justify-between gap-2.5 cursor-pointer hover:border-emerald-400 transition-all text-xs text-white active:scale-99"
          title="সকল লাইভ পেমেন্ট প্রুফ দেখুন"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
              পেমেন্ট প্রুফ
            </span>
            <div className="truncate text-slate-200 text-[11px]">
              <strong className="text-white font-extrabold">{livePayouts[activePayoutIndex]?.userName}</strong> কে{' '}
              <span className="text-amber-300 font-black">{livePayouts[activePayoutIndex]?.amount}</span> ({livePayouts[activePayoutIndex]?.method}) পরিশোধ হয়েছে
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded shrink-0 border border-emerald-500/30">
            ✅ Verified
          </span>
        </div>
      )}

      {/* 4 Quick Action Circular Buttons */}
      <div className="grid grid-cols-4 gap-2.5 px-1">
        <button
          id="action-tasks-btn"
          onClick={() => onTabChange('earn')}
          className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/30 group-hover:scale-105 transition-all">
            <ListChecks className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-800">{t.tasks}</span>
        </button>

        <button
          id="action-videos-btn"
          onClick={() => {
            const el = document.getElementById('videos-feed-grid');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-rose-500/30 group-hover:scale-105 transition-all">
            <Video className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-800">{t.videos}</span>
        </button>

        <button
          id="action-refer-btn"
          onClick={() => onTabChange('refer')}
          className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-all">
            <Users className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-800">{t.refer}</span>
        </button>

        <button
          id="action-withdraw-btn"
          onClick={onOpenWithdraw}
          className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-all">
            <Building2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-800">{t.withdraw}</span>
        </button>
      </div>

      {/* VIP Digital Store Banner (সফটওয়্যার ও কোর্স স্টোর) */}
      {onOpenDigitalStore && (
        <div
          id="vip-digital-store-banner"
          onClick={onOpenDigitalStore}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-4 text-white shadow-lg border border-amber-300/40 cursor-pointer transition-all active:scale-98 group"
        >
          <div className="absolute -right-4 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
                <ShoppingBag className="w-6 h-6 text-amber-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full border border-white/20">
                    VIP Store
                  </span>
                  <span className="text-[10px] font-bold text-amber-200">বিকাশ/নগদ ম্যানুয়াল অনুমোদন</span>
                </div>
                <h3 className="font-extrabold text-sm text-white tracking-tight mt-0.5">
                  সফটওয়্যার, বট স্ক্রিপ্ট ও কোর্স কিনুন
                </h3>
                <p className="text-[11px] text-amber-100/90 line-clamp-1">
                  অর্ডার করুন এবং এডমিন অনুমোদনের পর সাথে সাথে ডাউনলোড পান
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/25 group-hover:bg-white text-white group-hover:text-rose-600 transition-all shadow-sm">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Dedicated 15-Ad Locked Videos Section (৯০ মিনিট অটো-ডিলিট ও ডিরেক্ট ওয়াচ) */}
      {adLockedVideos.length > 0 && onOpenAdLockedVideo && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600/10 text-purple-700 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>লকড প্রিমিয়াম ভিডিও</span>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                  {adLockedVideos.length}টি স্পেশাল
                </span>
              </h3>
            </div>
            <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ৯০ মি. এক্সপায়ার
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adLockedVideos.map((lockedVid) => {
              const isUnlocked = lockedVid.isUnlocked && lockedVid.remainingSeconds && lockedVid.remainingSeconds > 0;

              const openDemoOnTelegram = (e: React.MouseEvent) => {
                e.stopPropagation();
                const targetUrl = lockedVid.demoChannelUrl || lockedVid.previewVideoUrl;
                if (targetUrl) {
                  if ((window as any).Telegram?.WebApp?.openTelegramLink && (targetUrl.startsWith('https://t.me/') || targetUrl.startsWith('tg://'))) {
                    (window as any).Telegram.WebApp.openTelegramLink(targetUrl);
                  } else if ((window as any).Telegram?.WebApp?.openLink) {
                    (window as any).Telegram.WebApp.openLink(targetUrl);
                  } else {
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                  }
                } else {
                  onOpenAdLockedVideo(lockedVid);
                }
              };

              return (
                <div
                  key={lockedVid.id}
                  id={`ad-locked-card-${lockedVid.id}`}
                  onClick={() => onOpenAdLockedVideo(lockedVid)}
                  className={`p-3.5 rounded-2xl border transition-all shadow-sm flex flex-col justify-between gap-3 cursor-pointer ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-emerald-950/20 via-white to-green-50/50 border-emerald-500/40 hover:border-emerald-500'
                      : 'bg-white border-purple-200/80 hover:border-purple-400 hover:shadow-md'
                  }`}
                >
                  <div
                    className="flex items-start gap-3 group"
                    title="ক্লিক করে ডেমো ও ফুল ভিডিও আনলক পপআপ দেখুন"
                  >
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                      <img
                        src={lockedVid.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'}
                        alt={lockedVid.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1 left-1 bg-black/85 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Play className="w-2 h-2 fill-white" />
                        <span>ডেমো ভিডিও</span>
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/80 text-amber-300 text-[8px] font-bold px-1 rounded font-mono">
                        {lockedVid.duration || lockedVid.previewDuration || '02:00'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isUnlocked
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isUnlocked ? 'আনলকড ✅' : `${lockedVid.requiredAds}টি অ্যাড`}
                        </span>
                        <span className="text-[9px] text-slate-400">• ৯০ মিনিট লাইভ</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
                        {lockedVid.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {lockedVid.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdLockedVideo(lockedVid);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 flex items-center gap-1 transition-all cursor-pointer"
                      title="ডেমো ও আনলক পপআপ দেখুন"
                    >
                      <Play className="w-3 h-3 fill-purple-800" />
                      <span>🎥 ডেমো দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAdLockedVideo(lockedVid);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                        isUnlocked
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>ফুল ভিডিও দেখুন</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-white" />
                          <span>ইনবক্সে আনলক</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category selector button */}
      <button
        id="home-category-picker-btn"
        onClick={onOpenCategoryModal}
        className="w-full bg-white/95 hover:bg-white rounded-2xl py-3 px-4 shadow-sm border border-purple-100 flex items-center justify-between transition-all active:scale-99 group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">
            {selectedCategory === 'online-income' ? '🪙' : '🎬'}
          </span>
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">
            {selectedCategory === 'online-income' ? t.onlineIncome : t.moviesClips}
          </span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-700 flex items-center justify-center transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </div>
      </button>

      {/* Sub-categories horizontal pill bar with navigation arrows */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => scrollSubCategories('left')}
          className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 shrink-0 shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={subCategoryScrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
        >
          {SUB_CATEGORIES.map((sub) => {
            const isSelected = selectedSubCategory === sub;
            return (
              <button
                key={sub}
                onClick={() => onSelectSubCategory(sub)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-102'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollSubCategories('right')}
          className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 shrink-0 shadow-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Video Grid (2 columns) displaying Admin-uploaded Locked & 90-min Expiry Videos */}
      <div id="videos-feed-grid" className="grid grid-cols-2 gap-3 pt-1">
        {((adLockedVideos && adLockedVideos.length > 0) ? adLockedVideos : INITIAL_AD_LOCKED_VIDEOS).map((video) => {
          const isUnlocked = video.unlocked;

          const openDemoOnTelegram = (e?: React.MouseEvent) => {
            if (e) e.stopPropagation();
            const targetUrl =
              video.demoChannelUrl ||
              (video.channelId ? `https://t.me/${video.channelId.replace('@', '')}` : null) ||
              video.previewVideoUrl ||
              'https://t.me/CholoIncomeKori';

            const tg = (window as any).Telegram?.WebApp;
            if (tg?.openTelegramLink && (targetUrl.startsWith('https://t.me/') || targetUrl.startsWith('tg://'))) {
              tg.openTelegramLink(targetUrl);
            } else if (tg?.openLink) {
              tg.openLink(targetUrl);
            } else {
              window.open(targetUrl, '_blank', 'noopener,noreferrer');
            }
          };

          return (
            <div
              key={video.id}
              id={`video-card-${video.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 flex flex-col group transition-all hover:shadow-md hover:border-purple-300"
            >
              {/* Thumbnail with "Free Demo" badge & duration - clicking opens Demo & Unlock modal */}
              <div
                onClick={() => onOpenAdLockedVideo?.(video)}
                className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                title="ক্লিক করে ডেমো ও ফুল ভিডিও আনলক পপআপ দেখুন"
              >
                <img
                  src={video.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'}
                  alt={video.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-1.5 right-1.5 bg-black/85 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-white/20 flex items-center gap-1">
                  <span>🎥 ডেমো ও আনলক</span>
                </div>
                <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {video.previewDuration}
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-purple-900/90 text-purple-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                  ফুল: {video.fullDuration}
                </div>
              </div>

              {/* Content */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    onClick={() => onOpenAdLockedVideo?.(video)}
                    className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mb-1 hover:text-purple-600 cursor-pointer transition-colors"
                    title="ক্লিক করে ডেমো ও ফুল ভিডিও আনলক পপআপ দেখুন"
                  >
                    {video.title}
                  </h4>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mb-2 flex items-center justify-between">
                    <span>
                      {isUnlocked
                        ? '✅ ফুল ভিডিও আনলকড (৯০ মি.)'
                        : `🔒 ${video.requiredAds || 15}টি বিজ্ঞাপনে ফুল ভিডিও`}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {/* Watch Demo in Telegram Channel Button */}
                  <button
                    id={`watch-demo-btn-${video.id}`}
                    type="button"
                    onClick={openDemoOnTelegram}
                    className="w-full py-2 px-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-[11px] font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all active:scale-97 cursor-pointer"
                    title="টেলিগ্রাম চ্যানেলে ডেমো ভিডিওটি দেখুন"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>🎥 টেলিগ্রামে ডেমো দেখুন</span>
                  </button>

                  {/* Watch / Unlock Full Video Button */}
                  <button
                    id={`unlock-full-btn-${video.id}`}
                    type="button"
                    onClick={() => onOpenAdLockedVideo?.(video)}
                    className={`w-full py-1.5 px-2 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isUnlocked
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-600" />
                        <span>ফুল ভিডিও চালু করুন</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>ফুল ভিডিও আনলক ({video.requiredAds || 15} অ্যাড)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination control */}
      <div className="flex items-center justify-center gap-3 pt-3 text-xs font-bold text-slate-700">
        <button
          disabled
          className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 bg-white rounded-lg shadow-xs border border-slate-200">
          Page 1
        </span>
        <button
          onClick={() => {}}
          className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 shadow-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
