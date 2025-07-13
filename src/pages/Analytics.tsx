import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';
import MetricCard from '@/components/analytics/MetricCard';
import { useToast } from '@/hooks/use-toast';
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
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Analytics = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useAdmin();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });

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
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                className={cn("p-3 pointer-events-auto")}
              />
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
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
        </Tabs>
      ) : null}
    </div>
  );
};

export default Analytics;