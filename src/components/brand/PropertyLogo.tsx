import React, { useState } from "react";

interface PropertyLogoProps {
  variant?: "horizontal" | "vertical" | "icon_only" | "badge";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  theme?: "gold" | "white" | "negative";
  showTagline?: boolean;
}

/**
 * Isotipo Oficial de Property OS (Imagen 3D de alta fidelidad con fallback SVG)
 */
export const PropertyIcon: React.FC<{ size?: number; className?: string; theme?: "gold" | "white" | "dark" }> = ({
  size = 38,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/logo.b.png"
        alt="Property Logo"
        width={size}
        height={size}
        className={`object-contain rounded-full drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)] shrink-0 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

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
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0C2" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#996515" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#gold-grad)" />
      <path
        d="M50 16 L78 38 V80 H22 V38 Z"
        stroke="#0B0D12"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M36 80 V48 L50 38 L64 48 V64 H48 V52 H54"
        stroke="#0B0D12"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

/**
 * Componente Principal del Logotipo Property OS
 */
export const PropertyLogo: React.FC<PropertyLogoProps> = ({
  variant = "horizontal",
  size = "md",
  className = "",
  theme = "gold",
  showTagline = false,
}) => {
  const [horizontalImgError, setHorizontalImgError] = useState(false);

  const sizeHeightMap = {
    sm: "h-7",
    md: "h-9",
    lg: "h-12",
    xl: "h-16",
  };

  const iconSizeMap = {
    sm: 30,
    md: 38,
    lg: 52,
    xl: 72,
  };

  if (variant === "icon_only") {
    return <PropertyIcon size={iconSizeMap[size]} theme={theme} className={className} />;
  }

  if (variant === "horizontal" && !horizontalImgError) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src="/logo.a.png"
          alt="property"
          className={`${sizeHeightMap[size]} object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]`}
          onError={() => setHorizontalImgError(true)}
        />
        <span className="px-1.5 py-0.2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[9px] font-mono font-bold rounded">
          OS
        </span>
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <PropertyIcon size={iconSizeMap[size]} theme={theme} />
        <div>
          <div className="font-['Poppins'] font-bold tracking-tight text-white text-2xl md:text-3xl leading-none">
            propert<span className="text-[#D4AF37]">y</span>
            <span className="ml-1.5 px-1.5 py-0.2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[10px] font-mono font-bold rounded align-middle">
              OS
            </span>
          </div>
          {showTagline && (
            <p className="text-slate-400 font-['Poppins'] mt-2 tracking-widest uppercase text-xs font-semibold">
              Real Estate Operating System
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback Horizontal
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PropertyIcon size={iconSizeMap[size]} theme={theme} />
      <div className="flex flex-col">
        <div className="font-['Poppins'] font-bold tracking-tight text-white text-lg md:text-xl leading-none flex items-center">
          propert<span className="text-[#D4AF37]">y</span>
          <span className="ml-1.5 px-1.5 py-0.2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[9px] font-mono font-bold rounded">
            OS
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] text-[#D4AF37] font-['Poppins'] tracking-wider uppercase mt-0.5 font-semibold">
            Catálogo & CRM Inmobiliario
          </span>
        )}
      </div>
    </div>
  );
};
