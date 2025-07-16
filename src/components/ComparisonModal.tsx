import { MapPin, Clock, Scale, Star, Navigation, Share2, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useComparison } from '@/hooks/useComparison';
import { useLocation } from '@/hooks/useLocation';
import { calculateDistance, formatDistance } from '@/lib/location';
import { getComparisonFieldsForCategory, formatFieldValue } from '@/lib/categoryComparison';
import SocialShare from '@/components/SocialShare';

interface ComparisonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ComparisonModal = ({ isOpen, onOpenChange }: ComparisonModalProps) => {
  const { comparisonAds, removeFromComparison } = useComparison();
  const { location: userLocation } = useLocation();

  if (comparisonAds.length === 0) {
    return null;
  }

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

  // Get category-specific fields (use the first ad's category)
  const comparisonFields = getComparisonFieldsForCategory(comparisonAds[0]?.category || '');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Compare Ads
            <Badge variant="secondary">
              {comparisonAds.length} of 3
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className={`grid gap-4 ${
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
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {ad.isFeatured && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-50 text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-2">{ad.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Price</div>
                    <div className={`text-lg font-bold flex items-center gap-2 ${
                      isPriceLowest ? 'text-green-600' : isPriceHighest ? 'text-red-600' : ''
                    }`}>
                      {ad.price}
                      {isPriceLowest && <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Lowest</Badge>}
                      {isPriceHighest && <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Highest</Badge>}
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Info */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Category</div>
                      <Badge variant="outline" className="text-xs">{ad.category}</Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Condition</div>
                      <div className="text-xs">{formatCondition(ad.condition)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Location</div>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />
                        <span>{ad.location}</span>
                      </div>
                      {distance && (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Navigation className="h-3 w-3" />
                          <span>{formatDistance(distance)} away</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Posted</div>
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{ad.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category-Specific Fields */}
                  {comparisonFields.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Specifications</div>
                        <div className="space-y-1">
                          {comparisonFields.slice(0, 5).map((field) => (
                            <div key={field.key} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">{field.label}:</span>
                              <span className={field.important ? 'font-medium' : ''}>
                                {formatFieldValue('Not specified', field)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        window.open(`/ad/${ad.id}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
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
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View Full Comparison Link */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              window.open('/compare', '_blank');
            }}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Full Comparison Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;