import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Plus,
  MessageCircle,
  User,
  Settings,
  Heart,
  Bell,
  Package,
  BarChart3,
  Shield,
  Crown,
  Smartphone,
  List,
  Zap,
  MapPin,
  ChevronRight,
  Menu
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Search", url: "/search", icon: Search },
  { title: "Post Ad", url: "/post-ad", icon: Plus },
  { title: "Messages", url: "/messages", icon: MessageCircle, badge: 2 },
  { title: "Dashboard", url: "/dashboard", icon: User },
];

const marketplaceItems = [
  { title: "Favorites", url: "/saved", icon: Heart },
  { title: "Orders", url: "/orders", icon: Package },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Watchlists", url: "/watchlists", icon: Bell },
  { title: "Safe MeetUp", url: "/safe-meetup", icon: Shield },
];

const toolsItems = [
  { title: "Bulk Management", url: "/bulk-management", icon: List },
  { title: "Real-time Demo", url: "/realtime-demo", icon: Zap },
  { title: "Mobile Features", url: "/mobile", icon: Smartphone },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Subscription Plans", url: "/pricing", icon: Crown },
];

const accountItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useAdmin();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const [openGroups, setOpenGroups] = useState({
    marketplace: true,
    tools: false,
    admin: isAdmin,
    account: false,
  });

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/50";

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Logo and Trigger */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-primary">ClassifiedList</h2>
          )}
          <SidebarTrigger className="h-6 w-6" />
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Marketplace */}
        {user && (
          <SidebarGroup>
            <Collapsible
              open={openGroups.marketplace}
              onOpenChange={() => toggleGroup('marketplace')}
            >
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className={`cursor-pointer flex items-center justify-between ${collapsed ? "sr-only" : ""}`}>
                  Marketplace
                  {!collapsed && <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.marketplace ? "rotate-90" : ""}`} />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {marketplaceItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Tools */}
        {user && (
          <SidebarGroup>
            <Collapsible
              open={openGroups.tools}
              onOpenChange={() => toggleGroup('tools')}
            >
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className={`cursor-pointer flex items-center justify-between ${collapsed ? "sr-only" : ""}`}>
                  Tools
                  {!collapsed && <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.tools ? "rotate-90" : ""}`} />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {toolsItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Admin */}
        {(isAdmin || isModerator) && (
          <SidebarGroup>
            <Collapsible
              open={openGroups.admin}
              onOpenChange={() => toggleGroup('admin')}
            >
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className={`cursor-pointer flex items-center justify-between ${collapsed ? "sr-only" : ""}`}>
                  Admin
                  {!collapsed && <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.admin ? "rotate-90" : ""}`} />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Account */}
        {user && (
          <SidebarGroup>
            <Collapsible
              open={openGroups.account}
              onOpenChange={() => toggleGroup('account')}
            >
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className={`cursor-pointer flex items-center justify-between ${collapsed ? "sr-only" : ""}`}>
                  Account
                  {!collapsed && <ChevronRight className={`h-4 w-4 transition-transform ${openGroups.account ? "rotate-90" : ""}`} />}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {accountItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={getNavClass}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}