import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Edit, MapPin, Calendar, Star, MessageCircle, ArrowLeft, Flag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/Navbar';
import { ReviewsList } from '@/components/ReviewsList';
import { UserReputationCard } from '@/components/UserReputationCard';
import VerificationBadge from '@/components/VerificationBadge';
import { FollowButton } from '@/components/FollowButton';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { useFollowCounts } from '@/hooks/useFollows';
import { useUserActivities } from '@/hooks/useActivities';
import { ActivityCard } from '@/components/ActivityCard';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  location: string | null;
  created_at: string;
  is_featured: boolean;
  condition: string | null;
  status: string;
  ad_images: Array<{ image_url: string; is_primary: boolean }>;
  categories: { name: string };
}

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [adStats, setAdStats] = useState({
    total: 0,
    active: 0,
    sold: 0
  });

  const isOwnProfile = currentUser?.id === id;
  
  // Get follow counts and user activities for this profile
  const { data: followCounts } = useFollowCounts(id || "");
  const { data: userActivities } = useUserActivities(id || "");

  useEffect(() => {
    if (id) {
      fetchUserProfile();
      fetchUserAds();
    }
  }, [id]);

  // Set up SEO
  useSEO({
    title: profile ? `${profile.display_name || 'User'} - Profile` : 'User Profile',
    description: profile?.bio || 'User profile on ClassifiedList',
    keywords: 'user profile, classifieds, marketplace'
  });

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        navigate('/');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      navigate('/');
    }
  };

  const fetchUserAds = async () => {
    try {
      setLoading(true);
      
      const { data: adsData, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          price,
          currency,
          location,
          created_at,
          is_featured,
          condition,
          status,
          ad_images!inner(image_url, is_primary),
          categories!inner(name)
        `)
        .eq('user_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserAds(adsData || []);
      
      // Calculate stats
      const total = adsData?.length || 0;
      const active = adsData?.filter(ad => ad.status === 'active').length || 0;
      const sold = adsData?.filter(ad => ad.status === 'sold').length || 0;
      
      setAdStats({ total, active, sold });
    } catch (error) {
      console.error('Error fetching user ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (images: Ad['ad_images']) => {
    const primaryImage = images?.find(img => img.is_primary);
    return primaryImage?.image_url || images?.[0]?.image_url || '/placeholder.svg';
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return 'Price on request';
    
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
    };
    
    const symbol = currencySymbols[currency || 'USD'] || '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {profile.display_name || 'Anonymous User'}
                </h1>
                <VerificationBadge isVerified={profile.is_verified} />
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-3">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {formatDistanceToNow(new Date(profile.created_at))} ago
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isOwnProfile ? (
                <Button onClick={() => navigate('/profile')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <FollowButton userId={profile.user_id} />
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" size="icon">
                    <Flag className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <Card className="p-4">
              <div className="text-2xl font-bold text-primary">{adStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Listings</p>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{adStats.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{adStats.sold}</div>
              <p className="text-sm text-muted-foreground">Sold</p>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{followCounts?.followers || 0}</div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{followCounts?.following || 0}</div>
              <p className="text-sm text-muted-foreground">Following</p>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {profile.is_verified ? '✓' : '—'}
              </div>
              <p className="text-sm text-muted-foreground">Verified</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[800px] grid-cols-4">
            <TabsTrigger value="listings">Listings ({adStats.total})</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            {userAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userAds.map((ad) => (
                  <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video relative">
                      <img
                        src={getImageUrl(ad.ad_images)}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                        onClick={() => navigate(`/ad/${ad.id}`)}
                      />
                      {ad.is_featured && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-50">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{ad.title}</h3>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(ad.price, ad.currency)}
                        </span>
                        {ad.condition && (
                          <Badge variant="outline" className="text-xs">
                            {ad.condition}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{ad.categories.name}</span>
                        <span>{formatDistanceToNow(new Date(ad.created_at))} ago</span>
                      </div>
                      {ad.location && (
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ad.location}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {isOwnProfile ? "You haven't posted any listings yet" : "This user hasn't posted any listings yet"}
                </div>
                {isOwnProfile && (
                  <Button onClick={() => navigate('/post-ad')}>
                    Post Your First Ad
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            {userActivities && userActivities.length > 0 ? (
              <div className="space-y-4">
                {userActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {isOwnProfile ? "You haven't posted any activities yet" : "This user hasn't posted any activities yet"}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewsList userId={profile.user_id} />
          </TabsContent>

          <TabsContent value="reputation" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              User reputation feature coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;