import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/Toast';
import { validateEmail } from '../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
      showToast('Reset link sent to your email', 'success');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to send reset email';
      showToast(message, 'error');
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
          {!isSubmitted ? (
            <>
              <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
              <p className="text-exyo-gray text-sm mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

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
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
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
              <h2 className="text-2xl font-semibold mb-2">Check Your Email</h2>
              <p className="text-exyo-gray mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-exyo-gray text-sm mb-6">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="text-white hover:underline"
              >
                Try a different email
              </button>
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
