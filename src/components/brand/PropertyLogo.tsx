import React from "react";

interface PropertyLogoProps {
  variant?: "horizontal" | "vertical" | "icon_only" | "badge";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  theme?: "gold" | "white" | "negative";
  showTagline?: boolean;
}

/**
 * Isotipo Oficial de Property OS:
 * Casa geométrica con espiral interior que forma la letra "P".
 * Basado en la Ficha Oficial de Marca.
 */
export const PropertyIcon: React.FC<{ size?: number; className?: string; theme?: "gold" | "white" | "dark" }> = ({
  size = 36,
  className = "",
  theme = "gold",
}) => {
  const isGold = theme === "gold";
  const isWhite = theme === "white";

  const fillColor = isGold ? "#D4AF37" : isWhite ? "#FFFFFF" : "#0B0D12";
  const bgCircle = isGold
    ? "url(#gold-gradient-logo)"
    : isWhite
    ? "#FFFFFF"
    : "#0B0D12";
  const strokeInner = isGold ? "#0B0D12" : isWhite ? "#0B0D12" : "#D4AF37";

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
        <linearGradient id="gold-gradient-logo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0C2" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#996515" />
        </linearGradient>
      </defs>

      {/* Círculo dorado exterior */}
      <circle cx="50" cy="50" r="48" fill={bgCircle} />

      {/* Trazado geométrico de la Casa + P concéntrica */}
      {/* Techo y silueta exterior de la casa */}
      <path
        d="M50 18 L76 38 V78 H60 V48 L50 40 L38 48 V78 H24 V38 Z"
        fill={strokeInner}
      />

      {/* Espiral interna 'P' */}
      <path
        d="M38 52 H58 V70 H46 V62 H50 V58 H46 V78 H38 Z"
        fill={strokeInner}
      />
    </svg>
  );
};

/**
 * Isotipo Lineal de alta fidelidad basado exactamente en la Ficha de Marca
 */
export const PropertySymbolLinear: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 32,
  className = "",
  color = "#D4AF37",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Contorno exterior tipo casa */}
      <path
        d="M50 14 L82 36 V84 H18 V36 L50 14 Z"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Espiral geométrica interior formando la P */}
      <path
        d="M36 84 V46 L50 36 L64 46 V66 H48 V54 H54"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const sizeMap = {
    sm: { icon: 28, text: "text-base", sub: "text-[9px]" },
    md: { icon: 38, text: "text-xl", sub: "text-[10px]" },
    lg: { icon: 48, text: "text-2xl", sub: "text-xs" },
    xl: { icon: 64, text: "text-4xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  if (variant === "icon_only") {
    return <PropertyIcon size={currentSize.icon} theme={theme} className={className} />;
  }

  if (variant === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <PropertyIcon size={currentSize.icon * 1.5} theme={theme} />
        <div>
          <div className={`font-['Poppins'] font-semibold tracking-tight text-white ${currentSize.text} leading-none`}>
            propert<span className="text-[#D4AF37]">y</span>
          </div>
          {showTagline && (
            <p className={`text-slate-400 font-['Poppins'] mt-1 tracking-widest uppercase ${currentSize.sub}`}>
              Real Estate Operating System
            </p>
          )}
        </div>
      </div>
    );
  }

  // Variant Horizontal (Default)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PropertyIcon size={currentSize.icon} theme={theme} />
      <div className="flex flex-col">
        <div className={`font-['Poppins'] font-semibold tracking-tight text-white ${currentSize.text} leading-none flex items-center`}>
          propert<span className="text-[#D4AF37]">y</span>
          <span className="ml-1.5 px-1.5 py-0.2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[9px] font-mono font-bold rounded">
            OS
          </span>
        </div>
        {showTagline && (
          <span className={`text-[9px] text-[#D4AF37] font-['Poppins'] tracking-wider uppercase mt-0.5`}>
            Catálogo & CRM Inmobiliario
          </span>
        )}
      </div>
    </div>
  );
};
