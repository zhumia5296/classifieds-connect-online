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
    sm: 'h-16 w-16',
    md: 'h-24 w-24', 
    lg: 'h-32 w-32'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Red Spider Icon - Using uploaded image */}
      <img 
        src="/lovable-uploads/23f6c4ce-07da-44ee-9f91-d424687ddf86.png"
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