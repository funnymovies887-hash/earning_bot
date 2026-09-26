import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { AdLockedVideo } from '../../types';
import { AdminFloatingToast, AdminToastData } from './AdminFloatingToast';
import { AdminSaveButton } from './AdminSaveButton';

export const AdminAdLockedVideosTab: React.FC = () => {
  const [videos, setVideos] = useState<AdLockedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdLockedVideo | null>(null);
  const [isEditingSaving, setIsEditingSaving] = useState(false);
  const [isEditingSaved, setIsEditingSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [toast, setToast] = useState<AdminToastData | null>(null);
  const [isVideoSaved, setIsVideoSaved] = useState(false);

  // New video form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewDuration, setPreviewDuration] = useState('02:00');
  const [fullDuration, setFullDuration] = useState('18:40');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [fullVideoUrl, setFullVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=70');
  const [requiredAds, setRequiredAds] = useState(15);
  const [adTimerSeconds, setAdTimerSeconds] = useState(15);
  const [adNetworkUrl, setAdNetworkUrl] = useState('https://monetag.com');
  const [adNetworkName, setAdNetworkName] = useState('Monetag Direct Link');
  const [expiryMinutes, setExpiryMinutes] = useState(90);
  const [deliveryBotHandle, setDeliveryBotHandle] = useState('PremiumVideoDeliveryBot');
  const [demoChannelUrl, setDemoChannelUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPostingChannel, setIsPostingChannel] = useState<string | null>(null);

  // Reset New Video Form to clean pristine default state
  const resetNewVideoForm = () => {
    setTitle('');
    setDescription('');
    setPreviewDuration('02:00');
    setFullDuration('18:40');
    setPreviewVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
    setFullVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
    setThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=70');
    setRequiredAds(15);
    setAdTimerSeconds(15);
    setAdNetworkUrl('https://monetag.com');
    setAdNetworkName('Monetag Direct Link');
    setExpiryMinutes(90);
    setDeliveryBotHandle('PremiumVideoDeliveryBot');
    setDemoChannelUrl('');
    setChannelId('');
    setStatusMsg(null);
    setIsVideoSaved(false);
  };

  // Fetch videos
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ad-videos');
      const data = await res.json();
      if (Array.isArray(data)) setVideos(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Post Demo to Telegram Channel
  const handlePostDemoToChannel = async (vid: AdLockedVideo) => {
    setIsPostingChannel(vid.id);
    try {
      const res = await fetch('/api/admin/ad-videos/post-demo-to-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: vid.id,
          channelId: vid.channelId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'success',
          title: 'চ্যানেলে ডেমো পোস্ট সফল!',
          message: data.message || 'টেলিগ্রাম চ্যানেলে ডেমো ভিডিও এবং "ফুল ভিডিও দেখুন" বাটন সফলভাবে পোস্ট হয়েছে!',
        });
        fetchVideos();
      } else {
        setToast({
          type: 'error',
          title: 'পোস্ট ব্যর্থ',
          message: data.error || 'টেলিগ্রাম চ্যানেলে পোস্ট পাঠানো যায়নি। বট টোকেন ও চ্যানেলে বট এডমিন আছে কিনা চেক করুন।',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'চ্যানেলে পোস্ট পাঠাতে ব্যর্থ: ' + err.message,
      });
    } finally {
      setIsPostingChannel(null);
    }
  };

  // Handle Create Video
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fullVideoUrl.trim()) {
      setToast({
        type: 'error',
        title: 'অসম্পূর্ণ তথ্য',
        message: 'অনুগ্রহ করে ভিডিওর শিরোনাম ও ফুল ভিডিওর লিংক প্রদান করুন।',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/ad-videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          previewDuration: previewDuration.trim(),
          fullDuration: fullDuration.trim(),
          previewVideoUrl: previewVideoUrl.trim(),
          fullVideoUrl: fullVideoUrl.trim(),
          thumbnail: thumbnail.trim(),
          requiredAds: Number(requiredAds) || 15,
          adTimerSeconds: Number(adTimerSeconds) || 15,
          adNetworkUrl: adNetworkUrl.trim(),
          adNetworkName: adNetworkName.trim(),
          expiryMinutes: Number(expiryMinutes) || 90,
          protectContent: true,
          deliveryBotHandle: deliveryBotHandle.trim().replace('@', ''),
          demoChannelUrl: demoChannelUrl.trim(),
          channelId: channelId.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsVideoSaved(true);
        setToast({
          type: 'success',
          title: 'ভিডিও সংরক্ষিত!',
          message: `"${title.trim()}" ভিডিওটি সফলভাবে সিস্টেমে যুক্ত করা হয়েছে।`,
        });
        fetchVideos();
        setTimeout(() => {
          resetNewVideoForm();
          setShowAddModal(false);
        }, 1500);
      } else {
        setToast({
          type: 'error',
          title: 'ভিডিও যোগ ব্যর্থ',
          message: data.error || 'ভিডিও যোগ করতে সমস্যা হয়েছে',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'সার্ভার ত্রুটি',
        message: 'সার্ভার সংযোগ করা সম্ভব হয়নি।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Video
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    if (!editingVideo.title.trim() || !editingVideo.fullVideoUrl.trim()) {
      setToast({
        type: 'error',
        title: 'অসম্পূর্ণ তথ্য',
        message: 'অনুগ্রহ করে ভিডিওর শিরোনাম ও ফুল ভিডিওর লিংক প্রদান করুন।',
      });
      return;
    }

    setIsEditingSaving(true);
    try {
      const res = await fetch('/api/admin/ad-videos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVideo.id,
          title: editingVideo.title.trim(),
          description: editingVideo.description.trim(),
          previewDuration: editingVideo.previewDuration.trim(),
          fullDuration: editingVideo.fullDuration.trim(),
          previewVideoUrl: editingVideo.previewVideoUrl.trim(),
          fullVideoUrl: editingVideo.fullVideoUrl.trim(),
          thumbnail: editingVideo.thumbnail.trim(),
          requiredAds: Number(editingVideo.requiredAds) || 15,
          adTimerSeconds: Number(editingVideo.adTimerSeconds) || 15,
          adNetworkUrl: editingVideo.adNetworkUrl.trim(),
          adNetworkName: editingVideo.adNetworkName.trim(),
          expiryMinutes: Number(editingVideo.expiryMinutes) || 90,
          protectContent: true,
          deliveryBotHandle: (editingVideo.deliveryBotHandle || '').trim().replace('@', ''),
          demoChannelUrl: (editingVideo.demoChannelUrl || '').trim(),
          channelId: (editingVideo.channelId || '').trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditingSaved(true);
        setToast({
          type: 'success',
          title: 'ভিডিও আপডেট হয়েছে!',
          message: `"${editingVideo.title}" সফলভাবে এডিট ও সেভ করা হয়েছে।`,
        });
        if (data.allVideos) {
          setVideos(data.allVideos);
        } else {
          setVideos((prev) => prev.map((v) => (v.id === editingVideo.id ? { ...v, ...editingVideo } : v)));
        }
        setTimeout(() => {
          setIsEditingSaved(false);
          setEditingVideo(null);
        }, 1200);
      } else {
        setToast({
          type: 'error',
          title: 'আপডেট ব্যর্থ',
          message: data.error || 'ভিডিও আপডেট করা যায়নি।',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'ভিডিও আপডেট সম্পন্ন করা যায়নি।',
      });
    } finally {
      setIsEditingSaving(false);
    }
  };

  // Handle Delete Video
  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই ভিডিওটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch('/api/admin/ad-videos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'delete',
          title: 'ভিডিও মুছে ফেলা হয়েছে!',
          message: 'ভিডিওটি সফলভাবে তালিকা থেকে মুছে ফেলা হয়েছে।',
        });
        fetchVideos();
      } else {
        setToast({
          type: 'error',
          title: 'ডিলিট ব্যর্থ',
          message: 'ভিডিওটি ডিলিট করা যায়নি।',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'ভিডিও ডিলিট সম্পন্ন করা যায়নি।',
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Toast Notification */}
      <AdminFloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Header & Feature Explanation */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                অ্যাড-লকড ভিডিও ও ৯০ মিনিট অটো-ডিলিট সিস্টেম
                <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/40">
                  New System
                </span>
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                ২ মিনিট প্রিভিউ ফ্রি &bull; ১৫টি অ্যাড দেখলে ফুল ভিডিও আনলক &bull; ৯০ মিনিট পর অটো-ডিলিট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchVideos}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>

            <button
              onClick={() => {
                resetNewVideoForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন লকড ভিডিও যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Technical Architecture Notes for the User */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> অ্যাড টাইম কাউন্টার (Timer)
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              CPA নেটওয়ার্ক শুধু ট্র্যাকিং লিংক দেয়, সময় কাউন্ট করে না। আমাদের অ্যাপ ও বট নিজেই ১৫, ৩০ বা ৬০ সেকেন্ডের কঠোর কাউন্টডাউন টাইমার চালায় যাতে ইউজার পুরো সময় না দেখে অ্যাড ক্লেইম করতে না পারে।
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> ৯০ মিনিট অটো-এক্সপায়ার
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              ১৫টি অ্যাড দেখার সাথে সাথে সার্ভার ও অ্যাপে ৯০ মিনিটের সেশন চালু হয়। ৯০ মিনিট শেষ হওয়া মাত্রই ভিডিওর সম্পূর্ণ ইউআরএল ব্লক ও অটোমেটিক ডিলিট/লক হয়ে যায়।
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-extrabold text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> ডাউনলোড ও স্ক্রিন রেকর্ড প্রতিরোধ
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              ভিডিওতে রাইট-ক্লিক ও ডাউনলোড বাটন বন্ধ (DRM flag), সাথে ইউজারের টেলিগ্রাম আইডি ও ইউজারনেম দিয়ে ডায়নামিক ভাসমান ওয়াটারমার্ক ঘুরবে যা রেকর্ড করা ভিডিও ছড়ানো প্রতিরোধ করে।
            </p>
          </div>
        </div>

        {/* Complete Step-by-Step Setup Guide requested by Admin */}
        <div className="bg-slate-950/90 border border-purple-500/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>সিস্টেমটি ১০০% নিখুঁতভাবে চালু করার ধাপসমূহ (Step-by-Step Setup Guide):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300 leading-relaxed">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-white font-bold block text-xs">১. টেলিগ্রাম বট কনফিগারেশন:</span>
              <p>BotFather থেকে পাওয়া <strong>Bot Token</strong> ও <strong>Bot Username</strong> এডমিন প্যানেলের "Telegram Bot" ট্যাবে গিয়ে সেভ করুন।</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-white font-bold block text-xs">২. চ্যানেলে বটকে এডমিন করুন:</span>
              <p>আপনার টেলিগ্রাম চ্যানেলে বটকে <strong>Administrator</strong> করুন এবং <strong>"Post Messages"</strong> ও <strong>"Delete Messages"</strong> পারমিশন অন রাখুন।</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-white font-bold block text-xs">৩. চ্যানেলে ডেমো পোস্ট পাঠানো:</span>
              <p>নিচের ভিডিও কার্ড থেকে <strong>"📢 চ্যানেলে ডেমো পোস্ট"</strong> বাটনে ক্লিক করলেই চ্যানেলে ডেমো ভিডিও এবং <strong>"🎬 ফুল ভিডিও দেখুন"</strong> বাটন পোস্ট হয়ে যাবে।</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-white font-bold block text-xs">৪. ১৫ অ্যাড ও ৯০ মিনিট অটো-ডিলিট:</span>
              <p>ইউজার চ্যানেলের বাটনে চাপ দিলে মিনি অ্যাপে এসে ১৫টি অ্যাড দেখবে। অ্যাড দেখা শেষ হলে চ্যানেলে <strong>protect_content</strong> সহ ফুল ভিডিও ৯০ মিনিটের জন্য আপলোড হবে এবং ৯০ মিনিট পর অটো-ডিলিট হয়ে যাবে।</p>
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Videos List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-white flex items-center justify-between">
          <span>প্রকাশিত ভিডিও তালিকা ({videos.length})</span>
          <span className="text-xs text-slate-400 font-normal">
            টেলিগ্রাম অ্যাপ ও বটে ইউজাররা সরাসরি এই ভিডিও দেখতে পাবে
          </span>
        </h3>

        {videos.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800">
            কোন লকড ভিডিও যোগ করা হয়নি। উপরের বাটন থেকে যোগ করুন।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-black">
                    <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-mono">
                      {vid.fullDuration}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                        {vid.requiredAds}টি অ্যাড প্রয়োজন
                      </span>
                      <span className="text-[10px] text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                        ⏱ {vid.expiryMinutes} মিনিট পর ডিলিট
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mt-1 line-clamp-1">{vid.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{vid.description}</p>
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block">প্রতি অ্যাড সময়</span>
                    <span className="font-bold text-purple-300">{vid.adTimerSeconds || 15} সেকেন্ড</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">মোট ভিউ</span>
                    <span className="font-bold text-white">{vid.views || 0} বার</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">আনলক সংখ্যা</span>
                    <span className="font-bold text-emerald-400">{vid.unlockedCount || 0} জন</span>
                  </div>
                </div>

                {/* Demo post & Target Channel info */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">📺 টার্গেট চ্যানেল (৯০ মি. আপলোড):</span>
                    <span className="font-mono text-emerald-400 font-bold">{vid.channelId || '@CholoIncomeKori'}</span>
                  </div>
                  {vid.demoChannelUrl && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">📢 ডেমো পোস্ট লিংক:</span>
                      <a
                        href={vid.demoChannelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:underline font-mono truncate max-w-[180px] flex items-center gap-1"
                      >
                        <span>{vid.demoChannelUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery bot info & Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePostDemoToChannel(vid)}
                    disabled={isPostingChannel === vid.id}
                    className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    title="চ্যানেলে ডেমো ভিডিও ও ফুল ভিডিও দেখার বাটন পোস্ট করুন"
                  >
                    <Send className={`w-3.5 h-3.5 ${isPostingChannel === vid.id ? 'animate-spin' : ''}`} />
                    <span>{isPostingChannel === vid.id ? 'পোস্ট হচ্ছে...' : '📢 চ্যানেলে ডেমো পোস্ট'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingVideo({ ...vid })}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="ভিডিও এডিট করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(vid.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-all cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add New Ad-Locked Video */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                নতুন অ্যাড-লকড ভিডিও যোগ করুন
              </h3>
              <button
                onClick={() => {
                  resetNewVideoForm();
                  setShowAddModal(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-0.5">১. ভিডিওর শিরোনাম (Title):</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: টেলিগ্রাম অটো ট্রাফিক অ্যান্ড আর্নিং সিক্রেট মেথড ২০২৬"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">💡 আপনার কোর্স বা ভিডিওটির আকর্ষণীয় নাম দিন যা ইউজাররা দেখতে পাবে।</p>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-0.5">২. বিবরণী (Description):</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: সম্পূর্ণ ১৬ মিনিটের সিক্রেট মেথড ভিডিও। প্রতিদিন $১৫-$২৫ ডলার আয়ের লাইভ ট্রিকস..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">💡 ভিডিওটিতে ইউজার কী শিখতে পারবে তার ১-২ লাইনের সারসংক্ষেপ।</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">৩. ডেমো ফ্রি সময় (Preview Time):</label>
                  <input
                    type="text"
                    value={previewDuration}
                    onChange={(e) => setPreviewDuration(e.target.value)}
                    placeholder="02:00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">💡 চ্যানেলে ফ্রি ট্রেলার কতক্ষণ (যেমন: 02:00)।</p>
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">৪. ফুল ভিডিওর সময় (Full Duration):</label>
                  <input
                    type="text"
                    value={fullDuration}
                    onChange={(e) => setFullDuration(e.target.value)}
                    placeholder="18:40"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">💡 মূল পুরো ভিডিওর মোট দৈর্ঘ্য (যেমন: 18:40)।</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">৫. প্রয়োজনীয় অ্যাড:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={requiredAds}
                    onChange={(e) => setRequiredAds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold text-amber-300 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">💡 ১৫টি অ্যাড দেখতে হবে।</p>
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">৬. প্রতি অ্যাড সময়:</label>
                  <select
                    value={adTimerSeconds}
                    onChange={(e) => setAdTimerSeconds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value={15}>১৫ সেকেন্ড</option>
                    <option value={30}>৩০ সেকেন্ড</option>
                    <option value={60}>৬০ সেকেন্ড</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">💡 পেজে অপেক্ষার টাইমার।</p>
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">৭. চ্যানেলে মেয়াদ:</label>
                  <input
                    type="number"
                    min="10"
                    max="1440"
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold text-emerald-400 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">💡 ৯০ মিনিট পর অটো-ডিলিট।</p>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-0.5">৮. আপনার অ্যাড নেটওয়ার্ক লিংক (Adsterra / Monetag Direct Link):</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.profitablecpmrate.com/your-adsterra-direct-link"
                  value={adNetworkUrl}
                  onChange={(e) => setAdNetworkUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">💡 ইউজার যখন অ্যাড দেখবে, তখন এই লিংকে গিয়ে আপনার Adsterra/Monetag ইনকাম যোগ হবে।</p>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-0.5">৯. ২ মিনিটের ডেমো ভিডিও লিংক (Preview Video URL):</label>
                <input
                  type="url"
                  required
                  placeholder="https://domain.com/demo.mp4 বা সরাসরি ভিডিও ফাইল লিংক"
                  value={previewVideoUrl}
                  onChange={(e) => setPreviewVideoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">💡 ১-২ মিনিটের ফ্রি ডেমো বা ট্রেলার ভিডিওর সরাসরি MP4 লিংক।</p>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-0.5">১০. সম্পূর্ণ ফুল ভিডিও লিংক (Full Video URL):</label>
                <input
                  type="url"
                  required
                  placeholder="https://domain.com/full_masterclass.mp4"
                  value={fullVideoUrl}
                  onChange={(e) => setFullVideoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">💡 মূল পুরো ভিডিওর লিংক, যা ইউজার ১৫টি অ্যাড শেষ করলে চ্যানেলে ৯০ মিনিটের জন্য আপলোড হবে।</p>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-0.5">১১. থাম্বনেইল ছবি লিংক (Thumbnail Image URL):</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... বা আপনার পোস্টার ছবি"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">💡 মিনি অ্যাপে ও টেলিগ্রামে ভিডিওর কাভার হিসেবে যে ছবিটি দেখাবে।</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">১২. টার্গেট টেলিগ্রাম চ্যানেল:</label>
                  <input
                    type="text"
                    placeholder="@CholoIncomeKori বা -100..."
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">💡 যে চ্যানেলে ফুল ভিডিও ৯০ মিনিটের জন্য আপলোড হবে।</p>
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-0.5">১৩. ডেমো পোস্ট লিংক (ঐচ্ছিক):</label>
                  <input
                    type="url"
                    placeholder="https://t.me/CholoIncomeKori/123"
                    value={demoChannelUrl}
                    onChange={(e) => setDemoChannelUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">💡 খালি রাখতে পারেন! চ্যানেলে ডেমো পোস্ট বাটনে চাপলে অটো তৈরি হবে।</p>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-0.5">১৪. ডেলিভারি বট ইউজারনেম (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="যেমন: CholoIncome_Bot"
                  value={deliveryBotHandle}
                  onChange={(e) => setDeliveryBotHandle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    resetNewVideoForm();
                    setShowAddModal(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <AdminSaveButton
                  id="admin-add-ad-video-btn"
                  isDirty={Boolean(title.trim().length > 0 && fullVideoUrl.trim().length > 0)}
                  isSaving={isSubmitting}
                  isSaved={isVideoSaved}
                  defaultText="ভিডিও পাবলিশ করুন"
                  savingText="ভিডিও সংরক্ষণ হচ্ছে..."
                  savedText="ভিডিও সংরক্ষিত হয়েছে! ✓"
                  type="submit"
                  className="flex-1"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Ad-Locked Video */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                লকড ভিডিও তথ্য এডিট করুন (Edit Video)
              </h3>
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">ভিডিও শিরোনাম (Title):</label>
                <input
                  type="text"
                  required
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">ভিডিও বিবরণী (Description):</label>
                <textarea
                  rows={2}
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">প্রিভিউ সময় (Preview):</label>
                  <input
                    type="text"
                    value={editingVideo.previewDuration || '02:00'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, previewDuration: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">সম্পূর্ণ ভিডিও সময় (Full):</label>
                  <input
                    type="text"
                    value={editingVideo.fullDuration || '18:40'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, fullDuration: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">থাম্বনেইল ইমেজ URL:</label>
                <input
                  type="url"
                  value={editingVideo.thumbnail || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">প্রিভিউ ভিডিও URL (সরাসরি দেখা যাবে):</label>
                <input
                  type="url"
                  value={editingVideo.previewVideoUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, previewVideoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-amber-300 block mb-1">
                  মূল সম্পূর্ণ ভিডিও লিংক (অ্যাড দেখার পর আনলক হবে):
                </label>
                <input
                  type="url"
                  required
                  value={editingVideo.fullVideoUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, fullVideoUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">প্রয়োজনীয় অ্যাড সংখ্যা:</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingVideo.requiredAds}
                    onChange={(e) => setEditingVideo({ ...editingVideo, requiredAds: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">প্রতি অ্যাড টাইমার (সেকেন্ড):</label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={editingVideo.adTimerSeconds || 15}
                    onChange={(e) => setEditingVideo({ ...editingVideo, adTimerSeconds: Number(e.target.value) || 15 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">মেয়াদ (মিনিট):</label>
                  <input
                    type="number"
                    min="10"
                    max="1440"
                    value={editingVideo.expiryMinutes || 90}
                    onChange={(e) => setEditingVideo({ ...editingVideo, expiryMinutes: Number(e.target.value) || 90 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">অ্যাড নেটওয়ার্ক নাম:</label>
                  <input
                    type="text"
                    value={editingVideo.adNetworkName || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, adNetworkName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">ডেলিভারি বট ইউজারনেম:</label>
                  <input
                    type="text"
                    value={editingVideo.deliveryBotHandle || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, deliveryBotHandle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">অ্যাড ডিরেক্ট লিংক (Monetag/Adsterra):</label>
                <input
                  type="url"
                  value={editingVideo.adNetworkUrl || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, adNetworkUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">টার্গেট চ্যানেল (৯০ মি. আপলোড):</label>
                  <input
                    type="text"
                    placeholder="@CholoIncomeKori বা -100..."
                    value={editingVideo.channelId || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, channelId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">ডেমো পোস্ট লিংক (চ্যানেল):</label>
                  <input
                    type="url"
                    placeholder="https://t.me/CholoIncomeKori/123"
                    value={editingVideo.demoChannelUrl || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, demoChannelUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <AdminSaveButton
                  id="admin-update-ad-video-btn"
                  isDirty={true}
                  isSaving={isEditingSaving}
                  isSaved={isEditingSaved}
                  defaultText="সেভ করুন (Save Changes)"
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
    </div>
  );
};
