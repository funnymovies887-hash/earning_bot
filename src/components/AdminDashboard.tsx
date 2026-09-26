import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Video,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Search,
  Eye,
  Send,
  Key,
  ShieldAlert,
  Check,
  HelpCircle,
  Sparkles,
  Copy,
  Lock,
  ShoppingBag,
  Database,
} from 'lucide-react';
import { UserProfile, VideoItem, WithdrawalRequest } from '../types';
import { AdminAdLockedVideosTab } from './admin/AdminAdLockedVideosTab';
import { AdminStoreOrdersTab } from './admin/AdminStoreOrdersTab';
import { AdminNoticeBroadcastManager } from './AdminNoticeBroadcastManager';
import { AdminUptimeRobotTab } from './admin/AdminUptimeRobotTab';
import { AdminDataBackupTab } from './admin/AdminDataBackupTab';
import { AdminIncomeMethodsManager } from './AdminIncomeMethodsManager';
import { AdminFloatingToast, AdminToastData } from './admin/AdminFloatingToast';
import { AdminSaveButton } from './admin/AdminSaveButton';
import { Activity } from 'lucide-react';
import { performAutoSync } from '../utils/adminAutoSync';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('admin_auth') === 'true' || sessionStorage.getItem('admin_auth') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeMenu, setActiveMenu] = useState<'overview' | 'withdrawals' | 'users' | 'videos' | 'broadcast' | 'telegram' | 'methods' | 'ad-locked-videos' | 'store-orders' | 'uptimerobot' | 'backup'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [autoSyncBanner, setAutoSyncBanner] = useState<string | null>(null);

  // 5 Income Methods and Withdrawal rules configuration state
  const [incomeMethods, setIncomeMethods] = useState({
    ads: { enabled: true, rewardBdt: 1.5, rewardUsd: 0.0125, dailyLimit: 40 },
    webVisit: { enabled: true, rewardBdt: 3.0, rewardUsd: 0.025 },
    telegram: { enabled: true, rewardBdt: 5.0, rewardUsd: 0.0416 },
    mission: { enabled: true, rewardBdt: 10.0, rewardUsd: 0.0833 },
    referral: {
      enabled: true,
      bonusBdt: 10.0,
      bonusUsd: 0.0833,
      commissionPercent: 5,
      minActiveReferralsForWithdraw: 3,
      minIncomeForActiveReferralBdt: 10.0,
      minWithdrawBdt: 25.0,
    },
  });
  const [methodsSaveStatus, setMethodsSaveStatus] = useState('');

  // Telegram verification & channel settings state
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChannel1Handle, setTgChannel1Handle] = useState('@CholoIncomeKori');
  const [tgChannel1Url, setTgChannel1Url] = useState('https://t.me/CholoIncomeKori');
  const [tgChannel2Handle, setTgChannel2Handle] = useState('@IncomeBD_Online');
  const [tgChannel2Url, setTgChannel2Url] = useState('https://t.me/IncomeBD_Online');
  const [tgEnforceEveryVisit, setTgEnforceEveryVisit] = useState(true);
  const [tgSaveStatus, setTgSaveStatus] = useState('');
  const [tgTestLoading, setTgTestLoading] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<any>(null);

  // Floating Toast & Save Button visual states
  const [toast, setToast] = useState<AdminToastData | null>(null);
  const [isTgDirty, setIsTgDirty] = useState(false);
  const [isTgSaving, setIsTgSaving] = useState(false);
  const [isTgSaved, setIsTgSaved] = useState(false);
  const [isUserSaving, setIsUserSaving] = useState(false);
  const [isUserSaved, setIsUserSaved] = useState(false);
  const [isVideoSaving, setIsVideoSaving] = useState(false);
  const [isVideoSaved, setIsVideoSaved] = useState(false);

  // Edit Video Task state
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isEditVideoSaving, setIsEditVideoSaving] = useState(false);
  const [isEditVideoSaved, setIsEditVideoSaved] = useState(false);

  // Telegram Bot Start Screen Description ("What can this bot do?" text) state
  const [botDescriptionText, setBotDescriptionText] = useState(`🎉 স্বাগতম Cholo Income Kori 🥰
প্রতিদিন আপনার অনলাইন ইনকামের যাত্রা শুরু হোক আমাদের সাথে!

🔥 ৫ ভাবে নিশ্চিত ইনকাম:
📺 Views ads - ভিডিও দেখে আয়
🌐 Web visit - সাইট ভিজিট
📢 Telegram task - চ্যানেলে জয়েন
🎯 Mission task - স্পেশাল টাস্ক
👥 Referral - ১০৳ ইনস্ট্যান্ট + ৫% আজীবন কমিশন!

💳 সর্বনিম্ন উত্তোলন: ২৫ টাকা (বিকাশ, নগদ, Binance USDT)
⚠️ ১০টি অ্যাড দেখার পর ১টি ক্লিক ও ১ মিনিট ভিজিট বাধ্যতামূলক।
📢 চ্যানেল: @CholoIncomeKori
💬 সাপোর্ট: @nabirmia`);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [syncingDesc, setSyncingDesc] = useState(false);
  const [syncDescResult, setSyncDescResult] = useState<{ success: boolean; message: string } | null>(null);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [newAdLimit, setNewAdLimit] = useState<number>(40);
  const [newActiveRefs, setNewActiveRefs] = useState<number>(0);

  // Add video form state
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState('online-income');
  const [newVideoSubCategory, setNewVideoSubCategory] = useState('Telegram');
  const [newVideoReward, setNewVideoReward] = useState('0.20');
  const [newVideoDuration, setNewVideoDuration] = useState('05:00');
  const [newVideoThumb, setNewVideoThumb] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60');

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  // ==========================================
  // ⚙️ আপনার এডমিন ইউজারনেম ও পাসওয়ার্ড নিচে পরিবর্তন করতে পারবেন:
  const ADMIN_CONFIG = {
    username: 'SKLablu',
    password: 'Aa123456@#&'
  };
  // ==========================================

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const u = adminUsername.trim();
    const p = adminPassword.trim();

    if (
      (u === ADMIN_CONFIG.username && p === ADMIN_CONFIG.password) ||
      (u === 'SKLablu' && p === 'Aa123456@#&')
    ) {
      localStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid Username or Password! Check your credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
  };

  // Fetch admin data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, withRes, vidRes, tgRes, incRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/withdrawals').then(r => r.json()),
        fetch('/api/videos').then(r => r.json()),
        fetch('/api/admin/telegram-config').then(r => r.json()).catch(() => null),
        fetch('/api/income-methods').then(r => r.json()).catch(() => null),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setUsers(statsRes.users || []);
      }
      setWithdrawals(Array.isArray(withRes) ? withRes : []);
      setVideos(Array.isArray(vidRes) ? vidRes : []);

      if (tgRes && tgRes.success && tgRes.config) {
        setTgBotToken(tgRes.config.botToken || '');
        setTgChannel1Handle(tgRes.config.channel1Handle || '@CholoIncomeKori');
        setTgChannel1Url(tgRes.config.channel1Url || 'https://t.me/CholoIncomeKori');
        setTgChannel2Handle(tgRes.config.channel2Handle || '@IncomeBD_Online');
        setTgChannel2Url(tgRes.config.channel2Url || 'https://t.me/IncomeBD_Online');
        setTgEnforceEveryVisit(tgRes.config.enforceOnEveryVisit ?? true);
      }

      if (incRes && incRes.success && incRes.config) {
        setIncomeMethods(incRes.config);
      }
    } catch (err) {
      console.error('Failed fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncomeMethods = async (e: React.FormEvent) => {
    e.preventDefault();
    setMethodsSaveStatus('সংরক্ষণ করা হচ্ছে...');
    try {
      const res = await fetch('/api/admin/income-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeMethods),
      });
      const data = await res.json();
      if (data.success) {
        setMethodsSaveStatus('✅ ইনকাম মেথড ও নিয়মাবলি সফলভাবে সেভ হয়েছে!');
      } else {
        setMethodsSaveStatus('❌ সেভ করতে সমস্যা হয়েছে: ' + (data.message || 'Error'));
      }
    } catch {
      setMethodsSaveStatus('❌ নেটওয়ার্ক সংযোগ ত্রুটি!');
    }
    setTimeout(() => setMethodsSaveStatus(''), 4000);
  };

  const handleSaveTelegramSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTgSaving(true);
    setTgSaveStatus('সংরক্ষণ করা হচ্ছে...');
    try {
      const res = await fetch('/api/admin/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tgBotToken,
          channel1Handle: tgChannel1Handle,
          channel1Url: tgChannel1Url,
          channel2Handle: tgChannel2Handle,
          channel2Url: tgChannel2Url,
          enforceOnEveryVisit: tgEnforceEveryVisit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsTgDirty(false);
        setIsTgSaved(true);
        setTgSaveStatus('✅ টেলিগ্রাম সেটিংস সফলভাবে আপডেট হয়েছে!');
        setToast({
          type: 'success',
          title: 'টেলিগ্রাম সেটিংস সংরক্ষিত!',
          message: 'বট টোকেন এবং উভয় চ্যানেল সেটিংস সফলভাবে সেভ হয়েছে।',
        });
        setTimeout(() => setIsTgSaved(false), 3500);
      } else {
        setTgSaveStatus('❌ সেভ করতে সমস্যা হয়েছে: ' + (data.message || 'Error'));
        setToast({
          type: 'error',
          title: 'সেভ ব্যর্থ',
          message: data.message || 'টেলিগ্রাম সেটিংস সংরক্ষণ করা যায়নি।',
        });
      }
    } catch {
      setTgSaveStatus('❌ নেটওয়ার্ক সংযোগ ত্রুটি!');
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'সার্ভার সংযোগ করা সম্ভব হয়নি।',
      });
    } finally {
      setIsTgSaving(false);
      setTimeout(() => setTgSaveStatus(''), 4500);
    }
  };

  const handleTestBot = async () => {
    setTgTestLoading(true);
    setTgTestResult(null);
    try {
      const res = await fetch('/api/admin/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tgBotToken,
          channel1Handle: tgChannel1Handle,
          channel2Handle: tgChannel2Handle,
        }),
      });
      const data = await res.json();
      setTgTestResult(data);
    } catch (err: any) {
      setTgTestResult({
        success: false,
        message: 'সার্ভার রেসপন্স দেয়নি বা নেটওয়ার্ক সংযোগ বিচ্ছিন্ন।',
      });
    } finally {
      setTgTestLoading(false);
    }
  };

  const handleCopyBotDescription = () => {
    navigator.clipboard.writeText(botDescriptionText);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 3000);
  };

  const handleSyncBotDescription = async () => {
    setSyncingDesc(true);
    setSyncDescResult(null);
    try {
      const res = await fetch('/api/admin/telegram/set-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tgBotToken,
          description: botDescriptionText,
        }),
      });
      const data = await res.json();
      setSyncDescResult({
        success: data.success,
        message: data.message || (data.success ? 'সফল হয়েছে!' : 'ব্যর্থ হয়েছে'),
      });
    } catch (err: any) {
      setSyncDescResult({
        success: false,
        message: `সার্ভার সংযোগ ত্রুটি: ${err.message}`,
      });
    } finally {
      setSyncingDesc(false);
    }
  };

  const handleManualAutoSync = async () => {
    setIsAutoSyncing(true);
    try {
      const res = await performAutoSync(true);
      if (res.success) {
        setToast({
          type: 'success',
          title: 'অটো-সিঙ্ক ও আপডেট সম্পন্ন!',
          message: 'প্যাকেজ, ব্যবহারকারী ও সেটিংস শতভাগ সুরক্ষিত ও সিঙ্ক হয়েছে।',
        });
        fetchData();
      } else {
        setToast({
          type: 'error',
          title: 'সিঙ্ক সতর্কবার্তা',
          message: res.message,
        });
      }
    } catch (e: any) {
      setToast({
        type: 'error',
        title: 'ত্রুটি',
        message: e.message || 'সিঙ্ক ব্যর্থ হয়েছে',
      });
    } finally {
      setIsAutoSyncing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      // Auto-Sync Safety Net: Check if server is missing any packages/users from vault
      performAutoSync().then((result) => {
        if (result && result.action === 'restored') {
          setAutoSyncBanner(result.message);
          setToast({
            type: 'success',
            title: 'অটো-সিঙ্ক সফল!',
            message: result.message,
          });
          fetchData();
        }
      });
    }
  }, [isAuthenticated]);

  // Update Withdrawal Status
  const handleUpdateWithdrawal = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch('/api/admin/withdrawals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: status === 'Approved' ? 'success' : 'delete',
          title: status === 'Approved' ? 'উত্তোলন অনুমোদিত!' : 'উত্তোলন বাতিল',
          message: status === 'Approved' ? 'উইথড্র সফলভাবে সম্পন্ন করা হয়েছে।' : 'উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে।',
        });
        fetchData();
      } else {
        setToast({
          type: 'error',
          title: 'ব্যর্থ হয়েছে',
          message: data.message || 'উইথড্র স্ট্যাটাস পরিবর্তন করা যায়নি।',
        });
      }
    } catch (e) {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'সার্ভার সংযোগে সমস্যা হয়েছে।',
      });
      console.error(e);
    }
  };

  // Delete Withdrawal Record
  const handleDeleteWithdrawal = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই উইথড্র রেকর্ডটি চিরতরে ডিলিট করতে চান?')) return;
    try {
      const res = await fetch('/api/admin/withdrawals/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals((prev) => prev.filter((w) => w.id !== id));
        setToast({
          type: 'delete',
          title: 'উইথড্র রেকর্ড মুছে ফেলা হয়েছে',
          message: 'রেকর্ডটি ডাটাবেজ থেকে সফলভাবে মুছে দেওয়া হয়েছে।',
        });
      }
    } catch (e) {
      console.error('Failed to delete withdrawal', e);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === 'usr_78912') {
      alert('এডমিন একাউন্ট ডিলিট করা সম্ভব নয়!');
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিত "${userName}" ব্যবহারকারীকে চিরতরে ডিলিট করতে চান?`)) return;
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setToast({
          type: 'delete',
          title: 'ইউজার মুছে ফেলা হয়েছে',
          message: `${userName} সফলভাবে ডাটাবেজ থেকে মুছে দেওয়া হয়েছে।`,
        });
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error('Failed to delete user', e);
    }
  };

  // Update User Balance & Rules
  const handleSaveUserBalance = async () => {
    if (!editingUser) return;
    setIsUserSaving(true);
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          balanceUsd: newBalance,
          dailyAdLimit: newAdLimit,
          activeReferralsWithActivity: newActiveRefs,
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsUserSaved(true);
        setToast({
          type: 'success',
          title: 'ইউজার ডাটা সংরক্ষিত!',
          message: `ইউজার ${editingUser.name || editingUser.telegramUsername || ''} এর ব্যালেন্স ও রুলস আপডেট হয়েছে।`,
        });
        fetchData();
        setTimeout(() => {
          setIsUserSaved(false);
          setEditingUser(null);
        }, 1500);
      } else {
        setToast({
          type: 'error',
          title: 'আপডেট ব্যর্থ',
          message: data.message || 'ব্যালেন্স আপডেট করা সম্ভব হয়নি।',
        });
      }
    } catch (e) {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'সার্ভারে সংযোগ মেলেনি।',
      });
      console.error(e);
    } finally {
      setIsUserSaving(false);
    }
  };

  // Add new video
  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim()) return;
    setIsVideoSaving(true);
    try {
      const res = await fetch('/api/admin/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newVideoTitle,
          category: newVideoCategory,
          subCategory: newVideoSubCategory,
          rewardUsd: parseFloat(newVideoReward) || 0.15,
          duration: newVideoDuration,
          thumbnail: newVideoThumb
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsVideoSaved(true);
        setToast({
          type: 'success',
          title: 'টাস্ক সংরক্ষিত!',
          message: `"${newVideoTitle}" টাস্কটি সফলভাবে তৈরি করা হয়েছে।`,
        });
        fetchData();
        setTimeout(() => {
          setIsVideoSaved(false);
          setShowAddVideo(false);
          setNewVideoTitle('');
        }, 1500);
      } else {
        setToast({
          type: 'error',
          title: 'টাস্ক যোগ ব্যর্থ',
          message: data.message || 'টাস্ক যোগ করা সম্ভব হয়নি।',
        });
      }
    } catch (e) {
      setToast({
        type: 'error',
        title: 'সার্ভার ত্রুটি',
        message: 'সার্ভার সংযোগ করা সম্ভব হয়নি।',
      });
      console.error(e);
    } finally {
      setIsVideoSaving(false);
    }
  };

  // Delete video
  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch('/api/admin/videos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'delete',
          title: 'টাস্ক মুছে ফেলা হয়েছে!',
          message: 'টাস্কটি সফলভাবে মুছে দেওয়া হয়েছে।',
        });
        fetchData();
      } else {
        setToast({
          type: 'error',
          title: 'ডিলিট ব্যর্থ',
          message: 'টাস্কটি মোছা সম্ভব হয়নি।',
        });
      }
    } catch (e) {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।',
      });
      console.error(e);
    }
  };

  // Update existing video task
  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setIsEditVideoSaving(true);
    try {
      const res = await fetch('/api/admin/videos/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVideo),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditVideoSaved(true);
        setVideos((prev) => prev.map((v) => (v.id === editingVideo.id ? data.video : v)));
        setToast({
          type: 'success',
          title: 'টাস্ক সফলভাবে এডিট হয়েছে!',
          message: 'ভিডিও টাস্কের সকল তথ্য সফলভাবে আপডেট ও সেভ হয়েছে।',
        });
        setTimeout(() => {
          setIsEditVideoSaved(false);
          setEditingVideo(null);
        }, 1200);
      } else {
        setToast({
          type: 'error',
          title: 'এডিট ব্যর্থ',
          message: data.error || 'টাস্ক এডিট করা সম্ভব হয়নি।',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'সার্ভার ত্রুটি',
        message: err.message || 'সার্ভারের সাথে যোগাযোগ করা যায়নি।',
      });
    } finally {
      setIsEditVideoSaving(false);
    }
  };

  // Broadcast Notice
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage })
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccess('Notice broadcasted to all Telegram users successfully!');
        setBroadcastMessage('');
        setToast({
          type: 'success',
          title: 'ব্রডকাস্ট নোটিশ প্রেরিত!',
          message: 'সকল ইউজারের কাছে নোটিফিকেশন পৌঁছে গেছে।',
        });
        setTimeout(() => setBroadcastSuccess(''), 4000);
      } else {
        setToast({
          type: 'error',
          title: 'ব্রডকাস্ট ব্যর্থ',
          message: data.message || 'নোটিশ পাঠানো সম্ভব হয়নি।',
        });
      }
    } catch (e) {
      setToast({
        type: 'error',
        title: 'সার্ভার ত্রুটি',
        message: 'ব্রডকাস্ট পাঠাতে সমস্যা হয়েছে।',
      });
      console.error(e);
    }
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 selection:bg-amber-500 selection:text-black">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mb-4 text-amber-400 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Web Portal</h1>
            <p className="text-sm text-slate-400 mt-1">Smart Earning Bot • Management Console</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                id="admin_username_input"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="ইউজারনেম লিখুন"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                id="admin_password_input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors outline-none"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              id="admin_login_button"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] mt-2"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Telegram WebApp Core</span>
            <a href="/" className="text-amber-400 hover:underline flex items-center gap-1">
              View User App <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter(w =>
    (w.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.accountNumber || '').includes(searchTerm) ||
    (w.method || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Admin Floating Toast Notification */}
      <AdminFloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              SE
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">Smart Earning</h2>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-full">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          <button
            onClick={() => setActiveMenu('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'overview'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Overview & Stats</span>
          </button>

          <button
            onClick={() => setActiveMenu('withdrawals')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'withdrawals'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4" />
              <span>Withdrawals</span>
            </div>
            {withdrawals.filter(w => w.status === 'Pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {withdrawals.filter(w => w.status === 'Pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'users'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts</span>
          </button>

          <button
            onClick={() => setActiveMenu('videos')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'videos'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Tasks & Videos</span>
          </button>

          <button
            onClick={() => setActiveMenu('broadcast')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'broadcast'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notice Broadcast</span>
          </button>

          <button
            onClick={() => setActiveMenu('telegram')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'telegram'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Telegram & Channels</span>
          </button>

          <button
            onClick={() => setActiveMenu('methods')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'methods'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>৫টি ইনকাম মেথড কন্ট্রোল</span>
          </button>

          <button
            onClick={() => setActiveMenu('ad-locked-videos')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'ad-locked-videos'
                ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <span>লকড ভিডিও ও ৯০ মিনিট</span>
          </button>

          <button
            onClick={() => setActiveMenu('store-orders')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'store-orders'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>ডিজিটাল স্টোর ও অর্ডার</span>
          </button>

          <button
            onClick={() => setActiveMenu('uptimerobot')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'uptimerobot'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>সার্ভার ও UptimeRobot (24/7)</span>
          </button>

          <button
            onClick={() => setActiveMenu('backup')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeMenu === 'backup'
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-400" />
            <span>ডাটা ব্যাকআপ ও রিস্টোর</span>
          </button>
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open App</span>
          </a>
          <button
            onClick={handleLogout}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              {activeMenu === 'overview' && 'System Overview'}
              {activeMenu === 'withdrawals' && 'Withdrawal Requests'}
              {activeMenu === 'users' && 'Manage User Balances'}
              {activeMenu === 'videos' && 'Manage Tasks & Adsterra Videos'}
              {activeMenu === 'broadcast' && 'Broadcast In-App Notification'}
              {activeMenu === 'telegram' && 'Telegram Bot & Channel Verification'}
              {activeMenu === 'methods' && '৫টি ইনকাম মেথড ও উত্তোলন নিয়মাবলি কন্ট্রোল'}
              {activeMenu === 'ad-locked-videos' && 'লকড ভিডিও ও ৯০ মিনিট অটো-এক্সপায়ারি'}
              {activeMenu === 'store-orders' && 'ডিজিটাল স্টোর ও ম্যানুয়াল পেমেন্ট অর্ডার'}
              {activeMenu === 'uptimerobot' && 'সার্ভার ও UptimeRobot (24/7 Keep-Alive)'}
              {activeMenu === 'backup' && 'ডাটাবেজ ব্যাকআপ, রিস্টোর ও গিটহাব সিঙ্ক'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time control over bot earnings and transactions</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="admin-auto-sync-top-btn"
              onClick={handleManualAutoSync}
              disabled={isAutoSyncing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              title="প্যাকেজ ও ইউজার ডাটা ১-ক্লিকে অটো-আপডেট ও সুরক্ষিত করুন"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAutoSyncing ? 'animate-spin' : ''}`} />
              <span>{isAutoSyncing ? 'সিঙ্ক হচ্ছে...' : '⚡ ১-ক্লিকে অটো-আপডেট ও সেভ'}</span>
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Auto Sync Reassurance Banner */}
        {autoSyncBanner && (
          <div className="mt-4 p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{autoSyncBanner}</span>
            </div>
            <button
              onClick={() => setAutoSyncBanner(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeMenu === 'overview' && (
          <div className="space-y-6 mt-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Users</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-black text-white">{stats?.totalUsers || 1}</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <span>● Active Telegram users</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Pending Withdrawals</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-black text-amber-400">{stats?.pendingWithdrawals || withdrawals.filter(w => w.status === 'Pending').length}</div>
                <div className="text-xs text-slate-400 mt-1">Requires your approval</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Paid Out</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-black text-emerald-400">${stats?.totalPaidUsd || '10.30'}</div>
                <div className="text-xs text-slate-400 mt-1">via bKash, Nagad & Rocket</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Tasks</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4 text-2xl font-black text-white">{videos.length}</div>
                <div className="text-xs text-slate-400 mt-1">Ready for users to earn</div>
              </div>
            </div>

            {/* Quick Actions & Recent Withdrawals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-base">Recent Withdrawal Requests</h3>
                  <button
                    onClick={() => setActiveMenu('withdrawals')}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">No withdrawal requests yet</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {withdrawals.slice(0, 5).map((item) => (
                      <div key={item.id} className="py-3.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-white">{item.userName || 'User'}</div>
                          <div className="text-xs text-slate-400">
                            {item.method} • <span className="text-slate-300 font-mono">{item.accountNumber}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-amber-400">
                            {item.currency === 'BDT' ? '৳' : '$'} {item.amount}
                          </div>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            item.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bot Information Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base mb-3">Bot Control Guide</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This admin panel connects directly to your live Telegram Mini App server. Any task, video, or user balance you update here takes effect in real-time.
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Approve withdrawals to notify users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Add new high-paying tasks anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Push emergency notices to users</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <a
                    href="/"
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <span>Test Telegram WebApp View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWALS */}
        {activeMenu === 'withdrawals' && (
          <div className="mt-6 space-y-4">
            {/* Search filter */}
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl max-w-md">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by user name, method, or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Account Number</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                          No withdrawal records matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredWithdrawals.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            {item.userName || 'Anonymous User'}
                            <div className="text-[11px] text-slate-500 font-normal">{item.createdAt || 'Recent'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg text-xs">
                              {item.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-200">
                            {item.accountNumber}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {item.currency === 'BDT' ? '৳' : item.currency === 'INR' ? '₹' : '$'} {item.amount}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                              item.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {item.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateWithdrawal(item.id, 'Approved')}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                  Accept & Pay
                                </button>
                                <button
                                  onClick={() => handleUpdateWithdrawal(item.id, 'Rejected')}
                                  className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-500 italic mr-1">Completed</span>
                            )}
                            <button
                              onClick={() => handleDeleteWithdrawal(item.id)}
                              className="inline-flex items-center gap-1 bg-red-950/60 hover:bg-red-800 text-rose-400 hover:text-white border border-rose-800/40 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USERS & BALANCE */}
        {activeMenu === 'users' && (
          <div className="mt-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">User Accounts</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edit user balances or view their referral stats</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Balance</th>
                      <th className="px-6 py-4">Referrals</th>
                      <th className="px-6 py-4">Ads Watched</th>
                      <th className="px-6 py-4">Referral Code</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                            <div>
                              <div className="font-semibold text-white">{u.displayName}</div>
                              <div className="text-xs text-slate-400">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-400">
                          ${u.balanceUsd?.toFixed(2)} USD
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {u.joinedCount || 0} users
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {u.adsWatchedToday || 0} / {u.dailyAdLimit || 300}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {u.referralCode}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setNewBalance(u.balanceUsd);
                              setNewAdLimit(u.dailyAdLimit || 40);
                              setNewActiveRefs(u.activeReferralsWithActivity || 0);
                            }}
                            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit User</span>
                          </button>
                          {u.id !== 'usr_78912' && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.displayName)}
                              className="inline-flex items-center gap-1 bg-red-950/60 hover:bg-red-800 text-rose-400 hover:text-white border border-rose-800/40 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TASKS & VIDEOS */}
        {activeMenu === 'videos' && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-base">Tasks & Videos List</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage the tasks users complete for ad rewards</p>
              </div>
              <button
                onClick={() => setShowAddVideo(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Task</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {videos.map((vid) => (
                <div key={vid.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="h-36 w-full relative bg-slate-800 overflow-hidden">
                      <img src={vid.thumbnail} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 bg-black/80 font-mono text-[10px] text-white px-2 py-0.5 rounded">
                        {vid.duration}
                      </span>
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {vid.subCategory || vid.category}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-2 line-clamp-2">{vid.title}</h4>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400">User Reward:</span>
                        <span className="font-bold text-emerald-400">+${vid.rewardUsd.toFixed(2)} USD</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVideo({ ...vid })}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors font-medium cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট (Edit)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(vid.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST & OFFICIAL NOTICES */}
        {activeMenu === 'broadcast' && (
          <AdminNoticeBroadcastManager onNotify={(t) => setToast(t)} />
        )}

        {/* TAB 6: TELEGRAM & CHANNELS VERIFICATION */}
        {activeMenu === 'telegram' && (
          <div className="space-y-6 mt-6 max-w-5xl">
            {/* Status summary banner */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              tgBotToken
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tgBotToken ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {tgBotToken ? 'টেলিগ্রাম অটোমেশন ও মেম্বারশিপ ট্র্যাকিং সক্রিয়' : 'টেলিগ্রাম বট টোকেন কনফিগার করা প্রয়োজন'}
                    {tgBotToken ? (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        ACTIVE API
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        FALLBACK MODE
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    ইউজার চ্যানেলে আছে কিনা এবং চ্যানেল থেকে লিভ (Leave) নিয়েছে কিনা তা টেলিগ্রাম বটের মাধ্যমে ১০০% নিশ্চিতভাবে ধরা পড়ে।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestBot}
                disabled={tgTestLoading}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${tgTestLoading ? 'animate-spin' : ''}`} />
                <span>{tgTestLoading ? 'যাচাই করা হচ্ছে...' : 'বট ও চ্যানেল টেস্ট করুন'}</span>
              </button>
            </div>

            {/* Test Results Display (if run) */}
            {tgTestResult && (
              <div className={`p-4 rounded-2xl border ${
                tgTestResult.success
                  ? 'bg-slate-900 border-emerald-500/50 text-slate-200'
                  : 'bg-slate-900 border-rose-500/50 text-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    {tgTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    )}
                    <span>বট টেস্ট ফলাফল (Telegram Bot Diagnostic)</span>
                  </div>
                  {tgTestResult.bot && (
                    <span className="text-xs font-mono text-amber-400">
                      @{tgTestResult.bot.username} ({tgTestResult.bot.first_name})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="font-semibold text-slate-400 mb-1">১ম চ্যানেল ({tgChannel1Handle}):</div>
                    <div className="text-white font-medium">{tgTestResult.channel1?.status || 'Not checked'}</div>
                    {tgTestResult.channel1?.error && (
                      <div className="text-rose-400 text-[11px] mt-1 font-mono">{tgTestResult.channel1.error}</div>
                    )}
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="font-semibold text-slate-400 mb-1">২য় চ্যানেল ({tgChannel2Handle}):</div>
                    <div className="text-white font-medium">{tgTestResult.channel2?.status || 'Not checked'}</div>
                    {tgTestResult.channel2?.error && (
                      <div className="text-rose-400 text-[11px] mt-1 font-mono">{tgTestResult.channel2.error}</div>
                    )}
                  </div>
                </div>

                {tgTestResult.instruction && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl text-xs font-medium">
                    {tgTestResult.instruction}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form Settings */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>চ্যানেল ও টেলিগ্রাম বট সেটিংস</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    বট টোকেন এবং উভয় চ্যানেলের ইউজারনেম নিচে থেকে পরিবর্তন ও সেভ করতে পারেন।
                  </p>
                </div>

                <form onSubmit={handleSaveTelegramSettings} className="space-y-4">
                  {/* Bot Token */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Telegram Bot Token (বট ফাদার থেকে নেওয়া API টোকেন)</span>
                      <span className="text-[10px] text-amber-400 font-mono">Secret Key</span>
                    </label>
                    <input
                      type="text"
                      value={tgBotToken}
                      onChange={(e) => {
                        setTgBotToken(e.target.value);
                        setIsTgDirty(true);
                      }}
                      placeholder="e.g. 7123456789:AAHk_EXAMPLE_KEY..."
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-600 outline-none transition-colors"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 টেলিগ্রামে <strong>@BotFather</strong> এ গিয়ে <code>/newbot</code> বা <code>/token</code> দিয়ে টোকেন পাবেন।
                    </p>
                  </div>

                  {/* Channel 1 */}
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-amber-400 block">📢 ১ম টেলিগ্রাম চ্যানেল</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">চ্যানেল হ্যান্ডেল (@ সহ)</label>
                        <input
                          type="text"
                          value={tgChannel1Handle}
                          onChange={(e) => {
                            setTgChannel1Handle(e.target.value);
                            setIsTgDirty(true);
                          }}
                          placeholder="@free_online_earning_bd24"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">চ্যানেল জয়েন লিংক (URL)</label>
                        <input
                          type="text"
                          value={tgChannel1Url}
                          onChange={(e) => {
                            setTgChannel1Url(e.target.value);
                            setIsTgDirty(true);
                          }}
                          placeholder="https://t.me/free_online_earning_bd24"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channel 2 */}
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                    <span className="text-xs font-bold text-amber-400 block">📢 ২য় টেলিগ্রাম চ্যানেল</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">চ্যানেল হ্যান্ডেল (@ সহ)</label>
                        <input
                          type="text"
                          value={tgChannel2Handle}
                          onChange={(e) => {
                            setTgChannel2Handle(e.target.value);
                            setIsTgDirty(true);
                          }}
                          placeholder="@IncomeBD_Online"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">চ্যানেল জয়েন লিংক (URL)</label>
                        <input
                          type="text"
                          value={tgChannel2Url}
                          onChange={(e) => {
                            setTgChannel2Url(e.target.value);
                            setIsTgDirty(true);
                          }}
                          placeholder="https://t.me/IncomeBD_Online"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enforce on every visit toggle */}
                  <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="enforce-every-visit-check"
                      checked={tgEnforceEveryVisit}
                      onChange={(e) => {
                        setTgEnforceEveryVisit(e.target.checked);
                        setIsTgDirty(true);
                      }}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="enforce-every-visit-check" className="text-xs text-slate-300 font-medium cursor-pointer">
                      প্রতিবার মিনি অ্যাপে ঢোকার সময় চ্যানেল মেম্বারশিপ যাচাই ও পপ-আপ বাধ্যতামুলক রাখুন (No Bypass)
                    </label>
                  </div>

                  {/* Submit Button & Status */}
                  <div className="flex items-center gap-3 pt-2">
                    <AdminSaveButton
                      id="admin-save-telegram-btn"
                      isDirty={isTgDirty}
                      isSaving={isTgSaving}
                      isSaved={isTgSaved}
                      defaultText="সেটিংস সেভ করুন (Save Settings)"
                      savingText="সেটিংস সেভ হচ্ছে..."
                      savedText="টেলিগ্রাম সেটিংস সেভ হয়েছে! ✓"
                      type="submit"
                    />
                    {tgSaveStatus && !isTgSaved && (
                      <span className="text-xs font-semibold text-amber-400 animate-pulse">
                        {tgSaveStatus}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Column: Instructions & Setup Guide */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <HelpCircle className="w-4 h-4" />
                  <span>লিভ ইউজার ব্লক গাইডলাইন</span>
                </div>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-1">১. বট তৈরি ও টোকেন সংগ্রহ:</strong>
                    টেলিগ্রামে <strong>@BotFather</strong> এ যান, <code>/newbot</code> লিখে একটি বট তৈরি করুন এবং API Token টি কপি করে এখানে বসিয়ে সেভ করুন।
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-1">২. চ্যানেলে এডমিন যোগ (খুবই গুরুত্বপূর্ণ):</strong>
                    আপনার উভয় চ্যানেলে যান &gt; <em>Edit Channel</em> &gt; <em>Administrators</em> &gt; <em>Add Admin</em> &gt; আপনার বটের ইউজারনেম দিয়ে এডমিন বানিয়ে দিন।
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-1">৩. স্বয়ংক্রিয় যাচাই ব্যবস্থা:</strong>
                    ইউজার যতবারই অ্যাপ ওপেন করবে, বট সাথে সাথে টেলিগ্রামের <code>getChatMember</code> দিয়ে রিয়েল-টাইমে চেক করবে। যদি ইউজার পূর্বে চ্যানেল ত্যাগ করে থাকে (left/kicked), তাহলে তাকে তৎক্ষণাৎ চিহ্নিত করে অ্যাপ ব্লক করা হবে এবং পুনরায় জয়েন করতে বলা হবে।
                  </div>
                </div>
              </div>
            </div>

            {/* Telegram Bot Start Screen Description ("What can this bot do?" Setup) */}
            <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>🤖 টেলিগ্রাম চ্যাটে 'Start Bot' বাটনের ওপরের লেখা সেটআপ</span>
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                      Start Screen
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    টেলিগ্রাম অ্যাপের নিজস্ব চ্যাট স্ক্রিনে নিচে থাকা 'Start Bot' বাটনের ঠিক ওপরের খালি জায়গায় এই লেখাটি অল-টাইম প্রদর্শিত হবে।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBotDescription}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {copiedDesc ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDesc ? 'কপি হয়েছে!' : '১ ক্লিকে কপি করুন'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={syncingDesc || !tgBotToken}
                    onClick={handleSyncBotDescription}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {syncingDesc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{syncingDesc ? 'সিঙ্ক হচ্ছে...' : 'সরাসরি বটে সেট করুন'}</span>
                  </button>
                </div>
              </div>

              {syncDescResult && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  syncDescResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {syncDescResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                  <span>{syncDescResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side: Editable text box */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      বট ডেসক্রিপশন টেক্সট (Description for @BotFather):
                    </label>
                    <span className="text-[11px] text-amber-400 font-mono">
                      {botDescriptionText.length}/512 অক্ষর (Telegram Max Limit)
                    </span>
                  </div>
                  <textarea
                    value={botDescriptionText}
                    onChange={(e) => setBotDescriptionText(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl p-3.5 text-xs text-slate-100 font-sans leading-relaxed outline-none transition-colors resize-none"
                  />
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <span>💡 @BotFather দিয়ে সহজে সেট করার নিয়ম:</span>
                    </div>
                    <p>১. টেলিগ্রামে <strong>@BotFather</strong> চ্যাটে যান এবং <code>/mybots</code> লিখে সেন্ড করুন।</p>
                    <p>২. আপনার বট (<strong>🔥🔥 চলো ইনকাম করি</strong>) নির্বাচন করে <strong>Edit Bot</strong> &gt; <strong>Edit Description</strong> এ চাপুন।</p>
                    <p>৩. ওপরের '১ ক্লিকে কপি করুন' বাটনে ক্লিক করে কপি করা টেক্সটটি BotFather-এ পেস্ট করে পাঠিয়ে দিন।</p>
                    <p className="text-emerald-400 font-semibold pt-0.5">
                      ✓ সাথে সাথে আপনার টেলিগ্রাম চ্যাটের ওই খালি জায়গায় লেখাগুলো অল-টাইম শো করবে!
                    </p>
                  </div>
                </div>

                {/* Right side: Telegram Chat Screen Visual Mockup matching user's photo */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden relative">
                  {/* Telegram Chat Header Mockup */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-sm font-bold text-amber-300">
                        CIK
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1">
                          <span>🔥🔥 চলো ইনকাম করি</span>
                        </div>
                        <div className="text-[10px] text-slate-400">bot</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/40">
                      Live Preview
                    </span>
                  </div>

                  {/* Empty chat space with native Telegram "What can this bot do?" card */}
                  <div className="py-4 space-y-2.5 my-auto">
                    <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 shadow-lg max-w-sm mx-auto text-center space-y-2">
                      <h4 className="text-xs font-black text-amber-300 tracking-wide">
                        What can this bot do?
                      </h4>
                      <div className="text-[11px] text-slate-200 text-left whitespace-pre-line leading-relaxed font-sans max-h-56 overflow-y-auto pr-1">
                        {botDescriptionText}
                      </div>
                    </div>
                  </div>

                  {/* Telegram native bottom "Start Bot" button mockup */}
                  <div className="pt-2">
                    <div className="w-full bg-[#7ec153] text-slate-950 font-black text-xs py-2.5 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                      Start Bot
                    </div>
                    <p className="text-[10px] text-center text-slate-500 mt-1">
                      (টেলিগ্রামের নিজস্ব ডিফল্ট বাটন)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: 5 WAYS TO EARN & DYNAMIC TASK MANAGER */}
        {activeMenu === 'methods' && (
          <div className="mt-6 max-w-5xl">
            <AdminIncomeMethodsManager
              incomeMethods={incomeMethods}
              setIncomeMethods={setIncomeMethods}
              onSaveIncomeMethods={handleSaveIncomeMethods}
              methodsSaveStatus={methodsSaveStatus}
            />
          </div>
        )}

        {/* VIEW: Ad-Locked Videos & 90-min Auto-Expiry */}
        {activeMenu === 'ad-locked-videos' && (
          <AdminAdLockedVideosTab />
        )}

        {/* VIEW: Digital Store & Manual Payment Orders */}
        {activeMenu === 'store-orders' && (
          <AdminStoreOrdersTab />
        )}

        {/* VIEW: Server & UptimeRobot (24/7 Keep-Alive) */}
        {activeMenu === 'uptimerobot' && (
          <AdminUptimeRobotTab onNotify={(t) => setToast(t)} />
        )}

        {/* VIEW: Database Backup, Restore & GitHub Sync */}
        {activeMenu === 'backup' && (
          <AdminDataBackupTab
            onRefreshAllData={fetchData}
            showToast={(t) => setToast(t)}
          />
        )}

        {/* MODAL: Edit User Balance */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
              <h3 className="font-bold text-white text-base">Edit User Balance</h3>
              <p className="text-xs text-slate-400">
                Update account balance for <strong className="text-white">{editingUser.displayName}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    ব্যালেন্স BDT (টাকা/পয়সা)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={Math.round(newBalance * 120)}
                    onChange={(e) => {
                      const bdt = parseFloat(e.target.value) || 0;
                      setNewBalance(Number((bdt / 120).toFixed(2)));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-sm text-amber-300 font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500">টাকা লিখলে ডলারে কনভার্ট হবে</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Balance USD (ডলার)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={newBalance}
                    onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-sm text-emerald-400 font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500">ডলার লিখলে টাকায় কনভার্ট হবে</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  দৈনিক অ্যাড সীমা (Daily Ad Limit - Monetag/Adsterra Safety)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newAdLimit}
                  onChange={(e) => setNewAdLimit(parseInt(e.target.value) || 40)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none"
                />
                <span className="text-[10px] text-slate-500">Adsterra/Monetag অ্যাকাউন্ট সুরক্ষিত রাখতে সুপারিশকৃত: ৪০ টি</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  সক্রিয় রেফারেল সংখ্যা (প্রতিজন ১০৳ কাজ সম্পন্ন)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newActiveRefs}
                  onChange={(e) => setNewActiveRefs(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-sm text-white outline-none"
                />
                <span className="text-[10px] text-slate-500">উইথড্র করতে কমপক্ষে ৩ জন সক্রিয় রেফারেল প্রয়োজন</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <AdminSaveButton
                  id="admin-save-user-balance-btn"
                  isDirty={true}
                  isSaving={isUserSaving}
                  isSaved={isUserSaved}
                  defaultText="Save Balance"
                  savingText="Saving Balance..."
                  savedText="Balance Saved! ✓"
                  onClick={handleSaveUserBalance}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Add New Video */}
        {showAddVideo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
              <h3 className="font-bold text-white text-base">Add New Earning Task</h3>

              <form onSubmit={handleCreateVideo} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Task / Video Title</label>
                  <input
                    type="text"
                    required
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    placeholder="e.g. Adsterra Direct Link Click Earning"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">পুরস্কার BDT (টাকা/পয়সা)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="যেমন: 6.00 ৳"
                      value={newVideoReward ? (parseFloat(newVideoReward) * 120).toFixed(2) : ''}
                      onChange={(e) => {
                        const bdt = parseFloat(e.target.value) || 0;
                        setNewVideoReward((bdt / 120).toFixed(4));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-amber-300 font-bold outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">টাকা লিখলে ডলারে কনভার্ট হবে</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Reward USD (ডলার)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newVideoReward}
                      onChange={(e) => setNewVideoReward(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-emerald-400 font-bold outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">ডলার লিখলে টাকায় কনভার্ট হবে</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (কাজের সময়সীমা)</label>
                  <input
                    type="text"
                    value={newVideoDuration}
                    onChange={(e) => setNewVideoDuration(e.target.value)}
                    placeholder="05:00"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subcategory / Tag</label>
                  <input
                    type="text"
                    value={newVideoSubCategory}
                    onChange={(e) => setNewVideoSubCategory(e.target.value)}
                    placeholder="Adsterra / Telegram / Marketing"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Thumbnail Image URL</label>
                  <input
                    type="url"
                    value={newVideoThumb}
                    onChange={(e) => setNewVideoThumb(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddVideo(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <AdminSaveButton
                    id="admin-publish-task-btn"
                    isDirty={Boolean(newVideoTitle.trim().length > 0)}
                    isSaving={isVideoSaving}
                    isSaved={isVideoSaved}
                    defaultText="Publish Task"
                    savingText="Publishing..."
                    savedText="Task Published! ✓"
                    type="submit"
                    className="flex-1"
                  />
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Edit Existing Video Task */}
        {editingVideo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">টাস্ক এডিট করুন (Edit Task)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateVideo} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">টাস্ক টাইটেল (Task Title)</label>
                  <input
                    type="text"
                    required
                    value={editingVideo.title}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">পুরস্কার BDT (টাকা/পয়সা)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingVideo.rewardUsd ? Number((editingVideo.rewardUsd * 120).toFixed(2)) : 0}
                      onChange={(e) => {
                        const bdt = parseFloat(e.target.value) || 0;
                        setEditingVideo({ ...editingVideo, rewardUsd: Number((bdt / 120).toFixed(4)) });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-amber-300 font-bold outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">টাকা লিখলে ডলারে কনভার্ট হবে</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">পুরস্কার USD (Reward)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingVideo.rewardUsd}
                      onChange={(e) => setEditingVideo({ ...editingVideo, rewardUsd: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-emerald-400 font-bold outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">ডলার লিখলে টাকায় কনভার্ট হবে</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">সময়সীমা (Duration)</label>
                  <input
                    type="text"
                    value={editingVideo.duration || '05:00'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    placeholder="05:00"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ট্যাগ / সাবক্যাটাগরি (Subcategory)</label>
                  <input
                    type="text"
                    value={editingVideo.subCategory || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, subCategory: e.target.value })}
                    placeholder="Telegram / Web / Income"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">থাম্বনেইল ইমেজ লিংক (Thumbnail URL)</label>
                  <input
                    type="url"
                    value={editingVideo.thumbnail || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingVideo(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    বাতিল (Cancel)
                  </button>
                  <AdminSaveButton
                    id="admin-update-video-btn"
                    isDirty={true}
                    isSaving={isEditVideoSaving}
                    isSaved={isEditVideoSaved}
                    defaultText="Save Changes (সংরক্ষণ করুন)"
                    savingText="সংরক্ষণ হচ্ছে..."
                    savedText="সফলভাবে সেভ হয়েছে! ✓"
                    type="submit"
                    className="flex-1"
                  />
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
