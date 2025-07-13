import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onSave?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  showActions?: boolean;
  className?: string;
}

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onDoubleTap,
  onSave,
  onMessage,
  onShare,
  onMore,
  showActions = true,
  className
}: SwipeableCardProps) => {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [actionRevealed, setActionRevealed] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { gestureHandlers } = useTouchGestures({
    onSwipe: (gesture) => {
      if (gesture.direction === 'left' && onSwipeLeft) {
        setIsAnimating(true);
        setOffset(-300);
        setTimeout(() => {
          onSwipeLeft();
          resetCard();
        }, 300);
      } else if (gesture.direction === 'right' && onSwipeRight) {
        setIsAnimating(true);
        setOffset(300);
        setTimeout(() => {
          onSwipeRight();
          resetCard();
        }, 300);
      }
    },
    onTap: onTap,
    onDoubleTap: onDoubleTap
  });

  const resetCard = () => {
    setOffset(0);
    setActionRevealed(null);
    setIsAnimating(false);
  };

  const revealActions = (side: 'left' | 'right') => {
    setActionRevealed(side);
    setOffset(side === 'left' ? 80 : -80);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left Actions */}
      {showActions && (
        <div className="absolute left-0 top-0 h-full w-20 bg-green-500 flex items-center justify-center z-10">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-green-600"
            onClick={() => {
              onSave?.();
              resetCard();
            }}
          >
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Right Actions */}
      {showActions && (
        <div className="absolute right-0 top-0 h-full w-20 bg-blue-500 flex items-center justify-center z-10">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-blue-600"
            onClick={() => {
              onMessage?.();
              resetCard();
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main Card */}
      <Card
        ref={cardRef}
        className={cn(
          "relative z-20 transform transition-transform duration-200",
          isAnimating && "transition-transform duration-300",
          className
        )}
        style={{
          transform: `translateX(${offset}px)`,
        }}
        {...gestureHandlers}
      >
        <CardContent className="p-4">
          {children}
          
          {/* Action Buttons for Non-Touch Devices */}
          {showActions && (
            <div className="flex justify-end gap-2 mt-4 md:hidden">
              {onSave && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSave}
                  className="h-8 w-8 p-0"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              )}
              {onMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMessage}
                  className="h-8 w-8 p-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
              {onShare && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onShare}
                  className="h-8 w-8 p-0"
                >
                  <Share className="h-4 w-4" />
                </Button>
              )}
              {onMore && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMore}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swipe Indicators */}
      {actionRevealed && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {actionRevealed === 'left' ? 'Swipe right to save' : 'Swipe left to message'}
          </div>
        </div>
      )}
    </div>
  );
};