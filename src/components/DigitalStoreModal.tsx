import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShoppingBag,
  Package,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  CreditCard,
  Layers,
  ArrowRight,
  ArrowLeft,
  Eye,
  Tag,
  HardDrive,
  CheckCheck,
  Star,
  FileText,
  Lock,
  Shield,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DigitalPackage, PackageOrder, PaymentNumbersConfig, UserProfile } from '../types';
import { toLocalizedDigits } from '../utils/formatters';
import { INITIAL_DIGITAL_PACKAGES } from '../data';

interface DigitalStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onOrderSuccess?: (pkgTitle: string, amount: number) => void;
  onOrderStatusUpdate?: (order: PackageOrder, status: 'Approved' | 'Rejected') => void;
}

export const DigitalStoreModal: React.FC<DigitalStoreModalProps> = ({
  isOpen,
  onClose,
  user,
  onOrderSuccess,
  onOrderStatusUpdate,
}) => {
  const [activeView, setActiveView] = useState<'store' | 'my-orders'>('store');
  // Initialize with localStorage cache or INITIAL_DIGITAL_PACKAGES to eliminate any wait/blank delay when modal opens
  const [packages, setPackages] = useState<DigitalPackage[]>(() => {
    try {
      const cached = localStorage.getItem('earn_digital_packages');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((p: any) => p && !['pkg-1', 'pkg-2', 'pkg-3'].includes(p.id));
          if (clean.length > 0) return clean;
        }
      }
    } catch {}
    return INITIAL_DIGITAL_PACKAGES;
  });
  const [myOrders, setMyOrders] = useState<PackageOrder[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentNumbersConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedDetailPkg, setSelectedDetailPkg] = useState<DigitalPackage | null>(null);
  const [checkoutPkg, setCheckoutPkg] = useState<DigitalPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Binance Pay (USDT)'>('bKash');
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Scroll container reference to guarantee auto-scroll to top when switching views
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleOpenDetails = (pkg: DigitalPackage) => {
    setSelectedDetailPkg(pkg);
    setCheckoutPkg(null);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const handleOpenCheckout = (pkg: DigitalPackage) => {
    setCheckoutPkg(pkg);
    setSelectedDetailPkg(null);
    setOrderError(null);
    setOrderSuccessMsg(null);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const handleBackToCatalog = () => {
    setCheckoutPkg(null);
    setSelectedDetailPkg(null);
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [selectedDetailPkg, checkoutPkg, activeView]);

  // Fetch store data
  const fetchData = async () => {
    // Only show loading indicator if we don't have cached packages to prevent visual delay
    if (packages.length === 0) {
      setIsLoading(true);
    }
    try {
      const [pkgRes, ordRes, payRes] = await Promise.all([
        fetch('/api/packages'),
        fetch(`/api/user/orders/${user.id}`),
        fetch('/api/payment-config'),
      ]);
      const [pkgData, ordData, payData] = await Promise.all([
        pkgRes.json(),
        ordRes.json(),
        payRes.json(),
      ]);

      if (Array.isArray(pkgData)) {
        const clean = pkgData.filter((p: any) => p && !['pkg-1', 'pkg-2', 'pkg-3'].includes(p.id));
        setPackages(clean);
        try {
          localStorage.setItem('earn_digital_packages', JSON.stringify(clean));
        } catch {}
      }
      if (Array.isArray(ordData)) {
        setMyOrders(ordData);
        try {
          const statusKey = `order_prev_statuses_${user.id}`;
          const stored = localStorage.getItem(statusKey);
          const prevStatuses: Record<string, string> = stored ? JSON.parse(stored) : {};
          const nextStatuses: Record<string, string> = {};

          ordData.forEach((ord: PackageOrder) => {
            nextStatuses[ord.id] = ord.status;
            if (prevStatuses[ord.id] && prevStatuses[ord.id] !== ord.status) {
              if (ord.status === 'Approved' || ord.status === 'Rejected') {
                onOrderStatusUpdate?.(ord, ord.status);
              }
            }
          });
          localStorage.setItem(statusKey, JSON.stringify(nextStatuses));
        } catch {}
      }
      if (payData) setPaymentConfig(payData);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setOrderError(null);
      setOrderSuccessMsg(null);
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  const categories = ['All', 'Software', 'Video Course', 'Bot Script', 'Tools & Files'];

  const filteredPackages = packages.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Submit Purchase Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPkg) return;
    setOrderError(null);

    if (!senderAccount.trim() || !transactionId.trim()) {
      setOrderError('অনুগ্রহ করে প্রেরক নম্বর এবং ট্রানজেকশন আইডি (TrxID) দিন।');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await fetch('/api/packages/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.displayName,
          userUsername: user.username,
          packageId: checkoutPkg.id,
          paymentMethod,
          senderAccount: senderAccount.trim(),
          transactionId: transactionId.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setOrderError(data.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে।');
      } else {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setOrderSuccessMsg(data.message || 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!');
        if (onOrderSuccess && checkoutPkg) {
          onOrderSuccess(checkoutPkg.title, checkoutPkg.priceBdt);
        }
        setSenderAccount('');
        setTransactionId('');
        fetchData();
        setTimeout(() => {
          setCheckoutPkg(null);
          setOrderSuccessMsg(null);
          setActiveView('my-orders');
        }, 2200);
      }
    } catch {
      setOrderError('সার্ভারে সংযোগ বিচ্ছিন্ন। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Check if current user already owns or has an active order for this package
  const getPackageOrderStatus = (pkgId: string): PackageOrder | undefined => {
    return myOrders.find((o) => o.packageId === pkgId);
  };

  // Distinct sets for approved purchases vs pending/rejected
  const approvedPurchases = myOrders.filter((o) => o.status === 'Approved');
  const pendingOrRejectedOrders = myOrders.filter((o) => o.status !== 'Approved');

  return (
    <AnimatePresence>
      <div
        id="digital-store-modal-backdrop"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          id="digital-store-container"
          className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white relative select-none"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                  {checkoutPkg ? 'প্যাকেজ অর্ডার ও পেমেন্ট' : selectedDetailPkg ? 'প্যাকেজের পূর্ণাঙ্গ বিবরণ' : 'ডিজিটাল সফটওয়্যার ও কোর্স স্টোর'}
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-full border border-amber-400/40">
                    VIP
                  </span>
                </h3>
                <p className="text-[11px] text-purple-200">
                  {checkoutPkg ? 'পেমেন্ট সম্পন্ন করে নিচের ফর্মটি পূরণ করুন' : selectedDetailPkg ? 'প্যাকেজের সকল ফিচার ও ডেমো দেখে অর্ডার করুন' : 'অটোমেটিক স্ক্রিপ্ট, কোর্স ও সিক্রেট মেথড সরাসরি বট থেকে ক্রয় করুন'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Navigation Bar: Either Back Button or Catalog Tabs */}
          {activeView === 'store' && (checkoutPkg || selectedDetailPkg) ? (
            <div className="p-2.5 bg-slate-950 border-b border-amber-500/40 flex items-center gap-2 sticky top-0 z-30 shadow-lg">
              <button
                type="button"
                id="top-sticky-back-to-catalog-btn"
                onClick={handleBackToCatalog}
                className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer border-2 border-amber-300"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3] text-slate-950" />
                <span>← প্যাকেজ তালিকায় ফিরে যান (Back to Packages)</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveView('store');
                  handleBackToCatalog();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeView === 'store'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>প্যাকেজ ক্যাটালগ</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('my-orders');
                  handleBackToCatalog();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                  activeView === 'my-orders'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>আমার ক্রয়কৃত ফাইল</span>
                {approvedPurchases.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                    {approvedPurchases.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Content Area */}
          <div ref={contentRef} className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* View 1: Store Catalog */}
            {activeView === 'store' && !checkoutPkg && !selectedDetailPkg && (
              <>
                {/* Categories Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Packages Grid */}
                <div className="space-y-3">
                  {filteredPackages.map((pkg) => {
                    const existingOrder = getPackageOrderStatus(pkg.id);
                    const isApproved = existingOrder?.status === 'Approved';
                    const isPending = existingOrder?.status === 'Pending';

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => handleOpenDetails(pkg)}
                        className="bg-slate-800/90 border border-slate-700 hover:border-amber-400 hover:bg-slate-800 rounded-2xl p-4 transition-all duration-200 shadow-md space-y-3 relative group cursor-pointer"
                      >
                        {/* Header Area */}
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={pkg.thumbnail || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60'}
                              alt={pkg.title}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60';
                              }}
                              className="w-20 h-20 rounded-xl object-cover border border-slate-700 group-hover:border-purple-400 transition-colors"
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                              <Eye className="w-2.5 h-2.5 text-amber-400" />
                              ডিটেইল
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/50">
                                {pkg.category}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                {pkg.salesCount} বার কেনা হয়েছে
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-white mt-1.5 line-clamp-2 leading-snug group-hover:text-purple-200 transition-colors">
                              {pkg.title}
                            </h4>

                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-lg font-black text-amber-300">
                                ৳{pkg.priceBdt}
                              </span>
                              {pkg.originalPriceBdt && pkg.originalPriceBdt > pkg.priceBdt && (
                                <span className="text-xs line-through text-slate-400 font-bold">
                                  ৳{pkg.originalPriceBdt}
                                </span>
                              )}
                              {(pkg.discountBadge || (pkg.originalPriceBdt && pkg.originalPriceBdt > pkg.priceBdt)) && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs">
                                  {pkg.discountBadge || `${Math.round(((pkg.originalPriceBdt! - pkg.priceBdt) / pkg.originalPriceBdt!) * 100)}% ছাড় 🔥`}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-slate-400">
                                (${pkg.priceUsd.toFixed(2)} USD)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hashtags Row */}
                        {pkg.hashtags && pkg.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pkg.hashtags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] font-semibold text-purple-300/90 bg-purple-950/70 border border-purple-800/40 px-2 py-0.5 rounded-md"
                              >
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description Preview */}
                        <div>
                          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                            {pkg.description}
                          </p>
                        </div>

                        {/* Meta Highlights (File size / version) */}
                        {(pkg.fileSize || pkg.version) && (
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 px-1">
                            {pkg.fileSize && (
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3 text-purple-400" />
                                সাইজ: <strong className="text-slate-200 font-semibold">{pkg.fileSize}</strong>
                              </span>
                            )}
                            {pkg.version && (
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-400" />
                                ভার্সন: <strong className="text-slate-200 font-semibold">{pkg.version}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Features Checklist */}
                        <div className="space-y-1">
                          {pkg.features.slice(0, 3).map((feat, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-slate-300 flex items-center gap-1.5"
                            >
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                          {isApproved ? (
                            <div className="w-full flex items-center justify-between bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-2 px-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>আপনার কেনা সফল হয়েছে</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDetailPkg(pkg);
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-bold text-xs cursor-pointer"
                                >
                                  বিস্তারিত
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveView('my-orders');
                                  }}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  ডাউনলোড
                                </button>
                              </div>
                            </div>
                          ) : isPending ? (
                            <div className="w-full flex items-center justify-between bg-amber-950/80 border border-amber-500/60 rounded-xl p-2 px-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                                <span>এডমিন পেমেন্ট ভেরিফাই করছে</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDetailPkg(pkg);
                                  }}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-bold text-xs cursor-pointer"
                                >
                                  বিস্তারিত
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveView('my-orders');
                                  }}
                                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-extrabold text-xs cursor-pointer"
                                >
                                  অর্ডার দেখুন
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full flex items-center gap-2">
                              <button
                                type="button"
                                id={`view-details-${pkg.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(pkg);
                                }}
                                className="flex-1 py-2.5 px-3 bg-slate-700/90 hover:bg-slate-650 hover:text-white border border-slate-600/90 rounded-xl text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-sm"
                              >
                                <Eye className="w-4 h-4 text-amber-400" />
                                <span>বিস্তারিত দেখুন</span>
                              </button>

                              <button
                                type="button"
                                id={`buy-package-${pkg.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCheckout(pkg);
                                }}
                                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>এখনই কিনুন (৳{pkg.priceBdt})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* View 1.5: Detailed Package View (বিস্তারিত দেখুন) */}
            {activeView === 'store' && !checkoutPkg && selectedDetailPkg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Product Banner */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
                  <img
                    src={selectedDetailPkg.thumbnail || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60'}
                    alt={selectedDetailPkg.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60';
                    }}
                    className="w-full h-44 sm:h-52 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Floating Badges on Banner */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-600/90 text-white backdrop-blur-md shadow-md border border-purple-400/40">
                      {selectedDetailPkg.category}
                    </span>
                    {selectedDetailPkg.version && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-900/90 text-amber-300 backdrop-blur-md border border-amber-500/30">
                        {selectedDetailPkg.version}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-extrabold text-[11px] flex items-center gap-1 bg-black/70 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {selectedDetailPkg.salesCount} বার সফলভাবে কেনা হয়েছে
                    </span>
                    <span className="text-emerald-400 font-black text-sm bg-black/80 px-3 py-1 rounded-lg backdrop-blur-xs border border-emerald-500/40">
                      ৳{selectedDetailPkg.priceBdt} BDT
                    </span>
                  </div>
                </div>

                {/* Special Offer / Discount Banner if present */}
                {(selectedDetailPkg.discountBadge || (selectedDetailPkg.originalPriceBdt && selectedDetailPkg.originalPriceBdt > selectedDetailPkg.priceBdt)) && (
                  <div className="bg-gradient-to-r from-rose-950/60 via-amber-950/50 to-orange-950/60 border border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Sparkles className="w-5 h-5 text-amber-100" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-300">
                            {selectedDetailPkg.discountBadge || 'সীমিত সময়ের ধামাকা অফার!'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          আসল মূল্য ৳{selectedDetailPkg.originalPriceBdt || selectedDetailPkg.priceBdt * 2} এর বদলে মাত্র ৳{selectedDetailPkg.priceBdt} টাকা!
                        </p>
                      </div>
                    </div>
                    {selectedDetailPkg.originalPriceBdt && selectedDetailPkg.originalPriceBdt > selectedDetailPkg.priceBdt && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 block">সাশ্রয়</span>
                        <span className="text-xs font-black text-emerald-400">
                          ৳{selectedDetailPkg.originalPriceBdt - selectedDetailPkg.priceBdt} 💰
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Title and Category */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {selectedDetailPkg.title}
                  </h3>

                  {/* Hashtags */}
                  {selectedDetailPkg.hashtags && selectedDetailPkg.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedDetailPkg.hashtags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[11px] font-bold text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-amber-400" />
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Spec Highlights Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-700/40 flex items-center justify-center shrink-0">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ফাইল সাইজ</span>
                      <span className="font-bold text-white text-xs">{selectedDetailPkg.fileSize || '৪৫ মেগাবাইট'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-700/40 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ডিভাইস সাপোর্ট</span>
                      <span className="font-bold text-white text-xs">{selectedDetailPkg.requirements || 'মোবাইল ও কম্পিউটার'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700/40 flex items-center justify-center shrink-0">
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ডেলিভারি মাধ্যম</span>
                      <span className="font-bold text-emerald-300 text-xs">সিক্রেট ড্রাইভ লিঙ্ক</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-950/80 border border-blue-700/40 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">ইউজার রেটিং</span>
                      <span className="font-bold text-white text-xs">৪.৯ / ৫.০ (ভেরিফাইড)</span>
                    </div>
                  </div>
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    সম্পূর্ণ বিবরণ ও কার্যাবলী:
                  </h4>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed whitespace-pre-line text-xs font-normal">
                    {selectedDetailPkg.description || 'এই প্যাকেজটির মাধ্যমে সহজে অটোমেশন ও ইনকাম বৃদ্ধি করতে পারবেন। সম্পূর্ণ ফাইল ও ব্যবহার নির্দেশিকা অন্তর্ভুক্ত রয়েছে।'}
                  </div>
                </div>

                {/* Key Features List */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    ফিচার ও বিশেষ সুবিধাসমূহ:
                  </h4>
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                    {Array.isArray(selectedDetailPkg.features) && selectedDetailPkg.features.length > 0 ? (
                      selectedDetailPkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-200 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">কোনো অতিরিক্ত ফিচার তালিকাভুক্ত নেই</div>
                    )}
                  </div>
                </div>

                {/* What is included in package */}
                <div className="bg-gradient-to-br from-purple-950/50 to-indigo-950/50 border border-purple-500/30 p-3.5 rounded-2xl space-y-2">
                  <h4 className="font-black text-xs text-purple-200 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-purple-400" />
                    প্যাকেজে আপনি যা যা পাচ্ছেন:
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>সম্পূর্ণ সোর্স কোড / রেডি ফাইল / এইচডি ভিডিও লেকচার</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>ধাপে ধাপে ইনস্টলেশন ও সেটআপ বাংলা ভিডিও নির্দেশিকা</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>লাইফটাইম আনলিমিটেড ব্যবহার ও ফ্রি আপডেট</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>পেমেন্ট অনুমোদনের সাথে সাথে সরাসরি গুগল ড্রাইভ / মেগা ডাউনলোড লিংক</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>প্রাইভেট সাপোর্ট ও হেল্পডেস্ক অ্যাক্সেস</span>
                    </li>
                  </ul>
                </div>

                {/* Delivery Guarantee Card */}
                <div className="flex items-center gap-2.5 bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl text-emerald-200">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-[11px] leading-tight">
                    <strong className="block text-white font-bold">১০০% নিরাপদ ডেলিভারি নিশ্চয়তা:</strong>
                    পেমেন্ট করার পর ৫-১৫ মিনিটের মধ্যে এডমিন ভেরিফাই করে আপনার একাউন্টে ডাউনলোড বাটন চালু করে দিবে।
                  </div>
                </div>

                {/* Action Bar */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 sticky bottom-0 shadow-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">প্যাকেজের মূল্য:</span>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xl font-black text-amber-300">
                          ৳{selectedDetailPkg.priceBdt}
                        </span>
                        {selectedDetailPkg.originalPriceBdt && selectedDetailPkg.originalPriceBdt > selectedDetailPkg.priceBdt && (
                          <span className="text-xs line-through text-slate-400 font-bold">
                            ৳{selectedDetailPkg.originalPriceBdt}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-semibold">
                          (${selectedDetailPkg.priceUsd} USD)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(selectedDetailPkg)}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-950" />
                      <span>এখনই অর্ডার করুন (Buy Now)</span>
                    </button>
                  </div>

                  {/* Clean Bottom Back to Packages Button */}
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                    <span>← প্যাকেজ তালিকায় ফিরে যান</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* View 2: Package Checkout & Payment Form */}
            {activeView === 'store' && checkoutPkg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Selected Package Header */}
                <div className="bg-slate-800/80 border border-purple-500/40 rounded-2xl p-3.5 flex items-center gap-3">
                  <img
                    src={checkoutPkg.thumbnail || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60'}
                    alt={checkoutPkg.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60';
                    }}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-white line-clamp-1">
                      {checkoutPkg.title}
                    </h4>
                    <span className="text-xs font-black text-amber-300">
                      মূল্য: ৳{checkoutPkg.priceBdt} BDT / ${checkoutPkg.priceUsd} USD
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    পেমেন্ট মেথড নির্বাচন করুন:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['bKash', 'Nagad', 'Rocket', 'Binance Pay (USDT)'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Address & Copy Details */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {paymentMethod === 'Binance Pay (USDT)'
                        ? 'এডমিনের Binance Pay ID:'
                        : `এডমিনের ${paymentMethod} নম্বর:`}
                    </span>
                    <span className="font-mono font-black text-amber-300 text-sm">
                      {paymentMethod === 'bKash'
                        ? `${paymentConfig?.bkashNumber || '01789123456'} (${paymentConfig?.bkashType || 'Personal'})`
                        : paymentMethod === 'Nagad'
                        ? `${paymentConfig?.nagadNumber || '01812345678'} (${paymentConfig?.nagadType || 'Personal'})`
                        : paymentMethod === 'Rocket'
                        ? paymentConfig?.rocketNumber || '019123456789'
                        : paymentConfig?.binancePayId || '829104712'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const num =
                        paymentMethod === 'bKash'
                          ? paymentConfig?.bkashNumber || '01789123456'
                          : paymentMethod === 'Nagad'
                          ? paymentConfig?.nagadNumber || '01812345678'
                          : paymentMethod === 'Rocket'
                          ? paymentConfig?.rocketNumber || '019123456789'
                          : paymentConfig?.binancePayId || '829104712';
                      handleCopy(num, 'pay-num');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'pay-num' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">নম্বর কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>নম্বর কপি করুন (Copy Number)</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 <strong>নির্দেশনা:</strong> উপরের নম্বরে Send Money করে আপনার প্রেরক নম্বর এবং ট্রানজেকশন আইডি (TrxID) নিচে সাবমিট করুন। এডমিন ভেরিফাই করে ৫-১৫ মিনিটের মধ্যে ফাইল আনলক করে দিবে।
                  </p>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmitOrder} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      আপনার প্রেরক অ্যাকাউন্ট নম্বর / Binance ID:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: 017XXXXXXXX"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      ট্রানজেকশন আইডি (Transaction ID / TrxID):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: BK92841029"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 uppercase"
                    />
                  </div>

                  {orderError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {orderSuccessMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{orderSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    id="submit-package-order-btn"
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSubmittingOrder ? 'অর্ডার জমা হচ্ছে...' : 'পেমেন্ট তথ্য সাবমিট করুন'}
                    </span>
                  </button>

                  {/* PROMINENT BOTTOM CANCEL & BACK BUTTON */}
                  <button
                    type="button"
                    onClick={handleBackToCatalog}
                    className="w-full mt-2 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active:scale-98 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-amber-400" />
                    <span>← প্যাকেজ তালিকায় ফিরে যান</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* View 3: My Orders & Download Links */}
            {activeView === 'my-orders' && (
              <div className="space-y-4">
                {/* 1. Only Approved Purchases - Real Delivered Files */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>সফল ক্রয়কৃত ফাইল ও ভিডিও ({approvedPurchases.length})</span>
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                      সক্রিয় অ্যাক্সেস
                    </span>
                  </div>

                  {approvedPurchases.length === 0 ? (
                    <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-2">
                      <Package className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs font-bold text-slate-300">
                        আপনার কোনো অনুমোদিত সক্রিয় ফাইল নেই
                      </p>
                      <p className="text-[11px] text-slate-400">
                        প্যাকেজ অর্ডার সফল ও ভেরিফাই হলে ডাউনলোড লিংক সরাসরি এখানে প্রদর্শিত হবে।
                      </p>
                      <button
                        onClick={() => setActiveView('store')}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        প্যাকেজ ক্যাটালগ দেখুন
                      </button>
                    </div>
                  ) : (
                    approvedPurchases.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl border bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/40 border-emerald-500/60 shadow-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                                অনুমোদিত ও সক্রিয় ✅
                              </span>
                              <span className="text-[10px] text-slate-400">{order.approvedAt || order.createdAt}</span>
                            </div>
                            <h4 className="font-extrabold text-sm text-white">{order.packageTitle}</h4>
                            <span className="text-xs font-bold text-amber-300">
                              পরিশোধিত: ৳{order.amountBdt} | {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        {/* Payment Meta */}
                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>প্রেরক নম্বর: {order.senderAccount}</span>
                            <span className="font-mono text-amber-300 font-bold">
                              TrxID: {order.transactionId}
                            </span>
                          </div>
                        </div>

                        {/* Delivery Access Link */}
                        {order.downloadUrl && (
                          <div className="bg-emerald-950/90 border border-emerald-400/60 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <span>আপনার ফাইল/ভিডিও অ্যাক্সেস রেডি!</span>
                            </div>

                            <a
                              href={order.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                            >
                              <Download className="w-4 h-4" />
                              <span>ডাউনলোড বা প্রাইভেট ভিডিও ওপেন করুন</span>
                              <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 2. Pending and Rejected Order Status Tracker */}
                {pendingOrRejectedOrders.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-black text-slate-400 px-1">
                      অন্যান্য অর্ডারের স্ট্যাটাস ({pendingOrRejectedOrders.length})
                    </h4>

                    {pendingOrRejectedOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                          order.status === 'Pending'
                            ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                            : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              order.status === 'Pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {order.status === 'Pending' ? '⏱ ভেরিফিকেশন চলছে' : '⛔ বাতিল (Rejected) - কোনো ফাইল নেই'}
                          </span>
                          <span className="text-[10px] text-slate-400">{order.createdAt}</span>
                        </div>

                        <div>
                          <p className="font-bold text-white text-xs">{order.packageTitle}</p>
                          <p className="text-[11px] text-slate-300">
                            ৳{order.amountBdt} | TrxID: <span className="font-mono text-amber-300">{order.transactionId}</span>
                          </p>
                        </div>

                        {order.status === 'Rejected' && (
                          <div className="text-[11px] text-rose-300 bg-rose-950/80 p-2.5 rounded-xl border border-rose-500/40 leading-relaxed">
                            <strong className="text-rose-200">বাতিলের কারণ:</strong> {order.rejectionReason || 'ভুল বা অসত্য Transaction ID / পেমেন্ট ভেরিফাই হয়নি'}। (এই অর্ডারের জন্য কোনো ফাইল অ্যাক্সেস দেওয়া হয়নি)।
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
