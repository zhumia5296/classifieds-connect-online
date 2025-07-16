import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower_profile?: {
    display_name: string;
    avatar_url: string;
  };
  following_profile?: {
    display_name: string;
    avatar_url: string;
  };
}

export const useFollows = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const followUser = useMutation({
    mutationFn: async (followingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_follows")
        .insert({
          follower_id: user.id,
          following_id: followingId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User followed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
      console.error("Follow error:", error);
    },
  });

  const unfollowUser = useMutation({
    mutationFn: async (followingId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", followingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User unfollowed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
      console.error("Unfollow error:", error);
    },
  });

  return {
    followUser,
    unfollowUser,
  };
};

export const useIsFollowing = (userId: string) => {
  return useQuery({
    queryKey: ["isFollowing", userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });
};

export const useFollowers = (userId: string) => {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          id,
          follower_id,
          following_id,
          created_at
        `)
        .eq("following_id", userId);

      if (error) throw error;

      // Get follower profiles separately
      const followerIds = data.map(f => f.follower_id);
      if (followerIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", followerIds);

      if (profilesError) throw profilesError;

      return data.map(follow => ({
        ...follow,
        follower_profile: profiles?.find(p => p.user_id === follow.follower_id) || {
          display_name: "Unknown User",
          avatar_url: null
        }
      })) as UserFollow[];
    },
    enabled: !!userId,
  });
};

export const useFollowing = (userId: string) => {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_follows")
        .select(`
          id,
          follower_id,
          following_id,
          created_at
        `)
        .eq("follower_id", userId);

      if (error) throw error;

      // Get following profiles separately
      const followingIds = data.map(f => f.following_id);
      if (followingIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", followingIds);

      if (profilesError) throw profilesError;

      return data.map(follow => ({
        ...follow,
        following_profile: profiles?.find(p => p.user_id === follow.following_id) || {
          display_name: "Unknown User",
          avatar_url: null
        }
      })) as UserFollow[];
    },
    enabled: !!userId,
  });
};

export const useFollowCounts = (userId: string) => {
  return useQuery({
    queryKey: ["followCounts", userId],
    queryFn: async () => {
      const [followersResult, followingResult] = await Promise.all([
        supabase.rpc("get_followers_count", { target_user_id: userId }),
        supabase.rpc("get_following_count", { target_user_id: userId }),
      ]);

      if (followersResult.error) throw followersResult.error;
      if (followingResult.error) throw followingResult.error;

      return {
        followers: followersResult.data || 0,
        following: followingResult.data || 0,
      };
    },
    enabled: !!userId,
  });
};