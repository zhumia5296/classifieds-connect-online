import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedMobile } from '@/hooks/useEnhancedMobile';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { Star, Eye, EyeOff, MoreVertical, Share } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MobileAdCard {
  id: string;
  title: string;
  price: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  category: { name: string };
  views_count: number;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onQuickAction: (id: string, action: 'activate' | 'deactivate' | 'feature' | 'share') => void;
}

export const MobileAdCard: React.FC<MobileAdCard> = ({
  id,
  title,
  price,
  currency,
  is_active,
  is_featured,
  created_at,
  category,
  views_count,
  selected,
  onSelect,
  onQuickAction
}) => {
  const { triggerHapticFeedback, shareContent } = useEnhancedMobile();
  const [showActions, setShowActions] = React.useState(false);

  const { gestureHandlers } = useTouchGestures({
    onTap: () => {
      triggerHapticFeedback('light');
      onSelect(id, !selected);
    },
    onLongPress: () => {
      triggerHapticFeedback('medium');
      setShowActions(true);
    },
    onSwipe: (gesture) => {
      if (gesture.direction === 'left') {
        onQuickAction(id, is_active ? 'deactivate' : 'activate');
        triggerHapticFeedback('light');
      } else if (gesture.direction === 'right') {
        onQuickAction(id, 'feature');
        triggerHapticFeedback('light');
      }
    }
  });

  const handleShare = async () => {
    const shared = await shareContent({
      title: title,
      text: `Check out this ad: ${title}`,
      url: `${window.location.origin}/ad/${id}`
    });
    
    if (shared) {
      triggerHapticFeedback('light');
    }
  };

  return (
    <div
      {...gestureHandlers}
      className={cn(
        "relative p-4 border rounded-lg bg-card transition-all duration-200 touch-manipulation",
        selected && "ring-2 ring-primary bg-primary/5",
        "hover:shadow-md active:scale-[0.98]"
      )}
    >
      {/* Selection indicator */}
      <div className="absolute top-2 left-2">
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
            selected ? "bg-primary border-primary" : "border-muted-foreground/30"
          )}
        >
          {selected && <div className="w-3 h-3 bg-white rounded-full" />}
        </div>
      </div>

      {/* Featured indicator */}
      {is_featured && (
        <div className="absolute top-2 right-2">
          <Star className="h-5 w-5 text-yellow-500 fill-current" />
        </div>
      )}

      {/* Content */}
      <div className="pl-8 pr-6">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{title}</h3>
        
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={is_active ? "default" : "secondary"} className="text-xs">
            {is_active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {category.name}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-primary">
              {price ? `${currency || 'USD'} ${price}` : 'No price'}
            </p>
            <p className="text-sm text-muted-foreground">
              {views_count} views
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {format(new Date(created_at), 'MMM d')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-2 z-10">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onQuickAction(id, is_active ? 'deactivate' : 'activate');
              setShowActions(false);
            }}
            className="bg-white/90 text-black hover:bg-white"
          >
            {is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onQuickAction(id, 'feature');
              setShowActions(false);
            }}
            className="bg-white/90 text-black hover:bg-white"
          >
            <Star className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              handleShare();
              setShowActions(false);
            }}
            className="bg-white/90 text-black hover:bg-white"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowActions(false)}
            className="bg-white/90 text-black hover:bg-white"
          >
            ×
          </Button>
        </div>
      )}

      {/* Swipe hints */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
          <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};