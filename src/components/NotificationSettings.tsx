import { Bell, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePushNotifications, useNotificationPreferences } from '@/hooks/usePushNotifications';

const NotificationSettings = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications,
    canEnable,
    canDisable
  } = usePushNotifications();

  const { preferences, loading: prefsLoading, updatePreference } = useNotificationPreferences();

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="secondary" className="text-green-600">Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in this browser.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
          {getPermissionBadge()}
        </CardTitle>
        <CardDescription>
          Stay updated with real-time notifications for important events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main notification toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-medium">Enable Push Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Receive notifications even when the app is closed
            </p>
          </div>
          <Button
            onClick={handleToggleNotifications}
            disabled={isLoading || (!canEnable && !canDisable)}
            variant={isSubscribed ? "outline" : "default"}
          >
            {isLoading ? (
              'Processing...'
            ) : isSubscribed ? (
              'Disable'
            ) : (
              'Enable'
            )}
          </Button>
        </div>

        {permission === 'denied' && (
          <Alert>
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Notification preferences */}
        {isSubscribed && preferences && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h4 className="font-medium">Notification Types</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-messages">New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone sends you a message about your ads
                  </p>
                </div>
                <Switch
                  id="new-messages"
                  checked={preferences.new_messages}
                  onCheckedChange={(checked) => updatePreference('new_messages', checked)}
                  disabled={prefsLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ad-responses">Ad Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    When someone shows interest in your listed items
                  </p>
                </div>
                <Switch
                  id="ad-responses"
                  checked={preferences.ad_responses}
                  onCheckedChange={(checked) => updatePreference('ad_responses', checked)}
                  disabled={prefsLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="featured-updates">Featured Ad Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Updates about your featured ad status and payments
                  </p>
                </div>
                <Switch
                  id="featured-updates"
                  checked={preferences.featured_ad_updates}
                  onCheckedChange={(checked) => updatePreference('featured_ad_updates', checked)}
                  disabled={prefsLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ad-expiring">Ad Expiring</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders when your ads are about to expire
                  </p>
                </div>
                <Switch
                  id="ad-expiring"
                  checked={preferences.ad_expiring}
                  onCheckedChange={(checked) => updatePreference('ad_expiring', checked)}
                  disabled={prefsLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="price-changes">Price Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when you update your ad prices
                  </p>
                </div>
                <Switch
                  id="price-changes"
                  checked={preferences.price_changes}
                  onCheckedChange={(checked) => updatePreference('price_changes', checked)}
                  disabled={prefsLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">Marketing & Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Platform updates, tips, and promotional offers
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => updatePreference('marketing', checked)}
                  disabled={prefsLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Information note */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            You can manage browser notification permissions in your browser settings. 
            Notifications will only work when enabled in both the app and browser.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;