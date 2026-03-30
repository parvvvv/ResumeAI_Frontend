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
        <linearGradient id="docGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="swirlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      {/* Document Base */}
      <path 
        d="M30 20C30 14.4772 34.4772 10 40 10H65L80 25V80C80 85.5228 75.5228 90 70 90H40C34.4772 90 30 85.5228 30 80V20Z" 
        fill="url(#docGradient)" 
      />
      
      {/* Folded Corner */}
      <path 
        d="M65 10V25H80L65 10Z" 
        fill="white" 
        fillOpacity="0.3" 
      />
      
      {/* Document Lines */}
      <rect x="40" y="32" width="22" height="3" rx="1.5" fill="white" fillOpacity="0.8" />
      <rect x="40" y="42" width="28" height="3" rx="1.5" fill="white" fillOpacity="0.8" />
      <rect x="40" y="52" width="18" height="3" rx="1.5" fill="white" fillOpacity="0.8" />
      
      {/* Swirl AI Icon */}
      <g transform="translate(30, 60)">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <path
            key={i}
            d="M0 0C5 -10 15 -10 20 0C15 10 5 10 0 0Z"
            fill="url(#swirlGradient)"
            transform={`rotate(${angle})`}
            fillOpacity="0.9"
          />
        ))}
        <circle cx="0" cy="0" r="4" fill="white" />
      </g>
      
      {/* Sparkle */}
      <path 
        d="M75 5C75 10.5228 70.5228 15 65 15C70.5228 15 75 19.4772 75 25C75 19.4772 79.4772 15 85 15C79.4772 15 75 10.5228 75 5Z" 
        fill="#0EA5E9" 
      />
    </svg>
  );
};

export default Logo;
