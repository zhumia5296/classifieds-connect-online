import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingDown,
  Eye,
  ShoppingCart
} from 'lucide-react';

interface InventoryItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity_available: number;
  max_quantity_per_order: number;
  views_count: number;
  category_name?: string;
  created_at: string;
  is_featured: boolean;
}

interface StockTrackerProps {
  compact?: boolean;
}

export const StockTracker: React.FC<StockTrackerProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchInventoryItems();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, stockFilter]);

  const fetchInventoryItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          price,
          currency,
          quantity_available,
          max_quantity_per_order,
          views_count,
          created_at,
          is_featured,
          categories (name)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems = (data || []).map(item => ({
        ...item,
        category_name: item.categories?.name || 'Unknown'
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply stock filter
    switch (stockFilter) {
      case 'low':
        filtered = filtered.filter(item => 
          (item.quantity_available || 0) > 0 && (item.quantity_available || 0) <= 5
        );
        break;
      case 'out':
        filtered = filtered.filter(item => (item.quantity_available || 0) === 0);
        break;
      case 'in_stock':
        filtered = filtered.filter(item => (item.quantity_available || 0) > 5);
        break;
    }

    setFilteredItems(filtered);
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (compact) {
    const lowStockItems = items.filter(item => (item.quantity_available || 0) <= 5);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">All items are well stocked</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{item.title}</span>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-muted-foreground">{item.quantity_available || 0}</span>
                    {getStockBadge(item.quantity_available || 0)}
                  </div>
                </div>
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{lowStockItems.length - 3} more items need attention
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Tracker
        </CardTitle>
        <CardDescription>
          Monitor stock levels across all your listings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {searchTerm || stockFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'You don\'t have any active listings'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {getStockBadge(item.quantity_available || 0)}
                    {item.is_featured && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatPrice(item.price, item.currency)}</span>
                    <span>{item.category_name}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {item.views_count}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {item.quantity_available || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Max: {item.max_quantity_per_order || 10}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};