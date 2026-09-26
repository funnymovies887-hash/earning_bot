import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Language, Currency, UserProfile } from '../types';
import { TRANSLATIONS } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  currentLanguage?: Language;
  currentCurrency?: Currency;
  onSave: ((updated: Partial<UserProfile>) => Promise<void> | void) | ((language: Language, currency: Currency) => void);
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  currentLanguage,
  currentCurrency,
  onSave,
}) => {
  const getValidLang = (lang: any): Language => {
    return (typeof lang === 'string' && ['en', 'bn', 'hi', 'ur'].includes(lang)) ? (lang as Language) : 'bn';
  };

  const getValidCurrency = (curr: any): Currency => {
    return (typeof curr === 'string' && ['USD', 'BDT', 'INR'].includes(curr)) ? (curr as Currency) : 'BDT';
  };

  const [selectedLang, setSelectedLang] = React.useState<Language>(() => getValidLang(currentLanguage || user?.language));
  const [selectedCurrency, setSelectedCurrency] = React.useState<Currency>(() => getValidCurrency(currentCurrency || user?.currency));
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedLang(getValidLang(currentLanguage || user?.language));
      setSelectedCurrency(getValidCurrency(currentCurrency || user?.currency));
      setIsSaving(false);
    }
  }, [isOpen, user?.language, user?.currency, currentLanguage, currentCurrency]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[selectedLang] || TRANSLATIONS.bn || TRANSLATIONS.en;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (typeof onSave === 'function') {
        const result = (onSave as any)(selectedLang, selectedCurrency);
        if (result && typeof result.then === 'function') {
          await result;
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          id="setup-profile-modal"
          className="w-full max-w-sm bg-white rounded-3xl p-6 text-slate-800 shadow-2xl relative"
        >
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-slate-900">{t.setupProfile}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t.chooseSettings}</p>
          </div>

          {/* Language selector */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              {t.language}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'en', label: 'English' },
                { id: 'bn', label: 'বাংলা' },
                { id: 'hi', label: 'हिंदी' },
                { id: 'ur', label: 'اردو' },
              ].map((lang) => {
                const isSelected = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    id={`lang-btn-${lang.id}`}
                    onClick={() => setSelectedLang(lang.id as Language)}
                    className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all text-center ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Display */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              {t.currencyDisplay}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'USD', label: '$ USD' },
                { id: 'BDT', label: '৳ BDT' },
                { id: 'INR', label: '₹ INR' },
              ].map((curr) => {
                const isSelected = selectedCurrency === curr.id;
                return (
                  <button
                    key={curr.id}
                    id={`curr-btn-${curr.id}`}
                    onClick={() => setSelectedCurrency(curr.id as Currency)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {curr.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button
              id="settings-save-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 text-sm disabled:opacity-75"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.saving}
                </>
              ) : (
                t.saveContinue
              )}
            </button>

            <button
              id="settings-cancel-btn"
              onClick={onClose}
              disabled={isSaving}
              className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center transition-colors"
            >
              {t.cancel}
            </button>

            {/* Secret / Direct Admin Portal link */}
            <div className="pt-2 border-t border-slate-100 flex justify-center">
              <a
                href="/admin"
                className="text-[11px] text-slate-400 hover:text-purple-600 font-medium transition-colors flex items-center gap-1"
              >
                <span>🔒 Admin Control Center</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
