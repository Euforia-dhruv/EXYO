import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';

export default function Register() {
  const navigate = useNavigate();
  const convex = useConvex();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

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
        <img src="/logo-full.png" alt="EXYO" className="h-10 object-contain" />
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
              src="/logo-full.png"
              alt="EXYO"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-12 mx-auto mb-2 object-contain"
            />
            <p className="text-white/40 text-sm">Create your account to get started</p>
          </div>

          {loading ? (
            <div className="w-full flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-white/20 border-t-red rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  const credential = credentialResponse.credential;
                  if (!credential) return;
                  setLoading(true);
                  try {
                    convex.setAuth(async () => credential);
                    const user = await convex.query(api.users.getCurrentUser);
                    if (user) {
                      setAuth({
                        id: user._id,
                        email: user.email,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl,
                      }, credential);
                      navigate('/home');
                    } else {
                      const result = await convex.mutation(api.users.syncUser);
                      if (result.ok && result.userId) {
                        const newUser = await convex.query(api.users.getCurrentUser);
                        if (newUser) {
                          setAuth({
                            id: newUser._id,
                            email: newUser.email,
                            username: newUser.username,
                            displayName: newUser.displayName,
                            avatarUrl: newUser.avatarUrl,
                          }, credential);
                          navigate('/home');
                          return;
                        }
                      }
                      alert('Failed to create account. Please try again.');
                    }
                  } catch (error) {
                    console.error('Registration error:', error);
                    alert('Registration failed. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  alert('Google login failed. Please try again.');
                }}
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
                shape="pill"
              />
            </div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center text-white/30 text-sm mt-6"
          >
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-red hover:text-red-hover transition-colors font-medium"
            >
              Sign in
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
