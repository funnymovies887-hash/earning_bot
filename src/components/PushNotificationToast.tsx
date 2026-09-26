import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles } from 'lucide-react';

export interface PushMessage {
  id: string;
  title: string;
  body: string;
  icon?: string;
  time?: string;
}

interface PushNotificationToastProps {
  notifications: PushMessage[];
  onDismiss: (id: string) => void;
}

interface ToastItemProps {
  notification: PushMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onDismiss }) => {
  const dismissRef = React.useRef(onDismiss);
  dismissRef.current = onDismiss;

  React.useEffect(() => {
    // Auto-dismiss real system notification
    const timer = setTimeout(() => {
      dismissRef.current(notification.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="pointer-events-auto bg-slate-900/95 text-white border border-purple-500/40 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 relative overflow-hidden"
    >
      <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
        <Bell className="w-5 h-5 text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h5 className="font-extrabold text-xs text-white truncate">{notification.title}</h5>
          <span className="text-[10px] text-purple-300 font-medium">{notification.time || 'এইমাত্র'}</span>
        </div>
        <p className="text-xs text-slate-300 mt-0.5 leading-snug">{notification.body}</p>
      </div>

      <button
        onClick={() => onDismiss(notification.id)}
        className="text-slate-400 hover:text-white p-1 cursor-pointer"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-3 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
