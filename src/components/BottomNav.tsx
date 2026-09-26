import React from 'react';
import { Home, UserPlus, Coins, BarChart3, User } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n';

export type NavTab = 'home' | 'refer' | 'earn' | 'rank' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, language }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const tabs: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: t.home || 'হোম', icon: Home },
    { id: 'refer', label: t.refer || 'রেফার', icon: UserPlus },
    { id: 'earn', label: language === 'bn' ? 'টাস্ক' : (t.earn || 'Tasks'), icon: Coins },
    { id: 'rank', label: t.rank || 'র‍্যাংক', icon: BarChart3 },
    { id: 'profile', label: t.profile || 'প্রোফাইল', icon: User },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-blue-950 via-indigo-950 to-purple-950 border-t border-purple-800/60 shadow-[0_-8px_25px_rgba(0,0,0,0.5)] pointer-events-auto select-none pb-[env(safe-area-inset-bottom,4px)]"
    >
      <div className="max-w-md mx-auto flex items-stretch justify-around h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer select-none active:scale-95 touch-manipulation transition-all duration-150 relative h-full ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Highlight circle icon for active state */}
              {isActive ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 -mt-3.5 border-2 border-white mb-0.5 animate-pulse-gentle pointer-events-none">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-7 h-7 flex items-center justify-center mb-0.5 pointer-events-none">
                  <Icon className="w-5 h-5" />
                </div>
              )}

              <span className={`text-[11px] tracking-tight pointer-events-none ${isActive ? 'font-extrabold text-white' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
