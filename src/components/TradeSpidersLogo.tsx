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
  const iconSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7', 
    lg: 'h-9 w-9'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Red Spider Icon - Matching Mockup */}
      <svg 
        viewBox="0 0 24 24" 
        className={cn("text-red-500", iconSizeClasses[size])}
        fill="currentColor"
      >
        {/* Spider body - simplified to match mockup */}
        <circle cx="12" cy="12" r="3" />
        
        {/* Left legs - simplified design */}
        <path d="M9 10 L4 7 M9 12 L3 12 M9 14 L4 17" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              fill="none" />
        
        {/* Right legs - simplified design */}
        <path d="M15 10 L20 7 M15 12 L21 12 M15 14 L20 17" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              fill="none" />
        
        {/* Simple eyes */}
        <circle cx="10.5" cy="10.5" r="0.5" fill="white" />
        <circle cx="13.5" cy="10.5" r="0.5" fill="white" />
      </svg>
      
      {/* TradeSpiders Text - Matching Mockup */}
      {showText && (
        <span className={cn(
          "font-semibold text-gray-900 dark:text-white",
          textSizeClasses[size]
        )}>
          TradeSpider
        </span>
      )}
    </div>
  );
};

export default TradeSpidersLogo;