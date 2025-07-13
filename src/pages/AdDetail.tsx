import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import ChatWindow from '@/components/ChatWindow';
import MessageStarter from '@/components/MessageStarter';
import FeatureAdButton from '@/components/FeatureAdButton';
import FeaturedAdStatus from '@/components/FeaturedAdStatus';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Eye, 
  Star,
  Phone,
  Mail,
  Shield,
  Flag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDistance } from 'date-fns';

interface AdDetail {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  location: string;
  condition: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  is_featured: boolean;
  featured_until?: string;
  views_count: number;
  user_id: string;
  categories: {
    id: string;
    name: string;
    slug: string;
  } | null;
  ad_images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
  }[];
  profiles: {
    display_name: string | null;
    location: string | null;
    is_verified: boolean;
    created_at: string;
  } | null;
  saved_ads: {
    id: string;
  }[];
}

const AdDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // SEO hook - will update when ad data changes
  useAdSEO(ad ? {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    currency: ad.currency,
    condition: ad.condition,
    location: ad.location,
    images: ad.ad_images,
    categories: ad.categories,
    user: ad.profiles,
    created_at: ad.created_at
  } : {} as any);

  useEffect(() => {
    if (id) {
      fetchAdDetails();
      incrementViewCount();
    }
  }, [id]);

  const fetchAdDetails = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          description,
          price,
          currency,
          location,
          condition,
          contact_email,
          contact_phone,
          created_at,
          is_featured,
          featured_until,
          views_count,
          user_id,
          categories (
            id,
            name,
            slug
          ),
          ad_images (
            id,
            image_url,
            alt_text,
            is_primary
          ),
          profiles:profiles!user_id (
            display_name,
            location,
            is_verified,
            created_at
          ),
          saved_ads (
            id
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Ad not found",
          description: "This ad may have been removed or is no longer available.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Filter saved_ads for current user only
      if (user) {
        const { data: savedAds } = await supabase
          .from('saved_ads')
          .select('id')
          .eq('ad_id', id)
          .eq('user_id', user.id);
        
        data.saved_ads = savedAds || [];
      }

      setAd(data as unknown as AdDetail);
    } catch (err) {
      console.error('Error fetching ad details:', err);
      toast({
        title: "Error loading ad",
        description: "Failed to load ad details. Please try again.",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;

    try {
      await (supabase as any).rpc('increment_ad_views', { ad_id: id });
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !ad) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save ads.",
        variant: "destructive"
      });
      return;
    }

    try {
      const isSaved = ad.saved_ads.length > 0;

      if (isSaved) {
        const { error } = await supabase
          .from('saved_ads')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', ad.id);

        if (error) throw error;

        setAd(prev => prev ? { ...prev, saved_ads: [] } : null);
        toast({
          title: "Removed from saved",
          description: "Ad removed from your saved list.",
        });
      } else {
        const { error } = await supabase
          .from('saved_ads')
          .insert({
            user_id: user.id,
            ad_id: ad.id
          });

        if (error) throw error;

        setAd(prev => prev ? { ...prev, saved_ads: [{ id: 'temp' }] } : null);
        toast({
          title: "Added to saved",
          description: "Ad added to your saved list.",
        });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      toast({
        title: "Error",
        description: "Failed to update saved status.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad?.title || 'Check out this ad',
          url: url
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Ad link copied to clipboard.",
      });
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Contact for price';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${price.toLocaleString()}`;
  };

  const formatCondition = (condition: string) => {
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDisplayImages = () => {
    if (!ad?.ad_images || ad.ad_images.length === 0) {
      return ["https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop"];
    }
    
    // Sort by primary first, then by creation order
    return ad.ad_images
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map(img => img.image_url);
  };

  const nextImage = () => {
    const images = getDisplayImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    const images = getDisplayImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-10 bg-muted rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                  <div className="h-4 bg-muted rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ad not found</h2>
          <p className="text-muted-foreground mb-4">
            This ad may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const images = getDisplayImages();
  const isOwner = user?.id === ad.user_id;
  const isSaved = ad.saved_ads.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="p-0 h-auto font-normal"
          >
            Home
          </Button>
          <span>/</span>
          {ad.categories && (
            <>
              <span>{ad.categories.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{ad.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative group">
              <div 
                className="aspect-square overflow-hidden rounded-lg cursor-pointer"
                onClick={() => setShowImageGallery(true)}
              >
                <img
                  src={images[currentImageIndex]}
                  alt={ad.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 rounded-full px-3 py-1 text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-muted'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`${ad.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ad Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {ad.is_featured && (
                    <Badge variant="default" className="bg-yellow-500 text-yellow-50">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {ad.categories && (
                    <Badge variant="secondary">{ad.categories.name}</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleToggleSave}
                    className={isSaved ? "text-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-3">{ad.title}</h1>
              
              <div className="text-4xl font-bold text-primary mb-4">
                {formatPrice(ad.price, ad.currency)}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{ad.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistance(new Date(ad.created_at), new Date(), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{ad.views_count} views</span>
                </div>
              </div>
            </div>

            {/* Condition */}
            {ad.condition && (
              <div>
                <h3 className="font-semibold mb-2">Condition</h3>
                <Badge variant="outline" className="text-sm">
                  {formatCondition(ad.condition)}
                </Badge>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {ad.description}
              </p>
            </div>

            {/* Contact Actions */}
            {!isOwner && (
              <div className="space-y-3">
                <MessageStarter
                  adId={ad.id}
                  adTitle={ad.title}
                  sellerId={ad.user_id}
                  sellerName={ad.profiles?.display_name || undefined}
                  sellerVerified={ad.profiles?.is_verified}
                />
                
                <div className="grid grid-cols-2 gap-2">{/*existing contact buttons*/}
                  {ad.contact_phone && (
                    <Button variant="outline" asChild>
                      <a href={`tel:${ad.contact_phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                  {ad.contact_email && (
                    <Button variant="outline" asChild>
                      <a href={`mailto:${ad.contact_email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seller Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Seller Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {ad.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">
                    {ad.profiles?.display_name || 'Anonymous User'}
                  </h4>
                  {ad.profiles?.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {ad.profiles?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{ad.profiles.location}</span>
                    </div>
                  )}
                  <div>
                    Member since {ad.profiles ? formatDistance(new Date(ad.profiles.created_at), new Date(), { addSuffix: true }) : 'recently'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Gallery Dialog */}
        <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
          <DialogContent className="max-w-4xl h-[80vh] p-2">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={images[currentImageIndex]}
                alt={ad.title}
                className="max-w-full max-h-full object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Feature Ad Section for Owners */}
        {isOwner && (
          <div className="mb-8 space-y-4">
            <FeaturedAdStatus 
              isFeatured={ad.is_featured}
              featuredUntil={ad.featured_until}
              showDetails={true}
            />
            <FeatureAdButton
              adId={ad.id}
              isOwner={isOwner}
              isFeatured={ad.is_featured}
              featuredUntil={ad.featured_until}
            />
          </div>
        )}

        {/* Chat Dialog */}
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <ChatWindow
              adId={ad.id}
              recipientId={ad.user_id}
              onBack={() => setShowChat(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdDetailPage;