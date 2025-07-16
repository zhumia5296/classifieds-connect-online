import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedMobile } from '@/hooks/useEnhancedMobile';
import { useSwipeNavigation } from '@/hooks/useTouchGestures';
import { 
  Eye, 
  EyeOff, 
  Star, 
  StarOff, 
  Trash2, 
  Share,
  MoreHorizontal,
  ChevronUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onFeature: () => void;
  onUnfeature: () => void;
  onDelete: () => void;
  onShare: () => void;
  isLoading?: boolean;
}

export const MobileBulkActions: React.FC<MobileBulkActionsProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onActivate,
  onDeactivate,
  onFeature,
  onUnfeature,
  onDelete,
  onShare,
  isLoading = false
}) => {
  const { triggerHapticFeedback } = useEnhancedMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const { gestureHandlers } = useSwipeNavigation(
    () => onClearSelection(), // swipe left to clear
    () => onSelectAll(), // swipe right to select all
    () => setIsExpanded(true), // swipe up to expand
    () => setIsExpanded(false) // swipe down to collapse
  );

  const handleAction = async (action: string, callback: () => void) => {
    setActiveAction(action);
    triggerHapticFeedback('medium');
    await callback();
    setActiveAction(null);
  };

  if (selectedCount === 0) return null;

  const actions = [
    {
      id: 'activate',
      label: 'Activate',
      icon: Eye,
      variant: 'outline' as const,
      action: onActivate
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: EyeOff,
      variant: 'outline' as const,
      action: onDeactivate
    },
    {
      id: 'feature',
      label: 'Feature',
      icon: Star,
      variant: 'outline' as const,
      action: onFeature
    },
    {
      id: 'unfeature',
      label: 'Unfeature',
      icon: StarOff,
      variant: 'outline' as const,
      action: onUnfeature
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share,
      variant: 'outline' as const,
      action: onShare
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      action: onDelete
    }
  ];

  return (
    <div 
      {...gestureHandlers}
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-50 transition-all duration-300 ease-in-out transform",
        "supports-[backdrop-filter]:bg-background/80"
      )}
    >
      {/* Selection summary */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="bg-primary text-primary-foreground px-3 py-1">
            {selectedCount} selected
          </Badge>
          <span className="text-sm text-muted-foreground">
            of {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-xs h-8 px-3"
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs h-8 px-3"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      {/* Actions grid */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-96" : "max-h-24"
      )}>
        <div className="p-4 pt-0">
          {/* Primary actions (always visible) */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {actions.slice(0, 4).map((action) => {
              const Icon = action.icon;
              const isActive = activeAction === action.id;
              
              return (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleAction(action.id, action.action)}
                  disabled={isLoading || isActive}
                  className={cn(
                    "flex flex-col items-center gap-1 h-16 px-2 transition-all duration-200",
                    isActive && "scale-95 opacity-50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs leading-none">{action.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Secondary actions (shown when expanded) */}
          {isExpanded && (
            <div className="grid grid-cols-2 gap-2">
              {actions.slice(4).map((action) => {
                const Icon = action.icon;
                const isActive = activeAction === action.id;
                
                return (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    size="sm"
                    onClick={() => handleAction(action.id, action.action)}
                    disabled={isLoading || isActive}
                    className={cn(
                      "flex items-center gap-2 h-12 justify-start px-4 transition-all duration-200",
                      action.variant === 'destructive' && "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground",
                      isActive && "scale-95 opacity-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{action.label}</span>
                    {isActive && (
                      <Zap className="h-4 w-4 animate-spin ml-auto" />
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Swipe hints */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
        <div className="w-8 h-1 bg-muted-foreground/30 rounded-full"></div>
      </div>
    </div>
  );
};