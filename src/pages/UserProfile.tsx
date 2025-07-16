import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserReputationCard } from '@/components/UserReputationCard';
import { ReviewsList } from '@/components/ReviewsList';
import { ReviewForm } from '@/components/ReviewForm';
import AdCard from '@/components/AdCard';
import { 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  Star,
  MessageSquare,
  Flag,
  Eye,
  Shield
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  is_verified: boolean;
  created_at: string;
}

interface UserAd {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  condition: string;
  created_at: string;
  is_featured: boolean;
  featured_until?: string;
  categories: {
    name: string;
  };
  ad_images: {
    image_url: string;
    is_primary: boolean;
  }[];
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { getUserReputation } = useReviews();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userReputation, setUserReputation] = useState(null);
  const [userAds, setUserAds] = useState<UserAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserReputation();
      loadUserAds();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserReputation = async () => {
    if (userId) {
      const reputation = await getUserReputation(userId);
      setUserReputation(reputation);
    }
  };

  const loadUserAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          price,
          currency,
          location,
          condition,
          created_at,
          is_featured,
          featured_until,
          categories(name),
          ad_images(image_url, is_primary)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setUserAds(data || []);
    } catch (error) {
      console.error('Error loading user ads:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Contact for price';
    
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$'
    };

    const symbol = currencySymbols[currency] || '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  const getImageUrl = (adImages: UserAd['ad_images']) => {
    const primaryImage = adImages.find(img => img.is_primary);
    const fallbackImage = adImages[0];
    const defaultImage = "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop";
    
    return primaryImage?.image_url || fallbackImage?.image_url || defaultImage;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-muted-foreground">This user profile does not exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const canWriteReview = currentUser && currentUser.id !== userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">
                    {profile.display_name || 'Anonymous User'}
                  </h1>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {userAds.length} active ads
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}
                
                <div className="flex gap-3">
                  {canWriteReview && (
                    <Button onClick={() => setShowReviewForm(true)}>
                      <Star className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                  )}
                  {!isOwnProfile && (
                    <>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ads">Active Ads ({userAds.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
          </TabsList>

          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {userAds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active ads found.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {userAds.map((ad) => (
                      <AdCard
                        key={ad.id}
                        id={ad.id}
                        title={ad.title}
                        price={formatPrice(ad.price, ad.currency)}
                        location={ad.location}
                        timeAgo={formatTimeAgo(ad.created_at)}
                        imageUrl={getImageUrl(ad.ad_images)}
                        isFeatured={ad.is_featured}
                        featuredUntil={ad.featured_until}
                        isLiked={false}
                        category={ad.categories?.name || 'Uncategorized'}
                        condition={ad.condition}
                        sellerId={userId}
                        isOwner={isOwnProfile}
                        onToggleSave={() => {}}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsList 
              userId={userId!} 
              showWriteReview={canWriteReview} 
            />
          </TabsContent>

          <TabsContent value="reputation">
            <div className="grid gap-6 lg:grid-cols-2">
              <UserReputationCard reputation={userReputation} />
              <Card>
                <CardHeader>
                  <CardTitle>Reputation Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {userReputation?.reputation_score || 0}
                    </div>
                    <p className="text-muted-foreground">Reputation Points</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {userReputation?.total_sales || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Items Sold</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {userReputation?.total_purchases || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Items Bought</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">How reputation is calculated:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 5-star reviews: +100 points</li>
                      <li>• 4-star reviews: +75 points</li>
                      <li>• 3-star reviews: +50 points</li>
                      <li>• 2-star reviews: +25 points</li>
                      <li>• 1-star reviews: +0 points</li>
                      <li>• Volume bonus: +10 per review (max 500)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Form Modal */}
        <ReviewForm
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          userId={userId!}
          onSubmit={() => {
            loadUserReputation();
            setShowReviewForm(false);
          }}
        />
      </div>
    </div>
  );
};

export default UserProfile;