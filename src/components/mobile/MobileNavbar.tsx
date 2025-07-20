import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSwipeNavigation } from '@/hooks/useTouchGestures';
import { useEnhancedMobile } from '@/hooks/useEnhancedMobile';
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNavbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { triggerHapticFeedback } = useEnhancedMobile();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', badge: 0 },
    { icon: Search, label: 'Search', path: '/search', badge: 0 },
    { icon: Plus, label: 'Post', path: '/post-ad', badge: 0 },
    { icon: MessageCircle, label: 'Messages', path: '/messages', badge: 2 },
    { icon: User, label: 'Profile', path: user ? '/dashboard' : '/auth', badge: 0 }
  ];

  // Swipe navigation between tabs
  const { gestureHandlers } = useSwipeNavigation(
    () => {
      // Swipe left - next tab
      const currentIndex = navItems.findIndex(item => item.path === location.pathname);
      const nextIndex = (currentIndex + 1) % navItems.length;
      if (currentIndex !== -1) {
        window.location.href = navItems[nextIndex].path;
      }
    },
    () => {
      // Swipe right - previous tab
      const currentIndex = navItems.findIndex(item => item.path === location.pathname);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
      if (currentIndex !== -1) {
        window.location.href = navItems[prevIndex].path;
      }
    }
  );

  const handleNavClick = (path: string) => {
    triggerHapticFeedback('light');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Classifieds
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                triggerHapticFeedback('light');
              }}
              className="h-8 w-8 p-0"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col pt-16 p-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-lg">{item.label}</span>
                {item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar - Enhanced */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/98 backdrop-blur-md border-t shadow-lg"
        {...gestureHandlers}
      >
        <div className="flex items-center justify-around py-1 px-2 safe-area-inset-bottom">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 relative",
                  active
                    ? "text-primary bg-primary/10 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  {active && (
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                  )}
                  <item.icon className={cn("h-6 w-6 relative z-10", active && "fill-current")} />
                  {item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center ring-2 ring-background"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-xs truncate transition-all",
                  active ? "font-medium" : "font-normal"
                )}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>

      {/* Content Padding for Fixed Navigation */}
      <div className="lg:hidden">
        <div className="h-16" /> {/* Top padding */}
        <div className="h-20" /> {/* Bottom padding */}
      </div>
    </>
  );
};

export default MobileNavbar;