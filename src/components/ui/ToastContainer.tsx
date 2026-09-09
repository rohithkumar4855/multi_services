import React from 'react';
import { Toast, type ToastData } from './Toast';

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 sm:top-6 sm:right-6 left-4 sm:left-auto z-[99999] flex flex-col gap-3 pointer-events-none sm:w-[420px] w-auto max-w-[calc(100vw-2rem)]"
      aria-live="assertive"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
