export type Language = 'en' | 'bn' | 'hi' | 'ur';
export type Currency = 'USD' | 'BDT' | 'INR';

export interface ReferralCommissionLog {
  id: string;
  userFrom: string;
  activity: string;
  userEarnedUsd: number;
  commissionUsd: number;
  time: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl: string;
  role: string;
  balanceUsd: number;
  pendingReferralBonusUsd: number;
  joinedCount: number;
  activeCount: number;
  inactiveCount: number;
  todayReferrals: number;
  activeReferralsWithActivity: number; // Users who earned >= ৳10 activity
  adsWatchedToday: number;
  dailyAdLimit: number;
  referralCode: string;
  language: Language;
  currency: Currency;
  claimedDailyTiers: number[];
  completedTaskIds: string[];
  lastActiveDate?: string;
  referralCommissionRate?: number; // e.g. 5 for 5%
  totalCommissionEarnedUsd?: number;
  claimableCommissionUsd?: number;
  referralCommissionHistory?: ReferralCommissionLog[];
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  thumbnail: string;
  duration: string;
  rewardUsd: number;
  isDemo: boolean;
  videoUrl?: string;
  views: number;
}

export interface VisitJob {
  id: string;
  title: string;
  rewardUsd: number;
  durationSeconds: number;
  isHot: boolean;
  type: 'visit' | 'telegram';
  actionUrl?: string;
}

export interface SpecialJob {
  id: string;
  title: string;
  rewardUsd: number;
  icon: string;
  badge?: string;
  instructions: string;
}

export type IncomeMethodCategory = 'ads' | 'visit' | 'telegram' | 'mission' | 'special';

export interface IncomeTask {
  id: string;
  title: string;
  category: IncomeMethodCategory;
  subCategory?: string;
  destinationUrl: string;
  mediaType: 'image' | 'video' | 'file' | 'link' | 'none';
  mediaUrl?: string;
  rewardBdt: number;
  rewardUsd: number;
  timerSeconds: number;
  instructions: string;
  isHot?: boolean;
  isActive: boolean;
  createdAt: string;
  totalCompletions?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'bonus' | 'withdrawal' | 'task' | 'system';
  actionable?: boolean;
  claimAmount?: number; // In BDT
  claimed?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'PayTM (India)' | 'Binance Pay (Crypto)';
  accountNumber: string;
  amount: number;
  currency: Currency;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  createdAt: string;
}

export interface LivePayoutItem {
  id: string;
  userName: string;
  amount: string;
  method: string;
  timeAgo: string;
  status: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  badge?: string;
  avatar: string;
  bonus: string;
  statValue: string;
  statLabel: string;
  isCurrentUser?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'system' | 'payout' | 'bonus' | 'task';
}

export interface AdLockedVideo {
  id: string;
  title: string;
  description: string;
  previewDuration: string; // e.g. "02:00"
  fullDuration: string; // e.g. "18:45"
  previewVideoUrl: string;
  fullVideoUrl: string;
  thumbnail: string;
  requiredAds: number; // e.g. 15
  adTimerSeconds: number; // 15, 30, or 60
  adNetworkUrl: string;
  adNetworkName: string;
  expiryMinutes: number; // default 90
  protectContent: boolean; // Anti-download, anti-screen-record, watermark
  deliveryBotHandle?: string;
  demoChannelUrl?: string; // Telegram channel or post link where demo video is uploaded
  channelId?: string; // Target Telegram Channel username or chat ID for 90m full video auto-upload
  views: number;
  unlockedCount: number;
  adsWatched?: number;
  unlocked?: boolean;
  isUnlocked?: boolean;
  delivered?: boolean;
  channelPostUrl?: string;
  canSendInbox?: boolean;
  expiresAt?: number;
  remainingSeconds?: number;
  duration?: string;
}

export interface DigitalPackage {
  id: string;
  title: string;
  category: 'Software' | 'Video Course' | 'Bot Script' | 'Tools & Files';
  description: string;
  features: string[];
  priceBdt: number;
  priceUsd: number;
  thumbnail: string;
  downloadUrl: string; // Secret software/video link revealed upon approval
  previewUrl?: string;
  hashtags?: string[];
  fileSize?: string;
  version?: string;
  requirements?: string;
  isActive: boolean;
  salesCount: number;
}

export interface PackageOrder {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  packageId: string;
  packageTitle: string;
  packageCategory: string;
  amountBdt: number;
  amountUsd: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Binance Pay (USDT)';
  senderAccount: string;
  transactionId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  downloadUrl?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface PaymentNumbersConfig {
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant' | 'Agent';
  nagadNumber: string;
  nagadType: 'Personal' | 'Merchant';
  rocketNumber: string;
  binancePayId: string;
  binanceUsdtAddress: string;
  instructions: string;
}

export interface UnlockedVideoSession {
  videoId: string;
  userId: string;
  adsWatched: number;
  requiredAds: number;
  unlocked: boolean;
  unlockedAt?: number;
  expiresAt?: number; // timestamp in ms (90 min from unlockedAt)
}

export interface ChannelPublisherPost {
  id: string;
  targetChannel: string;
  title: string;
  description: string;
  thumbnail: string;
  demoUrl: string;
  fullVideoUrl: string;
  tutorialUrl: string;
  messageId?: number;
  postUrl?: string;
  publishedAt: string;
  status: 'published' | 'failed' | 'deleted';
}

export interface ScheduledDeletionItem {
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
}
