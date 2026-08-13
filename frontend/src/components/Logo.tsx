import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWord?: boolean;
  className?: string;
  animate?: boolean;
}

export default function Logo({ size = 'md', showWord = true, className = '', animate = false }: LogoProps) {
  const iconSizes = { sm: 32, md: 40, lg: 56 };
  const iconPx = iconSizes[size];

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3 } }
    : {};

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Wrapper {...wrapperProps} className="relative shrink-0">
        <img
          src="/logo-Photoroom.png"
          alt="EXYO"
          width={iconPx}
          height={iconPx}
          className="object-contain"
          style={{ width: iconPx, height: iconPx }}
        />
      </Wrapper>
      {showWord && (
        <img
          src="/Exyologo-Photoroom.png"
          alt="EXYO"
          className={`object-contain h-${size === 'sm' ? 6 : size === 'md' ? 7 : 10}`}
          style={{ height: size === 'sm' ? 24 : size === 'md' ? 28 : 40 }}
        />
      )}
    </div>
  );
}

export function ELogo({ size = 32, className = '', animate = false }: { size?: number; className?: string; animate?: boolean }) {
  return (
    <motion.img
      src="/logo-Photoroom.png"
      alt="EXYO"
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className}`}
      style={{ width: size, height: size }}
      animate={animate ? { rotate: 360 } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  );
}

export function Wordmark({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const heights = { sm: 24, md: 28, lg: 40, xl: 56 };
  return (
    <img
      src="/Exyologo-Photoroom.png"
      alt="EXYO"
      className={`object-contain shrink-0 ${className}`}
      style={{ height: heights[size] }}
    />
  );
}
