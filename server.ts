import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_VIDEOS,
  INITIAL_AD_LOCKED_VIDEOS,
  INITIAL_DIGITAL_PACKAGES,
  INITIAL_PACKAGE_ORDERS,
  DEFAULT_PAYMENT_CONFIG,
  INITIAL_INCOME_TASKS,
} from "./src/data";
import { IncomeTask } from "./src/types";

// Derive directory safely in both dev (tsx/ESM) and prod (bundled CJS)
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

// Local Disk Persistent Storage System (Guarantees data survives Render sleep, restarts, and redeployments)
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

function loadJsonFile<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(fallback) && Array.isArray(parsed)) {
        return parsed as T;
      } else if (!Array.isArray(fallback) && parsed && typeof parsed === "object") {
        return parsed as T;
      }
    }
  } catch (err) {
    console.warn(`[Storage] Failed to read ${filename}:`, err);
  }
  return fallback;
}

function saveJsonFile<T>(filename: string, data: T): void {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[Storage] Failed to save ${filename}:`, err);
  }
}

// Persistent user profiles state (multi-tenant support)
const ADMIN_ID = "usr_78912";
const DEFAULT_ADMIN_PROFILE = {
  id: ADMIN_ID,
  username: "@RUBI_SH",
  displayName: "SALAUDDIN SH (ADMIN)",
  email: "funnymovies887@gmail.com",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  role: "VIP Platinum Member",
  balanceUsd: 3.10,
  pendingReferralBonusUsd: 0.00,
  joinedCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  todayReferrals: 0,
  activeReferralsWithActivity: 3,
  adsWatchedToday: 0,
  dailyAdLimit: 40,
  referralCode: "choloincome_bot",
  language: "bn",
  currency: "BDT",
  claimedDailyTiers: [] as number[],
  completedTaskIds: [] as string[],
  referralCommissionRate: 5,
  totalCommissionEarnedUsd: 0.00,
  claimableCommissionUsd: 0.00,
  referralCommissionHistory: [] as any[],
  createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
};

let usersMap: Record<string, any> = loadJsonFile("users.json", {});
if (!usersMap[ADMIN_ID]) {
  const oldProfile = loadJsonFile("user_profile.json", null);
  usersMap[ADMIN_ID] = oldProfile || { ...DEFAULT_ADMIN_PROFILE };
  saveJsonFile("users.json", usersMap);
}

// Helper to get or create isolated user profile
function getRequestUser(req: express.Request): any {
  const rawId = (
    req.headers["x-user-id"] ||
    req.query.userId ||
    req.body?.userId ||
    req.body?.user?.id ||
    req.body?.id
  ) as string;

  const cleanId = rawId ? String(rawId).trim() : "";

  if (cleanId) {
    // Only return admin profile if explicitly matching ADMIN_ID and accessed as admin
    if (cleanId === ADMIN_ID) {
      return usersMap[ADMIN_ID] || { ...DEFAULT_ADMIN_PROFILE };
    }

    if (usersMap[cleanId]) {
      const qName = (req.query.displayName || req.body?.displayName) as string;
      const qUsername = (req.query.username || req.body?.username) as string;
      const qAvatar = (req.query.avatarUrl || req.body?.avatarUrl) as string;
      let changed = false;
      if (qName && qName !== usersMap[cleanId].displayName && !qName.includes("SALAUDDIN")) {
        usersMap[cleanId].displayName = qName;
        changed = true;
      }
      if (qUsername && qUsername !== usersMap[cleanId].username && !qUsername.includes("RUBI_SH")) {
        usersMap[cleanId].username = qUsername.startsWith("@") ? qUsername : `@${qUsername}`;
        changed = true;
      }
      if (qAvatar && (!usersMap[cleanId].avatarUrl || usersMap[cleanId].avatarUrl.includes("dicebear"))) {
        usersMap[cleanId].avatarUrl = qAvatar;
        changed = true;
      }
      if (changed) {
        saveJsonFile("users.json", usersMap);
      }
      return usersMap[cleanId];
    }

    // Check if it's admin username (ONLY for admin login)
    if (cleanId.toLowerCase() === "@rubi_sh" || cleanId.toLowerCase() === "rubi_sh" || cleanId.toLowerCase() === "funnymovies887") {
      return usersMap[ADMIN_ID] || { ...DEFAULT_ADMIN_PROFILE };
    }

    // Auto-create isolated brand new user profile with 0.00 balance!
    const qName = (req.query.displayName || req.body?.displayName) as string;
    const qUsername = (req.query.username || req.body?.username) as string;
    const qAvatar = (req.query.avatarUrl || req.body?.avatarUrl) as string;

    const newUser = {
      id: cleanId,
      username: qUsername ? (qUsername.startsWith("@") ? qUsername : `@${qUsername}`) : `@user_${cleanId.slice(-5)}`,
      displayName: qName || `সদস্য #${cleanId.slice(-4)}`,
      email: "",
      avatarUrl: qAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanId}`,
      role: "Free Member",
      balanceUsd: 0.00,
      pendingReferralBonusUsd: 0.00,
      joinedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      todayReferrals: 0,
      activeReferralsWithActivity: 0,
      adsWatchedToday: 0,
      dailyAdLimit: 40,
      referralCode: `user_${cleanId}`,
      language: "bn",
      currency: "BDT",
      claimedDailyTiers: [],
      completedTaskIds: [],
      referralCommissionRate: 5,
      totalCommissionEarnedUsd: 0.00,
      claimableCommissionUsd: 0.00,
      referralCommissionHistory: [],
      createdAt: new Date().toISOString(),
    };
    usersMap[cleanId] = newUser;
    saveJsonFile("users.json", usersMap);
    return newUser;
  }

  // Fallback: ALWAYS return a clean Guest User with 0.00 balance. NEVER return ADMIN!
  const defaultGuestId = "guest_user";
  if (!usersMap[defaultGuestId]) {
    usersMap[defaultGuestId] = {
      id: defaultGuestId,
      username: "@guest_user",
      displayName: "নতুন ইউজার",
      email: "",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
      role: "Free Member",
      balanceUsd: 0.00,
      pendingReferralBonusUsd: 0.00,
      joinedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      todayReferrals: 0,
      activeReferralsWithActivity: 0,
      adsWatchedToday: 0,
      dailyAdLimit: 40,
      referralCode: "cholo_guest",
      language: "bn",
      currency: "BDT",
      claimedDailyTiers: [],
      completedTaskIds: [],
      referralCommissionRate: 5,
      totalCommissionEarnedUsd: 0.00,
      claimableCommissionUsd: 0.00,
      referralCommissionHistory: [],
      createdAt: new Date().toISOString(),
    };
    saveJsonFile("users.json", usersMap);
  }
  return usersMap[defaultGuestId];
}

// Persistent Videos / Earning Video Tasks (guaranteed to survive Render sleep & restarts)
let deletedVideoIds: string[] = loadJsonFile("deleted_video_ids.json", []);
let serverVideos = loadJsonFile("videos.json", [...INITIAL_VIDEOS]);
serverVideos = serverVideos.filter((v) => v && v.id && !deletedVideoIds.includes(v.id));
if (!fs.existsSync(path.join(DATA_DIR, "videos.json"))) {
  saveJsonFile("videos.json", serverVideos);
}

// Persistent Withdrawals
let withdrawals: Array<{
  id: string;
  userId: string;
  userName: string;
  method: string;
  accountNumber: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}> = loadJsonFile("withdrawals.json", []);
if (!fs.existsSync(path.join(DATA_DIR, "withdrawals.json"))) {
  saveJsonFile("withdrawals.json", withdrawals);
}

// Persistent Ad-Locked Videos
let serverAdVideos: any[] = loadJsonFile("ad_videos.json", []);
if (!fs.existsSync(path.join(DATA_DIR, "ad_videos.json"))) {
  saveJsonFile("ad_videos.json", serverAdVideos);
}

// Persistent Telegram verification settings
const DEFAULT_TG_CONFIG = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  botUsername: "PremiumVideoDeliveryBot",
  deliveryBotHandle: "PremiumVideoDeliveryBot",
  channel1Handle: "@CholoIncomeKori",
  channel1Url: "https://t.me/CholoIncomeKori",
  channel2Handle: "@IncomeBD_Online",
  channel2Url: "https://t.me/IncomeBD_Online",
  enforceOnEveryVisit: true,
};
let telegramConfig = loadJsonFile("telegram_config.json", { ...DEFAULT_TG_CONFIG });
if (!fs.existsSync(path.join(DATA_DIR, "telegram_config.json"))) {
  saveJsonFile("telegram_config.json", telegramConfig);
}

// Persistent 5 Income Methods and Rules
const DEFAULT_INCOME_METHODS_CONFIG = {
  ads: {
    enabled: true,
    rewardBdt: 1.5,
    rewardUsd: 0.0125,
    dailyLimit: 40,
    directAdUrl: "https://omg10.com/4/11869572",
  },
  webVisit: {
    enabled: true,
    rewardBdt: 3.0,
    rewardUsd: 0.025,
  },
  telegram: {
    enabled: true,
    rewardBdt: 5.0,
    rewardUsd: 0.0416,
  },
  mission: {
    enabled: true,
    rewardBdt: 10.0,
    rewardUsd: 0.0833,
  },
  referral: {
    enabled: true,
    bonusBdt: 10.0,
    bonusUsd: 0.0833,
    commissionPercent: 5,
    minActiveReferralsForWithdraw: 3,
    minIncomeForActiveReferralBdt: 10.0,
    minWithdrawBdt: 25.0,
  },
};
let incomeMethodsConfig = loadJsonFile("income_methods_config.json", { ...DEFAULT_INCOME_METHODS_CONFIG });
if (!fs.existsSync(path.join(DATA_DIR, "income_methods_config.json"))) {
  saveJsonFile("income_methods_config.json", incomeMethodsConfig);
}

let livePayouts = [
  { id: 'p-1', userName: 'Badsha Khan', amount: '$10.30', method: 'bKash', timeAgo: '1m ago', status: 'Success' },
  { id: 'p-2', userName: 'Rahman', amount: '৳ 1,500', method: 'Nagad', timeAgo: '3m ago', status: 'Success' },
  { id: 'p-3', userName: 'Samiul', amount: '$25.00', method: 'Binance Pay', timeAgo: '6m ago', status: 'Success' },
  { id: 'p-4', userName: 'Anik Hasan', amount: '৳ 850', method: 'Rocket', timeAgo: '9m ago', status: 'Success' },
  { id: 'p-5', userName: 'Tanvir Hossain', amount: '$15.00', method: 'bKash', timeAgo: '12m ago', status: 'Success' },
  { id: 'p-6', userName: 'Rajesh Kumar', amount: '₹ 1,200', method: 'PayTM', timeAgo: '15m ago', status: 'Success' },
];

let pushSubscriptions: any[] = [];

// Ad-Locked Videos & 90-Minute Expiry State
let serverAdLockedVideos = loadJsonFile("ad_videos.json", [...INITIAL_AD_LOCKED_VIDEOS]);
if (!fs.existsSync(path.join(DATA_DIR, "ad_videos.json"))) {
  saveJsonFile("ad_videos.json", serverAdLockedVideos);
}

let userVideoSessions: Record<string, {
  videoId: string;
  userId: string;
  adsWatched: number;
  unlocked: boolean;
  unlockedAt?: number;
  expiresAt?: number;
  delivered?: boolean;
  channelPostUrl?: string;
  canSendInbox?: boolean;
}> = loadJsonFile("user_video_sessions.json", {});
if (!fs.existsSync(path.join(DATA_DIR, "user_video_sessions.json"))) {
  saveJsonFile("user_video_sessions.json", userVideoSessions);
}

// Digital Packages & Store Orders State with Disk Persistence
let deletedPackageIds: string[] = loadJsonFile("deleted_package_ids.json", []);
let serverPackages = loadJsonFile("packages.json", [...INITIAL_DIGITAL_PACKAGES]);
const DEMO_PACKAGE_IDS = ["pkg-1", "pkg-2", "pkg-3"];
serverPackages = serverPackages.filter((p) => p && p.id && !DEMO_PACKAGE_IDS.includes(p.id) && !deletedPackageIds.includes(p.id));
saveJsonFile("packages.json", serverPackages);

// Channel Posts Published via Channel Post Publisher
let serverChannelPosts: any[] = loadJsonFile("channel_posts.json", []);
if (!fs.existsSync(path.join(DATA_DIR, "channel_posts.json"))) {
  saveJsonFile("channel_posts.json", serverChannelPosts);
}

// Scheduled Telegram Video Auto-Deletions (90-Minute Expiry)
interface ScheduledVideoDeletion {
  id: string;
  chatId: string;
  messageId: number;
  deleteAt: number;
  scheduledAt: number;
  videoTitle: string;
  postUrl?: string;
  botToken?: string;
  status: 'pending' | 'deleted' | 'failed';
  error?: string;
  retryCount?: number;
}
let scheduledDeletions: ScheduledVideoDeletion[] = loadJsonFile("scheduled_deletions.json", []);

interface UserPersonalMessage {
  id: string;
  type: 'warning' | 'notice' | 'message' | 'bonus';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  sentBy?: string;
  sentToTelegram?: boolean;
}

function escapeTgHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getDayNameBangla(dateStr: string): string {
  const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return days[d.getDay()] || '';
  }
  return '';
}

function ensureRolling7DaysHistory(user: any): any[] {
  if (!user) return [];
  if (!Array.isArray(user.weeklyWorkHistory)) {
    user.weeklyWorkHistory = [];
  }

  const today = new Date(Date.now() + 6 * 3600 * 1000);
  const result: any[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const dayName = getDayNameBangla(dateStr);
    const dayLabel = i === 0 ? `আজকে (${dayName})` : i === 1 ? `গতকাল (${dayName})` : `${dayName} (${dateStr.slice(5)})`;

    let existing = user.weeklyWorkHistory.find((r: any) => r.date === dateStr);
    if (!existing) {
      existing = {
        date: dateStr,
        dayLabel,
        adsWatched: i === 0 ? (user.adsWatchedToday || 0) : 0,
        tasksCompleted: 0,
        adClicks: 0,
        earnedUsd: 0,
        earnedBdt: 0,
        referrals: i === 0 ? (user.todayReferrals || 0) : 0,
      };
    } else {
      existing.dayLabel = dayLabel;
    }
    result.push(existing);
  }

  user.weeklyWorkHistory = result;
  return result;
}

function recordUserDailyWork(
  user: any,
  update: {
    adsWatched?: number;
    tasksCompleted?: number;
    adClicks?: number;
    earnedUsd?: number;
    referrals?: number;
  }
) {
  if (!user) return;
  const history = ensureRolling7DaysHistory(user);
  const todayRecord = history[0];

  if (update.adsWatched) todayRecord.adsWatched = (todayRecord.adsWatched || 0) + update.adsWatched;
  if (update.tasksCompleted) todayRecord.tasksCompleted = (todayRecord.tasksCompleted || 0) + update.tasksCompleted;
  if (update.adClicks) todayRecord.adClicks = (todayRecord.adClicks || 0) + update.adClicks;
  if (update.earnedUsd) {
    todayRecord.earnedUsd = +(Number(todayRecord.earnedUsd || 0) + update.earnedUsd).toFixed(4);
    todayRecord.earnedBdt = Math.round(todayRecord.earnedUsd * 120);
  }
  if (update.referrals) todayRecord.referrals = (todayRecord.referrals || 0) + update.referrals;
}

function formatTelegramChatTarget(chatInput: string): string {
  let target = (chatInput || "@demovideos24").trim();
  if (target.startsWith("https://t.me/")) {
    target = target.replace("https://t.me/", "").split("/")[0].replace("/", "").trim();
  }
  // If numeric ID (positive user id or negative channel/group id)
  if (/^-?\d+$/.test(target)) {
    return target;
  }
  if (!target.startsWith("@") && !target.startsWith("-")) {
    return "@" + target;
  }
  return target;
}

async function executeTelegramDeleteMessage(chatId: string, messageId: number, customToken?: string): Promise<{ success: boolean; error?: string }> {
  const token = customToken || telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, error: "No bot token configured" };

  const target = formatTelegramChatTarget(chatId);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: target, message_id: messageId }),
    });
    const data: any = await res.json();
    if (data.ok) {
      return { success: true };
    }

    // If chat_id was @demovideos24 and it failed, try numeric ID -1004305683246
    if (target === "@demovideos24" || target === "demovideos24") {
      const fallbackRes = await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1004305683246", message_id: messageId }),
      });
      const fallbackData: any = await fallbackRes.json();
      if (fallbackData.ok) {
        return { success: true };
      }
    }

    // If message is already deleted or not found, consider it successfully cleared
    if (data.description && data.description.includes("message to delete not found")) {
      return { success: true };
    }

    // If bot lacks delete permissions in the channel or message cannot be deleted
    if (data.description && data.description.includes("message can't be deleted")) {
      console.warn(`[AutoDelete] Telegram error: 'message can't be deleted'. Ensure bot is Admin with 'Delete Messages' permission in ${target}`);
      return { success: false, error: "বটকে চ্যানেলে 'Delete Messages' পারমিশন দিন।" };
    }

    return { success: false, error: data.description || "Telegram delete failed" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function cleanupExpiredTelegramVideos() {
  const token = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (scheduledDeletions.length === 0) return;

  const now = Date.now();
  let modified = false;

  for (const item of scheduledDeletions) {
    if (item.status === 'deleted') continue;

    if (item.deleteAt <= now) {
      const tokenToUse = item.botToken || token;
      if (!tokenToUse) continue;

      console.log(`[AutoDelete] Deleting expired video message ${item.messageId} from chat/channel ${item.chatId} ("${item.videoTitle}")`);
      const delResult = await executeTelegramDeleteMessage(item.chatId, item.messageId, tokenToUse);
      if (delResult.success) {
        item.status = 'deleted';
        modified = true;

        // Immediately send follow-up message notifying that the video expired and was deleted
        try {
          const target = formatTelegramChatTarget(item.chatId);
          await fetch(`https://api.telegram.org/bot${tokenToUse}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: target,
              text: `⏱️ <b>ভিডিওটির সময় সমাপ্ত!</b>\n\n🎬 <b>"${escapeTgHtml(item.videoTitle)}"</b> সম্পূর্ণ ফুল ভিডিওটির ৯০ মিনিটের নির্ধারিত সময় শেষ হওয়ায় এটি স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়েছে।\n\n🚀 পুনরায় যেকোনো ভিডিও বা কোর্স আনলক করতে আমাদের মিনি অ্যাপে প্রবেশ করুন!`,
              parse_mode: "HTML",
            }),
          });
          console.log(`[AutoDelete] Sent follow-up deletion notification to ${target}`);
        } catch (msgErr: any) {
          console.warn("[AutoDelete] Follow-up notification error:", msgErr.message);
        }
      } else {
        const isTerminalError =
          delResult.error?.includes("message to delete not found") ||
          delResult.error?.includes("chat not found") ||
          (item.retryCount && item.retryCount >= 6);

        if (isTerminalError) {
          item.status = 'deleted';
          item.error = delResult.error;
        } else {
          item.status = 'failed';
          item.error = delResult.error;
          item.retryCount = (item.retryCount || 0) + 1;
        }
        modified = true;
      }
    }
  }

  // Keep records for 24h for audit/logging in admin UI
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const filtered = scheduledDeletions.filter(item => (item.scheduledAt && item.scheduledAt > oneDayAgo) || item.status === 'pending');
  if (filtered.length !== scheduledDeletions.length || modified) {
    scheduledDeletions = filtered;
    saveJsonFile("scheduled_deletions.json", scheduledDeletions);
    if (githubSyncConfig.token) {
      pushFileToGitHubDirect(
        "data/scheduled_deletions.json",
        JSON.stringify(scheduledDeletions, null, 2),
        "Auto-update scheduled deletions status"
      ).catch(() => {});
    }
  }
}

// Check every 10 seconds for expired video deletion
setInterval(cleanupExpiredTelegramVideos, 10 * 1000);
setTimeout(cleanupExpiredTelegramVideos, 2000);


let serverOrders = loadJsonFile("orders.json", [...INITIAL_PACKAGE_ORDERS]);
if (!fs.existsSync(path.join(DATA_DIR, "orders.json"))) {
  saveJsonFile("orders.json", serverOrders);
}

let serverPaymentConfig = loadJsonFile("payment_config.json", { ...DEFAULT_PAYMENT_CONFIG });
if (!fs.existsSync(path.join(DATA_DIR, "payment_config.json"))) {
  saveJsonFile("payment_config.json", serverPaymentConfig);
}

// 5 Income Methods Tasks (Adsterra, Monetag, Telegram, Missions, Special)
let deletedTaskIds: string[] = loadJsonFile("deleted_task_ids.json", []);
let serverTasks: IncomeTask[] = loadJsonFile("tasks.json", [...INITIAL_INCOME_TASKS]);
serverTasks = serverTasks.filter((t) => t && t.id && !deletedTaskIds.includes(t.id));
if (!fs.existsSync(path.join(DATA_DIR, "tasks.json"))) {
  saveJsonFile("tasks.json", serverTasks);
}

// Broadcast Notice and Official Notice State with Persistence
const DEFAULT_NOTICES = {
  broadcastNotice: {
    message: "আজ রাত ১২টায় সবার উইথড্র ক্লিয়ার করা হবে! রেফার বোনাস ডাবল চলছে...",
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  officialNotice: {
    title: "Official Notice",
    description: "📢 গুরুত্বপূর্ণ নোটিশ 📢 সবাই অ্যাড ভালোভাবে দেখতেছেন, ধন্যবাদ — কিন্তু অনেকেই এখনো অ্যাডে ক্লিক করছেন না।",
    rules: [
      "1️⃣ প্রতি ১০টা অ্যাড দেখার পর অন্তত ১টা অ্যাডে ক্লিক করবেন।",
      "2️⃣ ক্লিক করার পর কমপক্ষে ১ মিনিট সেই ওয়েবপেজে অবস্থান করবেন।",
      "3️⃣ তারপর পরবর্তী অ্যাডে যান।"
    ],
    warning: "⚠️ যদি নিয়ম অনুযায়ী ক্লিক ও ভিজিট না করেন, তাহলে সেই কাজের পেমেন্ট দেওয়া হবে না।",
    footer: "ধন্যবাদ সবাইকে 🙏 — টিম ম্যানেজমেন্ট",
    isActive: true,
    updatedAt: new Date().toISOString(),
  }
};
let noticesConfig = loadJsonFile("notices.json", { ...DEFAULT_NOTICES });
if (!fs.existsSync(path.join(DATA_DIR, "notices.json"))) {
  saveJsonFile("notices.json", noticesConfig);
}

// GitHub Auto-Sync & Auto-Commit Engine
interface GitHubSyncConfig {
  repo: string;          // e.g. "username/repo"
  branch: string;        // default: "main"
  token: string;         // Personal Access Token
  autoSyncOnChange: boolean; // auto push whenever admin changes packages
  lastSyncedAt?: string;
  lastStatus?: string;
}

let githubSyncConfig: GitHubSyncConfig = loadJsonFile("github_sync_config.json", {
  repo: process.env.GITHUB_REPO || "funnymovies887-hash/earning_bot",
  branch: process.env.GITHUB_BRANCH || "main",
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || "",
  autoSyncOnChange: true,
  lastStatus: "প্রস্তুত (Ready)",
});

if (!githubSyncConfig.repo) {
  githubSyncConfig.repo = "funnymovies887-hash/earning_bot";
}
const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
if (envToken && !githubSyncConfig.token) {
  githubSyncConfig.token = envToken.trim();
}
saveJsonFile("github_sync_config.json", githubSyncConfig);

async function pushFileToGitHubDirect(
  repoPath: string,
  contentString: string,
  commitMessage: string
): Promise<{ success: boolean; message: string; sha?: string }> {
  if (!githubSyncConfig.token || !githubSyncConfig.repo) {
    return { success: false, message: "GitHub Repository ও Token কনফিগার করা নেই।" };
  }

  const cleanRepo = githubSyncConfig.repo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "").trim();
  const branch = (githubSyncConfig.branch || "main").trim();
  const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/${repoPath}?ref=${encodeURIComponent(branch)}`;

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${githubSyncConfig.token.trim()}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "CholoIncomeBot-AdminSync/1.0",
  };

  try {
    let existingSha: string | undefined = undefined;
    const getRes = await fetch(apiUrl, { headers });
    if (getRes.ok) {
      const getJson: any = await getRes.json();
      existingSha = getJson.sha;
    } else if (getRes.status !== 404) {
      const errJson: any = await getRes.json().catch(() => ({}));
      return {
        success: false,
        message: `GitHub ফাইল পাওয়া যায়নি (${getRes.status}): ${errJson.message || getRes.statusText}`,
      };
    }

    const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${repoPath}`;
    const base64Content = Buffer.from(contentString, "utf-8").toString("base64");
    const body: any = {
      message: commitMessage,
      content: base64Content,
      branch: branch,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const putJson: any = await putRes.json().catch(() => ({}));

    if (putRes.ok) {
      githubSyncConfig.lastSyncedAt = new Date().toISOString();
      githubSyncConfig.lastStatus = `✅ সফলভাবে '${repoPath}' গিটহাবে পুশ হয়েছে (${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka' })})`;
      saveJsonFile("github_sync_config.json", githubSyncConfig);
      return { success: true, message: `সফলভাবে '${repoPath}' কমিট হয়েছে!`, sha: putJson.content?.sha };
    } else {
      const errMsg = putJson.message || putRes.statusText;
      githubSyncConfig.lastStatus = `❌ পুশ ত্রুটি: ${errMsg}`;
      saveJsonFile("github_sync_config.json", githubSyncConfig);
      return { success: false, message: `GitHub API ত্রুটি (${putRes.status}): ${errMsg}` };
    }
  } catch (err: any) {
    return { success: false, message: "নেটওয়ার্ক সংযোগ ত্রুটি: " + err.message };
  }
}

// Pull individual raw JSON file from GitHub repository
async function pullFileFromGitHubDirect(repoPath: string): Promise<{ success: boolean; content?: string; error?: string }> {
  const cleanRepo = (githubSyncConfig.repo || "funnymovies887-hash/earning_bot").replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "").trim();
  const branch = (githubSyncConfig.branch || "main").trim();

  try {
    const rawUrl = `https://raw.githubusercontent.com/${cleanRepo}/${branch}/${repoPath}?t=${Date.now()}`;
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      const text = await rawRes.text();
      return { success: true, content: text };
    }

    if (githubSyncConfig.token) {
      const apiUrl = `https://api.github.com/repos/${cleanRepo}/contents/${repoPath}?ref=${encodeURIComponent(branch)}`;
      const apiRes = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${githubSyncConfig.token.trim()}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "CholoIncomeBot-AdminSync/1.0",
        },
      });
      if (apiRes.ok) {
        const json: any = await apiRes.json();
        if (json.content) {
          const text = Buffer.from(json.content, "base64").toString("utf-8");
          return { success: true, content: text };
        }
      }
    }

    return { success: false, error: `GitHub-এ ফাইল পাওয়া যায়নি (${rawRes.status})` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Push all system data files to GitHub
async function pushAllDataToGitHub(): Promise<{ success: boolean; message: string; results: any[]; successCount: number; totalCount: number }> {
  if (!githubSyncConfig.token || !githubSyncConfig.repo) {
    return {
      success: false,
      message: "⚠️ GitHub Token কনফিগার করা নেই। অনুগ্রহ করে Admin Panel থেকে GitHub Token প্রদান করুন।",
      results: [],
      successCount: 0,
      totalCount: 0,
    };
  }

  const files = [
    { path: "data/packages.json", content: JSON.stringify(serverPackages, null, 2), desc: `প্যাকেজ তালিকা (${serverPackages.length}টি)` },
    { path: "data/deleted_package_ids.json", content: JSON.stringify(deletedPackageIds, null, 2), desc: "ডিলিট করা প্যাকেজ আইডি" },
    { path: "data/tasks.json", content: JSON.stringify(serverTasks, null, 2), desc: `টাস্ক তালিকা (${serverTasks.length}টি)` },
    { path: "data/deleted_task_ids.json", content: JSON.stringify(deletedTaskIds, null, 2), desc: "ডিলিট করা টাস্ক আইডি" },
    { path: "data/videos.json", content: JSON.stringify(serverVideos, null, 2), desc: `ভিডিও তালিকা (${serverVideos.length}টি)` },
    { path: "data/deleted_video_ids.json", content: JSON.stringify(deletedVideoIds, null, 2), desc: "ডিলিট করা ভিডিও আইডি" },
    { path: "data/ad_videos.json", content: JSON.stringify(serverAdLockedVideos, null, 2), desc: `লকড ভিডিও (${serverAdLockedVideos.length}টি)` },
    { path: "data/income_methods_config.json", content: JSON.stringify(incomeMethodsConfig, null, 2), desc: "৫টি ইনকাম মেথড ও রেট" },
    { path: "data/telegram_config.json", content: JSON.stringify(telegramConfig, null, 2), desc: "টেলিগ্রাম সেটিংস" },
    { path: "data/notices.json", content: JSON.stringify(noticesConfig, null, 2), desc: "ব্রডকাস্ট ও নোটিশ" },
    { path: "data/payment_config.json", content: JSON.stringify(serverPaymentConfig, null, 2), desc: "পেমেন্ট নম্বরসমূহ" },
    { path: "data/users.json", content: JSON.stringify(usersMap, null, 2), desc: `ইউজার তালিকা (${Object.keys(usersMap).length} জন)` },
    { path: "data/orders.json", content: JSON.stringify(serverOrders, null, 2), desc: `স্টোর অর্ডার (${serverOrders.length}টি)` },
    { path: "data/withdrawals.json", content: JSON.stringify(withdrawals, null, 2), desc: `উইথড্র তালিকা (${withdrawals.length}টি)` },
    { path: "data/scheduled_deletions.json", content: JSON.stringify(scheduledDeletions, null, 2), desc: "৯০ মিনিটের ভিডিও অটো-ডিলিট কিউ" },
  ];

  const results = [];
  let successCount = 0;
  const timeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  for (const f of files) {
    const res = await pushFileToGitHubDirect(f.path, f.content, `Admin Master Sync: Update ${f.path} [${timeStr}]`);
    results.push({ path: f.path, desc: f.desc, success: res.success, message: res.message });
    if (res.success) successCount++;
  }

  githubSyncConfig.lastSyncedAt = new Date().toISOString();
  githubSyncConfig.lastStatus = `✅ ${successCount}/${files.length}টি ফাইল গিটহাবে পুশ সম্পন্ন (${timeStr})`;
  saveJsonFile("github_sync_config.json", githubSyncConfig);

  return {
    success: successCount > 0,
    message: successCount === files.length
      ? `🎉 চমৎকার! সমস্ত ${successCount}টি ডাটাবেজ ফাইল সরাসরি GitHub-এ অটো-কমিট ও সেভ হয়েছে!`
      : `⚠️ ${successCount}/${files.length}টি ফাইল গিটহাবে সেভ হয়েছে।`,
    results,
    successCount,
    totalCount: files.length,
  };
}

// Pull all system data files from GitHub repository
async function pullAllDataFromGitHub(): Promise<{ success: boolean; message: string; results: any[]; pulledCount: number }> {
  // 1. Process deleted IDs FIRST so that incoming packages, tasks, and videos can be filtered immediately
  const fileMappings: Array<{ path: string; name: string; apply: (parsed: any) => void }> = [
    {
      path: "data/deleted_package_ids.json",
      name: "deletedPackageIds",
      apply: (data) => {
        if (Array.isArray(data)) {
          deletedPackageIds = Array.from(new Set([...deletedPackageIds, ...data]));
          saveJsonFile("deleted_package_ids.json", deletedPackageIds);
        }
      },
    },
    {
      path: "data/deleted_task_ids.json",
      name: "deletedTaskIds",
      apply: (data) => {
        if (Array.isArray(data)) {
          deletedTaskIds = Array.from(new Set([...deletedTaskIds, ...data]));
          saveJsonFile("deleted_task_ids.json", deletedTaskIds);
        }
      },
    },
    {
      path: "data/deleted_video_ids.json",
      name: "deletedVideoIds",
      apply: (data) => {
        if (Array.isArray(data)) {
          deletedVideoIds = Array.from(new Set([...deletedVideoIds, ...data]));
          saveJsonFile("deleted_video_ids.json", deletedVideoIds);
        }
      },
    },
    {
      path: "data/packages.json",
      name: "packages",
      apply: (data) => {
        if (Array.isArray(data)) {
          serverPackages = data.filter((p) => p && p.id && !DEMO_PACKAGE_IDS.includes(p.id) && !deletedPackageIds.includes(p.id));
          saveJsonFile("packages.json", serverPackages);
        }
      },
    },
    {
      path: "data/tasks.json",
      name: "tasks",
      apply: (data) => {
        if (Array.isArray(data)) {
          serverTasks = data.filter((t) => t && t.id && !deletedTaskIds.includes(t.id));
          saveJsonFile("tasks.json", serverTasks);
        }
      },
    },
    {
      path: "data/videos.json",
      name: "videos",
      apply: (data) => {
        if (Array.isArray(data)) {
          serverVideos = data.filter((v) => v && v.id && !deletedVideoIds.includes(v.id));
          saveJsonFile("videos.json", serverVideos);
        }
      },
    },
    {
      path: "data/income_methods_config.json",
      name: "incomeMethods",
      apply: (data) => {
        if (data && typeof data === "object") {
          incomeMethodsConfig = { ...incomeMethodsConfig, ...data };
          saveJsonFile("income_methods_config.json", incomeMethodsConfig);
        }
      },
    },
    {
      path: "data/telegram_config.json",
      name: "telegramConfig",
      apply: (data) => {
        if (data && typeof data === "object") {
          telegramConfig = { ...telegramConfig, ...data };
          saveJsonFile("telegram_config.json", telegramConfig);
        }
      },
    },
    {
      path: "data/notices.json",
      name: "notices",
      apply: (data) => {
        if (data && typeof data === "object") {
          noticesConfig = { ...noticesConfig, ...data };
          saveJsonFile("notices.json", noticesConfig);
        }
      },
    },
    {
      path: "data/payment_config.json",
      name: "paymentConfig",
      apply: (data) => {
        if (data && typeof data === "object") {
          serverPaymentConfig = { ...serverPaymentConfig, ...data };
          saveJsonFile("payment_config.json", serverPaymentConfig);
        }
      },
    },
    {
      path: "data/ad_videos.json",
      name: "adVideos",
      apply: (data) => {
        if (Array.isArray(data)) {
          serverAdLockedVideos = data;
          saveJsonFile("ad_videos.json", serverAdLockedVideos);
        }
      },
    },
    {
      path: "data/scheduled_deletions.json",
      name: "scheduledDeletions",
      apply: (data) => {
        if (Array.isArray(data)) {
          const existingIds = new Set(scheduledDeletions.map((s) => s.id));
          for (const item of data) {
            if (item && item.id && !existingIds.has(item.id)) {
              scheduledDeletions.push(item);
            }
          }
          saveJsonFile("scheduled_deletions.json", scheduledDeletions);
        }
      },
    },
  ];

  const results = [];
  let pulledCount = 0;

  for (const fm of fileMappings) {
    const res = await pullFileFromGitHubDirect(fm.path);
    if (res.success && res.content) {
      try {
        const parsed = JSON.parse(res.content);
        fm.apply(parsed);
        pulledCount++;
        results.push({ path: fm.path, success: true });
      } catch (parseErr: any) {
        results.push({ path: fm.path, success: false, error: parseErr.message });
      }
    } else {
      results.push({ path: fm.path, success: false, error: res.error });
    }
  }

  // Final strict filter pass: Ensure deleted items can never resurrect
  serverPackages = serverPackages.filter((p) => p && p.id && !DEMO_PACKAGE_IDS.includes(p.id) && !deletedPackageIds.includes(p.id));
  saveJsonFile("packages.json", serverPackages);
  serverTasks = serverTasks.filter((t) => t && t.id && !deletedTaskIds.includes(t.id));
  saveJsonFile("tasks.json", serverTasks);
  serverVideos = serverVideos.filter((v) => v && v.id && !deletedVideoIds.includes(v.id));
  saveJsonFile("videos.json", serverVideos);

  return {
    success: pulledCount > 0,
    message: `✅ GitHub থেকে সফলভাবে ${pulledCount}টি ডাটাবেজ মডিউল সিঙ্ক করা হয়েছে!`,
    results,
    pulledCount,
  };
}

// Startup Hydration: Ensure freshest data from GitHub upon container start/reboot
async function hydrateServerFromGitHub() {
  try {
    console.log("[GitHub Auto-Hydrate] Checking for latest GitHub updates on startup...");
    const res = await pullAllDataFromGitHub();
    if (res.success) {
      console.log(`[GitHub Auto-Hydrate] Successfully hydrated ${res.pulledCount} modules from GitHub!`);
    }
  } catch (err: any) {
    console.warn("[GitHub Auto-Hydrate Warning]:", err.message);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      service: "Cholo Income Kori 24/7 Engine",
      serverTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    });
  });

  // Public Notices endpoint (Broadcast & Official Notice)
  app.get("/api/notices", (_req, res) => {
    res.json({
      success: true,
      broadcastNotice: noticesConfig.broadcastNotice,
      officialNotice: noticesConfig.officialNotice,
    });
  });

  // User Profile - Multi-tenant isolated profile by user ID
  app.get("/api/user", (req, res) => {
    const user = getRequestUser(req);
    res.json({ success: true, user, ...user });
  });

  // Sync Telegram User or Browser User on app launch
  app.post("/api/user/sync", (req, res) => {
    const {
      id,
      tgId,
      username,
      first_name,
      last_name,
      photo_url,
      language,
      currency,
      balanceUsd,
      adsWatchedToday,
      completedTaskIds,
      lastActiveDate,
    } = req.body || {};

    const rawId = tgId || id || req.headers["x-user-id"];
    if (!rawId) {
      const user = getRequestUser(req);
      return res.json({ success: true, user, isNew: false });
    }

    const userId = String(rawId).trim();
    let existing = usersMap[userId];
    const todayDateStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);

    if (existing) {
      if (first_name || last_name) {
        existing.displayName = [first_name, last_name].filter(Boolean).join(" ");
      }
      if (username) {
        existing.username = username.startsWith("@") ? username : `@${username}`;
      }
      if (photo_url && (!existing.avatarUrl || existing.avatarUrl.includes("dicebear"))) {
        existing.avatarUrl = photo_url;
      }
      if (language && ['en', 'bn', 'hi', 'ur'].includes(language)) existing.language = language;
      if (currency && ['USD', 'BDT', 'INR'].includes(currency)) existing.currency = currency;

      // Handle daily date reset logic:
      // If user lastActiveDate is from a previous calendar day, reset daily count
      if (existing.lastActiveDate && existing.lastActiveDate !== todayDateStr) {
        existing.adsWatchedToday = 0;
        existing.completedTaskIds = [];
        existing.lastActiveDate = todayDateStr;
      } else {
        // Same calendar day: MERGE so we NEVER lose progress on reload/sync!
        existing.lastActiveDate = todayDateStr;
        if (typeof adsWatchedToday === 'number' && !isNaN(adsWatchedToday)) {
          existing.adsWatchedToday = Math.max(Number(existing.adsWatchedToday || 0), Number(adsWatchedToday));
        }
        if (Array.isArray(completedTaskIds)) {
          existing.completedTaskIds = Array.from(new Set([...(existing.completedTaskIds || []), ...completedTaskIds]));
        }
      }

      // Balance is NEVER lost or downgraded!
      if (typeof balanceUsd === 'number' && !isNaN(balanceUsd) && balanceUsd > 0) {
        existing.balanceUsd = Math.max(Number(existing.balanceUsd || 0), Number(balanceUsd));
      }

      saveJsonFile("users.json", usersMap);
      return res.json({ success: true, user: existing, isNew: false });
    }

    // Check if user is the admin by username
    const cleanUsername = username ? (username.startsWith("@") ? username : `@${username}`).toLowerCase() : "";
    if (cleanUsername === "@rubi_sh" || cleanUsername === "rubi_sh" || cleanUsername === "funnymovies887" || userId === ADMIN_ID) {
      const adminUser = usersMap[ADMIN_ID];
      if (first_name || last_name) {
        adminUser.displayName = [first_name, last_name].filter(Boolean).join(" ");
      }
      if (photo_url) adminUser.avatarUrl = photo_url;
      saveJsonFile("users.json", usersMap);
      return res.json({ success: true, user: adminUser, isNew: false });
    }

    // Brand new user registration with 0.00 USD / 0 BDT balance
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || (username ? `@${username}` : `সদস্য #${userId.slice(-4)}`);
    const finalUsername = username ? (username.startsWith("@") ? username : `@${username}`) : `@user_${userId.slice(-5)}`;
    const referralCode = username ? username.replace("@", "") : `user_${userId}`;

    const newUser = {
      id: userId,
      username: finalUsername,
      displayName: displayName,
      email: "",
      avatarUrl: photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      role: "Free Member",
      balanceUsd: 0.00, // 100% ISOLATED: ZERO BALANCE FOR REGULAR NEW USERS
      pendingReferralBonusUsd: 0.00,
      joinedCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      todayReferrals: 0,
      activeReferralsWithActivity: 0,
      adsWatchedToday: 0,
      dailyAdLimit: 40,
      referralCode: referralCode,
      language: language || "bn",
      currency: currency || "BDT",
      claimedDailyTiers: [],
      completedTaskIds: [],
      referralCommissionRate: 5,
      totalCommissionEarnedUsd: 0.00,
      claimableCommissionUsd: 0.00,
      referralCommissionHistory: [],
      createdAt: new Date().toISOString(),
    };

    usersMap[userId] = newUser;
    saveJsonFile("users.json", usersMap);
    return res.json({ success: true, user: newUser, isNew: true });
  });

  app.post("/api/user", (req, res) => {
    const user = getRequestUser(req);
    Object.assign(user, req.body);
    saveJsonFile("users.json", usersMap);
    res.json({ success: true, user, ...user });
  });

  app.post("/api/user/update", (req, res) => {
    const user = getRequestUser(req);
    const body = req.body || {};
    const todayDateStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);

    let sanitizedLang = user.language;
    if (typeof body.language === 'string' && ['en', 'bn', 'hi', 'ur'].includes(body.language)) {
      sanitizedLang = body.language;
    }
    let sanitizedCurr = user.currency;
    if (typeof body.currency === 'string' && ['USD', 'BDT', 'INR'].includes(body.currency)) {
      sanitizedCurr = body.currency;
    }

    // Merge balance (NEVER drop or wipe balance)
    if (typeof body.balanceUsd === 'number' && !isNaN(body.balanceUsd)) {
      user.balanceUsd = Math.max(Number(user.balanceUsd || 0), Number(body.balanceUsd));
    }

    // Handle daily limit & tasks
    if (user.lastActiveDate && user.lastActiveDate !== todayDateStr) {
      user.adsWatchedToday = 0;
      user.completedTaskIds = [];
      user.lastActiveDate = todayDateStr;
    } else {
      user.lastActiveDate = todayDateStr;
      if (typeof body.adsWatchedToday === 'number' && !isNaN(body.adsWatchedToday)) {
        user.adsWatchedToday = Math.max(Number(user.adsWatchedToday || 0), Number(body.adsWatchedToday));
      }
      if (Array.isArray(body.completedTaskIds)) {
        user.completedTaskIds = Array.from(new Set([...(user.completedTaskIds || []), ...body.completedTaskIds]));
      }
    }

    if (body.displayName) user.displayName = body.displayName;
    if (body.username) user.username = body.username;
    if (body.avatarUrl) user.avatarUrl = body.avatarUrl;
    if (body.phone) user.phone = body.phone;
    if (body.email) user.email = body.email;
    if (typeof body.dailyAdLimit === 'number') user.dailyAdLimit = body.dailyAdLimit;

    user.language = sanitizedLang;
    user.currency = sanitizedCurr;

    saveJsonFile("users.json", usersMap);
    res.json({ success: true, user, ...user });
  });

  // Complete task / Ad watch
  app.post("/api/user/complete-task", (req, res) => {
    const user = getRequestUser(req);
    const { taskId, rewardUsd, type } = req.body;
    const todayDateStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
    user.lastActiveDate = todayDateStr;

    if (type === 'ad' && (user.adsWatchedToday || 0) >= (user.dailyAdLimit || 40)) {
      return res.status(400).json({
        error: `আজকের অ্যাড দেখার সর্বোচ্চ সীমা (${user.dailyAdLimit || 40} টি) পূর্ণ হয়েছে! অ্যাকাউন্ট সুরক্ষিত রাখতে আগামী কাল আবার চেষ্টা করুন।`,
      });
    }

    const earned = rewardUsd || 0.0125;
    if (!user.completedTaskIds) user.completedTaskIds = [];
    if (!user.completedTaskIds.includes(taskId)) {
      user.completedTaskIds.push(taskId);
      user.balanceUsd = +(Number(user.balanceUsd || 0) + earned).toFixed(4);
      user.adsWatchedToday = (user.adsWatchedToday || 0) + 1;
    }

    // Record into rolling 7-day work history
    recordUserDailyWork(user, {
      adsWatched: type === 'ad' ? 1 : 0,
      tasksCompleted: 1,
      earnedUsd: earned,
    });

    saveJsonFile("users.json", usersMap);
    res.json({ success: true, user });
  });

  // Record Ad Click (Increases CTR & registers into 7-day activity)
  app.post("/api/user/record-click", (req, res) => {
    const user = getRequestUser(req);
    const { taskId, adType } = req.body || {};
    recordUserDailyWork(user, { adClicks: 1 });
    saveJsonFile("users.json", usersMap);
    res.json({ success: true, message: "অ্যাড ক্লিক সফলভাবে নথিভুক্ত হয়েছে!" });
  });

  // Claim Tier Reward
  app.post("/api/user/claim-tier", (req, res) => {
    const user = getRequestUser(req);
    const { tierIndex, rewardUsd } = req.body;
    if (!user.claimedDailyTiers) user.claimedDailyTiers = [];
    if (!user.claimedDailyTiers.includes(tierIndex)) {
      user.claimedDailyTiers.push(tierIndex);
      user.balanceUsd = +(Number(user.balanceUsd || 0) + (rewardUsd || 0)).toFixed(2);
    }
    saveJsonFile("users.json", usersMap);
    res.json({ success: true, user });
  });

  // Referral increment
  app.post("/api/user/refer-friend", (req, res) => {
    const user = getRequestUser(req);
    user.joinedCount = (user.joinedCount || 0) + 1;
    user.activeCount = (user.activeCount || 0) + 1;
    user.todayReferrals = (user.todayReferrals || 0) + 1;
    user.pendingReferralBonusUsd = +(Number(user.pendingReferralBonusUsd || 0) + 1.00).toFixed(2);
    saveJsonFile("users.json", usersMap);
    res.json({ success: true, user });
  });

  // Claim 5% Referral Commission to main balance
  app.post("/api/user/claim-commission", (req, res) => {
    const user = getRequestUser(req);
    const claimable = user.claimableCommissionUsd || 0;
    if (claimable > 0) {
      user.balanceUsd = +(Number(user.balanceUsd || 0) + claimable).toFixed(2);
      user.claimableCommissionUsd = 0;
    }
    saveJsonFile("users.json", usersMap);
    res.json({ success: true, user, claimedUsd: claimable });
  });

  // Add 5% Referral Commission from active downline
  app.post("/api/user/referral-commission", (req, res) => {
    const user = getRequestUser(req);
    const { userEarnedUsd = 0.40, userFrom = '@friend_earner' } = req.body || {};
    const commissionUsd = +(userEarnedUsd * 0.05).toFixed(3);
    user.totalCommissionEarnedUsd = +(
      Number(user.totalCommissionEarnedUsd || 0) + commissionUsd
    ).toFixed(2);
    user.claimableCommissionUsd = +(
      Number(user.claimableCommissionUsd || 0) + commissionUsd
    ).toFixed(2);

    const history = user.referralCommissionHistory || [];
    history.unshift({
      id: 'comm-' + Date.now(),
      userFrom,
      activity: 'টাস্ক সম্পন্ন করেছে (Task Reward)',
      userEarnedUsd,
      commissionUsd,
      time: 'এইমাত্র',
    });
    user.referralCommissionHistory = history.slice(0, 20);
    saveJsonFile("users.json", usersMap);

    res.json({ success: true, user, commissionUsd });
  });

  // Get current 5 Income Methods configuration
  app.get("/api/income-methods", (_req, res) => {
    res.json({
      success: true,
      config: incomeMethodsConfig,
    });
  });

  // Admin: Update 5 Income Methods configuration
  app.post("/api/admin/income-methods", (req, res) => {
    const updated = req.body;
    if (updated && typeof updated === "object") {
      incomeMethodsConfig = {
        ...incomeMethodsConfig,
        ...updated,
        ads: { ...incomeMethodsConfig.ads, ...(updated.ads || {}) },
        webVisit: { ...incomeMethodsConfig.webVisit, ...(updated.webVisit || {}) },
        telegram: { ...incomeMethodsConfig.telegram, ...(updated.telegram || {}) },
        mission: { ...incomeMethodsConfig.mission, ...(updated.mission || {}) },
        referral: { ...incomeMethodsConfig.referral, ...(updated.referral || {}) },
      };
      saveJsonFile("income_methods_config.json", incomeMethodsConfig);

      if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
        pushFileToGitHubDirect(
          "data/income_methods_config.json",
          JSON.stringify(incomeMethodsConfig, null, 2),
          "Admin: Update 5 Income Methods Configuration"
        ).catch(() => {});
      }
    }
    res.json({
      success: true,
      message: "ইনকাম মেথড ও নিয়মাবলি সফলভাবে আপডেট করা হয়েছে!",
      config: incomeMethodsConfig,
    });
  });

  // ----------------------------------------------------
  // 5 Income Methods Dynamic Task Management API
  // ----------------------------------------------------

  // Public: Get all active tasks, optionally filtered by category (ads, visit, telegram, mission, special)
  app.get("/api/tasks", (req, res) => {
    const category = req.query.category as string;
    let list = serverTasks.filter((t) => t.isActive !== false && !deletedTaskIds.includes(t.id));
    if (category) {
      list = list.filter((t) => t.category === category);
    }
    res.json({ success: true, tasks: list });
  });

  // Admin: Get all tasks (both active and inactive) with stats
  app.get("/api/admin/tasks", (req, res) => {
    const category = req.query.category as string;
    let list = serverTasks.filter((t) => !deletedTaskIds.includes(t.id));
    if (category) {
      list = list.filter((t) => t.category === category);
    }
    res.json({
      success: true,
      tasks: list,
      totalCount: list.length,
      categoryCounts: {
        ads: list.filter((t) => t.category === 'ads').length,
        visit: list.filter((t) => t.category === 'visit').length,
        telegram: list.filter((t) => t.category === 'telegram').length,
        mission: list.filter((t) => t.category === 'mission').length,
        special: list.filter((t) => t.category === 'special').length,
      },
    });
  });

  // Admin: Add a new task
  app.post("/api/admin/tasks/add", (req, res) => {
    const {
      title,
      category,
      subCategory = "",
      destinationUrl = "",
      mediaType = "none",
      mediaUrl = "",
      rewardBdt,
      rewardUsd,
      timerSeconds = 15,
      instructions = "",
      isHot = false,
      isActive = true,
    } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "টাস্কের শিরোনাম (Title) প্রদান করুন।" });
    }

    const validCategories = ['ads', 'visit', 'telegram', 'mission', 'special'];
    const assignedCategory = validCategories.includes(category) ? category : 'visit';

    let bdtAmount = typeof rewardBdt === 'number' ? rewardBdt : parseFloat(rewardBdt);
    let usdAmount = typeof rewardUsd === 'number' ? rewardUsd : parseFloat(rewardUsd);

    if (isNaN(bdtAmount) && isNaN(usdAmount)) {
      bdtAmount = 1.0;
      usdAmount = +(1.0 / 120).toFixed(6);
    } else if (isNaN(bdtAmount)) {
      bdtAmount = +(usdAmount * 120).toFixed(4);
    } else if (isNaN(usdAmount)) {
      usdAmount = +(bdtAmount / 120).toFixed(6);
    }

    const seconds = Math.max(0, parseInt(timerSeconds) || 0);

    const newTask: IncomeTask = {
      id: "task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      category: assignedCategory,
      subCategory: subCategory.trim() || (assignedCategory === 'visit' ? 'Adsterra Direct Link' : assignedCategory),
      destinationUrl: destinationUrl.trim() || "https://google.com",
      mediaType: mediaType || (mediaUrl ? "image" : "none"),
      mediaUrl: (mediaUrl || req.body.thumbnailUrl || req.body.thumbnail || "").trim() || undefined,
      thumbnailUrl: (req.body.thumbnailUrl || mediaUrl || req.body.thumbnail || "").trim() || undefined,
      thumbnail: (req.body.thumbnail || mediaUrl || req.body.thumbnailUrl || "").trim() || undefined,
      rewardBdt: bdtAmount,
      rewardUsd: usdAmount,
      timerSeconds: seconds,
      instructions: instructions.trim() || "কাজটি সম্পন্ন করে রিওয়ার্ড গ্রহণ করুন।",
      isHot: Boolean(isHot),
      isActive: isActive !== false,
      createdAt: new Date().toISOString().split('T')[0],
      totalCompletions: 0,
    };

    serverTasks.unshift(newTask);
    saveJsonFile("tasks.json", serverTasks);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/tasks.json",
        JSON.stringify(serverTasks, null, 2),
        `Admin: Add task "${newTask.title}"`
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: "নতুন টাস্ক সফলভাবে তৈরি ও যুক্ত করা হয়েছে!",
      task: newTask,
    });
  });

  // Admin: Edit an existing task
  app.post("/api/admin/tasks/edit", (req, res) => {
    const { id, title, category, subCategory, destinationUrl, mediaType, mediaUrl, rewardBdt, rewardUsd, timerSeconds, instructions, isHot, isActive } = req.body || {};
    const taskIndex = serverTasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: "টাস্কটি খুঁজে পাওয়া যায়নি।" });
    }

    const current = serverTasks[taskIndex];
    let bdtAmount = current.rewardBdt;
    let usdAmount = current.rewardUsd;

    if (rewardBdt !== undefined && rewardUsd !== undefined) {
      bdtAmount = typeof rewardBdt === 'number' ? rewardBdt : parseFloat(rewardBdt);
      usdAmount = typeof rewardUsd === 'number' ? rewardUsd : parseFloat(rewardUsd);
    } else if (rewardBdt !== undefined) {
      bdtAmount = typeof rewardBdt === 'number' ? rewardBdt : parseFloat(rewardBdt);
      usdAmount = +(bdtAmount / 120).toFixed(6);
    } else if (rewardUsd !== undefined) {
      usdAmount = typeof rewardUsd === 'number' ? rewardUsd : parseFloat(rewardUsd);
      bdtAmount = +(usdAmount * 120).toFixed(4);
    }

    const updatedTask: IncomeTask = {
      ...current,
      title: title ? title.trim() : current.title,
      category: category || current.category,
      subCategory: subCategory !== undefined ? subCategory.trim() : current.subCategory,
      destinationUrl: destinationUrl !== undefined ? destinationUrl.trim() : current.destinationUrl,
      mediaType: mediaType || current.mediaType,
      mediaUrl: mediaUrl !== undefined ? mediaUrl.trim() : (req.body.thumbnailUrl || req.body.thumbnail || current.mediaUrl),
      thumbnailUrl: (req.body.thumbnailUrl || mediaUrl || req.body.thumbnail || (current as any).thumbnailUrl || current.mediaUrl)?.trim(),
      thumbnail: (req.body.thumbnail || mediaUrl || req.body.thumbnailUrl || (current as any).thumbnail || current.mediaUrl)?.trim(),
      rewardBdt: bdtAmount,
      rewardUsd: usdAmount,
      timerSeconds: timerSeconds !== undefined ? Math.max(0, parseInt(timerSeconds)) : current.timerSeconds,
      instructions: instructions !== undefined ? instructions.trim() : current.instructions,
      isHot: isHot !== undefined ? Boolean(isHot) : current.isHot,
      isActive: isActive !== undefined ? Boolean(isActive) : current.isActive,
    };

    serverTasks[taskIndex] = updatedTask;
    saveJsonFile("tasks.json", serverTasks);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/tasks.json",
        JSON.stringify(serverTasks, null, 2),
        `Admin: Update task "${updatedTask.title}"`
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: "টাস্ক সফলভাবে আপডেট করা হয়েছে!",
      task: updatedTask,
    });
  });

  // Admin: Delete a task (Permanently blacklisted so it never returns on refresh or restart)
  app.post("/api/admin/tasks/delete", async (req, res) => {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Task ID required" });

    if (!deletedTaskIds.includes(id)) {
      deletedTaskIds.push(id);
      saveJsonFile("deleted_task_ids.json", deletedTaskIds);
    }

    serverTasks = serverTasks.filter((t) => t.id !== id);
    saveJsonFile("tasks.json", serverTasks);

    let githubPushed = false;
    if (githubSyncConfig.token && githubSyncConfig.repo) {
      try {
        await pushFileToGitHubDirect(
          "data/tasks.json",
          JSON.stringify(serverTasks, null, 2),
          `Admin: Delete task (${serverTasks.length} tasks remaining)`
        );
        await pushFileToGitHubDirect(
          "data/deleted_task_ids.json",
          JSON.stringify(deletedTaskIds, null, 2),
          `Admin: Update deleted task IDs list`
        );
        githubPushed = true;
      } catch (ghErr) {
        console.warn("GitHub push on task delete failed:", ghErr);
      }
    }

    res.json({
      success: true,
      message: "টাস্ক সফলভাবে ডিলিট করা হয়েছে এবং পার্মানেন্টলি ব্ল্যাকলিস্ট করা হয়েছে!",
      deletedId: id,
      githubPushed,
      remainingCount: serverTasks.length,
    });
  });

  // Admin: Toggle task active/inactive status
  app.post("/api/admin/tasks/toggle-active", (req, res) => {
    const { id } = req.body || {};
    const task = serverTasks.find((t) => t.id === id);
    if (!task) {
      return res.status(404).json({ error: "টাস্কটি পাওয়া যায়নি।" });
    }
    task.isActive = !task.isActive;
    saveJsonFile("tasks.json", serverTasks);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/tasks.json",
        JSON.stringify(serverTasks, null, 2),
        `Admin: Toggle task active status (${task.id})`
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: task.isActive ? "টাস্কটি চালু (Active) করা হয়েছে" : "টাস্কটি সাময়িকভাবে বন্ধ (Inactive) করা হয়েছে",
      task,
    });
  });

  // User: Complete a task and receive reward
  app.post("/api/tasks/complete", (req, res) => {
    const user = getRequestUser(req);
    const { taskId, rewardUsd } = req.body || {};
    const todayDateStr = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);

    // If date changed, reset daily counter
    if (user.lastActiveDate && user.lastActiveDate !== todayDateStr) {
      user.adsWatchedToday = 0;
      user.completedTaskIds = [];
    }
    user.lastActiveDate = todayDateStr;

    const task = serverTasks.find((t) => t.id === taskId);
    const maxDailyLimit = incomeMethodsConfig?.ads?.dailyLimit || user.dailyAdLimit || 40;

    if ((user.adsWatchedToday || 0) >= maxDailyLimit) {
      return res.status(400).json({
        error: `আজকের কাজের সর্বোচ্চ সীমা (${maxDailyLimit} টি) পূর্ণ হয়েছে! আগামী কাল আবার চেষ্টা করুন।`,
      });
    }

    if (!user.completedTaskIds) user.completedTaskIds = [];
    const alreadyDone = user.completedTaskIds.includes(taskId);
    if (!alreadyDone) {
      user.completedTaskIds.push(taskId);
      const earned = Number(task?.rewardUsd || rewardUsd || 0.0125);
      user.balanceUsd = +(Number(user.balanceUsd || 0) + earned).toFixed(4);
      user.adsWatchedToday = (user.adsWatchedToday || 0) + 1;
      if (task) {
        task.totalCompletions = (task.totalCompletions || 0) + 1;
        saveJsonFile("tasks.json", serverTasks);
      }
      saveJsonFile("users.json", usersMap);
    }

    res.json({
      success: true,
      alreadyCompleted: alreadyDone,
      user,
      task,
      rewardUsd: task?.rewardUsd || rewardUsd || 0.0125,
    });
  });

  // Public Telegram Config endpoint for client
  app.get("/api/telegram/config", (_req, res) => {
    res.json({
      channel1Handle: telegramConfig.channel1Handle,
      channel1Url: telegramConfig.channel1Url,
      channel2Handle: telegramConfig.channel2Handle,
      channel2Url: telegramConfig.channel2Url,
      enforceOnEveryVisit: telegramConfig.enforceOnEveryVisit,
      botConfigured: Boolean(telegramConfig.botToken),
    });
  });

  // Admin Telegram Config endpoints
  app.get("/api/admin/telegram-config", (_req, res) => {
    res.json({
      success: true,
      config: telegramConfig,
    });
  });

  app.post("/api/admin/telegram-config", (req, res) => {
    const { botToken, botUsername, deliveryBotHandle, channel1Handle, channel1Url, channel2Handle, channel2Url, enforceOnEveryVisit, allowDevBypass } = req.body;
    if (botToken !== undefined) telegramConfig.botToken = botToken.trim();
    if (botUsername) (telegramConfig as any).botUsername = botUsername.trim().replace('@', '');
    if (deliveryBotHandle) (telegramConfig as any).deliveryBotHandle = deliveryBotHandle.trim().replace('@', '');
    if (channel1Handle) telegramConfig.channel1Handle = channel1Handle.trim();
    if (channel1Url) telegramConfig.channel1Url = channel1Url.trim();
    if (channel2Handle) telegramConfig.channel2Handle = channel2Handle.trim();
    if (channel2Url) telegramConfig.channel2Url = channel2Url.trim();
    if (enforceOnEveryVisit !== undefined) telegramConfig.enforceOnEveryVisit = Boolean(enforceOnEveryVisit);
    if (allowDevBypass !== undefined) (telegramConfig as any).allowDevBypass = Boolean(allowDevBypass);
    saveJsonFile("telegram_config.json", telegramConfig);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/telegram_config.json",
        JSON.stringify(telegramConfig, null, 2),
        "Admin: Update Telegram and Channel Settings"
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: "Telegram settings updated successfully!",
      config: telegramConfig,
    });
  });

  // Automated Delivery Telegram Bot Webhook (For @PremiumVideoDeliveryBot)
  app.post("/api/telegram/bot-webhook", async (req, res) => {
    try {
      const update = req.body;
      const message = update?.message;
      if (!message || !message.text) {
        return res.json({ ok: true });
      }

      const chatId = message.chat?.id;
      const text = message.text.trim();

      // Check if start command: /start unlock_video-id or /start
      if (text.startsWith("/start")) {
        const token = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
        const videoId = text.replace("/start unlock_", "").replace("/start", "").trim();
        const foundVideo = (serverAdVideos || []).find((v: any) => v.id === videoId) || serverAdVideos?.[0];

        if (token && chatId) {
          const videoTitle = foundVideo ? foundVideo.title : "প্রিমিয়াম সিক্রেট ইনকাম ভিডিও";
          const fullUrl = foundVideo ? foundVideo.fullVideoUrl : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `🎉 *অভিনন্দন! আপনার ভিডিও আনলক হয়েছে*\n\n📹 *ভিডিও:* ${videoTitle}\n⏱️ *মেয়াদ:* ৯০ মিনিট\n\n⬇️ নিচের বোতামে চাপ দিয়ে সম্পূর্ণ ভিডিওটি উপভোগ করুন:\n\n⚠️ _এই ভিডিওটি সম্পূর্ণ সুরক্ষিত। ডাউনলোড বা শেয়ার করা সম্পূর্ণ নিষিদ্ধ।_`,
              parse_mode: "Markdown",
              protect_content: true,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "▶️ সম্পূর্ণ ভিডিও দেখুন", url: fullUrl }],
                  [{ text: "🚀 আরও ভিডিও পেতে মিনি অ্যাপে যান", url: "https://t.me/CholoIncomeKoriBot" }],
                ],
              },
            }),
          }).catch(() => {});
        }
      }
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // Admin: Test Telegram Bot & Channel Administrator Status
  app.post("/api/admin/telegram/test-bot", async (req, res) => {
    try {
      const token = req.body.botToken?.trim() || telegramConfig.botToken;
      const ch1 = req.body.channel1Handle?.trim() || telegramConfig.channel1Handle;
      const ch2 = req.body.channel2Handle?.trim() || telegramConfig.channel2Handle;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "⚠️ কোনো Telegram Bot Token পাওয়া যায়নি। অনুগ্রহ করে @BotFather থেকে বটের টোকেন দিন।",
        });
      }

      // 1. Verify Bot Token
      const botMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const botMe = await botMeRes.json();
      if (!botMe.ok || !botMe.result) {
        return res.status(400).json({
          success: false,
          message: `❌ অবৈধ Bot Token! Telegram থেকে পাওয়া ত্রুটি: ${botMe.description || 'Invalid token'}`,
        });
      }

      const botInfo = botMe.result;
      const botUsername = `@${botInfo.username}`;

      // Helper to check channel and admin status
      const checkChannel = async (channelHandle: string) => {
        try {
          // Check chat info
          const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(channelHandle)}`);
          const chatData = await chatRes.json();
          if (!chatData.ok) {
            return {
              handle: channelHandle,
              exists: false,
              isAdmin: false,
              title: null,
              error: chatData.description || 'Channel not found or bot cannot access it',
            };
          }

          // Check if bot is in chat administrators
          const adminRes = await fetch(`https://api.telegram.org/bot${token}/getChatAdministrators?chat_id=${encodeURIComponent(channelHandle)}`);
          const adminData = await adminRes.json();

          let isAdmin = false;
          if (adminData.ok && Array.isArray(adminData.result)) {
            isAdmin = adminData.result.some((admin: any) => admin.user?.id === botInfo.id);
          }

          return {
            handle: channelHandle,
            exists: true,
            isAdmin,
            title: chatData.result.title || channelHandle,
            memberCount: chatData.result.active_usernames ? null : undefined,
          };
        } catch (err: any) {
          return {
            handle: channelHandle,
            exists: false,
            isAdmin: false,
            error: err.message,
          };
        }
      };

      const [status1, status2] = await Promise.all([
        checkChannel(ch1),
        checkChannel(ch2),
      ]);

      const bothAdmin = status1.isAdmin && status2.isAdmin;

      return res.json({
        success: true,
        bot: {
          id: botInfo.id,
          name: botInfo.first_name,
          username: botUsername,
        },
        channel1: status1,
        channel2: status2,
        allReady: bothAdmin,
        summary: bothAdmin
          ? `✅ চমৎকার! ${botUsername} উভয় চ্যানেলেই এডমিন হিসেবে সংযুক্ত আছে। এখন ব্যবহারকারী চ্যানেল থেকে লিভ নিলে স্বয়ংক্রিয়ভাবে ধরা পড়বে!`
          : `⚠️ সতর্কতা: বট এখনও উভয় চ্যানেলে এডমিন নয়। টেলিগ্রাম চ্যানেলে গিয়ে বটকে (${botUsername}) "Administrator" হিসেবে অ্যাড করুন।`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `সার্ভার সংযোগ ত্রুটি: ${err.message}`,
      });
    }
  });

  // Recommended Telegram Bot Start Screen Description text
  const defaultBotDescription = `🎉 স্বাগতম Cholo Income Kori 🥰
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
💬 সাপোর্ট: @nabirmia`;

  // Get recommended bot description
  app.get("/api/telegram/bot-description", (_req, res) => {
    res.json({
      success: true,
      description: defaultBotDescription,
      shortDescription: "🎉 Cholo Income Kori - ৫ ভাবে নিশ্চিত ইনকাম, সর্বনিম্ন উত্তোলন ২৫৳!",
    });
  });

  // Admin: Sync Description directly to Telegram Bot API (setMyDescription)
  app.post("/api/admin/telegram/set-description", async (req, res) => {
    try {
      const token = req.body.botToken?.trim() || telegramConfig.botToken;
      const description = (req.body.description?.trim()) || defaultBotDescription;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "⚠️ কোনো Telegram Bot Token পাওয়া যায়নি। অনুগ্রহ করে Settings বা Admin প্যানেলে Bot Token প্রদান করুন।",
        });
      }

      // Call Telegram setMyDescription
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const tgData = await tgRes.json();

      if (!tgData.ok) {
        return res.status(400).json({
          success: false,
          message: `Telegram ত্রুটি: ${tgData.description || 'বটের ডেসক্রিপশন সেট করতে ব্যর্থ হয়েছে'}`,
        });
      }

      // Also set short description for bot profile
      try {
        await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            short_description: "🎉 Cholo Income Kori - ৫ ভাবে নিশ্চিত ইনকাম, সর্বনিম্ন উত্তোলন ২৫৳!",
          }),
        });
      } catch {}

      res.json({
        success: true,
        message: "✅ চমৎকার! Telegram Bot-এর 'Start Bot' বাটনের ওপরের খালি জায়গায় আপনার লেখাগুলো সফলভাবে সেট হয়েছে! এখন টেলিগ্রামে বটের চ্যাটে এটি সার্বক্ষণিক (All-time) প্রদর্শিত হবে।",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `সার্ভার সংযোগ ত্রুটি: ${err.message}`,
      });
    }
  });

  // Telegram Channel Membership Verification endpoint (Detects Leaves in Real Time)
  app.post("/api/telegram/verify-membership", async (req, res) => {
    try {
      const { telegramUserId, channel1Visited, channel2Visited } = req.body;
      const botToken = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;

      const requiredChannels = [
        telegramConfig.channel1Handle,
        telegramConfig.channel2Handle,
      ];

      const cleanUserId = telegramUserId ? String(telegramUserId).trim().replace(/^@/, '') : '';
      const isNumericId = /^\d+$/.test(cleanUserId);

      // If Telegram Bot Token is configured
      if (botToken) {
        if (!isNumericId) {
          return res.status(400).json({
            success: false,
            isMember: false,
            message: '⚠️ আপনার টেলিগ্রাম নিউমেরিক ইউজার আইডি পাওয়া যায়নি। অনুগ্রহ করে টেলিগ্রাম অ্যাপের ভিতর থেকে মিনি অ্যাপটি ওপেন করুন।',
          });
        }

        for (const ch of requiredChannels) {
          try {
            const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(ch)}&user_id=${encodeURIComponent(cleanUserId)}`;
            const tgRes = await fetch(url);
            const tgData = await tgRes.json();

            if (tgData.ok && tgData.result) {
              const status = tgData.result.status;
              // Detect if user has LEFT or was KICKED
              if (status === 'left' || status === 'kicked') {
                return res.json({
                  success: false,
                  isMember: false,
                  hasLeft: true,
                  leftChannel: ch,
                  message: `❌ আপনি ${ch} চ্যানেল থেকে লিভ (Leave) নিয়েছেন! অ্যাপে কাজ করতে হলে উভয় চ্যানেলে জয়েন থাকা বাধ্যতামূলক। পুনরায় জয়েন করুন।`
                });
              }

              const isMember = ['member', 'administrator', 'creator'].includes(status) || 
                               (status === 'restricted' && tgData.result.is_member === true);
              if (!isMember) {
                return res.json({
                  success: false,
                  isMember: false,
                  hasLeft: false,
                  leftChannel: ch,
                  message: `❌ আপনি এখনও ${ch} চ্যানেলে জয়েন করেননি! দয়া করে চ্যানেলে জয়েন বাটনে চাপ দিয়ে জয়েন করুন।`
                });
              }
            } else {
              // Telegram Bot API returned an error
              const desc = (tgData.description || '').toLowerCase();
              if (desc.includes('bot is not a member') || desc.includes('chat not found') || desc.includes('unauthorized')) {
                return res.json({
                  success: false,
                  isMember: false,
                  hasLeft: false,
                  message: `⚠️ টেলিগ্রাম কনফিগারেশন ত্রুটি: বটটি ${ch} চ্যানেলে অ্যাডমিন হিসেবে যুক্ত নেই! চ্যানেলে গিয়ে বটটিকে অ্যাডমিন করুন।`
                });
              }

              // User not in channel
              return res.json({
                success: false,
                isMember: false,
                hasLeft: false,
                leftChannel: ch,
                message: `❌ আপনি ${ch} চ্যানেলে জয়েন করেননি! দয়া করে জয়েন বাটনে চাপ দিয়ে চ্যানেলে জয়েন করুন এবং তারপর যাচাই করুন।`
              });
            }
          } catch (e: any) {
            console.error(`Error verifying channel ${ch}:`, e);
            return res.status(500).json({
              success: false,
              isMember: false,
              message: `টেলিগ্রাম সার্ভারে সংযোগ করা সম্ভব হয়নি: ${e.message}`,
            });
          }
        }

        return res.json({
          success: true,
          isMember: true,
          message: '✅ উভয় চ্যানেলে সক্রিয় সদস্যপদ সফলভাবে নিশ্চিত হয়েছে!'
        });
      }

      // If Bot Token is not set in Admin Panel yet:
      if ((telegramConfig as any).allowDevBypass && channel1Visited && channel2Visited) {
        return res.json({
          success: true,
          isMember: true,
          message: '✅ চ্যানেল মেম্বারশিপ যাচাই সফল হয়েছে (ডেভেলপার প্রিভিউ মোড)!'
        });
      }

      return res.status(400).json({
        success: false,
        isMember: false,
        hasLeft: false,
        message: '⚠️ এডমিন প্যানেলে এখনও Telegram Bot Token সেট করা হয়নি। এডমিন প্যানেলের "Telegram & Channels" ট্যাব থেকে Bot Token প্রদান করুন ও বটকে উভয় চ্যানেলে অ্যাডমিন করুন।'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, isMember: false, error: err?.message || 'Verification error' });
    }
  });

  // Videos list
  app.get("/api/videos", (_req, res) => {
    res.json(serverVideos.filter((v) => !deletedVideoIds.includes(v.id)));
  });

  // Admin API: Stats & Overview
  app.get("/api/admin/stats", (_req, res) => {
    const userList = Object.values(usersMap).map((u: any) => {
      ensureRolling7DaysHistory(u);
      return u;
    });
    const totalPaid = withdrawals
      .filter((w) => w.status === "Approved")
      .reduce((sum, item) => sum + item.amount, 0);
    const pendingCount = withdrawals.filter((w) => w.status === "Pending").length;

    res.json({
      success: true,
      stats: {
        totalUsers: userList.length,
        pendingWithdrawals: pendingCount,
        totalPaidUsd: totalPaid.toFixed(2),
        totalPaidBdt: (totalPaid * 120).toFixed(2),
        totalVideos: serverVideos.length,
      },
      users: userList,
    });
  });

  // Admin API: Update Withdrawal status & Broadcast Payment Proof
  app.post("/api/admin/withdrawals/update", async (req, res) => {
    const { id, status } = req.body;
    const item = withdrawals.find((w) => w.id === id);
    if (!item) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    item.status = status;
    saveJsonFile("withdrawals.json", withdrawals);

    if (status === "Approved") {
      const bdtAmount = item.currency === 'BDT' ? Number(item.amount) : Math.round(Number(item.amount) * 120);
      const usdAmount = item.currency === 'USD' ? Number(item.amount) : +(Number(item.amount) / 120).toFixed(2);
      const trxId = "TXN" + Date.now().toString().slice(-8);
      const timeDhaka = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

      // Clean privacy masking for user name and account number
      const rawName = (item.userName || "User").trim();
      const maskedName = rawName.length > 4 
        ? rawName.slice(0, 3) + "***" + (rawName.length > 6 ? rawName.slice(-2) : "") 
        : rawName + "***";
      const rawAccount = (item.accountNumber || "017********").trim();
      const maskedAccount = rawAccount.length > 6 
        ? rawAccount.slice(0, 4) + "****" + rawAccount.slice(-3) 
        : rawAccount;

      // 1. Immediately prepend to livePayouts stream for all Mini App users
      const newLivePayout = {
        id: "payout-" + Date.now(),
        userName: maskedName,
        amount: `৳ ${bdtAmount}`,
        method: item.method || 'bKash',
        timeAgo: 'এইমাত্র',
        status: 'Success',
        trxId,
        timestamp: Date.now(),
      };
      livePayouts.unshift(newLivePayout);
      livePayouts = livePayouts.slice(0, 30);

      // 2. Personal notification for the user inside Mini App
      const recipientUser = usersMap[item.userId];
      if (recipientUser) {
        recipientUser.personalNotifications = recipientUser.personalNotifications || [];
        recipientUser.personalNotifications.unshift({
          id: "proof_" + Date.now(),
          type: "bonus",
          title: "🎉 উইথড্র পেমেন্ট সফলভাবে প্রদান করা হয়েছে!",
          message: `অভিনন্দন! আপনার ৳${bdtAmount} টাকার (${item.method}) উইথড্র রিকোয়েস্ট অনুমোদিত হয়েছে এবং টাকা পাঠানো হয়েছে। TrxID: ${trxId}।`,
          createdAt: new Date().toISOString(),
          isRead: false,
          sentBy: "Admin",
          sentToTelegram: true,
        });
        saveJsonFile("users.json", usersMap);
      }

      // 3. Send Telegram Payment Proof Message to Official Channels with "Open App" button!
      const botToken = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
      const botHandle = (telegramConfig.botUsername || "CholoIncomeKoriBot").replace("@", "");
      const miniAppUrl = `https://t.me/${botHandle}/app`;

      const paymentProofHtml =
        `🎉 <b>পেমেন্ট সফলভাবে সম্পন্ন হয়েছে! (Payment Proof)</b>\n\n` +
        `👤 <b>ব্যবহারকারী:</b> <b>${escapeTgHtml(maskedName)}</b>\n` +
        `💳 <b>পেমেন্ট মেথড:</b> <b>${escapeTgHtml(item.method || 'bKash')}</b>\n` +
        `📱 <b>অ্যাকাউন্ট:</b> <code>${escapeTgHtml(maskedAccount)}</code>\n` +
        `💰 <b>উত্তোলনের পরিমাণ:</b> <b>৳ ${bdtAmount} টাকা</b> ($${usdAmount})\n` +
        `⚡ <b>স্ট্যাটাস:</b> ✅ Approved & Paid (সফল)\n` +
        `🧾 <b>ট্রানজেকশন আইডি:</b> <code>${trxId}</code>\n` +
        `⏰ <b>সময়:</b> ${timeDhaka}\n\n` +
        `🚀 <i>প্রতিদিন ১০০% নিশ্চিত পেমেন্ট পেতে এখনই আমাদের মিনি অ্যাপে প্রবেশ করে কাজ শুরু করুন!</i>`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: "🚀 Open App (টাকা আয় শুরু করুন)",
              url: miniAppUrl,
            },
          ],
        ],
      };

      if (botToken) {
        // Broadcast payment proof to all official channels
        const channels = [
          telegramConfig.channel1Handle || "@CholoIncomeKori",
          telegramConfig.channel2Handle || "@IncomeBD_Online",
        ].filter(Boolean);

        for (const ch of channels) {
          try {
            const targetChat = formatTelegramChatTarget(ch);
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: targetChat,
                text: paymentProofHtml,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard,
              }),
            });
            console.log(`[PaymentProof] Broadcasted to channel ${targetChat}`);
          } catch (chErr: any) {
            console.warn(`[PaymentProof] Channel error ${ch}:`, chErr.message);
          }
        }

        // Also send directly to user's Telegram inbox above Open App if userId is numeric:
        if (item.userId && /^\d+$/.test(item.userId)) {
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: item.userId,
                text:
                  `🎉 <b>উইথড্র পেমেন্ট সফলভাবে প্রদান করা হয়েছে!</b>\n\n` +
                  `প্রিয় সদস্য, আপনার <b>৳ ${bdtAmount} টাকা</b> (${item.method}) উইথড্র সফলভাবে অনুমোদিত হয়েছে ও টাকা পাঠানো হয়েছে।\n\n` +
                  `🧾 TrxID: <code>${trxId}</code>\n` +
                  `⏰ সময়: ${timeDhaka}\n\n` +
                  `টেলিগ্রাম চ্যাটে "Open App" বাটনে চাপ দিয়ে যেকোনো সময় আবার আয় করুন!`,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard,
              }),
            });
            console.log(`[PaymentProof] Sent direct confirmation to user ${item.userId}`);
          } catch (uErr: any) {
            console.warn(`[PaymentProof] Direct user error:`, uErr.message);
          }
        }
      }

      // Also trigger GitHub push so the approved withdrawal and live payout state is backed up!
      if (githubSyncConfig.token) {
        pushFileToGitHubDirect(
          "data/withdrawals.json",
          JSON.stringify(withdrawals, null, 2),
          `Payment Approved for ${maskedName} - ৳${bdtAmount}`
        ).catch(() => {});
      }
    }

    return res.json({ success: true, item, livePayouts });
  });

  // Admin API: Delete Withdrawal record
  app.post("/api/admin/withdrawals/delete", (req, res) => {
    const { id } = req.body;
    withdrawals = withdrawals.filter((w) => w.id !== id);
    saveJsonFile("withdrawals.json", withdrawals);
    res.json({ success: true, remaining: withdrawals.length });
  });

  // Admin API: Delete User account
  app.post("/api/admin/users/delete", (req, res) => {
    const { userId } = req.body;
    if (!userId || userId === ADMIN_ID) {
      return res.status(400).json({ error: "Cannot delete admin account" });
    }
    if (usersMap[userId]) {
      delete usersMap[userId];
      saveJsonFile("users.json", usersMap);
      return res.json({ success: true, remaining: Object.keys(usersMap).length });
    }
    res.status(404).json({ error: "User not found" });
  });

  // Admin API: Update user balance and properties
  app.post("/api/admin/users/update", (req, res) => {
    const { userId, balanceUsd, dailyAdLimit, activeReferralsWithActivity } = req.body;
    const targetUser = (userId && usersMap[userId]) ? usersMap[userId] : usersMap[ADMIN_ID];
    if (targetUser) {
      if (typeof balanceUsd === "number") {
        targetUser.balanceUsd = +balanceUsd;
      }
      if (typeof dailyAdLimit === "number") {
        targetUser.dailyAdLimit = dailyAdLimit;
      }
      if (typeof activeReferralsWithActivity === "number") {
        targetUser.activeReferralsWithActivity = activeReferralsWithActivity;
      }
      saveJsonFile("users.json", usersMap);
      return res.json({ success: true, user: targetUser });
    }
    return res.status(404).json({ error: "User not found" });
  });

  // Admin API: Send individual Personal Message / Warning / Notice to a specific User
  app.post("/api/admin/users/send-message", async (req, res) => {
    const { userId, type = 'warning', title, message, sendToTelegram = true } = req.body;
    const user = usersMap[userId];
    if (!user) return res.status(404).json({ error: "ইউজার খুঁজে পাওয়া যায়নি।" });

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "অনুগ্রহ করে একটি বার্তা (Message) লিখুন।" });
    }

    const notification: UserPersonalMessage = {
      id: "msg_" + Date.now(),
      type: type || 'warning',
      title: title ? title.trim() : (type === 'warning' ? '⚠️ সতর্কবার্তা (Warning Notice)' : '📢 অ্যাডমিন বার্তা'),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      sentBy: 'Admin',
      sentToTelegram: Boolean(sendToTelegram),
    };

    if (!Array.isArray(user.personalNotifications)) {
      user.personalNotifications = [];
    }
    user.personalNotifications.unshift(notification);
    user.personalNotifications = user.personalNotifications.slice(0, 20); // Keep last 20 messages
    saveJsonFile("users.json", usersMap);

    let telegramSent = false;
    let tgError = "";

    const token = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (sendToTelegram && token && /^\d+$/.test(userId)) {
      try {
        const typeIcons: Record<string, string> = {
          warning: '⚠️',
          notice: '📢',
          message: '💬',
          bonus: '🎁',
        };
        const icon = typeIcons[type] || '⚠️';
        const tgText = `${icon} <b>Cholo Income Kori — অ্যাডমিন বার্তা</b>\n\n` +
          `👤 <b>ব্যবহারকারী:</b> ${escapeTgHtml(user.displayName || user.username || userId)}\n` +
          `📌 <b>বিষয়:</b> <i>${escapeTgHtml(notification.title)}</i>\n\n` +
          `📝 <b>বার্তা:</b>\n${escapeTgHtml(message.trim())}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ <i>অনুগ্রহ করে নিয়ম মেনে অ্যাপে কাজ করুন এবং নিজের অ্যাকাউন্টটি সুরক্ষিত রাখুন।</i>`;

        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: userId,
            text: tgText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚀 মিনি অ্যাপ ওপেন করুন", url: `https://t.me/${(telegramConfig.botUsername || "CholoIncomeKoriBot").replace("@", "")}` }],
              ],
            },
          }),
        });
        const tgData: any = await tgRes.json();
        if (tgData.ok) {
          telegramSent = true;
          console.log(`[AdminUserMsg] Sent personal Telegram message to user ${userId}`);
        } else {
          tgError = tgData.description || "Telegram API rejected send";
          console.warn(`[AdminUserMsg] Telegram error sending to ${userId}:`, tgError);
        }
      } catch (e: any) {
        tgError = e.message;
        console.warn(`[AdminUserMsg] Telegram exception for ${userId}:`, e.message);
      }
    }

    res.json({
      success: true,
      notification,
      telegramSent,
      tgError,
      message: telegramSent
        ? `✅ বার্তাটি ইউজারের অ্যাকাউন্টে সংরক্ষিত হয়েছে এবং @CholoIncomeKoriBot থেকে সরাসরি ইউজারের টেলিগ্রামে পাঠানো হয়েছে!`
        : `✅ বার্তাটি ইউজারের অ্যাকাউন্টে সংরক্ষিত হয়েছে! (ইউজার মিনি অ্যাপে ঢুকলেই নোটিশ পপআপ দেখতে পাবেন)`,
    });
  });

  // User: Mark personal notifications as read
  app.post("/api/user/notifications/mark-read", (req, res) => {
    const user = getRequestUser(req);
    const { notificationId } = req.body || {};
    if (Array.isArray(user.personalNotifications)) {
      if (notificationId) {
        user.personalNotifications.forEach((n) => {
          if (n.id === notificationId) n.isRead = true;
        });
      } else {
        user.personalNotifications.forEach((n) => {
          n.isRead = true;
        });
      }
      saveJsonFile("users.json", usersMap);
    }
    res.json({ success: true, notifications: user.personalNotifications || [] });
  });

  // Admin API: Add video task
  app.post("/api/admin/videos/add", (req, res) => {
    const { title, category, subCategory, rewardUsd, duration, thumbnail } = req.body;
    const newVideo = {
      id: "vid-" + Date.now(),
      title: title || "New Earning Task",
      category: category || "online-income",
      subCategory: subCategory || "Telegram",
      rewardUsd: parseFloat(rewardUsd) || 0.20,
      duration: duration || "05:00",
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500",
      isDemo: true,
      views: 10,
    };
    serverVideos.unshift(newVideo as any);
    saveJsonFile("videos.json", serverVideos);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/videos.json",
        JSON.stringify(serverVideos, null, 2),
        `Admin: Add video task "${newVideo.title}"`
      ).catch(() => {});
    }

    res.json({ success: true, video: newVideo });
  });

  // Admin API: Edit video task
  app.post("/api/admin/videos/edit", (req, res) => {
    const { id, title, category, subCategory, rewardUsd, duration, thumbnail } = req.body;
    const index = serverVideos.findIndex((v) => v.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "ভিডিও টাস্ক পাওয়া যায়নি" });
    }
    serverVideos[index] = {
      ...serverVideos[index],
      title: title !== undefined ? title.trim() : serverVideos[index].title,
      category: category || serverVideos[index].category,
      subCategory: subCategory !== undefined ? subCategory.trim() : serverVideos[index].subCategory,
      rewardUsd: rewardUsd !== undefined ? parseFloat(rewardUsd) || 0 : serverVideos[index].rewardUsd,
      duration: duration !== undefined ? duration.trim() : serverVideos[index].duration,
      thumbnail: thumbnail !== undefined ? thumbnail.trim() : serverVideos[index].thumbnail,
    };
    saveJsonFile("videos.json", serverVideos);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/videos.json",
        JSON.stringify(serverVideos, null, 2),
        `Admin: Update video task "${serverVideos[index].title}"`
      ).catch(() => {});
    }

    res.json({ success: true, video: serverVideos[index] });
  });

  // Admin API: Delete video task (Permanently blacklisted so it never returns)
  app.post("/api/admin/videos/delete", async (req, res) => {
    const { id } = req.body;
    if (id && !deletedVideoIds.includes(id)) {
      deletedVideoIds.push(id);
      saveJsonFile("deleted_video_ids.json", deletedVideoIds);
    }
    serverVideos = serverVideos.filter((v) => v.id !== id);
    saveJsonFile("videos.json", serverVideos);

    let githubPushed = false;
    if (githubSyncConfig.token && githubSyncConfig.repo) {
      try {
        await pushFileToGitHubDirect(
          "data/videos.json",
          JSON.stringify(serverVideos, null, 2),
          `Admin: Delete video task (${serverVideos.length} remaining)`
        );
        await pushFileToGitHubDirect(
          "data/deleted_video_ids.json",
          JSON.stringify(deletedVideoIds, null, 2),
          `Admin: Update deleted video IDs list`
        );
        githubPushed = true;
      } catch (ghErr) {
        console.warn("GitHub push on video delete failed:", ghErr);
      }
    }

    res.json({ success: true, remaining: serverVideos.length, githubPushed });
  });

  // Admin API: Broadcast notification (Add, Edit, Update, Toggle)
  app.post("/api/admin/broadcast", (req, res) => {
    const { message, isActive } = req.body;
    if (message !== undefined) {
      noticesConfig.broadcastNotice.message = String(message).trim();
      noticesConfig.broadcastNotice.updatedAt = new Date().toISOString();
    }
    if (isActive !== undefined) {
      noticesConfig.broadcastNotice.isActive = Boolean(isActive);
    }
    saveJsonFile("notices.json", noticesConfig);
    console.log(`[Admin Broadcast Updated]`, noticesConfig.broadcastNotice);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/notices.json",
        JSON.stringify(noticesConfig, null, 2),
        "Admin: Update Broadcast Notice"
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: "ব্রডকাস্ট নোটিশ সফলভাবে আপডেট ও সেভ হয়েছে!",
      broadcastNotice: noticesConfig.broadcastNotice,
    });
  });

  // Admin API: Toggle Broadcast Notice Active Status
  app.post("/api/admin/broadcast/toggle", (req, res) => {
    const { isActive } = req.body;
    noticesConfig.broadcastNotice.isActive = isActive !== undefined 
      ? Boolean(isActive) 
      : !noticesConfig.broadcastNotice.isActive;
    saveJsonFile("notices.json", noticesConfig);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/notices.json",
        JSON.stringify(noticesConfig, null, 2),
        "Admin: Toggle Broadcast Notice"
      ).catch(() => {});
    }

    res.json({ success: true, broadcastNotice: noticesConfig.broadcastNotice });
  });

  // Admin API: Official Notice (View, Edit, Save)
  app.post("/api/admin/official-notice", (req, res) => {
    const { title, description, rules, warning, footer, isActive } = req.body;
    if (title !== undefined) noticesConfig.officialNotice.title = String(title).trim();
    if (description !== undefined) noticesConfig.officialNotice.description = String(description).trim();
    if (Array.isArray(rules)) noticesConfig.officialNotice.rules = rules.map((r: any) => String(r).trim()).filter(Boolean);
    if (warning !== undefined) noticesConfig.officialNotice.warning = String(warning).trim();
    if (footer !== undefined) noticesConfig.officialNotice.footer = String(footer).trim();
    if (isActive !== undefined) noticesConfig.officialNotice.isActive = Boolean(isActive);
    noticesConfig.officialNotice.updatedAt = new Date().toISOString();
    saveJsonFile("notices.json", noticesConfig);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/notices.json",
        JSON.stringify(noticesConfig, null, 2),
        "Admin: Update Official Notice"
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: "অফিসিয়াল নোটিশ সফলভাবে আপডেট ও সেভ হয়েছে!",
      officialNotice: noticesConfig.officialNotice,
    });
  });

  // Withdrawals
  app.get("/api/withdrawals", (_req, res) => {
    res.json(withdrawals);
  });

  app.post("/api/withdraw", (req, res) => {
    const user = getRequestUser(req);
    const { method, accountNumber, amount, currency } = req.body;
    if (!method || !accountNumber || !amount) {
      return res.status(400).json({ error: "Missing required withdrawal fields" });
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: "সঠিক উত্তোলনের পরিমাণ লিখুন।" });
    }

    // Must be round figure (whole integer), poysa remains in balance
    if (withdrawAmount % 1 !== 0) {
      return res.status(400).json({
        error: "উত্তোলনের পরিমাণ অবশ্যই পূর্ণসংখ্যা (Round Figure, যেমন: ২৫, ৫০, ১০০) হতে হবে। পয়সা আপনার অ্যাকাউন্টে জমা থাকবে।",
      });
    }

    const minRequired = currency === 'USD' ? 1 : currency === 'BDT' ? 25 : 20;
    if (withdrawAmount < minRequired) {
      return res.status(400).json({
        error: `সর্বনিম্ন উত্তোলন পরিমাণ ${currency === 'BDT' ? '৳২৫' : currency === 'INR' ? '₹২০' : '$১'} (পূর্ণসংখ্যা)`,
      });
    }

    // Constraint: Must refer 3 active users (who completed at least ৳10 activity)
    const activeRefs = user.activeReferralsWithActivity || 0;
    if (activeRefs < 3) {
      return res.status(400).json({
        error: `টাকা উত্তোলন করতে হলে অন্তত ৩ জন সক্রিয় বন্ধুকে রেফার করতে হবে (যারা প্রত্যেকে ন্যূনতম ১০ টাকা কাজ করেছে)। বর্তমানে আপনার সক্রিয় রেফারেল: ${activeRefs}/৩ জন।`,
      });
    }

    // Constraint: Duplicate account number prevention (1 account number = 1 unique user only)
    const cleanAccount = accountNumber.trim().toLowerCase();
    const isAccountUsedByAnother = withdrawals.some(
      (w) => w.accountNumber.trim().toLowerCase() === cleanAccount && w.userId !== user.id
    );
    if (isAccountUsedByAnother) {
      return res.status(400).json({
        error: "এই অ্যাকাউন্ট নম্বরটি ইতিমধ্যে অন্য একজন ব্যবহারকারী ব্যবহার করেছেন! একটি নম্বর দিয়ে কেবল একটি অ্যাকাউন্টে পেমেন্ট নেওয়া যাবে।",
      });
    }

    // Check whether this is user's first withdrawal
    const userPreviousWithdrawals = withdrawals.filter((w) => w.userId === user.id);
    const isFirstWithdrawal = userPreviousWithdrawals.length === 0;
    const estimatedTime = isFirstWithdrawal ? "৭ থেকে ১৫ কার্যদিবস" : "৬ থেকে ১২ ঘণ্টা";

    const newWithdrawal = {
      id: "wth_" + Date.now(),
      userId: user.id,
      userName: user.displayName,
      method,
      accountNumber,
      amount: withdrawAmount,
      currency: currency || user.currency,
      status: "Pending",
      createdAt: new Date().toLocaleTimeString(),
    };

    withdrawals.unshift(newWithdrawal);
    const deductUsd = currency === 'USD' ? withdrawAmount : withdrawAmount / 120;
    user.balanceUsd = Math.max(0, +(Number(user.balanceUsd || 0) - deductUsd).toFixed(6));
    saveJsonFile("withdrawals.json", withdrawals);
    saveJsonFile("users.json", usersMap);

    // Also add to live payouts
    livePayouts.unshift({
      id: "p-" + Date.now(),
      userName: user.displayName,
      amount: `${currency === 'BDT' ? '৳' : currency === 'INR' ? '₹' : '$'} ${withdrawAmount}`,
      method,
      timeAgo: "Just now",
      status: "Processing",
    });

    res.json({ success: true, withdrawal: newWithdrawal, balanceUsd: user.balanceUsd });
  });

  app.get("/api/live-payouts", (_req, res) => {
    res.json(livePayouts);
  });

  // Push Notifications Mock & Real sync
  app.post("/api/notifications/subscribe", (req, res) => {
    pushSubscriptions.push(req.body);
    res.json({ success: true, message: "Subscribed to push notifications" });
  });

  // ==========================================
  // AD-LOCKED VIDEOS & 90-MIN AUTO-EXPIRY APIS
  // ==========================================

  // Get ad-locked videos with current user's unlock & 90-min session status
  app.get("/api/ad-videos", (req, res) => {
    const user = getRequestUser(req);
    const userId = (req.query.userId as string) || user.id;
    const now = Date.now();

    const sanitized = serverAdLockedVideos.map((video) => {
      const sessionKey = `${userId}_${video.id}`;
      const session = userVideoSessions[sessionKey];

      let isUnlocked = false;
      let remainingSeconds = 0;
      let expiresAt: number | undefined = undefined;

      if (session && session.unlocked && session.expiresAt) {
        if (session.expiresAt > now) {
          isUnlocked = true;
          expiresAt = session.expiresAt;
          remainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));
        } else {
          // 90 minutes expired! Auto-relock
          session.unlocked = false;
          session.delivered = false;
          session.adsWatched = 0;
          session.expiresAt = undefined;
          session.channelPostUrl = undefined;
          saveJsonFile("user_video_sessions.json", userVideoSessions);
        }
      }

      return {
        id: video.id,
        title: video.title,
        description: video.description,
        previewDuration: video.previewDuration,
        fullDuration: video.fullDuration,
        previewVideoUrl: video.previewVideoUrl,
        fullVideoUrl: isUnlocked ? video.fullVideoUrl : null,
        thumbnail: video.thumbnail,
        requiredAds: video.requiredAds,
        adTimerSeconds: video.adTimerSeconds || 15,
        adNetworkUrl: video.adNetworkUrl,
        adNetworkName: video.adNetworkName,
        expiryMinutes: video.expiryMinutes || 90,
        protectContent: video.protectContent ?? true,
        deliveryBotHandle: video.deliveryBotHandle || "PremiumVideoDeliveryBot",
        demoChannelUrl: video.demoChannelUrl || "https://t.me/demovideos24",
        channelId: video.channelId || "@demovideos24",
        views: video.views || 0,
        unlockedCount: video.unlockedCount || 0,
        unlocked: isUnlocked,
        adsWatched: session?.adsWatched || 0,
        remainingSeconds,
        expiresAt,
        delivered: Boolean(session?.delivered && isUnlocked),
        channelPostUrl: isUnlocked ? session?.channelPostUrl : null,
        canSendInbox: Boolean(session && session.adsWatched >= video.requiredAds && !session?.delivered),
      };
    });

    res.json(sanitized);
  });

  // Track ad watched progress for a video
  app.post("/api/ad-videos/progress", (req, res) => {
    const user = getRequestUser(req);
    const { videoId } = req.body;
    const userId = req.body.userId || user.id;

    const video = serverAdLockedVideos.find((v) => v.id === videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const sessionKey = `${userId}_${videoId}`;
    if (!userVideoSessions[sessionKey]) {
      userVideoSessions[sessionKey] = {
        videoId,
        userId,
        adsWatched: 0,
        unlocked: false,
      };
    }

    const session = userVideoSessions[sessionKey];
    const now = Date.now();

    // If already delivered and still active within 90 minutes
    if (session.unlocked && session.expiresAt && session.expiresAt > now) {
      return res.json({
        success: true,
        unlocked: true,
        delivered: Boolean(session.delivered),
        channelPostUrl: session.channelPostUrl,
        adsWatched: session.adsWatched,
        requiredAds: video.requiredAds,
        expiresAt: session.expiresAt,
        remainingSeconds: Math.floor((session.expiresAt - now) / 1000),
      });
    }

    // Increment watched ads
    session.adsWatched = (session.adsWatched || 0) + 1;

    // Check if user completed required ads
    if (session.adsWatched >= video.requiredAds) {
      session.canSendInbox = true;
      saveJsonFile("user_video_sessions.json", userVideoSessions);

      return res.json({
        success: true,
        canSendInbox: true,
        justCompletedAds: true,
        adsWatched: session.adsWatched,
        requiredAds: video.requiredAds,
        remainingAds: 0,
        message: `🎉 অভিনন্দন! প্রয়োজনীয় ${video.requiredAds}টি বিজ্ঞাপন দেখা সম্পন্ন হয়েছে! এবার সম্পূর্ণ ফুল ভিডিওটি টেলিগ্রাম চ্যানেলে পেতে 'Send Inbox' বাটনে ক্লিক করুন।`,
      });
    }

    saveJsonFile("user_video_sessions.json", userVideoSessions);

    res.json({
      success: true,
      canSendInbox: false,
      justCompletedAds: false,
      adsWatched: session.adsWatched,
      requiredAds: video.requiredAds,
      remainingAds: video.requiredAds - session.adsWatched,
      message: `বিজ্ঞাপন সম্পন্ন হয়েছে! বাকি আছে ${video.requiredAds - session.adsWatched}টি বিজ্ঞাপন।`,
    });
  });

  // User clicks "Send Inbox": Bot uploads/copies full video to demo video channel with protect_content & 90m auto-delete
  app.post("/api/ad-videos/send-inbox", async (req, res) => {
    const user = getRequestUser(req);
    const { videoId } = req.body;
    const userId = req.body.userId || user.id;

    const video = serverAdLockedVideos.find((v) => v.id === videoId);
    if (!video) {
      return res.status(404).json({ error: "ভিডিওটি পাওয়া যায়নি।" });
    }

    const sessionKey = `${userId}_${videoId}`;
    const session = userVideoSessions[sessionKey];

    if (!session || (session.adsWatched < video.requiredAds && !(telegramConfig as any).allowDevBypass)) {
      return res.status(400).json({ error: `প্রথমে প্রয়োজনীয় ${video.requiredAds}টি স্পন্সর বিজ্ঞাপন দেখা সম্পন্ন করতে হবে।` });
    }

    const now = Date.now();
    // If already uploaded and still active
    if (session.delivered && session.expiresAt && session.expiresAt > now && session.channelPostUrl) {
      return res.json({
        success: true,
        delivered: true,
        postUrl: session.channelPostUrl,
        expiresAt: session.expiresAt,
        remainingSeconds: Math.floor((session.expiresAt - now) / 1000),
        message: "ফুল ভিডিওটি ইতিমধ্যে চ্যানেলে আপলোড করা হয়েছে!",
      });
    }

    const botToken = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(400).json({ error: "⚠️ কোনো Telegram Bot Token সেট করা নেই। এডমিন প্যানেলে বট টোকেন সেভ করুন।" });
    }

    const botUsername = (telegramConfig.botUsername || "CholoIncomeKoriBot").replace("@", "");

    // Determine target chat:
    // If video.channelId is a bot (e.g. "@CholoIncomeKoriBot") or empty,
    // OR if user requested direct bot inbox delivery, send straight to the user's Telegram chat with @CholoIncomeKoriBot (userId)!
    const userTgId = (req.body.telegramUserId && /^\d+$/.test(String(req.body.telegramUserId)))
      ? String(req.body.telegramUserId)
      : (userId && /^\d+$/.test(String(userId)))
        ? String(userId)
        : (user?.id && /^\d+$/.test(String(user.id)))
          ? String(user.id)
          : null;

    const rawConfigChat = (video.channelId || "").trim();
    const isBotDestination =
      !rawConfigChat ||
      rawConfigChat.toLowerCase().includes("choloincomekori") ||
      rawConfigChat.toLowerCase().includes("bot") ||
      rawConfigChat === "@CholoIncomeKoriBot";

    let targetChat: string;
    let isDirectUser = false;

    if (isBotDestination && userTgId) {
      targetChat = userTgId;
      isDirectUser = true;
    } else if (rawConfigChat && (rawConfigChat.startsWith("@") || rawConfigChat.startsWith("-"))) {
      targetChat = formatTelegramChatTarget(rawConfigChat);
    } else if (userTgId) {
      targetChat = userTgId;
      isDirectUser = true;
    } else {
      targetChat = formatTelegramChatTarget(rawConfigChat || "@demovideos24");
    }

    const caption = `🎬 **${video.title}** (সম্পূর্ণ ফুল ভিডিও)\n\n⏱️ **এই ভিডিওটি আগামী ৯০ মিনিটের জন্য অ্যাক্টিভ থাকবে এবং ঠিক ৯০ মিনিট পর স্বয়ংক্রিয়ভাবে চিরতরে ডিলিট হয়ে যাবে!**\n\n🛡️ *ডাউনলোড ও ফরওয়ার্ডিং সম্পূর্ণ নিষিদ্ধ (Protected Content)*`;

    let uploadedMsgId: number | null = null;
    let tgErrorMsg = "";

    // 1. Try copyMessage if fullVideoUrl is a Telegram post (e.g. https://t.me/premiumvideounlocked/6)
    const tgMatch = video.fullVideoUrl?.match(/t\.me\/(?:c\/)?([^\/\?#]+)\/(\d+)/);

    if (tgMatch) {
      const rawChannel = tgMatch[1];
      const sourceMsgId = parseInt(tgMatch[2], 10);
      const fromChat = rawChannel.startsWith("-") || rawChannel.startsWith("@") ? rawChannel : "@" + rawChannel;

      try {
        console.log(`[SendInbox] Copying post #${sourceMsgId} from ${fromChat} to ${targetChat} with protect_content: true`);
        const copyRes = await fetch(`https://api.telegram.org/bot${botToken}/copyMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            chat_id: targetChat,
            from_chat_id: fromChat,
            message_id: sourceMsgId,
            caption,
            parse_mode: "Markdown",
            protect_content: true, // Telegram DRM: prevents save, download, and forward!
          }),
        });

        const copyData: any = await copyRes.json();
        if (copyData.ok && copyData.result?.message_id) {
          uploadedMsgId = copyData.result.message_id;
          console.log(`[SendInbox] copyMessage succeeded! Target: ${targetChat}, msgId: ${uploadedMsgId}`);
        } else {
          tgErrorMsg = copyData.description || "Copy message failed";
          console.warn("[SendInbox] copyMessage failed:", tgErrorMsg);
        }
      } catch (e: any) {
        tgErrorMsg = e.message;
        console.warn("[SendInbox] copyMessage error:", e.message);
      }
    }

    // 2. Direct Video Send fallback if not copied and is a direct video url
    if (!uploadedMsgId && video.fullVideoUrl && !video.fullVideoUrl.includes("drive.google") && !video.fullVideoUrl.includes("youtube")) {
      try {
        console.log(`[SendInbox] sendVideo to ${targetChat} with protect_content: true`);
        const vidRes = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            chat_id: targetChat,
            video: video.fullVideoUrl,
            caption,
            parse_mode: "Markdown",
            protect_content: true,
            supports_streaming: true,
          }),
        });
        const vidData: any = await vidRes.json();
        if (vidData.ok && vidData.result?.message_id) {
          uploadedMsgId = vidData.result.message_id;
        } else {
          tgErrorMsg = vidData.description || tgErrorMsg;
        }
      } catch (e: any) {
        console.warn("[SendInbox] sendVideo fallback error:", e.message);
      }
    }

    // 3. Protected Message fallback
    if (!uploadedMsgId) {
      try {
        const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            chat_id: targetChat,
            text: `${caption}\n\n🔗 ফুল ভিডিও লিংক: ${video.fullVideoUrl}`,
            parse_mode: "Markdown",
            protect_content: true,
          }),
        });
        const msgData: any = await msgRes.json();
        if (msgData.ok && msgData.result?.message_id) {
          uploadedMsgId = msgData.result.message_id;
        } else {
          tgErrorMsg = msgData.description || tgErrorMsg;
        }
      } catch (e: any) {
        console.warn("[SendInbox] sendMessage fallback error:", e.message);
      }
    }

    if (!uploadedMsgId) {
      return res.status(500).json({
        error: `ভিডিও পাঠাতে টেলিগ্রাম সার্ভার ত্রুটি: ${tgErrorMsg || "বটকে চ্যানেলে এডমিন করা আছে কিনা অথবা বটের সাথে চ্যাট স্টার্ট করা আছে কিনা যাচাই করুন।"}`,
      });
    }

    const expiryMs = (video.expiryMinutes || 90) * 60 * 1000;
    const deleteAt = now + expiryMs;
    const postUrl = isDirectUser
      ? `https://t.me/${botUsername}`
      : targetChat.startsWith("@")
        ? `https://t.me/${targetChat.replace("@", "")}/${uploadedMsgId}`
        : `https://t.me/demovideos24`;

    // Schedule 100% airtight auto-deletion in 90 minutes
    const schedItem: ScheduledVideoDeletion = {
      id: "del_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      chatId: targetChat,
      messageId: uploadedMsgId,
      deleteAt,
      scheduledAt: now,
      videoTitle: video.title,
      postUrl,
      botToken,
      status: 'pending',
    };
    scheduledDeletions.unshift(schedItem);
    saveJsonFile("scheduled_deletions.json", scheduledDeletions);
    if (githubSyncConfig.token) {
      pushFileToGitHubDirect(
        "data/scheduled_deletions.json",
        JSON.stringify(scheduledDeletions, null, 2),
        `Auto-schedule 90m deletion for video #${uploadedMsgId} in ${targetChat}`
      ).catch(() => {});
    }

    // Update Session
    session.unlocked = true;
    session.delivered = true;
    session.channelPostUrl = postUrl;
    session.unlockedAt = now;
    session.expiresAt = deleteAt;
    userVideoSessions[sessionKey] = session;
    saveJsonFile("user_video_sessions.json", userVideoSessions);

    // Increment count & save
    video.unlockedCount = (video.unlockedCount || 0) + 1;
    saveJsonFile("ad_videos.json", serverAdLockedVideos);

    return res.json({
      success: true,
      delivered: true,
      isDirectUser,
      postUrl,
      channelId: targetChat,
      messageId: uploadedMsgId,
      expiresAt: deleteAt,
      remainingSeconds: Math.floor(expiryMs / 1000),
      fullVideoUrl: video.fullVideoUrl,
      previewVideoUrl: video.previewVideoUrl,
      title: video.title,
      message: isDirectUser
        ? `🎉 অভিনন্দন! সম্পূর্ণ ফুল ভিডিওটি @${botUsername} বটের মাধ্যমে আপনার ইনবক্সে পাঠানো হয়েছে এবং ৯০ মিনিটের জন্য আনলক হয়েছে! ঠিক ৯০ মিনিট পর এটি স্বয়ংক্রিয়ভাবে ডিলিট হয়ে যাবে।`
        : `🎉 অভিনন্দন! সম্পূর্ণ ফুল ভিডিওটি সফলভাবে ${targetChat} চ্যানেলে আপলোড হয়েছে! আগামী ৯০ মিনিট পর এটি স্বয়ংক্রিয়ভাবে মুছে যাবে।`,
    });
  });

  // Increment video views
  app.post("/api/ad-videos/view", (req, res) => {
    const { videoId } = req.body;
    const vid = serverAdLockedVideos.find((v) => v.id === videoId);
    if (vid) {
      vid.views = (vid.views || 0) + 1;
    }
    res.json({ success: true });
  });

  // Verification endpoint for 90-minute auto-deletion
  app.all("/api/ad-videos/check-deletions", async (_req, res) => {
    await cleanupExpiredTelegramVideos();
    res.json({
      success: true,
      totalQueued: scheduledDeletions.length,
      pending: scheduledDeletions.filter((s) => s.status === 'pending').length,
      deleted: scheduledDeletions.filter((s) => s.status === 'deleted').length,
    });
  });

  // Admin: Post Demo Video to Channel with 'Watch Full Video' inline button
  app.post("/api/admin/ad-videos/post-demo-to-channel", async (req, res) => {
    const { videoId, channelId } = req.body;
    const vid = serverAdLockedVideos.find((v) => v.id === videoId);
    if (!vid) return res.status(404).json({ error: "Video not found" });

    const token = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(400).json({ error: "Telegram Bot Token কনফিগার করা নেই। অনুগ্রহ করে প্রথমে বট টোকেন সেভ করুন।" });
    }

    const targetChannel = channelId || vid.channelId || telegramConfig.channel1Handle;
    if (!targetChannel) {
      return res.status(400).json({ error: "টার্গেট টেলিগ্রাম চ্যানেল হ্যান্ডেল বা আইডি পাওয়া যায়নি।" });
    }

    const botUsername = (telegramConfig.botUsername || "CholoIncomeKoriBot").replace("@", "");
    const miniAppDeepLink = `https://t.me/${botUsername}/app?startapp=video_${vid.id}`;

    const caption = `🎥 **${vid.title}** (ফ্রি ডেমো ভিডিও)\n\n${vid.description}\n\n⏱️ ডেমো দৈর্ঘ্য: ${vid.previewDuration} | ফুল ভিডিও: ${vid.fullDuration}\n✨ ${vid.requiredAds}টি স্পন্সর বিজ্ঞাপন দেখলেই সম্পূর্ণ ফুল ভিডিওটি ৯০ মিনিটের জন্য আনলক হবে!\n\n👇 সম্পূর্ণ ভিডিও দেখতে নিচের বাটনে ক্লিক করুন:`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "🎬 সম্পূর্ণ ভিডিও দেখুন (আনলক করুন)",
            url: miniAppDeepLink,
          },
        ],
      ],
    };

    try {
      let tgRes;
      if (vid.previewVideoUrl && !vid.previewVideoUrl.includes('youtube') && !vid.previewVideoUrl.includes('drive.google')) {
        tgRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChannel,
            video: vid.previewVideoUrl,
            caption,
            parse_mode: "Markdown",
            reply_markup: inlineKeyboard,
          }),
        });
      }

      if (!tgRes || !tgRes.ok) {
        tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChannel,
            text: caption,
            parse_mode: "Markdown",
            reply_markup: inlineKeyboard,
          }),
        });
      }

      const data: any = await tgRes.json();
      if (data.ok) {
        const msgId = data.result?.message_id;
        const cleanCh = targetChannel.replace("@", "");
        const postUrl = targetChannel.startsWith("@") ? `https://t.me/${cleanCh}/${msgId}` : `https://t.me/${cleanCh}`;
        vid.demoChannelUrl = postUrl;
        vid.channelId = targetChannel;
        saveJsonFile("ad_videos.json", serverAdLockedVideos);

        return res.json({
          success: true,
          message: `✅ সফলভাবে '${targetChannel}'-এ ডেমো পোস্ট ও 'ফুল ভিডিও দেখুন' বাটন পাঠানো হয়েছে!`,
          postUrl,
          video: vid,
        });
      } else {
        return res.status(400).json({ error: `টেলিগ্রাম ত্রুটি: ${data.description || 'চ্যানেলে পোস্ট পাঠানো যায়নি'}` });
      }
    } catch (err: any) {
      return res.status(500).json({ error: `চ্যানেলে পোস্ট পাঠাতে ব্যর্থ: ${err.message}` });
    }
  });

  // Admin: Add Ad-Locked Video
  app.post("/api/admin/ad-videos/add", (req, res) => {
    const newVid = {
      id: "lock-vid-" + Date.now(),
      title: req.body.title || "Untitled Video",
      description: req.body.description || "",
      previewDuration: req.body.previewDuration || "02:00",
      fullDuration: req.body.fullDuration || "15:00",
      previewVideoUrl: req.body.previewVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      fullVideoUrl: req.body.fullVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail: req.body.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=70",
      requiredAds: Number(req.body.requiredAds) || 15,
      adTimerSeconds: Number(req.body.adTimerSeconds) || 15,
      adNetworkUrl: req.body.adNetworkUrl || "https://monetag.com",
      adNetworkName: req.body.adNetworkName || "Monetag Direct Link",
      expiryMinutes: Number(req.body.expiryMinutes) || 90,
      protectContent: req.body.protectContent ?? true,
      deliveryBotHandle: req.body.deliveryBotHandle || "CholoIncome_Delivery_Bot",
      demoChannelUrl: req.body.demoChannelUrl || "",
      channelId: req.body.channelId || telegramConfig.channel1Handle || "",
      views: 0,
      unlockedCount: 0,
    };
    serverAdLockedVideos.unshift(newVid);
    saveJsonFile("ad_videos.json", serverAdLockedVideos);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/ad_videos.json",
        JSON.stringify(serverAdLockedVideos, null, 2),
        `Admin: Add locked video "${newVid.title}"`
      ).catch(() => {});
    }

    res.json({ success: true, video: newVid, allVideos: serverAdLockedVideos });
  });

  // Admin: Update Ad-Locked Video
  app.post("/api/admin/ad-videos/update", (req, res) => {
    const { id, ...updates } = req.body;
    const idx = serverAdLockedVideos.findIndex((v) => v.id === id);
    if (idx === -1) return res.status(404).json({ error: "Video not found" });

    serverAdLockedVideos[idx] = { ...serverAdLockedVideos[idx], ...updates };
    saveJsonFile("ad_videos.json", serverAdLockedVideos);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/ad_videos.json",
        JSON.stringify(serverAdLockedVideos, null, 2),
        `Admin: Update locked video "${serverAdLockedVideos[idx].title}"`
      ).catch(() => {});
    }

    res.json({ success: true, video: serverAdLockedVideos[idx], allVideos: serverAdLockedVideos });
  });

  // Admin: Delete Ad-Locked Video
  app.post("/api/admin/ad-videos/delete", (req, res) => {
    const { id } = req.body;
    serverAdLockedVideos = serverAdLockedVideos.filter((v) => v.id !== id);
    saveJsonFile("ad_videos.json", serverAdLockedVideos);

    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/ad_videos.json",
        JSON.stringify(serverAdLockedVideos, null, 2),
        `Admin: Delete locked video (${serverAdLockedVideos.length} remaining)`
      ).catch(() => {});
    }

    res.json({ success: true, allVideos: serverAdLockedVideos });
  });

  // ==========================================
  // CHANNEL POST PUBLISHER APIS
  // ==========================================

  // Admin: Get published channel posts
  app.get("/api/admin/channel-publisher/posts", (_req, res) => {
    res.json({ success: true, posts: serverChannelPosts });
  });

  // Admin: Publish new post to Telegram channel with 3 inline buttons (supports both Photo & Video)
  app.post("/api/admin/channel-publisher/publish", async (req, res) => {
    const {
      targetChannel = "@demovideos24",
      mediaType = "image", // 'image' | 'video'
      thumbnail,
      videoUrl,
      videoBase64,
      videoFileName,
      title,
      description,
      demoUrl,
      fullVideoUrl,
      tutorialUrl,
      botToken: customToken,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "পোস্টের টাইটেল (Title) দেওয়া আবশ্যক।" });
    }

    const botToken = customToken || telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(400).json({ error: "⚠️ টেলিগ্রাম বট টোকেন কনফিগার করা নেই। এডমিন প্যানেলে বট টোকেন সেভ করুন।" });
    }

    const rawTarget = (targetChannel || "@demovideos24").trim();

    // Build 3 inline buttons as explicitly specified by the user:
    // Button 1: “👀 Watch Demo”
    // Button 2: “🚀 Watch Full Video (Watch Now)”
    // Button 3: “💡 How to watch videos? (Tutorial)”
    const buttons: any[] = [];
    const botUser = (telegramConfig.botUsername || "CholoIncomeKoriBot").replace("@", "");
    let cleanFullUrl = (fullVideoUrl && fullVideoUrl.trim()) ? fullVideoUrl.trim() : "";
    if (cleanFullUrl) {
      if (cleanFullUrl.startsWith("video_") || cleanFullUrl.startsWith("lock-vid-") || /^\d+$/.test(cleanFullUrl)) {
        cleanFullUrl = `https://t.me/${botUser}/app?startapp=${cleanFullUrl.startsWith("video_") ? cleanFullUrl : "video_" + cleanFullUrl}`;
      } else if (cleanFullUrl.includes("t.me/") && !cleanFullUrl.includes("/app")) {
        cleanFullUrl = cleanFullUrl.replace(/t\.me\/([^\/\?]+)(\?startapp=.*)/, 't.me/$1/app$2');
      }
    }
    const validFullUrl = cleanFullUrl || `https://t.me/${botUser}/app`;
    const validDemoUrl = (demoUrl && demoUrl.trim()) ? demoUrl.trim() : "https://t.me/demovideos24";
    const validTutUrl = (tutorialUrl && tutorialUrl.trim()) ? tutorialUrl.trim() : "https://t.me/CholoIncomeKori";

    buttons.push([{ text: "👀 Watch Demo", url: validDemoUrl }]);
    buttons.push([{ text: "🚀 Watch Full Video (Watch Now)", url: validFullUrl }]);
    buttons.push([{ text: "💡 How to watch videos? (Tutorial)", url: validTutUrl }]);

    const inlineKeyboard = { inline_keyboard: buttons };

    // Format HTML caption
    const cleanTitle = title.trim();
    const cleanDesc = (description || "").trim();
    let caption = `🎬 <b>${escapeTgHtml(cleanTitle)}</b>\n\n`;
    if (cleanDesc) {
      caption += `${escapeTgHtml(cleanDesc)}\n\n`;
    }
    caption += `━━━━━━━━━━━━━━━━━━━━\n👇 <b>ভিডিওটি দেখতে নিচের বাটনগুলো ব্যবহার করুন:</b>`;

    const isBotBroadcast =
      rawTarget.toLowerCase().includes("choloincomekoribot") ||
      rawTarget.toLowerCase() === "broadcast" ||
      rawTarget.toLowerCase() === "all_users" ||
      rawTarget.toLowerCase() === "bot_chat" ||
      rawTarget.toLowerCase() === "bot_users";

    const cleanVideoUrl = (videoUrl || "").trim();
    const cleanThumbnail = (thumbnail || "").trim();

    // If broadcasting directly to Bot Chat (all users who started @CholoIncomeKoriBot)
    if (isBotBroadcast) {
      const userIds = Object.keys(usersMap).filter((id) => /^\d+$/.test(id));
      console.log(`[BotBroadcast] Broadcasting post to ${userIds.length} registered bot users...`);

      let sentCount = 0;
      let lastMsgId: number | null = null;

      for (const uid of userIds) {
        try {
          let sendRes;
          if (mediaType === "video" && cleanVideoUrl) {
            sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: uid,
                video: cleanVideoUrl,
                caption,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard,
                supports_streaming: true,
              }),
            });
          } else if (cleanThumbnail) {
            sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: uid,
                photo: cleanThumbnail,
                caption,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard,
              }),
            });
          } else {
            sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: uid,
                text: caption,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard,
              }),
            });
          }
          const sendData: any = await sendRes.json();
          if (sendData.ok && sendData.result?.message_id) {
            sentCount++;
            lastMsgId = sendData.result.message_id;
          }
        } catch (uErr) {
          console.warn(`[BotBroadcast] Error sending to user ${uid}:`, uErr);
        }
      }

      const botUserPost = {
        id: "pub_" + Date.now(),
        targetChannel: "@CholoIncomeKoriBot (ইউজার চ্যাটবক্স)",
        title: cleanTitle,
        description: cleanDesc,
        mediaType: mediaType || (cleanVideoUrl ? "video" : "image"),
        thumbnail: cleanThumbnail,
        videoUrl: cleanVideoUrl,
        demoUrl: validDemoUrl,
        fullVideoUrl: validFullUrl,
        tutorialUrl: validTutUrl,
        messageId: lastMsgId || 0,
        postUrl: `https://t.me/CholoIncomeKoriBot`,
        publishedAt: new Date().toISOString(),
        status: "published",
        broadcastRecipients: sentCount,
      };

      serverChannelPosts.unshift(botUserPost);
      saveJsonFile("channel_posts.json", serverChannelPosts);

      return res.json({
        success: true,
        message: `🎉 পোস্টটি সফলভাবে @CholoIncomeKoriBot-এর ${sentCount} জন ব্যবহারকারীর চ্যাটবক্সে পাঠানো হয়েছে! ব্যবহারকারীরা বটের চ্যাটে "Open App" বাটনের ঠিক উপরে পোস্টটি দেখতে পারবেন।`,
        postUrl: `https://t.me/CholoIncomeKoriBot`,
        messageId: lastMsgId,
        post: botUserPost,
        allPosts: serverChannelPosts,
      });
    }

    const targetChat = formatTelegramChatTarget(rawTarget);

    let publishedMsgId: number | null = null;
    let tgErrorMsg = "";

    // 1a. If mediaType is 'video' and admin uploaded a video file directly (base64)
    if (mediaType === "video" && videoBase64) {
      try {
        const matches = videoBase64.match(/^data:([A-Za-z0-9\/+-]+);base64,(.+)$/);
        const buffer = matches ? Buffer.from(matches[2], "base64") : Buffer.from(videoBase64, "base64");
        const mime = matches ? matches[1] : "video/mp4";
        const form = new FormData();
        form.append("chat_id", targetChat);
        form.append("video", new Blob([buffer], { type: mime }), videoFileName || "video.mp4");
        form.append("caption", caption);
        form.append("parse_mode", "HTML");
        form.append("reply_markup", JSON.stringify(inlineKeyboard));
        form.append("supports_streaming", "true");

        console.log(`[ChannelPublisher] Uploading video file (${buffer.length} bytes) to ${targetChat}`);
        const vidRes = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
          method: "POST",
          body: form,
        });
        const vidData: any = await vidRes.json();
        if (vidData.ok && vidData.result?.message_id) {
          publishedMsgId = vidData.result.message_id;
        } else {
          tgErrorMsg = vidData.description || "Video file upload failed";
          console.warn("[ChannelPublisher] Upload sendVideo error:", tgErrorMsg);
        }
      } catch (err: any) {
        tgErrorMsg = err.message;
        console.warn("[ChannelPublisher] Upload sendVideo exception:", err.message);
      }
    }

    // 1b. If mediaType is 'video' and videoUrl provided: Send Video directly!
    if (!publishedMsgId && mediaType === "video" && cleanVideoUrl) {
      try {
        console.log(`[ChannelPublisher] Sending video to ${targetChat} with 3 inline buttons`);
        const vidRes = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            chat_id: targetChat,
            video: cleanVideoUrl,
            caption,
            parse_mode: "HTML",
            reply_markup: inlineKeyboard,
            supports_streaming: true,
          }),
        });
        const vidData: any = await vidRes.json();
        if (vidData.ok && vidData.result?.message_id) {
          publishedMsgId = vidData.result.message_id;
        } else {
          tgErrorMsg = vidData.description || "Video send failed";
          console.warn("[ChannelPublisher] sendVideo error:", tgErrorMsg);
        }
      } catch (err: any) {
        tgErrorMsg = err.message;
        console.warn("[ChannelPublisher] sendVideo exception:", err.message);
      }
    }

    // 2. Try sending Photo if media is image or video send failed
    if (!publishedMsgId && cleanThumbnail) {
      try {
        console.log(`[ChannelPublisher] Sending photo to ${targetChat} with 3 inline buttons`);
        const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            chat_id: targetChat,
            photo: cleanThumbnail,
            caption,
            parse_mode: "HTML",
            reply_markup: inlineKeyboard,
          }),
        });
        const photoData: any = await photoRes.json();
        if (photoData.ok && photoData.result?.message_id) {
          publishedMsgId = photoData.result.message_id;
        } else {
          tgErrorMsg = photoData.description || "Photo send failed";
          console.warn("[ChannelPublisher] sendPhoto error:", tgErrorMsg);
        }
      } catch (err: any) {
        tgErrorMsg = err.message;
        console.warn("[ChannelPublisher] sendPhoto exception:", err.message);
      }
    }

    // 3. Fallback to sendMessage if photo/video not provided or failed
    if (!publishedMsgId) {
      try {
        console.log(`[ChannelPublisher] Sending text message fallback to ${targetChat}`);
        const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            chat_id: targetChat,
            text: caption,
            parse_mode: "HTML",
            reply_markup: inlineKeyboard,
          }),
        });
        const msgData: any = await msgRes.json();
        if (msgData.ok && msgData.result?.message_id) {
          publishedMsgId = msgData.result.message_id;
        } else {
          tgErrorMsg = msgData.description || tgErrorMsg;
        }
      } catch (err: any) {
        tgErrorMsg = err.message;
      }
    }

    if (!publishedMsgId) {
      return res.status(500).json({
        error: `টেলিগ্রাম চ্যানেলে পোস্ট পাঠাতে ব্যর্থ: ${tgErrorMsg || "বটকে চ্যানেলে এডমিন করা আছে কিনা যাচাই করুন।"}`
      });
    }

    const cleanTarget = targetChat.replace("@", "");
    const postUrl = targetChat.startsWith("@")
      ? `https://t.me/${cleanTarget}/${publishedMsgId}`
      : `https://t.me/${cleanTarget}`;

    const newPost = {
      id: "pub_" + Date.now(),
      targetChannel: targetChat,
      title: cleanTitle,
      description: cleanDesc,
      mediaType: mediaType || (cleanVideoUrl ? "video" : "image"),
      thumbnail: cleanThumbnail,
      videoUrl: cleanVideoUrl,
      demoUrl: validDemoUrl,
      fullVideoUrl: validFullUrl,
      tutorialUrl: validTutUrl,
      messageId: publishedMsgId,
      postUrl,
      publishedAt: new Date().toISOString(),
      status: "published",
    };

    serverChannelPosts.unshift(newPost);
    saveJsonFile("channel_posts.json", serverChannelPosts);

    return res.json({
      success: true,
      message: `🎉 পোস্টটি সফলভাবে '${targetChat}' চ্যানেলে ৩টি বাটনসহ পাবলিশ করা হয়েছে!`,
      postUrl,
      messageId: publishedMsgId,
      post: newPost,
      allPosts: serverChannelPosts,
    });
  });

  // Admin: Delete published post from Telegram channel
  app.post("/api/admin/channel-publisher/delete-post", async (req, res) => {
    const { id } = req.body;
    const post = serverChannelPosts.find((p) => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "পোস্টটি পাওয়া যায়নি।" });
    }

    if (post.messageId && post.targetChannel) {
      const delRes = await executeTelegramDeleteMessage(post.targetChannel, post.messageId);
      if (!delRes.success && delRes.error && !delRes.error.includes("not found")) {
        console.warn("[ChannelPublisher] Failed to delete from channel:", delRes.error);
      }
    }

    post.status = "deleted";
    serverChannelPosts = serverChannelPosts.filter((p) => p.id !== id);
    saveJsonFile("channel_posts.json", serverChannelPosts);

    return res.json({ success: true, message: "পোস্টটি চ্যানেল ও তালিকা থেকে মুছে ফেলা হয়েছে।", allPosts: serverChannelPosts });
  });

  // Admin: Get Scheduled Deletions queue (90-Min Auto Delete Monitor)
  app.get("/api/admin/scheduled-deletions", (_req, res) => {
    const now = Date.now();
    const enriched = scheduledDeletions.map((item) => {
      const remainingSeconds = Math.max(0, Math.floor((item.deleteAt - now) / 1000));
      return {
        ...item,
        remainingSeconds,
        isExpired: item.deleteAt <= now,
      };
    });
    res.json({ success: true, queue: enriched });
  });

  // Admin: Immediate Delete Now for a scheduled video (instant testing & manual delete)
  app.post("/api/admin/scheduled-deletions/delete-now", async (req, res) => {
    const { id, messageId, chatId } = req.body;
    const item = scheduledDeletions.find((s) => s.id === id || (s.messageId === Number(messageId) && s.chatId === chatId));

    const targetChat = item ? item.chatId : chatId;
    const targetMsgId = item ? item.messageId : Number(messageId);

    if (!targetChat || !targetMsgId) {
      return res.status(400).json({ error: "Chat ID এবং Message ID দেওয়া আবশ্যক।" });
    }

    const delRes = await executeTelegramDeleteMessage(targetChat, targetMsgId, item?.botToken);
    if (delRes.success) {
      if (item) {
        item.status = "deleted";
        saveJsonFile("scheduled_deletions.json", scheduledDeletions);
      }
      return res.json({ success: true, message: `✅ মেসেজ #${targetMsgId} সফলভাবে '${targetChat}' চ্যানেল থেকে মুছে ফেলা হয়েছে!` });
    } else {
      return res.status(500).json({ error: `ডিলিট ব্যর্থ: ${delRes.error || "অজ্ঞাত ত্রুটি"}` });
    }
  });

  // ==========================================
  // DIGITAL PACKAGES & STORE ORDERS APIS
  // ==========================================

  // Public: Get available store packages
  app.get("/api/packages", (_req, res) => {
    // Hide secret downloadUrl from public catalog; only provided upon purchase approval!
    const catalog = serverPackages
      .filter((p) => p.isActive)
      .map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        features: p.features,
        priceBdt: p.priceBdt,
        priceUsd: p.priceUsd,
        thumbnail: p.thumbnail,
        hashtags: p.hashtags || [],
        fileSize: p.fileSize || "45 MB",
        version: p.version || "v1.0",
        requirements: p.requirements || "",
        previewUrl: p.previewUrl || "",
        salesCount: p.salesCount || 0,
        isActive: p.isActive,
      }));
    res.json(catalog);
  });

  // User: Submit Package Purchase with Payment TrxID
  app.post("/api/packages/purchase", (req, res) => {
    const user = getRequestUser(req);
    const { packageId, paymentMethod, senderAccount, transactionId, note } = req.body;
    const userId = req.body.userId || user.id;
    const userName = req.body.userName || user.displayName;
    const userUsername = req.body.userUsername || user.username;

    if (!packageId || !paymentMethod || !senderAccount || !transactionId) {
      return res.status(400).json({ error: "অনুগ্রহ করে প্রেরক নম্বর ও ট্রানজেকশন আইডি প্রদান করুন।" });
    }

    const pkg = serverPackages.find((p) => p.id === packageId);
    if (!pkg) {
      return res.status(404).json({ error: "প্যাকেজটি পাওয়া যায়নি।" });
    }

    // Check for duplicate pending transaction ID
    const cleanTrx = transactionId.trim().toUpperCase();
    const isDuplicate = serverOrders.some(
      (o) => o.transactionId.trim().toUpperCase() === cleanTrx && o.status !== "Rejected"
    );
    if (isDuplicate) {
      return res.status(400).json({
        error: "এই ট্রানজেকশন আইডি (TrxID) দিয়ে ইতিমধ্যে একটি অর্ডার সাবমিট করা হয়েছে!",
      });
    }

    const newOrder = {
      id: "ord_" + Date.now(),
      userId,
      userName,
      userUsername,
      packageId: pkg.id,
      packageTitle: pkg.title,
      packageCategory: pkg.category,
      amountBdt: pkg.priceBdt,
      amountUsd: pkg.priceUsd,
      paymentMethod,
      senderAccount: senderAccount.trim(),
      transactionId: cleanTrx,
      status: "Pending" as const,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", " + new Date().toLocaleDateString(),
    };

    serverOrders.unshift(newOrder);
    saveJsonFile("orders.json", serverOrders);

    res.json({
      success: true,
      order: newOrder,
      message: `🎉 আপনার অর্ডারটি সফলভাবে জমা হয়েছে! এডমিন পেমেন্ট ভেরিফাই করে ৫-১৫ মিনিটের মধ্যে সফটওয়্যার/ভিডিও ডাউনলোড লিংক আনলক করে দিবে।`,
    });
  });

  // User: Get customer's orders (with downloadUrl if approved)
  app.get("/api/user/orders/:userId", (req, res) => {
    const user = getRequestUser(req);
    const userId = req.params.userId || user.id;
    const userOrders = serverOrders.filter((o) => o.userId === userId);
    res.json(userOrders);
  });

  // Admin: Get all packages (including secret download URLs)
  app.get("/api/admin/packages", (_req, res) => {
    res.json(serverPackages);
  });

  // Admin: Add Package
  app.post("/api/admin/packages/add", (req, res) => {
    // Process hashtags: support comma-separated string or array
    let hashtags: string[] = [];
    if (Array.isArray(req.body.hashtags)) {
      hashtags = req.body.hashtags;
    } else if (typeof req.body.hashtags === 'string') {
      hashtags = req.body.hashtags
        .split(/[,\s]+/)
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0)
        .map((h: string) => (h.startsWith('#') ? h : `#${h}`));
    }

    const newPkg = {
      id: "pkg-" + Date.now(),
      title: req.body.title || "New Digital Package",
      category: req.body.category || "Software",
      description: req.body.description || "",
      features: Array.isArray(req.body.features)
        ? req.body.features
        : typeof req.body.features === 'string'
        ? req.body.features.split('\n').filter((f: string) => f.trim().length > 0)
        : ["প্রিমিয়াম ফিচার অন্তর্ভুক্ত"],
      priceBdt: Number(req.body.priceBdt) || 450,
      priceUsd: Number(req.body.priceUsd) || 3.75,
      thumbnail: req.body.thumbnail || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60",
      downloadUrl: req.body.downloadUrl || "https://drive.google.com",
      hashtags: hashtags.length > 0 ? hashtags : ['#Software', '#DigitalStore', '#VIP'],
      fileSize: req.body.fileSize || "45 MB",
      version: req.body.version || "v1.0",
      requirements: req.body.requirements || "কম্পিউটার বা মোবাইল সাপোর্টেড",
      previewUrl: req.body.previewUrl || "",
      isActive: true,
      salesCount: 0,
    };
    serverPackages.unshift(newPkg);
    saveJsonFile("packages.json", serverPackages);

    // Auto-commit to GitHub if configured
    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/packages.json",
        JSON.stringify(serverPackages, null, 2),
        `Admin: Add package "${newPkg.title}" (${serverPackages.length} packages)`
      ).catch(() => {});
    }

    res.json({ success: true, package: newPkg, allPackages: serverPackages });
  });

  // Admin: Update Package
  app.post("/api/admin/packages/update", (req, res) => {
    const { id, ...updates } = req.body;
    const idx = serverPackages.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Package not found" });

    // Format hashtags if updated
    if (updates.hashtags && typeof updates.hashtags === 'string') {
      updates.hashtags = updates.hashtags
        .split(/[,\s]+/)
        .map((h: string) => h.trim())
        .filter((h: string) => h.length > 0)
        .map((h: string) => (h.startsWith('#') ? h : `#${h}`));
    }
    if (updates.features && typeof updates.features === 'string') {
      updates.features = updates.features.split('\n').filter((f: string) => f.trim().length > 0);
    }

    serverPackages[idx] = { ...serverPackages[idx], ...updates };
    saveJsonFile("packages.json", serverPackages);

    // Auto-commit to GitHub if configured
    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/packages.json",
        JSON.stringify(serverPackages, null, 2),
        `Admin: Update package "${serverPackages[idx].title}"`
      ).catch(() => {});
    }

    res.json({ success: true, package: serverPackages[idx], allPackages: serverPackages });
  });

  // Admin: Delete Package
  app.post("/api/admin/packages/delete", async (req, res) => {
    const { id } = req.body;
    if (id && !deletedPackageIds.includes(id)) {
      deletedPackageIds.push(id);
      saveJsonFile("deleted_package_ids.json", deletedPackageIds);
    }
    serverPackages = serverPackages.filter((p) => p.id !== id);
    saveJsonFile("packages.json", serverPackages);

    let githubPushed = false;
    let githubMessage = "";

    // Auto-commit to GitHub if configured
    if (githubSyncConfig.token && githubSyncConfig.repo) {
      try {
        const ghRes = await pushFileToGitHubDirect(
          "data/packages.json",
          JSON.stringify(serverPackages, null, 2),
          `Admin: Delete package (${serverPackages.length} packages remaining)`
        );
        githubPushed = ghRes.success;
        githubMessage = ghRes.message;
        // Also push deleted_package_ids.json
        pushFileToGitHubDirect(
          "data/deleted_package_ids.json",
          JSON.stringify(deletedPackageIds, null, 2),
          `Admin: Update deleted package IDs list`
        ).catch(() => {});
      } catch (err: any) {
        githubMessage = err.message;
      }
    }

    res.json({ success: true, allPackages: serverPackages, githubPushed, githubMessage });
  });

  // Admin: Bulk Save / Update All Packages (Microsoft Word style exact save)
  app.post("/api/admin/packages/save-all", async (req, res) => {
    const incomingPackages = req.body.packages;
    if (!Array.isArray(incomingPackages)) {
      return res.status(400).json({ error: "Invalid packages array" });
    }

    // Identify deleted packages and record their IDs so they never return
    const incomingIds = new Set(incomingPackages.map((p) => p.id));
    for (const oldPkg of serverPackages) {
      if (!incomingIds.has(oldPkg.id) && !deletedPackageIds.includes(oldPkg.id)) {
        deletedPackageIds.push(oldPkg.id);
      }
    }
    saveJsonFile("deleted_package_ids.json", deletedPackageIds);

    serverPackages = incomingPackages;
    saveJsonFile("packages.json", serverPackages);

    let githubPushed = false;
    let githubMessage = "";

    if (githubSyncConfig.token && githubSyncConfig.repo) {
      try {
        const ghRes = await pushFileToGitHubDirect(
          "data/packages.json",
          JSON.stringify(serverPackages, null, 2),
          `Admin: Save & Update package catalog (${serverPackages.length} packages)`
        );
        githubPushed = ghRes.success;
        githubMessage = ghRes.message;
        pushFileToGitHubDirect(
          "data/deleted_package_ids.json",
          JSON.stringify(deletedPackageIds, null, 2),
          `Admin: Update deleted package IDs list`
        ).catch(() => {});
      } catch (err: any) {
        githubMessage = err.message;
      }
    }

    res.json({
      success: true,
      allPackages: serverPackages,
      githubPushed,
      githubMessage: githubPushed
        ? "✅ প্যাকেজ তালিকা সফলভাবে সেভ এবং GitHub-এ অটো-কমিট হয়েছে!"
        : githubMessage || "প্যাকেজ সংরক্ষিত",
    });
  });

  // Admin: Get all customer purchase orders
  app.get("/api/admin/orders", (_req, res) => {
    res.json(serverOrders);
  });

  // Admin: Approve or Reject Order
  app.post("/api/admin/orders/update-status", (req, res) => {
    const { orderId, status, rejectionReason } = req.body;
    const order = serverOrders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    if (status === "Approved") {
      const pkg = serverPackages.find((p) => p.id === order.packageId);
      if (pkg) {
        order.downloadUrl = pkg.downloadUrl;
        pkg.salesCount = (pkg.salesCount || 0) + 1;
        saveJsonFile("packages.json", serverPackages);
      }
      order.approvedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ", " + new Date().toLocaleDateString();
    } else if (status === "Rejected") {
      order.rejectionReason = rejectionReason || "Invalid Transaction ID or unpaid";
    }

    saveJsonFile("orders.json", serverOrders);
    res.json({ success: true, order, allOrders: serverOrders });
  });

  // Admin: Delete Order
  app.post("/api/admin/orders/delete", (req, res) => {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "Order ID required" });
    serverOrders = serverOrders.filter((o) => o.id !== orderId);
    saveJsonFile("orders.json", serverOrders);
    res.json({ success: true, allOrders: serverOrders });
  });

  // Payment Numbers Configuration (bKash, Nagad, Rocket, Binance)
  app.get("/api/payment-config", (_req, res) => {
    res.json(serverPaymentConfig);
  });

  app.post("/api/admin/payment-config", (req, res) => {
    serverPaymentConfig = {
      ...serverPaymentConfig,
      ...req.body,
    };
    saveJsonFile("payment_config.json", serverPaymentConfig);

    // Auto-commit to GitHub if configured
    if (githubSyncConfig.token && githubSyncConfig.repo && githubSyncConfig.autoSyncOnChange) {
      pushFileToGitHubDirect(
        "data/payment_config.json",
        JSON.stringify(serverPaymentConfig, null, 2),
        "Admin: Update payment numbers & bKash/Nagad config"
      ).catch(() => {});
    }

    res.json({ success: true, config: serverPaymentConfig });
  });

  // ==========================================
  // ADMIN DATABASE BACKUP, EXPORT & RESTORE APIS
  // ==========================================

  // Export full system snapshot as JSON
  app.get("/api/admin/backup/export", (_req, res) => {
    try {
      const backup = {
        success: true,
        version: "2.0",
        appName: "Cholo Income Kori",
        exportedAt: new Date().toISOString(),
        counts: {
          users: Object.keys(usersMap).length,
          packages: serverPackages.length,
          orders: serverOrders.length,
          withdrawals: withdrawals.length,
          videos: serverVideos.length,
          adVideos: serverAdLockedVideos.length,
          tasks: serverTasks.length,
        },
        data: {
          packages: serverPackages,
          users: usersMap,
          orders: serverOrders,
          withdrawals: withdrawals,
          videos: serverVideos,
          adVideos: serverAdLockedVideos,
          tasks: serverTasks,
          paymentConfig: serverPaymentConfig,
          incomeMethods: incomeMethodsConfig,
          telegramConfig: telegramConfig,
          notices: noticesConfig,
        },
      };

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="cholo_income_backup_${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.setHeader("Content-Type", "application/json");
      res.json(backup);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate backup: " + err.message });
    }
  });

  // Download individual raw JSON file from /data
  app.get("/api/admin/backup/file/:filename", (req, res) => {
    try {
      const allowedFiles = [
        "packages.json",
        "users.json",
        "orders.json",
        "withdrawals.json",
        "videos.json",
        "ad_videos.json",
        "tasks.json",
        "payment_config.json",
        "income_methods_config.json",
        "telegram_config.json",
        "notices.json",
      ];
      const filename = req.params.filename;
      if (!allowedFiles.includes(filename)) {
        return res.status(400).json({ error: "Invalid file requested" });
      }
      const filePath = path.join(DATA_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found on server" });
      }
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.sendFile(filePath);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Import / Restore backup JSON snapshot
  app.post("/api/admin/backup/import", (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid backup JSON format" });
      }

      const data = payload.data || payload;
      let restoredCount = 0;

      if (data.packages && Array.isArray(data.packages)) {
        serverPackages = data.packages;
        saveJsonFile("packages.json", serverPackages);
        restoredCount++;
      }

      if (data.users && typeof data.users === "object") {
        usersMap = data.users;
        saveJsonFile("users.json", usersMap);
        restoredCount++;
      }

      if (data.orders && Array.isArray(data.orders)) {
        serverOrders = data.orders;
        saveJsonFile("orders.json", serverOrders);
        restoredCount++;
      }

      if (data.withdrawals && Array.isArray(data.withdrawals)) {
        withdrawals = data.withdrawals;
        saveJsonFile("withdrawals.json", withdrawals);
        restoredCount++;
      }

      if (data.videos && Array.isArray(data.videos)) {
        serverVideos = data.videos;
        saveJsonFile("videos.json", serverVideos);
        restoredCount++;
      }

      if (data.adVideos && Array.isArray(data.adVideos)) {
        serverAdLockedVideos = data.adVideos;
        saveJsonFile("ad_videos.json", serverAdLockedVideos);
        restoredCount++;
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        serverTasks = data.tasks;
        saveJsonFile("tasks.json", serverTasks);
        restoredCount++;
      }

      if (data.paymentConfig && typeof data.paymentConfig === "object") {
        serverPaymentConfig = { ...serverPaymentConfig, ...data.paymentConfig };
        saveJsonFile("payment_config.json", serverPaymentConfig);
        restoredCount++;
      }

      if (data.incomeMethods && typeof data.incomeMethods === "object") {
        incomeMethodsConfig = { ...incomeMethodsConfig, ...data.incomeMethods };
        saveJsonFile("income_methods_config.json", incomeMethodsConfig);
        restoredCount++;
      }

      if (data.telegramConfig && typeof data.telegramConfig === "object") {
        telegramConfig = { ...telegramConfig, ...data.telegramConfig };
        saveJsonFile("telegram_config.json", telegramConfig);
        restoredCount++;
      }

      if (data.notices && typeof data.notices === "object") {
        noticesConfig = { ...noticesConfig, ...data.notices };
        saveJsonFile("notices.json", noticesConfig);
        restoredCount++;
      }

      res.json({
        success: true,
        message: `✅ সম্পূর্ণ ব্যাকআপ ডাটা সফলভাবে রিস্টোর হয়েছে! (${restoredCount}টি ডাটাবেজ মডিউল আপডেট করা হয়েছে)`,
        counts: {
          packages: serverPackages.length,
          users: Object.keys(usersMap).length,
          orders: serverOrders.length,
          withdrawals: withdrawals.length,
          videos: serverVideos.length,
          adVideos: serverAdLockedVideos.length,
        },
      });
    } catch (err: any) {
      console.error("[Backup Import Error]:", err);
      res.status(500).json({ error: "Failed to restore backup: " + err.message });
    }
  });

  // Auto-sync & Intelligent Merge endpoint:
  // Merges client-side vault data into live server without deleting existing packages or users.
  app.post("/api/admin/backup/auto-sync", async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "Invalid auto-sync payload" });
      }

      const data = payload.data || payload;
      let addedPackages = 0;
      let updatedUsers = 0;

      // 1. Packages: Merge by id and title without resurrecting deleted items
      if (Array.isArray(data.packages) && data.packages.length > 0) {
        for (const incomingPkg of data.packages) {
          if (!incomingPkg || !incomingPkg.id) continue;
          if (DEMO_PACKAGE_IDS.includes(incomingPkg.id)) continue; // NEVER resurrect demo packages!
          if (deletedPackageIds.includes(incomingPkg.id)) continue; // NEVER resurrect deleted packages!
          const existingIdx = serverPackages.findIndex(
            (p) => p.id === incomingPkg.id || (p.title && p.title.trim().toLowerCase() === incomingPkg.title?.trim().toLowerCase())
          );
          if (existingIdx === -1) {
            // Only add if server has 0 packages (e.g. initial disaster recovery)
            if (serverPackages.length === 0) {
              serverPackages.push(incomingPkg);
              addedPackages++;
            }
          } else {
            serverPackages[existingIdx] = {
              ...serverPackages[existingIdx],
              ...incomingPkg,
              salesCount: Math.max(serverPackages[existingIdx].salesCount || 0, incomingPkg.salesCount || 0),
            };
          }
        }
        saveJsonFile("packages.json", serverPackages);
      }

      // 2. Users: Merge into usersMap
      if (data.users && typeof data.users === "object") {
        for (const [uid, uObj] of Object.entries(data.users)) {
          if (!uObj || typeof uObj !== "object") continue;
          if (!usersMap[uid]) {
            usersMap[uid] = uObj;
            updatedUsers++;
          } else {
            const existing = usersMap[uid];
            usersMap[uid] = {
              ...existing,
              ...uObj,
              balanceBdt: Math.max(existing.balanceBdt || 0, (uObj as any).balanceBdt || 0),
              balanceUsd: Math.max(existing.balanceUsd || 0, (uObj as any).balanceUsd || 0),
            };
          }
        }
        saveJsonFile("users.json", usersMap);
      }

      // 3. Orders: Merge by id
      if (Array.isArray(data.orders) && data.orders.length > 0) {
        for (const o of data.orders) {
          if (!o || !o.id) continue;
          if (!serverOrders.some((existing) => existing.id === o.id)) {
            serverOrders.unshift(o);
          }
        }
        saveJsonFile("orders.json", serverOrders);
      }

      // 4. Payment Config: Merge numbers if provided
      if (data.paymentConfig && typeof data.paymentConfig === "object") {
        serverPaymentConfig = {
          ...serverPaymentConfig,
          ...data.paymentConfig,
        };
        saveJsonFile("payment_config.json", serverPaymentConfig);
      }

      // 5. Income methods, telegramConfig, notices
      if (data.incomeMethods && typeof data.incomeMethods === "object") {
        incomeMethodsConfig = { ...data.incomeMethods, ...incomeMethodsConfig };
        saveJsonFile("income_methods_config.json", incomeMethodsConfig);
      }
      if (data.telegramConfig && typeof data.telegramConfig === "object") {
        telegramConfig = { ...data.telegramConfig, ...telegramConfig };
        saveJsonFile("telegram_config.json", telegramConfig);
      }
      if (data.notices && typeof data.notices === "object") {
        noticesConfig = { ...data.notices, ...noticesConfig };
        saveJsonFile("notices.json", noticesConfig);
      }

      console.log(`[Auto-Sync] Merged successfully: +${addedPackages} packages, +${updatedUsers} users`);

      // If GitHub is configured, also push to GitHub
      let githubAutoPushed = false;
      if (githubSyncConfig.token && githubSyncConfig.repo && (githubSyncConfig.autoSyncOnChange !== false)) {
        try {
          const filesToPush = [
            { path: "data/packages.json", content: JSON.stringify(serverPackages, null, 2) },
            { path: "data/deleted_package_ids.json", content: JSON.stringify(deletedPackageIds, null, 2) },
            { path: "data/ad_videos.json", content: JSON.stringify(serverAdLockedVideos, null, 2) },
            { path: "data/tasks.json", content: JSON.stringify(serverTasks, null, 2) },
            { path: "data/payment_config.json", content: JSON.stringify(serverPaymentConfig, null, 2) },
            { path: "data/income_methods_config.json", content: JSON.stringify(incomeMethodsConfig, null, 2) },
            { path: "data/telegram_config.json", content: JSON.stringify(telegramConfig, null, 2) },
            { path: "data/notices.json", content: JSON.stringify(noticesConfig, null, 2) },
            { path: "data/users.json", content: JSON.stringify(usersMap, null, 2) },
          ];
          for (const f of filesToPush) {
            await pushFileToGitHubDirect(f.path, f.content, `Auto-Sync: Update ${f.path}`);
          }
          githubAutoPushed = true;
          githubSyncConfig.lastSyncedAt = new Date().toISOString();
          githubSyncConfig.lastStatus = `✅ অটো-সিঙ্কে সমস্ত ফাইল গিটহাবে পুশ সম্পন্ন`;
          saveJsonFile("github_sync_config.json", githubSyncConfig);
        } catch (ghPushErr) {
          console.warn("[Auto-Sync GitHub push warning]:", ghPushErr);
        }
      }

      res.json({
        success: true,
        message: githubAutoPushed
          ? "✅ অটো-সিঙ্ক ও GitHub অটো-কমিট সম্পন্ন! প্যাকেজ ও ইউজার ডাটা অক্ষত ও সংরক্ষিত হয়েছে।"
          : "✅ অটো-সিঙ্ক সম্পন্ন! প্যাকেজ ও ইউজার ডাটা অক্ষত রাখা হয়েছে।",
        githubAutoPushed,
        addedPackages,
        updatedUsers,
        counts: {
          packages: serverPackages.length,
          users: Object.keys(usersMap).length,
          orders: serverOrders.length,
        },
      });
    } catch (err: any) {
      console.error("[Auto-Sync Error]:", err);
      res.status(500).json({ error: "Auto-sync failed: " + err.message });
    }
  });

  // ==================== GITHUB AUTO-SYNC & AUTO-COMMIT ENDPOINTS ====================
  // 1. Get GitHub sync configuration
  app.get("/api/admin/github-sync/config", (_req, res) => {
    res.json({
      success: true,
      repo: githubSyncConfig.repo,
      branch: githubSyncConfig.branch || "main",
      hasToken: !!githubSyncConfig.token,
      maskedToken: githubSyncConfig.token
        ? githubSyncConfig.token.slice(0, 4) + "••••••••" + githubSyncConfig.token.slice(-4)
        : "",
      autoSyncOnChange: githubSyncConfig.autoSyncOnChange !== false,
      lastSyncedAt: githubSyncConfig.lastSyncedAt,
      lastStatus: githubSyncConfig.lastStatus,
    });
  });

  // 2. Save GitHub sync configuration
  app.post("/api/admin/github-sync/config", (req, res) => {
    try {
      const { repo, branch, token, autoSyncOnChange } = req.body;
      if (typeof repo === "string") {
        githubSyncConfig.repo = repo.replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "").trim();
      }
      if (typeof branch === "string" && branch.trim()) {
        githubSyncConfig.branch = branch.trim();
      }
      if (typeof token === "string" && token.trim()) {
        githubSyncConfig.token = token.trim();
      }
      if (typeof autoSyncOnChange === "boolean") {
        githubSyncConfig.autoSyncOnChange = autoSyncOnChange;
      }
      githubSyncConfig.lastStatus = "কনফিগারেশন সংরক্ষিত";
      saveJsonFile("github_sync_config.json", githubSyncConfig);

      res.json({
        success: true,
        message: "GitHub সিঙ্ক কনফিগারেশন সফলভাবে সেভ হয়েছে!",
        config: {
          repo: githubSyncConfig.repo,
          branch: githubSyncConfig.branch,
          hasToken: !!githubSyncConfig.token,
          autoSyncOnChange: githubSyncConfig.autoSyncOnChange,
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: "সেটিংস সেভ ব্যর্থ: " + e.message });
    }
  });

  // 3. Test GitHub connection
  app.post("/api/admin/github-sync/test", async (req, res) => {
    try {
      const repoToTest = (req.body.repo || githubSyncConfig.repo || "").replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "").trim();
      const tokenToTest = (req.body.token || githubSyncConfig.token || "").trim();

      if (!repoToTest) {
        return res.status(400).json({ error: "GitHub Repository নাম (যেমন: username/repo) দিন।" });
      }
      if (!tokenToTest) {
        return res.status(400).json({ error: "GitHub Personal Access Token দিন।" });
      }

      const resp = await fetch(`https://api.github.com/repos/${repoToTest}`, {
        headers: {
          Authorization: `Bearer ${tokenToTest}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CholoIncomeBot-AdminSync/1.0",
        },
      });
      const data: any = await resp.json().catch(() => ({}));

      if (resp.ok) {
        return res.json({
          success: true,
          message: `✅ GitHub কানেকশন সফল! রিপোজিটরি: ${data.full_name} (${data.private ? "Private" : "Public"})`,
          repoName: data.full_name,
          defaultBranch: data.default_branch,
          permissions: data.permissions,
        });
      } else {
        const errorDetail = data.message || resp.statusText;
        return res.status(resp.status).json({
          success: false,
          error: `❌ সংযোগ ব্যর্থ (${resp.status}): ${errorDetail}`,
        });
      }
    } catch (err: any) {
      return res.status(500).json({ error: "GitHub সার্ভারের সাথে সংযোগ করা যায়নি: " + err.message });
    }
  });

  // 4. Force push all data files directly to GitHub repository
  app.post("/api/admin/github-sync/push", async (_req, res) => {
    try {
      if (!githubSyncConfig.token || !githubSyncConfig.repo) {
        return res.status(400).json({
          error: "GitHub Repository এবং Access Token কনফিগার করা নেই। অনুগ্রহ করে প্রথমে সেটিংস সেভ করুন।",
        });
      }

      const filesToPush = [
        { path: "data/packages.json", content: JSON.stringify(serverPackages, null, 2), desc: `প্যাকেজ তালিকা (${serverPackages.length}টি)` },
        { path: "data/deleted_package_ids.json", content: JSON.stringify(deletedPackageIds, null, 2), desc: "মুছে ফেলা প্যাকেজ তালিকা" },
        { path: "data/ad_videos.json", content: JSON.stringify(serverAdLockedVideos, null, 2), desc: `লকড ভিডিও তালিকা (${serverAdLockedVideos.length}টি)` },
        { path: "data/tasks.json", content: JSON.stringify(serverTasks, null, 2), desc: `ইনকাম টাস্ক তালিকা (${serverTasks.length}টি)` },
        { path: "data/payment_config.json", content: JSON.stringify(serverPaymentConfig, null, 2), desc: "বিকাশ/নগদ পেমেন্ট নম্বর" },
        { path: "data/income_methods_config.json", content: JSON.stringify(incomeMethodsConfig, null, 2), desc: "ইনকাম মেথড ও রেট" },
        { path: "data/telegram_config.json", content: JSON.stringify(telegramConfig, null, 2), desc: "টেলিগ্রাম সেটিংস" },
        { path: "data/notices.json", content: JSON.stringify(noticesConfig, null, 2), desc: "নোটিশ কনফিগ" },
        { path: "data/users.json", content: JSON.stringify(usersMap, null, 2), desc: `ইউজার একাউন্ট (${Object.keys(usersMap).length}টি)` },
      ];

      const results = [];
      let successCount = 0;

      for (const f of filesToPush) {
        const result = await pushFileToGitHubDirect(
          f.path,
          f.content,
          `Admin Auto-Sync: Update ${f.path} [${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}]`
        );
        results.push({ file: f.path, desc: f.desc, success: result.success, message: result.message });
        if (result.success) successCount++;
      }

      githubSyncConfig.lastSyncedAt = new Date().toISOString();
      githubSyncConfig.lastStatus = `✅ ${successCount}/${filesToPush.length}টি ফাইল গিটহাবে অটো-কমিট সম্পন্ন`;
      saveJsonFile("github_sync_config.json", githubSyncConfig);

      res.json({
        success: successCount > 0,
        successCount,
        totalCount: filesToPush.length,
        message: successCount === filesToPush.length
          ? "🎉 দারুণ! আপনার সকল ডাটা ফাইল সরাসরি GitHub-এ অটো-কমিট হয়ে গেছে!"
          : `⚠️ ${successCount}/${filesToPush.length}টি ফাইল গিটহাবে পুশ হয়েছে।`,
        results,
      });
    } catch (err: any) {
      res.status(500).json({ error: "গিটহাব অটো-পুশ ব্যর্থ: " + err.message });
    }
  });

  // 5. Universal Master Save endpoint (Saves all modules and auto-commits to GitHub)
  app.post("/api/admin/master-save", async (_req, res) => {
    try {
      // Save all current memory state to disk first
      saveJsonFile("packages.json", serverPackages);
      saveJsonFile("deleted_package_ids.json", deletedPackageIds);
      saveJsonFile("tasks.json", serverTasks);
      saveJsonFile("deleted_task_ids.json", deletedTaskIds);
      saveJsonFile("videos.json", serverVideos);
      saveJsonFile("deleted_video_ids.json", deletedVideoIds);
      saveJsonFile("ad_videos.json", serverAdLockedVideos);
      saveJsonFile("income_methods_config.json", incomeMethodsConfig);
      saveJsonFile("telegram_config.json", telegramConfig);
      saveJsonFile("notices.json", noticesConfig);
      saveJsonFile("payment_config.json", serverPaymentConfig);
      saveJsonFile("users.json", usersMap);
      saveJsonFile("orders.json", serverOrders);
      saveJsonFile("withdrawals.json", withdrawals);

      // Push all to GitHub if configured
      const ghResult = await pushAllDataToGitHub();

      res.json({
        success: true,
        savedToDisk: true,
        githubSynced: ghResult.success,
        message: ghResult.message,
        pushedCount: ghResult.successCount,
        totalCount: ghResult.totalCount,
        results: ghResult.results,
        lastSyncedAt: githubSyncConfig.lastSyncedAt,
      });
    } catch (err: any) {
      console.error("[Master Save Error]:", err);
      res.status(500).json({ error: "মাস্টার সেভ ব্যর্থ: " + err.message });
    }
  });

  // 6. Universal Master Pull endpoint (Pulls all fresh data from GitHub and updates live server)
  app.post("/api/admin/master-pull", async (_req, res) => {
    try {
      const pullResult = await pullAllDataFromGitHub();
      res.json(pullResult);
    } catch (err: any) {
      console.error("[Master Pull Error]:", err);
      res.status(500).json({ error: "মাস্টার সিঙ্ক ব্যর্থ: " + err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Attempt startup hydration from GitHub after 3 seconds
    setTimeout(() => {
      hydrateServerFromGitHub().catch(() => {});
    }, 3000);

    // Anti-Sleep / 24/7 Keep-Alive Background Service for Render
    const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
    if (renderUrl) {
      console.log(`[Anti-Sleep] Initializing Keep-Alive pings to ${renderUrl} every 10 minutes`);
      setInterval(() => {
        try {
          fetch(`${renderUrl}/api/health`)
            .then((r) => r.json())
            .then(() => console.log(`[Anti-Sleep] Pinged ${renderUrl} successfully at ${new Date().toISOString()}`))
            .catch((err) => console.warn(`[Anti-Sleep] Ping warning:`, err.message));
        } catch (e: any) {
          console.warn(`[Anti-Sleep] Ping execution error:`, e.message);
        }
      }, 10 * 60 * 1000); // every 10 mins (before Render's 15 min sleep threshold)
    }
  });
}

startServer();
