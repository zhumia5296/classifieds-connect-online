import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Crown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeatureAdButtonProps {
  adId: string;
  isOwner: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
}

const FeatureAdButton: React.FC<FeatureAdButtonProps> = ({ 
  adId, 
  isOwner, 
  isFeatured = false, 
  featuredUntil 
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOwner) return null;

  const handleFeatureAd = async (durationDays: number) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('feature-ad-payment', {
        body: { ad_id: adId, duration_days: durationDays }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');

    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isActive = isFeatured && featuredUntil && new Date(featuredUntil) > new Date();

  if (isActive) {
    return (
      <Card className="border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Featured Ad</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Featured until: {new Date(featuredUntil).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Feature Your Ad</CardTitle>
        </div>
        <CardDescription>
          Boost visibility and get more responses by featuring your ad at the top of search results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => handleFeatureAd(7)}
            disabled={loading}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="font-semibold">7 Days</div>
                <div className="text-2xl font-bold">$7</div>
                <div className="text-xs text-muted-foreground">Great for quick sales</div>
              </>
            )}
          </Button>
          
          <Button
            onClick={() => handleFeatureAd(30)}
            disabled={loading}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="font-semibold">30 Days</div>
                <div className="text-2xl font-bold">$30</div>
                <div className="text-xs opacity-90">Best value & exposure</div>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureAdButton;