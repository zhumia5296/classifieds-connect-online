import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  ad_id?: string;
  rating: number;
  title: string;
  comment?: string;
  transaction_type?: 'buying' | 'selling';
  is_verified: boolean;
  helpful_count: number;
  safety_rating?: number;
  communication_rating?: number;
  reliability_rating?: number;
  payment_safety_rating?: number;
  created_at: string;
  updated_at: string;
  reviewer?: {
    display_name?: string;
    avatar_url?: string;
  };
  ad?: {
    title: string;
  };
}

export interface UserReputation {
  id: string;
  user_id: string;
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  total_sales: number;
  total_purchases: number;
  reputation_score: number;
  average_safety_rating: number;
  average_communication_rating: number;
  average_reliability_rating: number;
  average_payment_safety_rating: number;
  overall_safety_score: number;
  last_updated: string;
}

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Fetch reviews for a specific user
  const getUserReviews = async (userId: string) => {
    try {
      setLoading(true);
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          *,
          ad:ads(title)
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reviewer profiles separately since there's no foreign key
      const reviewerIds = reviewsData?.map(review => review.reviewer_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', reviewerIds);

      // Merge the data
      const reviews = reviewsData?.map(review => ({
        ...review,
        reviewer: profilesData?.find(profile => profile.user_id === review.reviewer_id) || null
      })) || [];

      return reviews as Review[];
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch user reputation
  const getUserReputation = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserReputation | null;
    } catch (error) {
      console.error('Error fetching user reputation:', error);
      return null;
    }
  };

  // Create a new review
  const createReview = async (reviewData: {
    reviewed_user_id: string;
    ad_id?: string;
    rating: number;
    title: string;
    comment?: string;
    transaction_type?: 'buying' | 'selling';
    safety_rating?: number;
    communication_rating?: number;
    reliability_rating?: number;
    payment_safety_rating?: number;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: user.id,
          ...reviewData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      return data;
    } catch (error: any) {
      console.error('Error creating review:', error);
      if (error.code === '23505') {
        toast({
          title: "Review already exists",
          description: "You have already reviewed this user for this transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review",
          variant: "destructive",
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing review
  const updateReview = async (reviewId: string, updates: {
    rating?: number;
    title?: string;
    comment?: string;
    safety_rating?: number;
    communication_rating?: number;
    reliability_rating?: number;
    payment_safety_rating?: number;
  }) => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)
        .eq('reviewer_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Review updated",
        description: "Your review has been updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: "Error",
        description: "Failed to update review",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('reviewer_id', user.id);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been removed",
      });

      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Vote on review helpfulness
  const voteOnReview = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to vote on reviews",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('review_votes')
        .upsert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error voting on review:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get review vote status for current user
  const getReviewVote = async (reviewId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('review_votes')
        .select('is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.is_helpful ?? null;
    } catch (error) {
      console.error('Error fetching review vote:', error);
      return null;
    }
  };

  // Calculate reputation level based on score
  const getReputationLevel = (score: number) => {
    if (score >= 2000) return { level: 'Elite', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    if (score >= 1500) return { level: 'Expert', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 1000) return { level: 'Advanced', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 500) return { level: 'Intermediate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 100) return { level: 'Beginner', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    return { level: 'New', color: 'text-gray-400', bgColor: 'bg-gray-50' };
  };

  return {
    loading,
    getUserReviews,
    getUserReputation,
    createReview,
    updateReview,
    deleteReview,
    voteOnReview,
    getReviewVote,
    getReputationLevel,
  };
};