interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
}

export default function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src="/logo-Photoroom.png"
        alt="EXYO"
        className={className}
        draggable={false}
      />
    );
  }

  return (
    <img
      src="/Exyologo-Photoroom.png"
      alt="EXYO"
      className={className}
      draggable={false}
    />
  );
}
