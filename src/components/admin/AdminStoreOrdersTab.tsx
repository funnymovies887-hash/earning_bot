import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Edit3,
} from 'lucide-react';
import { DigitalPackage, PackageOrder, PaymentNumbersConfig } from '../../types';
import { AdminFloatingToast, AdminToastData } from './AdminFloatingToast';
import { AdminSaveButton } from './AdminSaveButton';
import { performAutoSync, updateVaultPackages } from '../../utils/adminAutoSync';

export const AdminStoreOrdersTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'orders' | 'packages' | 'payment-config'>('orders');
  const [orders, setOrders] = useState<PackageOrder[]>([]);
  const [packages, setPackages] = useState<DigitalPackage[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentNumbersConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [toast, setToast] = useState<AdminToastData | null>(null);

  // Dirty and Save feedback states
  const [isPaymentDirty, setIsPaymentDirty] = useState(false);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [isPaymentSaved, setIsPaymentSaved] = useState(false);
  const [isPkgSaving, setIsPkgSaving] = useState(false);
  const [isPkgSaved, setIsPkgSaved] = useState(false);

  // Add Package Modal states
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<DigitalPackage | null>(null);
  const [isEditPkgSaving, setIsEditPkgSaving] = useState(false);
  const [isEditPkgSaved, setIsEditPkgSaved] = useState(false);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgCategory, setPkgCategory] = useState<'Software' | 'Video Course' | 'Bot Script' | 'Tools & Files'>('Software');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgFeatures, setPkgFeatures] = useState('');
  const [pkgHashtags, setPkgHashtags] = useState('#Software, #EarnBot, #DirectLink, #Tools');
  const [pkgFileSize, setPkgFileSize] = useState('45 MB (.zip)');
  const [pkgVersion, setPkgVersion] = useState('v4.2 Pro');
  const [pkgRequirements, setPkgRequirements] = useState('মোবাইল ও কম্পিউটার সাপোর্টেড');
  const [pkgPriceBdt, setPkgPriceBdt] = useState(450);
  const [pkgPriceUsd, setPkgPriceUsd] = useState(3.75);
  const [pkgOriginalPriceBdt, setPkgOriginalPriceBdt] = useState<number | ''>('');
  const [pkgDiscountBadge, setPkgDiscountBadge] = useState('');
  const [pkgThumbnail, setPkgThumbnail] = useState('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60');
  const [pkgDownloadUrl, setPkgDownloadUrl] = useState('https://drive.google.com');

  // Reset New Package Form to clean pristine default state
  const resetNewPackageForm = () => {
    setPkgTitle('');
    setPkgCategory('Software');
    setPkgDescription('');
    setPkgFeatures('');
    setPkgHashtags('#Software, #EarnBot, #DirectLink, #Tools');
    setPkgFileSize('45 MB (.zip)');
    setPkgVersion('v4.2 Pro');
    setPkgRequirements('মোবাইল ও কম্পিউটার সাপোর্টেড');
    setPkgPriceBdt(450);
    setPkgPriceUsd(3.75);
    setPkgOriginalPriceBdt('');
    setPkgDiscountBadge('');
    setPkgThumbnail('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60');
    setPkgDownloadUrl('https://drive.google.com');
    setIsPkgSaved(false);
  };

  // Reject modal state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('ভুল ট্রানজেকশন আইডি বা পেমেন্ট পাওয়া যায়নি');

  // Payment config form state
  const [bkashNum, setBkashNum] = useState('');
  const [bkashType, setBkashType] = useState('Personal');
  const [nagadNum, setNagadNum] = useState('');
  const [nagadType, setNagadType] = useState('Personal');
  const [rocketNum, setRocketNum] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');

  // Fetch all store data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordRes, pkgRes, payRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/packages'),
        fetch('/api/payment-config'),
      ]);
      const [ordData, pkgData, payData] = await Promise.all([
        ordRes.json(),
        pkgRes.json(),
        payRes.json(),
      ]);

      if (Array.isArray(ordData)) setOrders(ordData);
      if (Array.isArray(pkgData)) setPackages(pkgData);
      if (payData) {
        setPaymentConfig(payData);
        setBkashNum(payData.bkashNumber || '01789123456');
        setBkashType(payData.bkashType || 'Personal');
        setNagadNum(payData.nagadNumber || '01812345678');
        setNagadType(payData.nagadType || 'Personal');
        setRocketNum(payData.rocketNumber || '019123456789');
        setBinanceId(payData.binancePayId || '829104712');
        setPaymentInstructions(payData.instructions || '');
      }
      // Auto sync current state to vault
      performAutoSync().catch(() => {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Approve Order
  const handleApproveOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'Approved' }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'success',
          title: 'অর্ডার অনুমোদিত!',
          message: 'পেমেন্ট সফলভাবে ভেরিফাই হয়েছে এবং ক্রেতার জন্য ডাউনলোড লিংক উন্মুক্ত হয়েছে।',
        });
        fetchAllData();
      }
    } catch {
      setToast({
        type: 'error',
        title: 'অনুমোদন ব্যর্থ',
        message: 'অর্ডার অনুমোদন করতে সমস্যা হয়েছে।',
      });
    }
  };

  // Reject Order
  const handleRejectOrder = async () => {
    if (!rejectingOrderId) return;
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: rejectingOrderId,
          status: 'Rejected',
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'delete',
          title: 'অর্ডার বাতিল',
          message: 'অর্ডারটি বাতিল হিসেবে চিহ্নিত করা হয়েছে।',
        });
        setRejectingOrderId(null);
        fetchAllData();
      }
    } catch {
      setToast({
        type: 'error',
        title: 'বাতিল ব্যর্থ',
        message: 'অর্ডার বাতিল করতে সমস্যা হয়েছে।',
      });
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই অর্ডার রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch('/api/admin/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          type: 'delete',
          title: 'অর্ডার মুছে ফেলা হয়েছে!',
          message: 'অর্ডার রেকর্ডটি সফলভাবে স্থায়ীভাবে ডিলিট করা হয়েছে।',
        });
        fetchAllData();
      }
    } catch {
      setToast({
        type: 'error',
        title: 'ডিলিট ব্যর্থ',
        message: 'অর্ডার ডিলিট করতে সমস্যা হয়েছে।',
      });
    }
  };

  // Create Package
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle.trim() || !pkgDownloadUrl.trim()) {
      setToast({
        type: 'error',
        title: 'অসম্পূর্ণ ফর্ম',
        message: 'অনুগ্রহ করে প্যাকেজের শিরোনাম ও ডাউনলোড লিংক প্রদান করুন।',
      });
      return;
    }

    setIsPkgSaving(true);
    try {
      const res = await fetch('/api/admin/packages/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pkgTitle.trim(),
          category: pkgCategory,
          description: pkgDescription.trim(),
          features: pkgFeatures.split('\n').filter((f) => f.trim().length > 0),
          hashtags: pkgHashtags.trim(),
          fileSize: pkgFileSize.trim(),
          version: pkgVersion.trim(),
          requirements: pkgRequirements.trim(),
          priceBdt: Number(pkgPriceBdt),
          priceUsd: Number(pkgPriceUsd),
          originalPriceBdt: pkgOriginalPriceBdt ? Number(pkgOriginalPriceBdt) : undefined,
          discountBadge: pkgDiscountBadge.trim(),
          thumbnail: pkgThumbnail.trim(),
          downloadUrl: pkgDownloadUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPkgSaved(true);
        setToast({
          type: 'success',
          title: 'প্যাকেজ সংরক্ষিত!',
          message: `"${pkgTitle.trim()}" প্যাকেজটি স্টোরে সফলভাবে যোগ করা হয়েছে।`,
        });
        fetchAllData();
        performAutoSync(true).catch(() => {});
        setTimeout(() => {
          resetNewPackageForm();
          setShowAddPackageModal(false);
        }, 1500);
      } else {
        setToast({
          type: 'error',
          title: 'প্যাকেজ যোগ ব্যর্থ',
          message: data.message || 'প্যাকেজ যোগ করতে সমস্যা হয়েছে',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।',
      });
    } finally {
      setIsPkgSaving(false);
    }
  };

  // Update Package
  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    if (!editingPackage.title.trim() || !editingPackage.downloadUrl.trim()) {
      setToast({
        type: 'error',
        title: 'অসম্পূর্ণ তথ্য',
        message: 'অনুগ্রহ করে প্যাকেজ শিরোনাম ও ডাউনলোড লিংক প্রদান করুন।',
      });
      return;
    }

    setIsEditPkgSaving(true);
    try {
      const res = await fetch('/api/admin/packages/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPackage.id,
          title: editingPackage.title.trim(),
          category: editingPackage.category,
          description: editingPackage.description.trim(),
          features: editingPackage.features,
          priceBdt: Number(editingPackage.priceBdt) || 450,
          priceUsd: Number(editingPackage.priceUsd) || 3.75,
          originalPriceBdt: editingPackage.originalPriceBdt ? Number(editingPackage.originalPriceBdt) : undefined,
          discountBadge: (editingPackage.discountBadge || '').trim(),
          thumbnail: editingPackage.thumbnail.trim(),
          downloadUrl: editingPackage.downloadUrl.trim(),
          hashtags: editingPackage.hashtags,
          fileSize: editingPackage.fileSize,
          version: editingPackage.version,
          requirements: editingPackage.requirements,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditPkgSaved(true);
        setToast({
          type: 'success',
          title: 'প্যাকেজ আপডেট হয়েছে!',
          message: `"${editingPackage.title}" সফলভাবে এডিট ও সেভ করা হয়েছে।`,
        });
        fetchAllData();
        setTimeout(() => {
          setIsEditPkgSaved(false);
          setEditingPackage(null);
        }, 1200);
      } else {
        setToast({
          type: 'error',
          title: 'আপডেট ব্যর্থ',
          message: data.error || 'প্যাকেজ আপডেট করা যায়নি।',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'প্যাকেজ আপডেট সম্পন্ন করা যায়নি।',
      });
    } finally {
      setIsEditPkgSaving(false);
    }
  };

  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  // Bulk Save / Update All Packages (Microsoft Word style exact save to DB and GitHub)
  const handleSaveAllPackages = async () => {
    setIsSavingCatalog(true);
    try {
      const res = await fetch('/api/admin/packages/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages }),
      });
      const data = await res.json();
      if (data.success) {
        updateVaultPackages(packages);
        setToast({
          type: 'success',
          title: 'প্যাকেজ তালিকা সংরক্ষিত!',
          message: data.githubPushed
            ? '🎉 মাইক্রোসফট ওয়ার্ডের মতো আপনার প্যাকেজগুলো সেভ ও সরাসরি GitHub-এ অটো-কমিট হয়েছে! ডিলিট করা কোনো প্যাকেজ আর আসবে না।'
            : '✅ প্যাকেজ তালিকা সফলভাবে সেভ হয়েছে! রিফ্রেশ করলেও ডিলিট করা কোনো প্যাকেজ আর ফিরে আসবে না।',
        });
      } else {
        setToast({
          type: 'error',
          title: 'সেভ ব্যর্থ',
          message: data.error || 'প্যাকেজ সেভ করা যায়নি।',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'প্যাকেজ সেভ করতে ব্যর্থ: ' + err.message,
      });
    } finally {
      setIsSavingCatalog(false);
    }
  };

  // Delete Package
  const handleDeletePackage = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই প্যাকেজটি ডিলিট করতে চান?')) return;
    try {
      const res = await fetch('/api/admin/packages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        const remaining = packages.filter((p) => p.id !== id);
        setPackages(remaining);
        updateVaultPackages(remaining);
        setToast({
          type: 'delete',
          title: 'প্যাকেজ ডিলিট সম্পন্ন!',
          message: data.githubPushed
            ? 'প্যাকেজটি সফলভাবে মুছে ফেলা হয়েছে এবং সরাসরি GitHub-এ অটো-কমিট হয়েছে!'
            : 'প্যাকেজটি মুছে ফেলা হয়েছে। রিফ্রেশ করলেও এটি আর কখনোই ফিরে আসবে না।',
        });
      } else {
        setToast({
          type: 'error',
          title: 'ডিলিট ব্যর্থ',
          message: 'প্যাকেজটি ডিলিট করা যায়নি।',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক ত্রুটি',
        message: 'ডিলিট সম্পন্ন করা যায়নি।',
      });
    }
  };

  // Save Payment Config
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaymentSaving(true);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bkashNumber: bkashNum.trim(),
          bkashType,
          nagadNumber: nagadNum.trim(),
          nagadType,
          rocketNumber: rocketNum.trim(),
          binancePayId: binanceId.trim(),
          instructions: paymentInstructions.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaymentDirty(false);
        setIsPaymentSaved(true);
        setToast({
          type: 'success',
          title: 'পেমেন্ট নম্বর সংরক্ষিত!',
          message: 'বিকাশ, নগদ, রকেট ও বাইন্যান্স পেমেন্ট সেটিংস সফলভাবে সেভ হয়েছে।',
        });
        setTimeout(() => setIsPaymentSaved(false), 3500);
      } else {
        setToast({
          type: 'error',
          title: 'সেভ ব্যর্থ',
          message: 'পেমেন্ট নম্বর সেভ করা যায়নি।',
        });
      }
    } catch {
      setToast({
        type: 'error',
        title: 'নেটওয়ার্ক সংযোগ ত্রুটি',
        message: 'পেমেন্ট সেটিংস সেভ করতে ব্যর্থ হয়েছে।',
      });
    } finally {
      setIsPaymentSaving(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'All' && o.status !== orderFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      return (
        o.userName.toLowerCase().includes(s) ||
        o.senderAccount.includes(s) ||
        o.transactionId.toLowerCase().includes(s) ||
        o.packageTitle.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;

  return (
    <div className="space-y-6 relative">
      {/* Floating Toast Notification */}
      <AdminFloatingToast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                ডিজিটাল স্টোর ও ম্যানুয়াল পেমেন্ট অনুমোদন
                {pendingCount > 0 && (
                  <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full animate-bounce">
                    {pendingCount}টি নতুন অর্ডার পেন্ডিং
                  </span>
                )}
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                বিকাশ/নগদ/রকেটে পেমেন্ট যাচাই করে সফটওয়্যার ও কোর্সের ডাউনলোড লিংক সরবরাহ করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>

            {subTab === 'packages' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="admin-packages-save-all-btn"
                  onClick={handleSaveAllPackages}
                  disabled={isSavingCatalog}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  title="প্যাকেজ ক্যাটালগ সেভ করুন ও সরাসরি GitHub-এ কমিট করুন"
                >
                  <Check className={`w-4 h-4 ${isSavingCatalog ? 'animate-spin' : ''}`} />
                  <span>{isSavingCatalog ? 'GitHub-এ সেভ হচ্ছে...' : '💾 ১-ক্লিকে প্যাকেজ আপডেট ও GitHub-এ সেভ'}</span>
                </button>
                <button
                  onClick={() => {
                    resetNewPackageForm();
                    setShowAddPackageModal(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন প্যাকেজ তৈরি করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>কাস্টমার অর্ডার ({orders.length})</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('packages')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'packages'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>প্যাকেজ ক্যাটালগ ({packages.length})</span>
          </button>

          <button
            onClick={() => setSubTab('payment-config')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'payment-config'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>পেমেন্ট নম্বর সেটিংস</span>
          </button>
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

      {/* SubTab 1: Customer Orders */}
      {subTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    orderFilter === status
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {status === 'All'
                    ? `সব (${orders.length})`
                    : status === 'Pending'
                    ? `পেন্ডিং (${orders.filter((o) => o.status === 'Pending').length})`
                    : status === 'Approved'
                    ? `অনুমোদিত (${orders.filter((o) => o.status === 'Approved').length})`
                    : `বাতিল (${orders.filter((o) => o.status === 'Rejected').length})`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="TrxID, নম্বর বা নাম দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Orders Cards */}
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
              কোন অর্ডার খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    order.status === 'Pending'
                      ? 'bg-slate-900 border-amber-500/60 shadow-lg'
                      : order.status === 'Approved'
                      ? 'bg-slate-900/90 border-emerald-500/40'
                      : 'bg-slate-900/60 border-rose-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          order.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : order.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {order.status === 'Pending'
                          ? 'পেন্ডিং ভেরিফিকেশন'
                          : order.status === 'Approved'
                          ? 'অনুমোদিত ও ডেলিভার্ড'
                          : 'বাতিল'}
                      </span>
                      <span className="text-xs font-bold text-white">অর্ডার ID: {order.id}</span>
                      <span className="text-[11px] text-slate-400">• {order.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-amber-300">
                        ৳{order.amountBdt} BDT (${order.amountUsd} USD)
                      </span>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-400 hover:text-white transition-all cursor-pointer"
                        title="অর্ডার রেকর্ড ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer and Payment Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] block font-bold">ক্রেতার তথ্য:</span>
                      <p className="font-extrabold text-white">{order.userName}</p>
                      <p className="text-purple-300 text-[11px]">@{order.userUsername}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {order.userId}</p>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] block font-bold">প্যাকেজ:</span>
                      <p className="font-bold text-white line-clamp-1">{order.packageTitle}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                        {order.packageCategory}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] block font-bold">পেমেন্ট মেথড ও TrxID:</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400">{order.paymentMethod}</span>
                        <span className="text-slate-300">{order.senderAccount}</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 mt-1">
                        <span className="font-mono font-bold text-amber-300">{order.transactionId}</span>
                        <button
                          onClick={() => handleCopy(order.transactionId, order.id)}
                          className="text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === order.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Pending Orders */}
                  {order.status === 'Pending' && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setRejectingOrderId(order.id)}
                        className="px-4 py-2 bg-slate-800 hover:bg-rose-950 text-rose-400 hover:text-rose-200 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>বাতিল করুন</span>
                      </button>

                      <button
                        id={`approve-order-${order.id}`}
                        onClick={() => handleApproveOrder(order.id)}
                        className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>অনুমোদন ও ডাউনলোড লিংক আনলক করুন</span>
                      </button>
                    </div>
                  )}

                  {/* Download Link if Approved */}
                  {order.status === 'Approved' && order.downloadUrl && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ডেলিভারি সম্পন্ন হয়েছে ({order.approvedAt || 'Active'})
                      </span>
                      <a
                        href={order.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:underline flex items-center gap-1 font-bold text-[11px]"
                      >
                        <span>ডাউনলোড লিংক দেখুন</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Rejection Note */}
                  {order.status === 'Rejected' && order.rejectionReason && (
                    <div className="text-xs text-rose-400 pt-1">
                      বাতিলের কারণ: {order.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Package Catalog */}
      {subTab === 'packages' && (
        <div className="space-y-4">
          {/* MS Word style permanent save & delete info banner */}
          <div className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                  <span>মাইক্রোসফট ওয়ার্ডের মতো সেভ ও আপডেট সিস্টেম (জিরো ডাটা লস)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    GitHub Auto-Commit
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  প্যাকেজ ডিলিট বা পরিবর্তন করার পর <strong className="text-emerald-300">"১-ক্লিকে প্যাকেজ আপডেট ও GitHub-এ সেভ"</strong> বাটনে চাপ দিলে তা সরাসরি আপনার সার্ভার এবং GitHub রিপোজিটরিতে সেভ হয়ে যাবে। ব্রাউজার রিফ্রেশ বা সার্ভার রিস্টার্টের পরেও ডিলিট করা কোনো প্যাকেজ আর ফিরে আসবে না!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveAllPackages}
              disabled={isSavingCatalog}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 justify-center"
            >
              <Check className={`w-3.5 h-3.5 ${isSavingCatalog ? 'animate-spin' : ''}`} />
              <span>{isSavingCatalog ? 'সেভ হচ্ছে...' : 'এখনই সেভ ও আপডেট করুন'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={pkg.thumbnail || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60'}
                    alt={pkg.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60';
                    }}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 uppercase">
                        {pkg.category}
                      </span>
                      <span className="text-xs font-bold text-amber-300">
                        ৳{pkg.priceBdt} / ${pkg.priceUsd}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mt-1 line-clamp-1">{pkg.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{pkg.description}</p>
                  </div>
                </div>

                {/* Secret Download Link Display */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <span className="text-slate-500 text-[10px] font-bold block">সিক্রেট ফাইল / ড্রাইভ লিংক (অনুমোদনের পর পায়):</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-emerald-400 truncate max-w-[260px]">{pkg.downloadUrl}</span>
                    <a
                      href={pkg.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:underline flex items-center gap-1 font-bold shrink-0 ml-2"
                    >
                      <span>পরীক্ষা</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">মোট বিক্রয়: {pkg.salesCount || 0} বার</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPackage({ ...pkg })}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="প্যাকেজ এডিট করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
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
        </div>
      )}

      {/* SubTab 3: Payment Configuration Settings */}
      {subTab === 'payment-config' && (
        <form onSubmit={handleSavePaymentConfig} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 max-w-xl">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            এডমিনের পেমেন্ট নম্বর সেটিংস
          </h3>
          <p className="text-xs text-slate-400">
            ক্রেতারা যখন স্টোর থেকে কোনো সফটওয়্যার বা ভিডিও কোর্স কিনতে যাবে, তাদের সামনে এই নম্বরগুলো স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">বিকাশ (bKash) নম্বর:</label>
              <input
                type="text"
                required
                value={bkashNum}
                onChange={(e) => {
                  setBkashNum(e.target.value);
                  setIsPaymentDirty(true);
                }}
                placeholder="017XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">টাইপ:</label>
              <select
                value={bkashType}
                onChange={(e) => {
                  setBkashType(e.target.value);
                  setIsPaymentDirty(true);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="Personal">Personal</option>
                <option value="Agent">Agent</option>
                <option value="Merchant">Merchant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">নগদ (Nagad) নম্বর:</label>
              <input
                type="text"
                required
                value={nagadNum}
                onChange={(e) => {
                  setNagadNum(e.target.value);
                  setIsPaymentDirty(true);
                }}
                placeholder="018XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">টাইপ:</label>
              <select
                value={nagadType}
                onChange={(e) => {
                  setNagadType(e.target.value);
                  setIsPaymentDirty(true);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="Personal">Personal</option>
                <option value="Merchant">Merchant</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">রকেট (Rocket) নম্বর:</label>
            <input
              type="text"
              value={rocketNum}
              onChange={(e) => {
                setRocketNum(e.target.value);
                setIsPaymentDirty(true);
              }}
              placeholder="019XXXXXXXXX"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Binance Pay ID / USDT Address:</label>
            <input
              type="text"
              value={binanceId}
              onChange={(e) => {
                setBinanceId(e.target.value);
                setIsPaymentDirty(true);
              }}
              placeholder="829104712 বা USDT TRC20 Address"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">ক্রেতার জন্য বিশেষ নির্দেশনা (Instructions):</label>
            <textarea
              rows={2}
              value={paymentInstructions}
              onChange={(e) => {
                setPaymentInstructions(e.target.value);
                setIsPaymentDirty(true);
              }}
              placeholder="যেমন: Send Money করার পর সঠিক TrxID সাবমিট করুন..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <AdminSaveButton
              id="admin-save-payment-config-btn"
              isDirty={isPaymentDirty}
              isSaving={isPaymentSaving}
              isSaved={isPaymentSaved}
              defaultText="পেমেন্ট সেটিংস সেভ করুন (Save Payment Numbers)"
              savingText="পেমেন্ট নম্বর সংরক্ষণ হচ্ছে..."
              savedText="পেমেন্ট সেটিংস সফলভাবে সেভ হয়েছে! ✓"
              type="submit"
              className="w-full"
            />
          </div>
        </form>
      )}

      {/* Reject Order Modal */}
      {rejectingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-sm w-full p-5 space-y-3 text-white">
            <h4 className="font-extrabold text-sm text-rose-300">অর্ডার বাতিল নিশ্চিত করুন</h4>
            <p className="text-xs text-slate-400">ক্রেতাকে বাতিলের কারণ জানাতে নিচের কারণটি নির্বাচন বা লিখুন:</p>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrderId(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 font-bold"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleRejectOrder}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs text-white font-bold"
              >
                বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-white shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                নতুন ডিজিটাল প্যাকেজ যোগ করুন
              </h3>
              <button
                onClick={() => {
                  resetNewPackageForm();
                  setShowAddPackageModal(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">প্যাকেজ শিরোনাম (Title):</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: টেলিগ্রাম অটো পোস্টিং ও বাল্ক মেসেজিং সফটওয়্যার"
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">ক্যাটাগরি:</label>
                  <select
                    value={pkgCategory}
                    onChange={(e: any) => setPkgCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Software">Software</option>
                    <option value="Video Course">Video Course</option>
                    <option value="Bot Script">Bot Script</option>
                    <option value="Tools & Files">Tools & Files</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">মূল্য (টাকা/BDT):</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={pkgPriceBdt}
                      onChange={(e) => {
                        const bdt = parseFloat(e.target.value) || 0;
                        setPkgPriceBdt(bdt);
                        setPkgPriceUsd(Number((bdt / 120).toFixed(2)));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-emerald-400 mt-0.5 block font-mono">
                      ≈ ${(pkgPriceBdt / 120).toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">মূল্য (ডলার/USD):</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={pkgPriceUsd}
                      onChange={(e) => {
                        const usd = parseFloat(e.target.value) || 0;
                        setPkgPriceUsd(usd);
                        setPkgPriceBdt(Math.round(usd * 120));
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-amber-300 mt-0.5 block font-mono">
                      ≈ ৳{(pkgPriceUsd * 120).toFixed(0)} BDT
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Offer & Discount Fields */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl">
                <div>
                  <label className="font-bold text-amber-300 block mb-1">🔥 আসল মূল্য (Original BDT):</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="যেমন: 150 (কাটা দাগ দেখাবে)"
                    value={pkgOriginalPriceBdt}
                    onChange={(e) => setPkgOriginalPriceBdt(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ইউজার দেখবে: <del>৳{pkgOriginalPriceBdt || 150}</del>
                  </span>
                </div>
                <div>
                  <label className="font-bold text-amber-300 block mb-1">⚡ অফার / ডিসকাউন্ট ব্যাজ:</label>
                  <input
                    type="text"
                    placeholder="যেমন: ৫০% ছাড় 🔥 বা সীমিত অফার"
                    value={pkgDiscountBadge}
                    onChange={(e) => setPkgDiscountBadge(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-amber-400 mt-0.5 block">
                    প্যাকেজে রঙিন আকর্ষণীয় ব্যাজ দেখাবে
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">বিবরণী (Description):</label>
                <textarea
                  rows={2}
                  placeholder="প্যাকেজের সুবিধা ও বিবরণ লিখুন..."
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">হ্যাশট্যাগসমূহ (কমা দিয়ে আলাদা করুন):</label>
                <input
                  type="text"
                  placeholder="#Software, #DirectLink, #EarnBot, #CPA"
                  value={pkgHashtags}
                  onChange={(e) => setPkgHashtags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">ফাইল সাইজ:</label>
                  <input
                    type="text"
                    placeholder="45 MB (.zip)"
                    value={pkgFileSize}
                    onChange={(e) => setPkgFileSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">ভার্সন / এডিশন:</label>
                  <input
                    type="text"
                    placeholder="v4.2 Pro"
                    value={pkgVersion}
                    onChange={(e) => setPkgVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">সাপোর্টেড ডিভাইস:</label>
                  <input
                    type="text"
                    placeholder="মোবাইল ও পিসি"
                    value={pkgRequirements}
                    onChange={(e) => setPkgRequirements(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">ফিচার সমূহ (প্রতি লাইনে একটি):</label>
                <textarea
                  rows={3}
                  placeholder="আনলিমিটেড চ্যানেল সাপোর্ট&#10;লাইফটাইম আপডেট ফ্রি&#10;বাংলা ভিডিও গাইড"
                  value={pkgFeatures}
                  onChange={(e) => setPkgFeatures(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">থাম্বনেইল ইমেজ URL:</label>
                <input
                  type="url"
                  value={pkgThumbnail}
                  onChange={(e) => setPkgThumbnail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-400 block mb-1">সিক্রেট ডাউনলোড লিংক / গুগল ড্রাইভ লিংক (যা শুধুমাত্র অনুমোদিত ক্রেতারা পাবে):</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={pkgDownloadUrl}
                  onChange={(e) => setPkgDownloadUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    resetNewPackageForm();
                    setShowAddPackageModal(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <AdminSaveButton
                  id="admin-create-package-btn"
                  isDirty={Boolean(pkgTitle.trim().length > 0 && pkgDownloadUrl.trim().length > 0)}
                  isSaving={isPkgSaving}
                  isSaved={isPkgSaved}
                  defaultText="প্যাকেজ পাবলিশ করুন"
                  savingText="প্যাকেজ সংরক্ষণ হচ্ছে..."
                  savedText="প্যাকেজ সেভ হয়েছে! ✓"
                  type="submit"
                  className="flex-1"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-white shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                ডিজিটাল প্যাকেজ এডিট করুন (Edit Package)
              </h3>
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePackage} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">প্যাকেজ শিরোনাম (Title):</label>
                <input
                  type="text"
                  required
                  value={editingPackage.title}
                  onChange={(e) => setEditingPackage({ ...editingPackage, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">ক্যাটাগরি:</label>
                  <select
                    value={editingPackage.category}
                    onChange={(e: any) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Software">Software</option>
                    <option value="Video Course">Video Course</option>
                    <option value="Bot Script">Bot Script</option>
                    <option value="Tools & Files">Tools & Files</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">মূল্য (টাকা/BDT):</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={editingPackage.priceBdt}
                      onChange={(e) => {
                        const bdt = parseFloat(e.target.value) || 0;
                        setEditingPackage({
                          ...editingPackage,
                          priceBdt: bdt,
                          priceUsd: Number((bdt / 120).toFixed(2)),
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-emerald-400 mt-0.5 block font-mono">
                      ≈ ${(editingPackage.priceBdt / 120).toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">মূল্য (ডলার/USD):</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={editingPackage.priceUsd}
                      onChange={(e) => {
                        const usd = parseFloat(e.target.value) || 0;
                        setEditingPackage({
                          ...editingPackage,
                          priceUsd: usd,
                          priceBdt: Math.round(usd * 120),
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-amber-300 mt-0.5 block font-mono">
                      ≈ ৳{(editingPackage.priceUsd * 120).toFixed(0)} BDT
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Offer & Discount Fields for Edit */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-2xl">
                <div>
                  <label className="font-bold text-amber-300 block mb-1">🔥 আসল মূল্য (Original BDT):</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="যেমন: 150 (কাটা দাগ দেখাবে)"
                    value={editingPackage.originalPriceBdt ?? ''}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      originalPriceBdt: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ইউজার দেখবে: <del>৳{editingPackage.originalPriceBdt || 150}</del>
                  </span>
                </div>
                <div>
                  <label className="font-bold text-amber-300 block mb-1">⚡ অফার / ডিসকাউন্ট ব্যাজ:</label>
                  <input
                    type="text"
                    placeholder="যেমন: ৫০% ছাড় 🔥 বা সীমিত অফার"
                    value={editingPackage.discountBadge || ''}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage,
                      discountBadge: e.target.value
                    })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-amber-400 mt-0.5 block">
                    প্যাকেজে রঙিন আকর্ষণীয় ব্যাজ দেখাবে
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">বিবরণী (Description):</label>
                <textarea
                  rows={2}
                  value={editingPackage.description}
                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">হ্যাশট্যাগসমূহ (কমা দিয়ে আলাদা করুন):</label>
                <input
                  type="text"
                  value={Array.isArray(editingPackage.hashtags) ? editingPackage.hashtags.join(', ') : (editingPackage.hashtags || '')}
                  onChange={(e) => setEditingPackage({ ...editingPackage, hashtags: e.target.value.split(',').map((s) => s.trim()) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">ফাইল সাইজ:</label>
                  <input
                    type="text"
                    value={editingPackage.fileSize || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, fileSize: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">ভার্সন / এডিশন:</label>
                  <input
                    type="text"
                    value={editingPackage.version || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, version: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1 text-[11px]">প্রয়োজনীয়তা:</label>
                  <input
                    type="text"
                    value={editingPackage.requirements || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, requirements: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">থাম্বনেইল ইমেজ URL:</label>
                <input
                  type="url"
                  value={editingPackage.thumbnail || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, thumbnail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-emerald-400 block mb-1">
                  সিক্রেট ডাউনলোড লিংক / গুগল ড্রাইভ লিংক:
                </label>
                <input
                  type="url"
                  required
                  value={editingPackage.downloadUrl || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, downloadUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <AdminSaveButton
                  id="admin-update-package-btn"
                  isDirty={true}
                  isSaving={isEditPkgSaving}
                  isSaved={isEditPkgSaved}
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
