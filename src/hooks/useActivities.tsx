import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  ad_id?: string;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string;
    avatar_url: string;
  };
  ad?: {
    title: string;
    price: number;
    currency: string;
  };
}

export const useActivities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createActivity = useMutation({
    mutationFn: async (activity: {
      activity_type: string;
      title: string;
      description?: string;
      metadata?: Record<string, any>;
      ad_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("activities")
        .insert({
          user_id: user.id,
          ...activity,
          metadata: activity.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity posted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to post activity",
        variant: "destructive",
      });
      console.error("Activity creation error:", error);
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
      console.error("Activity deletion error:", error);
    },
  });

  return {
    createActivity,
    deleteActivity,
  };
};

export const useUserActivities = (userId: string) => {
  return useQuery({
    queryKey: ["activities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          id,
          user_id,
          activity_type,
          title,
          description,
          metadata,
          ad_id,
          created_at,
          updated_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get user profiles and ad details
      const userIds = [...new Set(data.map(a => a.user_id))];
      const adIds = data.filter(a => a.ad_id).map(a => a.ad_id!);

      const profilesResult = userIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds)
        : { data: [], error: null };

      const adsResult = adIds.length > 0 
        ? await supabase
            .from("ads")
            .select("id, title, price, currency")
            .in("id", adIds)
        : { data: [], error: null };

      if (profilesResult.error) throw profilesResult.error;
      if (adsResult.error) throw adsResult.error;

      return data.map(activity => ({
        ...activity,
        profile: profilesResult.data?.find(p => p.user_id === activity.user_id),
        ad: adsResult.data?.find(a => a.id === activity.ad_id)
      })) as Activity[];
    },
    enabled: !!userId,
  });
};

export const useActivityFeed = () => {
  return useQuery({
    queryKey: ["activityFeed"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get activities from users that the current user follows, plus their own
      const { data, error } = await supabase
        .from("activities")
        .select(`
          id,
          user_id,
          activity_type,
          title,
          description,
          metadata,
          ad_id,
          created_at,
          updated_at
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles and ad details
      const userIds = [...new Set(data.map(a => a.user_id))];
      const adIds = data.filter(a => a.ad_id).map(a => a.ad_id!);

      const profilesResult = userIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds)
        : { data: [], error: null };

      const adsResult = adIds.length > 0 
        ? await supabase
            .from("ads")
            .select("id, title, price, currency")
            .in("id", adIds)
        : { data: [], error: null };

      if (profilesResult.error) throw profilesResult.error;
      if (adsResult.error) throw adsResult.error;

      return data.map(activity => ({
        ...activity,
        profile: profilesResult.data?.find(p => p.user_id === activity.user_id),
        ad: adsResult.data?.find(a => a.id === activity.ad_id)
      })) as Activity[];
    },
  });
};