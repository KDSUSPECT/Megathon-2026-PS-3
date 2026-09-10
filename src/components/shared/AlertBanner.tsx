import React from 'react';
import { usePharmaChain } from '../../context/PharmaChainContext';
import { AlertCircle, AlertTriangle, ShieldAlert, X, Bell } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { notifications, markNotificationAsRead } = usePharmaChain();

  const unreadAlerts = notifications.filter((n) => !n.read);

  if (unreadAlerts.length === 0) return null;

  // Take top 2 most urgent unread alerts
  const urgentAlerts = unreadAlerts.slice(0, 2);

  return (
    <div className="w-full space-y-2 mb-4">
      {urgentAlerts.map((alert) => {
        const isFraud = alert.type === 'FRAUD_ALERT';
        const isCritical = alert.type === 'CRITICAL_EXPIRY';
        const isDispute = alert.type === 'DISPUTE_RAISED';

        return (
          <div
            key={alert.id}
            id={`alert-banner-${alert.id}`}
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-sm transition-all ${
              isFraud
                ? 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-400'
                : isCritical
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : isDispute
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-yellow-50 border-yellow-200 text-yellow-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {isFraud ? (
                  <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                ) : isCritical ? (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                ) : isDispute ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Bell className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/60">
                    {alert.title}
                  </span>
                  <span className="text-xs font-mono font-semibold opacity-75">
                    [{alert.batchNumber}]
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1 leading-snug">{alert.message}</p>
              </div>
            </div>

            <button
              id={`dismiss-alert-${alert.id}`}
              onClick={() => markNotificationAsRead(alert.id)}
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-black/5 transition-colors"
              title="Acknowledge and dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
