import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Heart shape */}
      <path
        d="M20 36C19.5625 36 19.125 35.8545 18.7781 35.5636C17.2195 34.3455 15.7453 33.1939 14.4195 32.1485L14.4133 32.1439C11.4523 29.7649 8.87658 27.7097 7.05078 25.6935C5.04297 23.4652 4 21.3742 4 19.0909C4 16.8864 4.77578 14.8576 6.19336 13.4273C7.62891 11.9818 9.64453 11.1818 11.8125 11.1818C13.4 11.1818 14.8344 11.6742 16.0734 12.649C16.7031 13.1424 17.2773 13.7333 17.7891 14.4121C18.5469 13.7333 19.1211 13.1424 19.7508 12.649C20.9898 11.6742 22.4242 11.1818 24.0117 11.1818C26.1797 11.1818 28.1953 11.9818 29.6309 13.4273C31.0484 14.8576 31.8242 16.8864 31.8242 19.0909C31.8242 21.3742 30.7812 23.4652 28.7734 25.6935C26.9477 27.7097 24.3719 29.7649 21.4109 32.1439L21.3984 32.1545C20.0781 33.1955 18.6047 34.3467 17.0461 35.5636C16.6992 35.8545 16.2617 36 15.8242 36H20Z"
        fill="url(#paint0_linear_6_8)"
      />
      
      {/* Medical cross */}
      <rect x="18" y="15" width="4" height="12" rx="1" fill="white" />
      <rect x="14" y="19" width="12" height="4" rx="1" fill="white" />
      
      <defs>
        <linearGradient
          id="paint0_linear_6_8"
          x1="4"
          y1="11.1818"
          x2="31.8242"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}