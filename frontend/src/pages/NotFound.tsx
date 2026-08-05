import { Link } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="text-[120px] sm:text-[160px] font-bold text-white/[0.04] leading-none select-none">
          404
        </div>
        <h1 className="text-white text-[28px] font-bold tracking-tight -mt-8 mb-2">
          Page not found
        </h1>
        <p className="text-white/40 text-[14px] mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white text-[13px] font-medium transition-all duration-200 border border-white/[0.06]"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-exyo-red hover:bg-exyo-red-hover text-white text-[13px] font-semibold transition-all duration-200 shadow-lg shadow-exyo-red/20"
          >
            <HomeIcon className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
