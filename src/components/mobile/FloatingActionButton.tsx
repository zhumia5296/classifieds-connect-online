import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useEnhancedMobile } from '@/hooks/useEnhancedMobile';
import {
  Plus,
  Camera,
  Edit,
  MessageCircle,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  className?: string;
}

export const FloatingActionButton = ({ className }: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { triggerHapticFeedback, isMobile } = useEnhancedMobile();

  const actions = [
    {
      icon: Edit,
      label: 'Post Ad',
      href: '/post-ad',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Camera,
      label: 'Quick Photo',
      href: '/post-ad?mode=camera',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      href: '/messages',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: Zap,
      label: 'Feature Ad',
      href: '/dashboard?tab=featured',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    }
  ];

  const { gestureHandlers } = useTouchGestures({
    onTap: () => {
      setIsExpanded(!isExpanded);
      triggerHapticFeedback('light');
    },
    onLongPress: () => {
      triggerHapticFeedback('medium');
      // Quick action - go directly to post ad
      window.location.href = '/post-ad';
    }
  });

  const handleActionClick = () => {
    triggerHapticFeedback('light');
    setIsExpanded(false);
  };

  if (!isMobile) return null;

  return (
    <div className={cn("fixed bottom-20 right-4 z-30", className)}>
      {/* Action Menu */}
      <div className={cn(
        "flex flex-col-reverse gap-3 mb-3 transition-all duration-300",
        isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        {actions.map((action, index) => (
          <div key={action.label} className="flex items-center gap-2">
            {/* Action Label */}
            <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border shadow-sm">
              {action.label}
            </div>
            
            {/* Action Button */}
            <Link to={action.href} onClick={handleActionClick}>
              <Button
                size="sm"
                className={cn(
                  "h-10 w-10 rounded-full shadow-lg transition-all duration-200",
                  action.color,
                  "animate-fade-in"
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <action.icon className="h-5 w-5 text-white" />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300",
          isExpanded && "rotate-45"
        )}
        {...gestureHandlers}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};