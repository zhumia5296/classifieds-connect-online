import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealTimeMessaging } from '@/hooks/useRealTimeMessaging';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import { 
  Send, 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Smile
} from "lucide-react";

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string;
}

interface RecipientProfile {
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface ChatWindowProps {
  adId: string;
  recipientId: string;
  onBack?: () => void;
}

const ChatWindow = ({ adId, recipientId, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [ad, setAd] = useState<Ad | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    loading,
    sending,
    typingUsers,
    sendMessage,
    handleTyping,
    markMessagesAsRead
  } = useRealTimeMessaging({ adId, recipientId });

  useEffect(() => {
    if (user && adId && recipientId) {
      fetchAdInfo();
      fetchRecipientProfile();
    }
  }, [user, adId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchAdInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, price, currency')
        .eq('id', adId)
        .single();

      if (error) throw error;
      setAd(data);
    } catch (err) {
      console.error('Error fetching ad info:', err);
    }
  };

  const fetchRecipientProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, is_verified')
        .eq('user_id', recipientId)
        .single();

      if (error) throw error;
      setRecipientProfile(data);
    } catch (err) {
      console.error('Error fetching recipient profile:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage, 'text', replyingTo || undefined);
    
    if (success) {
      setNewMessage('');
      setReplyingTo(null);
      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
    } else {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleReply = (messageId: string, content: string) => {
    setReplyingTo(messageId);
    setNewMessage(`@${recipientProfile?.display_name || 'User'} `);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;

      toast({
        title: "Message edited",
        description: "Your message has been updated.",
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Failed to edit message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;

      toast({
        title: "Message deleted",
        description: "Your message has been removed.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Failed to delete message",
        description: "Please try again.",
        variant: "destructive"
      });
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

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return 'Contact for price';
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${price.toLocaleString()}`;
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
      {/* Header */}
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            <Avatar className="h-10 w-10">
              {recipientProfile?.avatar_url ? (
                <AvatarImage src={recipientProfile.avatar_url} />
              ) : (
                <AvatarFallback>
                  {recipientProfile?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg truncate">
                  {recipientProfile?.display_name || 'User'}
                </h3>
                {recipientProfile?.is_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {ad?.title && (
                  <span className="font-medium">
                    {ad.title} - {formatPrice(ad.price, ad.currency)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="space-y-1 p-1">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="space-y-2">
                  <p className="text-lg font-medium">Start the conversation!</p>
                  <p className="text-sm">
                    Send a message about "{ad?.title}" to begin chatting.
                  </p>
                </div>
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
                      ? 'You'
                      : message.sender_profile?.display_name || 'User'
                  }
                  senderAvatar={
                    message.sender_id === user?.id
                      ? user.user_metadata?.avatar_url
                      : message.sender_profile?.avatar_url
                  }
                  timestamp={message.created_at}
                  isRead={message.is_read}
                  isCurrentUser={message.sender_id === user?.id}
                  messageType={message.message_type}
                  editedAt={message.edited_at}
                  replyToMessageId={message.reply_to_message_id}
                  onMarkAsRead={markMessagesAsRead}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
                <span>
                  {typingUsers[0].user_name} is typing...
                </span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Reply Banner */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-t">
            <span className="text-sm text-muted-foreground">
              Replying to {recipientProfile?.display_name || 'User'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4 bg-background">
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" className="mb-1">
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="pr-10 resize-none max-h-20"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="mb-1"
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