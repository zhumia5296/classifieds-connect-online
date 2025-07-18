import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  Target,
  DollarSign,
  Tag,
  Filter,
  Save,
  X
} from 'lucide-react';
import { useNearbyAlerts, type CreateNearbyAlertData } from '@/hooks/useNearbyAlerts';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import LocationRadiusControl from './LocationRadiusControl';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Category {
  id: string;
  name: string;
}

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

const NearbyAlertsManager: React.FC = () => {
  const { 
    preferences, 
    loading, 
    hasActiveAlerts,
    createPreference, 
    updatePreference, 
    deletePreference, 
    togglePreference,
    createQuickAlert
  } = useNearbyAlerts();
  
  const { location, requestLocation, hasLocation } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateNearbyAlertData>({
    radius_km: 25,
    categories: [],
    conditions: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setCategories(data);
  };

  const handleCreateNew = () => {
    setFormData({
      radius_km: 25,
      categories: [],
      conditions: [],
      location_lat: location?.coords?.latitude,
      location_lng: location?.coords?.longitude,
      location_name: location?.address?.split(',')[0] || 'Current location'
    });
    setEditingId(null);
    setShowCreateForm(true);
  };

  const handleEdit = (preference: any) => {
    setFormData({
      radius_km: preference.radius_km,
      max_price: preference.max_price,
      min_price: preference.min_price,
      categories: preference.categories || [],
      conditions: preference.conditions || [],
      keywords: preference.keywords,
      location_lat: preference.location_lat,
      location_lng: preference.location_lng,
      location_name: preference.location_name
    });
    setEditingId(preference.id);
    setShowCreateForm(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updatePreference(editingId, formData);
      } else {
        await createPreference(formData);
      }
      setShowCreateForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving nearby alert preference:', error);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories?.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...(prev.categories || []), categoryId]
    }));
  };

  const handleConditionToggle = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...(prev.conditions || []), condition]
    }));
  };

  if (!hasLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Nearby Item Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Location Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enable location access to receive alerts when items appear near you.
            </p>
            <Button onClick={() => requestLocation(true)}>
              <MapPin className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Nearby Item Alerts
              {hasActiveAlerts && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {preferences.length === 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={createQuickAlert}
                  disabled={loading}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Quick Setup
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {preferences.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No Nearby Alerts</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up alerts to be notified when items matching your criteria appear near you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {preferences.map((preference) => (
                <div key={preference.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Switch
                          checked={preference.is_enabled}
                          onCheckedChange={(enabled) => togglePreference(preference.id, enabled)}
                        />
                        <span className="font-medium">
                          {preference.location_name || 'Your Location'}
                        </span>
                        <Badge variant="outline">
                          {preference.radius_km}km radius
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {preference.keywords && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Keywords: {preference.keywords}
                          </div>
                        )}
                        {(preference.min_price || preference.max_price) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Price: {preference.min_price || '0'} - {preference.max_price || '∞'}
                          </div>
                        )}
                        {preference.categories && preference.categories.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Filter className="h-3 w-3" />
                            {preference.categories.length} categories selected
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(preference)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreference(preference.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId ? 'Edit Nearby Alert' : 'Create Nearby Alert'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location & Radius */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Location & Radius</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location-name">Location Name</Label>
                  <Input
                    id="location-name"
                    placeholder="e.g., Downtown, Home, Work"
                    value={formData.location_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                  />
                </div>
                <div>
                  <LocationRadiusControl
                    radius={formData.radius_km}
                    onRadiusChange={(radius) => setFormData(prev => ({ ...prev, radius_km: radius }))}
                    showPresets={true}
                    showCustomInput={true}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Price Range (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-price">Minimum Price</Label>
                  <Input
                    id="min-price"
                    type="number"
                    placeholder="0"
                    value={formData.min_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      min_price: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="max-price">Maximum Price</Label>
                  <Input
                    id="max-price"
                    type="number"
                    placeholder="No limit"
                    value={formData.max_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      max_price: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="text-base font-medium">Keywords (Optional)</Label>
              <Textarea
                id="keywords"
                placeholder="e.g., iPhone, bicycle, furniture"
                value={formData.keywords || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Items matching any of these keywords in title or description will trigger alerts
              </p>
            </div>

            <Separator />

            {/* Categories */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Categories ({formData.categories?.length || 0} selected)</span>
                  <Plus className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.categories?.includes(category.id) || false}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Conditions */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Conditions ({formData.conditions?.length || 0} selected)</span>
                  <Plus className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {CONDITION_OPTIONS.map((condition) => (
                    <div key={condition.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition.value}`}
                        checked={formData.conditions?.includes(condition.value) || false}
                        onCheckedChange={() => handleConditionToggle(condition.value)}
                      />
                      <Label htmlFor={`condition-${condition.value}`} className="text-sm">
                        {condition.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Alert' : 'Create Alert'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NearbyAlertsManager;