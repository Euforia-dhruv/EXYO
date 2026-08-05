interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWord?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showWord = true, className = '' }: LogoProps) {
  const iconSizes = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-12 h-12' };
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${iconSizes[size]} rounded-xl bg-red flex items-center justify-center shadow-lg shadow-red/20`}>
        <span className="text-white font-extrabold text-sm leading-none">E</span>
      </div>
      {showWord && (
        <span className={`${textSizes[size]} font-extrabold tracking-tight text-white`}>
          EXYO
        </span>
      )}
    </div>
  );
}
