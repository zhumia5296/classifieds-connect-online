import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

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
  { title: "Home", url: "/" },
  { title: "Search", url: "/search" },
  { title: "Post Ad", url: "/post-ad" },
  { title: "Messages", url: "/messages", badge: 2 },
  { title: "Dashboard", url: "/dashboard" },
];

const marketplaceItems = [
  { title: "Favorites", url: "/saved" },
  { title: "Orders", url: "/orders" },
  { title: "Inventory", url: "/inventory" },
  { title: "Watchlists", url: "/watchlists" },
  { title: "Safe MeetUp", url: "/safe-meetup" },
];

const toolsItems = [
  { title: "Bulk Management", url: "/bulk-management" },
  { title: "Real-time Demo", url: "/realtime-demo" },
  { title: "Mobile Features", url: "/mobile" },
  { title: "Analytics", url: "/analytics" },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin" },
  { title: "Subscription Plans", url: "/pricing" },
];

const accountItems = [
  { title: "Profile", url: "/profile" },
  { title: "Settings", url: "/settings" },
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
        {/* Logo */}
        <div className="flex items-center p-4 border-b">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-primary">ClassifiedList</h2>
          )}
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
                      {collapsed && <span>{item.title}</span>}
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
                            <span>{item.title}</span>
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
                            <span>{item.title}</span>
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
                            <span>{item.title}</span>
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
                            <span>{item.title}</span>
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