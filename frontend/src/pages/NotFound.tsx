import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Logo size="lg" className="justify-center mb-8" />
        <h1 className="text-white text-8xl font-extrabold mb-4">404</h1>
        <p className="text-white/40 text-lg mb-8">This page doesn't exist</p>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red text-white font-semibold text-sm hover:bg-red-hover transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
