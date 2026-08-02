import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-exyo-dark px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/Exyologo-Photoroom.png"
            alt="EXYO"
            className="h-12 mx-auto"
            draggable={false}
          />
        </div>

        {/* Auth card */}
        <div className="bg-exyo-secondary/80 backdrop-blur-sm border border-exyo-border rounded-netflix overflow-hidden shadow-2xl shadow-black/50">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-transparent border-none shadow-none',
                headerTitle: 'text-white text-2xl font-bold',
                headerSubtitle: 'text-exyo-muted',
                socialButtonsBlockButton: 'bg-white/5 border border-exyo-border text-white hover:bg-white/10 rounded-netflix transition-colors',
                socialButtonsBlockButtonText: 'text-white font-medium text-sm',
                dividerLine: 'bg-exyo-border',
                dividerText: 'text-exyo-muted',
                formFieldLabel: 'text-exyo-muted text-sm',
                formFieldInput: 'bg-exyo-secondary border border-exyo-border text-white placeholder-exyo-muted focus:border-white/30 rounded-netflix text-sm',
                formButtonPrimary: 'bg-exyo-red hover:bg-exyo-red-dark text-white font-bold rounded-netflix transition-colors',
                footerActionLink: 'text-exyo-red hover:text-exyo-red-hover transition-colors',
                identityPreviewEditButton: 'text-exyo-red',
                formFieldInputShowPasswordButton: 'text-exyo-muted hover:text-white',
              },
            }}
          />
        </div>

        {/* Footer text */}
        <div className="mt-6 text-center text-sm text-exyo-muted">
          New to EXYO?{' '}
          <Link to="/register" className="text-white hover:underline font-medium">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
