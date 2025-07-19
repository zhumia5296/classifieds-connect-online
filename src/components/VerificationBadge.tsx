import { Badge } from "@/components/ui/badge";
import { Shield, Award, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  isVerified: boolean;
  badgeType?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'inline';
  showText?: boolean;
  className?: string;
}

const VerificationBadge = ({
  isVerified,
  badgeType = 'seller',
  size = 'sm',
  variant = 'default',
  showText = true,
  className
}: VerificationBadgeProps) => {
  if (!isVerified) return null;

  const getBadgeContent = () => {
    const iconMap = {
      sm: { size: 'h-3 w-3', text: 'text-xs' },
      md: { size: 'h-4 w-4', text: 'text-sm' },
      lg: { size: 'h-5 w-5', text: 'text-base' }
    };

    const { size: iconSize, text: textSize } = iconMap[size];

    const getBadgeTypeIcon = () => {
      switch (badgeType) {
        case 'business':
          return <Award className={cn(iconSize, showText && 'mr-1')} />;
        case 'premium':
          return <CheckCircle2 className={cn(iconSize, showText && 'mr-1')} />;
        case 'location':
          return <MapPin className={cn(iconSize, showText && 'mr-1')} />;
        default:
          return <Shield className={cn(iconSize, showText && 'mr-1')} />;
      }
    };

    const getBadgeText = () => {
      if (!showText) return null;
      
      switch (badgeType) {
        case 'business':
          return 'Verified Business';
        case 'premium':
          return 'Premium Verified';
        case 'location':
          return 'Location Verified';
        default:
          return 'Verified';
      }
    };

    return (
      <>
        {getBadgeTypeIcon()}
        {getBadgeText() && <span className={textSize}>{getBadgeText()}</span>}
      </>
    );
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
      case 'inline':
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "font-medium transition-colors",
        getVariantStyles(),
        className
      )}
    >
      {getBadgeContent()}
    </Badge>
  );
};

export default VerificationBadge;