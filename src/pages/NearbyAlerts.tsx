import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import NearbyAlertsManager from '@/components/NearbyAlertsManager';
import { useSEO } from '@/hooks/useSEO';

const NearbyAlerts: React.FC = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Nearby Item Alerts - Never Miss Great Deals | Classifieds Connect",
    description: "Set up personalized alerts for items near you. Get instant notifications when products matching your criteria appear in your area.",
    keywords: "nearby alerts, location alerts, item notifications, local deals, push notifications"
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nearby Item Alerts</h1>
              <p className="text-muted-foreground mt-1">
                Get notified instantly when items matching your criteria appear near you
              </p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>How Nearby Alerts Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h3 className="font-medium mb-1">Set Your Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose your search radius, price range, categories, and keywords
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h3 className="font-medium mb-1">We Monitor for You</h3>
                  <p className="text-sm text-muted-foreground">
                    Our system automatically checks new listings against your criteria
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h3 className="font-medium mb-1">Get Instant Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications and in-app alerts for matching items
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Manager */}
          <NearbyAlertsManager />
        </div>
      </div>
    </div>
  );
};

export default NearbyAlerts;