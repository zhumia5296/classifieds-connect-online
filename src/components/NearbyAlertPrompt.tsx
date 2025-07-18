import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Target, X, MapPin } from 'lucide-react';
import { useNearbyAlerts } from '@/hooks/useNearbyAlerts';
import { useLocation } from '@/hooks/useLocation';

interface NearbyAlertPromptProps {
  className?: string;
  onDismiss?: () => void;
}

const NearbyAlertPrompt: React.FC<NearbyAlertPromptProps> = ({ 
  className = '',
  onDismiss 
}) => {
  const [dismissed, setDismissed] = useState(false);
  const { hasActiveAlerts, createQuickAlert } = useNearbyAlerts();
  const { hasLocation, requestLocation, location } = useLocation();

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleEnableAlerts = async () => {
    if (!hasLocation) {
      await requestLocation(true);
      return;
    }
    
    try {
      await createQuickAlert();
      setDismissed(true);
    } catch (error) {
      console.error('Error creating quick alert:', error);
    }
  };

  // Don't show if dismissed or user already has active alerts
  if (dismissed || hasActiveAlerts) {
    return null;
  }

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Never Miss Great Deals!</span>
            <Badge variant="secondary" className="ml-2">
              New
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get instant notifications when items matching your interests appear nearby. 
            {location && (
              <span className="font-medium">
                {' '}Currently showing items near {location.address?.split(',')[0] || 'your location'}.
              </span>
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleEnableAlerts}
              className="flex-1"
            >
              {hasLocation ? (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Enable Nearby Alerts
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location & Alerts
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Maybe Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NearbyAlertPrompt;