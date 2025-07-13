import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import RealtimeStatus from '@/components/RealtimeStatus';
import RealTimeAnalytics from '@/components/analytics/RealTimeAnalytics';
import { 
  MessageCircle, 
  Zap, 
  Users, 
  Send,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DemoMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

const RealtimeDemo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const [messageCount, setMessageCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription for demo messages
    const channel = supabase
      .channel('demo-realtime')
      .on('broadcast', { event: 'demo-message' }, (payload) => {
        const message = payload.payload as DemoMessage;
        setMessages(prev => [...prev, message]);
        setMessageCount(prev => prev + 1);
        
        if (message.sender_id !== user.id) {
          toast({
            title: "New message received!",
            description: `${message.sender_name}: ${message.content.substring(0, 50)}...`,
          });
        }
      })
      .on('broadcast', { event: 'user-typing' }, (payload) => {
        const { user_id, user_name, typing } = payload.payload;
        if (user_id !== user.id) {
          setTypingUsers(prev => {
            if (typing) {
              return prev.includes(user_name) ? prev : [...prev, user_name];
            } else {
              return prev.filter(name => name !== user_name);
            }
          });
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        setConnectedUsers(Object.keys(presenceState).length);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const sendDemoMessage = async () => {
    if (!user || !newMessage.trim()) return;

    const message: DemoMessage = {
      id: crypto.randomUUID(),
      content: newMessage.trim(),
      sender_id: user.id,
      created_at: new Date().toISOString(),
      sender_name: user.user_metadata?.display_name || user.email || 'Anonymous'
    };

    // Broadcast the message
    const channel = supabase.channel('demo-realtime');
    await channel.send({
      type: 'broadcast',
      event: 'demo-message',
      payload: message
    });

    setNewMessage('');
  };

  const handleTyping = async () => {
    if (!user) return;

    const channel = supabase.channel('demo-realtime');
    await channel.send({
      type: 'broadcast',
      event: 'user-typing',
      payload: {
        user_id: user.id,
        user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
        typing: true
      }
    });

    // Stop typing after 3 seconds
    setTimeout(async () => {
      await channel.send({
        type: 'broadcast',
        event: 'user-typing',
        payload: {
          user_id: user.id,
          user_name: user.user_metadata?.display_name || user.email || 'Anonymous',
          typing: false
        }
      });
    }, 3000);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to test real-time messaging</h2>
            <p className="text-muted-foreground">
              You need to be signed in to participate in the real-time demo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Real-time Messaging Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience instant messaging with real-time updates, typing indicators, and presence tracking.
          Open this page in multiple tabs or share with others to see real-time synchronization.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <RealtimeStatus showDetails={true} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{connectedUsers}</div>
            <div className="text-sm text-muted-foreground">Connected Users</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{messageCount}</div>
            <div className="text-sm text-muted-foreground">Messages Sent</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{typingUsers.length}</div>
            <div className="text-sm text-muted-foreground">Users Typing</div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Live Chat Demo
            <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Real-time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="min-h-[300px] max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No messages yet. Send the first message!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender_id === user.id
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_id === user.id ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
                <span className="text-sm">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendDemoMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={sendDemoMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Analytics */}
      <RealTimeAnalytics />

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Instant Messaging</h4>
                <p className="text-sm text-muted-foreground">
                  Messages appear instantly across all connected clients without page refresh
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Typing Indicators</h4>
                <p className="text-sm text-muted-foreground">
                  See when other users are typing in real-time
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Presence Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Track who's online and actively using the system
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Live Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time insights and metrics with automatic updates
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Read Receipts</h4>
                <p className="text-sm text-muted-foreground">
                  Know when your messages have been read by recipients
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Instant browser notifications for new messages and updates
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeDemo;