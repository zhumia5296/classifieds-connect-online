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
    sm: 'h-9 w-9',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Red Spider Icon - Using uploaded image */}
      <img 
        src="/lovable-uploads/05f060de-a749-4983-b100-f2466ab249e7.png"
        alt="TradeSpider logo"
        className={cn("object-contain", iconSizeClasses[size])}
      />
      
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