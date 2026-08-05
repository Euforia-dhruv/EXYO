import { memo } from 'react';

const Logo = memo(function Logo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
  };

  return (
    <a href="/" className={`flex items-center gap-2.5 group ${className}`} aria-label="EXYO Home">
      {/* Icon mark */}
      <div className={`relative ${sizeClasses[size]} aspect-square flex items-center justify-center`}>
        {/* Glow */}
        <div className="absolute inset-0 rounded-[10px] bg-exyo-red/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        {/* Shape */}
        <div className="relative w-full h-full rounded-[10px] bg-gradient-to-br from-exyo-red to-exyo-red-dark flex items-center justify-center shadow-lg group-hover:shadow-glow-red transition-shadow duration-500">
          <svg viewBox="0 0 32 32" fill="none" className="w-[55%] h-[55%]">
            <path d="M10 8L24 16L10 24V8Z" fill="white" />
          </svg>
        </div>
      </div>
      {/* Wordmark */}
      <span className="text-[22px] font-bold tracking-[0.18em] text-white select-none leading-none">
        EXYO
      </span>
    </a>
  );
});

export default Logo;
