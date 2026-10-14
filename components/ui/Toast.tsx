"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, message?: string) => addToast({ type: "success", title, message }),
    error: (title: string, message?: string) => addToast({ type: "error", title, message }),
    info: (title: string, message?: string) => addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ),
        };
      case "error":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-100",
          iconColor: "text-rose-600 dark:text-rose-400",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ),
        };
      case "warning":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-100",
          iconColor: "text-amber-600 dark:text-amber-400",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ),
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-blue-100",
          iconColor: "text-blue-600 dark:text-blue-400",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`animate-in fade-in slide-in-from-bottom-2 pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-200 ${styles.bg}`}
    >
      <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {styles.icon}
        </svg>
      </div>

      <div className="min-w-0 flex-1 pr-1">
        <h4 className="text-sm font-semibold">{toast.title}</h4>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed opacity-90">{toast.message}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-m-2 flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg text-current opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
