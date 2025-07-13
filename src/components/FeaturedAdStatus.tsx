import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFeaturedAdsCleanup } from '@/hooks/useFeaturedAdsCleanup';
import { useToast } from '@/hooks/use-toast';

interface FeaturedAdStatusProps {
  isFeatured: boolean;
  featuredUntil?: string;
  showDetails?: boolean;
}

const FeaturedAdStatus: React.FC<FeaturedAdStatusProps> = ({ 
  isFeatured, 
  featuredUntil, 
  showDetails = false 
}) => {
  const { runCleanup } = useFeaturedAdsCleanup();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(false);

  const handleForceCleanup = async () => {
    try {
      setLoading(true);
      const expiredCount = await runCleanup();
      toast({
        title: "Cleanup completed",
        description: `Expired ${expiredCount} featured ads.`,
      });
    } catch (error) {
      toast({
        title: "Cleanup failed", 
        description: "There was an error running the cleanup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isFeatured) {
    return showDetails ? (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Featured Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Not Featured</Badge>
        </CardContent>
      </Card>
    ) : (
      <Badge variant="outline">Not Featured</Badge>
    );
  }

  if (!featuredUntil) {
    return showDetails ? (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Featured Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Featured (No Expiration)</Badge>
        </CardContent>
      </Card>
    ) : (
      <Badge variant="secondary">Featured</Badge>
    );
  }

  const expirationDate = new Date(featuredUntil);
  const now = new Date();
  const isExpired = expirationDate <= now;
  const isExpiringSoon = !isExpired && expirationDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000; // 24 hours

  const timeRemaining = () => {
    if (isExpired) return 'Expired';
    
    const diff = expirationDate.getTime() - now.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (!showDetails) {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Expires Soon</Badge>;
    }
    return <Badge variant="default" className="bg-primary">Featured</Badge>;
  }

  return (
    <Card className={isExpired ? 'border-destructive' : isExpiringSoon ? 'border-yellow-500' : 'border-primary'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Featured Status
          </CardTitle>
          {isExpired && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceCleanup}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <>
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <Badge variant="destructive">Expired</Badge>
            </>
          ) : isExpiringSoon ? (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                Expires Soon
              </Badge>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-primary" />
              <Badge variant="default" className="bg-primary">
                Active
              </Badge>
            </>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <div>Expires: {expirationDate.toLocaleDateString()}</div>
          <div className="font-medium">{timeRemaining()}</div>
        </div>

        {isExpired && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            This ad's featured status has expired. The cleanup process runs automatically every hour, 
            or you can manually refresh the status above.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeaturedAdStatus;