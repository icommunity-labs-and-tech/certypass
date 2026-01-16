'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function Logo({ 
  href = '/dashboard', 
  width = 120, 
  height = 40,
  className = '',
  priority = false
}: LogoProps) {
  const logoElement = (
    <Image
      src="/logo.webp"
      alt="CertyPass Logo"
      width={width}
      height={height}
      style={{ objectFit: 'contain', maxWidth: '100%' }}
      priority={priority}
      className={className}
    />
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
