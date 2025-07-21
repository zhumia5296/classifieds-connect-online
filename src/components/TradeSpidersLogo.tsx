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
        {/* Spider body - main oval */}
        <ellipse cx="12" cy="12" rx="2.5" ry="4" />
        {/* Spider head */}
        <circle cx="12" cy="8" r="1.8" />
        
        {/* Left legs */}
        <path d="M9.5 10 L5 6 M9.5 11 L4 9 M9.5 13 L4 15 M9.5 14 L5 18" 
              stroke="currentColor" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
              fill="none" />
        
        {/* Right legs */}
        <path d="M14.5 10 L19 6 M14.5 11 L20 9 M14.5 13 L20 15 M14.5 14 L19 18" 
              stroke="currentColor" 
              strokeWidth="1.2" 
              strokeLinecap="round" 
              fill="none" />
        
        {/* Pedipalps (front appendages) */}
        <circle cx="11" cy="7" r="0.4" />
        <circle cx="13" cy="7" r="0.4" />
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