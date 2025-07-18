import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Search, MapPin, DollarSign, Tag } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useWatchlists, type Watchlist } from '@/hooks/useWatchlists';

interface Category {
  id: string;
  name: string;
}

interface WatchlistFormProps {
  watchlist?: Watchlist;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const WatchlistForm = ({ watchlist, onSuccess, onCancel }: WatchlistFormProps) => {
  const { createWatchlist, updateWatchlist, loading } = useWatchlists();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    category_id: '',
    min_price: '',
    max_price: '',
    location: '',
    radius: '50'
  });

  useEffect(() => {
    loadCategories();
    if (watchlist) {
      setFormData({
        name: watchlist.name,
        keywords: watchlist.criteria.keywords || '',
        category_id: watchlist.criteria.category_id || '',
        min_price: watchlist.criteria.min_price?.toString() || '',
        max_price: watchlist.criteria.max_price?.toString() || '',
        location: watchlist.criteria.location || '',
        radius: watchlist.criteria.radius?.toString() || '50'
      });
    }
  }, [watchlist]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    const criteria: Watchlist['criteria'] = {};
    
    if (formData.keywords.trim()) criteria.keywords = formData.keywords.trim();
    if (formData.category_id && formData.category_id !== 'all') criteria.category_id = formData.category_id;
    if (formData.min_price) criteria.min_price = parseFloat(formData.min_price);
    if (formData.max_price) criteria.max_price = parseFloat(formData.max_price);
    if (formData.location.trim()) criteria.location = formData.location.trim();
    if (formData.radius) criteria.radius = parseInt(formData.radius);

    let success = false;
    if (watchlist) {
      success = await updateWatchlist(watchlist.id, { 
        name: formData.name.trim(), 
        criteria 
      });
    } else {
      success = await createWatchlist({
        name: formData.name.trim(),
        criteria
      });
    }

    if (success) {
      if (!watchlist) {
        // Reset form for new watchlist
        setFormData({
          name: '',
          keywords: '',
          category_id: '',
          min_price: '',
          max_price: '',
          location: '',
          radius: '50'
        });
      }
      onSuccess?.();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {watchlist ? 'Edit Watchlist' : 'Create New Watchlist'}
        </CardTitle>
        <CardDescription>
          {watchlist 
            ? 'Update your saved search criteria' 
            : 'Get notified when ads matching your criteria are posted'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Watchlist Name *</Label>
            <Input
              id="name"
              placeholder="e.g., iPhone under $500"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keywords" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Keywords
              </Label>
              <Input
                id="keywords"
                placeholder="e.g., iPhone 14 Pro"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Space-separated keywords to search in title and description
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Category
              </Label>
              <Select
                value={formData.category_id || 'all'}
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Min Price
              </Label>
              <Input
                id="min_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formData.min_price}
                onChange={(e) => handleInputChange('min_price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Max Price
              </Label>
              <Input
                id="max_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="No limit"
                value={formData.max_price}
                onChange={(e) => handleInputChange('max_price', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Search Radius (km)</Label>
              <Select 
                value={formData.radius} 
                onValueChange={(value) => handleInputChange('radius', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                  <SelectItem value="100">100 km</SelectItem>
                  <SelectItem value="500">500 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim()}
              className="flex-1"
            >
              {loading ? (watchlist ? 'Updating...' : 'Creating...') : (watchlist ? 'Update Watchlist' : 'Create Watchlist')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WatchlistForm;