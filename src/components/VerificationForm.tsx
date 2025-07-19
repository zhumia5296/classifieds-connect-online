import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useVerification } from '@/hooks/useVerification';
import LocationVerificationForm from './LocationVerificationForm';
import { 
  Shield, 
  FileCheck, 
  Clock,
  CheckCircle, 
  XCircle,
  Upload,
  Building,
  User,
  Store,
  MapPin
} from "lucide-react";

const VerificationForm = () => {
  const { 
    userRequest, 
    loading, 
    canSubmitRequest, 
    getVerificationStatus, 
    submitVerificationRequest 
  } = useVerification();

  const [formData, setFormData] = useState({
    request_type: 'seller',
    business_name: '',
    business_registration: '',
    identity_document_url: '',
    business_document_url: '',
    website_url: '',
    social_media_urls: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    additional_info: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = await submitVerificationRequest({
      ...formData,
      social_media_urls: Object.fromEntries(
        Object.entries(formData.social_media_urls).filter(([_, value]) => value)
      )
    });

    setSubmitting(false);
    
    if (success) {
      // Reset form
      setFormData({
        request_type: 'seller',
        business_name: '',
        business_registration: '',
        identity_document_url: '',
        business_document_url: '',
        website_url: '',
        social_media_urls: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: ''
        },
        additional_info: ''
      });
    }
  };

  const status = getVerificationStatus();

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>Under Review</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Verified</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Not Requested</span>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Verification
            </CardTitle>
            <CardDescription>
              Get verified to build trust with buyers and sellers
            </CardDescription>
          </div>
          {getStatusDisplay()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Section */}
        {userRequest && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">Current Request</h4>
                <Badge 
                  variant={
                    status === 'approved' ? 'default' : 
                    status === 'pending' ? 'secondary' : 
                    'destructive'
                  }
                >
                  {status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Submitted: {new Date(userRequest.submitted_at).toLocaleDateString()}
              </p>
              {userRequest.admin_notes && (
                <div className="mt-3 p-3 bg-muted rounded">
                  <p className="text-sm font-medium">Admin Notes:</p>
                  <p className="text-sm text-muted-foreground">{userRequest.admin_notes}</p>
                </div>
              )}
              {userRequest.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                  <p className="text-sm text-red-700">{userRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Benefits */}
        <div className="space-y-3">
          <h4 className="font-semibold">Verification Benefits</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Trust Badge</p>
                <p className="text-xs text-muted-foreground">Display verified badge on your profile and ads</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Store className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Higher Visibility</p>
                <p className="text-xs text-muted-foreground">Verified accounts get priority in search results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {canSubmitRequest() && (
          <>
            <Separator />
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Submit Verification Request</h4>
                
                {/* Verification Type */}
                <div className="space-y-3">
                  <Label>Verification Type</Label>
                  <RadioGroup
                    value={formData.request_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, request_type: value }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="seller" id="seller" />
                      <Label htmlFor="seller" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Individual Seller
                      </Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <RadioGroupItem value="business" id="business" />
                      <Label htmlFor="business" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Business Account
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="location" id="location" />
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Verification
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Location Verification */}
                {formData.request_type === 'location' && (
                  <div className="space-y-4">
                    <LocationVerificationForm 
                      onVerificationComplete={(data) => {
                        setFormData(prev => ({
                          ...prev,
                          additional_info: `Location verified: ${data.verifiedLocation}. Phone: ${data.phoneNumber}. Area code: ${data.areaCode}. Coordinates: ${data.coordinates.lat}, ${data.coordinates.lng}`
                        }));
                      }}
                    />
                  </div>
                )}

                {/* Business Information */}
                {formData.request_type === 'business' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name *</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                        placeholder="Your registered business name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="business_registration">Business Registration Number</Label>
                      <Input
                        id="business_registration"
                        value={formData.business_registration}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_registration: e.target.value }))}
                        placeholder="Tax ID, VAT number, or registration number"
                      />
                    </div>
                  </div>
                )}

                {/* Document URLs */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identity_document">Identity Document URL</Label>
                    <Input
                      id="identity_document"
                      type="url"
                      value={formData.identity_document_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, identity_document_url: e.target.value }))}
                      placeholder="Link to uploaded ID document (driver's license, passport, etc.)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload your document to a cloud service and provide the public link
                    </p>
                  </div>
                  
                  {formData.request_type === 'business' && (
                    <div className="space-y-2">
                      <Label htmlFor="business_document">Business Document URL</Label>
                      <Input
                        id="business_document"
                        type="url"
                        value={formData.business_document_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, business_document_url: e.target.value }))}
                        placeholder="Link to business registration certificate or similar"
                      />
                    </div>
                  )}
                </div>

                {/* Online Presence */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://your-website.com"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Social Media Profiles (Optional)</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder="Facebook profile/page URL"
                        value={formData.social_media_urls.facebook}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          social_media_urls: { ...prev.social_media_urls, facebook: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="Instagram profile URL"
                        value={formData.social_media_urls.instagram}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          social_media_urls: { ...prev.social_media_urls, instagram: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="Twitter/X profile URL"
                        value={formData.social_media_urls.twitter}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          social_media_urls: { ...prev.social_media_urls, twitter: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="LinkedIn profile URL"
                        value={formData.social_media_urls.linkedin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          social_media_urls: { ...prev.social_media_urls, linkedin: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-2">
                  <Label htmlFor="additional_info">Additional Information</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
                    placeholder="Any additional information that might help with verification..."
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting || loading}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Submit Verification Request
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {status === 'pending' && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Your verification request is being reviewed. This typically takes 1-3 business days.
            </p>
          </div>
        )}

        {status === 'approved' && (
          <div className="text-center py-4 space-y-2">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="font-semibold text-green-700">Congratulations!</p>
            <p className="text-muted-foreground">
              Your account has been verified. You'll now see a verified badge on your profile and ads.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationForm;