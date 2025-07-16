import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import {
  Bell,
  MessageCircle,
  Eye,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Clock,
  Shield,
  Info,
  Trash2,
  Check,
  CheckCheck,
  Filter,
  Search,
  X,
  MoreVertical
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useNotifications, Notification } from '@/hooks/useNotifications';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageCircle className="h-4 w-4 text-blue-600" />;
    case 'watchlist':
      return <Eye className="h-4 w-4 text-green-600" />;
    case 'payment':
      return <CreditCard className="h-4 w-4 text-purple-600" />;
    case 'ad_response':
      return <Bell className="h-4 w-4 text-orange-600" />;
    case 'price_change':
      return <DollarSign className="h-4 w-4 text-yellow-600" />;
    case 'ad_expiring':
      return <Clock className="h-4 w-4 text-red-600" />;
    case 'verification':
      return <Shield className="h-4 w-4 text-indigo-600" />;
    case 'system':
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-600" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'message':
      return 'border-blue-200 bg-blue-50';
    case 'watchlist':
      return 'border-green-200 bg-green-50';
    case 'payment':
      return 'border-purple-200 bg-purple-50';
    case 'ad_response':
      return 'border-orange-200 bg-orange-50';
    case 'price_change':
      return 'border-yellow-200 bg-yellow-50';
    case 'ad_expiring':
      return 'border-red-200 bg-red-50';
    case 'verification':
      return 'border-indigo-200 bg-indigo-50';
    case 'system':
      return 'border-gray-200 bg-gray-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClick }: NotificationItemProps) => {
  return (
    <div
      className={`group relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        !notification.is_read 
          ? `${getNotificationColor(notification.type)} border-l-4 border-l-primary` 
          : 'border-border bg-background hover:bg-muted/50'
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">
                {notification.title}
              </h4>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-xs">
                {notification.type.replace('_', ' ')}
              </Badge>
              <time className="text-xs text-muted-foreground">
                {formatDistance(new Date(notification.created_at), new Date(), { addSuffix: true })}
              </time>
            </div>

            {notification.action_label && notification.action_url && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(notification.action_url!, '_blank');
                }}
              >
                {notification.action_label}
              </Button>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!notification.is_read && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type and action URL
    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) {
        navigate(notification.action_url);
      } else {
        window.open(notification.action_url, '_blank');
      }
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'message':
          navigate('/messages');
          break;
        case 'watchlist':
          if (notification.data && typeof notification.data === 'object' && 'ad_id' in notification.data) {
            navigate(`/ad/${notification.data.ad_id}`);
          }
          break;
        case 'payment':
          navigate('/profile?tab=billing');
          break;
        default:
          break;
      }
    }
  };

  // Filter notifications based on search and tab
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      selectedTab === 'all' ||
      (selectedTab === 'unread' && !notification.is_read) ||
      (selectedTab === notification.type);
    
    return matchesSearch && matchesTab;
  });

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load notifications</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {stats.unread > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.unread} unread
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {unreadNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Notifications</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your notifications. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllNotifications}>
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all" className="flex items-center gap-1">
                All
                <Badge variant="secondary" className="text-xs">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center gap-1">
                Unread
                {stats.unread > 0 && (
                  <Badge variant="default" className="text-xs">
                    {stats.unread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-1">
                Messages
                {stats.byType.message > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.byType.message}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="flex items-center gap-1">
                Watchlist
                {stats.byType.watchlist > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.byType.watchlist}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1">
                System
                {stats.byType.system > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.byType.system}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'No notifications match your search.'
                      : selectedTab === 'all' 
                        ? "You're all caught up!"
                        : `No ${selectedTab} notifications.`
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;