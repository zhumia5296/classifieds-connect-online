import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  Star, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Eye,
  BarChart3,
  Zap,
  Timer,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

interface PromotedAd {
  id: string;
  ad_id: string;
  amount: number;
  duration_days: number;
  status: string;
  featured_until: string;
  created_at: string;
  ads: {
    id: string;
    title: string;
    price: number;
    currency: string;
    views_count: number;
    is_featured: boolean;
    ad_images: {
      image_url: string;
      is_primary: boolean;
    }[];
  };
}

interface PromotionStats {
  totalSpent: number;
  activePromotions: number;
  totalViews: number;
  averageROI: number;
  thisMonthSpent: number;
  thisMonthViews: number;
}

const PromotionDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promotedAds, setPromotedAds] = useState<PromotedAd[]>([]);
  const [stats, setStats] = useState<PromotionStats>({
    totalSpent: 0,
    activePromotions: 0,
    totalViews: 0,
    averageROI: 0,
    thisMonthSpent: 0,
    thisMonthViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPromotionData();
    }
  }, [user]);

  const fetchPromotionData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch promoted ads with ad details
      const { data: promotions, error } = await supabase
        .from('featured_ad_orders')
        .select(`
          id,
          ad_id,
          amount,
          duration_days,
          status,
          featured_until,
          created_at,
          ads (
            id,
            title,
            price,
            currency,
            views_count,
            is_featured,
            ad_images (
              image_url,
              is_primary
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPromotedAds(promotions || []);

      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalSpent = promotions?.reduce((sum, p) => sum + (p.amount / 100), 0) || 0;
      const activePromotions = promotions?.filter(p => 
        p.status === 'completed' && 
        p.featured_until && 
        new Date(p.featured_until) > now
      ).length || 0;
      
      const totalViews = promotions?.reduce((sum, p) => sum + (p.ads?.views_count || 0), 0) || 0;
      const thisMonthSpent = promotions?.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).reduce((sum, p) => sum + (p.amount / 100), 0) || 0;
      
      const thisMonthViews = promotions?.filter(p => 
        new Date(p.created_at) >= thisMonth
      ).reduce((sum, p) => sum + (p.ads?.views_count || 0), 0) || 0;

      setStats({
        totalSpent,
        activePromotions,
        totalViews,
        averageROI: totalSpent > 0 ? (totalViews / totalSpent) : 0,
        thisMonthSpent,
        thisMonthViews
      });

    } catch (error) {
      console.error('Error fetching promotion data:', error);
      toast({
        title: "Error",
        description: "Failed to load promotion data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPromotionData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Promotion data has been updated.",
    });
  };

  const getPromotionStatus = (promotion: PromotedAd) => {
    if (promotion.status !== 'completed') {
      return { label: promotion.status, variant: 'secondary' as const, color: 'text-yellow-600' };
    }
    
    if (!promotion.featured_until) {
      return { label: 'Active', variant: 'default' as const, color: 'text-green-600' };
    }
    
    const now = new Date();
    const endDate = new Date(promotion.featured_until);
    
    if (endDate > now) {
      return { label: 'Active', variant: 'default' as const, color: 'text-green-600' };
    } else {
      return { label: 'Expired', variant: 'outline' as const, color: 'text-gray-600' };
    }
  };

  const getRemainingTime = (featuredUntil: string) => {
    const now = new Date();
    const end = new Date(featuredUntil);
    const remaining = end.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPackageType = (amount: number, duration: number) => {
    const packageTypes = [
      { amount: 299, name: 'Quick Boost', icon: TrendingUp, color: 'text-blue-600' },
      { amount: 699, name: 'Featured', icon: Star, color: 'text-amber-600' },
      { amount: 1299, name: 'Premium Spotlight', icon: Crown, color: 'text-purple-600' },
      { amount: 2499, name: 'Super Boost', icon: Zap, color: 'text-pink-600' }
    ];
    
    const match = packageTypes.find(p => p.amount === amount);
    return match || { name: 'Custom', icon: Star, color: 'text-gray-600' };
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>Please sign in to view your promotion dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotion Dashboard</h1>
          <p className="text-muted-foreground">Manage and track your ad promotions</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Promotions</p>
                <p className="text-2xl font-bold">{stats.activePromotions}</p>
              </div>
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Views/Dollar</p>
                <p className="text-2xl font-bold">{stats.averageROI.toFixed(0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Month Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Month Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Spent This Month</p>
              <p className="text-2xl font-bold text-green-600">${stats.thisMonthSpent.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Views This Month</p>
              <p className="text-2xl font-bold text-blue-600">{stats.thisMonthViews.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly ROI</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.thisMonthSpent > 0 ? (stats.thisMonthViews / stats.thisMonthSpent).toFixed(0) : '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promoted Ads */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Promotions ({stats.activePromotions})</TabsTrigger>
          <TabsTrigger value="all">All Promotions ({promotedAds.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {promotedAds.filter(p => {
            const status = getPromotionStatus(p);
            return status.label === 'Active';
          }).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Promotions</h3>
                <p className="text-muted-foreground mb-4">
                  Start promoting your ads to get more visibility and responses.
                </p>
                <Button asChild>
                  <Link to="/dashboard">
                    <Star className="h-4 w-4 mr-2" />
                    Promote an Ad
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {promotedAds
                .filter(p => getPromotionStatus(p).label === 'Active')
                .map((promotion) => {
                  const status = getPromotionStatus(promotion);
                  const packageType = getPackageType(promotion.amount, promotion.duration_days);
                  const IconComponent = packageType.icon;
                  const primaryImage = promotion.ads?.ad_images?.find(img => img.is_primary)?.image_url || 
                                     promotion.ads?.ad_images?.[0]?.image_url;

                  return (
                    <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {primaryImage && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={primaryImage}
                                alt={promotion.ads?.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{promotion.ads?.title}</h3>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <IconComponent className={`h-4 w-4 ${packageType.color}`} />
                                <span>{packageType.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatAmount(promotion.amount)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{promotion.ads?.views_count || 0} views</span>
                              </div>
                              {promotion.featured_until && (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-4 w-4" />
                                  <span>{getRemainingTime(promotion.featured_until)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/ad/${promotion.ad_id}`}>
                              View Ad
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          {promotedAds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Promotions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't promoted any ads yet. Start promoting to boost your visibility!
                </p>
                <Button asChild>
                  <Link to="/dashboard">
                    <Star className="h-4 w-4 mr-2" />
                    Promote Your First Ad
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {promotedAds.map((promotion) => {
                const status = getPromotionStatus(promotion);
                const packageType = getPackageType(promotion.amount, promotion.duration_days);
                const IconComponent = packageType.icon;
                const primaryImage = promotion.ads?.ad_images?.find(img => img.is_primary)?.image_url || 
                                   promotion.ads?.ad_images?.[0]?.image_url;

                return (
                  <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {primaryImage && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={primaryImage}
                              alt={promotion.ads?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{promotion.ads?.title}</h3>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <IconComponent className={`h-4 w-4 ${packageType.color}`} />
                              <span>{packageType.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatAmount(promotion.amount)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{promotion.ads?.views_count || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(promotion.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/ad/${promotion.ad_id}`}>
                            View Ad
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PromotionDashboard;