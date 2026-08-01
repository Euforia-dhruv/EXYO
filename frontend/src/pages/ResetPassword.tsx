import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/Toast';
import { validatePassword } from '../utils/validation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-exyo-dark px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-exyo-red text-4xl font-bold tracking-wider mb-8">EXYO</h1>
          <div className="bg-exyo-secondary p-8 rounded-lg shadow-xl">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-400 mb-4">Invalid or missing reset token</p>
            <Link to="/forgot-password" className="text-white hover:underline">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setIsSuccess(true);
      showToast('Password reset successful!', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to reset password';
      showToast(message, 'error');
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-exyo-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-exyo-red text-4xl font-bold tracking-wider">EXYO</h1>
        </div>

        <div className="bg-exyo-secondary p-8 rounded-lg shadow-xl">
          {!isSuccess ? (
            <>
              <h2 className="text-2xl font-semibold mb-2">Set New Password</h2>
              <p className="text-exyo-gray text-sm mb-6">
                Enter your new password below.
              </p>

              {errors.general && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-sm text-red-400">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                      errors.newPassword ? 'border-red-500' : 'border-exyo-hover'
                    }`}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                  )}
                  <p className="mt-1 text-xs text-exyo-gray">
                    Min 8 chars, uppercase, lowercase, number
                  </p>
                </div>

                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className={`w-full bg-exyo-dark border rounded px-4 py-3 text-white placeholder-exyo-gray focus:outline-none focus:border-white/40 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-exyo-hover'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
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
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Password Reset!</h2>
              <p className="text-exyo-gray mb-6">
                Your password has been reset successfully.
              </p>
              <p className="text-exyo-gray text-sm">
                Redirecting to login...
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-exyo-hover text-center text-sm text-exyo-gray">
            <Link to="/login" className="text-white hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
