import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Save, 
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  price: number;
  quantity_available: number;
  max_quantity_per_order: number;
  currency: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
}

interface StockAlert {
  id: string;
  title: string;
  current_stock: number;
  alert_level: 'low' | 'out';
}

export const InventoryManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    quantity_available: number;
    max_quantity_per_order: number;
  }>({ quantity_available: 0, max_quantity_per_order: 0 });

  useEffect(() => {
    if (user) {
      fetchInventoryData();
    }
  }, [user]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const { data: adsData, error } = await supabase
        .from('ads')
        .select('id, title, price, quantity_available, max_quantity_per_order, currency, is_active, views_count, created_at')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(adsData || []);

      // Generate stock alerts for low inventory items
      const alerts: StockAlert[] = (adsData || [])
        .filter(ad => {
          const stock = ad.quantity_available || 0;
          return stock <= 5; // Low stock threshold
        })
        .map(ad => ({
          id: ad.id,
          title: ad.title,
          current_stock: ad.quantity_available || 0,
          alert_level: (ad.quantity_available || 0) === 0 ? 'out' : 'low'
        }));

      setStockAlerts(alerts);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error loading inventory",
        description: "Failed to load your inventory data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (ad: Ad) => {
    setEditingId(ad.id);
    setEditValues({
      quantity_available: ad.quantity_available || 0,
      max_quantity_per_order: ad.max_quantity_per_order || 10
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ quantity_available: 0, max_quantity_per_order: 0 });
  };

  const saveInventoryUpdate = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({
          quantity_available: editValues.quantity_available,
          max_quantity_per_order: editValues.max_quantity_per_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Inventory updated",
        description: "Stock levels have been successfully updated.",
      });

      setEditingId(null);
      fetchInventoryData(); // Refresh data
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Update failed",
        description: "Failed to update inventory. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, icon: X };
    } else if (quantity <= 5) {
      return { label: 'Low Stock', variant: 'secondary' as const, icon: AlertTriangle };
    } else {
      return { label: 'In Stock', variant: 'default' as const, icon: Package };
    }
  };

  const getTotalInventoryValue = () => {
    return ads.reduce((total, ad) => {
      return total + (ad.price * (ad.quantity_available || 0));
    }, 0);
  };

  const getTotalItems = () => {
    return ads.reduce((total, ad) => total + (ad.quantity_available || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="font-medium mb-2">Stock Alerts ({stockAlerts.length})</div>
            <div className="space-y-1">
              {stockAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-sm">
                  <span className="font-medium">{alert.title}</span>
                  {alert.alert_level === 'out' ? (
                    <span className="text-red-600 ml-2">- Out of stock</span>
                  ) : (
                    <span className="text-orange-600 ml-2">- Only {alert.current_stock} left</span>
                  )}
                </div>
              ))}
              {stockAlerts.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  And {stockAlerts.length - 3} more items need attention
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalItems()}</div>
            <p className="text-xs text-muted-foreground">
              Across {ads.length} active listings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(getTotalInventoryValue())}
            </div>
            <p className="text-xs text-muted-foreground">
              Total stock value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stockAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track and manage stock levels for your listings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchInventoryData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active listings</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any active listings to manage inventory for.
              </p>
              <Button onClick={() => window.location.href = '/post-ad'}>
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {ads.map((ad) => {
                const stockStatus = getStockStatus(ad.quantity_available || 0);
                const isEditing = editingId === ad.id;
                
                return (
                  <div key={ad.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{ad.title}</h3>
                          <Badge variant={stockStatus.variant} className="flex items-center gap-1">
                            <stockStatus.icon className="h-3 w-3" />
                            {stockStatus.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Price: {formatPrice(ad.price, ad.currency)} • Views: {ad.views_count}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/ad/${ad.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {isEditing ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor={`stock-${ad.id}`}>Available Stock</Label>
                          <Input
                            id={`stock-${ad.id}`}
                            type="number"
                            min="0"
                            value={editValues.quantity_available}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              quantity_available: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`max-${ad.id}`}>Max Per Order</Label>
                          <Input
                            id={`max-${ad.id}`}
                            type="number"
                            min="1"
                            value={editValues.max_quantity_per_order}
                            onChange={(e) => setEditValues(prev => ({
                              ...prev,
                              max_quantity_per_order: parseInt(e.target.value) || 1
                            }))}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveInventoryUpdate(ad.id)}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Available Stock:</span>
                            <span className="ml-2 font-medium">{ad.quantity_available || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Per Order:</span>
                            <span className="ml-2 font-medium">{ad.max_quantity_per_order || 10}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(ad)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Stock
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};