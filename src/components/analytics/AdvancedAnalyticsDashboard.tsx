import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  Download,
  Filter,
  Calendar,
  Target,
  Zap,
  Activity,
  Layers,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdvancedAnalyticsDashboard = () => {
  const {
    loading,
    getAnalyticsOverview,
    getUserBehaviorAnalytics,
    getAdPerformanceMetrics,
    getConversionFunnel,
    getRealTimeAnalytics,
    getRetentionAnalysis,
    exportAnalyticsData
  } = useAnalyticsDashboard();

  const { trackEvent } = useAdvancedAnalytics();

  const [dateRange, setDateRange] = useState('7d');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [behaviorData, setBehaviorData] = useState<any>(null);
  const [adMetrics, setAdMetrics] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any>(null);

  // Calculate date range
  const getDateRangeValues = (range: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return { start, end };
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    const { start, end } = getDateRangeValues(dateRange);
    
    try {
      const [overview, behavior, ads, funnel, realTime, retention] = await Promise.all([
        getAnalyticsOverview({ start, end }),
        getUserBehaviorAnalytics({ start, end }),
        getAdPerformanceMetrics(),
        getConversionFunnel('ad_posting'),
        getRealTimeAnalytics(),
        getRetentionAnalysis('weekly')
      ]);

      setOverviewData(overview);
      setBehaviorData(behavior);
      setAdMetrics(ads);
      setFunnelData(funnel);
      setRealTimeData(realTime);
      setRetentionData(retention);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const handleExport = async (format: 'csv' | 'json') => {
    const { start, end } = getDateRangeValues(dateRange);
    await exportAnalyticsData(format, { start, end }, ['events', 'page_views', 'user_actions']);
    trackEvent('analytics_exported', { format, date_range: dateRange });
  };

  // Mock data for demonstration
  const mockOverviewData = overviewData || {
    total_users: 1247,
    new_users: 89,
    returning_users: 1158,
    total_page_views: 5643,
    bounce_rate: 34.2,
    avg_session_duration: 186,
    conversion_rate: 2.8
  };

  const mockTrafficData = [
    { name: 'Mon', users: 120, page_views: 340 },
    { name: 'Tue', users: 180, page_views: 520 },
    { name: 'Wed', users: 150, page_views: 460 },
    { name: 'Thu', users: 200, page_views: 580 },
    { name: 'Fri', users: 220, page_views: 620 },
    { name: 'Sat', users: 160, page_views: 480 },
    { name: 'Sun', users: 140, page_views: 400 }
  ];

  const mockDeviceData = [
    { name: 'Desktop', value: 45, color: '#0088FE' },
    { name: 'Mobile', value: 40, color: '#00C49F' },
    { name: 'Tablet', value: 15, color: '#FFBB28' }
  ];

  const mockTopPagesData = [
    { page: '/', views: 1234, bounce_rate: 25.3 },
    { page: '/ads', views: 987, bounce_rate: 18.7 },
    { page: '/post-ad', views: 654, bounce_rate: 42.1 },
    { page: '/dashboard', views: 543, bounce_rate: 15.2 },
    { page: '/messages', views: 432, bounce_rate: 12.8 }
  ];

  const mockConversionFunnelData = funnelData || [
    { name: 'Visitors', value: 1000, conversion: 100 },
    { name: 'Sign Up', value: 400, conversion: 40 },
    { name: 'Post Ad', value: 120, conversion: 12 },
    { name: 'Featured Ad', value: 36, conversion: 3.6 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into user behavior and performance metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{mockOverviewData.total_users.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12.3% from last period</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{mockOverviewData.total_page_views.toLocaleString()}</p>
                <p className="text-xs text-green-600">+8.7% from last period</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{mockOverviewData.conversion_rate}%</p>
                <p className="text-xs text-red-600">-0.4% from last period</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{mockOverviewData.bounce_rate}%</p>
                <p className="text-xs text-green-600">-2.1% from last period</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Traffic Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    <Line type="monotone" dataKey="page_views" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockDeviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockDeviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTopPagesData.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{page.page}</div>
                      <div className="text-sm text-muted-foreground">
                        {page.views.toLocaleString()} views
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={page.bounce_rate < 30 ? 'default' : 'secondary'}>
                        {page.bounce_rate}% bounce
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Duration Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { duration: '0-30s', count: 145 },
                    { duration: '30s-1m', count: 234 },
                    { duration: '1-3m', count: 456 },
                    { duration: '3-5m', count: 234 },
                    { duration: '5m+', count: 123 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="duration" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Homepage → Browse Ads</span>
                    <Badge>67%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Browse Ads → Ad Detail</span>
                    <Badge>45%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ad Detail → Contact</span>
                    <Badge>23%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Homepage → Post Ad</span>
                    <Badge>12%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Funnel
                    dataKey="value"
                    data={mockConversionFunnelData}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" stroke="none" />
                  </Funnel>
                  <Tooltip />
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">24</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-muted-foreground">Page Views (Last Hour)</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">8</div>
                <div className="text-sm text-muted-foreground">Conversions Today</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate detailed reports for specific metrics and time periods
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  User Acquisition Report
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  Conversion Analysis
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <Activity className="h-6 w-6 mb-2" />
                  Engagement Metrics
                </Button>
                
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Revenue Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;