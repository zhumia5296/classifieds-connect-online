import { useState, useEffect } from 'react';
import { Star, Filter, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { useReviews, Review } from '@/hooks/useReviews';

interface ReviewsListProps {
  userId: string;
  showWriteReview?: boolean;
  adId?: string;
  adTitle?: string;
}

export const ReviewsList = ({ userId, showWriteReview = false, adId, adTitle }: ReviewsListProps) => {
  const { getUserReviews, deleteReview, loading } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    loadReviews();
  }, [userId]);

  useEffect(() => {
    filterAndSortReviews();
  }, [reviews, searchQuery, ratingFilter, sortBy]);

  const loadReviews = async () => {
    const data = await getUserReviews(userId);
    setReviews(data);
  };

  const filterAndSortReviews = () => {
    let filtered = [...reviews];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(review =>
        review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.comment?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(review => review.rating === rating);
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'rating-high':
          return b.rating - a.rating;
        case 'rating-low':
          return a.rating - b.rating;
        case 'helpful':
          return b.helpful_count - a.helpful_count;
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredReviews(filtered);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      await loadReviews();
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsReviewFormOpen(true);
  };

  const handleReviewFormClose = () => {
    setIsReviewFormOpen(false);
    setEditingReview(undefined);
  };

  const handleReviewSubmit = () => {
    loadReviews();
  };

  const getRatingStats = () => {
    const totalReviews = reviews.length;
    if (totalReviews === 0) return { average: 0, distribution: [] };

    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const distribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length,
      percentage: (reviews.filter(review => review.rating === rating).length / totalReviews) * 100
    }));

    return { average, distribution };
  };

  const stats = getRatingStats();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Write Review Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
          {stats.average > 0 && (
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(stats.average)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{stats.average.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                average rating
              </span>
            </div>
          )}
        </div>
        {showWriteReview && (
          <Button onClick={() => setIsReviewFormOpen(true)}>
            Write Review
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SortDesc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="rating-high">Highest Rating</SelectItem>
              <SelectItem value="rating-low">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.distribution.map((item) => (
            <Badge
              key={item.rating}
              variant="outline"
              className="cursor-pointer"
              onClick={() => setRatingFilter(item.rating.toString())}
            >
              {item.rating} ★ ({item.count})
            </Badge>
          ))}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {reviews.length === 0 ? (
              <p>No reviews yet. Be the first to leave a review!</p>
            ) : (
              <p>No reviews match your current filters.</p>
            )}
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
            />
          ))
        )}
      </div>

      {/* Review Form */}
      <ReviewForm
        isOpen={isReviewFormOpen}
        onClose={handleReviewFormClose}
        userId={userId}
        adId={adId}
        adTitle={adTitle}
        existingReview={editingReview}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};