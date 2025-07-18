import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import InteractiveMap from '@/components/InteractiveMap';
import { useSEO } from '@/hooks/useSEO';

const MapView: React.FC = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Map View - Browse Items by Location | Classifieds Connect",
    description: "Explore all available items on an interactive map. Find listings near you and discover great deals in your area.",
    keywords: "map view, location search, nearby items, local marketplace, geographic search"
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col h-[calc(100vh-200px)]">
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
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Map View</h1>
                <p className="text-muted-foreground mt-1">
                  Browse all available items by location
                </p>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 rounded-lg border overflow-hidden">
            <InteractiveMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;