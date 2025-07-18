import React from 'react';
import Navbar from '@/components/Navbar';
import SearchAlertsManager from '@/components/SearchAlertsManager';
import { useSEO } from '@/hooks/useSEO';

const SearchAlerts: React.FC = () => {
  useSEO({
    title: "Search Alerts - Get Notified | Classifieds Connect",
    description: "Create personalized search alerts and get notified when new items match your criteria. Never miss the perfect deal again!",
    keywords: "search alerts, notifications, personalized search, item alerts, deal notifications"
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <SearchAlertsManager />
      </div>
    </div>
  );
};

export default SearchAlerts;