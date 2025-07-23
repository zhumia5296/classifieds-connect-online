import React from 'react';
import { Shield, MapPin, Camera, Clock, Info, Users, ArrowRight } from 'lucide-react';
import SafeMeetupSpots from '@/components/SafeMeetupSpots';
import SafetyCheckinModal from '@/components/SafetyCheckinModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const SafeMeetup = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Safe MeetUp Spots</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Meet safely at verified locations with security cameras and monitoring. 
          Perfect for buying and selling items from our marketplace.
        </p>
      </div>

      {/* Safety Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Safety Guidelines
          </CardTitle>
          <CardDescription>
            Follow these best practices when meeting at safe locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">✅ Do</h4>
              <ul className="space-y-2 text-sm">
                <li>• Meet during daylight hours when possible</li>
                <li>• Bring a friend or let someone know where you're going</li>
                <li>• Test electronics before completing the transaction</li>
                <li>• Trust your instincts - if something feels wrong, leave</li>
                <li>• Use secure payment methods</li>
                <li>• Meet in the designated safe areas with cameras</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-red-600">❌ Don't</h4>
              <ul className="space-y-2 text-sm">
                <li>• Meet at private residences or secluded areas</li>
                <li>• Bring large amounts of cash</li>
                <li>• Go alone for high-value transactions</li>
                <li>• Share personal information unnecessarily</li>
                <li>• Rush into transactions without verification</li>
                <li>• Ignore safety protocols for convenience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <Camera className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Security Cameras</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              All locations are equipped with surveillance cameras for your safety and security.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Verified Safe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Every location is verified and approved by our safety team and local partners.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 mx-auto text-primary mb-2" />
            <CardTitle>Extended Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Many locations offer 24/7 access or extended hours for your convenience.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safety Check-in Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Real-time Safety Check-ins
          </CardTitle>
          <CardDescription>
            Share your meetup details with trusted contacts for enhanced safety
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create safety check-ins to automatically notify your emergency contacts about your 
            meetup location, time, and status updates in real-time.
          </p>
          <div className="flex gap-3">
            <SafetyCheckinModal />
            <Button variant="outline" asChild>
              <Link to="/safety-center" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safety Center
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Location Access Required:</strong> To see nearby safe meetup spots, 
          please enable location access in your browser. We only use your location to find 
          the closest safe meeting places.
        </AlertDescription>
      </Alert>

      {/* Safe Meetup Spots List */}
      <SafeMeetupSpots radiusKm={50} />
    </div>
  );
};

export default SafeMeetup;