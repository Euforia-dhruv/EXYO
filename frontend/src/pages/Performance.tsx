import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';

export default function Performance() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Monitor className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">Performance</h1>
      </div>
      <div className="glass glass-border rounded-3xl p-8">
        <p className="text-white/40 text-sm">Hardware acceleration and decoder settings coming soon.</p>
      </div>
    </motion.div>
  );
}
