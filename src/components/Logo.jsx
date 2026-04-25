import React from 'react';

const Logo = ({ size = 32, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      {/* Main star / spark shape */}
      <path 
        d="M50 0 C 50 40, 60 50, 100 50 C 60 50, 50 60, 50 100 C 50 60, 40 50, 0 50 C 40 50, 50 40, 50 0 Z" 
        fill="url(#sparkGrad)" 
      />
      {/* Inner core depth */}
      <path 
        d="M50 25 C 50 45, 55 50, 75 50 C 55 50, 50 55, 50 75 C 50 55, 45 50, 25 50 C 45 50, 50 45, 50 25 Z" 
        fill="#FFFFFF" 
        opacity="0.4" 
      />
    </svg>
  );
};

export default Logo;
