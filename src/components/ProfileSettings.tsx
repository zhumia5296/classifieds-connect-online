import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Mail, Save, Bell, Shield, Calendar, Clock, CheckCircle2 } from "lucide-react";
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import AvatarUpload from './AvatarUpload';
import LocationInput from './LocationInput';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  latitude?: number;
  longitude?: number;
  phone: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    location: '',
    phone: '',
    avatar_url: null as string | null
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || null
        });
      } else {
        // Create a new profile if none exists
        await createProfile();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'User'
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        display_name: data.display_name || '',
        bio: data.bio || '',
        location: data.location || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || null
      });
    } catch (err) {
      console.error('Error creating profile:', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name.trim() || null,
          bio: formData.bio.trim() || null,
          location: formData.location.trim() || null,
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile();

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error saving profile",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
            <p className="text-muted-foreground">
              Please sign in to view your profile settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and notification preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="space-y-6">
              {/* Header Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Profile Header */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-subtle rounded-lg border">
                    <AvatarUpload
                      userId={user.id}
                      currentAvatar={formData.avatar_url}
                      onAvatarUpdate={(avatarUrl) => {
                        setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
                        if (profile) {
                          setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
                        }
                      }}
                      displayName={formData.display_name}
                      userEmail={user.email}
                    />
                    
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <h2 className="text-2xl font-bold">
                        {formData.display_name || 'User'}
                      </h2>
                      <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                      {profile?.is_verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified Account
                        </Badge>
                      )}
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined {profile ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {profile ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        placeholder="Enter your display name"
                        value={formData.display_name}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell others about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.bio.length}/500 characters
                    </p>
                  </div>

                  <LocationInput
                    value={formData.location}
                    onChange={(location, coords) => {
                      handleInputChange('location', location);
                      // Store coordinates if needed
                    }}
                    label="Location"
                    placeholder="Enter your city or location"
                  />

                  <Separator />

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="min-w-32"
                    >
                      {saving ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings onAccountDeleted={() => window.location.href = '/'} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileSettings;