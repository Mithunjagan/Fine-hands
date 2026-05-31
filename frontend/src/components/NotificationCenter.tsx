import React from 'react';
import { useUIStore } from '../store/uiStore';
import { Bell, X, AlertTriangle, ShieldAlert, Target, Zap, Lightbulb } from 'lucide-react';
import type { Notification } from '../types';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationAsRead, activeModal, closeModal } = useUIStore();

  if (activeModal !== 'notifications') return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type'], severity: string) => {
    switch (type) {
      case 'anomaly_alert': return severity === 'critical' ? <ShieldAlert className="h-5 w-5" /> : <Zap className="h-5 w-5" />;
      case 'goal_milestone': return <Target className="h-5 w-5" />;
      case 'savings_tip': return <Lightbulb className="h-5 w-5" />;
      case 'subscription_warning': return <AlertTriangle className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getColorClass = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/5 text-red-400';
      case 'alert': return 'border-l-orange-500 bg-orange-500/5 text-orange-400';
      case 'warning': return 'border-l-yellow-500 bg-yellow-500/5 text-yellow-400';
      case 'success': return 'border-l-emerald-500 bg-emerald-500/5 text-emerald-400';
      default: return 'border-l-blue-500 bg-blue-500/5 text-blue-400';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-gray-800 bg-gray-950/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right">
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button onClick={closeModal} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <Bell className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id}
              className={`relative flex gap-3 rounded-r-lg border-l-4 border-y border-r border-y-gray-800/50 border-r-gray-800/50 p-4 transition-all ${
                n.read ? 'opacity-60 grayscale-[0.5]' : 'bg-gray-900/50 shadow-md'
              } ${getColorClass(n.severity)}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {getIcon(n.type, n.severity)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-semibold ${n.read ? 'text-gray-400' : 'text-gray-200'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{n.body}</p>
                
                {!n.read && (
                  <button 
                    onClick={() => markNotificationAsRead(n.id)}
                    className="mt-2 text-[10px] font-medium text-blue-400 hover:text-blue-300"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
