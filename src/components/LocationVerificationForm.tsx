import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { 
  validatePhoneNumber, 
  verifyLocationMatch, 
  PhoneVerificationResult 
} from '@/lib/locationVerification';
import { useLocation } from '@/hooks/useLocation';

interface LocationVerificationFormProps {
  onVerificationComplete?: (data: {
    phoneNumber: string;
    areaCode: string;
    verifiedLocation: string;
    coordinates: { lat: number; lng: number };
  }) => void;
}

const LocationVerificationForm = ({ onVerificationComplete }: LocationVerificationFormProps) => {
  const { toast } = useToast();
  const { location, requestLocation, loading: locationLoading } = useLocation();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerification, setPhoneVerification] = useState<PhoneVerificationResult | null>(null);
  const [locationMatch, setLocationMatch] = useState<{
    isMatch: boolean;
    distance?: number;
    message: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePhoneValidation = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    const result = validatePhoneNumber(phoneNumber);
    setPhoneVerification(result);

    if (result.isValid) {
      toast({
        title: "Phone number validated",
        description: `Area code ${result.areaCode} found for ${result.location?.state}`
      });
    } else {
      toast({
        title: "Invalid phone number",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleLocationVerification = async () => {
    if (!phoneVerification?.isValid) {
      toast({
        title: "Validate phone first",
        description: "Please validate your phone number first",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Request location if not already available
      if (!location?.coords?.latitude || !location?.coords?.longitude) {
        await requestLocation();
      }

      if ((location?.coords?.latitude && location?.coords?.longitude) && phoneVerification.location) {
        const matchResult = verifyLocationMatch(
          phoneVerification.areaCode,
          { lat: location.coords.latitude, lng: location.coords.longitude }
        );
        
        setLocationMatch(matchResult);

        if (matchResult.isMatch) {
          toast({
            title: "Location verified!",
            description: matchResult.message
          });

          // Call completion callback
          onVerificationComplete?.({
            phoneNumber: phoneVerification.formattedPhone,
            areaCode: phoneVerification.areaCode,
            verifiedLocation: `${phoneVerification.location.cities[0]}, ${phoneVerification.location.state}`,
            coordinates: { lat: location!.coords.latitude, lng: location!.coords.longitude }
          });
        } else {
          toast({
            title: "Location verification failed",
            description: matchResult.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Location access required",
          description: "Please allow location access to verify your area",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Unable to verify location. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Verification
        </CardTitle>
        <CardDescription>
          Verify your location using your phone number's area code to build trust with buyers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Section */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            We'll verify that your phone number's area code matches your current location to confirm you're a local seller.
          </AlertDescription>
        </Alert>

        {/* Phone Number Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handlePhoneValidation}
                variant="outline"
                disabled={!phoneNumber.trim()}
              >
                <Phone className="h-4 w-4 mr-2" />
                Validate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your US phone number including area code
            </p>
          </div>

          {/* Phone Validation Result */}
          {phoneVerification && (
            <div className="space-y-3">
              {phoneVerification.isValid ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-1">
                      <p><strong>Phone:</strong> {phoneVerification.formattedPhone}</p>
                      <p><strong>Area Code:</strong> {phoneVerification.areaCode}</p>
                      <p><strong>Location:</strong> {phoneVerification.location?.cities.join(', ')}, {phoneVerification.location?.state}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {phoneVerification.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Location Verification */}
        {phoneVerification?.isValid && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Verify Your Location</h4>
                <p className="text-sm text-muted-foreground">
                  We'll check if your current location matches your phone's area code
                </p>
              </div>
              <Button 
                onClick={handleLocationVerification}
                disabled={isVerifying || locationLoading}
              >
                {isVerifying || locationLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Verify Location
                  </>
                )}
              </Button>
            </div>

            {/* Location Match Result */}
            {locationMatch && (
              <Alert className={locationMatch.isMatch ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {locationMatch.isMatch ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={locationMatch.isMatch ? "text-green-800" : "text-red-800"}>
                  <div className="space-y-1">
                    <p>{locationMatch.message}</p>
                    {locationMatch.distance && (
                      <p className="text-sm">
                        Distance from area code region: {locationMatch.distance.toFixed(1)} miles
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success State */}
            {locationMatch?.isMatch && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-700 mb-1">Location Verified!</h3>
                <p className="text-sm text-muted-foreground">
                  Your phone number area code matches your current location
                </p>
                <Badge variant="default" className="mt-2">
                  Locally Verified Seller
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Privacy Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Privacy:</strong> We only use your location to verify it matches your phone's area code. 
            Your exact location is not stored or shared with other users.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default LocationVerificationForm;