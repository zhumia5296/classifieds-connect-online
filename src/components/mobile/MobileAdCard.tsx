import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { Heart, MapPin, Clock, Navigation, MessageCircle, Share2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { calculateDistance, formatDistance } from '@/lib/location';
import { useToast } from '@/hooks/use-toast';

interface MobileAdCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  latitude?: number;
  longitude?: number;
  timeAgo: string;
  imageUrl: string;
  images?: string[];
  isFeatured?: boolean;
  isLiked?: boolean;
  category: string;
  condition?: string;
  sellerId?: string;
  onToggleSave?: () => void;
  onContact?: () => void;
}

const MobileAdCard = ({
  id,
  title,
  price,
  location,
  latitude,
  longitude,
  timeAgo,
  imageUrl,
  images = [],
  isFeatured = false,
  isLiked = false,
  category,
  condition,
  sellerId,
  onToggleSave,
  onContact
}: MobileAdCardProps) => {
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
          text: `${title} - ${price}`,
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

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
        isFeatured 
          ? 'ring-1 ring-primary/30 bg-gradient-to-br from-primary/5 to-primary/10' 
          : ''
      }`}
      onClick={() => window.location.href = `/ad/${id}`}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          
          {/* Distance Badge */}
          {distance && (
            <div className="absolute top-2 left-2">
              <Badge 
                variant="secondary" 
                className="bg-background/90 backdrop-blur-sm text-xs font-medium"
              >
                <Navigation className="h-3 w-3 mr-1" />
                {formatDistance(distance)}
              </Badge>
            </div>
          )}
          
          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge 
                variant="default" 
                className="bg-gradient-primary text-primary-foreground text-xs"
              >
                Featured
              </Badge>
            </div>
          )}
          
          {/* Multiple Images Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                <Camera className="h-3 w-3 mr-1" />
                {images.length}
              </Badge>
            </div>
          )}
          
          {/* Quick Actions - Mobile Optimized */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleShare}
            >
              <Share2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 backdrop-blur-sm ${
                isLiked 
                  ? 'text-red-500 bg-background/90 hover:bg-background' 
                  : 'bg-background/80 hover:bg-background hover:text-red-500'
              }`}
              onClick={handleSaveClick}
            >
              <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Title and Price */}
          <div>
            <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-1">
              {title}
            </h3>
            <div className="text-lg font-bold text-primary">
              {price}
            </div>
          </div>
          
          {/* Location and Time */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">{timeAgo}</span>
            </div>
          </div>
          
          {/* Category and Condition */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
            {condition && (
              <Badge variant="secondary" className="text-xs">
                {formatCondition(condition)}
              </Badge>
            )}
          </div>
          
          {/* Contact Button */}
          {user && sellerId && user.id !== sellerId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 h-8"
              onClick={handleContactClick}
            >
              <MessageCircle className="h-3 w-3 mr-2" />
              Contact
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileAdCard;