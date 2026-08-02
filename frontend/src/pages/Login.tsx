import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="full" className="h-12 mx-auto" />
        </div>
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-[#141414] border border-white/10 shadow-none',
                headerTitle: 'text-white text-xl font-semibold',
                headerSubtitle: 'text-gray-400',
                socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
                socialButtonsBlockButtonText: 'text-white font-medium',
                dividerLine: 'bg-white/10',
                dividerText: 'text-gray-500',
                formFieldLabel: 'text-gray-400',
                formFieldInput: 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/20',
                formButtonPrimary: 'bg-[#E50914] hover:bg-red-700 text-white font-semibold',
                footerActionLink: 'text-[#E50914] hover:text-red-400',
                identityPreviewEditButton: 'text-[#E50914]',
              },
            }}
          />
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-white hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
