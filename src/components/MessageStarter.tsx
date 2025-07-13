import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, X } from "lucide-react";

interface MessageStarterProps {
  adId: string;
  adTitle: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  onClose?: () => void;
  className?: string;
}

const MessageStarter = ({
  adId,
  adTitle,
  sellerId,
  sellerName,
  sellerAvatar,
  sellerVerified,
  onClose,
  className
}: MessageStarterProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send messages.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: message.trim(),
          sender_id: user.id,
          recipient_id: sellerId,
          ad_id: adId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Your message has been sent to the seller.",
      });

      // Navigate to full conversation
      navigate('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleStartConversation = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact the seller.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot message yourself",
        description: "You cannot send messages to your own ads.",
        variant: "destructive"
      });
      return;
    }

    setExpanded(true);
    setMessage(`Hi! I'm interested in "${adTitle}". Is it still available?`);
  };

  if (!expanded) {
    return (
      <div className={className}>
        <Button
          onClick={handleStartConversation}
          className="w-full"
          size="lg"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Seller
        </Button>
      </div>
    );
  }

  return (
    <Card className={`${className} relative`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Send Message
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Seller Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-10 w-10">
            {sellerAvatar ? (
              <AvatarImage src={sellerAvatar} />
            ) : (
              <AvatarFallback>
                {sellerName?.[0]?.toUpperCase() || 'S'}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {sellerName || 'Seller'}
              </p>
              {sellerVerified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {adTitle}
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending}
            className="min-h-[100px] resize-none"
            style={{ minHeight: '100px' }}
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setExpanded(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessage(`Hi! I'm interested in "${adTitle}". Is it still available?`)}
            className="text-xs"
          >
            Is this available?
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessage(`Hello! Can you tell me more about "${adTitle}"?`)}
            className="text-xs"
          >
            Tell me more
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessage(`Hi! Is the price negotiable for "${adTitle}"?`)}
            className="text-xs"
          >
            Price negotiable?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageStarter;