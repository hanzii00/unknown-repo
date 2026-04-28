'use client';

import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastMessage = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastProps = {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
  duration?: number;
};

const toneStyles: Record<ToastTone, { icon: React.ReactNode; className: string; label: string }> = {
  success: { icon: <CheckCircle2 size={16} />, className: 'app-toast-success', label: 'Success' },
  error: { icon: <AlertCircle size={16} />, className: 'app-toast-error', label: 'Error' },
  warning: { icon: <AlertTriangle size={16} />, className: 'app-toast-warning', label: 'Warning' },
  info: { icon: <Info size={16} />, className: 'app-toast-info', label: 'Info' },
};

export default function Toast({ toasts, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) => window.setTimeout(() => onDismiss(toast.id), duration));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [duration, onDismiss, toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="app-toast-region" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const tone = toneStyles[toast.tone];

        return (
          <div key={toast.id} className={`app-toast ${tone.className} fade-in`} role="status">
            <div className="app-toast-icon" aria-hidden="true">
              {tone.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div className="app-toast-label">{tone.label}</div>
              <div className="app-toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="app-toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
