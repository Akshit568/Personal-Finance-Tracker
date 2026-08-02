import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);

let idCounter = 0;

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, ttl = 4000) => {
      const id = ++idCounter;
      setToasts((list) => [...list, { id, type, message }]);
      if (ttl) setTimeout(() => dismiss(id), ttl);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={clsx(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-card animate-fade-in',
                'bg-white dark:bg-slate-900',
                t.type === 'success' && 'border-emerald-200 dark:border-emerald-900/60',
                t.type === 'error' && 'border-rose-200 dark:border-rose-900/60',
                t.type === 'info' && 'border-slate-200 dark:border-slate-700'
              )}
            >
              <Icon
                size={18}
                className={clsx(
                  'mt-0.5 shrink-0',
                  t.type === 'success' && 'text-emerald-600 dark:text-emerald-400',
                  t.type === 'error' && 'text-rose-600 dark:text-rose-400',
                  t.type === 'info' && 'text-brand-600 dark:text-brand-400'
                )}
              />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
