import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Scale, Star, Navigation, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useComparison } from '@/hooks/useComparison';
import { useLocation } from '@/hooks/useLocation';
import { calculateDistance, formatDistance } from '@/lib/location';
import SocialShare from '@/components/SocialShare';

const Compare = () => {
  const navigate = useNavigate();
  const { comparisonAds, removeFromComparison, clearComparison } = useComparison();
  const { location: userLocation } = useLocation();

  useEffect(() => {
    if (comparisonAds.length === 0) {
      navigate('/');
    }
  }, [comparisonAds.length, navigate]);

  const calculateAdDistance = (ad: { latitude?: number; longitude?: number }) => {
    if (!userLocation?.coords || !ad.latitude || !ad.longitude) return null;
    return calculateDistance(
      userLocation.coords.latitude,
      userLocation.coords.longitude,
      ad.latitude,
      ad.longitude
    );
  };

  const formatCondition = (condition?: string) => {
    if (!condition) return 'Not specified';
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const extractPrice = (priceString: string) => {
    const match = priceString.match(/[\d,]+/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  };

  const prices = comparisonAds.map(ad => extractPrice(ad.price));
  const minPrice = Math.min(...prices.filter(p => p > 0));
  const maxPrice = Math.max(...prices.filter(p => p > 0));

  if (comparisonAds.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Compare Ads</h1>
              <Badge variant="secondary">
                {comparisonAds.length} of 3
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={clearComparison}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* Comparison Grid */}
        <div className={`grid gap-6 ${
          comparisonAds.length === 2 ? 'md:grid-cols-2' : 
          comparisonAds.length === 3 ? 'lg:grid-cols-3' : 
          'grid-cols-1'
        }`}>
          {comparisonAds.map((ad, index) => {
            const distance = calculateAdDistance(ad);
            const price = extractPrice(ad.price);
            const isPriceLowest = price > 0 && price === minPrice && prices.filter(p => p === minPrice).length === 1;
            const isPriceHighest = price > 0 && price === maxPrice && prices.filter(p => p === maxPrice).length === 1;

            return (
              <Card key={ad.id} className={`relative ${ad.isFeatured ? 'ring-2 ring-primary/20' : ''}`}>
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromComparison(ad.id)}
                    className="h-8 w-8 bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <CardHeader className="pb-4">
                  <div className="relative">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {ad.isFeatured && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-50">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Price</div>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${
                      isPriceLowest ? 'text-green-600' : isPriceHighest ? 'text-red-600' : ''
                    }`}>
                      {ad.price}
                      {isPriceLowest && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Lowest</Badge>}
                      {isPriceHighest && <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Highest</Badge>}
                    </div>
                  </div>

                  <Separator />

                  {/* Category */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Category</div>
                    <Badge variant="outline">{ad.category}</Badge>
                  </div>

                  {/* Condition */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Condition</div>
                    <div className="text-sm">{formatCondition(ad.condition)}</div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Location</div>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{ad.location}</span>
                    </div>
                    {distance && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Navigation className="h-3 w-3" />
                        <span>{formatDistance(distance)} away</span>
                      </div>
                    )}
                  </div>

                  {/* Time Posted */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Posted</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{ad.timeAgo}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => navigate(`/ad/${ad.id}`)}
                    >
                      View Details
                    </Button>
                    <SocialShare
                      url={`${window.location.origin}/ad/${ad.id}`}
                      title={ad.title}
                      price={ad.price}
                      location={ad.location}
                      description=""
                      image={ad.imageUrl}
                      variant="outline"
                      size="icon"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty Slots */}
        {comparisonAds.length < 3 && (
          <div className="mt-6">
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Scale className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  You can add up to {3 - comparisonAds.length} more ad{3 - comparisonAds.length === 1 ? '' : 's'} to your comparison.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="mt-4"
                >
                  Browse Ads
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;