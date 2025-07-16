import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookmarkPlus, Search } from 'lucide-react';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { FilterOptions } from './SearchFilter';

interface SaveSearchModalProps {
  searchQuery: string;
  filters: FilterOptions;
  categoryIds?: string[];
  trigger?: React.ReactNode;
}

const SaveSearchModal = ({ 
  searchQuery, 
  filters, 
  categoryIds = [],
  trigger 
}: SaveSearchModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { saveSearch } = useSavedSearches();

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const success = await saveSearch(
        name.trim(),
        searchQuery,
        filters,
        categoryIds,
        notificationEnabled
      );

      if (success) {
        setOpen(false);
        setName('');
        setDescription('');
        setNotificationEnabled(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const getSearchSummary = () => {
    const parts = [];
    
    if (searchQuery) {
      parts.push(`Search: "${searchQuery}"`);
    }
    
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) {
      const min = filters.priceRange.min ?? 0;
      const max = filters.priceRange.max ?? '∞';
      parts.push(`Price: $${min} - $${max}`);
    }
    
    if (filters.location) {
      parts.push(`Location: ${filters.location}`);
    }
    
    if (filters.condition) {
      parts.push(`Condition: ${filters.condition}`);
    }
    
    if (filters.categories.length > 0) {
      parts.push(`Categories: ${filters.categories.length} selected`);
    }
    
    if (filters.featuredOnly) {
      parts.push('Featured ads only');
    }
    
    if (filters.hasImages) {
      parts.push('With images only');
    }

    return parts.length > 0 ? parts.join(' • ') : 'All ads';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Save Search
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Save Search
          </DialogTitle>
          <DialogDescription>
            Save this search to get notified when new matching ads are posted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Summary */}
          <div className="bg-muted/50 p-3 rounded-md">
            <Label className="text-sm font-medium">Search criteria:</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {getSearchSummary()}
            </p>
          </div>
          
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="search-name">Name *</Label>
            <Input
              id="search-name"
              placeholder="e.g., MacBooks under $2000"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {name.length}/50 characters
            </p>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="search-description">Description (optional)</Label>
            <Textarea
              id="search-description"
              placeholder="Add a note about this search..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>
          
          {/* Notification Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new ads match this search
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save Search'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSearchModal;