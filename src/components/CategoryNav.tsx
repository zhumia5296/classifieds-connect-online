import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { supabase } from '@/integrations/supabase/client';
import { 
  Car, 
  Home, 
  Briefcase, 
  Smartphone, 
  Sofa, 
  Shirt, 
  Gamepad2, 
  GraduationCap,
  Heart,
  Wrench,
  Grid3X3,
  Building,
  Users,
  Tag,
  AlertCircle
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  ad_count?: number;
}

// Icon mapping for categories
const iconMap: Record<string, any> = {
  'smartphone': Smartphone,
  'car': Car,
  'home': Home,
  'briefcase': Briefcase,
  'tag': Tag,
  'building': Building,
  'users': Users,
  'heart': Heart,
  'sofa': Sofa,
  'grid3x3': Grid3X3,
  'wrench': Wrench,
  'graduation-cap': GraduationCap,
  'shirt': Shirt,
  'gamepad2': Gamepad2,
};

const CategoryNav = () => {
  const { selectedCategory, setSelectedCategory } = useCategoryFilter();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories with ad counts
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          icon,
          parent_id
        `)
        .eq('is_active', true)
        .order('sort_order')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Get ad counts for each category
      const { data: adCounts, error: countError } = await supabase
        .from('ads')
        .select('category_id')
        .eq('is_active', true)
        .eq('status', 'active');

      if (countError) throw countError;

      // Count ads per category
      const countMap: Record<string, number> = {};
      adCounts?.forEach(ad => {
        countMap[ad.category_id] = (countMap[ad.category_id] || 0) + 1;
      });

      // Add counts to categories and filter out empty parent categories
      const categoriesWithCounts = categoriesData?.map(cat => ({
        ...cat,
        ad_count: countMap[cat.id] || 0
      })).filter(cat => 
        // Keep categories that have ads or are parent categories with children that have ads
        cat.ad_count > 0 || 
        (cat.parent_id === null && categoriesData.some(child => 
          child.parent_id === cat.id && countMap[child.id] > 0
        ))
      ) || [];

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Grid3X3;
    return iconMap[iconName] || Grid3X3;
  };

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const getTotalAdsCount = () => {
    return categories.reduce((total, cat) => total + (cat.ad_count || 0), 0);
  };

  if (loading) {
    return (
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center space-x-2 py-3 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter to show only main categories (no parent_id) and their counts
  const mainCategories = categories.filter(cat => cat.parent_id === null);
  
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
          {/* All Categories Button */}
          <Button
            variant={selectedCategory === null ? "default" : "ghost"}
            size="sm"
            className={`flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
              selectedCategory === null ? "shadow-card bg-primary text-primary-foreground" : "hover:bg-muted/50"
            }`}
            onClick={() => handleCategoryClick(null)}
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="font-medium">All</span>
            <Badge 
              variant="secondary" 
              className={`text-xs ${selectedCategory === null ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}
            >
              {formatCount(getTotalAdsCount())}
            </Badge>
          </Button>

          {/* Category Buttons */}
          {mainCategories.map((category) => {
            const IconComponent = getIcon(category.icon);
            const isActive = selectedCategory === category.id;
            
            // Calculate total count including subcategories
            const subcategories = categories.filter(cat => cat.parent_id === category.id);
            const totalCount = (category.ad_count || 0) + 
              subcategories.reduce((sum, sub) => sum + (sub.ad_count || 0), 0);
            
            // Don't show categories with no ads
            if (totalCount === 0) return null;
            
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                  isActive ? "shadow-card bg-primary text-primary-foreground" : "hover:bg-muted/50"
                }`}
                onClick={() => {
                  handleCategoryClick(category.id);
                  navigate(`/category/${category.slug}`);
                }}
              >
                <IconComponent className="h-4 w-4" />
                <span className="font-medium">{category.name}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${isActive ? "bg-primary-foreground/20 text-primary-foreground" : ""}`}
                >
                  {formatCount(totalCount)}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Subcategories */}
        {selectedCategory && (
          <div className="pb-3">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
              {categories
                .filter(cat => cat.parent_id === selectedCategory && (cat.ad_count || 0) > 0)
                .map((subcategory) => {
                  const IconComponent = getIcon(subcategory.icon);
                  
                  return (
                    <Button
                      key={subcategory.id}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 whitespace-nowrap text-xs h-7"
                      onClick={() => handleCategoryClick(subcategory.id)}
                    >
                      <IconComponent className="h-3 w-3" />
                      <span>{subcategory.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {formatCount(subcategory.ad_count || 0)}
                      </Badge>
                    </Button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryNav;