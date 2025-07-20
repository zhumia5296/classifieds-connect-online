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

  const getDistanceColor = (distance: number) => {
    if (distance <= 2) return 'bg-green-500';
    if (distance <= 10) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${
        isFeatured 
          ? 'ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 to-primary/10' 
          : ''
      }`}
      onClick={() => window.location.href = `/ad/${id}`}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Distance Badge - Prominent */}
          {distance && (
            <div className="absolute top-3 left-3">
              <Badge 
                className={`${getDistanceColor(distance)} text-white border-0 shadow-md font-medium`}
              >
                <Navigation className="h-3 w-3 mr-1" />
                {formatDistance(distance)}
              </Badge>
            </div>
          )}
          
          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-3 right-3">
              <Badge 
                className="bg-gradient-primary text-primary-foreground border-0 shadow-md animate-pulse"
              >
                ✨ Featured
              </Badge>
            </div>
          )}
          
          {/* Multiple Images Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                <Camera className="h-3 w-3 mr-1" />
                {images.length} photos
              </Badge>
            </div>
          )}
          
          {/* Quick Actions - Enhanced */}
          <div className="absolute bottom-3 right-3 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white border-0"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 backdrop-blur-sm border-0 transition-all ${
                isLiked 
                  ? 'text-red-500 bg-white/90 hover:bg-white' 
                  : 'bg-black/60 hover:bg-black/80 text-white hover:text-red-400'
              }`}
              onClick={handleSaveClick}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Price - Most Prominent */}
          <div className="text-2xl font-bold text-primary">
            {formatPrice(price, currency)}
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {title}
          </h3>
          
          {/* Location and Time - Simplified */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Clock className="h-4 w-4" />
              <span className="whitespace-nowrap">{timeAgo}</span>
            </div>
          </div>
          
          {/* Category and Condition */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
            {condition && (
              <Badge variant="secondary" className="text-xs">
                {formatCondition(condition)}
              </Badge>
            )}
          </div>
          
          {/* Seller Info - Trust Indicators */}
          {(sellerRating || isSellerVerified) && (
            <div className="flex items-center gap-2 text-sm">
              {isSellerVerified && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                  <Verified className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              {sellerRating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-medium">{sellerRating.toFixed(1)}</span>
                  {sellerReviews && (
                    <span className="text-xs text-muted-foreground">({sellerReviews})</span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Contact Button - Prominent */}
          {user && sellerId && user.id !== sellerId && (
            <Button
              size="sm"
              className="w-full h-10 mt-2"
              onClick={handleContactClick}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMobileAdCard;