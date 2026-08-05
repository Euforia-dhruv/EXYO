import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 bg-exyo-black">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover opacity-25 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-exyo-black via-exyo-black/85 to-exyo-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-exyo-black via-exyo-black/40 to-exyo-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-5">
        {/* Logo */}
        <div className="text-center mb-12">
          <img
            src="/Exyologo-Photoroom.png"
            alt="EXYO"
            className="h-auto w-48 mx-auto mb-5"
            draggable={false}
          />
          <p className="text-gray-400 text-lg font-medium tracking-wide">Unlimited Entertainment</p>
        </div>

        {/* Glass panel */}
        <div className="bg-black/50 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 shadow-2xl shadow-black/60">
          <h2 className="text-[28px] font-bold text-white mb-1.5 tracking-tight">Create an account</h2>
          <p className="text-gray-400 text-[15px] mb-8">Start your streaming journey</p>

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
                socialButtonsBlockButton: 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.1] rounded-2xl transition-colors',
                socialButtonsBlockButtonText: 'text-white font-medium text-[15px]',
                dividerLine: 'bg-white/[0.08]',
                dividerText: 'text-gray-500',
                formFieldLabel: 'text-gray-400 text-[14px] font-medium',
                formFieldInput: 'bg-white/[0.06] border border-white/[0.08] text-white placeholder-gray-500 focus:border-exyo-red/50 rounded-2xl text-[15px] h-14',
                formButtonPrimary: 'bg-exyo-red hover:bg-exyo-red-dark text-white font-bold rounded-2xl transition-colors h-14 text-[15px]',
                footerActionLink: 'text-exyo-red hover:text-exyo-red-hover transition-colors',
                identityPreviewEditButton: 'text-exyo-red',
                formFieldInputShowPasswordButton: 'text-gray-400 hover:text-white',
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[15px] text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-exyo-red transition-colors font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
