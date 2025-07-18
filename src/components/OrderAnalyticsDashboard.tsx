import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  Truck,
  Users,
  ShoppingCart,
  BarChart3,
  PieChart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface OrderAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  pendingOrders: number;
  paidOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topCategories: Array<{ name: string; revenue: number; orders: number }>;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
}

export const OrderAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [viewType, setViewType] = useState<'seller' | 'buyer'>('seller');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, viewType]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const daysBack = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), daysBack));
      const endDate = endOfDay(new Date());

      // Base query for orders
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            ad:ads (
              title,
              category_id,
              categories (name)
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Filter by user type
      if (viewType === 'seller') {
        ordersQuery = ordersQuery.eq('seller_id', user.id);
      } else {
        ordersQuery = ordersQuery.eq('user_id', user.id);
      }

      const { data: orders, error } = await ordersQuery;

      if (error) throw error;

      // Previous period for comparison
      const prevStartDate = startOfDay(subDays(new Date(), daysBack * 2));
      const prevEndDate = endOfDay(subDays(new Date(), daysBack));

      let prevOrdersQuery = supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

      if (viewType === 'seller') {
        prevOrdersQuery = prevOrdersQuery.eq('seller_id', user.id);
      } else {
        prevOrdersQuery = prevOrdersQuery.eq('user_id', user.id);
      }

      const { data: prevOrders } = await prevOrdersQuery;

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const statusCounts = {
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        paid: orders?.filter(o => o.status === 'paid').length || 0,
        shipped: orders?.filter(o => o.status === 'shipped').length || 0,
        delivered: orders?.filter(o => o.status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
      };

      const completionRate = totalOrders > 0 ? 
        (statusCounts.delivered / totalOrders) * 100 : 0;

      // Previous period comparison
      const prevRevenue = prevOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const prevOrderCount = prevOrders?.length || 0;

      const revenueGrowth = prevRevenue > 0 ? 
        ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordersGrowth = prevOrderCount > 0 ? 
        ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0;

      // Category analysis
      const categoryMap = new Map();
      orders?.forEach(order => {
        order.order_items.forEach(item => {
          const categoryName = item.ad.categories?.name || 'Uncategorized';
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, { revenue: 0, orders: 0 });
          }
          const category = categoryMap.get(categoryName);
          category.revenue += item.total_price;
          category.orders += 1;
        });
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Daily revenue trend
      const dailyMap = new Map();
      orders?.forEach(order => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { revenue: 0, orders: 0 });
        }
        const day = dailyMap.get(date);
        day.revenue += order.total_amount;
        day.orders += 1;
      });

      const dailyRevenue = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Status distribution for pie chart
      const statusDistribution = [
        { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
        { name: 'Paid', value: statusCounts.paid, color: '#3b82f6' },
        { name: 'Shipped', value: statusCounts.shipped, color: '#8b5cf6' },
        { name: 'Delivered', value: statusCounts.delivered, color: '#10b981' },
        { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' },
      ].filter(item => item.value > 0);

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        completionRate,
        pendingOrders: statusCounts.pending,
        paidOrders: statusCounts.paid,
        shippedOrders: statusCounts.shipped,
        deliveredOrders: statusCounts.delivered,
        cancelledOrders: statusCounts.cancelled,
        revenueGrowth,
        ordersGrowth,
        topCategories,
        dailyRevenue,
        statusDistribution,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={(value) => setViewType(value as 'seller' | 'buyer')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller">Sales</SelectItem>
              <SelectItem value="buyer">Purchases</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total {viewType === 'seller' ? 'Revenue' : 'Spent'}
                </p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                <p className={`text-xs ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analytics.revenueGrowth)} from previous period
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                <p className={`text-xs ${analytics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analytics.ordersGrowth)} from previous period
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-xl font-bold">{analytics.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-xl font-bold">{analytics.paidOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-muted-foreground">Shipped</p>
            <p className="text-xl font-bold">{analytics.shippedOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-xl font-bold">{analytics.deliveredOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-xl font-bold">{analytics.cancelledOrders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="categories">Top Categories</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue & Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="revenue"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.topCategories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value as number) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip />
                    <RechartsPieChart 
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                {analytics.statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};