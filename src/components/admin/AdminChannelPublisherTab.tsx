import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Film,
  Zap,
  HelpCircle,
  Clock,
  Radio,
  Copy,
  Check,
  Upload,
  Video,
  FileVideo,
  X,
} from 'lucide-react';
import { ChannelPublisherPost, AdLockedVideo } from '../../types';
import { AdminFloatingToast, AdminToastData } from './AdminFloatingToast';

export const AdminChannelPublisherTab: React.FC = () => {
  // Form fields
  const [targetChannel, setTargetChannel] = useState('@demovideos24');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('🔥 নতুন প্রিমিয়াম স্পেশাল ভিডিও (Demo & Full Video)');
  const [description, setDescription] = useState(
    'আজকের এই ভিডিওতে বিস্তারিত প্র্যাক্টিক্যাল টিপস দেওয়া হয়েছে।\nনিচের বাটনগুলো ক্লিক করে ডেমো দেখে নিন এবং সম্পূর্ণ ফুল ভিডিওটি ইনস্ট্যান্ট আনলক করুন!'
  );
  const [thumbnail, setThumbnail] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  );
  const [videoUrl, setVideoUrl] = useState('');
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [demoUrl, setDemoUrl] = useState('https://t.me/demovideos24');
  const [fullVideoUrl, setFullVideoUrl] = useState('https://t.me/CholoIncomeKoriBot/app?startapp=video_lock-vid-1791044592233');
  const [tutorialUrl, setTutorialUrl] = useState('https://t.me/CholoIncomeKori');

  // Status & loading
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<ChannelPublisherPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [toast, setToast] = useState<AdminToastData | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Locked videos for quick autofill
  const [lockedVideos, setLockedVideos] = useState<AdLockedVideo[]>([]);

  // Fetch published posts
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch('/api/admin/channel-publisher/posts');
      const data = await res.json();
      if (data.posts && Array.isArray(data.posts)) {
        setPublishedPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch locked videos for quick autofill
  const fetchLockedVideos = async () => {
    try {
      const res = await fetch('/api/ad-videos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLockedVideos(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchPosts();
    fetchLockedVideos();
  }, []);

  // Handle Video File Selection
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 48) {
      setToast({
        type: 'error',
        title: 'ফাইল অতিরিক্ত বড়',
        message: `ভিডিও ফাইলের সাইজ (${sizeMb.toFixed(1)}MB) সর্বোচ্চ 48MB হতে পারবে। এর চেয়ে বড় ভিডিও হলে সরাসরি Telegram Video Link অথবা Video URL দিন।`,
      });
      return;
    }

    setMediaType('video');
    setVideoFileName(file.name);
    setVideoFileSize(`${sizeMb.toFixed(1)} MB`);
    setVideoPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      setVideoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearVideoFile = () => {
    setVideoBase64(null);
    setVideoFileName(null);
    setVideoFileSize(null);
    setVideoPreviewUrl(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  // Handle Quick Autofill from an existing locked video
  const handleAutofillFromVideo = (vid: AdLockedVideo) => {
    setTitle(vid.title);
    if (vid.description) {
      setDescription(vid.description);
    }
    if (vid.thumbnail) {
      setThumbnail(vid.thumbnail);
    }
    if (vid.fullVideoUrl) {
      setVideoUrl(vid.fullVideoUrl);
    }
    if (vid.demoChannelUrl) {
      setDemoUrl(vid.demoChannelUrl);
    } else if (vid.previewVideoUrl && vid.previewVideoUrl.includes('t.me')) {
      setDemoUrl(vid.previewVideoUrl);
    }
    if (vid.channelId) {
      setTargetChannel(vid.channelId);
    }
    setFullVideoUrl(`https://t.me/CholoIncomeKoriBot/app?startapp=video_${vid.id}`);
    setToast({
      type: 'info',
      title: 'ডাটা লোড হয়েছে',
      message: `"${vid.title}" থেকে টাইটেল, থাম্বনেইল, ভিডিও ও লিঙ্ক ফর্মটিতে বসানো হয়েছে।`,
    });
  };

  // Handle Publish Post
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setToast({
        type: 'error',
        title: 'ভুল ইনপুট',
        message: 'অনুগ্রহ করে একটি পোস্ট টাইটেল লিখুন।',
      });
      return;
    }

    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/channel-publisher/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetChannel: targetChannel.trim(),
          mediaType,
          thumbnail: mediaType === 'image' ? thumbnail.trim() : '',
          videoUrl: mediaType === 'video' ? videoUrl.trim() : '',
          videoBase64: mediaType === 'video' ? videoBase64 : null,
          videoFileName: mediaType === 'video' ? videoFileName : null,
          title: title.trim(),
          description: description.trim(),
          demoUrl: demoUrl.trim(),
          fullVideoUrl: fullVideoUrl.trim(),
          tutorialUrl: tutorialUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'success',
          title: 'পাবলিশ সম্পন্ন!',
          message: data.message || `পোস্টটি ${targetChannel} চ্যানেলে সফলভাবে পাঠানো হয়েছে!`,
        });
        if (data.allPosts) {
          setPublishedPosts(data.allPosts);
        } else {
          fetchPosts();
        }
      } else {
        setToast({
          type: 'error',
          title: 'পাবলিশ ব্যর্থ',
          message: data.error || 'টেলিগ্রাম চ্যানেলে পোস্ট পাঠানো সম্ভব হয়নি।',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: err.message || 'সার্ভারে সংযোগ করা সম্ভব হয়নি।',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Delete Post from Channel
  const handleDeletePost = async (id: string) => {
    if (!confirm('আপনি কি এই পোস্টটি টেলিগ্রাম চ্যানেল ও তালিকা থেকে মুছে ফেলতে চান?')) return;

    try {
      const res = await fetch('/api/admin/channel-publisher/delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'success',
          title: 'পোস্ট ডিলিট হয়েছে',
          message: 'টেলিগ্রাম চ্যানেল থেকে পোস্টটি সরানো হয়েছে।',
        });
        if (data.allPosts) {
          setPublishedPosts(data.allPosts);
        } else {
          fetchPosts();
        }
      } else {
        setToast({
          type: 'error',
          title: 'ডিলিট ব্যর্থ',
          message: data.error || 'পোস্ট ডিলিট করা যায়নি।',
        });
      }
    } catch (e: any) {
      setToast({
        type: 'error',
        title: 'সার্ভার ত্রুটি',
        message: e.message,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminFloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-md">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  📢 চ্যানেল পোস্ট পাবলিশার (Channel Post Publisher)
                </h2>
                <p className="text-xs text-blue-200/80 mt-0.5 font-medium">
                  থাম্বনেইল, টাইটেল, বিবরণ ও ৩টি ইনলাইন বাটনসহ টেলিগ্রাম চ্যানেলে স্বয়ংক্রিয়ভাবে আকর্ষণীয় পোস্ট করুন
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchPosts}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPosts ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Quick autofill from locked videos pills */}
        {lockedVideos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-500/20 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              লকড ভিডিও থেকে এক ক্লিকে ডাটা বসান:
            </span>
            {lockedVideos.slice(0, 4).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleAutofillFromVideo(v)}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-[11px] font-semibold text-slate-300 transition-all flex items-center gap-1.5"
              >
                <Film className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[140px]">{v.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Form (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              পোস্ট কনফিগারেশন ও বিবরণ
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-full">
              ৩টি ইনলাইন বাটন
            </span>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            {/* Target Channel */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>🎯 টার্গেট টেলিগ্রাম চ্যানেল (Target Channel)</span>
                <span className="text-[10px] text-amber-400 font-normal">বটকে অবশ্যই চ্যানেলে এডমিন থাকতে হবে</span>
              </label>

              {/* Quick channel chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { handle: '@CholoIncomeKoriBot', label: '🤖 বটের চ্যাটবক্স (@CholoIncomeKoriBot - Open App বাটনের উপরে)' },
                  { handle: '@demovideos24', label: 'ডেমো চ্যানেল (@demovideos24)' },
                  { handle: '@CholoIncomeKori', label: 'অফিসিয়াল (@CholoIncomeKori)' },
                  { handle: '@IncomeBD_Online', label: 'ব্যাকআপ (@IncomeBD_Online)' },
                ].map((ch) => (
                  <button
                    key={ch.handle}
                    type="button"
                    onClick={() => setTargetChannel(ch.handle)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      targetChannel === ch.handle
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={targetChannel}
                onChange={(e) => setTargetChannel(e.target.value)}
                placeholder="@yourchannelname বা https://t.me/yourchannel"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                🎬 পোস্ট টাইটেল (Video / Post Title) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="উদাহরণ: 🔥 নতুন প্রিমিয়াম স্পেশাল মেথড ভিডিও"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                📝 পোস্ট বিবরণ / ক্যাপশন (Description & Rules)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ভিডিও সম্পর্কে আকর্ষণীয় বিবরণ লিখুন..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-sans resize-y"
              />
            </div>

            {/* Media Type Toggle: Image vs Video */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>🎨 পোস্টের মিডিয়া মোড (Post Media Type)</span>
                <span className="text-[10px] text-amber-400 font-medium">থাম্বনেইল বা সরাসরি ভিডিও পোস্ট করুন</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mediaType === 'image'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>🖼️ থাম্বনেইল ছবি (Photo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    mediaType === 'video'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>🎬 ভিডিও পোস্ট (Video Post / Upload)</span>
                </button>
              </div>

              {/* MEDIA OPTION A: THUMBNAIL PHOTO */}
              {mediaType === 'image' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>🖼️ থাম্বনেইল ছবির লিঙ্ক (Thumbnail Image URL)</span>
                    <span className="text-[10px] text-blue-400">Telegram Photo Post হিসেবে যাবে</span>
                  </label>
                  <input
                    type="url"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  {/* Sample image quick chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] text-slate-400">
                    <span className="shrink-0 font-semibold">স্যাম্পল:</span>
                    <button
                      type="button"
                      onClick={() => setThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    >
                      Gradient Amber
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnail('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    >
                      Tech Retro
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnail('https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    >
                      Social Media
                    </button>
                  </div>
                </div>
              )}

              {/* MEDIA OPTION B: VIDEO POST & DIRECT UPLOAD */}
              {mediaType === 'video' && (
                <div className="space-y-3 p-3.5 bg-slate-950/80 border border-blue-500/30 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-amber-400" />
                      ভিডিও ফাইল নির্বাচন অথবা সরাসরি লিঙ্ক দিন
                    </span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                      MP4 / WebM / MOV
                    </span>
                  </div>

                  {/* 1. Direct Video File Upload */}
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoFileChange}
                    accept="video/mp4,video/webm,video/quicktime,video/mkv"
                    className="hidden"
                  />

                  {videoFileName ? (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileVideo className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-200 truncate">{videoFileName}</p>
                          <span className="text-[10px] text-emerald-400 font-mono">{videoFileSize} • প্রস্তুত</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearVideoFile}
                        className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-rose-900/80 text-slate-300 hover:text-white transition-colors"
                        title="ফাইল মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/30 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span>📁 মোবাইল বা কম্পিউটার থেকে ভিডিও ফাইল আপলোড করুন</span>
                    </button>
                  )}

                  {/* 2. Or Direct Video URL input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      অথবা সরাসরি ভিডিও লিংক (Direct Video URL):
                    </label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://example.com/video.mp4 অথবা https://t.me/channel/post"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3 Inline Buttons Configuration Section */}
            <div className="p-4 bg-slate-950/70 border border-blue-500/20 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">
                  🔘 ৩টি ইনলাইন বাটন লিঙ্ক (Inline Keyboard Buttons)
                </span>
              </div>

              {/* Button 1: Watch Demo */}
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>বাটন ১: “👀 Watch Demo” URL</span>
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://t.me/demovideos24/3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  ইউজার এই বাটনে চাপ দিলে ডেমো ভিডিও পোস্টে চলে যাবে
                </span>
              </div>

              {/* Button 2: Watch Full Video & Clear Guidance Helper */}
              <div className="space-y-2 pt-1">
                <div className="p-3 bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-slate-950 border border-blue-500/40 rounded-xl space-y-1.5 text-xs text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 text-blue-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>💡 "Watch Full Video URL" বক্সে কোন URL বা কী দিবেন?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    চ্যানেলের পোস্টে ইউজাররা <b>“🚀 Watch Full Video (Watch Now)”</b> বাটনে চাপ দিলে টেলিগ্রাম সরাসরি আপনার মিনি অ্যাপটি ওপেন করে দেবে এবং এই ভিডিওটি আনলক করতে নিয়ে যাবে।
                  </p>
                  <p className="text-[11px] text-amber-300/90 font-mono">
                    ফরম্যাট: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200 font-bold">https://t.me/CholoIncomeKoriBot/app?startapp=video_[আইডি]</code>
                  </p>
                  <div className="pt-1.5 flex flex-wrap gap-1.5 items-center border-t border-blue-500/20">
                    <span className="text-[10px] text-slate-400 font-bold">ক্লিক করে বসান:</span>
                    <button
                      type="button"
                      onClick={() => setFullVideoUrl('https://t.me/CholoIncomeKoriBot/app')}
                      className="px-2 py-0.5 rounded bg-blue-900/80 hover:bg-blue-800 text-white text-[10px] font-semibold border border-blue-400/40"
                    >
                      📱 মিনি অ্যাপ মেইন লিংক
                    </button>
                    {lockedVideos.slice(0, 3).map((lv) => (
                      <button
                        key={lv.id}
                        type="button"
                        onClick={() => setFullVideoUrl(`https://t.me/CholoIncomeKoriBot/app?startapp=video_${lv.id}`)}
                        className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[10px] font-semibold border border-amber-500/40 truncate max-w-[150px]"
                        title={lv.title}
                      >
                        🎬 {lv.title}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-[11px] font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>বাটন ২: “🚀 Watch Full Video (Watch Now)” URL *</span>
                </label>
                <input
                  type="url"
                  value={fullVideoUrl}
                  onChange={(e) => setFullVideoUrl(e.target.value)}
                  placeholder="https://t.me/CholoIncomeKoriBot/app?startapp=video_1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
                  required
                />
              </div>

              {/* Button 3: Tutorial URL */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>বাটন ৩: “💡 How to watch videos? (Tutorial)” URL</span>
                </label>
                <input
                  type="url"
                  value={tutorialUrl}
                  onChange={(e) => setTutorialUrl(e.target.value)}
                  placeholder="https://t.me/CholoIncomeKori"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  ভিডিও দেখার নিয়মাবলি সংক্রান্ত পোস্ট বা টেলিগ্রাম চ্যানেলের লিংক
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>চ্যানেলে পাবলিশ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>🚀 টেলিগ্রাম চ্যানেলে পোস্ট পাবলিশ করুন (Publish Now)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Interactive Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                লাইভ টেলিগ্রাম প্রিভিউ (Live Channel Preview)
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                What user sees
              </span>
            </div>

            {/* Telegram Channel Post Mockup Card */}
            <div className="bg-[#18222d] border border-[#2b394a] rounded-2xl overflow-hidden shadow-2xl text-white">
              {/* Channel Header */}
              <div className="p-3 bg-[#242f3d] flex items-center justify-between border-b border-slate-700/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
                    {targetChannel.replace('@', '').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {targetChannel === '@demovideos24'
                        ? 'Demo Video Unlocked'
                        : targetChannel.replace('@', '')}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {targetChannel} • channel
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">now</span>
              </div>

              {/* Media Preview: Video vs Photo Banner */}
              {mediaType === 'video' ? (
                videoPreviewUrl ? (
                  <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                    <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600/90 text-white font-bold text-[10px] flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      ভিডিও ফাইল প্রিভিউ
                    </div>
                  </div>
                ) : videoUrl ? (
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-400 mb-2">
                      <Film className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-white">🎬 টেলিগ্রাম ভিডিও পোস্ট</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[240px] mt-1">{videoUrl}</span>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-amber-300">
                      Telegram Video
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 flex flex-col items-center gap-1.5">
                    <Film className="w-6 h-6 text-amber-400/50" />
                    <span>কোনো ভিডিও ফাইল বা লিঙ্ক সিলেক্ট করা হয়নি</span>
                  </div>
                )
              ) : thumbnail ? (
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <img
                    src={thumbnail}
                    alt="Channel Post Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-amber-300">
                    Preview Image
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-6 h-6 opacity-40" />
                  <span>কোনো থাম্বনেইল দেওয়া হয়নি (Text Post)</span>
                </div>
              )}

              {/* Caption */}
              <div className="p-3.5 space-y-2 text-xs leading-relaxed font-sans">
                <h4 className="font-black text-white text-sm">
                  🎬 {title || 'পোস্ট টাইটেল এখানে প্রদর্শিত হবে'}
                </h4>
                {description && (
                  <p className="text-slate-300 whitespace-pre-line text-[11px] leading-relaxed">
                    {description}
                  </p>
                )}
                <div className="pt-1.5 border-t border-slate-700/50 text-[10px] text-slate-400 font-medium">
                  👇 <b>ভিডিওটি দেখতে নিচের বাটনগুলো ব্যবহার করুন:</b>
                </div>
              </div>

              {/* 3 Telegram Inline Keyboard Buttons */}
              <div className="p-3 pt-1 space-y-1.5 bg-[#17212b]">
                {/* Button 1 */}
                <a
                  href={demoUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2b5278] hover:bg-[#33618e] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.99] border border-[#3e6b99]/40"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>👀 Watch Demo</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </a>

                {/* Button 2 */}
                <a
                  href={fullVideoUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#2481cc] hover:bg-[#2b96ec] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.99] border border-[#459ce4]/40"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>🚀 Watch Full Video (Watch Now)</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </a>

                {/* Button 3 */}
                <a
                  href={tutorialUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-[#2b5278]/80 hover:bg-[#33618e] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-[0.99] border border-[#3e6b99]/30"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>💡 How to watch videos? (Tutorial)</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </a>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1 text-blue-300">
                <Sparkles className="w-3.5 h-3.5" />
                কীভাবে কাজ করে?
              </span>
              <p>
                ১. <b>Watch Demo:</b> ক্লিক করলে সরাসরি চ্যানেলে থাকা ডেমো ভিডিওটি ওপেন হবে।
              </p>
              <p>
                ২. <b>Watch Full Video:</b> ক্লিক করলে আপনার মিনি অ্যাপ চালু হবে এবং ইউজার এডস দেখে ফুল ভিডিওটি চ্যানেলে পেতে পারবে।
              </p>
              <p>
                ৩. <b>Tutorial:</b> কীভাবে ভিডিও দেখতে হয় তার নির্দেশিকা পেইজ ওপেন হবে।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Published Posts History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              চ্যানেলে পাবলিশ করা পূর্বের পোস্টসমূহ ({publishedPosts.length})
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            সর্বশেষ পাবলিশ করা পোস্টগুলো উপরে থাকে
          </span>
        </div>

        {publishedPosts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
            <Send className="w-6 h-6 mx-auto text-slate-600" />
            <p className="font-bold text-slate-300">এখনও কোনো পোস্ট পাবলিশ করা হয়নি</p>
            <p className="text-[11px] text-slate-500">
              উপরের ফর্ম থেকে তথ্য দিয়ে 'পাবলিশ করুন' বাটনে ক্লিক করলেই আপনার টেলিগ্রাম চ্যানেলে পোস্ট তৈরি হয়ে যাবে।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                {post.thumbnail && (
                  <div className="relative aspect-video w-full bg-slate-900">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                      {post.targetChannel}
                    </div>
                    {post.messageId && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-blue-600 text-[10px] font-bold text-white">
                        #{post.messageId}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-white leading-snug line-clamp-2">
                      {post.title}
                    </h4>
                    {post.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {post.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(post.publishedAt).toLocaleTimeString()} • {new Date(post.publishedAt).toLocaleDateString()}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> লাইভ
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {post.postUrl && (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>চ্যানেলে দেখুন</span>
                        </a>
                      )}

                      {post.postUrl && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(post.postUrl!)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          title="পোস্ট লিংক কপি করুন"
                        >
                          {copiedLink === post.postUrl ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-colors border border-rose-500/20"
                        title="চ্যানেল ও তালিকা থেকে মুছুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
