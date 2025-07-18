import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBulkManagement from "./MobileBulkManagement";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Star, StarOff, Eye, EyeOff, Search, Filter, ChevronDown, CalendarIcon, Save, FolderOpen, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
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

interface FilterPreset {
  id: string;
  name: string;
  filters: AdvancedFilters;
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

export default function BulkAdManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State hooks - must be called before any conditional returns
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState("");

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

  // If mobile, use mobile-optimized version
  if (isMobile) {
    return <MobileBulkManagement />;
  }

  const fetchAds = async () => {
    if (!user) return;

    try {
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

      if (error) {
        console.error('Error fetching ads:', error);
        toast({
          title: "Error",
          description: "Failed to fetch ads",
          variant: "destructive",
        });
        return;
      }

      setAds(data || []);
    } catch (error) {
      console.error('Error:', error);
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

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  useEffect(() => {
    fetchAds();
    fetchCategories();
  }, [user, filters.sortBy, filters.sortOrder]);

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
  };

  const saveFilterPreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: { ...filters }
    };

    setFilterPresets(prev => [...prev, newPreset]);
    setPresetName("");
    toast({
      title: "Success",
      description: "Filter preset saved successfully",
    });
  };

  const loadFilterPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    toast({
      title: "Success",
      description: `Loaded preset: ${preset.name}`,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(new Set(filteredAds.map(ad => ad.id)));
    } else {
      setSelectedAds(new Set());
    }
  };

  const handleSelectAd = (adId: string, checked: boolean) => {
    const newSelected = new Set(selectedAds);
    if (checked) {
      newSelected.add(adId);
    } else {
      newSelected.delete(adId);
    }
    setSelectedAds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedAds.size === 0) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .in('id', Array.from(selectedAds));

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete ads",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedAds.size} ads deleted successfully`,
      });

      setSelectedAds(new Set());
      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting ads",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedAds.size === 0) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: isActive })
        .in('id', Array.from(selectedAds));

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update ad status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedAds.size} ads ${isActive ? 'activated' : 'deactivated'} successfully`,
      });

      setSelectedAds(new Set());
      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating ad status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkFeatureToggle = async (featured: boolean) => {
    if (selectedAds.size === 0) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_featured: featured })
        .in('id', Array.from(selectedAds));

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update featured status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedAds.size} ads ${featured ? 'featured' : 'unfeatured'} successfully`,
      });

      setSelectedAds(new Set());
      fetchAds();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating featured status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bulk Ad Management</h1>
            <p className="text-muted-foreground">
              Manage multiple ads at once - {filteredAds.length} of {ads.length} ads shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedAds.size > 0 && (
              <Badge variant="secondary" className="text-sm">
                {selectedAds.size} selected
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </div>
        </div>

        {/* Basic Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search ads..."
                      value={filters.searchTerm}
                      onChange={(e) => updateFilter('searchTerm', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleContent>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Fields */}
                <div className="space-y-2">
                  <Label>Search in:</Label>
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
                        <Label htmlFor={field.value} className="text-sm font-normal">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Categories:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                        <Label htmlFor={category.id} className="text-sm font-normal">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</Label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value)}
                    max={10000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                </div>

                {/* Views Range */}
                <div className="space-y-2">
                  <Label>Views Range: {filters.viewsRange[0]} - {filters.viewsRange[1]}</Label>
                  <Slider
                    value={filters.viewsRange}
                    onValueChange={(value) => updateFilter('viewsRange', value)}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range:</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? format(filters.dateRange.from, "MMM d, yyyy") : "From date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.to ? format(filters.dateRange.to, "MMM d, yyyy") : "To date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Sorting */}
                <div className="space-y-2">
                  <Label>Sort by:</Label>
                  <div className="flex gap-2">
                    <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                      <SelectTrigger className="flex-1">
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
                      onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-2"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                  </div>
                </div>

                {/* Filter Presets */}
                <div className="space-y-2">
                  <Label>Filter Presets:</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Preset name..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={saveFilterPreset}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Preset
                    </Button>
                  </div>
                  {filterPresets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filterPresets.map((preset) => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          size="sm"
                          onClick={() => loadFilterPreset(preset)}
                          className="flex items-center gap-2"
                        >
                          <FolderOpen className="h-3 w-3" />
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Bulk Actions */}
        {selectedAds.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(false)}
                  disabled={actionLoading}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkFeatureToggle(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Feature
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkFeatureToggle(false)}
                  disabled={actionLoading}
                  className="flex items-center gap-2"
                >
                  <StarOff className="h-4 w-4" />
                  Unfeature
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={actionLoading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Ads</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedAds.size} selected ads? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Ads ({filteredAds.length})</span>
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAds.size === filteredAds.length && filteredAds.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {loading ? "Loading..." : "No ads found matching your filters"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAds.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAds.has(ad.id)}
                            onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {ad.title}
                            {ad.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          </div>
                        </TableCell>
                        <TableCell>{ad.category?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {ad.price ? `${ad.currency || 'USD'} ${ad.price}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ad.is_active ? "default" : "secondary"}>
                            {ad.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{ad.views_count}</TableCell>
                        <TableCell>
                          {format(new Date(ad.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}