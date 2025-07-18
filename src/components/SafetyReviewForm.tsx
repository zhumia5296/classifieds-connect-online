import { useState } from 'react';
import { Star, X, Shield, MessageCircle, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

interface SafetyReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  adId?: string;
  adTitle?: string;
  existingReview?: Review;
  onSubmit?: () => void;
}

export const SafetyReviewForm = ({ 
  isOpen, 
  onClose, 
  userId, 
  adId, 
  adTitle,
  existingReview,
  onSubmit 
}: SafetyReviewFormProps) => {
  const { createReview, updateReview, loading } = useReviews();
  
  // Main rating
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // Safety ratings
  const [safetyRating, setSafetyRating] = useState(existingReview?.safety_rating || 0);
  const [communicationRating, setCommunicationRating] = useState(existingReview?.communication_rating || 0);
  const [reliabilityRating, setReliabilityRating] = useState(existingReview?.reliability_rating || 0);
  const [paymentSafetyRating, setPaymentSafetyRating] = useState(existingReview?.payment_safety_rating || 0);
  
  // Form data
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
        safety_rating: safetyRating || undefined,
        communication_rating: communicationRating || undefined,
        reliability_rating: reliabilityRating || undefined,
        payment_safety_rating: paymentSafetyRating || undefined,
      });
    } else {
      result = await createReview({
        reviewed_user_id: userId,
        ad_id: adId,
        rating,
        title,
        comment: comment || undefined,
        transaction_type: transactionType,
        safety_rating: safetyRating || undefined,
        communication_rating: communicationRating || undefined,
        reliability_rating: reliabilityRating || undefined,
        payment_safety_rating: paymentSafetyRating || undefined,
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
    setSafetyRating(existingReview?.safety_rating || 0);
    setCommunicationRating(existingReview?.communication_rating || 0);
    setReliabilityRating(existingReview?.reliability_rating || 0);
    setPaymentSafetyRating(existingReview?.payment_safety_rating || 0);
    setTitle(existingReview?.title || '');
    setComment(existingReview?.comment || '');
    setTransactionType(existingReview?.transaction_type);
    onClose();
  };

  const renderStars = (currentRating: number, onRatingChange: (rating: number) => void, label: string) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {currentRating > 0 ? getRatingText(currentRating) : 'Not rated'}
        </span>
      </div>
    );
  };

  const renderMainStars = () => {
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {existingReview ? 'Edit Safety Review' : 'Write a Safety Review'}
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
            {adTitle ? `Rate the safety and quality of your transaction: ${adTitle}` : 'Rate the safety and quality of your transaction with this user'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label>Overall Experience *</Label>
            <div className="flex flex-col items-center space-y-2">
              {renderMainStars()}
              <p className="text-sm text-muted-foreground">
                {getRatingText(hoveredRating || rating)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Safety Ratings Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Safety & Trust Ratings</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Help others understand the safety aspects of this transaction (optional)
            </p>

            {/* Transaction Safety */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <Label>Transaction Safety</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                How safe did you feel during the transaction process?
              </p>
              {renderStars(safetyRating, setSafetyRating, 'safety')}
            </div>

            {/* Communication Quality */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <Label>Communication</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                How clear and responsive was their communication?
              </p>
              {renderStars(communicationRating, setCommunicationRating, 'communication')}
            </div>

            {/* Reliability */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <Label>Reliability</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Did they meet their commitments and arrive on time?
              </p>
              {renderStars(reliabilityRating, setReliabilityRating, 'reliability')}
            </div>

            {/* Payment Safety */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <Label>Payment Safety</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                How secure and smooth was the payment process?
              </p>
              {renderStars(paymentSafetyRating, setPaymentSafetyRating, 'payment')}
            </div>
          </div>

          <Separator />

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