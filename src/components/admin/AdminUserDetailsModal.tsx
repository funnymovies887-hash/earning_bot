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
} from 'lucide-react';
import { UserProfile, IncomeTask } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'tasks' | 'withdrawals' | 'referrals' | 'orders'>('tasks');
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
                onClick={() => {
                  onClose();
                  onEditUser(user);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
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
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>সম্পন্ন কাজের রিপোর্ট ({completedTasksDetails.length})</span>
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
