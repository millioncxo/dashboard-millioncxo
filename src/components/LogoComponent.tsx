import React from 'react';

interface LogoComponentProps {
  className?: string;
  width?: number;
  height?: number;
  hoverGradient?: boolean;
}

export default function LogoComponent({ 
  className = "", 
  width = 100, 
  height = 55, 
  hoverGradient = false 
}: LogoComponentProps) {
  return (
    <div className={`inline-flex items-center transition-all duration-300 ${hoverGradient ? 'hover:scale-105' : ''} ${className}`}>
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 140.7 76.5" 
        className="w-auto h-auto"
      >
        <defs>
          <style>
            {`
              .logo-bg {
                fill: #0b2e2b;
                transition: all 0.3s ease;
              }
              .logo-accent {
                fill: #c4b75b;
                transition: all 0.3s ease;
              }
              .logo-light {
                fill: #f7f5f2;
                transition: all 0.3s ease;
              }
              ${hoverGradient ? `
                .logo-container:hover .logo-bg {
                  fill: url(#gradientBg);
                }
                .logo-container:hover .logo-accent {
                  fill: url(#gradientAccent);
                }
                .logo-container:hover .logo-light {
                  fill: url(#gradientLight);
                }
              ` : ''}
            `}
          </style>
          {hoverGradient && (
            <>
              <linearGradient id="gradientBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#0b2e2b', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#21514e', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#668b77', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="gradientAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#c4b75b', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#e8d875', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#c4b75b', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="gradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#f7f5f2', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#f7f5f2', stopOpacity: 1 }} />
              </linearGradient>
            </>
          )}
        </defs>
        <g className="logo-container">
          <path className="logo-bg" d="M102.6,3.1H38.2C18.8,3.1,3.1,18.9,3.1,38.3s15.7,35.1,35,35.1h64.4c19.3,0,35-15.7,35-35.1S121.9,3.1,102.6,3.1Z"/>
          <path className="logo-bg" d="M73.2,30h0l8.2,8.2-8.2-8.2Z"/>
          <path className="logo-accent" d="M129.4,38.3c0,7.2-2.7,13.9-7.8,19-5.2,5.2-12.1,7.8-18.9,7.8s-13.7-2.6-18.9-7.8l-10.6-10.7h0l-8.2-8.2-10.6-10.7c-2.9-2.9-6.6-4.4-10.6-4.4v-11.7c7.1,0,13.8,2.7,18.9,7.8l18.9,19,10.6,10.5c5.9,5.9,15.4,5.9,21.3,0,2.8-2.8,4.4-6.6,4.4-10.6s-1.6-7.8-4.4-10.7c-5.7-5.7-15.6-5.7-21.3,0l-2.4,2.4h-16.4l10.6-10.7c10.4-10.5,27.3-10.5,37.7,0,5.1,5.1,7.8,11.8,7.8,19h0Z"/>
          <path className="logo-light" d="M38.1,65.1c-7.1,0-13.8-2.8-18.9-7.8s-7.8-11.8-7.8-19,2.8-13.9,7.8-19c5-5.1,11.7-7.8,18.9-7.8v11.7c-4,0-7.8,1.6-10.6,4.4-5.9,5.9-5.9,15.5,0,21.3,2.8,2.8,6.6,4.4,10.6,4.4v11.7h0Z"/>
          <path className="logo-light" d="M73.1,46.5l-10.6,10.7c-5,5.1-11.7,7.8-18.9,7.8v-11.7c4,0,7.8-1.6,10.6-4.4l2.4-2.3h16.5Z"/>
        </g>
      </svg>
    </div>
  );
}

