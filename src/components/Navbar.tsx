import React from 'react';
import { Settings, Bell, ShoppingBag } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { toLocalizedDigits } from '../utils/formatters';

interface NavbarProps {
  user: UserProfile;
  onlineCount: number;
  unreadCount?: number;
  language?: Language;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenStore?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onlineCount,
  unreadCount = 0,
  language = 'bn',
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  onOpenStore,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white px-3 py-2.5 shadow-md">
      {/* Main app bar */}
      <div className="flex items-center justify-between gap-1">
        {/* User avatar */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-1.5 text-left group transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-9 h-9 rounded-full border-2 border-amber-300 object-cover shadow-sm group-hover:border-yellow-200"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[8px] px-1 rounded-full border border-purple-900">
              VIP
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight line-clamp-1 max-w-[110px]">
              {user.displayName}
            </span>
            <span className="text-[10px] text-amber-300 font-medium leading-none">
              Cholo Income Kori
            </span>
          </div>
        </button>

        {/* Online status counter */}
        <div className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/40 px-2.5 py-1 rounded-full shadow-inner shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-black tracking-wide text-emerald-400">
            {toLocalizedDigits(onlineCount, language)} ONLINE
          </span>
        </div>

        {/* Action icons: Notification Bell + Store + Settings */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          {onOpenStore && (
            <button
              type="button"
              id="navbar-store-btn"
              onClick={() => onOpenStore()}
              className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 active:scale-90 border border-amber-400/50 flex items-center justify-center text-amber-300 transition-all shadow-sm cursor-pointer touch-manipulation relative"
              title="ডিজিটাল স্টোর (VIP Store)"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            id="navbar-notification-btn"
            onClick={() => onOpenNotifications()}
            className="w-8 h-8 rounded-full bg-purple-700/60 hover:bg-purple-600 active:scale-90 border border-purple-400/40 flex items-center justify-center text-amber-300 transition-all shadow-sm relative cursor-pointer touch-manipulation"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-purple-900 shadow-sm animate-pulse">
                {toLocalizedDigits(unreadCount, language)}
              </span>
            )}
          </button>

          <button
            type="button"
            id="navbar-settings-btn"
            onClick={() => onOpenSettings()}
            className="w-8 h-8 rounded-full bg-purple-700/60 hover:bg-purple-600 active:scale-90 border border-purple-400/40 flex items-center justify-center text-amber-300 transition-all shadow-sm cursor-pointer touch-manipulation"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
