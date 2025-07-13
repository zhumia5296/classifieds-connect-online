import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import { Send, ArrowLeft } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  ad_id: string;
  created_at: string;
  is_read: boolean;
  sender_profile?: {
    display_name: string;
  };
  recipient_profile?: {
    display_name: string;
  };
}

interface Ad {
  id: string;
  title: string;
}

interface ChatWindowProps {
  adId: string;
  recipientId: string;
  onBack?: () => void;
}

const ChatWindow = ({ adId, recipientId, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ad, setAd] = useState<Ad | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && adId && recipientId) {
      fetchMessages();
      fetchAdInfo();
      setupRealtimeSubscription();
    }
  }, [user, adId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          ad_id,
          created_at,
          is_read
        `)
        .eq('ad_id', adId)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles separately for better performance
      const userIds = Array.from(new Set([
        ...(messagesData || []).map(m => m.sender_id),
        ...(messagesData || []).map(m => m.recipient_id)
      ]));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Combine messages with profile data
      const messagesWithProfiles = (messagesData || []).map(message => ({
        ...message,
        sender_profile: profileMap.get(message.sender_id),
        recipient_profile: profileMap.get(message.recipient_id)
      }));

      setMessages(messagesWithProfiles);
      
      // Mark received messages as read
      await markMessagesAsRead();
    } catch (err) {
      console.error('Error fetching messages:', err);
      toast({
        title: "Error loading messages",
        description: "Failed to load conversation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title')
        .eq('id', adId)
        .single();

      if (error) throw error;
      setAd(data);
    } catch (err) {
      console.error('Error fetching ad info:', err);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ad_id=eq.${adId}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        
        // Only add message if it's part of this conversation
        if ((newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id)) {
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if it's from the other user
          if (newMessage.sender_id === recipientId) {
            markMessageAsRead(newMessage.id);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('ad_id', adId)
        .eq('recipient_id', user.id)
        .eq('sender_id', recipientId)
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user.id);

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          recipient_id: recipientId,
          ad_id: adId
        });

      if (error) throw error;

      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <div className="font-semibold">
              {ad?.title || 'Ad Conversation'}
            </div>
            <div className="text-sm text-muted-foreground font-normal">
              Chat about this listing
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="space-y-1 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  content={message.content}
                  senderId={message.sender_id}
                  senderName={
                    message.sender_id === user?.id
                      ? message.sender_profile?.display_name
                      : message.recipient_profile?.display_name
                  }
                  timestamp={message.created_at}
                  isRead={message.is_read}
                  isCurrentUser={message.sender_id === user?.id}
                  onMarkAsRead={markMessageAsRead}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatWindow;