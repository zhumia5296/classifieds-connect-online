import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MapPin, Clock, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ChatWindow from './ChatWindow';

interface AdCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  timeAgo: string;
  imageUrl: string;
  isFeatured?: boolean;
  isLiked?: boolean;
  category: string;
  condition?: string;
  sellerId?: string;
  onToggleSave?: () => void;
}

const AdCard = ({
  id,
  title,
  price,
  location,
  timeAgo,
  imageUrl,
  isFeatured = false,
  isLiked = false,
  category,
  condition,
  sellerId,
  onToggleSave
}: AdCardProps) => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  
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
    <Card className={`group hover:shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden ${
      isFeatured ? "ring-2 ring-marketplace-featured/50 shadow-featured" : ""
    }`}>
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isFeatured && (
            <Badge variant="default" className="bg-marketplace-featured text-marketplace-featured-foreground shadow-featured">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          <Badge variant="secondary" className="bg-background/90 text-foreground">
            {category}
          </Badge>
        </div>
        
        {/* Heart button */}
        <Button
          size="icon"
          variant="ghost"
          className={`absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background transition-all duration-200 ${
            isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          }`}
          onClick={handleSaveClick}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">
              {price}
            </div>
            {condition && (
              <Badge variant="outline" className="text-xs">
                {formatCondition(condition)}
              </Badge>
            )}
          </div>
          
          {/* Location and time */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Contact button */}
          {sellerId && user && sellerId !== user.id && (
            <Button 
              onClick={handleContactClick}
              className="w-full mt-3"
              variant="outline"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
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
    </Card>
  );
};

export default AdCard;