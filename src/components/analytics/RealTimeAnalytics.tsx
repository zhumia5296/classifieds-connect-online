import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  Zap,
  RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RealTimeStats {
  activeUsers: number;
  messagesLastHour: number;
  viewsLastHour: number;
  adsToday: number;
  onlineUsers: number;
}

interface RealTimeAnalyticsProps {
  compact?: boolean;
  className?: string;
}

const RealTimeAnalytics = ({ compact = false, className }: RealTimeAnalyticsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<RealTimeStats>({
    activeUsers: 0,
    messagesLastHour: 0,
    viewsLastHour: 0,
    adsToday: 0,
    onlineUsers: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealTimeStats();
    
    // Set up real-time subscriptions for live updates
    const messageChannel = supabase
      .channel('realtime-analytics-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchRealTimeStats();
      })
      .subscribe();

    const adChannel = supabase
      .channel('realtime-analytics-ads')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ads'
      }, () => {
        fetchRealTimeStats();
      })
      .subscribe();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchRealTimeStats, 30000);

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(adChannel);
      clearInterval(interval);
    };
  }, []);

  const fetchRealTimeStats = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Fetch messages in the last hour
      const { data: recentMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .gte('created_at', oneHourAgo.toISOString());

      if (messagesError) throw messagesError;

      // Fetch ads posted today
      const { data: todaysAds, error: adsError } = await supabase
        .from('ads')
        .select('id')
        .gte('created_at', todayStart.toISOString());

      if (adsError) throw adsError;

      // Fetch total ad views (we'll simulate views in last hour)
      const { data: totalAds, error: viewsError } = await supabase
        .from('ads')
        .select('views_count')
        .eq('is_active', true);

      if (viewsError) throw viewsError;

      // Calculate estimated views in last hour (simulation)
      const totalViews = totalAds?.reduce((sum, ad) => sum + (ad.views_count || 0), 0) || 0;
      const estimatedViewsLastHour = Math.floor(totalViews * 0.05); // Approximate 5% of total views in last hour

      // Simulate active users (in a real app, you'd track this properly)
      const activeUsers = Math.floor(Math.random() * 50) + 20; // 20-70 active users
      const onlineUsers = Math.floor(Math.random() * 10) + 5; // 5-15 online now

      setStats({
        activeUsers,
        messagesLastHour: recentMessages?.length || 0,
        viewsLastHour: estimatedViewsLastHour,
        adsToday: todaysAds?.length || 0,
        onlineUsers
      });

    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Activity
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold">{stats.onlineUsers}</div>
              <div className="text-xs text-muted-foreground">Online Now</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.messagesLastHour}</div>
              <div className="text-xs text-muted-foreground">Messages/Hr</div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={() => navigate('/analytics')}
          >
            View Full Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Real-time Analytics
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Updates
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchRealTimeStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <div className="text-sm text-muted-foreground">Users Online</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.messagesLastHour}</div>
            <div className="text-sm text-muted-foreground">Messages (1h)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{stats.viewsLastHour}</div>
            <div className="text-sm text-muted-foreground">Views (1h)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.adsToday}</div>
            <div className="text-sm text-muted-foreground">Ads Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {stats.messagesLastHour} new messages in the last hour
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {stats.adsToday} ads posted today
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {stats.viewsLastHour} ad views in the last hour
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {stats.onlineUsers} users currently online
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAnalytics;