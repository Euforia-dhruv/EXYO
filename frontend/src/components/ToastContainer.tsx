import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from './Toast';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};
const COLORS = {
  success: 'text-emerald-400',
  error: 'text-red',
  info: 'text-blue-400',
  warning: 'text-amber-400',
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto glass glass-border rounded-2xl px-5 py-3.5 flex items-center gap-3 min-w-[280px] max-w-[420px] card-shadow"
            >
              <Icon className={`w-5 h-5 shrink-0 ${COLORS[t.type]}`} />
              <p className="text-sm text-white/90 flex-1">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-white/30 hover:text-white/60 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
