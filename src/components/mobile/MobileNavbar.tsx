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

      {/* Bottom Navigation Bar */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t"
        {...gestureHandlers}
      >
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-0 flex-1",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5", active && "fill-current")} />
                  {item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
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