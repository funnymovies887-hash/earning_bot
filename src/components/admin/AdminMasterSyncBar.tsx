import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  Github,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Cloud,
  CheckCheck,
  Smartphone,
  Laptop,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminToastData } from './AdminFloatingToast';

interface AdminMasterSyncBarProps {
  onRefreshData?: () => void;
  showToast?: (toast: AdminToastData) => void;
  isSavingGlobal?: boolean;
}

export const AdminMasterSyncBar: React.FC<AdminMasterSyncBarProps> = ({
  onRefreshData,
  showToast,
  isSavingGlobal = false,
}) => {
  const [ghConfig, setGhConfig] = useState<{
    repo: string;
    branch: string;
    hasToken: boolean;
    maskedToken?: string;
    lastSyncedAt?: string;
    lastStatus?: string;
  } | null>(null);

  const [isMasterSaving, setIsMasterSaving] = useState(false);
  const [isMasterPulling, setIsMasterPulling] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [inputRepo, setInputRepo] = useState('funnymovies887-hash/earning_bot');
  const [inputBranch, setInputBranch] = useState('main');
  const [showTokenText, setShowTokenText] = useState(false);
  const [tokenSaveLoading, setTokenSaveLoading] = useState(false);
  const [tokenTestLoading, setTokenTestLoading] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch GitHub sync config from server
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/github-sync/config');
      if (res.ok) {
        const data = await res.json();
        setGhConfig(data);
        if (data.repo) setInputRepo(data.repo);
        if (data.branch) setInputBranch(data.branch);
      }
    } catch (e) {
      console.warn('Failed to load GitHub sync config:', e);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Master Save & Push to GitHub
  const handleMasterSave = async () => {
    setIsMasterSaving(true);
    try {
      const res = await fetch('/api/admin/master-save', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        try {
          confetti({
            particleCount: 45,
            spread: 70,
            origin: { y: 0.2 },
            colors: ['#10b981', '#fbbf24', '#38bdf8', '#a855f7'],
          });
        } catch {}

        showToast?.({
          type: 'success',
          title: '🎉 সর্বজনীন সেভ ও GitHub অটো-কমিট সম্পন্ন!',
          message: data.message || 'সমস্ত মডিউল (প্যাকেজ, টাস্ক, ভিডিও, সেটিংস) সফলভাবে সেভ ও GitHub-এ পুশ হয়েছে!',
        });
      } else {
        showToast?.({
          type: 'warning',
          title: 'সার্ভারে সেভ হয়েছে',
          message: data.message || 'সার্ভারে সেভ হয়েছে, তবে GitHub টোকেন কনফিগার করা প্রয়োজন।',
        });
        if (!ghConfig?.hasToken) {
          setShowTokenModal(true);
        }
      }
      fetchConfig();
      onRefreshData?.();
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'সেভ ত্রুটি',
        message: err.message || 'সার্ভারে সেভ করতে সমস্যা হয়েছে',
      });
    } finally {
      setIsMasterSaving(false);
    }
  };

  // Master Pull fresh data from GitHub
  const handleMasterPull = async () => {
    if (!window.confirm('আপনি কি GitHub থেকে লাইভ ডাটা লোড করতে চান? এটি আপনার বর্তমান ডাটাবেজকে GitHub-এর সর্বশেষ ভার্সনের সাথে সিঙ্ক করবে।')) {
      return;
    }
    setIsMasterPulling(true);
    try {
      const res = await fetch('/api/admin/master-pull', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        showToast?.({
          type: 'success',
          title: '✅ GitHub থেকে সফলভাবে সিঙ্ক হয়েছে!',
          message: `${data.pulledCount}টি ডাটাবেজ মডিউল GitHub থেকে ডাউনলোড ও কার্যকর করা হয়েছে।`,
        });
        fetchConfig();
        onRefreshData?.();
      } else {
        showToast?.({
          type: 'error',
          title: 'সিঙ্ক ব্যর্থ',
          message: data.message || 'গিটহাব থেকে ডাটা লোড করা যায়নি',
        });
      }
    } catch (err: any) {
      showToast?.({
        type: 'error',
        title: 'নেটওয়ার্ক সমস্যা',
        message: err.message || 'GitHub থেকে ডাটা আনতে সমস্যা হয়েছে',
      });
    } finally {
      setIsMasterPulling(false);
    }
  };

  // Save Token to Server
  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenSaveLoading(true);
    setTokenFeedback(null);

    try {
      const res = await fetch('/api/admin/github-sync/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: inputRepo.trim(),
          branch: inputBranch.trim(),
          token: inputToken.trim() || undefined,
          autoSyncOnChange: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenFeedback({
          type: 'success',
          text: '✅ GitHub Token সফলভাবে সেভ হয়েছে! এখন যেকোনো ব্রাউজার ও মোবাইল থেকে অটো-কমিট কাজ করবে।',
        });
        fetchConfig();
        setTimeout(() => {
          setShowTokenModal(false);
          setTokenFeedback(null);
          setInputToken('');
        }, 1500);
      } else {
        setTokenFeedback({
          type: 'error',
          text: data.error || 'টোকেন সেভ ব্যর্থ হয়েছে।',
        });
      }
    } catch (err: any) {
      setTokenFeedback({
        type: 'error',
        text: 'সার্ভার সংযোগ সমস্যা: ' + err.message,
      });
    } finally {
      setTokenSaveLoading(false);
    }
  };

  // Test Token Connection
  const handleTestToken = async () => {
    setTokenTestLoading(true);
    setTokenFeedback(null);
    try {
      const res = await fetch('/api/admin/github-sync/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: inputRepo.trim(),
          token: inputToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenFeedback({
          type: 'success',
          text: data.message || '✅ GitHub কানেকশন ১০০% সফল!',
        });
      } else {
        setTokenFeedback({
          type: 'error',
          text: data.error || '❌ কানেকশন ব্যর্থ হয়েছে, টোকেনের পারমিশন চেক করুন।',
        });
      }
    } catch (err: any) {
      setTokenFeedback({
        type: 'error',
        text: 'টেস্ট ত্রুটি: ' + err.message,
      });
    } finally {
      setTokenTestLoading(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-6 shadow-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Global Status & Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                সার্বজনীন ক্লাউড ও GitHub অটো-সিঙ্ক ইঞ্জিন
              </span>
              {ghConfig?.hasToken ? (
                <button
                  type="button"
                  onClick={() => setShowTokenModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
                  title="GitHub Token সক্রিয় আছে। ক্লিক করে কনফিগারেশন দেখুন।"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>GitHub কানেক্টেড</span>
                  <Check className="w-3 h-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTokenModal(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer animate-bounce"
                  title="যেকোনো ব্রাউজার ও মোবাইল থেকে অটো-কমিটের জন্য GitHub Token দিন"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>GitHub Token দিন</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center flex-wrap gap-2">
              <span>যেকোনো ব্রাউজার/মোবাইল থেকে সেভ করলে GitHub ও সার্ভারে সাথে সাথে আপডেট হবে।</span>
              {ghConfig?.lastSyncedAt && (
                <span className="text-slate-500 font-mono text-[10px]">
                  (সর্বশেষ সিঙ্ক: {new Date(ghConfig.lastSyncedAt).toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Master Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Master Save & Push */}
          <button
            type="button"
            id="master-save-all-btn"
            onClick={handleMasterSave}
            disabled={isMasterSaving || isSavingGlobal}
            className="flex-1 sm:flex-none relative px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border-2 border-amber-200 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
            title="প্যাকেজ, টাস্ক, ভিডিও ও যাবতীয় সেটিংস সেভ করুন এবং সরাসরি GitHub-এ অটো-কমিট করুন"
          >
            {isMasterSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Save className="w-4 h-4 text-slate-950" />
            )}
            <span className="whitespace-nowrap">
              {isMasterSaving ? 'সংরক্ষণ ও পুশ হচ্ছে...' : '💾 সব সেভ ও GitHub-এ পুশ করুন'}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-slate-950/70 shrink-0" />
          </button>

          {/* Master Pull from GitHub */}
          <button
            type="button"
            id="master-pull-from-gh-btn"
            onClick={handleMasterPull}
            disabled={isMasterPulling}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="GitHub রিপোজিটরি থেকে লাইভ ডাটা লোড ও সিঙ্ক করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${isMasterPulling ? 'animate-spin' : ''}`} />
            <span className="whitespace-nowrap">
              {isMasterPulling ? 'সিঙ্ক হচ্ছে...' : '🔄 GitHub থেকে লোড'}
            </span>
          </button>

          {/* GitHub Config Trigger Button */}
          <button
            type="button"
            onClick={() => setShowTokenModal(true)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="GitHub সেটিংস ও টোকেন পরিচালনা করুন"
          >
            <Github className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GitHub Token & Configuration Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => {
                setShowTokenModal(false);
                setTokenFeedback(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">GitHub Auto-Sync & Token Settings</h3>
                <p className="text-xs text-slate-400">যেকোনো ব্রাউজার ও মোবাইল থেকে সরাসরি GitHub-এ অটো-কমিট সক্ষম করুন</p>
              </div>
            </div>

            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub Repository (Username/Repo)
                </label>
                <input
                  type="text"
                  value={inputRepo}
                  onChange={(e) => setInputRepo(e.target.value)}
                  placeholder="funnymovies887-hash/earning_bot"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={inputBranch}
                  onChange={(e) => setInputBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    GitHub Personal Access Token (classic / fine-grained)
                  </label>
                  {ghConfig?.hasToken && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      টোকেন সংরক্ষিত আছে ({ghConfig.maskedToken})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showTokenText ? 'text' : 'password'}
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder={ghConfig?.hasToken ? 'নতুন টোকেন সেট করতে চাইলে লিখুন...' : 'ghp_... টোকেন পেস্ট করুন'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenText(!showTokenText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTokenText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  টোকেনটিতে <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">repo</code> পারমিশন থাকতে হবে। টোকেনটি সার্ভারে সুরক্ষিত থাকে এবং কোনো ডাটা কখনোই হারাবে না।
                </p>
              </div>

              {tokenFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    tokenFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {tokenFeedback.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestToken}
                  disabled={tokenTestLoading || (!inputToken.trim() && !ghConfig?.hasToken)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${tokenTestLoading ? 'animate-spin' : ''}`} />
                  <span>{tokenTestLoading ? 'টেস্ট হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
                </button>

                <button
                  type="submit"
                  disabled={tokenSaveLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {tokenSaveLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{tokenSaveLoading ? 'সেভ হচ্ছে...' : 'টোকেন সেভ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
