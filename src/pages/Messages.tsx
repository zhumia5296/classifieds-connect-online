import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import ChatWindow from '@/components/ChatWindow';
import RealtimeStatus from '@/components/RealtimeStatus';
import { MessageCircle, ArrowLeft, Users } from "lucide-react";
import { formatDistance } from 'date-fns';

interface Conversation {
  id: string;
  ad_id: string;
  other_user_id: string;
  other_user_name: string;
  ad_title: string;
  latest_message: string;
  latest_message_time: string;
  unread_count: number;
  is_sender: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all messages where user is involved
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          ad_id,
          sender_id,
          recipient_id,
          content,
          created_at,
          is_read
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all unique ad_id and user combinations
      const conversationMap = new Map<string, any>();
      
      messages?.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        const conversationKey = `${message.ad_id}-${otherUserId}`;
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            ad_id: message.ad_id,
            other_user_id: otherUserId,
            latest_message: message.content,
            latest_message_time: message.created_at,
            unread_count: 0,
            is_sender: message.sender_id === user.id
          });
        }

        // Count unread messages (messages sent to current user that are unread)
        if (message.recipient_id === user.id && !message.is_read) {
          conversationMap.get(conversationKey).unread_count += 1;
        }
      });

      const conversationList = Array.from(conversationMap.values());

      // Fetch ad titles and user profiles
      const adIds = [...new Set(conversationList.map(c => c.ad_id))];
      const userIds = [...new Set(conversationList.map(c => c.other_user_id))];

      const [adsResult, profilesResult] = await Promise.all([
        supabase.from('ads').select('id, title').in('id', adIds),
        supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
      ]);

      const adMap = new Map(adsResult.data?.map(ad => [ad.id, ad.title]) || []);
      const profileMap = new Map(profilesResult.data?.map(p => [p.user_id, p.display_name]) || []);

      // Combine all data
      const finalConversations: Conversation[] = conversationList.map(conv => ({
        id: `${conv.ad_id}-${conv.other_user_id}`,
        ad_id: conv.ad_id,
        other_user_id: conv.other_user_id,
        other_user_name: profileMap.get(conv.other_user_id) || 'Unknown User',
        ad_title: adMap.get(conv.ad_id) || 'Unknown Ad',
        latest_message: conv.latest_message,
        latest_message_time: conv.latest_message_time,
        unread_count: conv.unread_count,
        is_sender: conv.is_sender
      }));

      // Sort by latest message time
      finalConversations.sort((a, b) => 
        new Date(b.latest_message_time).getTime() - new Date(a.latest_message_time).getTime()
      );

      setConversations(finalConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast({
        title: "Error loading conversations",
        description: "Failed to load your messages.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('user-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(sender_id.eq.${user.id},recipient_id.eq.${user.id})`
      }, () => {
        // Refresh conversations when any message changes
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view messages</h2>
            <p className="text-muted-foreground">
              You need to be signed in to access your conversations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ChatWindow
          adId={selectedConversation.ad_id}
          recipientId={selectedConversation.other_user_id}
          onBack={() => setSelectedConversation(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </div>
            <RealtimeStatus />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">
                Start conversations by messaging sellers on their ads.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Browse Ads
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex gap-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar>
                    <AvatarFallback>
                      {conversation.other_user_name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {conversation.other_user_name}
                        </span>
                        {conversation.unread_count > 0 && (
                          <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.latest_message_time)}
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium text-primary mb-1">
                      {conversation.ad_title}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {conversation.is_sender ? 'You: ' : ''}
                      {truncateMessage(conversation.latest_message)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Messages;