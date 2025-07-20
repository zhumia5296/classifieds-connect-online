import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Grid, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon?: string;
  ad_count?: number;
  slug: string;
}

interface CompactCategoryNavProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string | null) => void;
}

const CompactCategoryNav = ({
  categories,
  selectedCategory,
  onCategorySelect
}: CompactCategoryNavProps) => {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show only top 5 most popular categories in compact view
  const topCategories = categories
    .sort((a, b) => (b.ad_count || 0) - (a.ad_count || 0))
    .slice(0, 4);

  const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name;

  const handleCategoryClick = (categoryId: string | null) => {
    onCategorySelect(categoryId);
    setShowAllCategories(false);
  };

  const getCategoryIcon = (category: Category) => {
    // Default icons for common categories
    const iconMap: { [key: string]: string } = {
      'electronics': '📱',
      'vehicles': '🚗',
      'real-estate': '🏠',
      'jobs': '💼',
      'services': '🔧',
      'furniture': '🪑',
      'clothing': '👕',
      'books': '📚',
      'sports': '⚽',
      'toys': '🧸',
      'pets': '🐕',
      'music': '🎵'
    };
    
    return category.icon || iconMap[category.slug.toLowerCase()] || '📦';
  };

  return (
    <div className="bg-background border-b">
      {/* Compact Category Tabs */}
      <ScrollArea className="w-full">
        <div 
          ref={scrollRef}
          className="flex items-center gap-2 px-4 py-3 min-w-max"
        >
          {/* All Categories Button */}
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryClick(null)}
            className="shrink-0 h-8"
          >
            <Grid className="h-3 w-3 mr-1" />
            All
          </Button>

          {/* Top Categories */}
          {topCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(category.id)}
              className="shrink-0 h-8 relative"
            >
              <span className="mr-1">{getCategoryIcon(category)}</span>
              <span className="hidden sm:inline">{category.name}</span>
              <span className="sm:hidden">{category.name.split(' ')[0]}</span>
              {category.ad_count && category.ad_count > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {category.ad_count > 999 ? '999+' : category.ad_count}
                </Badge>
              )}
            </Button>
          ))}

          {/* More Categories Sheet */}
          <Sheet open={showAllCategories} onOpenChange={setShowAllCategories}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 h-8">
                <MoreHorizontal className="h-3 w-3 mr-1" />
                More
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>All Categories</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {/* All button in sheet */}
                  <Button
                    variant={!selectedCategory ? "default" : "outline"}
                    onClick={() => handleCategoryClick(null)}
                    className="h-12 flex flex-col items-center justify-center gap-1"
                  >
                    <Grid className="h-5 w-5" />
                    <span className="text-xs">All Categories</span>
                  </Button>

                  {/* All categories in grid */}
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      onClick={() => handleCategoryClick(category.id)}
                      className="h-12 flex flex-col items-center justify-center gap-1 relative"
                    >
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="text-xs text-center leading-tight">
                        {category.name}
                      </span>
                      {category.ad_count && category.ad_count > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                          {category.ad_count > 99 ? '99+' : category.ad_count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </ScrollArea>

      {/* Selected Category Indicator */}
      {selectedCategory && selectedCategoryName && (
        <div className="px-4 py-2 bg-muted/50 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing:</span>
            <Badge variant="outline" className="bg-background">
              {selectedCategoryName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCategoryClick(null)}
              className="h-6 px-2 text-xs ml-auto"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactCategoryNav;