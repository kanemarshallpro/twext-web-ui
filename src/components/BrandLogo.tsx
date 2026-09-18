import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  // Height classes that maintain the exact ~4.8:1 aspect ratio of the official Twext vector logo
  const sizeClasses = {
    sm: showText ? 'h-6 w-auto' : 'h-6 w-5',
    md: showText ? 'h-8 w-auto' : 'h-8 w-6',
    lg: showText ? 'h-10 w-auto' : 'h-10 w-8',
    xl: showText ? 'h-12 w-auto' : 'h-12 w-9',
  };

  if (!showText) {
    // Icon-only mode: the Twext lightning bolt
    return (
      <svg
        viewBox="0 0 72 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} ${className} shrink-0 select-none`}
        aria-label="Twext Mark"
      >
        <polygon
          points="35,8 52,6 70,46 44,46 0,94 28,54 16,54"
          fill="#E59C5D"
        />
      </svg>
    );
  }

  // Full-width Twext logo matching the uploaded SVG
  return (
    <svg
      viewBox="0 0 460 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} ${className} shrink-0 select-none`}
      role="img"
      aria-label="Twext"
    >
      {/* Peach-orange lightning bolt */}
      <polygon
        points="35,8 52,6 70,46 44,46 0,94 28,54 16,54"
        fill="#E59C5D"
      />

      {/* Retro pixelated Twext wordmark */}
      <g fill="#9F75CD" shapeRendering="crispEdges">
        {/* --- T --- */}
        {/* Left top serif/drop */}
        <rect x="66" y="8" width="12" height="16" />
        {/* Main top crossbar */}
        <rect x="78" y="0" width="46" height="22" />
        {/* Central stem */}
        <rect x="90" y="22" width="22" height="71" />

        {/* --- w --- */}
        {/* Left vertical arm */}
        <rect x="130" y="22" width="20" height="71" />
        {/* Left valley steps */}
        <rect x="150" y="36" width="6" height="14" />
        <rect x="156" y="50" width="6" height="14" />
        <rect x="150" y="64" width="18" height="29" />
        {/* Center vertical arm */}
        <rect x="164" y="22" width="20" height="71" />
        {/* Right valley steps */}
        <rect x="184" y="36" width="6" height="14" />
        <rect x="190" y="50" width="6" height="14" />
        <rect x="184" y="64" width="18" height="29" />
        {/* Right vertical arm */}
        <rect x="198" y="22" width="20" height="71" />

        {/* --- e --- */}
        {/* Left spine */}
        <rect x="226" y="30" width="20" height="55" />
        {/* Top arch */}
        <rect x="236" y="22" width="46" height="16" />
        <rect x="274" y="30" width="16" height="16" />
        {/* Middle crossbar */}
        <rect x="236" y="46" width="54" height="16" />
        {/* Bottom arch */}
        <rect x="236" y="77" width="46" height="16" />
        {/* Bottom right upward lip */}
        <rect x="274" y="65" width="16" height="28" />

        {/* --- x --- */}
        {/* Top-left branch */}
        <rect x="300" y="22" width="18" height="16" />
        <rect x="312" y="36" width="12" height="12" />
        {/* Top-right branch */}
        <rect x="352" y="22" width="18" height="16" />
        <rect x="344" y="36" width="12" height="12" />
        {/* Center intersection */}
        <rect x="322" y="46" width="26" height="22" />
        {/* Bottom-left branch */}
        <rect x="312" y="66" width="12" height="12" />
        <rect x="300" y="77" width="18" height="16" />
        {/* Bottom-right branch */}
        <rect x="344" y="66" width="12" height="12" />
        <rect x="352" y="77" width="18" height="16" />

        {/* --- t --- */}
        {/* Top ascender */}
        <rect x="398" y="2" width="18" height="20" />
        {/* Crossbar */}
        <rect x="380" y="22" width="54" height="16" />
        {/* Lower vertical stem */}
        <rect x="398" y="38" width="18" height="39" />
        {/* Bottom right-turned foot */}
        <rect x="398" y="77" width="34" height="16" />
        <rect x="424" y="67" width="16" height="26" />
      </g>
    </svg>
  );
};
