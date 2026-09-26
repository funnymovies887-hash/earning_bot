import React from 'react';
import {
  Play,
  Globe,
  Send,
  Target,
  Users,
  Flame,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Eye,
  AlertCircle,
  Save,
  Check,
  Search,
  Upload,
} from 'lucide-react';
import { IncomeTask, IncomeMethodCategory } from '../types';
import { formatMoney, toLocalizedDigits } from '../utils/formatters';
import { AdminFloatingToast, AdminToastData } from './admin/AdminFloatingToast';
import { AdminSaveButton } from './admin/AdminSaveButton';

interface IncomeMethodsConfig {
  ads: { enabled: boolean; rewardBdt: number; rewardUsd: number; dailyLimit: number; directAdUrl?: string };
  webVisit: { enabled: boolean; rewardBdt: number; rewardUsd: number };
  telegram: { enabled: boolean; rewardBdt: number; rewardUsd: number };
  mission: { enabled: boolean; rewardBdt: number; rewardUsd: number };
  referral: {
    enabled: boolean;
    bonusBdt: number;
    bonusUsd: number;
    commissionPercent: number;
    minActiveReferralsForWithdraw: number;
    minIncomeForActiveReferralBdt: number;
    minWithdrawBdt: number;
  };
}

interface AdminIncomeMethodsManagerProps {
  incomeMethods: IncomeMethodsConfig;
  setIncomeMethods: React.Dispatch<React.SetStateAction<IncomeMethodsConfig>>;
  onSaveIncomeMethods: (e: React.FormEvent) => void;
  methodsSaveStatus: string | null;
}

const PRESET_THUMBNAILS = [
  { label: 'Adsterra Ad', url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60' },
  { label: 'Website Visit', url: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=500&auto=format&fit=crop&q=60' },
  { label: 'Telegram Join', url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=500&auto=format&fit=crop&q=60' },
  { label: 'Marketing', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60' },
  { label: 'Crypto & Cash', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=60' },
  { label: 'Social & Share', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&auto=format&fit=crop&q=60' },
];

export const AdminIncomeMethodsManager: React.FC<AdminIncomeMethodsManagerProps> = ({
  incomeMethods,
  setIncomeMethods,
  onSaveIncomeMethods,
  methodsSaveStatus,
}) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'tasks' | 'add' | 'settings'>('tasks');
  const [tasks, setTasks] = React.useState<IncomeTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<AdminToastData | null>(null);

  // Save states for instant visual feedback
  const [isTaskSaved, setIsTaskSaved] = React.useState(false);
  const [isEditTaskSaved, setIsEditTaskSaved] = React.useState(false);
  const [isSettingsDirty, setIsSettingsDirty] = React.useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = React.useState(false);
  const [isSettingsSaved, setIsSettingsSaved] = React.useState(false);

  // Add Task Form State
  const [newTitle, setNewTitle] = React.useState('');
  const [newCategory, setNewCategory] = React.useState<IncomeMethodCategory>('visit');
  const [newSubCategory, setNewSubCategory] = React.useState('Adsterra Direct Link');
  const [newDestinationUrl, setNewDestinationUrl] = React.useState('');
  const [newRewardBdt, setNewRewardBdt] = React.useState<number>(1.50);
  const [newRewardUsd, setNewRewardUsd] = React.useState<number>(+(1.50 / 120).toFixed(6));
  const [newTimerSeconds, setNewTimerSeconds] = React.useState<number>(15);
  const [newMediaType, setNewMediaType] = React.useState<'image' | 'video' | 'file' | 'link' | 'none'>('link');
  const [newMediaUrl, setNewMediaUrl] = React.useState('');
  const [newInstructions, setNewInstructions] = React.useState('');
  const [newIsHot, setNewIsHot] = React.useState(true);
  const [newIsActive, setNewIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Edit Task State
  const [editingTask, setEditingTask] = React.useState<IncomeTask | null>(null);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setToast({
        type: 'error',
        title: 'অসম্পূর্ণ তথ্য',
        message: 'অনুগ্রহ করে টাস্কের শিরোনাম প্রদান করুন!',
      });
      return;
    }
    if (!newDestinationUrl.trim() && newCategory !== 'mission') {
      setToast({
        type: 'error',
        title: 'অসম্পূর্ণ তথ্য',
        message: 'অনুগ্রহ করে Adsterra ডিরেক্ট লিংক বা ওয়েবসাইট URL দিন!',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/tasks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          subCategory: newSubCategory,
          destinationUrl: newDestinationUrl,
          rewardBdt: newRewardBdt,
          rewardUsd: newRewardUsd,
          timerSeconds: newTimerSeconds,
          mediaType: newMediaType,
          mediaUrl: newMediaUrl,
          instructions: newInstructions,
          isHot: newIsHot,
          isActive: newIsActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsTaskSaved(true);
        setToast({
          type: 'success',
          title: 'টাস্ক সফলভাবে সংরক্ষিত!',
          message: `"${newTitle}" টাস্কটি সেভ হয়েছে এবং ব্যবহারকারীদের জন্য লাইভ হয়েছে।`,
        });
        await fetchTasks();
        setTimeout(() => {
          setIsTaskSaved(false);
          setNewTitle('');
          setNewDestinationUrl('');
          setNewMediaUrl('');
          setNewInstructions('');
          setActiveSubTab('tasks');
        }, 1800);
      } else {
        const err = await res.json();
        setToast({
          type: 'error',
          title: 'টাস্ক যোগ ব্যর্থ হয়েছে',
          message: err.error || 'Failed to add task',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'সার্ভার সংযোগ সমস্যা',
        message: 'টাস্ক যোগ করতে ব্যর্থ হয়েছে, পুনরায় চেষ্টা করুন।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const res = await fetch('/api/admin/tasks/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask),
      });

      if (res.ok) {
        setIsEditTaskSaved(true);
        setToast({
          type: 'success',
          title: 'টাস্ক আপডেট সম্পন্ন!',
          message: 'টাস্কের যাবতীয় পরিবর্তন সফলভাবে সংরক্ষণ করা হয়েছে।',
        });
        await fetchTasks();
        setTimeout(() => {
          setIsEditTaskSaved(false);
          setEditingTask(null);
        }, 1500);
      } else {
        const err = await res.json();
        setToast({
          type: 'error',
          title: 'আপডেট ব্যর্থ',
          message: err.error || 'Failed to edit task',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'ত্রুটি',
        message: 'টাস্ক আপডেট করতে ব্যর্থ হয়েছে।',
      });
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string, title: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${title}" টাস্কটি ডিলিট করতে চান?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/tasks/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setToast({
          type: 'delete',
          title: 'টাস্ক ডিলিট সম্পন্ন!',
          message: `"${title}" টাস্কটি সফলভাবে মুছে ফেলা হয়েছে।`,
        });
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        setToast({
          type: 'error',
          title: 'ডিলিট ব্যর্থ',
          message: 'টাস্কটি ডিলিট করা সম্ভব হয়নি।',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'ডিলিট সম্পন্ন হতে পারেনি।',
      });
    }
  };

  // Internal handler for Global Settings
  const handleSaveSettingsInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsSaving(true);
    try {
      await onSaveIncomeMethods(e);
      setIsSettingsDirty(false);
      setIsSettingsSaved(true);
      setToast({
        type: 'success',
        title: 'গ্লোবাল সেটিংস সংরক্ষিত!',
        message: 'রেফারেল বোনাস, কমিশন এবং উইথড্রল রুলস সফলভাবে সেভ হয়েছে।',
      });
      setTimeout(() => setIsSettingsSaved(false), 3500);
    } catch {
      setToast({
        type: 'error',
        title: 'সেভ ব্যর্থ হয়েছে',
        message: 'সেটিংস সেভ করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।',
      });
    } finally {
      setIsSettingsSaving(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch('/api/admin/tasks/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        const data = await res.json();
        showFeedback('🔄 ' + data.message);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: data.task.isActive } : t))
        );
      }
    } catch {
      showFeedback('❌ স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
    }
  };

  // Handle local image file upload preview
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২MB হতে হবে!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setNewMediaUrl(result);
      setNewMediaType('image');
      showFeedback('📷 ছবি সফলভাবে যুক্ত হয়েছে!');
    };
    reader.readAsDataURL(file);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.subCategory && task.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.destinationUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (cat: IncomeMethodCategory) => {
    switch (cat) {
      case 'ads':
        return { label: 'Views Ads', icon: Play, bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'visit':
        return { label: 'Web Visit / Adsterra', icon: Globe, bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'telegram':
        return { label: 'Telegram Task', icon: Send, bg: 'bg-sky-500/20 text-sky-400 border-sky-500/40' };
      case 'mission':
        return { label: 'Daily Mission', icon: Target, bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'special':
        return { label: 'Special Micro Task', icon: Sparkles, bg: 'bg-pink-500/20 text-pink-400 border-pink-500/40' };
      default:
        return { label: 'Task', icon: Globe, bg: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };

  return (
    <div id="admin-income-methods-manager" className="space-y-6 relative">
      {/* Floating Toast Notification */}
      <AdminFloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Header card with summary stats */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-purple-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                Full Control
              </span>
              <span className="text-xs font-bold text-purple-300">
                ৫টি ইনকাম মেথড ও টাস্ক ম্যানেজার
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <span>ইনকাম টাস্ক কন্ট্রোল সেন্টার</span>
              <Coins className="w-6 h-6 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Adsterra ডিরেক্ট লিংক, Monetag, ওয়েবসাইট ভিজিট, টেলিগ্রাম ও মিশন টাস্ক সরাসরি যুক্ত ও রিমুভ করুন। টাকায় পরিমাণ সেট করুন এবং সময়সীমা (টাইমার) নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchTasks}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('add')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন টাস্ক তৈরি করুন</span>
            </button>
          </div>
        </div>

        {/* Live status feedback toast */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-200 animate-fadeIn">
            {statusMessage}
          </div>
        )}

        {/* 5 Income Methods stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-5 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block font-semibold">মোট টাস্ক</span>
            <span className="text-lg font-black text-white">{tasks.length}টি</span>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center">
            <span className="text-[10px] text-amber-300 block font-semibold">১. Views Ads</span>
            <span className="text-lg font-black text-amber-400">
              {tasks.filter((t) => t.category === 'ads').length}টি
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-center">
            <span className="text-[10px] text-purple-300 block font-semibold">২. Web Visit (Adsterra)</span>
            <span className="text-lg font-black text-purple-300">
              {tasks.filter((t) => t.category === 'visit').length}টি
            </span>
          </div>
          <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-center">
            <span className="text-[10px] text-sky-300 block font-semibold">৩. Telegram</span>
            <span className="text-lg font-black text-sky-400">
              {tasks.filter((t) => t.category === 'telegram').length}টি
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
            <span className="text-[10px] text-emerald-300 block font-semibold">৪. Daily Mission</span>
            <span className="text-lg font-black text-emerald-400">
              {tasks.filter((t) => t.category === 'mission').length}টি
            </span>
          </div>
          <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20 text-center">
            <span className="text-[10px] text-pink-300 block font-semibold">৫. Special / Social</span>
            <span className="text-lg font-black text-pink-400">
              {tasks.filter((t) => t.category === 'special').length}টি
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'tasks'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>টাস্ক লিস্ট ও ম্যানেজমেন্ট ({tasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('add')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'add'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>নতুন টাস্ক তৈরি করুন (Add Task)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-slate-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>গ্লোবাল রেট ও উইথড্র রুলস</span>
        </button>
      </div>

      {/* ---------------- SUB-TAB 1: TASK MANAGEMENT LIST ---------------- */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            {/* Category filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                সকল ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('ads')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'ads'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Views Ads
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('visit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'visit'
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Web Visit (Adsterra)
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('telegram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'telegram'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('mission')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'mission'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Mission
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('special')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filterCategory === 'special'
                    ? 'bg-pink-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                Special
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="টাস্ক খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Task Cards Grid */}
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              টাস্ক লোড হচ্ছে...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <h4 className="text-sm font-bold text-white mb-1">কোনো টাস্ক পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 mb-4">
                এই ক্যাটাগরিতে এখনো কোনো টাস্ক যোগ করা হয়নি অথবা সার্চ মেলেনি।
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('add')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + নতুন টাস্ক যোগ করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTasks.map((task) => {
                const badge = getCategoryBadge(task.category);
                const CategoryIcon = badge.icon;

                return (
                  <div
                    key={task.id}
                    className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all ${
                      task.isActive
                        ? 'border-slate-800 hover:border-purple-500/50'
                        : 'border-rose-900/40 opacity-70 bg-slate-950'
                    }`}
                  >
                    {/* Top Row: Category & Badges & Status Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}
                        >
                          <CategoryIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                        {task.isHot && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-950 text-rose-400 border border-rose-600/40 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-rose-500" />
                            HOT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle active switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(task.id)}
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                            task.isActive
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {task.isActive ? '🟢 সক্রিয়' : '⚪ বন্ধ'}
                        </button>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => setEditingTask(task)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="এডিট করুন"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-all cursor-pointer"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Title, Image, Description */}
                    <div className="flex items-start gap-3">
                      {task.mediaUrl ? (
                        <img
                          src={task.mediaUrl}
                          alt={task.title}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <CategoryIcon className="w-6 h-6" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{task.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                          {task.instructions || 'নির্দেশনা দেওয়া নেই'}
                        </p>
                      </div>
                    </div>

                    {/* URL link preview */}
                    {task.destinationUrl && (
                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                          <LinkIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate text-slate-300 font-mono text-[10px]">
                            {task.destinationUrl}
                          </span>
                        </div>
                        <a
                          href={task.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-0.5 shrink-0"
                        >
                          <span>ভিজিট</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Footer: Reward in BDT, USD auto-convert, timer, completions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                          <span className="text-[10px] text-amber-300 block font-medium leading-none">
                            রিওয়ার্ড (টাকা)
                          </span>
                          <span className="font-extrabold text-amber-400 text-xs">
                            ৳ {task.rewardBdt.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          <span>≈ ${task.rewardUsd.toFixed(4)} USD</span>
                          <span className="block text-slate-500">
                            (অটো কনভার্ট)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        {task.timerSeconds > 0 && (
                          <span className="flex items-center gap-1 font-bold text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {task.timerSeconds}s
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {toLocalizedDigits(task.totalCompletions || 0, 'bn')} বার সম্পন্ন
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- SUB-TAB 2: ADD NEW TASK FORM ---------------- */}
      {activeSubTab === 'add' && (
        <form
          onSubmit={handleCreateTask}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl"
        >
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>নতুন ইনকাম টাস্ক তৈরি করুন (Create Task)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Adsterra ডিরেক্ট লিংক, ওয়েবসাইট ভিজিট বা যেকোনো ক্যাটাগরিতে কাজ যুক্ত করুন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field 1: Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                টাস্কের শিরোনাম বা নাম (Title) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="উদা: Adsterra হাই-সিপিএম ডিরেক্ট লিংক ভিজিট ১"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            {/* Field 2: Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ইনকাম মেথড ক্যাটাগরি (Method Category) <span className="text-rose-400">*</span>
              </label>
              <select
                value={newCategory}
                onChange={(e) => {
                  const val = e.target.value as IncomeMethodCategory;
                  setNewCategory(val);
                  if (val === 'visit') setNewSubCategory('Adsterra Direct Link');
                  if (val === 'ads') setNewSubCategory('Video Ads');
                  if (val === 'telegram') setNewSubCategory('Telegram Channel');
                  if (val === 'mission') setNewSubCategory('Daily Mission');
                  if (val === 'special') setNewSubCategory('Micro Task');
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              >
                <option value="visit">২. Web Visit / Adsterra ডিরেক্ট লিংক</option>
                <option value="ads">১. Views Ads (ভিডিও বিজ্ঞাপন)</option>
                <option value="telegram">৩. Telegram Task (চ্যানেল জয়েন)</option>
                <option value="mission">৪. Daily Mission (দৈনিক মিশন)</option>
                <option value="special">৫. Special / Social Micro Tasks</option>
              </select>
              <span className="text-[10px] text-purple-300 mt-1 block">
                যে ক্যাটাগরি সেট করবেন ব্যবহারকারীর অ্যাপে সেই ক্যাটাগরিতেই টাস্কটি দেখাবে।
              </span>
            </div>

            {/* Field 3: Sub Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                সাব-ক্যাটাগরি বা ট্যাগ (Sub Category)
              </label>
              <input
                type="text"
                placeholder="উদা: Adsterra Direct Link, Monetag, PTC Visit"
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            {/* Field 4: Destination URL (Adsterra Direct Link) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Adsterra ডিরেক্ট লিংক বা ওয়েবসাইট URL <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-amber-400 font-semibold">
                  💡 Adsterra / Monetag / Telegram Link
                </span>
              </div>
              <input
                type="url"
                required={newCategory !== 'mission'}
                placeholder="https://www.profitablecpmrate.com/your-adsterra-direct-link"
                value={newDestinationUrl}
                onChange={(e) => setNewDestinationUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                ব্যবহারকারী যখন "ভিজিট করুন" বাটনে ক্লিক করবে, এই লিংকটি ওপেন হবে এবং নির্ধারিত সেকেন্ড শেষ হওয়ার পর সে টাকা পাবে।
              </p>
            </div>

            {/* Field 5: Bangla Taka / Poysha Reward Input */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-extrabold text-amber-300">
                টাস্কের পারিশ্রমিক (বাংলা টাকা বা পয়সা / ইউএস ডলার)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newRewardBdt}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewRewardBdt(val);
                      setNewRewardUsd(+(val / 120).toFixed(6));
                    }}
                    className="w-full bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="BDT (টাকা/পয়সা)"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">টাকায় বা পয়সায় (উদা: 0.15)</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={newRewardUsd}
                    onChange={(e) => {
                      const usd = parseFloat(e.target.value) || 0;
                      setNewRewardUsd(usd);
                      setNewRewardBdt(+(usd * 120).toFixed(4));
                    }}
                    className="w-full bg-slate-900 border border-emerald-500/50 focus:border-emerald-400 rounded-xl pl-8 pr-3 py-2 text-sm text-emerald-400 font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="USD (ডলার)"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">ডলারে (উদা: 0.00125)</span>
                </div>
              </div>

              {/* Automatic Currency Conversion Preview */}
              <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1">
                <span className="text-slate-400 block font-semibold">অটো কারেন্সি কনভার্ট প্রিভিউ:</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-amber-300 font-bold">
                    ৳ {newRewardBdt.toFixed(2)} BDT
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-400 font-bold">
                    ${newRewardUsd > 0 && newRewardUsd < 0.01 ? newRewardUsd.toFixed(5) : (newRewardBdt / 120).toFixed(4)} USD
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-sky-300 font-bold">
                    ₹{((newRewardBdt / 120) * 87).toFixed(2)} INR
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  ইউজার তার প্রোফাইলে যে কারেন্সি সেট করে রাখবে, স্বয়ংক্রিয়ভাবে সে অনুযায়ী কনভার্ট হয়ে দেখাবে।
                </span>
              </div>
            </div>

            {/* Field 6: Timer Duration (Seconds) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-extrabold text-indigo-300">
                টাইমার বা সময়সীমা (সেকেন্ড)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={newTimerSeconds}
                  onChange={(e) => setNewTimerSeconds(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-indigo-500/50 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-sm text-white font-black outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                  সেকেন্ড (s)
                </span>
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500">কুইক সিলেক্ট:</span>
                {[5, 10, 15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setNewTimerSeconds(sec)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      newTimerSeconds === sec
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block">
                ইউজারকে সাইট বা ভিডিওতে এত সেকেন্ড অপেক্ষা করার পর রিওয়ার্ড দেওয়া হবে।
              </span>
            </div>

            {/* Field 7: Image / Thumbnail Upload or URL */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                ছবি বা ব্যানার থাম্বনেইল (Image / File / Video Preview)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="url"
                  placeholder="ইমেজ URL দিন (https://...)"
                  value={newMediaUrl}
                  onChange={(e) => {
                    setNewMediaUrl(e.target.value);
                    if (e.target.value) setNewMediaType('image');
                  }}
                  className="w-full sm:flex-1 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />

                <label className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>ফাইল আপলোড</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset Thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                <span className="text-[10px] text-slate-400 shrink-0">রেডিমেড ছবি:</span>
                {PRESET_THUMBNAILS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewMediaUrl(preset.url);
                      setNewMediaType('image');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white shrink-0 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Preview */}
              {newMediaUrl && (
                <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <img
                    src={newMediaUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[11px] text-slate-300">
                    <span className="text-emerald-400 font-bold block">ছবি প্রিভিউ সফল</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-xs block">
                      {newMediaUrl}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Field 8: Instructions */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                কাজের নিয়মাবলী বা নির্দেশনা (Task Instructions)
              </label>
              <textarea
                rows={2}
                placeholder="উদা: লিংকে ক্লিক করে ১৫ সেকেন্ড অপেক্ষা করুন। টাইমার শেষ হলে টাকা অটোমেটিক জমা হবে।"
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* Field 9: Checkboxes */}
            <div className="flex items-center gap-6 md:col-span-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={newIsHot}
                  onChange={(e) => setNewIsHot(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  HOT ব্যাজ প্রদর্শন করুন
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-0"
                />
                <span>তৈরির সাথে সাথেই টাস্কটি সক্রিয় (Active) রাখুন</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveSubTab('tasks')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              বাতিল
            </button>
            <AdminSaveButton
              id="save-task-btn"
              isDirty={Boolean(newTitle.trim().length > 0 && (newCategory === 'mission' || newDestinationUrl.trim().length > 0))}
              isSaving={isSubmitting}
              isSaved={isTaskSaved}
              defaultText="টাস্ক সেভ ও পাবলিশ করুন"
              savingText="টাস্ক সেভ হচ্ছে..."
              savedText="টাস্ক সফলভাবে সেভ হয়েছে! ✓"
              type="submit"
            />
          </div>
        </form>
      )}

      {/* ---------------- SUB-TAB 3: GLOBAL SETTINGS & WITHDRAWAL RULES ---------------- */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettingsInternal} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <span>রেফারেল প্রোগ্রাম ও উইথড্রল রুলস কন্ট্রোল</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার চাহিদা অনুযায়ী: প্রতি রেফারে ১০ টাকা বোনাস, ৫% আজীবন কমিশন, সর্বনিম্ন ২৫ টাকা উইথড্র ও ৩ জন সক্রিয় রেফারেল রুলস।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Direct Ad URL for Hero Button */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/40 sm:col-span-2">
                <label className="block text-xs font-bold text-purple-300 mb-1 flex items-center justify-between">
                  <span>"বিজ্ঞাপন দেখুন ও আয় করুন" হিরো বাটন ডিরেক্ট লিংক (Direct Ad URL)</span>
                  <span className="text-[10px] text-emerald-400 font-extrabold">লাইভ একটিভ</span>
                </label>
                <input
                  type="url"
                  placeholder="https://omg10.com/4/11869572"
                  value={incomeMethods.ads.directAdUrl || ''}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setIncomeMethods({
                      ...incomeMethods,
                      ads: { ...incomeMethods.ads, directAdUrl: e.target.value.trim() },
                    });
                  }}
                  className="w-full bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  ইউজার যখন "বিজ্ঞাপন দেখুন ও আয় করুন" বাটনে চাপবে, তখন এই লিংকের বিজ্ঞাপন নতুন ট্যাবে ওপেন হবে।
                </span>
              </div>

              {/* Reward Per Ad in BDT */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  প্রতি বিজ্ঞাপনের পারিশ্রমিক (টাকা / BDT)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={incomeMethods.ads.rewardBdt}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    const bdt = parseFloat(e.target.value) || 0;
                    setIncomeMethods({
                      ...incomeMethods,
                      ads: {
                        ...incomeMethods.ads,
                        rewardBdt: bdt,
                        rewardUsd: +(bdt / 120).toFixed(6),
                      },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                />
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  ইউএসডি: ${Number(incomeMethods.ads.rewardUsd || 0.0125).toFixed(4)} USD ($1 = ৳120)
                </span>
              </div>

              {/* Daily ad limit */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  দৈনিক কাজের সর্বোচ্চ লিমিট (All 5 Tasks / Day)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={incomeMethods.ads.dailyLimit}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setIncomeMethods({
                      ...incomeMethods,
                      ads: { ...incomeMethods.ads, dailyLimit: parseInt(e.target.value) || 40 },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                />
                <span className="text-[10px] text-amber-400 mt-1 block">ডিফল্ট: ৪০টি কাজ/দিন (৫টি মেথড মিলিয়ে)</span>
              </div>

              {/* Referral Bonus */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  প্রতি অ্যাক্টিভ রেফারে বোনাস (টাকা)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={incomeMethods.referral.bonusBdt}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    const val = parseFloat(e.target.value) || 0;
                    setIncomeMethods({
                      ...incomeMethods,
                      referral: { ...incomeMethods.referral, bonusBdt: val, bonusUsd: val / 120 },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-pink-400 mt-1 block">নির্ধারিত: ১০ টাকা</span>
              </div>

              {/* Commission */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  আজীবন রেফারেল কমিশন (%)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={incomeMethods.referral.commissionPercent}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setIncomeMethods({
                      ...incomeMethods,
                      referral: { ...incomeMethods.referral, commissionPercent: parseFloat(e.target.value) || 5 },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-amber-400 mt-1 block">নির্ধারিত: ৫% কমিশন</span>
              </div>

              {/* Min Withdraw */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  সর্বনিম্ন উত্তোলন ব্যালেন্স (টাকা)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={incomeMethods.referral.minWithdrawBdt}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setIncomeMethods({
                      ...incomeMethods,
                      referral: { ...incomeMethods.referral, minWithdrawBdt: parseFloat(e.target.value) || 25 },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-emerald-400 mt-1 block">নির্ধারিত: ২৫ টাকা</span>
              </div>

              {/* Active Referrals Required */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  উত্তোলনের জন্য প্রয়োজনীয় অ্যাক্টিভ রেফার
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={incomeMethods.referral.minActiveReferralsForWithdraw}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setIncomeMethods({
                      ...incomeMethods,
                      referral: { ...incomeMethods.referral, minActiveReferralsForWithdraw: parseInt(e.target.value) || 3 },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-blue-400 mt-1 block">উইথড্র করতে ৩ জন সক্রিয় রেফার</span>
              </div>

              {/* Active threshold */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  সক্রিয় হতে রেফারের প্রয়োজনীয় ইনকাম (টাকা)
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={incomeMethods.referral.minIncomeForActiveReferralBdt}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setIncomeMethods({
                      ...incomeMethods,
                      referral: { ...incomeMethods.referral, minIncomeForActiveReferralBdt: parseFloat(e.target.value) || 10 },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-purple-300 mt-1 block">১০০০ টাকার বদলে মাত্র ১০ টাকা</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <AdminSaveButton
                id="admin-save-settings-btn"
                isDirty={isSettingsDirty}
                isSaving={isSettingsSaving}
                isSaved={isSettingsSaved}
                defaultText="গ্লোবাল সেটিংস সেভ করুন (Save Settings)"
                savingText="সেটিংস সংরক্ষণ হচ্ছে..."
                savedText="সেটিংস সফলভাবে সেভ হয়েছে! ✓"
                type="submit"
              />
              {methodsSaveStatus && (
                <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  {methodsSaveStatus}
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ---------------- EDIT TASK MODAL ---------------- */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-400" />
                <span>টাস্ক এডিট করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">টাস্কের নাম</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">ক্যাটাগরি</label>
                  <select
                    value={editingTask.category}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        category: e.target.value as IncomeMethodCategory,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="visit">Web Visit / Adsterra</option>
                    <option value="ads">Views Ads</option>
                    <option value="telegram">Telegram</option>
                    <option value="mission">Mission</option>
                    <option value="special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">সাব-ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={editingTask.subCategory || ''}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, subCategory: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Adsterra ডিরেক্ট লিংক / URL
                </label>
                <input
                  type="url"
                  value={editingTask.destinationUrl}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, destinationUrl: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    টাস্ক রিওয়ার্ড BDT (টাকা/পয়সা)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingTask.rewardBdt}
                    onChange={(e) => {
                      const bdt = parseFloat(e.target.value) || 0;
                      setEditingTask({
                        ...editingTask,
                        rewardBdt: bdt,
                        rewardUsd: +(bdt / 120).toFixed(6),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-emerald-400 mt-0.5 block font-mono">
                    ≈ ${((editingTask.rewardUsd !== undefined ? editingTask.rewardUsd : editingTask.rewardBdt / 120)).toFixed(5)} USD
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    টাস্ক রিওয়ার্ড USD (ডলার)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingTask.rewardUsd !== undefined ? editingTask.rewardUsd : +(editingTask.rewardBdt / 120).toFixed(5)}
                    onChange={(e) => {
                      const usd = parseFloat(e.target.value) || 0;
                      setEditingTask({
                        ...editingTask,
                        rewardUsd: usd,
                        rewardBdt: +(usd * 120).toFixed(4),
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[10px] text-amber-300 mt-0.5 block font-mono">
                    ≈ ৳{(editingTask.rewardBdt).toFixed(2)} BDT
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  টাইমার বা সময়সীমা (সেকেন্ড)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="600"
                  value={editingTask.timerSeconds}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      timerSeconds: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ইমেজ বা ফাইল URL</label>
                <input
                  type="url"
                  value={editingTask.mediaUrl || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, mediaUrl: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">নির্দেশনা</label>
                <textarea
                  rows={2}
                  value={editingTask.instructions || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, instructions: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTask.isHot || false}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, isHot: e.target.checked })
                    }
                    className="rounded border-slate-700 text-purple-600"
                  />
                  <span>HOT ব্যাজ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTask.isActive}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, isActive: e.target.checked })
                    }
                    className="rounded border-slate-700 text-purple-600"
                  />
                  <span>সক্রিয় (Active)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  বাতিল
                </button>
                <AdminSaveButton
                  id="admin-edit-task-save-btn"
                  isDirty={Boolean(editingTask.title.trim().length > 0)}
                  isSaving={false}
                  isSaved={isEditTaskSaved}
                  defaultText="আপডেট সেভ করুন"
                  savingText="আপডেট সংরক্ষণ হচ্ছে..."
                  savedText="আপডেট সম্পন্ন হয়েছে! ✓"
                  type="submit"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
