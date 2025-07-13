import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalyticsData {
  totalAds: number;
  activeAds: number;
  featuredAds: number;
  totalUsers: number;
  totalMessages: number;
  totalViews: number;
  revenue: number;
  adsToday: number;
  usersToday: number;
  messagesThisWeek: number;
  adsByCategory: Array<{ name: string; value: number; }>;
  adsByDate: Array<{ date: string; count: number; views: number; }>;
  userRegistrations: Array<{ date: string; count: number; }>;
  revenueByDate: Array<{ date: string; revenue: number; }>;
  topCategories: Array<{ name: string; ads: number; }>;
  adPerformance: Array<{ title: string; views: number; messages: number; }>;
  messageActivity: Array<{ date: string; count: number; }>;
  featuredAdStats: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
}

export const useAnalytics = (dateRange: { from: Date; to: Date } = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  to: new Date()
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch basic stats
      const { data: adminStats, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) throw statsError;

      // Type the admin stats properly
      const stats = adminStats as {
        total_ads: number;
        active_ads: number;
        featured_ads: number;
        total_users: number;
        total_messages: number;
        ads_today: number;
        users_today: number;
      };

      // Fetch ads by category
      const { data: categoryData, error: categoryError } = await supabase
        .from('ads')
        .select(`
          categories!inner(name)
        `)
        .eq('is_active', true)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (categoryError) throw categoryError;

      // Process category data
      const categoryMap = new Map();
      categoryData?.forEach(ad => {
        const categoryName = ad.categories?.name || 'Uncategorized';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      });

      const adsByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value: value as number
      }));

      // Fetch ads by date (last 30 days)
      const { data: adsTimeData, error: adsTimeError } = await supabase
        .from('ads')
        .select('created_at, views_count')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (adsTimeError) throw adsTimeError;

      // Process ads by date
      const dateMap = new Map();
      adsTimeData?.forEach(ad => {
        const date = new Date(ad.created_at).toISOString().split('T')[0];
        const existing = dateMap.get(date) || { count: 0, views: 0 };
        dateMap.set(date, {
          count: existing.count + 1,
          views: existing.views + (ad.views_count || 0)
        });
      });

      const adsByDate = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        count: data.count,
        views: data.views
      }));

      // Fetch user registrations
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      // Process user registrations
      const userDateMap = new Map();
      usersData?.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        userDateMap.set(date, (userDateMap.get(date) || 0) + 1);
      });

      const userRegistrations = Array.from(userDateMap.entries()).map(([date, count]) => ({
        date,
        count: count as number
      }));

      // Fetch message activity
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Process message activity
      const messageDateMap = new Map();
      messagesData?.forEach(message => {
        const date = new Date(message.created_at).toISOString().split('T')[0];
        messageDateMap.set(date, (messageDateMap.get(date) || 0) + 1);
      });

      const messageActivity = Array.from(messageDateMap.entries()).map(([date, count]) => ({
        date,
        count: count as number
      }));

      // Fetch featured ad revenue
      const { data: featuredOrdersData, error: featuredError } = await supabase
        .from('featured_ad_orders')
        .select('amount, status, created_at')
        .eq('status', 'paid')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (featuredError) throw featuredError;

      // Process revenue data
      const revenueMap = new Map();
      let totalRevenue = 0;
      let totalOrders = 0;

      featuredOrdersData?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const amount = order.amount / 100; // Convert from cents
        revenueMap.set(date, (revenueMap.get(date) || 0) + amount);
        totalRevenue += amount;
        totalOrders++;
      });

      const revenueByDate = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
        date,
        revenue: revenue as number
      }));

      // Fetch top performing ads
      const { data: topAdsData, error: topAdsError } = await supabase
        .from('ads')
        .select(`
          title,
          views_count,
          messages:messages(count)
        `)
        .eq('is_active', true)
        .order('views_count', { ascending: false })
        .limit(10);

      if (topAdsError) throw topAdsError;

      const adPerformance = topAdsData?.map(ad => ({
        title: ad.title.length > 30 ? ad.title.substring(0, 30) + '...' : ad.title,
        views: ad.views_count || 0,
        messages: Array.isArray(ad.messages) ? ad.messages.length : 0
      })) || [];

      // Calculate this week's messages
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const messagesThisWeek = messagesData?.filter(
        msg => new Date(msg.created_at) >= oneWeekAgo
      ).length || 0;

      // Featured ad stats
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = stats.total_ads > 0 ? (stats.featured_ads / stats.total_ads) * 100 : 0;

      setData({
        totalAds: stats.total_ads || 0,
        activeAds: stats.active_ads || 0,
        featuredAds: stats.featured_ads || 0,
        totalUsers: stats.total_users || 0,
        totalMessages: stats.total_messages || 0,
        totalViews: adsTimeData?.reduce((sum, ad) => sum + (ad.views_count || 0), 0) || 0,
        revenue: totalRevenue,
        adsToday: stats.ads_today || 0,
        usersToday: stats.users_today || 0,
        messagesThisWeek,
        adsByCategory: adsByCategory.slice(0, 8), // Top 8 categories
        adsByDate,
        userRegistrations,
        revenueByDate,
        topCategories: adsByCategory.slice(0, 5).map(cat => ({ name: cat.name, ads: cat.value })),
        adPerformance: adPerformance.slice(0, 5),
        messageActivity,
        featuredAdStats: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          conversionRate
        }
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, dateRange.from, dateRange.to]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  };
};