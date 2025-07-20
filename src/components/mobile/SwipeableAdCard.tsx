import { useState, useRef, useEffect } from 'react';
import { Heart, Share2, MessageCircle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import EnhancedMobileAdCard from './EnhancedMobileAdCard';

interface SwipeableAdCardProps {
  id: string;
  title: string;
  price: number | null;
  currency?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  imageUrl: string;
  images?: string[];
  isFeatured?: boolean;
  isLiked?: boolean;
  category: string;
  condition?: string;
  sellerId?: string;
  sellerRating?: number;
  sellerReviews?: number;
  isSellerVerified?: boolean;
  onToggleSave?: () => void;
  onContact?: () => void;
  onShare?: () => void;
}

const SwipeableAdCard = (props: SwipeableAdCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [actionTriggered, setActionTriggered] = useState<'like' | 'share' | 'message' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const SWIPE_THRESHOLD = 100; // px
  const MAX_SWIPE = 150; // px

  useEffect(() => {
    if (actionTriggered) {
      const timer = setTimeout(() => {
        setActionTriggered(null);
        setSwipeOffset(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [actionTriggered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!user && props.sellerId !== user?.id) return;
    
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // Only allow swipe in one direction based on initial movement
    if (Math.abs(deltaX) > 10) {
      e.preventDefault(); // Prevent scrolling
      
      // Limit swipe distance
      const limitedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setSwipeOffset(limitedOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaX = currentX.current - startX.current;
    
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      // Determine action based on swipe direction and distance
      if (deltaX > 0) {
        // Swipe right - Like action
        handleLikeAction();
      } else {
        // Swipe left - determine action based on distance
        const swipeDistance = Math.abs(deltaX);
        if (swipeDistance >= SWIPE_THRESHOLD * 2) {
          handleMessageAction();
        } else {
          handleShareAction();
        }
      }
    } else {
      // Reset if swipe was too short
      setSwipeOffset(0);
    }
  };

  const handleLikeAction = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save ads.",
        variant: "destructive"
      });
      setSwipeOffset(0);
      return;
    }
    
    setActionTriggered('like');
    props.onToggleSave?.();
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleShareAction = () => {
    setActionTriggered('share');
    props.onShare?.();
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleMessageAction = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact sellers.",
        variant: "destructive"
      });
      setSwipeOffset(0);
      return;
    }
    
    setActionTriggered('message');
    props.onContact?.();
    
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const getSwipeActionIcon = () => {
    if (actionTriggered === 'like') return <Check className="h-6 w-6 text-white" />;
    if (actionTriggered === 'share') return <Check className="h-6 w-6 text-white" />;
    if (actionTriggered === 'message') return <Check className="h-6 w-6 text-white" />;
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      return <Heart className={`h-6 w-6 ${props.isLiked ? 'text-red-500 fill-current' : 'text-white'}`} />;
    }
    if (swipeOffset < -SWIPE_THRESHOLD && swipeOffset > -SWIPE_THRESHOLD * 2) {
      return <Share2 className="h-6 w-6 text-white" />;
    }
    if (swipeOffset <= -SWIPE_THRESHOLD * 2) {
      return <MessageCircle className="h-6 w-6 text-white" />;
    }
    
    return null;
  };

  const getSwipeActionColor = () => {
    if (actionTriggered) return 'bg-green-500';
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      return props.isLiked ? 'bg-red-500' : 'bg-green-500';
    }
    if (swipeOffset < -SWIPE_THRESHOLD && swipeOffset > -SWIPE_THRESHOLD * 2) {
      return 'bg-blue-500';
    }
    if (swipeOffset <= -SWIPE_THRESHOLD * 2) {
      return 'bg-purple-500';
    }
    
    return 'bg-gray-400';
  };

  const getSwipeActionText = () => {
    if (actionTriggered === 'like') return props.isLiked ? 'Unsaved' : 'Saved';
    if (actionTriggered === 'share') return 'Shared';
    if (actionTriggered === 'message') return 'Opening...';
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      return props.isLiked ? 'Unsave' : 'Save';
    }
    if (swipeOffset < -SWIPE_THRESHOLD && swipeOffset > -SWIPE_THRESHOLD * 2) {
      return 'Share';
    }
    if (swipeOffset <= -SWIPE_THRESHOLD * 2) {
      return 'Message';
    }
    
    return '';
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe Action Background */}
      {(swipeOffset !== 0 || actionTriggered) && (
        <div 
          className={`absolute inset-0 ${getSwipeActionColor()} transition-all duration-200 flex items-center z-10`}
          style={{
            opacity: Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1)
          }}
        >
          <div className={`flex items-center gap-3 px-6 ${swipeOffset > 0 ? 'justify-start' : 'justify-end ml-auto'}`}>
            {getSwipeActionIcon()}
            <span className="text-white font-semibold text-lg">
              {getSwipeActionText()}
            </span>
          </div>
        </div>
      )}
      
      {/* Main Card */}
      <div
        ref={cardRef}
        className="relative z-20 transition-transform duration-200"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          opacity: actionTriggered ? 0.7 : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <EnhancedMobileAdCard {...props} />
      </div>
      
      {/* Swipe Instructions (show on first few cards) */}
      {!user && (
        <div className="absolute bottom-2 left-2 right-2 z-30 pointer-events-none">
          <div className="bg-black/70 text-white text-xs py-1 px-2 rounded text-center backdrop-blur-sm">
            👈 Swipe for actions
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeableAdCard;