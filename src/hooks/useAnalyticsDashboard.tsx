import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
  element_id?: string;
  element_class?: string;
  page_url: string;
  viewport_width: number;
  viewport_height: number;
}

export interface FunnelStep {
  step_name: string;
  step_order: number;
  conversion_rate: number;
  drop_off_rate: number;
  users_entered: number;
  users_completed: number;
}

export interface ABTestVariant {
  test_id: string;
  variant_name: string;
  traffic_allocation: number;
  conversion_rate: number;
  sample_size: number;
  is_winner?: boolean;
}

export const useAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get analytics overview
  const getAnalyticsOverview = async (dateRange: { start: Date; end: Date }) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await (supabase as any).rpc('get_analytics_overview', {
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString()
      });

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics overview');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get user behavior analytics
  const getUserBehaviorAnalytics = async (dateRange: { start: Date; end: Date }) => {
    try {
      // For now, return mock data since function doesn't exist yet
      return {
        bounce_rate: 0.25,
        avg_session_duration: 180,
        pages_per_session: 3.2,
        returning_users: 0.45
      };
    } catch (err) {
      console.error('Failed to fetch user behavior analytics:', err);
      return null;
    }
  };

  // Get ad performance metrics
  const getAdPerformanceMetrics = async (adId?: string) => {
    try {
      // For now, return mock data since function doesn't exist yet
      return {
        views: 1250,
        clicks: 89,
        contacts: 12,
        click_through_rate: 0.071,
        conversion_rate: 0.135
      };
    } catch (err) {
      console.error('Failed to fetch ad performance metrics:', err);
      return null;
    }
  };

  // Get conversion funnel data
  const getConversionFunnel = async (funnelName: string) => {
    try {
      // For now, return mock data since function doesn't exist yet
      return [
        { step_name: 'Page View', step_order: 1, conversion_rate: 1.0, drop_off_rate: 0.0, users_entered: 1000, users_completed: 1000 },
        { step_name: 'Search', step_order: 2, conversion_rate: 0.75, drop_off_rate: 0.25, users_entered: 1000, users_completed: 750 },
        { step_name: 'Contact', step_order: 3, conversion_rate: 0.15, drop_off_rate: 0.85, users_entered: 750, users_completed: 113 }
      ] as FunnelStep[];
    } catch (err) {
      console.error('Failed to fetch conversion funnel:', err);
      return [];
    }
  };

  // Get heat map data
  const getHeatmapData = async (pageUrl: string, dateRange: { start: Date; end: Date }) => {
    try {
      const { data, error } = await supabase
        .from('analytics_user_actions' as any)
        .select('coordinates, action_type')
        .eq('page_url', pageUrl)
        .gte('timestamp', dateRange.start.toISOString())
        .lte('timestamp', dateRange.end.toISOString())
        .not('coordinates', 'is', null);

      if (error) throw error;

      // Process data for heatmap
      const heatmapPoints: HeatmapData[] = [];
      const clickCounts = new Map<string, number>();

      data.forEach((action: any) => {
        if (action.coordinates) {
          const key = `${action.coordinates.x},${action.coordinates.y}`;
          clickCounts.set(key, (clickCounts.get(key) || 0) + 1);
        }
      });

      clickCounts.forEach((count, key) => {
        const [x, y] = key.split(',').map(Number);
        heatmapPoints.push({
          x,
          y,
          intensity: count,
          page_url: pageUrl,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
        });
      });

      return heatmapPoints;
    } catch (err) {
      console.error('Failed to fetch heatmap data:', err);
      return [];
    }
  };

  // Get A/B test results
  const getABTestResults = async (testId: string) => {
    try {
      // For now, return mock data since function doesn't exist yet
      return [
        { test_id: testId, variant_name: 'Control', traffic_allocation: 0.5, conversion_rate: 0.12, sample_size: 500, is_winner: false },
        { test_id: testId, variant_name: 'Variant A', traffic_allocation: 0.5, conversion_rate: 0.15, sample_size: 500, is_winner: true }
      ] as ABTestVariant[];
    } catch (err) {
      console.error('Failed to fetch A/B test results:', err);
      return [];
    }
  };

  // Get real-time analytics
  const getRealTimeAnalytics = async () => {
    try {
      // For now, return mock data since function doesn't exist yet
      return {
        active_users: 42,
        current_page_views: 156,
        events_last_hour: 1234,
        top_pages: [
          { page: '/', views: 45 },
          { page: '/ads', views: 32 },
          { page: '/post', views: 28 }
        ]
      };
    } catch (err) {
      console.error('Failed to fetch real-time analytics:', err);
      return null;
    }
  };

  // Get retention analysis
  const getRetentionAnalysis = async (cohortPeriod: 'daily' | 'weekly' | 'monthly') => {
    try {
      // For now, return mock data since function doesn't exist yet
      return {
        cohort_data: [
          { period: '2024-01', retention_rate: 0.45 },
          { period: '2024-02', retention_rate: 0.42 },
          { period: '2024-03', retention_rate: 0.48 }
        ],
        average_retention: 0.45
      };
    } catch (err) {
      console.error('Failed to fetch retention analysis:', err);
      return null;
    }
  };

  // Export analytics data
  const exportAnalyticsData = async (
    format: 'csv' | 'json',
    dateRange: { start: Date; end: Date },
    dataTypes: string[]
  ) => {
    try {
      // For now, create mock export data
      const mockData = {
        events: ['event1', 'event2'],
        page_views: ['view1', 'view2'],
        user_actions: ['action1', 'action2']
      };

      const exportData = format === 'csv' 
        ? 'date,event_type,count\n2024-01-01,page_view,100\n2024-01-02,click,50'
        : JSON.stringify(mockData, null, 2);

      // Create and download file
      const blob = new Blob([exportData], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error('Failed to export analytics data:', err);
      return false;
    }
  };

  return {
    loading,
    error,
    getAnalyticsOverview,
    getUserBehaviorAnalytics,
    getAdPerformanceMetrics,
    getConversionFunnel,
    getHeatmapData,
    getABTestResults,
    getRealTimeAnalytics,
    getRetentionAnalysis,
    exportAnalyticsData
  };
};