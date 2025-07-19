import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VerificationRequest {
  id: string;
  user_id: string;
  request_type: string;
  business_name?: string;
  business_registration?: string;
  identity_document_url?: string;
  business_document_url?: string;
  website_url?: string;
  social_media_urls?: any;
  additional_info?: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationBadge {
  id: string;
  user_id: string;
  badge_type: string;
  issued_at: string;
  issued_by?: string;
  expires_at?: string;
  metadata?: any;
  is_active: boolean;
  created_at: string;
}

export const useVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRequest, setUserRequest] = useState<VerificationRequest | null>(null);
  const [userBadges, setUserBadges] = useState<VerificationBadge[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's verification request and badges
  useEffect(() => {
    if (user) {
      loadUserVerification();
    }
  }, [user]);

  const loadUserVerification = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load verification request
      const { data: request } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setUserRequest(request);

      // Load verification badges
      const { data: badges } = await supabase
        .from('verification_badges')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      setUserBadges(badges || []);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitVerificationRequest = async (requestData: {
    request_type: string;
    business_name?: string;
    business_registration?: string;
    identity_document_url?: string;
    business_document_url?: string;
    website_url?: string;
    social_media_urls?: any;
    additional_info?: string;
    phone_number?: string;
    area_code?: string;
    verified_location?: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a verification request.",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          ...requestData
        });

      if (error) throw error;

      toast({
        title: "Verification Request Submitted",
        description: "Your verification request has been submitted for review. You'll be notified when it's processed.",
      });

      await loadUserVerification();
      return true;
    } catch (error: any) {
      console.error('Error submitting verification request:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification request. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const canSubmitRequest = () => {
    return !userRequest || userRequest.status === 'rejected';
  };

  const getVerificationStatus = () => {
    if (!userRequest) return 'not_requested';
    return userRequest.status;
  };

  const isVerified = () => {
    return userBadges.length > 0;
  };

  const getVerificationBadgeTypes = () => {
    return userBadges.map(badge => badge.badge_type);
  };

  return {
    userRequest,
    userBadges,
    loading,
    canSubmitRequest,
    getVerificationStatus,
    isVerified,
    getVerificationBadgeTypes,
    submitVerificationRequest,
    loadUserVerification
  };
};

export default useVerification;