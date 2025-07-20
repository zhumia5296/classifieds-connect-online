import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEnhancedMobile } from "@/hooks/useEnhancedMobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileAdCard from "@/components/mobile/MobileAdCard";
import { MobileFilterBar } from "@/components/mobile/MobileFilterBar";
import { MobileBulkActions } from "@/components/mobile/MobileBulkActions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowUpDown, Smartphone, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Ad {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  category: { name: string };
  category_id: string;
  views_count: number;
}

interface Category {
  id: string;
  name: string;
}

interface AdvancedFilters {
  searchTerm: string;
  searchFields: string[];
  statusFilter: string;
  categoryFilter: string[];
  priceRange: [number, number];
  viewsRange: [number, number];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function MobileBulkManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    deviceInfo, 
    networkInfo, 
    triggerHapticFeedback, 
    shareContent,
    shouldUseReducedData,
    getOptimalImageQuality 
  } = useEnhancedMobile();

  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Advanced filter state
  const [filters, setFilters] = useState<AdvancedFilters>({
    searchTerm: "",
    searchFields: ["title"],
    statusFilter: "all",
    categoryFilter: [],
    priceRange: [0, 10000],
    viewsRange: [0, 1000],
    dateRange: {
      from: undefined,
      to: undefined,
    },
    sortBy: "created_at",
    sortOrder: 'desc',
  });

  // Apply filters to ads
  const filteredAds = useMemo(() => {
    let filtered = [...ads];

    // Text search across selected fields
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(ad => {
        return filters.searchFields.some(field => {
          const value = ad[field as keyof Ad];
          return value?.toString().toLowerCase().includes(searchLower);
        });
      });
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      if (filters.statusFilter === 'featured') {
        filtered = filtered.filter(ad => ad.is_featured);
      } else if (filters.statusFilter === 'active') {
        filtered = filtered.filter(ad => ad.is_active);
      } else if (filters.statusFilter === 'inactive') {
        filtered = filtered.filter(ad => !ad.is_active);
      }
    }

    // Category filter
    if (filters.categoryFilter.length > 0) {
      filtered = filtered.filter(ad => 
        filters.categoryFilter.includes(ad.category_id)
      );
    }

    // Price range filter
    filtered = filtered.filter(ad => {
      if (!ad.price) return true;
      return ad.price >= filters.priceRange[0] && ad.price <= filters.priceRange[1];
    });

    // Views range filter
    filtered = filtered.filter(ad => 
      ad.views_count >= filters.viewsRange[0] && ad.views_count <= filters.viewsRange[1]
    );

    // Date range filter
    if (filters.dateRange.from) {
      filtered = filtered.filter(ad => 
        new Date(ad.created_at) >= filters.dateRange.from!
      );
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(ad => 
        new Date(ad.created_at) <= filters.dateRange.to!
      );
    }

    return filtered;
  }, [ads, filters]);

  const fetchAds = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          description,
          location,
          price,
          currency,
          is_active,
          is_featured,
          status,
          created_at,
          updated_at,
          views_count,
          category_id,
          category:categories(name)
        `)
        .eq('user_id', user.id)
        .order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchCategories();
  }, [user, filters.sortBy, filters.sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    triggerHapticFeedback('light');
    await fetchAds();
    setRefreshing(false);
  };

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      searchFields: ["title"],
      statusFilter: "all",
      categoryFilter: [],
      priceRange: [0, 10000],
      viewsRange: [0, 1000],
      dateRange: {
        from: undefined,
        to: undefined,
      },
      sortBy: "created_at",
      sortOrder: 'desc',
    });
    triggerHapticFeedback('medium');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.statusFilter !== 'all') count++;
    if (filters.categoryFilter.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++;
    if (filters.viewsRange[0] > 0 || filters.viewsRange[1] < 1000) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  const handleSelectAll = () => {
    if (selectedAds.size === filteredAds.length) {
      setSelectedAds(new Set());
    } else {
      setSelectedAds(new Set(filteredAds.map(ad => ad.id)));
    }
    triggerHapticFeedback('light');
  };

  const handleSelectAd = (adId: string, selected: boolean) => {
    const newSelected = new Set(selectedAds);
    if (selected) {
      newSelected.add(adId);
    } else {
      newSelected.delete(adId);
    }
    setSelectedAds(newSelected);
  };

  const handleQuickAction = async (adId: string, action: 'activate' | 'deactivate' | 'feature' | 'share') => {
    triggerHapticFeedback('medium');
    
    if (action === 'share') {
      const ad = ads.find(a => a.id === adId);
      if (ad) {
        await shareContent({
          title: ad.title,
          text: `Check out this ad: ${ad.title}`,
          url: `${window.location.origin}/ad/${adId}`
        });
      }
      return;
    }

    try {
      setActionLoading(true);
      let updateData: any = {};
      
      switch (action) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'feature':
          updateData = { is_featured: !ads.find(a => a.id === adId)?.is_featured };
          break;
      }

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ad ${action}d successfully`,
      });

      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update ad",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedAds.size === 0) return;

    try {
      setActionLoading(true);
      let updateData: any = {};
      
      switch (action) {
        case 'activate':
          updateData = { is_active: true };
          break;
        case 'deactivate':
          updateData = { is_active: false };
          break;
        case 'feature':
          updateData = { is_featured: true };
          break;
        case 'unfeature':
          updateData = { is_featured: false };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('ads')
            .delete()
            .in('id', Array.from(selectedAds));

          if (deleteError) throw deleteError;

          toast({
            title: "Success",
            description: `${selectedAds.size} ads deleted successfully`,
          });

          setSelectedAds(new Set());
          fetchAds();
          setShowDeleteDialog(false);
          return;
      }

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .in('id', Array.from(selectedAds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedAds.size} ads updated successfully`,
      });

      setSelectedAds(new Set());
      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update ads",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkShare = async () => {
    const selectedAdsList = filteredAds.filter(ad => selectedAds.has(ad.id));
    const titles = selectedAdsList.map(ad => ad.title).join(', ');
    
    await shareContent({
      title: `${selectedAds.size} Classified Ads`,
      text: `Check out these ads: ${titles}`,
      url: window.location.origin
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to manage your ads.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Network status indicator */}
      {!networkInfo.online && (
        <div className="bg-destructive text-destructive-foreground text-center py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          You're offline. Some features may not work.
        </div>
      )}

      {/* Mobile-optimized header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold">Bulk Management</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>{filteredAds.length} of {ads.length} ads</span>
                {shouldUseReducedData() && (
                  <Badge variant="outline" className="text-xs">
                    Data Saver
                  </Badge>
                )}
              </div>
            </div>
            {networkInfo.online ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-destructive" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter bar */}
      <MobileFilterBar
        searchTerm={filters.searchTerm}
        onSearchChange={(term) => updateFilter('searchTerm', term)}
        onRefresh={handleRefresh}
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        selectedFiltersCount={getActiveFiltersCount()}
        onClearFilters={resetFilters}
        isLoading={loading || refreshing}
      />

      {/* Advanced filters */}
      <Collapsible open={showAdvancedFilters}>
        <CollapsibleContent>
          <div className="p-4 bg-muted/30 border-b space-y-4">
            {/* Search fields */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search in:</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'title', label: 'Title' },
                  { value: 'description', label: 'Description' },
                  { value: 'location', label: 'Location' }
                ].map((field) => (
                  <div key={field.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.value}
                      checked={filters.searchFields.includes(field.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('searchFields', [...filters.searchFields, field.value]);
                        } else {
                          updateFilter('searchFields', filters.searchFields.filter(f => f !== field.value));
                        }
                      }}
                    />
                    <Label htmlFor={field.value} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status:</Label>
              <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categories:</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={filters.categoryFilter.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('categoryFilter', [...filters.categoryFilter, category.id]);
                        } else {
                          updateFilter('categoryFilter', filters.categoryFilter.filter(c => c !== category.id));
                        }
                      }}
                    />
                    <Label htmlFor={category.id} className="text-sm">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value)}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Sorting */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sort by:</Label>
              <div className="flex gap-2">
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger className="flex-1 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="updated_at">Updated Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="views_count">Views</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-12 w-12"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Ads list */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-muted-foreground">Loading ads...</p>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No ads found matching your filters</p>
          </div>
        ) : (
          filteredAds.map((ad) => (
            <MobileAdCard
              key={ad.id}
              id={ad.id}
              title={ad.title}
              price={`$${ad.price}`}
              location={ad.location}
              timeAgo="1h ago"
              imageUrl="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
              category={ad.category?.name || 'Other'}
              condition="used"
              sellerId={ad.id}
            />
          ))
        )}
      </div>

      {/* Mobile bulk actions */}
      <MobileBulkActions
        selectedCount={selectedAds.size}
        totalCount={filteredAds.length}
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedAds(new Set())}
        onActivate={() => handleBulkAction('activate')}
        onDeactivate={() => handleBulkAction('deactivate')}
        onFeature={() => handleBulkAction('feature')}
        onUnfeature={() => handleBulkAction('unfeature')}
        onDelete={() => setShowDeleteDialog(true)}
        onShare={handleBulkShare}
        isLoading={actionLoading}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Ads</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAds.size} selected ads? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkAction('delete')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}