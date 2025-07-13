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
      const { data, error } = await supabase.rpc('get_analytics_overview', {
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
      const { data, error } = await supabase.rpc('get_user_behavior_analytics', {
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString()
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch user behavior analytics:', err);
      return null;
    }
  };

  // Get ad performance metrics
  const getAdPerformanceMetrics = async (adId?: string) => {
    try {
      const { data, error } = await supabase.rpc('get_ad_performance_metrics', {
        ad_id: adId || null
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch ad performance metrics:', err);
      return null;
    }
  };

  // Get conversion funnel data
  const getConversionFunnel = async (funnelName: string) => {
    try {
      const { data, error } = await supabase.rpc('get_conversion_funnel', {
        funnel_name: funnelName
      });

      if (error) throw error;
      return data as FunnelStep[];
    } catch (err) {
      console.error('Failed to fetch conversion funnel:', err);
      return [];
    }
  };

  // Get heat map data
  const getHeatmapData = async (pageUrl: string, dateRange: { start: Date; end: Date }) => {
    try {
      const { data, error } = await supabase
        .from('analytics_user_actions')
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
      const { data, error } = await supabase.rpc('get_ab_test_results', {
        test_id: testId
      });

      if (error) throw error;
      return data as ABTestVariant[];
    } catch (err) {
      console.error('Failed to fetch A/B test results:', err);
      return [];
    }
  };

  // Get real-time analytics
  const getRealTimeAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_realtime_analytics');

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch real-time analytics:', err);
      return null;
    }
  };

  // Get retention analysis
  const getRetentionAnalysis = async (cohortPeriod: 'daily' | 'weekly' | 'monthly') => {
    try {
      const { data, error } = await supabase.rpc('get_retention_analysis', {
        cohort_period: cohortPeriod
      });

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase.rpc('export_analytics_data', {
        export_format: format,
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString(),
        data_types: dataTypes
      });

      if (error) throw error;

      // Create and download file
      const blob = new Blob([data], {
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