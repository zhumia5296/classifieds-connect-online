import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageCircle, X } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'message' | 'system';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  sender_name?: string;
  ad_title?: string;
  ad_id?: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages for notifications
    const channel = supabase
      .channel('message-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, async (payload) => {
        const newMessage = payload.new;
        
        // Fetch sender and ad details
        const [senderResult, adResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', newMessage.sender_id)
            .single(),
          supabase
            .from('ads')
            .select('title')
            .eq('id', newMessage.ad_id)
            .single()
        ]);

        const senderName = senderResult.data?.display_name || 'Someone';
        const adTitle = adResult.data?.title || 'an ad';

        const notification: Notification = {
          id: newMessage.id,
          type: 'message',
          title: `New message from ${senderName}`,
          message: newMessage.content.substring(0, 100) + (newMessage.content.length > 100 ? '...' : ''),
          created_at: newMessage.created_at,
          read: false,
          sender_name: senderName,
          ad_title: adTitle,
          ad_id: newMessage.ad_id
        };

        setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep latest 20
        setUnreadCount(prev => prev + 1);

        // Show toast notification
        toast({
          title: notification.title,
          description: `${notification.message.substring(0, 50)}...`,
          action: (
            <Button
              size="sm"
              onClick={() => {
                navigate('/messages');
                setIsOpen(false);
              }}
            >
              View
            </Button>
          )
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, navigate]);

  // Fetch initial unread count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
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

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'message') {
      navigate('/messages');
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? 'bg-primary/5 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            {notification.ad_title && (
                              <p className="text-xs text-primary font-medium truncate">
                                {notification.ad_title}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistance(new Date(notification.created_at), new Date(), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;