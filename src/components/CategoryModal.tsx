import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Film, X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory?: string;
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
  language?: Language;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  currentCategory,
  selectedCategory,
  onSelectCategory,
  language = 'bn',
}) => {
  if (!isOpen) return null;
  const activeCategory = selectedCategory || currentCategory || 'online-income';
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const categories = [
    {
      id: 'online-income',
      name: t.onlineIncome || 'অনলাইন ইনকাম',
      badge: 'FRESH',
      icon: Sparkles,
      color: 'emerald',
    },
    {
      id: 'movies-clips',
      name: t.moviesClips || 'Movies & Clips',
      badge: 'MOVIE',
      icon: Film,
      color: 'indigo',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          id="select-category-modal"
          className="w-full max-w-sm bg-white rounded-3xl p-6 text-slate-800 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-6 pr-6">
            <h2 className="text-xl font-bold text-slate-900">{t.selectCategory}</h2>
            <p className="text-xs text-slate-500 mt-1">{t.categorySubtitle}</p>
          </div>

          <div className="space-y-3 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  id={`cat-select-${cat.id}`}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onClose();
                  }}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        cat.color === 'emerald'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                      <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        {cat.badge}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-purple-600' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            id="confirm-change-category-btn"
            onClick={onClose}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md text-sm transition-all active:scale-98"
          >
            {t.changeCategory}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
