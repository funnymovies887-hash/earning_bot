import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  HardDrive,
  Github,
  Info,
  Clock,
  Sparkles,
  Layers,
  ArrowDownCircle,
  HelpCircle,
  Key,
  Eye,
  EyeOff,
  Check,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdminToastData } from './AdminFloatingToast';
import { performAutoSync } from '../../utils/adminAutoSync';

interface AdminDataBackupTabProps {
  onRefreshAllData?: () => void;
  showToast?: (toast: AdminToastData) => void;
}

export const AdminDataBackupTab: React.FC<AdminDataBackupTabProps> = ({
  onRefreshAllData,
  showToast,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isAutoSyncingNow, setIsAutoSyncingNow] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [browserBackupTime, setBrowserBackupTime] = useState<string | null>(null);

  // GitHub Direct Auto-Sync states
  const [ghRepo, setGhRepo] = useState('');
  const [ghBranch, setGhBranch] = useState('main');
  const [ghToken, setGhToken] = useState('');
  const [ghHasToken, setGhHasToken] = useState(false);
  const [ghAutoSyncOnChange, setGhAutoSyncOnChange] = useState(true);
  const [ghLastSyncedAt, setGhLastSyncedAt] = useState<string | null>(null);
  const [ghLastStatus, setGhLastStatus] = useState<string | null>(null);
  const [ghShowToken, setGhShowToken] = useState(false);
  const [isTestingGh, setIsTestingGh] = useState(false);
  const [isSavingGh, setIsSavingGh] = useState(false);
  const [isPushingGh, setIsPushingGh] = useState(false);
  const [ghFeedback, setGhFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showGhTokenGuide, setShowGhTokenGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current live DB stats
  const fetchDbStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backup/export');
      if (res.ok) {
        const data = await res.json();
        setStats(data.counts || {});
        // Also auto-save to browser's localStorage as a safety net!
        if (data.data) {
          try {
            localStorage.setItem('admin_offline_db_backup', JSON.stringify(data));
            const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString();
            localStorage.setItem('admin_offline_db_backup_time', nowStr);
            setBrowserBackupTime(nowStr);
          } catch (e) {
            console.warn('LocalStorage limit exceeded for offline backup', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch DB stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbStats();
    fetchGhConfig();
    const savedTime = localStorage.getItem('admin_offline_db_backup_time');
    if (savedTime) setBrowserBackupTime(savedTime);
  }, []);

  // Fetch GitHub sync config
  const fetchGhConfig = async () => {
    try {
      const res = await fetch('/api/admin/github-sync/config');
      if (res.ok) {
        const data = await res.json();
        if (data.repo) setGhRepo(data.repo);
        if (data.branch) setGhBranch(data.branch);
        setGhHasToken(data.hasToken);
        setGhAutoSyncOnChange(data.autoSyncOnChange !== false);
        setGhLastSyncedAt(data.lastSyncedAt || null);
        setGhLastStatus(data.lastStatus || null);

        // Auto re-hydrate server from client vault if server restarted / disk refreshed
        if (!data.hasToken) {
          const cachedToken = localStorage.getItem('admin_github_vault_token');
          const cachedRepo = localStorage.getItem('admin_github_vault_repo') || data.repo;
          const cachedBranch = localStorage.getItem('admin_github_vault_branch') || data.branch || 'main';
          if (cachedToken && cachedRepo) {
            fetch('/api/admin/github-sync/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                repo: cachedRepo,
                branch: cachedBranch,
                token: cachedToken,
                autoSyncOnChange: true,
              }),
            })
              .then((r) => r.json())
              .then((rehydrated) => {
                if (rehydrated.success) {
                  setGhHasToken(true);
                  if (rehydrated.config?.repo) setGhRepo(rehydrated.config.repo);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch {}
  };

  // Test connection
  const handleTestGhConnection = async () => {
    setIsTestingGh(true);
    setGhFeedback(null);
    try {
      const tokenToTest = ghToken.trim() || localStorage.getItem('admin_github_vault_token') || '';
      const res = await fetch('/api/admin/github-sync/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: ghRepo, token: tokenToTest }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGhFeedback({ type: 'success', message: data.message });
        if (showToast) {
          showToast({
            type: 'success',
            title: 'কানেকশন সফল!',
            message: `GitHub রিপোজিটরি ${data.repoName}-এর সাথে সফলভাবে কানেক্ট হয়েছে।`,
          });
        }
      } else {
        setGhFeedback({ type: 'error', message: data.error || 'GitHub সংযোগ ব্যর্থ হয়েছে' });
      }
    } catch (err: any) {
      setGhFeedback({ type: 'error', message: 'নেটওয়ার্ক ত্রুটি: ' + err.message });
    } finally {
      setIsTestingGh(false);
    }
  };

  // Save GitHub configuration
  const handleSaveGhConfig = async () => {
    setIsSavingGh(true);
    setGhFeedback(null);
    try {
      const activeToken = ghToken.trim() || localStorage.getItem('admin_github_vault_token') || '';
      const res = await fetch('/api/admin/github-sync/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: ghRepo,
          branch: ghBranch,
          token: activeToken,
          autoSyncOnChange: ghAutoSyncOnChange,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGhHasToken(data.config?.hasToken || !!activeToken);
        if (activeToken) {
          try {
            localStorage.setItem('admin_github_vault_token', activeToken);
            localStorage.setItem('admin_github_vault_repo', ghRepo);
            localStorage.setItem('admin_github_vault_branch', ghBranch);
          } catch {}
        }
        setGhToken(''); // clear token input for security
        setGhFeedback({
          type: 'success',
          message: '✅ GitHub অটো-সিঙ্ক কনফিগারেশন সফলভাবে সেভ হয়েছে! এখন থেকে প্যাকেজ যোগ বা ডিলিট করলে সরাসরি গিটহাবে অটো-কমিট হবে।',
        });
        if (showToast) {
          showToast({
            type: 'success',
            title: 'সেটিংস সংরক্ষিত!',
            message: 'GitHub অটো-সিঙ্ক সক্রিয় করা হয়েছে।',
          });
        }
        fetchGhConfig();
      } else {
        setGhFeedback({ type: 'error', message: data.error || 'সেটিংস সেভ করা যায়নি' });
      }
    } catch (err: any) {
      setGhFeedback({ type: 'error', message: 'সার্ভার ত্রুটি: ' + err.message });
    } finally {
      setIsSavingGh(false);
    }
  };

  // Direct push all data to GitHub
  const handlePushAllToGitHub = async () => {
    setIsPushingGh(true);
    setGhFeedback(null);
    try {
      const res = await fetch('/api/admin/github-sync/push', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGhFeedback({
          type: 'success',
          message: data.message,
        });
        if (showToast) {
          showToast({
            type: 'success',
            title: 'GitHub অটো-কমিট সম্পন্ন!',
            message: 'আপনার সমস্ত প্যাকেজ ও ডেটা ফাইল সরাসরি GitHub-এ সেভ হয়েছে।',
          });
        }
        fetchDbStats();
        fetchGhConfig();
        if (onRefreshAllData) onRefreshAllData();
      } else {
        setGhFeedback({
          type: 'error',
          message: data.error || data.message || 'পুশ ব্যর্থ হয়েছে',
        });
      }
    } catch (err: any) {
      setGhFeedback({ type: 'error', message: 'নেটওয়ার্ক ত্রুটি: ' + err.message });
    } finally {
      setIsPushingGh(false);
    }
  };

  // 1. Export Full Database JSON Download
  const handleExportFullBackup = async () => {
    setIsExporting(true);
    setRestoreStatus(null);
    try {
      const res = await fetch('/api/admin/backup/export');
      if (!res.ok) throw new Error('সার্ভার থেকে ব্যাকআপ জেনারেট করতে ব্যর্থ হয়েছে।');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `cholo_income_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (showToast) {
        showToast({
          type: 'success',
          title: 'ব্যাকআপ ডাউনলোড সম্পন্ন!',
          message: 'সম্পূর্ণ ডাটাবেজের ব্যাকআপ ফাইল আপনার ডিভাইসে সেভ হয়েছে।',
        });
      }
      setRestoreStatus({
        type: 'success',
        message: '✅ সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!',
      });
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: '❌ ডাউনলোড ব্যর্থ: ' + (err.message || 'অজানা সমস্যা'),
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Handle File Upload Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRestoreJsonText(text);
    };
    reader.readAsText(file);
  };

  // 3. Restore from JSON
  const handleRestoreBackup = async (payloadOverride?: any) => {
    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      let payloadToRestore = payloadOverride;
      if (!payloadToRestore) {
        if (!restoreJsonText.trim()) {
          throw new Error('অনুগ্রহ করে একটি ব্যাকআপ ফাইল নির্বাচন করুন অথবা JSON ডাটা পেস্ট করুন।');
        }
        try {
          payloadToRestore = JSON.parse(restoreJsonText);
        } catch {
          throw new Error('অবৈধ JSON ফাইল! ব্যাকআপ ফাইলের ফরম্যাট সঠিক নয়।');
        }
      }

      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToRestore),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'রিস্টোর করতে সমস্যা হয়েছে।');
      }

      setRestoreStatus({
        type: 'success',
        message: data.message || '✅ ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!',
      });

      if (showToast) {
        showToast({
          type: 'success',
          title: 'ডাটা রিস্টোর সফল!',
          message: data.message || 'সকল প্যাকেজ, ইউজার ও সেটিংস সার্ভারে রিস্টোর হয়েছে।',
        });
      }

      // Re-fetch everything
      fetchDbStats();
      if (onRefreshAllData) {
        onRefreshAllData();
      }

      // Reset file input
      setRestoreJsonText('');
      setSelectedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: '❌ রিস্টোর ত্রুটি: ' + (err.message || 'ব্যর্থ হয়েছে'),
      });
      if (showToast) {
        showToast({
          type: 'error',
          title: 'রিস্টোর ব্যর্থ!',
          message: err.message,
        });
      }
    } finally {
      setIsRestoring(false);
    }
  };

  // 4. Restore from Browser LocalStorage Auto-Backup
  const handleRestoreFromBrowserBackup = () => {
    const raw = localStorage.getItem('admin_offline_db_backup');
    if (!raw) {
      setRestoreStatus({
        type: 'error',
        message: '⚠️ ব্রাউজারে কোনো অটো-ব্যাকআপ পাওয়া যায়নি।',
      });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      handleRestoreBackup(parsed);
    } catch (err: any) {
      setRestoreStatus({
        type: 'error',
        message: 'ব্রাউজারের ব্যাকআপ ফাইল পড়া যায়নি: ' + err.message,
      });
    }
  };

  // 5. Download individual JSON files for GitHub repository
  const downloadSingleFile = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/api/admin/backup/file/${filename}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 6. 1-Click Intelligent Auto-Sync
  const handleTriggerAutoSync = async () => {
    setIsAutoSyncingNow(true);
    setRestoreStatus(null);
    try {
      const res = await performAutoSync(true);
      if (res.success) {
        setRestoreStatus({
          type: 'success',
          message: res.message || '✅ ডাটাবেজ সফলভাবে অটো-সিঙ্ক ও সুরক্ষিত হয়েছে!',
        });
        if (showToast) {
          showToast({
            type: 'success',
            title: 'অটো-সিঙ্ক সফল!',
            message: 'আপনার সকল প্যাকেজ ও ব্যবহারকারী অক্ষত ও সংরক্ষিত রয়েছে।',
          });
        }
        fetchDbStats();
        if (onRefreshAllData) onRefreshAllData();
      } else {
        setRestoreStatus({
          type: 'error',
          message: '❌ সিঙ্ক সমস্যা: ' + res.message,
        });
      }
    } catch (e: any) {
      setRestoreStatus({
        type: 'error',
        message: '❌ সিঙ্ক ত্রুটি: ' + (e.message || 'ব্যর্থ হয়েছে'),
      });
    } finally {
      setIsAutoSyncingNow(false);
    }
  };

  return (
    <div className="space-y-6 text-white select-none">
      {/* Page Title & Intro */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ডাটা ব্যাকআপ, রিস্টোর ও গিটহাব সিঙ্ক
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                PRO ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              অ্যাডমিন প্যানেলে যা যা যুক্ত করবেন তা আজীবন সুরক্ষিত রাখুন। কোড পরিবর্তনের পরও ১-ক্লিকে ফিরিয়ে আনুন।
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchDbStats}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>ডাটা রিফ্রেশ করুন</span>
        </button>
      </div>

      {/* WHY DATA IS LOST & EXACT SOLUTION (Clear & reassuring explanation) */}
      <div className="bg-amber-950/30 border-2 border-amber-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-sm sm:text-base text-amber-300">
              💡 কোড আপডেট করার পর ডাটা কেন মুছে গিয়েছিল এবং স্থায়ী সমাধানের উপায়:
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">কারণ:</strong> যখন Render বা ক্লাউড হোস্টিংয়ে আপনার অ্যাপ চলে এবং আপনি GitHub-এ নতুন কোড পুশ করেন, তখন Render আগের সার্ভার মুছে দিয়ে একটি <span className="text-amber-300 font-semibold">সম্পূর্ণ নতুন ফ্রেশ সার্ভার</span> চালু করে। যদি GitHub-এর <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">data/</code> ফোল্ডারে আপনার নতুন প্যাকেজ বা ব্যবহারকারীর তথ্য না থাকে (বরং ডিফল্ট ফাইল থাকে), তবে নতুন সার্ভার চালু হলেই আগের লাইভ ডাটা মুছে যায়।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3">
                <span className="text-amber-400 font-black text-xs block mb-1">১. ব্যাকআপ ডাউনলোড রাখুন</span>
                <p className="text-[11px] text-slate-400">
                  অ্যাডমিন প্যানেলে নতুন কিছু যোগ করার পর নিচে <strong className="text-slate-200">"সম্পূর্ণ ব্যাকআপ ডাউনলোড"</strong> বাটনে চাপ দিয়ে একটি ব্যাকআপ ফাইল সেভ রাখুন।
                </p>
              </div>
              <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3">
                <span className="text-emerald-400 font-black text-xs block mb-1">২. ১-ক্লিকে রিস্টোর করুন</span>
                <p className="text-[11px] text-slate-400">
                  GitHub-এ যতবারই নতুন কোড পুশ করুন, অ্যাপ চালু হলে এই পেজে এসে ব্যাকআপ ফাইলটি আপলোড দিলেই <strong className="text-slate-200">১ সেকেন্ডে সব আগের মতো ফিরে আসবে</strong>!
                </p>
              </div>
              <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3">
                <span className="text-blue-400 font-black text-xs block mb-1">৩. GitHub-এ data/ ফাইল রাখুন</span>
                <p className="text-[11px] text-slate-400">
                  নিচের সেকশন থেকে আপনার <code className="text-cyan-300">packages.json</code> ও <code className="text-cyan-300">users.json</code> ডাউনলোড করে GitHub-এর <code className="text-cyan-300">data/</code> ফোল্ডারে রেখে দিলে স্থায়ী থাকবে।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 0. AUTO-SYNC & AUTO-RESTORE STATUS CARD */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  ⚡ স্মার্ট অটো-সিঙ্ক ও পার্মানেন্ট সেভ
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  জিরো ডাটা লস
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                অ্যাডমিন প্যানেলে যা যা যুক্ত করবেন, তা আপনার ব্রাউজার ভল্টে অটো-সেভ থাকে। কোড আপডেট বা নতুন ডেপ্লয়মেন্টের পরেও এই একটি বাটন চাপলেই সার্ভারে স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে যাবে—একটি প্যাকেজ বা একাউন্টও হারাবে না!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="admin-backup-tab-auto-sync-btn"
              onClick={handleTriggerAutoSync}
              disabled={isAutoSyncingNow}
              className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className={`w-4 h-4 ${isAutoSyncingNow ? 'animate-spin' : ''}`} />
              <span>{isAutoSyncingNow ? 'সিঙ্ক করা হচ্ছে...' : '🔄 এখনই ১-ক্লিকে অটো-সিঙ্ক করুন'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Feedback Alert */}
      {restoreStatus && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border shadow-lg ${
            restoreStatus.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}
        >
          {restoreStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Current Live Database Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">প্যাকেজ ক্যাটালগ</span>
          <span className="text-xl sm:text-2xl font-black text-purple-400 mt-1">
            {stats ? stats.packages : '...'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">ডিজিটাল প্যাকেজ</span>
        </div>

        <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">মোট ইউজার</span>
          <span className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
            {stats ? stats.users : '...'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">এক্টিভ একাউন্ট</span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">স্টোর অর্ডার</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {stats ? stats.orders : '...'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">ক্রয় আবেদন</span>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">উইথড্র রিকোয়েস্ট</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            {stats ? stats.withdrawals : '...'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">পেমেন্ট হিস্টোরি</span>
        </div>

        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">লকড ভিডিও</span>
          <span className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
            {stats ? stats.adVideos : '...'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">৯০ মি. এক্সপায়ারি</span>
        </div>

        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-md">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">ইনকাম টাস্ক</span>
          <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">
            {stats ? (stats.videos || 0) + (stats.tasks || 0) : '...'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">ভিডিও ও মেথড</span>
        </div>
      </div>

      {/* TWO PRIMARY ACTIONS: EXPORT & RESTORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Action 1: Export Full Database */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                ১. সম্পূর্ণ ডাটা ১-ক্লিকে ব্যাকআপ ডাউনলোড
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              একটি ক্লিকেই সম্পূর্ণ সিস্টেমের সকল প্যাকেজ, ইউজার ব্যালেন্স, বিকাশ/নগদ নম্বর, অর্ডার, উইথড্র ও সেটিংস একটি একক <code className="text-amber-300 font-mono">.json</code> ফাইলে সেভ হয়ে আপনার ডিভাইসে ডাউনলোড হবে।
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ফাইল ফরম্যাট:</span>
              <span className="text-white font-mono font-bold">JSON (.json)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>অন্তর্ভুক্ত মডিউল:</span>
              <span className="text-emerald-400 font-bold">১১টি ডাটাবেজ টেবিল</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ব্রাউজার অটো-ব্যাকআপ:</span>
              <span className="text-amber-300 font-mono">{browserBackupTime || 'সক্রিয়'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportFullBackup}
            disabled={isExporting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'ব্যাকআপ প্রস্তুত হচ্ছে...' : '📥 সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড করুন'}</span>
          </button>
        </div>

        {/* Action 2: Restore from Backup */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                ২. ১-ক্লিকে ব্যাকআপ রিস্টোর / আপলোড
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              GitHub-এ নতুন কোড পুশ করার পর বা সার্ভার রিস্টার্ট হলে আপনার সংরক্ষিত ব্যাকআপ ফাইলটি এখানে সিলেক্ট করে রিস্টোর বাটনে চাপ দিন। সাথে সাথে সব আগের মতো লোড হবে।
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id="backup-file-upload-input"
          />

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-slate-950/60 p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors"
            >
              <FileText className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-bold text-white">
                {selectedFileName ? `নির্বাচিত ফাইল: ${selectedFileName}` : 'ব্যাকআপ JSON ফাইল সিলেক্ট করুন'}
              </span>
              <span className="text-[10px] text-slate-400">
                ক্লিক করে আপনার কম্পিউটার বা মোবাইল থেকে ফাইল নির্বাচন করুন
              </span>
            </button>

            {/* Optional raw JSON paste area */}
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-white py-1">অথবা সরাসরি JSON কোড পেস্ট করুন</summary>
              <textarea
                value={restoreJsonText}
                onChange={(e) => setRestoreJsonText(e.target.value)}
                placeholder="এখানে ব্যাকআপ ফাইলের JSON কোড পেস্ট করুন..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-200 font-mono outline-none focus:border-purple-500 transition-colors mt-2"
              />
            </details>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleRestoreBackup()}
              disabled={isRestoring || (!selectedFileName && !restoreJsonText.trim())}
              className={`flex-1 py-3.5 px-4 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                isRestoring || (!selectedFileName && !restoreJsonText.trim())
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-purple-500/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'রিস্টোর করা হচ্ছে...' : '🔄 ব্যাকআপ রিস্টোর করুন'}</span>
            </button>

            {browserBackupTime && (
              <button
                type="button"
                onClick={handleRestoreFromBrowserBackup}
                disabled={isRestoring}
                title="ব্রাউজারে পূর্বে সংরক্ষিত অটো-কপি থেকে সরাসরি রিস্টোর করুন"
                className="px-3.5 py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-2xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ব্রাউজার ক্যাশ রিস্টোর</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. GITHUB DIRECT AUTO-COMMIT & AUTO-SYNC ENGINE */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  🐙 GitHub ডিরেক্ট অটো-কমিট ও সিঙ্ক
                </h3>
                <span className="text-[10px] bg-indigo-500/25 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                  ১০০% স্বয়ংক্রিয় ক্লাউড সেভ
                </span>
                {ghHasToken && (
                  <span className="text-[10px] bg-emerald-500/25 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    টোকেন কানেক্টেড
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                একবার আপনার GitHub রিপোজিটরি ও পার্সোনাল এক্সেস টোকেন সেভ করে রাখলে, এডমিন প্যানেল থেকে কোনো প্যাকেজ যুক্ত বা পরিবর্তন করার সাথে সাথে তা ব্যাকগ্রাউন্ডে সরাসরি GitHub-এর <code className="text-indigo-300 font-mono">data/packages.json</code> ফাইলে সেভ হয়ে যাবে। কোনো ফাইল ডাউনলোড বা আপলোড করার প্রয়োজন নেই!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGhTokenGuide(!showGhTokenGuide)}
            className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto cursor-pointer transition-all"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>{showGhTokenGuide ? 'গাইড লুকান' : 'টোকেন পাওয়ার গাইড'}</span>
            {showGhTokenGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* STEP-BY-STEP GUIDE ACCORDION */}
        {showGhTokenGuide && (
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-xs text-slate-300 space-y-3">
            <h4 className="font-extrabold text-sm text-indigo-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              মাত্র ২ মিনিটে GitHub Personal Access Token তৈরির সহজ ৩টি ধাপ:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-bold block">ধাপ ১: GitHub Settings</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  github.com-এ গিয়ে আপনার প্রোফাইল থেকে <strong className="text-slate-200">Settings</strong> ➔ <strong className="text-slate-200">Developer settings</strong> ➔ <strong className="text-slate-200">Personal access tokens</strong> ➔ <strong className="text-slate-200">Tokens (classic)</strong>-এ যান।
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold block">ধাপ ২: পারমিশন নির্বাচন</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">"Generate new token (classic)"</strong>-এ ক্লিক করুন। Note-এ "AutoSync" লিখুন এবং <strong className="text-emerald-300">"repo"</strong> অপশনে টিক চিহ্ন (☑️) দিন।
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block">ধাপ ৩: টোকেন কপি ও সেভ</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  নিচে Generate বাটনে ক্লিক করে পাওয়া <code className="text-amber-300">ghp_...</code> টোকেনটি কপি করে নিচের বক্সে বসিয়ে <strong className="text-slate-200">"সেটিংস সংরক্ষণ"</strong> করুন।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK STATUS */}
        {ghFeedback && (
          <div
            className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold border shadow-md ${
              ghFeedback.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
            }`}
          >
            {ghFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{ghFeedback.message}</span>
          </div>
        )}

        {/* CONFIG FORM INPUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>GitHub Repository (রেপো নাম):</span>
              <span className="text-[10px] text-slate-400 font-normal">যেমন: username/repo-name</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="যেমন: funnymovies887/cholo-income-bot"
                value={ghRepo}
                onChange={(e) => setGhRepo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Target Branch (শাখা):</span>
              <span className="text-[10px] text-slate-400 font-normal">সাধারণত "main"</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="main"
                value={ghBranch}
                onChange={(e) => setGhBranch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>GitHub Personal Access Token (PAT):</span>
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              ghHasToken
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {ghHasToken ? '✓ টোকেন সুরক্ষিত ও সক্রিয় আছে' : 'গোপন টোকেন প্রয়োজন'}
            </span>
          </label>
          <div className="relative">
            <input
              type={ghShowToken ? 'text' : 'password'}
              placeholder={ghHasToken ? '•••••••••••••••••••••••••••••••• (টোকেন সেভ আছে)' : 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pr-10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setGhShowToken(!ghShowToken)}
              className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
            >
              {ghShowToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {ghHasToken && (
            <p className="text-[11px] text-emerald-300/90 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                আপনার টোকেনটি সার্ভারে সফলভাবে সেভ ও ব্রাউজার ভল্টে ব্যাকআপ করা আছে। নিরাপত্তার খাতিরে এটি গোপন (••••) রাখা হয়। আপনি চাইলে নতুন টোকেন লিখে পরিবর্তন করতে পারেন।
              </span>
            </p>
          )}
        </div>

        {/* AUTO-SYNC TOGGLE */}
        <label className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
          <input
            type="checkbox"
            checked={ghAutoSyncOnChange}
            onChange={(e) => setGhAutoSyncOnChange(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <div className="text-xs">
            <span className="font-extrabold text-white block">
              স্বয়ংক্রিয় ব্যাকগ্রাউন্ড অটো-কমিট (Auto-Push on Change)
            </span>
            <span className="text-[11px] text-slate-400">
              এডমিন প্যানেলে প্যাকেজ যোগ, এডিট বা ডিলিট করলে সাথে সাথে ব্যাকগ্রাউন্ডে গিটহাবে নতুন ডাটা কমিট হয়ে যাবে।
            </span>
          </div>
        </label>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            id="test-github-connection-btn"
            onClick={handleTestGhConnection}
            disabled={isTestingGh || !ghRepo}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingGh ? 'animate-spin' : ''}`} />
            <span>{isTestingGh ? 'পরীক্ষা করা হচ্ছে...' : '🔌 সংযোগ পরীক্ষা করুন'}</span>
          </button>

          <button
            type="button"
            id="save-github-config-btn"
            onClick={handleSaveGhConfig}
            disabled={isSavingGh}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-600/30"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSavingGh ? 'সেভ হচ্ছে...' : '💾 সেটিংস সংরক্ষণ করুন'}</span>
          </button>

          <button
            type="button"
            id="push-all-to-github-btn"
            onClick={handlePushAllToGitHub}
            disabled={isPushingGh || (!ghHasToken && !ghToken)}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-indigo-500/20 ml-auto"
          >
            <Send className={`w-3.5 h-3.5 ${isPushingGh ? 'animate-spin' : ''}`} />
            <span>{isPushingGh ? 'গিটহাবে পুশ হচ্ছে...' : '🚀 এখনই GitHub-এ সরাসরি অটো-কমিট করুন'}</span>
          </button>
        </div>

        {/* STATUS FOOTER */}
        {ghLastStatus && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>সর্বশেষ স্থিতি: <strong className="text-slate-300">{ghLastStatus}</strong></span>
            {ghLastSyncedAt && (
              <span>সময়: {new Date(ghLastSyncedAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' })}</span>
            )}
          </div>
        )}

        {/* RENDER ENVIRONMENT PERMANENCE TIP */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-indigo-500/30 text-[11px] text-slate-300 space-y-2">
          <span className="font-extrabold text-amber-300 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Render বা ক্লাউড হোস্টিংয়ে টোকেন চিরস্থায়ী রাখার প্রো-টিপ:</span>
          </span>
          <p className="text-slate-400 leading-relaxed">
            রেন্ডার (Render)-এর ফ্রি টায়ারে সার্ভার রিস্টার্টের পর কোনো কনফিগ ফাইল যেন রিসেট না হয়, সেজন্য আপনার <strong className="text-white">Render Dashboard &gt; আপনার Service &gt; Environment</strong> ট্যাবে গিয়ে নিচের দুটি ভ্যারিয়েবল একবার অ্যাড করে রাখলে আর কখনোই টোকেন হারানোর ভয় থাকবে না:
          </p>
          <div className="font-mono text-[10px] bg-slate-900 p-2.5 rounded-xl text-emerald-300 space-y-1 border border-slate-800">
            <div><span className="text-slate-500">Key:</span> GITHUB_REPO &nbsp;&nbsp;&nbsp;&nbsp; <span className="text-slate-500">Value:</span> funnymovies887-hash/earning_bot</div>
            <div><span className="text-slate-500">Key:</span> GITHUB_TOKEN &nbsp;&nbsp;&nbsp;<span className="text-slate-500">Value:</span> ghp_আপনার_পার্সোনাল_টোকেন</div>
          </div>
        </div>
      </div>

      {/* 4. INDIVIDUAL DATA FILES FOR GITHUB REPOSITORY (Manual Fallback Storage) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              ৪. ম্যানুয়ালি `data/` ফাইল ডাউনলোড (বিকল্প ব্যাকআপ)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              আপনি যখন AI Studio থেকে কোড ডাউনলোড করে GitHub-এ দেন, তখন GitHub-এর <code className="text-cyan-300">data/</code> ফোল্ডারে এই ফাইলগুলো রাখলে নতুন কোনো ডেপ্লয়মেন্টেই ডাটা হারাবে না।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">packages.json</span>
              <span className="text-[10px] text-purple-300">প্যাকেজ ক্যাটালগ</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('packages.json')}
              className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 cursor-pointer transition-colors"
              title="Download packages.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">users.json</span>
              <span className="text-[10px] text-blue-300">ইউজার একাউন্ট ও ব্যালেন্স</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('users.json')}
              className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 cursor-pointer transition-colors"
              title="Download users.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">payment_config.json</span>
              <span className="text-[10px] text-amber-300">বিকাশ/নগদ পেমেন্ট নম্বর</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('payment_config.json')}
              className="p-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
              title="Download payment_config.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">orders.json</span>
              <span className="text-[10px] text-emerald-300">প্যাকেজ ক্রয় অর্ডার</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('orders.json')}
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors"
              title="Download orders.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">withdrawals.json</span>
              <span className="text-[10px] text-teal-300">উইথড্র হিস্টোরি</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('withdrawals.json')}
              className="p-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/30 cursor-pointer transition-colors"
              title="Download withdrawals.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">ad_videos.json</span>
              <span className="text-[10px] text-rose-300">লকড ভিডিও তালিকা</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('ad_videos.json')}
              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
              title="Download ad_videos.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">income_methods_config.json</span>
              <span className="text-[10px] text-indigo-300">৫টি মেথডের রিওয়ার্ড</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('income_methods_config.json')}
              className="p-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 cursor-pointer transition-colors"
              title="Download income_methods_config.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">telegram_config.json</span>
              <span className="text-[10px] text-sky-300">বট ও চ্যানেল সেটিংস</span>
            </div>
            <button
              type="button"
              onClick={() => downloadSingleFile('telegram_config.json')}
              className="p-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 cursor-pointer transition-colors"
              title="Download telegram_config.json"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
