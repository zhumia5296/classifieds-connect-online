import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { Heart, MapPin, Clock, Star, MessageCircle, Navigation, Share2, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { calculateDistance, formatDistance } from '@/lib/location';
import ChatWindow from './ChatWindow';
import QuickFeatureButton from './QuickFeatureButton';
import SocialShare from './SocialShare';
import QuickImageGallery from './QuickImageGallery';

interface AdCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  latitude?: number;
  longitude?: number;
  timeAgo: string;
  imageUrl: string;
  images?: string[];
  hasVideos?: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
  isLiked?: boolean;
  category: string;
  condition?: string;
  sellerId?: string;
  isOwner?: boolean;
  onToggleSave?: () => void;
}

const AdCard = ({
  id,
  title,
  price,
  location,
  latitude,
  longitude,
  timeAgo,
  imageUrl,
  images = [],
  hasVideos = false,
  isFeatured = false,
  featuredUntil,
  isLiked = false,
  category,
  condition,
  sellerId,
  isOwner = false,
  onToggleSave
}: AdCardProps) => {
  const { user } = useAuth();
  const { location: userLocation } = useLocation();
  const [showChat, setShowChat] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  // Create display images array (fallback to single image if no images array)
  const displayImages = images.length > 0 ? images : [imageUrl];
  
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
    onToggleSave?.();
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      // Redirect to auth or show sign-in message
      window.location.href = '/auth';
      return;
    }
    if (sellerId && sellerId !== user.id) {
      setShowChat(true);
    }
  };

  const formatCondition = (condition?: string) => {
    if (!condition) return '';
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden ${
        isFeatured 
          ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg hover:shadow-xl hover:scale-105 animate-fade-in' 
          : 'hover:shadow-md hover:-translate-y-1'
      }`}
    >
      <div className="relative overflow-hidden">
        <div 
          className="aspect-[4/3] w-full overflow-hidden relative group/image"
          onClick={() => window.location.href = `/ad/${id}`}
        >
          <img 
            src={imageUrl} 
            alt={title}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isFeatured ? 'group-hover:scale-110' : 'group-hover:scale-105'
            }`}
          />
          
          {/* Media Indicators */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {displayImages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="bg-background/80 hover:bg-background/90 backdrop-blur-sm text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImageGallery(true);
                }}
              >
                <Camera className="h-3 w-3 mr-1" />
                {displayImages.length}
              </Button>
            )}
            {hasVideos && (
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
          </div>
        </div>
        
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge 
              variant="default" 
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-50 shadow-lg animate-pulse border-0"
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
            {category}
          </Badge>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <div className="backdrop-blur-sm bg-background/80 rounded-md">
            <SocialShare
              url={`${window.location.origin}/ad/${id}`}
              title={title}
              price={price}
              location={location}
              description=""
              image={imageUrl}
              variant="ghost"
              size="icon"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`backdrop-blur-sm transition-colors hover-scale ${
              isLiked 
                ? 'text-red-500 bg-background/90 hover:bg-background hover:text-red-600' 
                : 'text-foreground/70 bg-background/80 hover:bg-background hover:text-red-500'
            }`}
            onClick={handleSaveClick}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div 
          className="space-y-3 cursor-pointer"
          onClick={() => window.location.href = `/ad/${id}`}
        >
          <div className="space-y-2">
            <h3 className={`font-semibold text-lg leading-tight line-clamp-2 ${
              isFeatured ? 'text-primary' : 'text-foreground'
            } group-hover:text-primary transition-colors`}>
              {title}
            </h3>
            <div className={`text-2xl font-bold ${
              isFeatured ? 'text-primary' : 'text-foreground'
            }`}>
              {price}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location}</span>
            </div>
            {distance ? (
              <div className="flex items-center gap-1 text-primary">
                <Navigation className="h-3 w-3" />
                <span className="font-medium">{formatDistance(distance)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
          
          {distance && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeAgo}</span>
            </div>
          )}
          
          {condition && (
            <Badge variant="outline" className="text-xs">
              {formatCondition(condition)}
            </Badge>
          )}
        </div>

        {/* Contact/Feature Buttons */}
        <div className="flex gap-2">
          {user && sellerId && user.id !== sellerId && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 hover-scale"
              onClick={handleContactClick}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
          )}
          
          {isOwner && (
            <QuickFeatureButton
              adId={id}
              isOwner={isOwner}
              isFeatured={isFeatured}
              featuredUntil={featuredUntil}
              compact={true}
            />
          )}
        </div>
      </CardContent>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          {sellerId && (
            <ChatWindow
              adId={id}
              recipientId={sellerId}
              onBack={() => setShowChat(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Image Gallery */}
      <QuickImageGallery
        images={displayImages}
        isOpen={showImageGallery}
        onOpenChange={setShowImageGallery}
        title={title}
      />
    </Card>
  );
};

export default AdCard;