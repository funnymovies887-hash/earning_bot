import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Power,
  ShieldCheck,
  Eye,
  Save,
  Loader2,
} from 'lucide-react';

export interface AdminToastData {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const AdminSaveButton: React.FC<{
  isDirty?: boolean;
  isSaving?: boolean;
  isSaved?: boolean;
  defaultText?: string;
  savingText?: string;
  savedText?: string;
  type?: 'button' | 'submit';
  id?: string;
  className?: string;
}> = ({
  isSaving,
  isSaved,
  defaultText = 'Save',
  savingText = 'Saving...',
  savedText = 'Saved! ✓',
  type = 'submit',
  id,
  className = '',
}) => {
  if (isSaved) {
    return (
      <button
        id={id}
        type="button"
        disabled
        className={`py-2.5 px-5 rounded-xl font-bold text-xs bg-emerald-600 text-white flex items-center justify-center gap-1.5 ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 text-white" />
        <span>{savedText}</span>
      </button>
    );
  }
  if (isSaving) {
    return (
      <button
        id={id}
        type="button"
        disabled
        className={`py-2.5 px-5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 flex items-center justify-center gap-1.5 opacity-90 cursor-wait ${className}`}
      >
        <Loader2 className="w-4 h-4 text-slate-950 animate-spin" />
        <span>{savingText}</span>
      </button>
    );
  }
  return (
    <button
      id={id}
      type={type}
      className={`py-2.5 px-5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer ${className}`}
    >
      <Save className="w-4 h-4 text-slate-950" />
      <span>{defaultText}</span>
    </button>
  );
};

interface AdminNoticeBroadcastManagerProps {
  onNotify?: (toast: AdminToastData) => void;
}

export const AdminNoticeBroadcastManager: React.FC<AdminNoticeBroadcastManagerProps> = ({ onNotify }) => {
  const [loading, setLoading] = useState(false);

  // Broadcast Notice state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastActive, setBroadcastActive] = useState(true);
  const [broadcastUpdatedAt, setBroadcastUpdatedAt] = useState('');
  const [isBroadcastEditing, setIsBroadcastEditing] = useState(false);
  const [isBroadcastSaving, setIsBroadcastSaving] = useState(false);
  const [isBroadcastSaved, setIsBroadcastSaved] = useState(false);

  // Official Notice state
  const [officialTitle, setOfficialTitle] = useState('Official Notice');
  const [officialDescription, setOfficialDescription] = useState(
    '📢 গুরুত্বপূর্ণ নোটিশ 📢 সবাই অ্যাড ভালোভাবে দেখতেছেন, ধন্যবাদ — কিন্তু অনেকেই এখনো অ্যাডে ক্লিক করছেন না।'
  );
  const [officialRules, setOfficialRules] = useState<string[]>([
    '1️⃣ প্রতি ১০টা অ্যাড দেখার পর অন্তত ১টা অ্যাডে ক্লিক করবেন।',
    '2️⃣ ক্লিক করার পর কমপক্ষে ১ মিনিট সেই ওয়েবপেজে অবস্থান করবেন।',
    '3️⃣ তারপর পরবর্তী অ্যাডে যান।',
  ]);
  const [officialWarning, setOfficialWarning] = useState(
    '⚠️ যদি নিয়ম অনুযায়ী ক্লিক ও ভিজিট না করেন, তাহলে সেই কাজের পেমেন্ট দেওয়া হবে না।'
  );
  const [officialFooter, setOfficialFooter] = useState('ধন্যবাদ সবাইকে 🙏 — টিম ম্যানেজমেন্ট');
  const [officialActive, setOfficialActive] = useState(true);
  const [officialUpdatedAt, setOfficialUpdatedAt] = useState('');

  // Rules editor helper state
  const [newRuleText, setNewRuleText] = useState('');
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [editingRuleText, setEditingRuleText] = useState('');

  const [isOfficialSaving, setIsOfficialSaving] = useState(false);
  const [isOfficialSaved, setIsOfficialSaved] = useState(false);

  // Fetch notices from server
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      if (data?.broadcastNotice) {
        setBroadcastMessage(data.broadcastNotice.message || '');
        setBroadcastActive(data.broadcastNotice.isActive ?? true);
        setBroadcastUpdatedAt(data.broadcastNotice.updatedAt || '');
      }
      if (data?.officialNotice) {
        setOfficialTitle(data.officialNotice.title || 'Official Notice');
        setOfficialDescription(data.officialNotice.description || '');
        if (Array.isArray(data.officialNotice.rules)) {
          setOfficialRules(data.officialNotice.rules);
        }
        setOfficialWarning(data.officialNotice.warning || '');
        setOfficialFooter(data.officialNotice.footer || '');
        setOfficialActive(data.officialNotice.isActive ?? true);
        setOfficialUpdatedAt(data.officialNotice.updatedAt || '');
      }
    } catch (err) {
      console.error('Failed to fetch notices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Save / Update Broadcast Notice
  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsBroadcastSaving(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage.trim(),
          isActive: broadcastActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsBroadcastSaved(true);
        setIsBroadcastEditing(false);
        setBroadcastUpdatedAt(data.broadcastNotice.updatedAt || new Date().toISOString());
        if (onNotify) {
          onNotify({
            type: 'success',
            title: 'ব্রডকাস্ট নোটিশ সংরক্ষিত!',
            message: 'সকল ইউজারের অ্যাপ্লিকেশনে নতুন নোটিশ আপডেট হয়েছে।',
          });
        }
        setTimeout(() => setIsBroadcastSaved(false), 3000);
      }
    } catch {
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'সংরক্ষণ ব্যর্থ',
          message: 'ব্রডকাস্ট নোটিশ সেভ করতে সমস্যা হয়েছে।',
        });
      }
    } finally {
      setIsBroadcastSaving(false);
    }
  };

  // Toggle Broadcast Active Status
  const handleToggleBroadcastActive = async () => {
    try {
      const res = await fetch('/api/admin/broadcast/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !broadcastActive }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastActive(data.broadcastNotice.isActive);
        if (onNotify) {
          onNotify({
            type: 'success',
            title: data.broadcastNotice.isActive ? 'ব্রডকাস্ট সক্রিয়!' : 'ব্রডকাস্ট বন্ধ করা হয়েছে',
            message: data.broadcastNotice.isActive
              ? 'ইউজাররা এখন এই নোটিশ দেখতে পাবে।'
              : 'ইউজারদের কাছে এই নোটিশ দেখানো বন্ধ করা হয়েছে।',
          });
        }
      }
    } catch {}
  };

  // Save Official Notice
  const handleSaveOfficialNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOfficialSaving(true);
    try {
      const res = await fetch('/api/admin/official-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: officialTitle.trim(),
          description: officialDescription.trim(),
          rules: officialRules,
          warning: officialWarning.trim(),
          footer: officialFooter.trim(),
          isActive: officialActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsOfficialSaved(true);
        setOfficialUpdatedAt(data.officialNotice?.updatedAt || new Date().toISOString());
        if (onNotify) {
          onNotify({
            type: 'success',
            title: 'অফিসিয়াল নোটিশ সংরক্ষিত!',
            message: 'ইউজারদের পপ-আপ নোটিশ সফলভাবে আপডেট ও সেভ হয়েছে।',
          });
        }
        setTimeout(() => setIsOfficialSaved(false), 3000);
      }
    } catch {
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'সংরক্ষণ ব্যর্থ',
          message: 'অফিসিয়াল নোটিশ সেভ করা সম্ভব হয়নি।',
        });
      }
    } finally {
      setIsOfficialSaving(false);
    }
  };

  // Add rule
  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setOfficialRules([...officialRules, newRuleText.trim()]);
    setNewRuleText('');
  };

  // Delete rule
  const handleDeleteRule = (index: number) => {
    setOfficialRules(officialRules.filter((_, i) => i !== index));
  };

  // Edit rule
  const handleStartEditRule = (index: number) => {
    setEditingRuleIndex(index);
    setEditingRuleText(officialRules[index]);
  };

  const handleSaveEditRule = () => {
    if (editingRuleIndex === null || !editingRuleText.trim()) return;
    const updated = [...officialRules];
    updated[editingRuleIndex] = editingRuleText.trim();
    setOfficialRules(updated);
    setEditingRuleIndex(null);
    setEditingRuleText('');
  };

  return (
    <div className="space-y-8 mt-6 max-w-5xl">
      {/* SECTION 1: BROADCAST LIVE NOTIFICATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>ব্রডকাস্ট নোটিশ কন্ট্রোল (Broadcast Live Notice)</span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    broadcastActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {broadcastActive ? 'সক্রিয় (Active)' : 'বন্ধ (Inactive)'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                টেলিগ্রাম মিনি অ্যাপে সমস্ত ইউজারের কাছে রিয়েল-টাইমে এই বার্তাটি দেখানো হবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBroadcastActive}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                broadcastActive
                  ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{broadcastActive ? 'নোটিশ সাময়িক বন্ধ করুন' : 'নোটিশ চালু করুন'}</span>
            </button>

            <button
              type="button"
              onClick={fetchNotices}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Current Saved Notice Card with direct Edit option */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>বর্তমানে সেভ থাকা ব্রডকাস্ট নোটিশ:</span>
            </span>
            {broadcastUpdatedAt && (
              <span className="text-[10px] text-slate-500 font-mono">
                সর্বশেষ আপডেট: {new Date(broadcastUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-amber-300 font-medium leading-relaxed">
            {broadcastMessage || '(এখনও কোনো ব্রডকাস্ট নোটিশ সেট করা হয়নি)'}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsBroadcastEditing(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>এডিট করুন (Edit Notice)</span>
            </button>
          </div>
        </div>

        {/* Broadcast Edit / Add Form */}
        <form onSubmit={handleSaveBroadcast} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                {isBroadcastEditing ? 'নোটিশ এডিট করুন:' : 'নতুন বার্তা লিখুন:'}
              </label>
              {isBroadcastEditing && (
                <button
                  type="button"
                  onClick={() => setIsBroadcastEditing(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
              )}
            </div>
            <textarea
              rows={4}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. আজ রাত ১২টায় সবার উইথড্র ক্লিয়ার করা হবে! রেফার বোনাস ডাবল চলছে..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl p-4 text-xs text-white placeholder-slate-500 outline-none transition-colors leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500">
              💡 আপনি এডিট করে সেভ করলে সাথে সাথে পুরোনোটা মুছে না গিয়ে নতুনটি আপডেট হবে।
            </div>
            <AdminSaveButton
              id="admin-save-broadcast-btn"
              isDirty={true}
              isSaving={isBroadcastSaving}
              isSaved={isBroadcastSaved}
              defaultText="নোটিশ সেভ ও ব্রডকাস্ট করুন"
              savingText="সংরক্ষণ হচ্ছে..."
              savedText="সফলভাবে আপডেট হয়েছে! ✓"
              type="submit"
            />
          </div>
        </form>
      </div>

      {/* SECTION 2: OFFICIAL NOTICE MODAL MANAGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <span>অফিসিয়াল নোটিশ পপ-আপ সেটিংস (Official Notice Modal)</span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    officialActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {officialActive ? 'পপ-আপ চালু (Active)' : 'পপ-আপ বন্ধ'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                অ্যাপে প্রবেশের পর ইউজারদের সামনে যে বড় হলুদ/সবুজ নিয়মের নোটিশ ভেসে ওঠে, তা এখান থেকে এডিট করুন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOfficialActive(!officialActive)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              officialActive
                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{officialActive ? 'পপ-আপ বন্ধ করুন' : 'পপ-আপ চালু করুন'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveOfficialNotice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                নোটিশ শিরোনাম (Title):
              </label>
              <input
                type="text"
                required
                value={officialTitle}
                onChange={(e) => setOfficialTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                সতর্কবার্তা (Warning Banner):
              </label>
              <input
                type="text"
                value={officialWarning}
                onChange={(e) => setOfficialWarning(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-amber-300 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              প্রধান বিবরণ (Description / Overview):
            </label>
            <textarea
              rows={2}
              required
              value={officialDescription}
              onChange={(e) => setOfficialDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none leading-relaxed"
            />
          </div>

          {/* Rules List with Inline Edit, Delete, and Add */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>কাজের শর্ত ও নিয়মাবলি তালিকা ({officialRules.length} টি)</span>
              </span>
              <span className="text-[10px] text-slate-500">
                প্রতিটি নিয়ম আলাদা করে এডিট বা ডিলিট করতে পারবেন
              </span>
            </div>

            {/* Rules Items */}
            <div className="space-y-2">
              {officialRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  {editingRuleIndex === idx ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingRuleText}
                        onChange={(e) => setEditingRuleText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditRule}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        সেভ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRuleIndex(null)}
                        className="px-2 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs cursor-pointer"
                      >
                        বাতিল
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-slate-200 font-medium flex-1">{rule}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditRule(idx)}
                          className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="নিয়ম এডিট করুন"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="নিয়ম মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Rule input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="নতুন নিয়ম লিখুন (যেমন: ৪️⃣ কোনো ভিপিএন ব্যবহার করা যাবে না)..."
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!newRuleText.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নিয়ম যোগ করুন</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              ফুটার নোট (Footer Management Signature):
            </label>
            <input
              type="text"
              value={officialFooter}
              onChange={(e) => setOfficialFooter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-200 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              {officialUpdatedAt && `সর্বশেষ সেভ: ${new Date(officialUpdatedAt).toLocaleString()}`}
            </span>
            <AdminSaveButton
              id="admin-save-official-notice-btn"
              isDirty={true}
              isSaving={isOfficialSaving}
              isSaved={isOfficialSaved}
              defaultText="অফিসিয়াল নোটিশ সেভ করুন"
              savingText="সংরক্ষণ হচ্ছে..."
              savedText="অফিসিয়াল নোটিশ সেভ হয়েছে! ✓"
              type="submit"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
export default AdminNoticeBroadcastManager;
