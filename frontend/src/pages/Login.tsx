import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        navigate('/home');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, password, isLoaded, loading, signIn, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] animate-fade-in-up">
        <div className="text-center mb-10">
          <Logo size="lg" className="justify-center mb-6" />
          <h1 className="text-white text-[28px] font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-white/40 text-[14px]">Sign in to continue watching</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-[14px] placeholder-white/30 focus:outline-none focus:border-exyo-red/40 focus:ring-1 focus:ring-exyo-red/20 transition-all"
            />
          </div>

          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white text-[14px] placeholder-white/30 focus:outline-none focus:border-exyo-red/40 focus:ring-1 focus:ring-exyo-red/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-exyo-red hover:bg-exyo-red-hover text-white font-semibold text-[14px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-exyo-red/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/30 text-[13px] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-exyo-red hover:text-exyo-red-hover font-medium transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
