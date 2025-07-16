import { useState, useEffect } from 'react';
import { useReviews } from './useReviews';

export const useAdReviews = (adId: string, userId: string) => {
  const { getUserReviews, getUserReputation } = useReviews();
  const [reviews, setReviews] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [adId, userId]);

  const loadData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const [reviewsData, reputationData] = await Promise.all([
        getUserReviews(userId),
        getUserReputation(userId)
      ]);

      // Filter reviews related to this ad if needed
      const adReviews = reviewsData.filter(review => 
        review.ad_id === adId || !review.ad_id
      );

      setReviews(adReviews);
      setReputation(reputationData);
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };

  const getRatingDistribution = () => {
    if (reviews.length === 0) return [];
    
    return [5, 4, 3, 2, 1].map(rating => {
      const count = reviews.filter(review => review.rating === rating).length;
      return {
        rating,
        count,
        percentage: (count / reviews.length) * 100
      };
    });
  };

  return {
    reviews,
    reputation,
    loading,
    averageRating: getAverageRating(),
    ratingDistribution: getRatingDistribution(),
    totalReviews: reviews.length,
    refetch: loadData
  };
};