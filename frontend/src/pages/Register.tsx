import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { validateRegisterForm } from '../utils/validation';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateRegisterForm(
      username,
      email,
      password,
      confirmPassword,
      acceptTerms
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await register(username, email, password);
      showToast('Account created successfully!', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed';
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
          <h2 className="text-2xl font-semibold mb-6">Sign Up</h2>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-sm text-red-400">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                  errors.username ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>

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
                placeholder="Password (min 8 chars, uppercase, lowercase, number)"
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                  errors.password ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-exyo-hover'
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm text-exyo-gray cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded w-4 h-4 mt-0.5"
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="text-white hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-white hover:underline">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-400">{errors.terms}</p>
              )}
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
                  Creating Account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-exyo-hover text-center text-sm text-exyo-gray">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
