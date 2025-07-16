import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, Phone, Mail, MapPin, FileText, Clock, Upload } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface BusinessProfileData {
  business_name: string;
  business_type: string;
  business_registration: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  tax_id: string;
  business_description: string;
  business_hours: any;
  business_license_url: string | null;
}

interface BusinessProfileFormProps {
  formData: BusinessProfileData;
  onInputChange: (field: string, value: string | any) => void;
  isVerified?: boolean;
}

const BUSINESS_TYPES = [
  'Dealership',
  'Retail Store',
  'Online Store',
  'Marketplace Vendor',
  'Service Provider',
  'Manufacturer',
  'Distributor',
  'Reseller',
  'Other'
];

const DEFAULT_HOURS = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '17:00', closed: false },
  sunday: { open: '09:00', close: '17:00', closed: true }
};

const BusinessProfileForm = ({ formData, onInputChange, isVerified = false }: BusinessProfileFormProps) => {
  const { toast } = useToast();
  const [expandedHours, setExpandedHours] = useState(false);

  const businessHours = formData.business_hours || DEFAULT_HOURS;

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    const updatedHours = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [field]: value
      }
    };
    onInputChange('business_hours', updatedHours);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Here you would typically upload to Supabase Storage
    // For now, we'll just simulate the upload
    toast({
      title: "File upload",
      description: "Business license upload would be implemented here with Supabase Storage",
    });
  };

  return (
    <div className="space-y-6">
      {/* Business Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
            {isVerified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Verified Business
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                placeholder="Enter your business name"
                value={formData.business_name}
                onChange={(e) => onInputChange('business_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type *</Label>
              <Select
                value={formData.business_type}
                onValueChange={(value) => onInputChange('business_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_registration">Registration Number</Label>
              <Input
                id="business_registration"
                placeholder="Business registration number"
                value={formData.business_registration}
                onChange={(e) => onInputChange('business_registration', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / EIN</Label>
              <Input
                id="tax_id"
                placeholder="Tax identification number"
                value={formData.tax_id}
                onChange={(e) => onInputChange('tax_id', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_description">Business Description</Label>
            <Textarea
              id="business_description"
              placeholder="Describe your business, what you sell, your specialties..."
              value={formData.business_description}
              onChange={(e) => onInputChange('business_description', e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.business_description?.length || 0}/1000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Business Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_phone">Business Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="business_phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.business_phone}
                  onChange={(e) => onInputChange('business_phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="business_email"
                  type="email"
                  placeholder="business@example.com"
                  value={formData.business_email}
                  onChange={(e) => onInputChange('business_email', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="business_website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="business_website"
                  type="url"
                  placeholder="https://www.yourbusiness.com"
                  value={formData.business_website}
                  onChange={(e) => onInputChange('business_website', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
              <Textarea
                id="business_address"
                placeholder="Full business address including city, state, and postal code"
                value={formData.business_address}
                onChange={(e) => onInputChange('business_address', e.target.value)}
                rows={3}
                className="pl-10 resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpandedHours(!expandedHours)}
              className="w-full"
            >
              {expandedHours ? 'Hide' : 'Show'} Business Hours
            </Button>
            
            {expandedHours && (
              <div className="grid gap-3">
                {Object.entries(businessHours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-20 text-sm font-medium capitalize">
                      {day}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        disabled={hours.closed}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        disabled={hours.closed}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant={hours.closed ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => handleHoursChange(day, 'closed', !hours.closed)}
                      >
                        {hours.closed ? 'Closed' : 'Open'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business License & Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_license">Business License</Label>
            <div className="flex items-center gap-4">
              <Input
                id="business_license"
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('business_license')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload License
              </Button>
              {formData.business_license_url && (
                <Badge variant="secondary">
                  License uploaded
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your business license or registration document (PDF, JPG, PNG)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessProfileForm;