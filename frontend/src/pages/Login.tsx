import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Login() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center" />
          <p className="text-white/40 text-sm mt-4">Sign in to continue watching</p>
        </div>

        <div className="glass glass-border rounded-3xl p-8">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white text-lg font-bold',
                headerSubtitle: 'text-white/40 text-sm',
                formButtonPrimary: 'bg-red hover:bg-red-hover text-white font-semibold rounded-xl py-3',
                formFieldInput: 'bg-white/[0.04] border-white/[0.08] rounded-xl text-white',
                formFieldLabel: 'text-white/50 text-sm',
                socialButtonsBlockButton: 'bg-white/[0.04] border-white/[0.08] rounded-xl text-white/70',
                dividerLine: 'bg-white/[0.06]',
                dividerText: 'text-white/30',
                footerActionLink: 'text-red hover:text-red-hover',
              },
            }}
          />
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-red hover:text-red-hover transition-colors">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
