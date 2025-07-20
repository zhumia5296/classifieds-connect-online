import { cn } from '@/lib/utils';

interface TradeSpidersLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const TradeSpidersLogo = ({ 
  className, 
  size = 'md', 
  showText = true 
}: TradeSpidersLogoProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Spider Web Icon */}
      <div className={cn(
        "relative flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-lg",
        sizeClasses[size]
      )}>
        {/* Web pattern */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-3/4 h-3/4 text-white"
          fill="currentColor"
        >
          {/* Center point */}
          <circle cx="12" cy="12" r="1" />
          
          {/* Web rings */}
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
          
          {/* Radial lines */}
          <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
          <line x1="7.76" y1="7.76" x2="16.24" y2="16.24" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
          <line x1="16.24" y1="7.76" x2="7.76" y2="16.24" stroke="currentColor" strokeWidth="0.3" opacity="0.4" />
          
          {/* Spider body */}
          <ellipse cx="14" cy="10" rx="1.5" ry="0.8" transform="rotate(45 14 10)" opacity="0.9" />
          
          {/* Spider legs */}
          <path d="M13.5 9.5 L15 8 M14.5 10.5 L16 12" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" opacity="0.7" />
        </svg>
      </div>
      
      {/* Text Logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent leading-tight",
            textSizeClasses[size]
          )}>
            TradeSpiders
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground -mt-1 tracking-wide">
              Web of Local Trade
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeSpidersLogo;