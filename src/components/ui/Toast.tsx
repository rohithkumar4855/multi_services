import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ToastData {
  id: string;
  variant?: ToastVariant;
  title: string;
  message?: string;
  serviceName?: string;
  amount?: string | number;
  bookingId?: string;
  securityBadge?: string;
  action?: ToastAction;
  duration?: number; // ms, 0 means persist
  createdAt?: number;
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const {
    id,
    variant = 'info',
    title,
    message,
    serviceName,
    amount,
    bookingId,
    securityBadge = 'Payment verified securely',
    action,
    duration = 5500
  } = toast;

  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef<number>(duration);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-dismiss countdown
  useEffect(() => {
    if (duration <= 0 || variant === 'loading') return;

    let lastTimestamp = performance.now();

    const updateTimer = (currentTimestamp: number) => {
      if (!isPaused) {
        const delta = currentTimestamp - lastTimestamp;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
        setProgress((remainingTimeRef.current / duration) * 100);

        if (remainingTimeRef.current <= 0) {
          handleClose();
          return;
        }
      }
      lastTimestamp = currentTimestamp;
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [duration, isPaused, variant]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 250);
  };

  // Color configurations per variant
  const config = {
    success: {
      borderColor: 'border-emerald-500/35',
      glowShadow: 'shadow-[0_20px_50px_rgba(5,150,105,0.18),0_0_0_1px_rgba(16,185,129,0.25)]',
      iconBg: 'bg-emerald-500/15',
      iconBorder: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      progressColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      badgeBg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
      actionBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40'
    },
    error: {
      borderColor: 'border-rose-500/35',
      glowShadow: 'shadow-[0_20px_50px_rgba(225,29,72,0.18),0_0_0_1px_rgba(244,63,94,0.25)]',
      iconBg: 'bg-rose-500/15',
      iconBorder: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      progressColor: 'bg-gradient-to-r from-rose-500 to-red-400',
      badgeBg: 'bg-rose-950/60 text-rose-400 border-rose-800/40',
      actionBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-900/40'
    },
    warning: {
      borderColor: 'border-amber-500/35',
      glowShadow: 'shadow-[0_20px_50px_rgba(217,119,6,0.18),0_0_0_1px_rgba(245,158,11,0.25)]',
      iconBg: 'bg-amber-500/15',
      iconBorder: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      progressColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      badgeBg: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
      actionBtn: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-900/40'
    },
    info: {
      borderColor: 'border-sky-500/35',
      glowShadow: 'shadow-[0_20px_50px_rgba(2,132,199,0.18),0_0_0_1px_rgba(14,165,233,0.25)]',
      iconBg: 'bg-sky-500/15',
      iconBorder: 'border-sky-500/30',
      iconColor: 'text-sky-400',
      progressColor: 'bg-gradient-to-r from-sky-500 to-blue-400',
      badgeBg: 'bg-sky-950/60 text-sky-400 border-sky-800/40',
      actionBtn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-900/40'
    },
    loading: {
      borderColor: 'border-indigo-500/35',
      glowShadow: 'shadow-[0_20px_50px_rgba(79,70,229,0.18),0_0_0_1px_rgba(99,102,241,0.25)]',
      iconBg: 'bg-indigo-500/15',
      iconBorder: 'border-indigo-500/30',
      iconColor: 'text-indigo-400',
      progressColor: 'bg-gradient-to-r from-indigo-500 to-purple-400',
      badgeBg: 'bg-indigo-950/60 text-indigo-400 border-indigo-800/40',
      actionBtn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/40'
    }
  }[variant];

  const renderIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping opacity-60 pointer-events-none" />
            <div className={`w-9 h-9 rounded-xl ${config.iconBg} ${config.iconBorder} border flex items-center justify-center shrink-0`}>
              <CheckCircle2 className={`w-5 h-5 ${config.iconColor} stroke-[2.5]`} />
            </div>
          </div>
        );
      case 'error':
        return (
          <div className={`w-9 h-9 rounded-xl ${config.iconBg} ${config.iconBorder} border flex items-center justify-center shrink-0`}>
            <AlertCircle className={`w-5 h-5 ${config.iconColor} stroke-[2.5]`} />
          </div>
        );
      case 'warning':
        return (
          <div className={`w-9 h-9 rounded-xl ${config.iconBg} ${config.iconBorder} border flex items-center justify-center shrink-0`}>
            <AlertTriangle className={`w-5 h-5 ${config.iconColor} stroke-[2.5]`} />
          </div>
        );
      case 'loading':
        return (
          <div className={`w-9 h-9 rounded-xl ${config.iconBg} ${config.iconBorder} border flex items-center justify-center shrink-0`}>
            <Loader2 className={`w-5 h-5 ${config.iconColor} animate-spin stroke-[2.5]`} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className={`w-9 h-9 rounded-xl ${config.iconBg} ${config.iconBorder} border flex items-center justify-center shrink-0`}>
            <Info className={`w-5 h-5 ${config.iconColor} stroke-[2.5]`} />
          </div>
        );
    }
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-[420px] rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 font-sans pointer-events-auto select-none ${
        config.borderColor
      } ${config.glowShadow} ${
        isClosing ? 'toast-exit' : 'toast-enter'
      }`}
      style={{
        backgroundColor: '#0B1220F0',
        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(11, 18, 32, 0.98) 100%)'
      }}
      role="alert"
    >
      {/* Subtle top gloss highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div className="p-4 sm:p-4.5 space-y-3">
        {/* Header row: Icon, Title, and Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {renderIcon()}
            <div className="min-w-0 pt-0.5">
              <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <span className="truncate">{title}</span>
              </h4>
              {message && (
                <p className="text-xs text-slate-300/90 font-medium leading-relaxed mt-0.5 break-words">
                  {message}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close notification"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rich metadata card (for payment & booking verification) */}
        {(serviceName || amount !== undefined || bookingId) && (
          <div className="bg-slate-950/70 rounded-xl border border-slate-800/80 p-3 text-xs space-y-2">
            {serviceName && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium truncate pr-2">Service</span>
                <strong className="text-white font-semibold text-right truncate max-w-[200px]">
                  {serviceName}
                </strong>
              </div>
            )}

            {amount !== undefined && (
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 font-medium">Payment</span>
                <span className="font-black text-emerald-400 text-sm">
                  {typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount}
                </span>
              </div>
            )}

            {bookingId && (
              <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/60 pt-2">
                <span className="text-slate-400 font-medium">Booking ID</span>
                <span className="font-mono font-bold text-blue-400 tracking-wider bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/30 text-[11px]">
                  {bookingId.startsWith('#') ? bookingId : `#${bookingId}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer info & Action button */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {securityBadge ? (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{securityBadge}</span>
            </div>
          ) : <div />}

          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                handleClose();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                config.actionBtn
              }`}
            >
              <span>{action.label}</span>
              {variant === 'error' ? (
                <RotateCcw className="w-3 h-3" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Auto-dismiss decreasing progress bar */}
      {duration > 0 && variant !== 'loading' && (
        <div className="h-1 w-full bg-slate-800/60 overflow-hidden">
          <div
            className={`h-full ${config.progressColor} transition-all duration-75 ease-linear`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};
