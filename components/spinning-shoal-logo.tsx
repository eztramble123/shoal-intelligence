'use client';

import Image from 'next/image';

interface SpinningShoalLogoProps {
  size?: number;
  className?: string;
}

export function SpinningShoalLogo({ size = 32, className = '' }: SpinningShoalLogoProps) {
  return (
    <div 
      className={`spinning-logo ${className}`}
      style={{
        display: 'inline-block',
        animation: 'spin 1.5s linear infinite'
      }}
    >
      <Image 
        src="/white_shoal.svg" 
        alt="Shoal" 
        width={size} 
        height={size} 
        priority
      />
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .spinning-logo {
          display: inline-block;
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}