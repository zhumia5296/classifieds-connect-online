import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useReviews, Review } from '@/hooks/useReviews';

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  adId?: string;
  adTitle?: string;
  existingReview?: Review;
  onSubmit?: () => void;
}

export const ReviewForm = ({ 
  isOpen, 
  onClose, 
  userId, 
  adId, 
  adTitle,
  existingReview,
  onSubmit 
}: ReviewFormProps) => {
  const { createReview, updateReview, loading } = useReviews();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [transactionType, setTransactionType] = useState<'buying' | 'selling' | undefined>(
    existingReview?.transaction_type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    let result;
    if (existingReview) {
      result = await updateReview(existingReview.id, {
        rating,
        title,
        comment: comment || undefined,
      });
    } else {
      result = await createReview({
        reviewed_user_id: userId,
        ad_id: adId,
        rating,
        title,
        comment: comment || undefined,
        transaction_type: transactionType,
      });
    }

    if (result) {
      handleClose();
      onSubmit?.();
    }
  };

  const handleClose = () => {
    setRating(existingReview?.rating || 0);
    setHoveredRating(0);
    setTitle(existingReview?.title || '');
    setComment(existingReview?.comment || '');
    setTransactionType(existingReview?.transaction_type);
    onClose();
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-colors"
          >
            <Star
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {existingReview ? 'Edit Review' : 'Write a Review'}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            {adTitle ? `Share your experience with this listing: ${adTitle}` : 'Share your experience with this user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex flex-col items-center space-y-2">
              {renderStars()}
              <p className="text-sm text-muted-foreground">
                {getRatingText(hoveredRating || rating)}
              </p>
            </div>
          </div>

          {/* Transaction Type */}
          {!existingReview && (
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select value={transactionType} onValueChange={(value: 'buying' | 'selling') => setTransactionType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="What type of transaction was this?" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="buying">I was buying from this user</SelectItem>
                  <SelectItem value="selling">I was selling to this user</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              required
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comments (optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience in detail..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || rating === 0 || !title.trim()}
            >
              {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};