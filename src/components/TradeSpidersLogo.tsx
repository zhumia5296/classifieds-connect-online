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
    lg: 'h-10 w-10'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Spider Logo Icon - Matching Mockup */}
      <div className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg",
        sizeClasses[size]
      )}>
        {/* Stylized Spider Icon */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-5/6 h-5/6 text-white"
          fill="currentColor"
        >
          {/* Spider body */}
          <ellipse cx="12" cy="12" rx="2" ry="3" />
          <circle cx="12" cy="10" r="1.5" />
          
          {/* Spider legs - left side */}
          <path d="M10 11 L6 8 M10 12 L5 11 M10 13 L6 16 M10 14 L7 17" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                fill="none" />
          
          {/* Spider legs - right side */}
          <path d="M14 11 L18 8 M14 12 L19 11 M14 13 L18 16 M14 14 L17 17" 
                stroke="currentColor" 
                strokeWidth="1" 
                strokeLinecap="round" 
                fill="none" />
        </svg>
      </div>
      
      {/* TradeSpiders Text - Matching Mockup Style */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold text-gray-900 dark:text-white leading-tight",
            textSizeClasses[size]
          )}>
            TradeSpiders
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5 tracking-wide">
              Local Marketplace
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TradeSpidersLogo;