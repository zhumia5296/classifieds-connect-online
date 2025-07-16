import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Star, 
  Crown, 
  Zap, 
  TrendingUp, 
  Eye, 
  ArrowUp, 
  Clock,
  DollarSign,
  Target,
  Sparkles,
  Megaphone,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PromotionPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  icon: React.ComponentType<any>;
  color: string;
  popular?: boolean;
  priority: number;
  estimatedViews: string;
  boostMultiplier: number;
}

interface AdPromotionToolsProps {
  adId: string;
  adTitle: string;
  isOwner: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
  currentViews?: number;
}

const promotionPackages: PromotionPackage[] = [
  {
    id: 'quick-boost',
    name: 'Quick Boost',
    duration: 3,
    price: 2.99,
    description: 'Perfect for weekend sales or urgent listings',
    features: [
      'Top placement for 3 days',
      'Highlighted border',
      'Badge indicator',
      '3x visibility boost'
    ],
    icon: TrendingUp,
    color: 'text-blue-600',
    priority: 1,
    estimatedViews: '500-800',
    boostMultiplier: 3
  },
  {
    id: 'featured',
    name: 'Featured',
    duration: 7,
    price: 6.99,
    originalPrice: 8.99,
    description: 'Great for regular items and steady exposure',
    features: [
      'Premium placement for 1 week',
      'Enhanced ad styling',
      'Featured badge',
      '5x visibility boost',
      'Search priority'
    ],
    icon: Star,
    color: 'text-amber-600',
    priority: 2,
    estimatedViews: '1,200-2,000',
    boostMultiplier: 5
  },
  {
    id: 'premium',
    name: 'Premium Spotlight',
    duration: 14,
    price: 12.99,
    originalPrice: 16.99,
    description: 'Ideal for high-value items and maximum exposure',
    features: [
      'Top priority placement for 2 weeks',
      'Premium spotlight design',
      'Animated featured badge',
      '8x visibility boost',
      'Category page prominence',
      'Mobile app highlighting'
    ],
    icon: Crown,
    color: 'text-purple-600',
    popular: true,
    priority: 3,
    estimatedViews: '2,500-4,000',
    boostMultiplier: 8
  },
  {
    id: 'super-boost',
    name: 'Super Boost',
    duration: 30,
    price: 24.99,
    originalPrice: 32.99,
    description: 'Maximum visibility for premium items and businesses',
    features: [
      'Maximum exposure for 1 month',
      'Ultra-premium styling',
      'Animated spotlight effects',
      '12x visibility boost',
      'Homepage feature slot',
      'Social media sharing boost',
      'Email newsletter inclusion',
      'Mobile push notification feature'
    ],
    icon: Rocket,
    color: 'text-gradient-to-r from-pink-600 to-purple-600',
    priority: 4,
    estimatedViews: '5,000-8,000',
    boostMultiplier: 12
  }
];

const AdPromotionTools: React.FC<AdPromotionToolsProps> = ({
  adId,
  adTitle,
  isOwner,
  isFeatured = false,
  featuredUntil,
  currentViews = 0
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);
  const [promotionStats, setPromotionStats] = useState({
    totalViews: 0,
    todayViews: 0,
    averageDaily: 0,
    clickThrough: 0
  });

  useEffect(() => {
    if (isOwner) {
      fetchPromotionStats();
      fetchActivePromotions();
    }
  }, [isOwner, adId]);

  const fetchPromotionStats = async () => {
    try {
      // This would typically fetch real analytics data
      // For now, we'll simulate with the current views
      const baseViews = currentViews || 0;
      setPromotionStats({
        totalViews: baseViews,
        todayViews: Math.floor(baseViews * 0.1),
        averageDaily: Math.floor(baseViews / 7),
        clickThrough: Math.floor(Math.random() * 8) + 2
      });
    } catch (error) {
      console.error('Error fetching promotion stats:', error);
    }
  };

  const fetchActivePromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_ad_orders')
        .select('*')
        .eq('ad_id', adId)
        .eq('status', 'completed')
        .gte('featured_until', new Date().toISOString());

      if (error) throw error;
      setActivePromotions(data || []);
    } catch (error) {
      console.error('Error fetching active promotions:', error);
    }
  };

  const handlePromote = async (packageData: PromotionPackage) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to promote your ad.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(packageData.id);

      const { data, error } = await supabase.functions.invoke('feature-ad-payment', {
        body: { 
          ad_id: adId, 
          duration_days: packageData.duration,
          package_type: packageData.id,
          amount: Math.round(packageData.price * 100) // Convert to cents
        }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');

      toast({
        title: "Redirecting to Payment",
        description: `Setting up ${packageData.name} promotion for "${adTitle}"`,
      });

    } catch (error) {
      console.error('Error creating promotion:', error);
      toast({
        title: "Error",
        description: "Failed to create promotion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const calculateROI = (packageData: PromotionPackage) => {
    const estimatedViews = parseInt(packageData.estimatedViews.split('-')[0].replace(',', ''));
    const costPerView = packageData.price / estimatedViews;
    return (costPerView * 1000).toFixed(2); // Cost per 1000 views
  };

  const getRemainingTime = () => {
    if (!isFeatured || !featuredUntil) return null;
    
    const now = new Date();
    const end = new Date(featuredUntil);
    const remaining = end.getTime() - now.getTime();
    
    if (remaining <= 0) return null;
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (!isOwner) return null;

  const isCurrentlyPromoted = isFeatured && featuredUntil && new Date(featuredUntil) > new Date();
  const remainingTime = getRemainingTime();

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {isCurrentlyPromoted ? (
        <Card className="border-primary bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/20">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Promotion Active</CardTitle>
                  <CardDescription>Your ad is currently being promoted</CardDescription>
                </div>
              </div>
              <Badge variant="default" className="animate-pulse">
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{promotionStats.totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">+{promotionStats.todayViews}</div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{promotionStats.clickThrough}%</div>
                <div className="text-sm text-muted-foreground">CTR</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{remainingTime}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <CardTitle>Boost Your Ad Performance</CardTitle>
            </div>
            <CardDescription>
              Increase visibility and get more responses with our promotion packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{promotionStats.totalViews}</div>
                <div className="text-sm text-muted-foreground">Current Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{promotionStats.averageDaily}</div>
                <div className="text-sm text-muted-foreground">Daily Average</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{promotionStats.clickThrough}%</div>
                <div className="text-sm text-muted-foreground">Response Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-muted-foreground">--</div>
                <div className="text-sm text-muted-foreground">Boost Potential</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promotion Packages */}
      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages">Promotion Packages</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="packages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {promotionPackages.map((pkg) => {
              const IconComponent = pkg.icon;
              const isLoading = loading === pkg.id;
              
              return (
                <Card
                  key={pkg.id}
                  className={`relative transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    pkg.popular 
                      ? 'ring-2 ring-primary/50 bg-gradient-to-br from-primary/5 to-primary/10' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground animate-pulse">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-3">
                    <div className="flex justify-center mb-2">
                      <div className={`p-3 rounded-full bg-background shadow-lg ${pkg.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl font-bold">${pkg.price}</span>
                        {pkg.originalPrice && (
                          <span className="text-lg text-muted-foreground line-through">
                            ${pkg.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pkg.duration} days • ${calculateROI(pkg)} per 1K views
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      {pkg.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Estimated Views
                        </span>
                        <span className="font-medium">{pkg.estimatedViews}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Visibility Boost
                        </span>
                        <span className="font-medium">{pkg.boostMultiplier}x</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-1 w-1 bg-primary rounded-full" />
                          {feature}
                        </div>
                      ))}
                      {pkg.features.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{pkg.features.length - 3} more features
                        </div>
                      )}
                    </div>
                    
                    <Button
                      className="w-full"
                      variant={pkg.popular ? "default" : "outline"}
                      onClick={() => handlePromote(pkg)}
                      disabled={isLoading || isCurrentlyPromoted}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                          Processing...
                        </div>
                      ) : isCurrentlyPromoted ? (
                        'Already Promoted'
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Promote Now
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Views</span>
                    <span className="font-bold">{promotionStats.totalViews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="font-bold text-green-600">+{promotionStats.todayViews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Avg</span>
                    <span className="font-bold">{promotionStats.averageDaily}</span>
                  </div>
                  <Progress value={Math.min((promotionStats.todayViews / promotionStats.averageDaily) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{promotionStats.clickThrough}%</div>
                    <div className="text-sm text-muted-foreground">Click-through Rate</div>
                  </div>
                  <Progress value={promotionStats.clickThrough * 10} className="h-2" />
                  <div className="text-xs text-center text-muted-foreground">
                    {promotionStats.clickThrough > 5 ? 'Above average' : 'Below average'} performance
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Promotion ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">--</div>
                    <div className="text-sm text-muted-foreground">Estimated ROI</div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    Promote your ad to see ROI metrics
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Promotion History */}
          {activePromotions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promotion History</CardTitle>
                <CardDescription>Your recent promotion campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activePromotions.map((promotion, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-medium">{promotion.duration_days} Day Promotion</div>
                        <div className="text-sm text-muted-foreground">
                          ${(promotion.amount / 100).toFixed(2)} • 
                          {new Date(promotion.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">{promotion.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdPromotionTools;