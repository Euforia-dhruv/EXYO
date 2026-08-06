import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: codeResponse.access_token }),
        });

        if (!res.ok) throw new Error('Auth failed');

        const data = await res.json();
        setAuth(data.user, data.token);
        navigate('/home');
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      alert('Google login failed. Please try again.');
    },
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `
            linear-gradient(to bottom right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.85) 100%),
            linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)
          `,
        }}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red/5 rounded-full blur-[80px]" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute top-6 left-6 z-20"
      >
        <img src="https://exyo.cc.cd/logo-full.png" alt="EXYO" className="h-10 object-contain" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        className="relative z-20 w-full max-w-md mx-4"
      >
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10">
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

          <button
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-base hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red/50 focus:ring-offset-2 focus:ring-offset-black"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.36c-.24 1.28-.93 2.37-1.99 3.09v2.58h3.22c1.89-1.74 2.98-4.3 2.98-7.35z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.22-2.58c-.9.6-2.04.96-3.28.96-2.53 0-4.68-1.71-5.44-4.03H4.87v2.54C6.39 20.78 9.03 23 12 23z"/>
              <path fill="#FBBC05" d="M6.53 13.7c-.17-.55-.27-1.14-.27-1.75 0-.61.1-1.2.27-1.75L4.87 7.47C3.39 9.45 2.5 11.77 2.5 14.25c0 2.48 1.04 4.8 2.33 6.78l2.76-2.43z"/>
              <path fill="#EA4335" d="M12 4.75c1.63 0 3.12.56 4.29 1.66l3.21-3.21C17.46 1.16 14.97 0.5 12 0.5 7.04 0.5 3.07 3.38 1.23 7.47l3.28 2.54c.83-2.48 3.12-4.03 5.49-4.03z"/>
            </svg>
            Sign in with Google
          </button>

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
        </div>
      </motion.div>
    </div>
  );
}
