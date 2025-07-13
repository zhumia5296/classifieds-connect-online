import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Crown, Loader2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickFeatureButtonProps {
  adId: string;
  isOwner: boolean;
  isFeatured?: boolean;
  featuredUntil?: string;
  compact?: boolean;
}

const QuickFeatureButton: React.FC<QuickFeatureButtonProps> = ({ 
  adId, 
  isOwner, 
  isFeatured = false, 
  featuredUntil,
  compact = false
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
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        disabled
        className="border-primary text-primary"
      >
        <Crown className="w-4 h-4 mr-2" />
        {compact ? "Featured" : "Currently Featured"}
      </Button>
    );
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className="hover:border-primary hover:text-primary"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Feature
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => handleFeatureAd(7)}
            className="flex items-center justify-between"
          >
            <span>7 Days</span>
            <span className="font-bold">$7</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleFeatureAd(30)}
            className="flex items-center justify-between"
          >
            <span>30 Days</span>
            <span className="font-bold">$30</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={loading}
          className="hover:border-primary hover:text-primary"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Star className="w-4 h-4 mr-2" />
          )}
          Feature This Ad
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => handleFeatureAd(7)}
          className="flex flex-col items-start p-3"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold">7 Days</span>
            <span className="font-bold text-lg">$7</span>
          </div>
          <span className="text-xs text-muted-foreground">Great for quick sales</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleFeatureAd(30)}
          className="flex flex-col items-start p-3"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold">30 Days</span>
            <span className="font-bold text-lg">$30</span>
          </div>
          <span className="text-xs text-muted-foreground">Best value & exposure</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickFeatureButton;