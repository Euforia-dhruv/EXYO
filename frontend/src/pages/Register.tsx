import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 bg-exyo-dark">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-dark via-exyo-dark/80 to-exyo-dark/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-dark via-transparent to-exyo-dark/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <img
            src="/Exyologo-Photoroom.png"
            alt="EXYO"
            className="h-16 mx-auto mb-4"
            draggable={false}
          />
          <p className="text-gray-400 text-[15px]">Stream Everything</p>
        </div>

        {/* Glass panel */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <h2 className="text-2xl font-bold text-white mb-1">Create an account</h2>
          <p className="text-gray-400 text-sm mb-6">Start your streaming journey</p>

          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-transparent border-none shadow-none',
                headerTitle: 'text-white text-xl font-bold',
                headerSubtitle: 'text-gray-400',
                socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl transition-colors',
                socialButtonsBlockButtonText: 'text-white font-medium text-sm',
                dividerLine: 'bg-white/10',
                dividerText: 'text-gray-500',
                formFieldLabel: 'text-gray-400 text-sm',
                formFieldInput: 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-exyo-red/50 rounded-2xl text-sm h-12',
                formButtonPrimary: 'bg-exyo-red hover:bg-exyo-red-dark text-white font-bold rounded-2xl transition-colors h-12',
                footerActionLink: 'text-exyo-red hover:text-exyo-red-hover transition-colors',
                identityPreviewEditButton: 'text-exyo-red',
                formFieldInputShowPasswordButton: 'text-gray-400 hover:text-white',
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-exyo-red transition-colors font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
