import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { validateLoginForm } from '../utils/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateLoginForm(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await login(email, password);
      showToast('Welcome back!', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed';
      showToast(message, 'error');
      setErrors({ general: message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-exyo-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-exyo-red text-4xl font-bold tracking-wider">EXYO</h1>
        </div>

        <div className="bg-exyo-secondary p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6">Sign In</h2>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-sm text-red-400">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                  errors.email ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                  errors.password ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-exyo-gray cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded w-4 h-4"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-exyo-gray hover:text-white transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-exyo-red text-white py-3 rounded font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-exyo-hover text-center text-sm text-exyo-gray">
            New to EXYO?{' '}
            <Link to="/register" className="text-white hover:underline font-medium">
              Sign up now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
