import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const BrandLogos = {
  youtube: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path
        d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.5 12 3.5 12 3.5s-7.517 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.483 20.5 12 20.5 12 20.5s7.517 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
        fill="#FF0000"
      />
      <polygon points="9.545,8.432 9.545,15.568 15.818,12" fill="#FFFFFF" />
    </svg>
  ),

  x: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  ),

  tiktok: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-4.01-1.68-.88-.71-1.58-1.64-2.01-2.69-.02 1.93-.01 3.86-.01 5.79 0 2.44-.8 4.9-2.58 6.57-1.74 1.66-4.22 2.44-6.58 2.12-2.57-.35-5.01-2.21-5.74-4.74-.9-3.07.41-6.66 3.16-8.21 1.78-.99 3.94-1.19 5.86-.53v4.16c-1.3-.53-2.83-.34-3.95.53-1.13.88-1.57 2.49-1.07 3.86.49 1.34 1.96 2.26 3.39 2.12 1.41-.13 2.68-1.24 2.87-2.65.09-1.26.04-2.52.05-3.78 0-4.63-.01-9.26-.01-13.89z" />
    </svg>
  ),

  facebook: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#1877F2"
      />
    </svg>
  ),

  instagram: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),

  linkedin: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path
        d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
        fill="#0A66C2"
      />
    </svg>
  ),

  openai: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M22.286 9.429a3.844 3.844 0 0 0-.295-.8l1.371-.793a5.41 5.41 0 0 1 .414 1.134H22.286zm-.595-1.619a3.85 3.85 0 0 0-.485-.71L22.22 6.01a5.4 5.4 0 0 1 .684 1.006l-1.213.794zM19.53 5.492a3.81 3.81 0 0 0-.662-.547l.792-1.373a5.413 5.413 0 0 1 .932.77l-1.062 1.15zM17.91 4.897a3.812 3.812 0 0 0-.79-.323v-1.59a5.372 5.372 0 0 1 1.114.456l-.324 1.457zM15.429 4.314v1.59a3.814 3.814 0 0 0-.853-.024l-.794-1.371a5.413 5.313 0 0 1 1.2.02l.447-.215zm-2.43 1.25c-.295-.047-.594-.047-.89 0l-.792-1.371a5.404 5.404 0 0 1 1.256-.057c.143.012.285.031.426.057zm1.18 5.76a2.057 2.057 0 0 1 .64.407l1.01-1.2C14.18 9.53 12.87 9.51 11.75 10.51l.88 1.48c.18-.54.60-.96 1.18-1.22zm1.88 4.33l1.45.62c.7-1.42.06-3.14-1.42-3.85l-.76 1.55c.48.24.81.74.73 1.68z" />
      <path
        d="M21.36 11.112c.038-.371.038-.748 0-1.119l1.545-.49a5.37 5.37 0 0 1 0 2.1l-1.545-.49zm-1.87 3.518a3.81 3.81 0 0 0 .19-.824l1.556.324a5.38 5.38 0 0 1-.26 1.157l-1.486-.657z"
        fill="#10A37F"
      />
    </svg>
  ),

  gemini: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <g>
        <path
          d="M12 2c-.1 3.1-2.6 5.6-5.7 5.7h-.1C3.1 7.8.6 10.3.5 13.4v.1c.1 3.1 2.6 5.6 5.7 5.7h.1c3.1-.1 5.6-2.6 5.7-5.7V13.4c.1-3.1 2.6-5.6 5.7-5.7h.1c3.1.1 5.6 2.6 5.7 5.7v.1c-.1 3.1-2.6 5.6-5.7 5.7h-.1c-3.1-.1-5.6-2.6-5.7-5.7M12 1.5A10.5 10.5 0 0 0 1.5 12h.1A10.5 10.5 0 0 0 12 22.5h.1A10.5 10.5 0 0 0 22.5 12h-.1A10.5 10.5 0 0 0 12 1.5"
          fill="url(#geminiGrad)"
        />
        <path
          d="M12 11.5c.1-2.2 1.9-4 4.1-4.1h.1c-2.2.1-4.1 1.9-4.2 4.1m-.1-4.1A4.2 4.2 0 0 0 7.7 11.4h-.1C9.8 11.3 11.6 9.5 11.7 7.3m.1 4.1a4.2 4.2 0 0 0 4.1 4.1h.1c-2.2-.1-4.1-1.9-4.2-4.1m-.1 4.1a4.2 4.2 0 0 0-4.1-4.1h-.1c2.2.1 4.1 1.9 4.2 4.1"
          fill="url(#geminiGrad)"
        />
      </g>
      <defs>
        <linearGradient id="geminiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B51E0" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
      </defs>
    </svg>
  ),

  claude: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <g fill="#D97706">
        <path d="M12 2.5a3 3 0 00-3 3v4.672a9.034 9.034 0 011.5-.672V5.5a1.5 1.5 0 013 0v4a1.5 1.5 0 003 0v-4a3 3 0 00-3-3zM5.5 8.5a3 3 0 00-3 3v4.672c.453-.292.956-.519 1.5-.672v-4a1.5 1.5 0 013 0v4a1.5 1.5 0 003 0v-4a3 3 0 00-3-3z" />
        <circle cx="12" cy="14" r="4.5" fill="#FBBF24" opacity="0.95" />
        <path d="M12 18.25a4.25 4.25 0 1 1 0-8.5 4.25 4.25 0 0 1 0 8.5zm0-1.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5z" />
      </g>
    </svg>
  ),

  runway: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path
        d="M2 2h6v20H2V2zm14 0h6v20h-6V2zm-7 6h6v8H9V8z"
        fill="#E11D48"
      />
    </svg>
  ),

  elevenlabs: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <g fill="#0EA5E9">
        <rect x="2" y="6" width="3" height="12" rx="1.5" />
        <rect x="7" y="3" width="3" height="18" rx="1.5" />
        <rect x="12" y="8" width="3" height="8" rx="1.5" />
        <rect x="17" y="4" width="3" height="16" rx="1.5" />
        <rect x="22" y="9" width="3" height="6" rx="1.5" />
      </g>
    </svg>
  ),

  googleslides: ({ size = 24, className, ...props }: LogoProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M16 2.01L8 2C6.9 2 6 2.9 6 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-5.99zM15 11l4 3-4 3v-2.5C11.5 14.5 11 16.5 11 19c-1-2.5-3-5.5-6-5.5v-2c3 0 5 2.5 6 5.5v-6H15z" fill="#FBBC04" />
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" fill="#F29900" />
    </svg>
  )
};

export function BrandLogo({ provider, size = 24, className }: { provider: string; size?: number | string; className?: string }) {
  const p = provider.toLowerCase();
  if (p.includes("youtube")) return <BrandLogos.youtube size={size} className={className} />;
  if (p === "x" || p === "twitter" || p.includes("twitter")) return <BrandLogos.x size={size} className={className} />;
  if (p.includes("tiktok")) return <BrandLogos.tiktok size={size} className={className} />;
  if (p.includes("facebook")) return <BrandLogos.facebook size={size} className={className} />;
  if (p.includes("instagram")) return <BrandLogos.instagram size={size} className={className} />;
  if (p.includes("linkedin")) return <BrandLogos.linkedin size={size} className={className} />;
  if (p.includes("openai")) return <BrandLogos.openai size={size} className={className} />;
  if (p.includes("gemini")) return <BrandLogos.gemini size={size} className={className} />;
  if (p.includes("claude")) return <BrandLogos.claude size={size} className={className} />;
  if (p.includes("runway")) return <BrandLogos.runway size={size} className={className} />;
  if (p.includes("elevenlabs") || p.includes("eleven")) return <BrandLogos.elevenlabs size={size} className={className} />;
  if (p.includes("googleslides") || p.includes("slides")) return <BrandLogos.googleslides size={size} className={className} />;
  
  return null;
}

