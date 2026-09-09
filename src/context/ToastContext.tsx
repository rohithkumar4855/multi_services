import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ToastContainer } from '../components/ui/ToastContainer';
import type { ToastData, ToastVariant, ToastAction } from '../components/ui/Toast';

export interface ToastOptions {
  id?: string;
  variant?: ToastVariant;
  title: string;
  message?: string;
  serviceName?: string;
  amount?: string | number;
  bookingId?: string;
  securityBadge?: string;
  action?: ToastAction;
  duration?: number;
}

type ToastInput = string | ToastOptions;

export interface ToastContextType {
  toasts: ToastData[];
  showToast: (input: ToastInput, variant?: ToastVariant) => string;
  success: (input: ToastInput) => string;
  error: (input: ToastInput) => string;
  warning: (input: ToastInput) => string;
  info: (input: ToastInput) => string;
  loading: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global toast listener for outside React tree / quick calls
type ToastListener = (toast: ToastData) => void;
type DismissListener = (id: string) => void;
const listeners: ToastListener[] = [];
const dismissListeners: DismissListener[] = [];

export const toast = {
  show: (input: ToastInput, variant: ToastVariant = 'info'): string => {
    const id = typeof input === 'object' && input.id ? input.id : `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toastData: ToastData = typeof input === 'string'
      ? { id, variant, title: input, duration: 5500 }
      : { id, variant: input.variant || variant, duration: input.duration ?? 5500, ...input };

    listeners.forEach(l => l(toastData));
    return id;
  },
  success: (input: ToastInput): string => toast.show(input, 'success'),
  error: (input: ToastInput): string => toast.show(input, 'error'),
  warning: (input: ToastInput): string => toast.show(input, 'warning'),
  info: (input: ToastInput): string => toast.show(input, 'info'),
  loading: (input: ToastInput): string => toast.show(input, 'loading'),
  dismiss: (id: string): void => {
    dismissListeners.forEach(l => l(id));
  }
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toastData: ToastData) => {
    setToasts(prev => [toastData, ...prev.filter(t => t.id !== toastData.id)].slice(0, 5));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    dismissListeners.push(dismiss);
    return () => {
      const lIdx = listeners.indexOf(addToast);
      if (lIdx !== -1) listeners.splice(lIdx, 1);
      const dIdx = dismissListeners.indexOf(dismiss);
      if (dIdx !== -1) dismissListeners.splice(dIdx, 1);
    };
  }, [addToast, dismiss]);

  const showToast = useCallback((input: ToastInput, variant: ToastVariant = 'info') => {
    return toast.show(input, variant);
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    success: (input) => toast.success(input),
    error: (input) => toast.error(input),
    warning: (input) => toast.warning(input),
    info: (input) => toast.info(input),
    loading: (input) => toast.loading(input),
    dismiss,
    dismissAll
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback bound to global toast if used outside provider
    return {
      toasts: [],
      showToast: toast.show,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      loading: toast.loading,
      dismiss: toast.dismiss,
      dismissAll: () => {}
    };
  }
  return context;
};
