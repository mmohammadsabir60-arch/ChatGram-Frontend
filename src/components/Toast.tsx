import React from 'react';
import { useToastStore } from '@/store/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl backdrop-blur-md border animate-slide-up transition-all',
            toast.type === 'error'
              ? 'bg-rose-500/95 text-white border-rose-400'
              : toast.type === 'success'
              ? 'bg-emerald-600/95 text-white border-emerald-500'
              : 'bg-zinc-900/95 dark:bg-zinc-800/95 text-white border-zinc-700'
          )}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {(!toast.type || toast.type === 'info') && <Info size={18} />}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">{toast.title}</h4>
            {toast.message && (
              <p className="text-xs text-white/90 mt-0.5 leading-snug break-words">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/70 hover:text-white p-0.5 rounded-lg"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};

