import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryManager } from '@/components/InventoryManager';
import { StockTracker } from '@/components/StockTracker';
import { Package, BarChart3, TrendingUp } from 'lucide-react';

const Inventory = () => {
  const { user, loading } = useAuth();

  // SEO for inventory page
  useSEO({
    title: "Inventory Management - Track Your Stock | Classifieds Connect",
    description: "Manage your product inventory, track stock levels, and get alerts for low inventory items on Classifieds Connect.",
    keywords: "inventory management, stock tracking, product management, seller tools"
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track stock levels, manage inventory, and optimize your listings for better sales.
          </p>
        </div>

        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Stock</span>
              <span className="sm:hidden">Manage</span>
            </TabsTrigger>
            <TabsTrigger value="tracker" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Stock Tracker</span>
              <span className="sm:hidden">Tracker</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage">
            <InventoryManager />
          </TabsContent>

          <TabsContent value="tracker">
            <StockTracker />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inventory Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Coming soon! Get insights into your inventory performance, sales trends, and optimization recommendations.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inventory;