import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Full-screen movie backdrop with gradient overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `
            linear-gradient(to bottom right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%),
            linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)
          `,
        }}
      >
        {/* Subtle animated gradient overlay for premium feel */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red/5 rounded-full blur-[80px]" style={{ animationDelay: '2s' }} />
        </div>
      </div>

        {/* EXYO logo in top-left corner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-6 left-6 z-20"
      >
        <img src="https://exyo.cc.cd/logo-full.png" alt="EXYO" className="h-10 object-contain" />
      </motion.div>

      {/* Centered glassmorphism panel */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        className="relative z-20 w-full max-w-md mx-4"
      >
        {/* Main auth panel */}
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
           <div className="text-center mb-8">
             <motion.img
               src="https://exyo.cc.cd/logo-full.png"
               alt="EXYO"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className="h-12 mx-auto mb-2 object-contain"
             />
             <p className="text-white/40 text-sm">Sign in to continue watching</p>
           </div>

          {/* Clerk SignIn with custom styling */}
          <SignIn
            appearance={{
              layout: {
                socialLogLevel: 'none',
                logo: 'https://exyo.cc.cd/logo-e.png',
              },
              variables: {
                colorPrimary: '#E50914',
                colorText: '#ffffff',
                colorTextSecondary: '#9ca3af',
                colorBackground: 'transparent',
                colorBorder: '#1f1f1f',
                colorInputBackground: 'rgba(255,255,255,0.04)',
                colorInputBorder: 'rgba(255,255,255,0.08)',
                colorInputText: '#ffffff',
                colorInputTextPlaceholder: '#6b7280',
                colorDanger: '#E50914',
                colorDangerText: '#ffffff',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              },
              elements: {
                rootBox: 'w-full',
                card: 'bg-transparent shadow-none border-0',
                headerTitle: 'text-white text-xl font-bold mb-1',
                headerSubtitle: 'text-white/40 text-sm',
                // Form button - bold red pill with hover animation
                formButtonPrimary:
                  'bg-red text-white font-semibold rounded-2xl py-3.5 text-sm transition-all duration-200 transform hover:scale-105 hover:bg-red-hover focus:outline-none focus:ring-2 focus:ring-red/50 focus:ring-offset-2',
                // Form inputs - dark background, light text, glowing focus
                formFieldInput: `
                  bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm
                  transition-all duration-200
                  focus:outline-none focus:border-red focus:shadow-[0_0_0_2px_rgba(229,9,20,0.3)]
                  placeholder-white/20
                `,
                formFieldLabel: 'text-white/50 text-xs font-medium mb-1.5',
                // Social buttons
                socialButtonsBlockButton: `
                  bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/80 text-sm
                  hover:bg-white/[0.08] hover:text-white transition-all duration-200
                  flex items-center justify-center gap-2
                `,
                socialButtonsBlockStart: 'pb-2',
                socialButtonLeadingSvg: 'w-5 h-5',
                socialButtonText: 'text-xs',
                dividerLine: 'bg-white/[0.06]',
                dividerText: 'text-white/20 text-xs px-3',
                footerActionText: 'text-white/50 text-sm',
                footerActionLink: 'text-red hover:text-red-hover transition-colors',
                // Alternative links styling
                alternativeLink:
                  'text-red hover:text-red-hover text-sm transition-colors',
                // Form field wrapper
                formFieldWrapper: 'mb-4 last:mb-0',
                formField: 'mb-4 last:mb-0',
              },
            }}
          />
        </div>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-white/30 text-sm mt-6"
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-red hover:text-red-hover transition-colors font-medium"
          >
            Sign up
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
