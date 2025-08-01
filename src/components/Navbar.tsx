import { useState, useEffect } from "react";
import { Search, Menu, User, Plus, MapPin, LogOut, Settings, Heart, MessageCircle, Shield, Crown, Zap, BarChart3, Smartphone, Bell, List, ShoppingCart, Package, Target, Map } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationBell from "@/components/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import TradeSpidersLogo from "@/components/TradeSpidersLogo";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/hooks/useLanguage";
import { useNearbyAlerts } from "@/hooks/useNearbyAlerts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCartComponent } from "@/components/ShoppingCart";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isModerator, userRole } = useAdmin();
  const { t } = useLanguage();
  const { hasActiveAlerts } = useNearbyAlerts();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Set up real-time subscription for unread count
      const channel = supabase
        .channel('navbar-messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_unread_message_count', {
        user_uuid: user.id
      });

      if (error) throw error;
      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* TradeSpiders Logo */}
          <div className="flex items-center space-x-3">
            <SidebarTrigger className="h-8 w-8" />
            <button 
              onClick={() => navigate('/')}
              className="hover:opacity-80 transition-opacity"
            >
              <TradeSpidersLogo size="md" showText={true} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for anything..."
                className="pl-10 pr-4 h-10 bg-muted/50 border-muted focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Location & Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="hidden lg:flex">
              <MapPin className="h-4 w-4 mr-2" />
              San Francisco
            </Button>
            
            <Button 
              variant="hero" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => user ? navigate('/post-ad') : navigate('/auth')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Post Ad
            </Button>
            
            {user && <NotificationBell />}
            {user && <ShoppingCartComponent />}
            
            <LanguageSwitcher />
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {(isAdmin || isModerator) && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground"
                      >
                        {isAdmin ? <Crown className="h-2 w-2" /> : <Shield className="h-2 w-2" />}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-between p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.email}</p>
                    </div>
                    {userRole && (
                      <Badge variant="outline" className="text-xs">
                        {userRole}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/analytics')}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  
                   <DropdownMenuItem onClick={() => navigate('/nearby-alerts')}>
                     <Target className="mr-2 h-4 w-4" />
                     <div className="flex items-center justify-between w-full">
                       <span>Nearby Alerts</span>
                       {hasActiveAlerts && (
                         <Badge variant="secondary" className="ml-2 h-4 text-xs">
                           On
                         </Badge>
                       )}
                     </div>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/search-alerts')}>
                     <Search className="mr-2 h-4 w-4" />
                     Search Alerts
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/map')}>
                     <Map className="mr-2 h-4 w-4" />
                     Map View
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/messages')}>
                     <MessageCircle className="mr-2 h-4 w-4" />
                     <span>Messages</span>
                     {unreadCount > 0 && (
                       <Badge variant="secondary" className="ml-auto bg-red-500 text-white text-xs">
                         {unreadCount}
                       </Badge>
                     )}
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/orders')}>
                     <Package className="mr-2 h-4 w-4" />
                     <span>Orders</span>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/inventory')}>
                     <Package className="mr-2 h-4 w-4" />
                     <span>Inventory</span>
                   </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/realtime-demo')}>
                    <Zap className="mr-2 h-4 w-4" />
                    Real-time Demo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/mobile')}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Mobile Features
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/watchlists')}>
                    <Bell className="mr-2 h-4 w-4" />
                    Watchlists
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/bulk-management')}>
                     <List className="mr-2 h-4 w-4" />
                     Bulk Management
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/saved')}>
                     <Heart className="mr-2 h-4 w-4" />
                     Saved Ads
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/safe-meetup')}>
                     <Shield className="mr-2 h-4 w-4" />
                     Safe MeetUp
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/pricing')}>
                     <Crown className="mr-2 h-4 w-4" />
                     Subscription Plans
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/profile')}>
                     <User className="mr-2 h-4 w-4" />
                     My Profile
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/settings')}>
                     <Settings className="mr-2 h-4 w-4" />
                     Settings
                   </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for anything..."
              className="pl-10 pr-4 h-10 bg-muted/50 border-muted"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;