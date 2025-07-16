import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Star, StarOff, Eye, EyeOff, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Ad {
  id: string;
  title: string;
  price: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  status: string;
  created_at: string;
  category: { name: string };
  views_count: number;
}

interface Category {
  id: string;
  name: string;
}

export default function BulkAdManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAds = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('ads')
        .select(`
          id,
          title,
          price,
          currency,
          is_active,
          is_featured,
          status,
          created_at,
          views_count,
          category:categories(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'featured') {
          query = query.eq('is_featured', true);
        } else if (statusFilter === 'active') {
          query = query.eq('is_active', true);
        } else if (statusFilter === 'inactive') {
          query = query.eq('is_active', false);
        }
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      const { data, error } = await query;

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

  useEffect(() => {
    fetchAds();
    fetchCategories();
  }, [user, searchTerm, statusFilter, categoryFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(new Set(ads.map(ad => ad.id)));
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
            <p className="text-muted-foreground">Manage multiple ads at once</p>
          </div>
          {selectedAds.size > 0 && (
            <Badge variant="secondary" className="text-sm">
              {selectedAds.size} selected
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
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
          </CardContent>
        </Card>

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
              <span>Your Ads ({ads.length})</span>
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
                        checked={selectedAds.size === ads.length && ads.length > 0}
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
                  {ads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {loading ? "Loading..." : "No ads found"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ads.map((ad) => (
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