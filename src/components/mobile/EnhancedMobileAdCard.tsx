import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { Heart, MapPin, Clock, Navigation, MessageCircle, Share2, Camera, Star, Verified } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { calculateDistance, formatDistance } from '@/lib/location';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedMobileAdCardProps {
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
}

const EnhancedMobileAdCard = ({
  id,
  title,
  price,
  currency = 'USD',
  location,
  latitude,
  longitude,
  createdAt,
  imageUrl,
  images = [],
  isFeatured = false,
  isLiked = false,
  category,
  condition,
  sellerId,
  sellerRating,
  sellerReviews,
  isSellerVerified = false,
  onToggleSave,
  onContact
}: EnhancedMobileAdCardProps) => {
  const { user } = useAuth();
  const { location: userLocation } = useLocation();
  const { toast } = useToast();
  
  // Calculate distance if both user and ad have coordinates
  const distance = userLocation?.coords && latitude && longitude
    ? calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        latitude,
        longitude
      )
    : null;

  // Format price display
  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Price on request';
    if (price === 0) return 'Free';
    
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };
    
    const symbol = currencySymbols[currency] || currency;
    
    // Format large numbers
    if (price >= 1000000) {
      return `${symbol}${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${symbol}${(price / 1000).toFixed(0)}k`;
    }
    
    return `${symbol}${price.toLocaleString()}`;
  };

  // Format time ago
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save ads.",
        variant: "destructive"
      });
      return;
    }
    onToggleSave?.();
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact sellers.",
        variant: "destructive"
      });
      return;
    }
    onContact?.();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} - ${formatPrice(price, currency)}`,
          url: `${window.location.origin}/ad/${id}`
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/ad/${id}`);
      toast({
        title: "Link copied",
        description: "Ad link copied to clipboard",
      });
    }
  };

  const formatCondition = (condition?: string) => {
    if (!condition) return '';
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getProximityBadge = (distance: number) => {
    const distanceMiles = distance * 0.621371;
    
    if (distanceMiles <= 0.25) {
      return {
        text: 'Walking distance',
        icon: '🚶',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300',
        bgColor: 'ring-1 ring-green-200 bg-green-50/30',
        priority: 'high'
      };
    } else if (distanceMiles <= 1) {
      return {
        text: `${distanceMiles.toFixed(1)} mi • 2min walk`,
        icon: '🚶',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300',
        bgColor: 'ring-1 ring-blue-200 bg-blue-50/20',
        priority: 'medium'
      };
    } else if (distanceMiles <= 5) {
      return {
        text: `${distanceMiles.toFixed(1)} mi • ${Math.round(distanceMiles * 3)}min drive`,
        icon: '🚗',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300',
        bgColor: '',
        priority: 'normal'
      };
    } else {
      return {
        text: `${Math.round(distanceMiles)} mi away`,
        icon: '🚗',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300',
        bgColor: '',
        priority: 'normal'
      };
    }
  };

  const proximityBadge = distance ? getProximityBadge(distance) : null;

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-[0.98] bg-white border-0 shadow-md ${
        isFeatured 
          ? 'ring-2 ring-primary/40 bg-gradient-to-br from-primary/5 to-primary/10' 
          : ''
      } ${proximityBadge?.bgColor || ''}`}
      onClick={() => window.location.href = `/ad/${id}`}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Enhanced Proximity Badge */}
          {proximityBadge && (
            <div className="absolute top-3 left-3">
              <Badge 
                className={`${proximityBadge.color} border-2 shadow-lg font-medium text-sm px-3 py-1.5 backdrop-blur-sm`}
              >
                <span className="mr-1.5">{proximityBadge.icon}</span>
                {proximityBadge.text}
              </Badge>
            </div>
          )}
          
          {/* Featured Badge - Enhanced */}
          {isFeatured && (
            <div className="absolute top-3 right-3">
              <Badge 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg animate-pulse font-semibold"
              >
                ⭐ Featured
              </Badge>
            </div>
          )}
          
          {/* Multiple Images Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-black/70 text-white border-0 backdrop-blur-sm font-medium">
                <Camera className="h-3 w-3 mr-1" />
                {images.length}
              </Badge>
            </div>
          )}
          
          {/* Enhanced Quick Actions - Larger Touch Targets */}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white border-0 shadow-lg"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 backdrop-blur-sm border-0 shadow-lg transition-all duration-200 ${
                isLiked 
                  ? 'text-red-500 bg-white/95 hover:bg-white hover:scale-110' 
                  : 'bg-black/70 hover:bg-black/90 text-white hover:text-red-400 hover:scale-110'
              }`}
              onClick={handleSaveClick}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Price - Most Prominent with Visual Emphasis */}
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-primary bg-primary/5 px-3 py-2 rounded-lg">
              {formatPrice(price, currency)}
            </div>
            {proximityBadge?.priority === 'high' && (
              <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
                📍 Nearby
              </Badge>
            )}
          </div>
          
          {/* Title - More Prominent */}
          <h3 className="font-bold text-xl leading-tight line-clamp-2 text-gray-900">
            {title}
          </h3>
          
          {/* Location and Time - Enhanced Layout */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-base font-medium text-gray-700 truncate flex-1">{location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          
          {/* Category, Condition, and Trust Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm border-gray-300">
                {category}
              </Badge>
              {condition && (
                <Badge variant="secondary" className="text-sm">
                  {formatCondition(condition)}
                </Badge>
              )}
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center gap-1">
              {isSellerVerified && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                  <Verified className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {sellerRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{sellerRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Contact Button - More Prominent */}
          {user && sellerId && user.id !== sellerId && (
            <div className="flex gap-2 pt-2">
              <Button
                size="lg"
                className="flex-1 h-12 text-base font-semibold"
                onClick={handleContactClick}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Message Seller
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-4"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMobileAdCard;