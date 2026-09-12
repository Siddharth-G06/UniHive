import React from "react";

export default function BrandLogo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="10" y1="8" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {/* Hexagon Shield */}
      <polygon
        points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
        fill="url(#logoGrad)"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Modern Inner U/H Node Symbol */}
      <path
        d="M10 11V20C10 22.2 11.8 24 14 24H18C20.2 24 22 22.2 22 20V11"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="14" r="2.5" fill="url(#accentGrad)" />
      <line x1="10" y1="16" x2="22" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
