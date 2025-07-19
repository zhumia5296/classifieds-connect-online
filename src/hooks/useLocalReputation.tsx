import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LocalReputation {
  user_id: string;
  local_reviews_count: number;
  local_average_rating: number;
  local_average_safety: number;
  local_average_communication: number;
  local_average_reliability: number;
  local_average_payment_safety: number;
  local_five_star_count: number;
  local_four_star_count: number;
  local_three_star_count: number;
  local_two_star_count: number;
  local_one_star_count: number;
  search_radius_km: number;
}

export const useLocalReputation = () => {
  const { user } = useAuth();
  const { location } = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Get local reputation for a user within current user's area
  const getLocalReputation = async (
    userId: string, 
    radiusKm: number = 25
  ): Promise<LocalReputation | null> => {
    if (!location?.coords?.latitude || !location?.coords?.longitude) {
      return null;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_local_reputation', {
        target_user_id: userId,
        user_lat: location.coords.latitude,
        user_lng: location.coords.longitude,
        radius_km: radiusKm
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching local reputation:', error);
      toast({
        title: "Error",
        description: "Failed to load local reputation data",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get local reviews for a user (with location filter)
  const getLocalReviews = async (
    userId: string, 
    radiusKm: number = 25
  ) => {
    if (!location?.coords?.latitude || !location?.coords?.longitude) {
      return [];
    }

    try {
      setLoading(true);
      
      // First get all reviews for the user
      const { data: allReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          ad:ads(title)
        `)
        .eq('reviewed_user_id', userId)
        .not('transaction_latitude', 'is', null)
        .not('transaction_longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Filter reviews by distance using our local calculation
      const localReviews = [];
      
      for (const review of allReviews || []) {
        if (review.transaction_latitude && review.transaction_longitude) {
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            review.transaction_latitude,
            review.transaction_longitude
          );
          
          if (distance <= radiusKm) {
            localReviews.push({
              ...review,
              distance_km: distance
            });
          }
        }
      }

      // Get reviewer profiles
      const reviewerIds = localReviews.map(review => review.reviewer_id);
      if (reviewerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', reviewerIds);

        // Merge reviewer data
        return localReviews.map(review => ({
          ...review,
          reviewer: profilesData?.find(profile => profile.user_id === review.reviewer_id) || null
        }));
      }

      return localReviews;
    } catch (error) {
      console.error('Error fetching local reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load local reviews",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get area summary for current location
  const getAreaSummary = async (radiusKm: number = 25) => {
    if (!location?.coords?.latitude || !location?.coords?.longitude) {
      return null;
    }

    try {
      // Get all reviews within the area
      const { data: areaReviews, error } = await supabase
        .from('reviews')
        .select('rating, transaction_location, transaction_latitude, transaction_longitude, created_at')
        .not('transaction_latitude', 'is', null)
        .not('transaction_longitude', 'is', null);

      if (error) throw error;

      // Filter by distance and calculate area stats
      const localAreaReviews = [];
      
      for (const review of areaReviews || []) {
        if (review.transaction_latitude && review.transaction_longitude) {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            review.transaction_latitude,
            review.transaction_longitude
          );
          
          if (distance <= radiusKm) {
            localAreaReviews.push(review);
          }
        }
      }

      const totalReviews = localAreaReviews.length;
      const averageRating = totalReviews > 0 
        ? localAreaReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      return {
        total_reviews: totalReviews,
        average_rating: averageRating,
        area_name: location.address || 'Your area',
        radius_km: radiusKm
      };
    } catch (error) {
      console.error('Error fetching area summary:', error);
      return null;
    }
  };

  return {
    loading,
    getLocalReputation,
    getLocalReviews,
    getAreaSummary,
    calculateDistance,
    userLocation: location
  };
};