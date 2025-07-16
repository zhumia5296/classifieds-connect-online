import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useReviews, Review } from '@/hooks/useReviews';

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  showActions?: boolean;
}

export const ReviewCard = ({ review, onEdit, onDelete, showActions = true }: ReviewCardProps) => {
  const { user } = useAuth();
  const { voteOnReview, getReviewVote } = useReviews();
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);

  useEffect(() => {
    if (user) {
      getReviewVote(review.id).then(setUserVote);
    }
  }, [review.id, user]);

  const handleVote = async (isHelpful: boolean) => {
    if (userVote === isHelpful) return; // Already voted this way

    const success = await voteOnReview(review.id, isHelpful);
    if (success) {
      const prevVote = userVote;
      setUserVote(isHelpful);
      
      // Update helpful count
      let newCount = helpfulCount;
      if (prevVote === null) {
        newCount += isHelpful ? 1 : -1;
      } else if (prevVote !== isHelpful) {
        newCount += isHelpful ? 2 : -2;
      }
      setHelpfulCount(newCount);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const isOwner = user?.id === review.reviewer_id;
  const canVote = user && user.id !== review.reviewer_id;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewer?.avatar_url} />
              <AvatarFallback>
                {review.reviewer?.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">
                  {review.reviewer?.display_name || 'Anonymous User'}
                </span>
                {review.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    Verified Purchase
                  </Badge>
                )}
                {review.transaction_type && (
                  <Badge variant="outline" className="text-xs">
                    {review.transaction_type === 'buying' ? 'Buyer' : 'Seller'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                {isOwner && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(review)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit review
                  </DropdownMenuItem>
                )}
                {isOwner && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(review.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete review
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <DropdownMenuItem>
                    <Flag className="h-4 w-4 mr-2" />
                    Report review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-1">{review.title}</h4>
            {review.comment && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
          
          {review.ad && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Reviewed for:</p>
              <p className="text-sm font-medium">{review.ad.title}</p>
            </div>
          )}
          
          {canVote && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Was this review helpful?
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  variant={userVote === true ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleVote(true)}
                  className="h-8 px-2"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">Yes</span>
                </Button>
                <Button
                  variant={userVote === false ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleVote(false)}
                  className="h-8 px-2"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  <span className="text-xs">No</span>
                </Button>
                {helpfulCount > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {helpfulCount} helpful
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};