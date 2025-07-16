import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Bell, MessageCircle, DollarSign, Clock, Star, Eye, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type NotificationPreferences = Tables<'notification_preferences'>;

const notificationTypes = [
  {
    key: 'new_messages' as keyof NotificationPreferences,
    icon: MessageCircle,
    title: 'New Messages',
    description: 'When someone sends you a message about your listings'
  },
  {
    key: 'ad_responses' as keyof NotificationPreferences,
    icon: Bell,
    title: 'Ad Responses & Interactions',
    description: 'When users interact with your ads or watchlist matches'
  },
  {
    key: 'price_changes' as keyof NotificationPreferences,
    icon: DollarSign,
    title: 'Price Changes',
    description: 'When prices drop on items you\'ve saved'
  },
  {
    key: 'ad_expiring' as keyof NotificationPreferences,
    icon: Clock,
    title: 'Listing Expiration',
    description: 'Reminders when your listings are about to expire'
  },
  {
    key: 'featured_ad_updates' as keyof NotificationPreferences,
    icon: Star,
    title: 'Featured Ad Updates',
    description: 'Updates about your featured listings and promotions'
  },
  {
    key: 'marketing' as keyof NotificationPreferences,
    icon: Mail,
    title: 'Marketing & Promotions',
    description: 'News, tips, and promotional offers from ClassifiedList'
  }
];

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences if none exist
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            new_messages: true,
            ad_responses: true,
            featured_ad_updates: true,
            price_changes: false,
            ad_expiring: true,
            marketing: false
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user || !preferences) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved"
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert the change
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const disableAllNotifications = async () => {
    if (!user || !preferences) return;

    try {
      setSaving(true);
      const updatedPrefs = {
        new_messages: false,
        ad_responses: false,
        price_changes: false,
        ad_expiring: false,
        featured_ad_updates: false,
        marketing: false,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_preferences')
        .update(updatedPrefs)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, ...updatedPrefs });
      toast({
        title: "All Notifications Disabled",
        description: "You will no longer receive email notifications"
      });
    } catch (error) {
      console.error('Error disabling all notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable all notifications",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
                <div className="h-6 w-11 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Error Loading Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load notification settings. Please try refreshing the page.</p>
          <Button onClick={fetchPreferences} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Settings
        </CardTitle>
        <CardDescription>
          Choose which email notifications you'd like to receive. You'll always receive important account security notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            const isEnabled = preferences[type.key] as boolean;
            
            return (
              <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 text-primary" />
                  <div className="space-y-1">
                    <Label htmlFor={type.key} className="text-sm font-medium cursor-pointer">
                      {type.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => updatePreference(type.key, checked)}
                  disabled={saving}
                />
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Quick Actions</p>
            <p className="text-sm text-muted-foreground">Manage all notifications at once</p>
          </div>
          <Button
            variant="outline"
            onClick={disableAllNotifications}
            disabled={saving}
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
          >
            Disable All
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Important Security Notifications</p>
              <p className="text-muted-foreground">
                You'll always receive critical security notifications (password changes, login alerts, etc.) 
                regardless of these settings.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};