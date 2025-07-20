import { useState } from 'react';
import { Grid3X3, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCategoryFilter } from '@/hooks/useCategoryFilter';
import { useIsMobile } from "@/hooks/use-mobile";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  ad_count?: number;
}

interface MobileCategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const MobileCategoryNav = ({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}: MobileCategoryNavProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) {
    return null; // Only show on mobile
  }

  const mainCategories = categories.filter(cat => cat.parent_id === null);
  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  
  const getTotalAdsCount = () => {
    return categories.reduce((total, cat) => total + (cat.ad_count || 0), 0);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleCategorySelect = (categoryId: string | null) => {
    onCategorySelect(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur-sm sticky top-[calc(4rem+7rem)] z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          {/* Current Category Display */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Grid3X3 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">
              {selectedCategoryData ? selectedCategoryData.name : 'All Categories'}
            </span>
            {selectedCategory && (
              <Badge variant="secondary" className="text-xs">
                {formatCount(selectedCategoryData?.ad_count || 0)}
              </Badge>
            )}
          </div>

          {/* Category Selector */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 ml-2">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center justify-between">
                  Categories
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-2 max-h-[calc(80vh-8rem)] overflow-y-auto">
                {/* All Categories Option */}
                <Button
                  variant={selectedCategory === null ? "default" : "ghost"}
                  className="w-full justify-between h-12"
                  onClick={() => handleCategorySelect(null)}
                >
                  <div className="flex items-center gap-3">
                    <Grid3X3 className="h-5 w-5" />
                    <span className="font-medium">All Categories</span>
                  </div>
                  <Badge variant="secondary">
                    {formatCount(getTotalAdsCount())}
                  </Badge>
                </Button>

                {/* Main Categories */}
                {mainCategories.map((category) => {
                  const subcategories = categories.filter(cat => cat.parent_id === category.id);
                  const totalCount = (category.ad_count || 0) + 
                    subcategories.reduce((sum, sub) => sum + (sub.ad_count || 0), 0);
                  
                  if (totalCount === 0) return null;
                  
                  return (
                    <div key={category.id} className="space-y-1">
                      <Button
                        variant={selectedCategory === category.id ? "default" : "ghost"}
                        className="w-full justify-between h-12"
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {category.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {formatCount(totalCount)}
                        </Badge>
                      </Button>
                      
                      {/* Subcategories */}
                      {subcategories.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {subcategories.map((subcat) => {
                            if ((subcat.ad_count || 0) === 0) return null;
                            
                            return (
                              <Button
                                key={subcat.id}
                                variant={selectedCategory === subcat.id ? "secondary" : "ghost"}
                                className="w-full justify-between h-10 text-sm"
                                onClick={() => handleCategorySelect(subcat.id)}
                              >
                                <span>{subcat.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {formatCount(subcat.ad_count || 0)}
                                </Badge>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default MobileCategoryNav;