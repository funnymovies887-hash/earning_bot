import React, { useState } from 'react';
import {
  X,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Eye,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ListChecks,
  Activity,
  Edit3,
  Layers,
  ArrowUpRight,
  Send,
  MessageSquare,
  AlertTriangle,
  CalendarDays,
  Sparkles,
  MousePointer,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, IncomeTask, DailyWorkRecord, UserPersonalMessage } from '../../types';

interface AdminUserDetailsModalProps {
  user: UserProfile;
  allTasks: IncomeTask[];
  allWithdrawals: any[];
  allOrders?: any[];
  onClose: () => void;
  onEditUser: (user: UserProfile) => void;
}

export const AdminUserDetailsModal: React.FC<AdminUserDetailsModalProps> = ({
  user,
  allTasks = [],
  allWithdrawals = [],
  allOrders = [],
  onClose,
  onEditUser,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'weeklyWork' | 'sendMessage' | 'withdrawals' | 'referrals' | 'orders'>('tasks');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Direct Warning / Message State
  const [msgType, setMsgType] = useState<'warning' | 'notice' | 'message' | 'bonus'>('warning');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendTg, setSendTg] = useState(true);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [personalNotifs, setPersonalNotifs] = useState<UserPersonalMessage[]>(user.personalNotifications || []);

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) {
      setMsgFeedback({ type: 'error', text: 'অনুগ্রহ করে মেসেজ বা সতর্কবার্তা লিখুন।' });
      return;
    }

    setIsSendingMsg(true);
    setMsgFeedback(null);
    try {
      const res = await fetch('/api/admin/users/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: msgType,
          title: msgTitle.trim(),
          message: msgBody.trim(),
          sendToTelegram: sendTg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsgFeedback({
          type: 'success',
          text: data.message || 'মেসেজটি ইউজারের কাছে সফলভাবে পৌঁছে দেওয়া হয়েছে!',
        });
        if (data.notification) {
          setPersonalNotifs((prev) => [data.notification, ...prev]);
        }
        setMsgBody('');
        setMsgTitle('');
      } else {
        setMsgFeedback({
          type: 'error',
          text: data.error || 'মেসেজ পাঠানো ব্যর্থ হয়েছে।',
        });
      }
    } catch (err: any) {
      setMsgFeedback({ type: 'error', text: err.message || 'সার্ভার সংযোগ ত্রুটি' });
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Generate or read rolling 7-day work history
  const get7DayHistory = (): DailyWorkRecord[] => {
    if (user.weeklyWorkHistory && Array.isArray(user.weeklyWorkHistory) && user.weeklyWorkHistory.length > 0) {
      return user.weeklyWorkHistory;
    }
    const days: DailyWorkRecord[] = [];
    const banglaDayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const now = new Date(Date.now() + 6 * 3600 * 1000);
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const bDay = banglaDayNames[d.getDay()];
      const dayLabel = i === 0 ? `আজকে (${bDay})` : i === 1 ? `গতকাল (${bDay})` : `${bDay} (${dateStr.slice(5)})`;
      days.push({
        date: dateStr,
        dayLabel,
        adsWatched: i === 0 ? (user.adsWatchedToday || 0) : 0,
        tasksCompleted: i === 0 ? (user.completedTaskIds?.length || 0) : 0,
        adClicks: 0,
        earnedUsd: i === 0 ? (Number(user.balanceUsd) || 0) : 0,
        earnedBdt: i === 0 ? Math.round((Number(user.balanceUsd) || 0) * 120) : 0,
        referrals: i === 0 ? (user.todayReferrals || 0) : 0,
      });
    }
    return days;
  };
  const weeklyHistory = get7DayHistory();

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Conversions
  const balanceBdt = (Number(user.balanceUsd || 0) * 120).toFixed(2);
  const balanceUsd = Number(user.balanceUsd || 0).toFixed(4);
  const totalCommissionBdt = ((user.totalCommissionEarnedUsd || 0) * 120).toFixed(2);
  const claimableCommissionBdt = ((user.claimableCommissionUsd || 0) * 120).toFixed(2);

  // Match completed tasks
  const completedTaskIds = user.completedTaskIds || [];
  const completedTasksDetails = completedTaskIds.map((taskId) => {
    const matched = allTasks.find((t) => t.id === taskId);
    if (matched) return matched;
    // Fallback for system default or ad task IDs
    if (taskId.startsWith('ad-')) {
      return {
        id: taskId,
        title: `বিজ্ঞাপন দেখা #${taskId.replace('ad-', '')}`,
        category: 'ads' as const,
        subCategory: 'Direct Link Ad',
        rewardBdt: 0.15,
        rewardUsd: 0.00125,
        isActive: true,
        mediaType: 'none' as const,
      };
    }
    return {
      id: taskId,
      title: `টাস্ক আইডি: ${taskId}`,
      category: 'visit' as const,
      subCategory: 'Completed Task',
      rewardBdt: 1.0,
      rewardUsd: 0.00833,
      isActive: true,
      mediaType: 'none' as const,
    };
  });

  // Filter withdrawals for this specific user
  const userWithdrawals = allWithdrawals.filter((w) => {
    if (!w) return false;
    const matchId = w.userId && String(w.userId).trim() === String(user.id).trim();
    const matchName = w.userName && user.displayName && w.userName.trim().toLowerCase() === user.displayName.trim().toLowerCase();
    const matchUsername = w.userName && user.username && w.userName.trim().toLowerCase() === user.username.replace('@', '').trim().toLowerCase();
    return matchId || matchName || matchUsername;
  });

  // Filter orders for this specific user
  const userOrders = allOrders.filter((o) => {
    if (!o) return false;
    const matchId = o.userId && String(o.userId).trim() === String(user.id).trim();
    const matchName = o.userName && user.displayName && o.userName.trim().toLowerCase() === user.displayName.trim().toLowerCase();
    return matchId || matchName;
  });

  const adLimit = user.dailyAdLimit || 40;
  const adsWatched = user.adsWatchedToday || 0;
  const adProgressPercent = Math.min(100, Math.round((adsWatched / adLimit) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Profile Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-5 sm:p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-10">
            <div className="relative shrink-0">
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400/60 shadow-lg shadow-amber-500/10"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900" title="সক্রিয় ইউজার" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">{user.displayName || 'Unnamed Member'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  {user.role || 'Free Member'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {user.currency || 'BDT'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
                <span className="text-slate-300 font-medium">@{user.username || 'user'}</span>
                <span>•</span>
                <button
                  onClick={() => copyToClipboard(user.id, 'userId')}
                  className="flex items-center gap-1 text-slate-400 hover:text-amber-300 font-mono transition-colors"
                  title="কপি করতে ক্লিক করুন"
                >
                  <span>ID: {user.id}</span>
                  {copiedField === 'userId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>যোগদান: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('bn-BD') : 'নতুন ইউজার'}</span>
                </span>
              </div>
            </div>

            <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={() => setActiveTab('sendMessage')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>ওয়ার্নিং / নোটিশ পাঠান</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEditUser(user);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ব্যালেন্স এডিট করুন</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Prominent Stat Cards (Both BDT & USD) */}
        <div className="p-4 sm:p-6 bg-slate-900/60 border-b border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
          {/* Card 1: Balance */}
          <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-amber-400/80 font-medium mb-1">
              <span>বর্তমান ব্যালেন্স</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              ৳ {balanceBdt} <span className="text-xs font-semibold text-amber-400/70">BDT</span>
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-0.5">
              ${balanceUsd} USD
            </div>
          </div>

          {/* Card 2: Today's Ads */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>আজকের অ্যাড দেখা</span>
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-white">
              {adsWatched} <span className="text-xs font-normal text-slate-400">/ {adLimit} টি</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${adProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Card 3: Completed Tasks */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>মোট সম্পন্ন টাস্ক</span>
              <ListChecks className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              {completedTaskIds.length} <span className="text-xs font-normal text-slate-400">টি টাস্ক</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {completedTaskIds.length > 0 ? 'নিয়মিত কাজ সম্পন্নকারী' : 'এখনও কোনো টাস্ক করেনি'}
            </div>
          </div>

          {/* Card 4: Referrals */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>রেফারেল ও টিম</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-400">
              {user.joinedCount || 0} <span className="text-xs font-normal text-slate-400">জন</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-1">
              সক্রিয়: {user.activeReferralsWithActivity || 0} জন • আজ: {user.todayReferrals || 0} জন
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 px-4 sm:px-6 bg-slate-950/40 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('weeklyWork')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'weeklyWork'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>📅 ৭ দিনের কাজের রিপোর্ট (Rolling 7 Days)</span>
          </button>

          <button
            onClick={() => setActiveTab('sendMessage')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sendMessage'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>📩 নোটিশ / ওয়ার্নিং পাঠান ({personalNotifs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>সকল সম্পন্ন কাজ ({completedTasksDetails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'withdrawals'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>উইথড্র হিস্ট্রি ({userWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'referrals'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>রেফারেল ও কমিশন ({user.referralCommissionHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ডিজিটাল স্টোর অর্ডার ({userOrders.length})</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB: ROLLING 7-DAY WORK HISTORY */}
          {activeTab === 'weeklyWork' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-400" />
                    <span>ব্যবহারকারীর বিগত ৭ দিনের কাজের পুঙ্খানুপুঙ্খ বিবরণ</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    রোলিং ৭ দিন: দিন পার হওয়ার সাথে সাথে পেছনের ডাটা ক্রমান্বয়ে সরে নতুন দিনের ডাটা স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                  সর্বশেষ ৭ দিনের লাইভ রিপোর্ট
                </span>
              </div>

              {/* 7-Day Quick Total Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-950/80 border border-purple-500/20 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">৭ দিনের মোট অ্যাড দেখা</span>
                  <div className="text-base font-black text-purple-300 mt-0.5">
                    {weeklyHistory.reduce((acc, d) => acc + (d.adsWatched || 0), 0)} টি
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-emerald-500/20 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">৭ দিনের সম্পন্ন টাস্ক</span>
                  <div className="text-base font-black text-emerald-300 mt-0.5">
                    {weeklyHistory.reduce((acc, d) => acc + (d.tasksCompleted || 0), 0)} টি
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-blue-500/20 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">৭ দিনের অ্যাড ক্লিক (CTR)</span>
                  <div className="text-base font-black text-blue-300 mt-0.5">
                    {weeklyHistory.reduce((acc, d) => acc + (d.adClicks || 0), 0)} টি
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-amber-500/20 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">৭ দিনের মোট আয়</span>
                  <div className="text-base font-black text-amber-300 mt-0.5">
                    ৳ {weeklyHistory.reduce((acc, d) => acc + (d.earnedBdt || 0), 0)} <span className="text-[10px] text-amber-400 font-mono">(${weeklyHistory.reduce((acc, d) => acc + (d.earnedUsd || 0), 0).toFixed(3)})</span>
                  </div>
                </div>
              </div>

              {/* Day-by-Day Detailed Breakdown (Last 7 Days) */}
              <div className="space-y-2.5">
                {weeklyHistory.map((day, idx) => {
                  const hasActivity = (day.adsWatched || 0) > 0 || (day.tasksCompleted || 0) > 0 || (day.earnedBdt || 0) > 0 || (day.adClicks || 0) > 0;
                  return (
                    <div
                      key={day.date + '-' + idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        idx === 0
                          ? 'bg-slate-950/90 border-emerald-500/40 shadow-md'
                          : hasActivity
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              idx === 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : idx === 1
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            দিন {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-white">{day.dayLabel}</h4>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {day.date}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  আজকের দিন
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  hasActivity
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {hasActivity ? '✅ সক্রিয় কাজ সম্পন্ন' : '💤 কোনো কাজ করেনি'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Day Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="bg-slate-900/60 p-1.5 sm:p-2 rounded-lg border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 block">👁️ অ্যাড দেখা</span>
                            <span className="text-xs font-black text-purple-300">{day.adsWatched || 0} টি</span>
                          </div>

                          <div className="bg-slate-900/60 p-1.5 sm:p-2 rounded-lg border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 block">📋 টাস্ক</span>
                            <span className="text-xs font-black text-emerald-300">{day.tasksCompleted || 0} টি</span>
                          </div>

                          <div className="bg-slate-900/60 p-1.5 sm:p-2 rounded-lg border border-slate-800/80">
                            <span className="text-[9px] text-slate-400 block">👆 অ্যাড ক্লিক</span>
                            <span className="text-xs font-black text-blue-300">{day.adClicks || 0} টি</span>
                          </div>

                          <div className="bg-slate-900/60 p-1.5 sm:p-2 rounded-lg border border-amber-500/20">
                            <span className="text-[9px] text-amber-400 block">💰 দৈনিক আয়</span>
                            <span className="text-xs font-black text-amber-300">৳ {day.earnedBdt || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  💡 <b>অটো-আপডেট:</b> রাত ১২টার পর দিন পরিবর্তন হলে স্বয়ংক্রিয়ভাবে বিগত ৭ দিনের আপডেট হিস্ট্রি এখানে সংরক্ষিত হবে এবং সবচেয়ে পুরনো দিনের ডাটা রোলিং নিয়ম অনুযায়ী সরে যাবে।
                </span>
              </div>
            </div>
          )}

          {/* TAB: SEND INDIVIDUAL MESSAGE / WARNING */}
          {activeTab === 'sendMessage' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <span>ব্যবহারকারীকে সরাসরি সতর্কবার্তা / নোটিশ / মেসেজ পাঠান</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ইউজারের কোনো কাজের ভুল হলে অথবা নির্দিষ্ট কোনো নোটিশ বা সতর্কবার্তা দিতে চাইলে এখান থেকে পাঠাতে পারেন।
                </p>
              </div>

              {msgFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    msgFeedback.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {msgFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{msgFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSendDirectMessage} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    বার্তার ধরণ নির্বাচন করুন (Message / Notice Type):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'warning' as const, label: '⚠️ সতর্কবার্তা (Warning)', color: 'border-rose-500 bg-rose-950/40 text-rose-200' },
                      { type: 'notice' as const, label: '📢 জরুরি নোটিশ (Notice)', color: 'border-amber-500 bg-amber-950/40 text-amber-200' },
                      { type: 'message' as const, label: '💬 সাধারণ বার্তা (Direct)', color: 'border-blue-500 bg-blue-950/40 text-blue-200' },
                      { type: 'bonus' as const, label: '🎁 বোনাস / ইনসেনটিভ', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-200' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setMsgType(item.type);
                          if (!msgTitle) {
                            if (item.type === 'warning') setMsgTitle('⚠️ কাজের ভুল সংক্রান্ত সতর্কবার্তা');
                            if (item.type === 'notice') setMsgTitle('📢 অ্যাডমিন জরুরি নোটিশ');
                            if (item.type === 'message') setMsgTitle('💬 আপনার অ্যাকাউন্ট সম্পর্কে বার্তা');
                            if (item.type === 'bonus') setMsgTitle('🎁 অভিনন্দন! বিশেষ বোনাস রিওয়ার্ড');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                          msgType === item.type
                            ? `${item.color} shadow-md ring-1 ring-white/20`
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick One-Click Template Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>এক-ক্লিকে টেমপ্লেট বসান:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        title: '⚠️ কাজে ভুল: টাইমার শেষ না করে ব্যাক করেছেন',
                        body: 'প্রিয় সদস্য, আপনার কাজের পর্যালোচনায় দেখা গেছে আপনি বিজ্ঞাপনের পুরো সময় অপেক্ষা না করেই ব্যাক করেছেন। অনুগ্রহ করে সম্পূর্ণ নির্ধারিত সময় অপেক্ষা করুন, অন্যথায় ব্যালেন্স কাটা হতে পারে।',
                        type: 'warning' as const,
                      },
                      {
                        title: '⚠️ নোটিশ: বিজ্ঞাপনে ক্লিক ভেরিফিকেশন সম্পন্ন করুন',
                        body: 'বিজ্ঞাপন দেখার সময় লিংকে অবশ্যই একবার ক্লিক করে ভিজিট নিশ্চিত করতে হবে। ক্লিক ছাড়া রিওয়ার্ড গ্রহণ করা যাবে না। নিয়ম মেনে কাজ করুন।',
                        type: 'warning' as const,
                      },
                      {
                        title: '⚠️ জরুরি ওয়ার্নিং: ভিপিএন বা অবৈধ ক্লিক শনাক্ত',
                        body: 'আপনার অ্যাকাউন্টে অস্বাভাবিক ক্লিক বা ভিপিএন সংযোগ শনাক্ত হয়েছে। অবিলম্বে ভিপিএন ছাড়া স্বাভাবিক ইন্টারনেট ব্যবহার করে কাজ করুন, অন্যথায় অ্যাকাউন্ট ব্যান হবে।',
                        type: 'warning' as const,
                      },
                      {
                        title: '📢 নোটিশ: আপনার উইথড্র পেমেন্ট সফলভাবে পাঠানো হয়েছে',
                        body: 'অভিনন্দন! আপনার সর্বশেষ উইথড্র রিকোয়েস্ট সফলভাবে প্রসেস করা হয়েছে। নিয়মিত কাজ করুন এবং বন্ধুদের রেফার করে আনলিমিটেড ইনকাম করুন।',
                        type: 'notice' as const,
                      },
                      {
                        title: '🎁 বোনাস: দারুণ কাজের জন্য বিশেষ বোনাস রিওয়ার্ড',
                        body: 'আপনার দুর্দান্ত কাজের পারফরম্যান্সের জন্য আপনাকে ধন্যবাদ! নিয়ম মেনে কাজ চালিয়ে যান।',
                        type: 'bonus' as const,
                      },
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setMsgType(tpl.type);
                          setMsgTitle(tpl.title);
                          setMsgBody(tpl.body);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-semibold text-slate-300 hover:text-white transition-all text-left truncate max-w-[280px]"
                        title={tpl.title}
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    বার্তার বিষয় / টাইটেল (Title):
                  </label>
                  <input
                    type="text"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="যেমন: ⚠️ কাজের ভুল সংক্রান্ত সতর্কবার্তা"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-bold"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    বার্তা বা সতর্কবার্তার বিবরণ (Message Body) *:
                  </label>
                  <textarea
                    rows={4}
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="ব্যবহারকারীকে কী জানাতে চান বিস্তারিত লিখুন..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed font-sans resize-y"
                    required
                  />
                </div>

                {/* Delivery Target Options */}
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendToTelegramCheck"
                      checked={sendTg}
                      onChange={(e) => setSendTg(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="sendToTelegramCheck" className="text-xs font-bold text-slate-200 cursor-pointer">
                      🤖 @CholoIncomeKoriBot দিয়ে সরাসরি ইউজারের টেলিগ্রামে ইনবক্স মেসেজ পাঠান
                    </label>
                  </div>
                  <span className="text-[10px] text-amber-400 font-medium">ইন-অ্যাপ নোটিশ সবসময় থাকবে</span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSendingMsg}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSendingMsg ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>মেসেজ পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>📩 ইউজারকে সরাসরি বার্তা / সতর্কবার্তা পাঠান (Send Message)</span>
                    </>
                  )}
                </button>
              </form>

              {/* History of Sent Messages */}
              {personalNotifs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 px-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>এই ব্যবহারকারীকে পূর্বে পাঠানো বার্তার ইতিহাস ({personalNotifs.length}টি)</span>
                  </h4>

                  <div className="space-y-2">
                    {personalNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs ${
                          n.type === 'warning'
                            ? 'bg-rose-950/30 border-rose-500/30'
                            : n.type === 'bonus'
                            ? 'bg-emerald-950/30 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            {n.type === 'warning' ? '⚠️' : n.type === 'bonus' ? '🎁' : '📢'} {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString('bn-BD') : 'Recent'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line">{n.message}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1">
                          <span>প্রেরক: {n.sentBy || 'Admin'}</span>
                          <span className={n.isRead ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                            {n.isRead ? '✅ ইউজার পড়েছে' : '⏳ এখনও পড়েনি'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: COMPLETED TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>এই ব্যবহারকারীর করা সকল কাজের বিস্তারিত তালিকা</span>
                <span className="text-amber-400 font-semibold">মোট সম্পন্ন: {completedTasksDetails.length}টি টাস্ক</span>
              </div>

              {completedTasksDetails.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
                  <ListChecks className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">এখনও কোনো টাস্ক সম্পন্ন করেননি</p>
                  <p className="text-xs text-slate-500 mt-1">ইউজার মিনি অ্যাপে টাস্ক সম্পন্ন করলে তার পূর্ণ বিবরণ এখানে শো করবে।</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {completedTasksDetails.map((task, idx) => (
                    <div
                      key={task.id + '-' + idx}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded uppercase tracking-wider">
                              {task.category || 'General'}
                            </span>
                            {task.subCategory && (
                              <span className="text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                                {task.subCategory}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>সম্পন্ন</span>
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1 line-clamp-2">{task.title}</h4>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            টাস্ক আইডি: {task.id}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 pl-11 sm:pl-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                        <div className="text-sm font-extrabold text-amber-300">
                          +৳ {((task.rewardBdt ?? (task.rewardUsd ? task.rewardUsd * 120 : 1.0))).toFixed(2)} BDT
                        </div>
                        <div className="text-xs font-mono text-emerald-400">
                          +${((task.rewardUsd ?? (task.rewardBdt ? task.rewardBdt / 120 : 0.00833))).toFixed(4)} USD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WITHDRAWAL HISTORY */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>এই ব্যবহারকারীর উইথড্র রিকোয়েস্ট ও স্ট্যাটাস</span>
                <span className="text-amber-400 font-semibold">মোট আবেদন: {userWithdrawals.length}টি</span>
              </div>

              {userWithdrawals.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
                  <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">কোনো উইথড্র রিকোয়েস্ট নেই</p>
                  <p className="text-xs text-slate-500 mt-1">ব্যবহারকারী এখনো কোনো টাকা উত্তোলনের আবেদন করেননি।</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userWithdrawals.map((w, idx) => (
                    <div
                      key={w.id || idx}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{w.method || 'bKash'}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              w.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : w.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {w.status || 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-slate-300">নম্বর: {w.accountNumber}</span>
                          <button
                            onClick={() => copyToClipboard(w.accountNumber, `acc_${idx}`)}
                            className="p-1 hover:text-amber-300 text-slate-500 rounded"
                            title="কপি করুন"
                          >
                            {copiedField === `acc_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          সময়: {w.createdAt || 'Recent'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-amber-300">
                          {w.currency === 'BDT' ? '৳' : '$'} {w.amount}
                        </div>
                        <div className="text-xs text-slate-400">
                          {w.currency === 'BDT' ? `$ ${(Number(w.amount) / 120).toFixed(2)} USD` : `৳ ${(Number(w.amount) * 120).toFixed(2)} BDT`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REFERRALS & COMMISSION */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {/* Referral Details Banner */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400">ইউজারের রেফারেল কোড</div>
                  <div className="text-base font-black text-white font-mono flex items-center gap-2 mt-0.5">
                    <span>{user.referralCode || 'N/A'}</span>
                    <button
                      onClick={() => copyToClipboard(user.referralCode, 'refCode')}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-sans"
                    >
                      {copiedField === 'refCode' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'refCode' ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">কমিশন রেট:</span>
                    <span className="text-emerald-400 font-bold">{user.referralCommissionRate || 5}% আজীবন</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">মোট কমিশন আয়:</span>
                    <span className="text-amber-300 font-bold">৳ {totalCommissionBdt} BDT</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ক্লেইমযোগ্য ব্যালেন্স:</span>
                    <span className="text-purple-300 font-bold">৳ {claimableCommissionBdt} BDT</span>
                  </div>
                </div>
              </div>

              {/* Commission History Log */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">বন্ধুদের কাজের কমিশন হিস্ট্রি</h4>
                {(!user.referralCommissionHistory || user.referralCommissionHistory.length === 0) ? (
                  <div className="py-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">এখনও কোনো কমিশন রেকর্ড যুক্ত হয়নি।</p>
                  </div>
                ) : (
                  user.referralCommissionHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{item.userFrom}</div>
                        <div className="text-slate-400 text-[11px]">{item.activity} • {item.time}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-400">+৳ {(Number(item.commissionUsd || 0) * 120).toFixed(2)} BDT</div>
                        <div className="text-[10px] text-emerald-400 font-mono">+${Number(item.commissionUsd || 0).toFixed(4)} USD</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STORE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>এই ব্যবহারকারীর কেনা ডিজিটাল স্টোর প্রোডাক্ট</span>
                <span className="text-amber-400 font-semibold">অর্ডার: {userOrders.length}টি</span>
              </div>

              {userOrders.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-300">কোনো ডিজিটাল প্রোডাক্ট অর্ডার করেননি</p>
                  <p className="text-xs text-slate-500 mt-1">স্টোর থেকে কোনো প্রোডাক্ট ক্রয় করলে TrxID সহ এখানে দেখা যাবে।</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userOrders.map((order, idx) => (
                    <div
                      key={order.id || idx}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{order.packageTitle || 'Digital Package'}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : order.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          পদ্ধতি: <span className="text-amber-400 font-semibold">{order.paymentMethod}</span> • TrxID:{' '}
                          <span className="font-mono text-slate-200">{order.transactionId}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          অর্ডার সময়: {order.orderDate || 'Recent'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-amber-300">
                          ৳ {order.priceBdt} BDT
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          ${(order.priceBdt / 120).toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            শেষ অ্যাক্টিভ: <span className="text-slate-200 font-medium">{user.lastActiveDate || 'আজ'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditUser(user);
              }}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ব্যালেন্স এডিট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
