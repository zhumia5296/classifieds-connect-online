import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Search, Edit, Trash2, Plus, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SearchAlert {
  id: string;
  name: string;
  search_query: string;
  filters: any;
  is_active: boolean;
  notification_enabled: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const SearchAlertsManager: React.FC = () => {
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<SearchAlert | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    search_query: '',
    category_id: '',
    min_price: '',
    max_price: '',
    condition: '',
    location: '',
    notification_enabled: true
  });

  // Fetch user's search alerts
  const fetchSearchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('search_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching search alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load search alerts",
        variant: "destructive"
      });
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSearchAlerts();
      fetchCategories();
    }
    setIsLoading(false);
  }, [user]);

  // Create or update search alert
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const filters = {
      category_id: formData.category_id || null,
      min_price: formData.min_price ? parseFloat(formData.min_price) : null,
      max_price: formData.max_price ? parseFloat(formData.max_price) : null,
      condition: formData.condition || null,
      location: formData.location || null
    };

    // Remove null values
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === '') {
        delete filters[key];
      }
    });

    try {
      if (editingAlert) {
        // Update existing alert
        const { error } = await supabase
          .from('search_alerts')
          .update({
            name: formData.name,
            search_query: formData.search_query,
            filters: filters,
            notification_enabled: formData.notification_enabled
          })
          .eq('id', editingAlert.id);

        if (error) throw error;

        toast({
          title: "Search Alert Updated",
          description: "Your search alert has been updated successfully",
        });
      } else {
        // Create new alert
        const { error } = await supabase
          .from('search_alerts')
          .insert({
            user_id: user.id,
            name: formData.name,
            search_query: formData.search_query,
            filters: filters,
            notification_enabled: formData.notification_enabled
          });

        if (error) throw error;

        toast({
          title: "Search Alert Created",
          description: "Your new search alert is now active",
        });
      }

      // Reset form and refresh alerts
      setFormData({
        name: '',
        search_query: '',
        category_id: '',
        min_price: '',
        max_price: '',
        condition: '',
        location: '',
        notification_enabled: true
      });
      setShowCreateForm(false);
      setEditingAlert(null);
      fetchSearchAlerts();

    } catch (error) {
      console.error('Error saving search alert:', error);
      toast({
        title: "Error",
        description: "Failed to save search alert",
        variant: "destructive"
      });
    }
  };

  // Delete search alert
  const handleDelete = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('search_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Search Alert Deleted",
        description: "Your search alert has been removed",
      });

      fetchSearchAlerts();
    } catch (error) {
      console.error('Error deleting search alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete search alert",
        variant: "destructive"
      });
    }
  };

  // Toggle alert active status
  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('search_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) throw error;

      fetchSearchAlerts();
    } catch (error) {
      console.error('Error toggling search alert:', error);
      toast({
        title: "Error",
        description: "Failed to update search alert",
        variant: "destructive"
      });
    }
  };

  // Edit alert
  const handleEdit = (alert: SearchAlert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      search_query: alert.search_query,
      category_id: alert.filters?.category_id || '',
      min_price: alert.filters?.min_price?.toString() || '',
      max_price: alert.filters?.max_price?.toString() || '',
      condition: alert.filters?.condition || '',
      location: alert.filters?.location || '',
      notification_enabled: alert.notification_enabled
    });
    setShowCreateForm(true);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-muted-foreground">
              Please sign in to manage your search alerts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto mb-4"></div>
            <p>Loading search alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6" />
            Search Alerts
          </h2>
          <p className="text-muted-foreground">
            Get notified when new items match your search criteria
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Alert
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAlert ? 'Edit Search Alert' : 'Create New Search Alert'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Alert Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., iPhone deals"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="search_query">Search Keywords</Label>
                  <Input
                    id="search_query"
                    value={formData.search_query}
                    onChange={(e) => setFormData({ ...formData, search_query: e.target.value })}
                    placeholder="e.g., iPhone 15 Pro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="min_price">Min Price</Label>
                  <Input
                    id="min_price"
                    type="number"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="max_price">Max Price</Label>
                  <Input
                    id="max_price"
                    type="number"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., New York"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={formData.notification_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, notification_enabled: checked })}
                />
                <Label htmlFor="notifications">Enable notifications</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAlert(null);
                    setFormData({
                      name: '',
                      search_query: '',
                      category_id: '',
                      min_price: '',
                      max_price: '',
                      condition: '',
                      location: '',
                      notification_enabled: true
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Search Alerts</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first search alert to get notified about new items
                </p>
                <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Search Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{alert.name}</h3>
                      <Badge variant={alert.is_active ? "default" : "secondary"}>
                        {alert.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {alert.notification_enabled && (
                        <Badge variant="outline" className="gap-1">
                          <Bell className="h-3 w-3" />
                          Notifications
                        </Badge>
                      )}
                    </div>
                    
                    {alert.search_query && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Keywords:</span> {alert.search_query}
                      </p>
                    )}
                    
                    {Object.keys(alert.filters || {}).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {alert.filters?.category_id && (
                          <Badge variant="outline" className="gap-1">
                            <Filter className="h-3 w-3" />
                            Category
                          </Badge>
                        )}
                        {(alert.filters?.min_price || alert.filters?.max_price) && (
                          <Badge variant="outline" className="gap-1">
                            <Filter className="h-3 w-3" />
                            Price Range
                          </Badge>
                        )}
                        {alert.filters?.condition && (
                          <Badge variant="outline" className="gap-1">
                            <Filter className="h-3 w-3" />
                            Condition
                          </Badge>
                        )}
                        {alert.filters?.location && (
                          <Badge variant="outline" className="gap-1">
                            <Filter className="h-3 w-3" />
                            Location
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.is_active}
                      onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchAlertsManager;