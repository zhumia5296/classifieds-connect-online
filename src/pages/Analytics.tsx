import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import MetricCard from '@/components/analytics/MetricCard';
import RealTimeAnalytics from '@/components/analytics/RealTimeAnalytics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  Eye, 
  DollarSign,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  Zap,
  Star,
  Activity,
  Filter,
  Search,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  Target,
  Layers,
  PieChart,
  BarChart,
  LineChart,
  MousePointer,
  Navigation,
  MapPin,
  UserCheck,
  AlertCircle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useAdmin();
  const { toast } = useToast();
  const { trackEvent } = useAdvancedAnalytics();

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(false);
  const [advancedMetrics, setAdvancedMetrics] = useState<any>(null);
  const [userBehaviorData, setUserBehaviorData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  const { data, loading, error, refetch } = useAnalytics(dateRange);

  const handleDateRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date();
    let from: Date;

    switch (range) {
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setDateRange({ from, to: now });
  };

  const exportData = () => {
    if (!data) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Ads', data.totalAds],
      ['Active Ads', data.activeAds],
      ['Featured Ads', data.featuredAds],
      ['Total Users', data.totalUsers],
      ['Total Messages', data.totalMessages],
      ['Total Views', data.totalViews],
      ['Revenue', `$${data.revenue.toFixed(2)}`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Analytics data has been downloaded as CSV.",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view analytics</h2>
            <p className="text-muted-foreground">
              You need to be signed in to access analytics data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin or moderator privileges to access analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Analytics</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 days</SelectItem>
              <SelectItem value="month">30 days</SelectItem>
              <SelectItem value="quarter">90 days</SelectItem>
              <SelectItem value="year">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">From Date</label>
                  <Input
                    type="date"
                    value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateRange(prev => ({
                      ...prev,
                      from: e.target.value ? new Date(e.target.value) : new Date()
                    }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">To Date</label>
                  <Input
                    type="date"
                    value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                    onChange={(e) => setDateRange(prev => ({
                      ...prev,
                      to: e.target.value ? new Date(e.target.value) : new Date()
                    }))}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Advanced Filters */}
          <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters & Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {data?.topCategories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="device-filter">Device Type</Label>
                <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                  <SelectTrigger id="device-filter">
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search-filter">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-filter"
                    placeholder="Search metrics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="realtime-mode"
                  checked={realTimeEnabled}
                  onCheckedChange={setRealTimeEnabled}
                />
                <Label htmlFor="realtime-mode" className="text-sm">Real-time</Label>
              </div>
              
              <Button 
                onClick={() => trackEvent('analytics_filter_applied', { 
                  category: selectedCategory, 
                  device: selectedDeviceType, 
                  search: searchQuery 
                })}
                variant="outline"
                size="sm"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="behavior">User Behavior</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Ads"
                value={data.totalAds.toLocaleString()}
                icon={ShoppingBag}
                description={`${data.adsToday} posted today`}
                trend={{ value: 12, direction: 'up', period: 'vs last month' }}
                variant="default"
              />
              
              <MetricCard
                title="Active Users"
                value={data.totalUsers.toLocaleString()}
                icon={Users}
                description={`${data.usersToday} joined today`}
                trend={{ value: 8, direction: 'up', period: 'vs last month' }}
                variant="success"
              />
              
              <MetricCard
                title="Total Messages"
                value={data.totalMessages.toLocaleString()}
                icon={MessageSquare}
                description={`${data.messagesThisWeek} this week`}
                trend={{ value: 15, direction: 'up', period: 'vs last week' }}
                variant="default"
              />
              
              <MetricCard
                title="Revenue"
                value={`$${data.revenue.toFixed(2)}`}
                icon={DollarSign}
                description="From featured ads"
                trend={{ value: 25, direction: 'up', period: 'vs last month' }}
                variant="success"
              />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsChart
                title="Ads Posted Over Time"
                description="Daily ad posting activity"
                data={data.adsByDate}
                type="area"
                dataKey="count"
                xAxisKey="date"
                height={350}
                color="hsl(var(--primary))"
                gradient={true}
                showTrend={true}
                trendValue={12}
                trendDirection="up"
              />
              
              <AnalyticsChart
                title="Ad Views Over Time"
                description="Daily view activity"
                data={data.adsByDate}
                type="line"
                dataKey="views"
                xAxisKey="date"
                height={350}
                color="hsl(var(--chart-2))"
              />
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsChart
                title="Ads by Category"
                description="Distribution of ads across categories"
                data={data.adsByCategory}
                type="pie"
                dataKey="value"
                height={350}
              />
              
              <AnalyticsChart
                title="User Registrations"
                description="New user sign-ups over time"
                data={data.userRegistrations}
                type="bar"
                dataKey="count"
                xAxisKey="date"
                height={350}
                color="hsl(var(--chart-3))"
              />
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Total Views"
                value={data.totalViews.toLocaleString()}
                icon={Eye}
                description="Across all ads"
                variant="default"
              />
              
              <MetricCard
                title="Featured Ads"
                value={data.featuredAds}
                icon={Star}
                description={`${((data.featuredAds / data.totalAds) * 100).toFixed(1)}% of total`}
                variant="warning"
              />
              
              <MetricCard
                title="Avg Messages/Day"
                value={Math.round(data.totalMessages / 30)}
                icon={Activity}
                description="Based on last 30 days"
                variant="default"
              />
            </div>

            {/* Engagement Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsChart
                title="Message Activity"
                description="Daily messaging volume"
                data={data.messageActivity}
                type="area"
                dataKey="count"
                xAxisKey="date"
                height={350}
                color="hsl(var(--chart-4))"
                gradient={true}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Performing Ads</CardTitle>
                  <p className="text-sm text-muted-foreground">By views and messages</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.adPerformance.map((ad, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ad.title}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {ad.views} views
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ad.messages} messages
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total Revenue"
                value={`$${data.featuredAdStats.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                description="All time featured ads"
                variant="success"
              />
              
              <MetricCard
                title="Total Orders"
                value={data.featuredAdStats.totalOrders}
                icon={ShoppingBag}
                description="Featured ad purchases"
                variant="default"
              />
              
              <MetricCard
                title="Avg Order Value"
                value={`$${data.featuredAdStats.averageOrderValue.toFixed(2)}`}
                icon={TrendingUp}
                description="Per featured ad order"
                variant="default"
              />
              
              <MetricCard
                title="Conversion Rate"
                value={`${data.featuredAdStats.conversionRate.toFixed(1)}%`}
                icon={Zap}
                description="Ads that become featured"
                variant="warning"
              />
            </div>

            {/* Revenue Chart */}
            <AnalyticsChart
              title="Revenue Over Time"
              description="Daily revenue from featured ads"
              data={data.revenueByDate}
              type="area"
              dataKey="revenue"
              xAxisKey="date"
              height={400}
              color="hsl(var(--chart-1))"
              gradient={true}
              showTrend={true}
              trendValue={25}
              trendDirection="up"
            />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Most popular categories by ad count
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topCategories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {category.ads} ads
                        </span>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${(category.ads / data.topCategories[0].ads) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsChart
                title="Category Performance"
                description="Ads posted by category"
                data={data.topCategories}
                type="bar"
                dataKey="ads"
                xAxisKey="name"
                height={350}
                color="hsl(var(--chart-5))"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Platform Health</CardTitle>
                  <p className="text-sm text-muted-foreground">Key performance indicators</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active vs Total Ads</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {((data.activeAds / data.totalAds) * 100).toFixed(1)}%
                      </span>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(data.activeAds / data.totalAds) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Featured Ad Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {data.featuredAdStats.conversionRate.toFixed(1)}%
                      </span>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${data.featuredAdStats.conversionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Daily Activity</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {data.adsToday + data.usersToday} events
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Avg Session Duration"
                value="3m 24s"
                icon={Clock}
                description="Time spent per session"
                variant="default"
              />
              
              <MetricCard
                title="Bounce Rate"
                value="32.4%"
                icon={ArrowUpRight}
                description="Single page sessions"
                variant="warning"
              />
              
              <MetricCard
                title="Pages per Session"
                value="2.8"
                icon={Navigation}
                description="Average page views"
                variant="default"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Device Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>Desktop</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">45%</span>
                        <Progress value={45} className="w-20" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Mobile</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">42%</span>
                        <Progress value={42} className="w-20" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tablet className="h-4 w-4" />
                        <span>Tablet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">13%</span>
                        <Progress value={13} className="w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5" />
                    User Journey Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">Homepage → Browse Ads</span>
                      <Badge variant="outline">67%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">Browse → Ad Detail</span>
                      <Badge variant="outline">45%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">Detail → Contact</span>
                      <Badge variant="outline">23%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">Homepage → Post Ad</span>
                      <Badge variant="outline">12%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geographic Tab */}
          <TabsContent value="geographic" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Top Location"
                value="California"
                icon={MapPin}
                description="Most active region"
                variant="default"
              />
              
              <MetricCard
                title="Global Reach"
                value="24 Countries"
                icon={Globe}
                description="Users worldwide"
                variant="success"
              />
              
              <MetricCard
                title="City Coverage"
                value="156 Cities"
                icon={Navigation}
                description="Active locations"
                variant="default"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  User activity by location
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Top Countries</h4>
                    {[
                      { country: 'United States', users: 2847, percentage: 68 },
                      { country: 'Canada', users: 423, percentage: 10 },
                      { country: 'United Kingdom', users: 312, percentage: 7 },
                      { country: 'Australia', users: 198, percentage: 5 },
                      { country: 'Germany', users: 156, percentage: 4 }
                    ].map((location, index) => (
                      <div key={location.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{location.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {location.users} users
                          </span>
                          <Progress value={location.percentage} className="w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Top Cities</h4>
                    {[
                      { city: 'New York', users: 892 },
                      { city: 'Los Angeles', users: 654 },
                      { city: 'Toronto', users: 432 },
                      { city: 'London', users: 312 },
                      { city: 'Sydney', users: 198 }
                    ].map((city, index) => (
                      <div key={city.city} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{city.city}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {city.users} users
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Tab */}
          <TabsContent value="realtime" className="space-y-6">
            {realTimeEnabled ? (
              <RealTimeAnalytics />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        24 <span className="text-xs text-muted-foreground">LIVE</span>
                      </div>
                      <div className="text-sm text-muted-foreground">Active Users Right Now</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-2">156</div>
                      <div className="text-sm text-muted-foreground">Page Views (Last Hour)</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-2">8</div>
                      <div className="text-sm text-muted-foreground">Conversions Today</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity Feed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { time: '2 minutes ago', action: 'New user registered', type: 'user' },
                        { time: '4 minutes ago', action: 'Ad posted in Electronics', type: 'ad' },
                        { time: '7 minutes ago', action: 'Message sent', type: 'message' },
                        { time: '12 minutes ago', action: 'Featured ad purchased', type: 'revenue' },
                        { time: '15 minutes ago', action: 'User logged in from mobile', type: 'user' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            activity.type === 'user' && "bg-blue-500",
                            activity.type === 'ad' && "bg-green-500",
                            activity.type === 'message' && "bg-yellow-500",
                            activity.type === 'revenue' && "bg-purple-500"
                          )} />
                          <div className="flex-1">
                            <span className="text-sm">{activity.action}</span>
                            <span className="text-xs text-muted-foreground ml-2">{activity.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Custom Reports & Exports
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate detailed reports for specific metrics and time periods
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => trackEvent('custom_report_requested', { type: 'user_acquisition' })}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">User Acquisition Report</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => trackEvent('custom_report_requested', { type: 'conversion' })}
                  >
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Conversion Analysis</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => trackEvent('custom_report_requested', { type: 'revenue' })}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span className="text-sm">Revenue Report</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => trackEvent('custom_report_requested', { type: 'engagement' })}
                  >
                    <Activity className="h-6 w-6" />
                    <span className="text-sm">Engagement Metrics</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => trackEvent('custom_report_requested', { type: 'geographic' })}
                  >
                    <Globe className="h-6 w-6" />
                    <span className="text-sm">Geographic Report</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2"
                    onClick={() => trackEvent('custom_report_requested', { type: 'performance' })}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">Performance Report</span>
                  </Button>
                </div>

                <Separator className="my-6" />

                <div>
                  <h4 className="font-medium mb-4">Advanced Analytics Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Layers className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Cohort Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Track user retention and behavior patterns over time
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Funnel Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Identify conversion bottlenecks and optimization opportunities
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <UserCheck className="h-5 w-5 text-green-600" />
                        <span className="font-medium">User Segmentation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Analyze behavior patterns across different user groups
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">Anomaly Detection</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Automatically detect unusual patterns in your data
                      </p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
      ) : null}
    </div>
  );
};

export default Analytics;