import React from 'react';
import {
  Play,
  Globe,
  Send,
  Target,
  Users,
  Flame,
  CheckCircle2,
  Loader2,
  Megaphone,
  Sparkles,
  ExternalLink,
  Award,
  Clock,
  FileText,
  Video,
  Image as ImageIcon,
  ShieldCheck,
  X,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile, Language, IncomeTask } from '../types';
import { VISIT_JOBS, TELEGRAM_TASKS, MISSION_TASKS, INITIAL_INCOME_TASKS } from '../data';
import { TRANSLATIONS } from '../i18n';
import confetti from 'canvas-confetti';
import { toLocalizedDigits, formatMoney } from '../utils/formatters';
import { triggerAdsterraPopunder } from '../utils/adsterra';
import { AdWatchingModal } from './AdWatchingModal';

interface EarnTabProps {
  user: UserProfile;
  language: Language;
  onWatchAd: () => void;
  onCompleteTask: (taskId: string, rewardUsd: number, type: string, sessionId?: string, token?: string) => void;
  onOpenOfficialNotice: () => void;
  onTabChange?: (tab: 'home' | 'refer' | 'earn' | 'rank' | 'profile') => void;
  initialSubTab?: 'ads' | 'visit' | 'telegram' | 'mission' | 'referral';
  incomeConfig?: any;
}

export const EarnTab: React.FC<EarnTabProps> = ({
  user,
  language,
  onWatchAd,
  onCompleteTask,
  onOpenOfficialNotice,
  onTabChange,
  initialSubTab = 'ads',
  incomeConfig: propIncomeConfig,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [subTab, setSubTab] = React.useState<'ads' | 'visit' | 'telegram' | 'mission' | 'referral'>(initialSubTab);
  const [tasks, setTasks] = React.useState<IncomeTask[]>(INITIAL_INCOME_TASKS);
  const [loadingTasks, setLoadingTasks] = React.useState(false);
  const [activeTask, setActiveTask] = React.useState<{ id: string; title: string; reward: number; duration: number; type: string } | null>(null);
  const [taskCountdown, setTaskCountdown] = React.useState(0);
  const [runningAdModalTask, setRunningAdModalTask] = React.useState<IncomeTask | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [incomeConfig, setIncomeConfig] = React.useState<any>(propIncomeConfig || null);
  const [selectedDetailTask, setSelectedDetailTask] = React.useState<{
    id: string;
    title: string;
    category: string;
    subCategory?: string;
    rewardUsd: number;
    rewardBdt?: number;
    timerSeconds?: number;
    instructions?: string;
    description?: string;
    destinationUrl?: string;
    channelUrl?: string;
    channelHandle?: string;
    thumbnailUrl?: string;
    mediaUrl?: string;
    target?: number;
    rawItem?: any;
  } | null>(null);

  // Sync prop changes
  React.useEffect(() => {
    if (propIncomeConfig) {
      setIncomeConfig(propIncomeConfig);
    }
  }, [propIncomeConfig]);

  // Fetch dynamic income methods configuration from server if not provided
  React.useEffect(() => {
    if (propIncomeConfig) return;
    fetch('/api/income-methods')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.config) {
          setIncomeConfig(data.config);
        }
      })
      .catch(() => {});
  }, [propIncomeConfig]);

  // Fetch dynamic income tasks from server
  React.useEffect(() => {
    let mounted = true;
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await fetch('/api/tasks');
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      } catch (err) {
        console.error('Failed to load dynamic tasks:', err);
      } finally {
        if (mounted) setLoadingTasks(false);
      }
    };
    fetchTasks();
    return () => {
      mounted = false;
    };
  }, []);

  const startTaskExecution = (task: IncomeTask) => {
    // Trigger Adsterra Popunder Ad when user begins task
    triggerAdsterraPopunder();

    // Secure Full-Time Watching Verification: Open AdWatchingModal with exact duration and mandatory full ad view
    setRunningAdModalTask(task);
  };

  React.useEffect(() => {
    if (taskCountdown > 0) {
      const timer = setTimeout(() => setTaskCountdown(taskCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (activeTask && taskCountdown === 0) {
      // Completed!
      onCompleteTask(activeTask.id, activeTask.reward, activeTask.type);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => setActiveTask(null), 1200);
    }
  }, [taskCountdown, activeTask, onCompleteTask]);

  const handleTelegramTaskClick = (tgTask: IncomeTask | typeof TELEGRAM_TASKS[0]) => {
    const url = (tgTask as any).destinationUrl || (tgTask as any).channelUrl || 'https://t.me/';
    const reward = (tgTask as any).rewardUsd;
    try {
      if ((window as any).Telegram?.WebApp?.openTelegramLink) {
        (window as any).Telegram.WebApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onCompleteTask(tgTask.id, reward, 'telegram');
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
    }, 1500);
  };

  const handleMissionClaim = (mission: IncomeTask | typeof MISSION_TASKS[0]) => {
    onCompleteTask(mission.id, (mission as any).rewardUsd, 'mission');
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
  };

  // Filter tasks by current subtab
  const currentCategoryTasks = tasks.filter((t) => t.category === subTab && t.isActive);

  return (
    <div id="earn-tab-content" className="space-y-4 pb-20 pt-2">
      {/* Official Notice Banner */}
      <div
        id="earn-official-notice-card"
        onClick={onOpenOfficialNotice}
        className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border border-emerald-500/50 rounded-2xl p-3.5 text-white shadow-lg flex items-center justify-between cursor-pointer hover:border-emerald-400 active:scale-98 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <Megaphone className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-black text-white">Official Notice</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-full">নিয়মাবলী</span>
            </div>
            <p className="text-[11px] text-emerald-200 line-clamp-1 font-medium">
              📢 ১০টি অ্যাড দেখার পর ১টি ক্লিক ও ১ মিনিট ভিজিট বাধ্যতামূলক...
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenOfficialNotice();
          }}
          className="text-xs font-bold text-emerald-300 bg-emerald-800/80 hover:bg-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-600/50 shrink-0 shadow-xs cursor-pointer"
        >
          নোটিশ পড়ুন
        </button>
      </div>

      {/* 5 Earning Methods Navigation Bar */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-1.5 shadow-md">
        <div className="text-[11px] font-bold text-purple-300 px-2 py-1 flex items-center justify-between">
          <span>{toLocalizedDigits(5, language)}টি ইনকাম মেথড নির্বাচন করুন</span>
          <span className="text-[10px] text-amber-400">✅ {toLocalizedDigits(100, language)}% নিশ্চিত পেমেন্ট</span>
        </div>
        <div className="grid grid-cols-5 gap-1 pt-1">
          <button
            id="subtab-ads-btn"
            onClick={() => setSubTab('ads')}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 transition-all ${
              subTab === 'ads'
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="truncate">Views Ads</span>
          </button>

          <button
            id="subtab-visit-btn"
            onClick={() => setSubTab('visit')}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 transition-all ${
              subTab === 'visit'
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="truncate">Web Visit</span>
          </button>

          <button
            id="subtab-telegram-btn"
            onClick={() => setSubTab('telegram')}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 transition-all ${
              subTab === 'telegram'
                ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="truncate">Telegram</span>
          </button>

          <button
            id="subtab-mission-btn"
            onClick={() => setSubTab('mission')}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 transition-all ${
              subTab === 'mission'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="truncate">Mission</span>
          </button>

          <button
            id="subtab-referral-btn"
            onClick={() => {
              if (onTabChange) {
                onTabChange('refer');
              } else {
                setSubTab('referral');
              }
            }}
            className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 transition-all ${
              subTab === 'referral'
                ? 'bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="truncate">Referral</span>
          </button>
        </div>
      </div>

      {/* Active task in progress ticker */}
      {activeTask && (
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin" />
            <div>
              <h5 className="font-bold text-xs">{activeTask.title}</h5>
              <span className="text-[11px] text-emerald-100">
                পুরস্কার: +{formatMoney(activeTask.reward, user.currency, language)}
              </span>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold">
            {taskCountdown > 0 ? `${toLocalizedDigits(taskCountdown, language)}s` : 'সম্পন্ন!'}
          </div>
        </div>
      )}

      {/* METHOD 1: Views ads */}
      {subTab === 'ads' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-900 p-6 text-white shadow-xl border border-purple-400/30 text-center relative overflow-hidden">
            <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-amber-400/20 border-2 border-amber-300/60 flex items-center justify-center shadow-[0_0_35px_rgba(251,191,36,0.5)]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-inner">
                $$$
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-1">
              {t.watchAdsEarn}
            </h2>
            <p className="text-xs text-purple-200 mb-3">
              প্রতিটি অ্যাড দেখার সাথে সাথে ব্যালেন্সে টাকা যুক্ত হবে!
            </p>

            <div className="inline-flex items-center gap-2 bg-purple-950/60 border border-purple-400/30 px-3.5 py-1 rounded-full mb-3 text-xs">
              <span className="text-purple-200">প্রতি অ্যাড রিওয়ার্ড:</span>
              <span className="font-extrabold text-amber-300">
                {(() => {
                  const rewUsd = Number(incomeConfig?.ads?.rewardUsd) || 0.0125;
                  const rewBdt = Number(incomeConfig?.ads?.rewardBdt) || +(rewUsd * 120).toFixed(2);
                  return user.currency === 'BDT'
                    ? `৳ ${toLocalizedDigits(rewBdt.toFixed(2), language)}`
                    : user.currency === 'INR'
                    ? `₹ ${toLocalizedDigits((rewUsd * 87).toFixed(2), language)}`
                    : `$ ${toLocalizedDigits(rewUsd.toFixed(4), language)}`;
                })()}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                {t.dailyLimit}: {toLocalizedDigits(user.adsWatchedToday, language)} / {toLocalizedDigits(incomeConfig?.ads?.dailyLimit || user.dailyAdLimit || 40, language)}
              </span>
            </div>

            <button
              id="watch-ad-now-hero-btn"
              onClick={onWatchAd}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 text-base tracking-wide transition-all active:scale-98 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>বিজ্ঞাপন দেখুন ও আয় করুন</span>
            </button>
          </div>

          {/* Dynamic Adsterra / Monetag Ad Tasks from Admin Panel */}
          {currentCategoryTasks.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-300">
                <span>স্পনসরড বিজ্ঞাপন টাস্ক ({toLocalizedDigits(currentCategoryTasks.length, language)}টি)</span>
                <span className="text-[10px] text-amber-400 font-semibold">Adsterra / Monetag</span>
              </div>
              {currentCategoryTasks.map((task) => {
                const isCompleted = user.completedTaskIds?.includes(task.id);
                const taskThumb = task.mediaUrl || task.thumbnailUrl || task.thumbnail;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedDetailTask({
                      id: task.id,
                      title: task.title,
                      category: 'ads',
                      subCategory: task.subCategory || 'ভিডিও বিজ্ঞাপন',
                      rewardUsd: task.rewardUsd,
                      rewardBdt: task.rewardBdt,
                      timerSeconds: task.timerSeconds || 15,
                      thumbnailUrl: taskThumb,
                      mediaUrl: taskThumb,
                      instructions: task.instructions || 'ভিডিও বিজ্ঞাপনটি ১৫ সেকেন্ড দেখুন এবং পুরো টাকা অ্যাকাউন্টে যোগ করে নিন।',
                      description: 'Adsterra / Monetag স্পনসরড বিজ্ঞাপন। ভিডিওটি সম্পূর্ণ সময় দেখে কোনো ক্লোজ না করে অপেক্ষা করুন। সময় শেষে ব্যালেন্সে টাকা জমা হবে।',
                      destinationUrl: task.destinationUrl,
                      rawItem: task,
                    })}
                    className="p-3.5 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-sm flex items-center justify-between hover:border-amber-400/50 transition-all text-white cursor-pointer group"
                    title="ক্লিক করে কাজের বিস্তারিত বিবরণ দেখুন"
                  >
                    <div className="flex items-center gap-3">
                      {taskThumb ? (
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950 shrink-0 flex items-center justify-center">
                          <img
                            src={taskThumb}
                            alt={task.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          {task.mediaType === 'video' ? (
                            <Video className="w-5 h-5" />
                          ) : task.mediaType === 'image' ? (
                            <ImageIcon className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">{task.title}</h4>
                          {task.isHot && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                              <Flame className="w-2.5 h-2.5 fill-amber-500" />
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="font-black text-emerald-400">
                            +{formatMoney(task.rewardUsd, user.currency, language)}
                          </span>
                          <span>•</span>
                          <span>⏱ {toLocalizedDigits(task.timerSeconds || 15, language)}s</span>
                          {task.subCategory && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] text-slate-500">{task.subCategory}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      id={`start-ad-task-${task.id}`}
                      disabled={isCompleted || activeTask !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        startTaskExecution(task);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-sm active:scale-95'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          সম্পন্ন
                        </>
                      ) : (
                        <>
                          অ্যাড দেখুন
                          <ExternalLink className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* METHOD 2: Web visit */}
      {subTab === 'visit' && (
        <div className="space-y-2.5">
          <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-2xl text-xs text-purple-200">
            💡 <span className="font-bold text-white">নির্দেশনা:</span> যে কোনো কাজের উপর ক্লিক করে বিস্তারিত নিয়মাবলী ও ধাপসমূহ পড়ে নিন। এরপর ভিজিট বাটনে ক্লিক করে কাউন্টডাউন শেষ হওয়া পর্যন্ত অপেক্ষা করুন, রিওয়ার্ড অটোমেটিক ব্যালেন্সে যোগ হবে।
          </div>

          {(currentCategoryTasks.length > 0 ? currentCategoryTasks : (VISIT_JOBS as any[])).map((job: any) => {
            const isCompleted = user.completedTaskIds?.includes(job.id);
            const duration = job.timerSeconds || job.durationSeconds || 15;
            const rewardUsd = job.rewardUsd || (job.rewardBdt ? job.rewardBdt / 120 : 0.02);
            const rewardBdt = job.rewardBdt || +(rewardUsd * 120).toFixed(2);
            const jobThumb = job.mediaUrl || job.thumbnailUrl || job.thumbnail;

            return (
              <div
                key={job.id}
                onClick={() => setSelectedDetailTask({
                  id: job.id,
                  title: job.title,
                  category: 'visit',
                  subCategory: job.subCategory || 'ওয়েবসাইট ট্রাফিক ও ভিজিট',
                  rewardUsd,
                  rewardBdt,
                  timerSeconds: duration,
                  thumbnailUrl: jobThumb,
                  mediaUrl: jobThumb,
                  instructions: job.instructions || 'ওয়েবসাইটটিতে প্রবেশ করুন এবং ৩০-৬০ সেকেন্ড স্ক্রোল করে পেজের বিষয়বস্তু দেখুন। কাউন্টডাউন শেষ হলে ব্যালেন্সে টাকা জমা হবে।',
                  description: 'হাই-সিপিএম স্পনসরড ওয়েব ভিজিট টাস্ক। নির্ধারিত সময় পেজে অবস্থান করলে বিজ্ঞাপনদাতাদের মাধ্যমে ভেরিফিকেশন সম্পন্ন হবে এবং আপনার ওয়ালেটে সরাসরি টাকা জমা হবে।',
                  destinationUrl: job.destinationUrl || 'https://researchingsweatexit.com/fx4s1179?key=795515765851a303657a3188bb3b9a45',
                  rawItem: job,
                })}
                className="p-3.5 bg-slate-900 border border-purple-500/20 rounded-2xl shadow-sm flex items-center justify-between hover:border-purple-400/50 hover:bg-slate-800/80 transition-all text-white cursor-pointer group"
                title="ক্লিক করে কাজের বিস্তারিত বিবরণ দেখুন"
              >
                <div className="flex items-center gap-3">
                  {jobThumb ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-500/40 bg-slate-950 shrink-0 flex items-center justify-center">
                      <img
                        src={jobThumb}
                        alt={job.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {job.mediaType === 'image' ? (
                        <ImageIcon className="w-5 h-5" />
                      ) : job.mediaType === 'video' ? (
                        <Video className="w-5 h-5" />
                      ) : job.mediaType === 'file' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <Globe className="w-5 h-5" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-white group-hover:text-purple-300 transition-colors">{job.title}</h4>
                      {job.isHot && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/40">
                          <Flame className="w-2.5 h-2.5 fill-rose-500" />
                          HOT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-black text-emerald-400">+{formatMoney(rewardUsd, user.currency, language)}</span>
                      <span>•</span>
                      <span>⏱ {toLocalizedDigits(duration, language)}s</span>
                      {job.subCategory && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-purple-300 font-medium">{job.subCategory}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  id={`start-visit-job-${job.id}`}
                  disabled={isCompleted || activeTask !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (job.destinationUrl || job.timerSeconds) {
                      startTaskExecution(job);
                    } else {
                      startTaskExecution({
                        ...job,
                        timerSeconds: duration,
                        rewardUsd: rewardUsd,
                        destinationUrl: 'https://www.profitablecpmrate.com/direct-link-visit',
                        category: 'visit',
                      });
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                    isCompleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      সম্পন্ন
                    </>
                  ) : (
                    <>
                      ভিজিট করুন
                      <Play className="w-3 h-3 fill-white" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* METHOD 3: Telegram task */}
      {subTab === 'telegram' && (
        <div className="space-y-2.5">
          <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-2xl text-xs text-sky-200">
            📢 <span className="font-bold text-white">টেলিগ্রাম টাস্ক:</span> যে কোনো টাস্কে ক্লিক করে কাজের বিস্তারিত জেনে নিন। চ্যানেলে জয়েন করুন এবং আপনার রিওয়ার্ড সাথে সাথে ক্লেইম করুন।
          </div>

          {(currentCategoryTasks.length > 0 ? currentCategoryTasks : (TELEGRAM_TASKS as any[])).map((tgTask: any) => {
            const isCompleted = user.completedTaskIds?.includes(tgTask.id);
            const rewardUsd = tgTask.rewardUsd || (tgTask.rewardBdt ? tgTask.rewardBdt / 120 : 0.03);
            const rewardBdt = tgTask.rewardBdt || +(rewardUsd * 120).toFixed(2);
            const tgThumb = tgTask.mediaUrl || tgTask.thumbnailUrl || tgTask.thumbnail;

            return (
              <div
                key={tgTask.id}
                onClick={() => setSelectedDetailTask({
                  id: tgTask.id,
                  title: tgTask.title,
                  category: 'telegram',
                  subCategory: 'টেলিগ্রাম চ্যানেল ও গ্রুপ',
                  rewardUsd,
                  rewardBdt,
                  timerSeconds: 5,
                  thumbnailUrl: tgThumb,
                  mediaUrl: tgThumb,
                  instructions: tgTask.instructions || 'টেলিগ্রাম চ্যানেলে জয়েন করুন, চ্যানেলটি মিউট করবেন না এবং কমপক্ষে ৭ দিন চ্যানেলের সদস্য থাকুন। জয়েন করার পর ক্লেইম বাটনে চাপ দিলে ব্যালেন্স যোগ হবে।',
                  description: 'অফিসিয়াল টেলিগ্রাম পার্টনার কমিউনিটি। এখানে বিভিন্ন আর্নিং আপডেট, পেমেন্ট প্রুফ ও নিয়মিত গিভঅ্যাওয়ে শেয়ার করা হয়।',
                  destinationUrl: tgTask.channelUrl || tgTask.destinationUrl || 'https://t.me/',
                  rawItem: tgTask,
                })}
                className="p-3.5 bg-slate-900 border border-sky-500/20 rounded-2xl shadow-sm flex items-center justify-between hover:border-sky-400/50 hover:bg-slate-800/80 transition-all text-white cursor-pointer group"
                title="ক্লিক করে কাজের বিস্তারিত বিবরণ দেখুন"
              >
                <div className="flex items-center gap-3">
                  {tgThumb ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-sky-500/40 bg-slate-950 shrink-0 flex items-center justify-center">
                      <img
                        src={tgThumb}
                        alt={tgTask.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Send className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold text-white group-hover:text-sky-300 transition-colors">{tgTask.title}</h4>
                    <p className="text-[10px] text-slate-400">{tgTask.instructions || 'চ্যানেলে জয়েন করে রিওয়ার্ড ক্লেইম করুন'}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="font-black text-emerald-400">+{formatMoney(rewardUsd, user.currency, language)}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`complete-tg-task-${tgTask.id}`}
                  disabled={isCompleted || isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTelegramTaskClick(tgTask);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                    isCompleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sm active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      জয়েনড
                    </>
                  ) : (
                    <>
                      জয়েন ও ক্লেইম
                      <ExternalLink className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* METHOD 4: Mission task */}
      {subTab === 'mission' && (
        <div className="space-y-2.5">
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-2xl text-xs text-emerald-200">
            🎯 <span className="font-bold text-white">দৈনিক মিশন:</span> মিশনে ক্লিক করে বিস্তারিত লক্ষ্য ও বোনাস দেখে নিন। প্রতিদিনের মিশন পূরণ করে অতিরিক্ত বোনাস অর্থ সংগ্রহ করুন।
          </div>

          {(currentCategoryTasks.length > 0 ? currentCategoryTasks : (MISSION_TASKS as any[])).map((mission: any) => {
            const isCompleted = user.completedTaskIds?.includes(mission.id);
            const rewardUsd = mission.rewardUsd || (mission.rewardBdt ? mission.rewardBdt / 120 : 0.05);
            const rewardBdt = mission.rewardBdt || +(rewardUsd * 120).toFixed(2);
            const missionThumb = mission.mediaUrl || mission.thumbnailUrl || mission.thumbnail;

            return (
              <div
                key={mission.id}
                onClick={() => setSelectedDetailTask({
                  id: mission.id,
                  title: mission.title,
                  category: 'mission',
                  subCategory: 'দৈনিক চ্যালেঞ্জ ও লক্ষ্য',
                  rewardUsd,
                  rewardBdt,
                  target: mission.target || 10,
                  thumbnailUrl: missionThumb,
                  mediaUrl: missionThumb,
                  instructions: 'আজকের দিনের নির্ধারিত লক্ষ্য পূরণ করুন (যেমন ১০টি বিজ্ঞাপন দেখা বা বন্ধুদের ইনভাইট করা)। লক্ষ্য অর্জনের সাথে সাথে বোনাস বাটনে চাপ দিয়ে এক্সট্রা রিওয়ার্ড বুঝে নিন।',
                  description: 'দৈনিক অ্যাক্টিভিটি বোনাস প্রোগ্রাম। নিয়মিত সক্রিয় ইউজারদের জন্য প্রতিদিন অতিরিক্ত ইনকামের বিশেষ সুযোগ।',
                  rawItem: mission,
                })}
                className="p-3.5 bg-slate-900 border border-emerald-500/20 rounded-2xl shadow-sm flex items-center justify-between hover:border-emerald-400/50 hover:bg-slate-800/80 transition-all text-white cursor-pointer group"
                title="ক্লিক করে কাজের বিস্তারিত বিবরণ দেখুন"
              >
                <div className="flex items-center gap-3">
                  {missionThumb ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 shrink-0 flex items-center justify-center">
                      <img
                        src={missionThumb}
                        alt={mission.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Target className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">{mission.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                      <span className="font-black text-amber-300">+{formatMoney(rewardUsd, user.currency, language)}</span>
                      {mission.target && (
                        <span className="text-slate-400">• লক্ষ্য: {toLocalizedDigits(mission.target, language)}টি</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  id={`claim-mission-${mission.id}`}
                  disabled={isCompleted}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMissionClaim(mission);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                    isCompleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-sm active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ক্লেইমড
                    </>
                  ) : (
                    <>
                      বোনাস নিন
                      <Award className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* METHOD 5: Referral */}
      {subTab === 'referral' && (
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-3xl border border-purple-500/40 text-white text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black">রেফারেল প্রোগ্রাম ও স্পেশাল মিশন</h3>
            <p className="text-xs text-purple-200">
              প্রতিটি সক্রিয় রেফারে পাবেন ১০ টাকা বোনাস এবং তাদের লাইফটাইম আয়ের ৫% আজীবন কমিশন!
            </p>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('refer')}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-98 cursor-pointer"
            >
              রেফার মেনুতে যান ও বন্ধুদের আমন্ত্রণ জানান
            </button>
          </div>

          {/* Dynamic Referral tasks if any configured by Admin */}
          {currentCategoryTasks.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 px-1">রেফারেল টাস্ক ও বোনাস</h4>
              {currentCategoryTasks.map((refTask) => {
                const isCompleted = user.completedTaskIds?.includes(refTask.id);
                const rewardUsd = refTask.rewardUsd || 0.1;
                const rewardBdt = refTask.rewardBdt || +(rewardUsd * 120).toFixed(2);
                const refThumb = refTask.mediaUrl || refTask.thumbnailUrl || refTask.thumbnail;
                return (
                  <div
                    key={refTask.id}
                    onClick={() => setSelectedDetailTask({
                      id: refTask.id,
                      title: refTask.title,
                      category: 'referral',
                      subCategory: 'রেফারেল ও আমন্ত্রণ মিশন',
                      rewardUsd,
                      rewardBdt,
                      thumbnailUrl: refThumb,
                      mediaUrl: refThumb,
                      instructions: 'আপনার ইউনিক রেফারেল লিংকটি বন্ধুদের সাথে মেসেঞ্জার, হোয়াটসঅ্যাপ বা ফেসবুকে শেয়ার করুন। বন্ধু লিংকে ক্লিক করে অ্যাপ ব্যবহার শুরু করলে বোনাস পাবেন।',
                      description: 'রেফারেল ক্যাম্পেইন। আপনার রেফার লিংকের মাধ্যমে বন্ধুদের অ্যাপে নিয়ে আসুন এবং নির্ধারিত বোনাস সরাসরি উইথড্র ব্যালেন্সে গ্রহণ করুন।',
                      rawItem: refTask,
                    })}
                    className="p-3.5 bg-slate-900 border border-pink-500/20 rounded-2xl shadow-sm flex items-center justify-between text-white cursor-pointer hover:border-pink-400/50 hover:bg-slate-800/80 transition-all group"
                    title="ক্লিক করে কাজের বিস্তারিত বিবরণ দেখুন"
                  >
                    <div className="flex items-center gap-3">
                      {refThumb ? (
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-pink-500/40 bg-slate-950 shrink-0 flex items-center justify-center">
                          <img
                            src={refThumb}
                            alt={refTask.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Users className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h5 className="text-xs font-extrabold text-white group-hover:text-pink-300 transition-colors">{refTask.title}</h5>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          <span className="font-black text-emerald-400">
                            +{formatMoney(refTask.rewardUsd, user.currency, language)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      disabled={isCompleted}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange && onTabChange('refer');
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm active:scale-95 cursor-pointer"
                    >
                      {isCompleted ? 'সম্পন্ন' : 'ইনভাইট করুন'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal - Shows complete instructions before doing work */}
      {selectedDetailTask && (
        <div
          id="task-detail-modal-backdrop"
          onClick={() => setSelectedDetailTask(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                  selectedDetailTask.category === 'ads'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : selectedDetailTask.category === 'visit'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : selectedDetailTask.category === 'telegram'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : selectedDetailTask.category === 'mission'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                }`}>
                  {selectedDetailTask.category === 'ads' ? (
                    <Play className="w-5 h-5 fill-current" />
                  ) : selectedDetailTask.category === 'visit' ? (
                    <Globe className="w-5 h-5" />
                  ) : selectedDetailTask.category === 'telegram' ? (
                    <Send className="w-5 h-5" />
                  ) : selectedDetailTask.category === 'mission' ? (
                    <Target className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-purple-300">
                    {selectedDetailTask.subCategory || selectedDetailTask.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-white mt-1 leading-snug">
                    {selectedDetailTask.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTask(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Banner */}
            {(selectedDetailTask.thumbnailUrl || selectedDetailTask.mediaUrl) && (
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 relative shadow-md">
                <img
                  src={selectedDetailTask.thumbnailUrl || selectedDetailTask.mediaUrl}
                  alt={selectedDetailTask.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Quick Reward & Timer Stats Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/80 border border-emerald-500/30 p-3 rounded-2xl flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                  ৳
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">নিশ্চিত রিওয়ার্ড:</span>
                  <span className="text-xs font-black text-emerald-400">
                    +{formatMoney(selectedDetailTask.rewardUsd, user.currency, language)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">কাজের সময়:</span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    {toLocalizedDigits(selectedDetailTask.timerSeconds || 15, language)} সেকেন্ড
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <span className="text-purple-300 font-bold flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                কাজের বিস্তারিত বিবরণ:
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedDetailTask.description || 'এই কাজটি সম্পন্ন করলে নির্ধারিত রিওয়ার্ড সরাসরি আপনার অ্যাকাউন্টে জমা হবে। সঠিক নিয়ম মেনে কাজ সম্পূর্ণ করুন।'}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                কীভাবে কাজটি সম্পন্ন করবেন (ধাপসমূহ):
              </span>
              <div className="space-y-1.5 text-[11px] text-slate-300 leading-normal">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <span>নিচের <strong>"কাজ শুরু করুন"</strong> বাটনে ক্লিক করে ডেস্টিনেশন পেজ বা অ্যাড ওপেন করুন।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <span>স্ক্রিনের টাইমার <strong>({toLocalizedDigits(selectedDetailTask.timerSeconds || 15, language)} সেকেন্ড)</strong> শেষ না হওয়া পর্যন্ত পেজ ক্লোজ বা ব্যাক করবেন না।</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <span>সময় শেষ হলে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট ব্যালেন্সে রিওয়ার্ড জমা হবে এবং কনফেটি অ্যানিমেশন দেখতে পাবেন।</span>
                </div>
              </div>
            </div>

            {/* Rules and Anti-Cheat Warning */}
            <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-2xl text-[11px] text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>জরুরি নিয়ম:</strong> বিজ্ঞাপন চলাকালীন অন্য পেজে চলে গেলে বা সময় পূর্ণ হওয়ার আগে ব্যাক করলে পেমেন্ট বাতিল হতে পারে। সম্পূর্ণ সময় অপেক্ষা করুন।
              </span>
            </div>

            {/* Action Execution Button */}
            {(() => {
              const isCompleted = user.completedTaskIds?.includes(selectedDetailTask.id);
              return (
                <button
                  type="button"
                  disabled={isCompleted || activeTask !== null || isProcessing}
                  onClick={() => {
                    triggerAdsterraPopunder();
                    const taskToRun = selectedDetailTask;
                    setSelectedDetailTask(null);
                    if (taskToRun.category === 'ads' || taskToRun.category === 'visit') {
                      if (taskToRun.rawItem) {
                        startTaskExecution(taskToRun.rawItem);
                      } else {
                        startTaskExecution({
                          id: taskToRun.id,
                          title: taskToRun.title,
                          category: taskToRun.category,
                          subCategory: taskToRun.subCategory,
                          destinationUrl: taskToRun.destinationUrl || 'https://researchingsweatexit.com/fx4s1179?key=795515765851a303657a3188bb3b9a45',
                          mediaType: 'video',
                          rewardUsd: taskToRun.rewardUsd,
                          rewardBdt: taskToRun.rewardBdt || +(taskToRun.rewardUsd * 120).toFixed(2),
                          timerSeconds: taskToRun.timerSeconds || 30,
                          instructions: taskToRun.instructions || '',
                          isHot: false,
                          isActive: true,
                          totalCompletions: 0,
                          createdAt: new Date().toISOString(),
                        });
                      }
                    } else if (taskToRun.category === 'telegram') {
                      handleTelegramTaskClick(taskToRun.rawItem || taskToRun);
                    } else if (taskToRun.category === 'mission') {
                      handleMissionClaim(taskToRun.rawItem || taskToRun);
                    } else if (taskToRun.category === 'referral') {
                      onTabChange && onTabChange('refer');
                    }
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
                    isCompleted
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>আজকের জন্য এই কাজটি সম্পন্ন হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>কাজের নিয়ম পড়েছি, এখনই কাজ শুরু করুন</span>
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Full-Time Enforced Ad Watching Modal for Tasks */}
      {runningAdModalTask && (
        <AdWatchingModal
          isOpen={Boolean(runningAdModalTask)}
          onClose={() => setRunningAdModalTask(null)}
          title={runningAdModalTask.title || '🎬 স্পন্সরড বিজ্ঞাপন ভেরিফিকেশন'}
          duration={runningAdModalTask.timerSeconds || 30}
          rewardBdt={runningAdModalTask.rewardBdt || +(runningAdModalTask.rewardUsd * 120).toFixed(2)}
          rewardUsd={runningAdModalTask.rewardUsd}
          taskId={runningAdModalTask.id}
          directAdUrl={runningAdModalTask.destinationUrl || 'https://researchingsweatexit.com/fx4s1179?key=795515765851a303657a3188bb3b9a45'}
          onClaimReward={(sessionId, token) => {
            onCompleteTask(runningAdModalTask.id, runningAdModalTask.rewardUsd, runningAdModalTask.category, sessionId, token);
            setRunningAdModalTask(null);
          }}
        />
      )}

    </div>
  );
};

export default EarnTab;
