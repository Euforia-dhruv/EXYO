import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import Logo from '../components/Logo';

export default function About() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Info className="w-5 h-5 text-white/40" />
        </div>
        <h1 className="text-white text-2xl font-extrabold tracking-tight">About</h1>
      </div>

      <div className="glass glass-border rounded-3xl p-10">
        <Logo size="lg" className="mb-6" />
        <h2 className="text-white text-xl font-bold mb-2">EXYO</h2>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          A premium streaming platform that aggregates free content from multiple sources.
          Movies, series, anime — all in one place.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {['React 19', 'Vite', 'Tailwind CSS', 'Convex', 'Google OAuth', 'HLS.js', 'movi-player', 'WebCodecs'].map((tech) => (
            <div key={tech} className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] text-white/50 text-sm">
              {tech}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
