// Elite StarX Logo Component - Fixed Correct Artwork Link
export function EliteStarXLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const configs = {
    sm: "h-10",
    md: "h-20", 
    lg: "h-32",
  };
  
  const heightClass = configs[size];

  return (
    <div className="flex items-center select-none py-1 overflow-hidden">
      <img 
        src="/logo-final.jpg" 
        alt="Elite Star Logo" 
        className={`${heightClass} w-auto object-contain transition-all duration-500 hover:scale-[1.05] active:scale-95 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]`}
        style={{ mixBlendMode: 'screen' }}
      />
    </div>
  );
}
