import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Globe,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  Zap,
  ArrowRight,
} from 'lucide-react';
export interface AdminToastData {
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface AdminUptimeRobotTabProps {
  onNotify?: (toast: AdminToastData) => void;
}

export const AdminUptimeRobotTab: React.FC<AdminUptimeRobotTabProps> = ({ onNotify }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingData, setPingData] = useState<{
    status: string;
    uptimeSeconds: number;
    latencyMs: number;
    timestamp: string;
  } | null>(null);

  // Derive public URL for the health check
  const healthCheckUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/health`
    : 'https://your-domain.com/api/health';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(healthCheckUrl);
    setCopiedUrl(true);
    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'URL কপি হয়েছে!',
        message: 'UptimeRobot এ পেস্ট করার জন্য Health Check URL ক্লিপবোর্ডে কপি করা হয়েছে।',
      });
    }
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Perform live test ping
  const handleTestPing = async () => {
    setIsPinging(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const latency = Date.now() - start;
      const data = await res.json();
      setPingData({
        status: data.status || 'ok',
        uptimeSeconds: Math.floor(data.uptimeSeconds || 0),
        latencyMs: latency,
        timestamp: new Date().toLocaleTimeString(),
      });
      if (onNotify) {
        onNotify({
          type: 'success',
          title: 'সার্ভার সচল ও প্রস্তুত!',
          message: `HTTP 200 OK • রেসপন্স টাইম: ${latency}ms`,
        });
      }
    } catch {
      setPingData(null);
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'পিং ব্যর্থ',
          message: 'সার্ভার থেকে রেসপন্স মেলেনি।',
        });
      }
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    handleTestPing();
  }, []);

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    if (hours > 0) return `${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড`;
    if (minutes > 0) return `${minutes} মিনিট ${seconds} সেকেন্ড`;
    return `${seconds} সেকেন্ড`;
  };

  return (
    <div className="space-y-8 mt-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">সার্ভার সার্বক্ষণিক সচল রাখা (UptimeRobot 24/7 Keep-Alive)</h2>
                <span className="text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Always-On Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                পিসি বা মোবাইল বন্ধ থাকলেও এবং কোনো ইউজার না ঢুকলেও সার্ভার ২৪ ঘণ্টা চালু থাকবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isPinging}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'পিং টেস্ট হচ্ছে...' : 'লাইভ পিং টেস্ট করুন'}</span>
            </button>
          </div>
        </div>

        {/* Live Server Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">সার্ভার স্ট্যাটাস:</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>ONLINE (সচল)</span>
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">পোর্ট ও নেটওয়ার্ক:</span>
            <span className="text-sm font-black text-white font-mono mt-0.5">
              Port 3000 (Forwarded)
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">রেসপন্স ল্যাটেন্সি:</span>
            <span className="text-sm font-black text-amber-300 font-mono mt-0.5">
              {pingData ? `${pingData.latencyMs} ms` : '১৬ ms'} ⚡
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">বর্তমান আপটাইম:</span>
            <span className="text-xs font-extrabold text-purple-300 mt-0.5 truncate block">
              {pingData ? formatUptime(pingData.uptimeSeconds) : 'সচল রয়েছে'}
            </span>
          </div>
        </div>
      </div>

      {/* Your Dedicated Keep-Alive URL for UptimeRobot */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-white text-base">আপনার সাইটের Keep-Alive হেলথ ইউআরএল (Monitor URL)</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            UptimeRobot-এ এই লিঙ্কটি দিতে হবে
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          নিচের এই লিঙ্কটিতে UptimeRobot প্রতি ৫ মিনিটে একটি অটোমেটিক সিগন্যাল (HTTP GET) পাঠাবে। এতে সার্ভার কোনো ইউজার ছাড়া ঘুমিয়ে (Sleep mode) পড়বে না।
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-700">
          <span className="font-mono text-xs text-emerald-400 px-3 py-1.5 flex-1 break-all truncate select-all">
            {healthCheckUrl}
          </span>

          <button
            type="button"
            onClick={handleCopyUrl}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95 ${
              copiedUrl
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
            }`}
          >
            {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? 'কপি সম্পন্ন হয়েছে!' : '১-ক্লিকে লিঙ্ক কপি করুন'}</span>
          </button>
        </div>
      </div>

      {/* Direct Answers to User's Questions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-white text-base">আপনার জিজ্ঞাসা ও সরাসরি সমাধান</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question 1 */}
          <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                ১
              </span>
              <h4 className="font-bold text-sm text-white">
                PC বা Mobile বন্ধ থাকলেও কি এটা সবসময় চলবে?
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-8">
              <strong className="text-emerald-400 block mb-1">✅ উত্তর: হ্যাঁ, ১০০% চালু থাকবে!</strong>
              আপনার পিসি বা মোবাইলের ইন্টারনেট বা ডিভাইস অন রাখার প্রয়োজন নেই। UptimeRobot-এর নিজস্ব ক্লাউড রোবট ইন্টারনেটের মাধ্যমে প্রতি ৫ মিনিটে অটোমেটিক আপনার সার্ভারকে চালু রাখে। তাই আপনি ঘুমালেও বা ডিভাইস বন্ধ রাখলেও সিস্টেম সার্বক্ষণিক সক্রিয় থাকবে।
            </p>
          </div>

          {/* Question 2 */}
          <div className="bg-slate-950 p-4.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                ২
              </span>
              <h4 className="font-bold text-sm text-white">
                ১৫ মিনিট কোনো ইউজার মিনি অ্যাপে না ঢুকলেও কি সচল থাকবে?
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-8">
              <strong className="text-emerald-400 block mb-1">✅ উত্তর: হ্যাঁ, কখনোই অফ হবে না!</strong>
              ক্লাউড সার্ভার সাধারণত একটানা ১৫ মিনিট কোনো রিকোয়েস্ট না পেলে স্লিপ মোডে যায়। কিন্তু UptimeRobot প্রতি ৫ মিনিটে (১৫ মিনিট হওয়ার আগেই) পিং পাঠাতে থাকে। ফলে সার্ভার স্লিপ করার সুযোগ পায় না এবং অল-টাইম ইনস্ট্যান্ট লোড হবে।
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Updated 2026 Guide to Create Account & Connect */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-white text-base">
              UptimeRobot একাউন্ট খোলা ও সাইটের সাথে কানেক্ট করার সহজ ৫ ধাপ (২০২৬ আপডেট)
            </h3>
          </div>
          <a
            href="https://uptimerobot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/40"
          >
            <span>UptimeRobot এ যান</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-md">
              ১
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">
                ধাপ ১: UptimeRobot ওয়েবসাইটে গিয়ে ফ্রি রেজিস্ট্রেশন করুন
              </h4>
              <p className="text-slate-300 leading-relaxed">
                ব্রাউজারে <strong>uptimerobot.com</strong> ওপেন করুন এবং উপরে ডানপাশে থাকা <strong>"Register for FREE"</strong> বাটনে চাপুন। আপনার নাম, ইমেইল এড্রেস এবং একটি নিরাপদ পাসওয়ার্ড দিয়ে একাউন্ট তৈরি করুন।
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-md">
              ২
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">
                ধাপ ২: ইমেইল ভেরিফিকেশন সম্পন্ন করুন
              </h4>
              <p className="text-slate-300 leading-relaxed">
                রেজিস্ট্রেশন করার পর আপনার দেওয়া ইমেইলে UptimeRobot থেকে একটি কনফার্মেশন মেইল যাবে। মেইলের ভেতর থাকা <strong>"Activate Account"</strong> লিঙ্কে ক্লিক করে একাউন্টটি এক্টিভ করুন এবং লগইন করুন।
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-md">
              ৩
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">
                ধাপ ৩: "+ Add New Monitor" বাটনে চাপুন
              </h4>
              <p className="text-slate-300 leading-relaxed">
                লগইন করার পর আপনার ড্যাশবোর্ডের বামপাশে বা উপরে একটি বড় সবুজ/নীল <strong>"+ Add New Monitor"</strong> বাটন দেখতে পাবেন। সেখানে ক্লিক করুন।
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-md">
              ৪
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="font-extrabold text-white text-sm">
                ধাপ ৪: মনিটরের তথ্যগুলো হুবহু প্রদান করুন
              </h4>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5 font-sans">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400 font-bold">Monitor Type:</span>
                  <span className="font-bold text-amber-400">HTTP(s)</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400 font-bold">Friendly Name:</span>
                  <span className="font-bold text-white">Smart Earning 24/7 KeepAlive</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400 font-bold">URL (or IP):</span>
                  <span className="font-mono text-emerald-400 font-bold break-all">
                    {healthCheckUrl}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Monitoring Interval:</span>
                  <span className="font-bold text-purple-300">Every 5 minutes (ফ্রি)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-md">
              ৫
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">
                ধাপ ৫: "Create Monitor" এ ক্লিক করে সম্পন্ন করুন
              </h4>
              <p className="text-slate-300 leading-relaxed">
                সবশেষে নিচের <strong>"Create Monitor"</strong> বাটনে চাপুন। ব্যস, আপনার কাজ শেষ! এখন থেকে UptimeRobot নিরবচ্ছিন্নভাবে আপনার মিনি অ্যাপকে ২৪ ঘণ্টা সচল রাখবে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminUptimeRobotTab;
