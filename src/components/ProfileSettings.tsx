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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Mail, Save, Bell, Shield, Calendar, Clock, CheckCircle2, Building2, Users } from "lucide-react";
import { NotificationSettings } from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import AvatarUpload from './AvatarUpload';
import LocationInput from './LocationInput';
import BusinessProfileForm from './BusinessProfileForm';

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
  account_type: 'individual' | 'business';
  business_name?: string | null;
  business_type?: string | null;
  business_registration?: string | null;
  business_address?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  business_website?: string | null;
  tax_id?: string | null;
  business_hours?: any;
  business_description?: string | null;
  business_license_url?: string | null;
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
    avatar_url: null as string | null,
    account_type: 'individual' as 'individual' | 'business',
    business_name: '',
    business_type: '',
    business_registration: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    tax_id: '',
    business_hours: null as any,
    business_description: '',
    business_license_url: null as string | null
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
        setProfile(data as UserProfile);
        setFormData({
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || null,
          account_type: (data.account_type as 'individual' | 'business') || 'individual',
          business_name: data.business_name || '',
          business_type: data.business_type || '',
          business_registration: data.business_registration || '',
          business_address: data.business_address || '',
          business_phone: data.business_phone || '',
          business_email: data.business_email || '',
          business_website: data.business_website || '',
          tax_id: data.tax_id || '',
          business_hours: data.business_hours || null,
          business_description: data.business_description || '',
          business_license_url: data.business_license_url || null
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
          display_name: user.email?.split('@')[0] || 'User',
          account_type: 'individual'
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data as UserProfile);
      setFormData({
        display_name: data.display_name || '',
        bio: data.bio || '',
        location: data.location || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || null,
        account_type: (data.account_type as 'individual' | 'business') || 'individual',
        business_name: data.business_name || '',
        business_type: data.business_type || '',
        business_registration: data.business_registration || '',
        business_address: data.business_address || '',
        business_phone: data.business_phone || '',
        business_email: data.business_email || '',
        business_website: data.business_website || '',
        tax_id: data.tax_id || '',
        business_hours: data.business_hours || null,
        business_description: data.business_description || '',
        business_license_url: data.business_license_url || null
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
      const updateData = {
        display_name: formData.display_name.trim() || null,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
        phone: formData.phone.trim() || null,
        account_type: formData.account_type,
        updated_at: new Date().toISOString()
      };

      // Add business fields if account type is business
      if (formData.account_type === 'business') {
        Object.assign(updateData, {
          business_name: formData.business_name.trim() || null,
          business_type: formData.business_type.trim() || null,
          business_registration: formData.business_registration.trim() || null,
          business_address: formData.business_address.trim() || null,
          business_phone: formData.business_phone.trim() || null,
          business_email: formData.business_email.trim() || null,
          business_website: formData.business_website.trim() || null,
          tax_id: formData.tax_id.trim() || null,
          business_hours: formData.business_hours,
          business_description: formData.business_description.trim() || null,
          business_license_url: formData.business_license_url
        });
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile();

      toast({
        title: "Profile updated",
        description: `Your ${formData.account_type} profile has been saved successfully.`,
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

              {/* Account Type Selection Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Account Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value: 'individual' | 'business') => handleInputChange('account_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Individual Account
                          </div>
                        </SelectItem>
                        <SelectItem value="business">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Business Account
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.account_type === 'business' 
                        ? 'Business accounts get enhanced features like verification badges, business hours, and detailed contact information.'
                        : 'Individual accounts for personal sellers and buyers.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {formData.account_type === 'business' ? 'Personal Contact Details' : 'Personal Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">
                        {formData.account_type === 'business' ? 'Contact Name' : 'Display Name'}
                      </Label>
                      <Input
                        id="display_name"
                        placeholder={formData.account_type === 'business' ? 'Your name as contact person' : 'Enter your display name'}
                        value={formData.display_name}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {formData.account_type === 'business' ? 'Personal Phone' : 'Phone Number'}
                      </Label>
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
                    <Label htmlFor="bio">
                      {formData.account_type === 'business' ? 'Personal Bio' : 'Bio'}
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder={formData.account_type === 'business' ? 'Tell about yourself as the contact person...' : 'Tell others about yourself...'}
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
                    label={formData.account_type === 'business' ? 'Personal Location' : 'Location'}
                    placeholder="Enter your city or location"
                  />
                </CardContent>
              </Card>

              {/* Business Profile Form - Only shown for business accounts */}
              {formData.account_type === 'business' && (
                <BusinessProfileForm
                  formData={{
                    business_name: formData.business_name,
                    business_type: formData.business_type,
                    business_registration: formData.business_registration,
                    business_address: formData.business_address,
                    business_phone: formData.business_phone,
                    business_email: formData.business_email,
                    business_website: formData.business_website,
                    tax_id: formData.tax_id,
                    business_hours: formData.business_hours,
                    business_description: formData.business_description,
                    business_license_url: formData.business_license_url
                  }}
                  onInputChange={handleInputChange}
                  isVerified={profile?.is_verified}
                />
              )}

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
                      Save {formData.account_type === 'business' ? 'Business ' : ''}Profile
                    </>
                  )}
                </Button>
              </div>
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