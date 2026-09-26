import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { UserProfile, Currency, Language } from '../types';
import { TRANSLATIONS } from '../i18n';
import confetti from 'canvas-confetti';
import { toLocalizedDigits } from '../utils/formatters';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  language: Language;
  onWithdrawSuccess: (amount: number, method: string) => void;
}

const METHODS = [
  'bKash',
  'Nagad',
  'Rocket',
  'Upay',
  'PayTM (India)',
  'Binance Pay (Crypto)',
];

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  language,
  onWithdrawSuccess,
}) => {
  const [method, setMethod] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // User balance in current currency
  const currentInCurr = user.currency === 'USD' ? user.balanceUsd : user.currency === 'BDT' ? user.balanceUsd * 120 : user.balanceUsd * 87;
  const availableRound = Math.max(0, Math.floor(currentInCurr));

  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setAmount(user.currency === 'USD' ? '1' : user.currency === 'BDT' ? '25' : '20');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!method) {
      setError('পেমেন্ট মেথড নির্বাচন করুন (যেমন: bKash, Nagad)');
      return;
    }

    if (!accountNumber.trim()) {
      setError('আপনার অ্যাকাউন্ট বা ওয়ালেট নম্বর লিখুন');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('উত্তোলনের সঠিক পরিমাণ লিখুন');
      return;
    }

    // STRICT Round figure enforcement: No poysa/cents allowed during withdrawal
    if (numAmount % 1 !== 0) {
      setError(
        `উত্তোলনের পরিমাণ অবশ্যই পূর্ণসংখ্যা (Round Figure, যেমন: ${
          user.currency === 'BDT' ? '২৫, ৩০, ৫০, ১০০ ৳' : user.currency === 'INR' ? '২০, ৩০, ৫০, ১০০ ₹' : '১, ২, ৫, ১০ $'
        }) হতে হবে। অতিরিক্ত পয়সা আপনার ব্যালেন্সে থেকে যাবে।`
      );
      return;
    }

    // Minimum check: $1 or ৳25 or ₹20 (whole integer)
    const minRequired = user.currency === 'USD' ? 1 : user.currency === 'BDT' ? 25 : 20;

    if (numAmount < minRequired) {
      setError(
        `সর্বনিম্ন উত্তোলন পরিমাণ ${
          user.currency === 'BDT' ? '৳২৫' : user.currency === 'INR' ? '₹২০' : '$১'
        } (পূর্ণসংখ্যা)`
      );
      return;
    }

    if (currentInCurr < numAmount) {
      setError(
        `পর্যাপ্ত ব্যালেন্স নেই। আপনার ব্যালেন্স আছে ${
          user.currency === 'BDT' ? '৳' : user.currency === 'INR' ? '₹' : '$'
        } ${currentInCurr.toFixed(2)} (সর্বোচ্চ উত্তোলন করতে পারবেন ${
          user.currency === 'BDT' ? '৳' : user.currency === 'INR' ? '₹' : '$'
        } ${availableRound})`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          userId: user.id,
          method,
          accountNumber,
          amount: numAmount,
          currency: user.currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'উত্তোলন আবেদন সম্পন্ন হয়নি');
      }

      setSuccess(true);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      onWithdrawSuccess(numAmount, method);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'সার্ভার সংযোগে ত্রুটি হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = user.currency === 'USD' ? [1, 2, 5, 10, 20] : user.currency === 'BDT' ? [25, 50, 100, 200, 500] : [20, 50, 100, 200, 500];

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          id="withdraw-funds-modal"
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 text-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{t.withdrawFunds}</h3>
              <p className="text-[10px] text-slate-500">অ্যাকাউন্ট ভেরিফিকেশন ও শর্তাবলী</p>
            </div>
          </div>

          {/* User balance summary and round figure info */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3 mb-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-emerald-700 block font-semibold">আপনার মোট ব্যালেন্স:</span>
              <span className="font-mono font-black text-emerald-900 text-sm">
                {user.currency === 'BDT' ? '৳ ' : user.currency === 'INR' ? '₹ ' : '$ '}
                {currentInCurr.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">উত্তোলনযোগ্য (পূর্ণসংখ্যা):</span>
              <span className="font-mono font-bold text-slate-800">
                {user.currency === 'BDT' ? '৳ ' : user.currency === 'INR' ? '₹ ' : '$ '}
                {availableRound}
              </span>
            </div>
          </div>

          {/* Withdrawal Eligibility Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 space-y-2">
            <div className="text-[11px] font-extrabold text-slate-800 flex items-center justify-between">
              <span>উত্তোলন শর্তাবলী (Withdrawal Rules)</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">নিয়মাবলি</span>
            </div>

            {/* Rule 1: 3 Active referrals with 10 TK activity */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{toLocalizedDigits(3, language)} জন সক্রিয় রেফার (প্রতিজন {toLocalizedDigits(10, language)}৳ কাজ)</span>
              </div>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded ${
                (user.activeReferralsWithActivity || 0) >= 3
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {toLocalizedDigits(user.activeReferralsWithActivity || 0, language)} / {toLocalizedDigits(3, language)}
              </span>
            </div>

            {/* Rule 2: Delivery Timeline */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>১ম পেমেন্ট সময় (ভেরিফিকেশন)</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {toLocalizedDigits(7, language)} - {toLocalizedDigits(15, language)} দিন
              </span>
            </div>

            {/* Rule 3: Subsequent Payments */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>২য় বার থেকে পেমেন্ট সময়</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                মাত্র ৬ - ১২ ঘণ্টা ⚡
              </span>
            </div>

            <div className="pt-1 text-[10px] text-slate-500 italic">
              💡 নিয়মিত কাজ করলে ১০০% শতভাগ গ্যারান্টিড পেমেন্ট পাবেন।
            </div>
          </div>

          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-slate-900">Withdrawal Request Received!</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                আপনার <strong>{amount} {user.currency}</strong> ({method}) উইথড্র আবেদন গ্রহণ করা হয়েছে। ১ম উইথড্র ৭-১৫ দিনের মধ্যে এবং পরবর্তী সকল উইথড্র ৬-১২ ঘণ্টার মধ্যে পৌঁছে যাবে।
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.paymentMethod}
                </label>
                <div className="relative">
                  <select
                    id="withdraw-method-select"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{t.selectMethod}</option>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.accountNumber}
                </label>
                <input
                  id="withdraw-account-input"
                  type="text"
                  placeholder="01XXXXXXXXX or Wallet ID"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.amount} ({user.currency}) - <span className="text-rose-600 font-bold">পূর্ণসংখ্যা</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">পয়সা অ্যাকাউন্টে থাকবে</span>
                </div>
                <input
                  id="withdraw-amount-input"
                  type="number"
                  step="1"
                  min={user.currency === 'USD' ? '1' : user.currency === 'BDT' ? '25' : '20'}
                  placeholder={user.currency === 'USD' ? '1' : user.currency === 'BDT' ? '25' : '20'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {/* Quick Select Buttons */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">দ্রুত বাছুন:</span>
                  {quickAmounts.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAmount(String(q))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                        amount === String(q)
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {user.currency === 'BDT' ? '৳' : user.currency === 'INR' ? '₹' : '$'}{q}
                    </button>
                  ))}
                  {availableRound >= (user.currency === 'USD' ? 1 : 25) && (
                    <button
                      type="button"
                      onClick={() => setAmount(String(availableRound))}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all shrink-0 cursor-pointer"
                    >
                      সব ({availableRound})
                    </button>
                  )}
                </div>

                {/* Real-time automatic currency conversion */}
                {Boolean(amount && !isNaN(Number(amount)) && Number(amount) > 0) && (
                  <div className="mt-2 p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-950 font-semibold animate-fadeIn">
                    <span className="text-[11px] text-amber-800 flex items-center gap-1 font-bold">
                      🔄 স্বয়ংক্রিয় কনভার্সন:
                    </span>
                    <span className="font-mono text-[11px] text-amber-900 font-black">
                      {user.currency === 'BDT' ? (
                        <>
                          ≈ ${(Number(amount) / 120).toFixed(2)} USD • ₹{((Number(amount) / 120) * 87).toFixed(2)} INR
                        </>
                      ) : user.currency === 'USD' ? (
                        <>
                          ≈ ৳{(Number(amount) * 120).toFixed(2)} BDT • ₹{(Number(amount) * 87).toFixed(2)} INR
                        </>
                      ) : (
                        <>
                          ≈ ৳{((Number(amount) / 87) * 120).toFixed(2)} BDT • ${(Number(amount) / 87).toFixed(2)} USD
                        </>
                      )}
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-1.5">
                  উত্তোলনের নিয়ম: পূর্ণসংখ্যায় আবেদন করুন (যেমন ২৫, ৩০, ৫০ টাকা)। অবশিষ্ট পয়সা আপনার অ্যাকাউন্টে জমা থাকবে।
                </p>
              </div>

              <button
                type="submit"
                id="submit-withdraw-btn"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-98 text-sm flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  t.submitRequest
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
