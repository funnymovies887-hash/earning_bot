import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, User, AtSign, KeyRound, CheckCircle2, Loader2, Send } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [displayName, setDisplayName] = React.useState(currentUser.displayName);
  const [username, setUsername] = React.useState(currentUser.username);
  const [telegramId, setTelegramId] = React.useState(currentUser.id);
  const [avatarUrl, setAvatarUrl] = React.useState(currentUser.avatarUrl);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser.displayName);
      setUsername(currentUser.username);
      setTelegramId(currentUser.id);
      setAvatarUrl(currentUser.avatarUrl);
      setSuccess(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: telegramId,
          displayName,
          username,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (data.user) {
        onUpdateUser(data.user);
      } else {
        onUpdateUser({ displayName, username, avatarUrl, id: telegramId });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch {
      onUpdateUser({ displayName, username, avatarUrl, id: telegramId });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramFastLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const tgUsername = '@User_' + Math.floor(1000 + Math.random() * 9000);
      const tgName = 'Telegram VIP Member';
      setDisplayName(tgName);
      setUsername(tgUsername);
      onUpdateUser({
        displayName: tgName,
        username: tgUsername,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          id="auth-modal"
          className="w-full max-w-sm bg-white rounded-3xl p-6 text-slate-800 shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">User Authentication</h3>
              <p className="text-xs text-slate-500">Manage your profile & secure login</p>
            </div>
          </div>

          {/* Quick Telegram Sign In Button */}
          <button
            onClick={handleTelegramFastLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm mb-4 transition-transform active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>Connect with Telegram Mini App</span>
          </button>

          <div className="flex items-center gap-2 my-3 text-slate-400 text-xs">
            <div className="flex-1 h-px bg-slate-200" />
            <span>or edit credentials</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {success ? (
            <div className="py-6 text-center space-y-2 text-emerald-600">
              <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
              <h4 className="font-bold text-sm">Profile Authenticated!</h4>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1">Display Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-purple-500"
                    placeholder="Your Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Telegram Username / ID</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-purple-500"
                    placeholder="@username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-900 focus:outline-hidden focus:border-purple-500"
                  placeholder="https://..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-transform active:scale-98 cursor-pointer mt-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Sync Account'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
