import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  ad_id: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
  edited_at?: string;
  reply_to_message_id?: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url?: string | null;
  };
  recipient_profile?: {
    display_name: string | null;
    avatar_url?: string | null;
  };
}

export interface TypingIndicator {
  user_id: string;
  ad_id: string;
  recipient_id: string;
  created_at: string;
  user_name?: string;
}

interface UseRealTimeMessagingProps {
  adId: string;
  recipientId: string;
}

export const useRealTimeMessaging = ({ adId, recipientId }: UseRealTimeMessagingProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const typingCleanupRef = useRef<NodeJS.Timeout>();

  // Fetch conversation messages
  const fetchMessages = useCallback(async () => {
    if (!user || !adId || !recipientId) return;

    try {
      setLoading(true);
      
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          ad_id,
          created_at,
          is_read,
          message_type,
          edited_at,
          reply_to_message_id
        `)
        .eq('ad_id', adId)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for all users in the conversation
      const userIds = Array.from(new Set([
        ...(messagesData || []).map(m => m.sender_id),
        ...(messagesData || []).map(m => m.recipient_id)
      ]));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const messagesWithProfiles = (messagesData || []).map(message => ({
        ...message,
        sender_profile: profileMap.get(message.sender_id),
        recipient_profile: profileMap.get(message.recipient_id)
      }));

      setMessages(messagesWithProfiles);
      
      // Mark received messages as read
      await markMessagesAsRead();
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, adId, recipientId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('ad_id', adId)
        .eq('recipient_id', user.id)
        .eq('sender_id', recipientId)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.recipient_id === user.id && msg.sender_id === recipientId
            ? { ...msg, is_read: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user, adId, recipientId]);

  // Send a message
  const sendMessage = useCallback(async (content: string, messageType: string = 'text', replyToMessageId?: string) => {
    if (!user || !content.trim() || sending) return false;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          recipient_id: recipientId,
          ad_id: adId,
          message_type: messageType,
          reply_to_message_id: replyToMessageId
        })
        .select()
        .single();

      if (error) throw error;

      // Stop typing indicator
      await stopTypingIndicator();
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [user, recipientId, adId, sending]);

  // Start typing indicator
  const startTypingIndicator = useCallback(async () => {
    if (!user || isTyping) return;

    try {
      setIsTyping(true);
      
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: user.id,
          ad_id: adId,
          recipient_id: recipientId,
          expires_at: new Date(Date.now() + 30000).toISOString()
        });

      // Auto-cleanup after 25 seconds (before expiry)
      if (typingCleanupRef.current) {
        clearTimeout(typingCleanupRef.current);
      }
      
      typingCleanupRef.current = setTimeout(() => {
        stopTypingIndicator();
      }, 25000);

    } catch (error) {
      console.error('Error starting typing indicator:', error);
    }
  }, [user, adId, recipientId, isTyping]);

  // Stop typing indicator
  const stopTypingIndicator = useCallback(async () => {
    if (!user || !isTyping) return;

    try {
      setIsTyping(false);
      
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', user.id)
        .eq('ad_id', adId)
        .eq('recipient_id', recipientId);

      if (typingCleanupRef.current) {
        clearTimeout(typingCleanupRef.current);
      }
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  }, [user, adId, recipientId, isTyping]);

  // Handle typing events
  const handleTyping = useCallback(() => {
    if (!user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing if not already
    if (!isTyping) {
      startTypingIndicator();
    }

    // Set timeout to stop typing after 3 seconds of no activity
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingIndicator();
    }, 3000);
  }, [user, isTyping, startTypingIndicator, stopTypingIndicator]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
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
  }, [user]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !adId || !recipientId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages-${adId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ad_id=eq.${adId}`
      }, async (payload) => {
        const newMessage = payload.new as Message;
        
        // Only add if it's part of this conversation
        if ((newMessage.sender_id === user.id && newMessage.recipient_id === recipientId) ||
            (newMessage.sender_id === recipientId && newMessage.recipient_id === user.id)) {
          
          // Fetch profile data for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            sender_profile: profile
          };

          setMessages(prev => [...prev, messageWithProfile]);
          
          // Mark as read if it's from the other user and we're viewing the conversation
          if (newMessage.sender_id === recipientId) {
            setTimeout(() => markMessagesAsRead(), 500);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `ad_id=eq.${adId}`
      }, (payload) => {
        const updatedMessage = payload.new as Message;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
          )
        );
      })
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing-${adId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `and(ad_id=eq.${adId},recipient_id=eq.${user.id})`
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const indicator = payload.new;
          
          // Fetch user name
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', indicator.user_id)
            .single();

          const indicatorWithName: TypingIndicator = {
            user_id: indicator.user_id,
            ad_id: indicator.ad_id,
            recipient_id: indicator.recipient_id,
            created_at: indicator.created_at,
            user_name: profile?.display_name || 'Someone'
          };

          setTypingUsers(prev => {
            const filtered = prev.filter(t => t.user_id !== indicator.user_id);
            return [...filtered, indicatorWithName];
          });

          // Auto-remove after expiry
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(t => t.user_id !== indicator.user_id));
          }, 30000);
          
        } else if (payload.eventType === 'DELETE') {
          setTypingUsers(prev => prev.filter(t => t.user_id !== payload.old.user_id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      stopTypingIndicator();
    };
  }, [user, adId, recipientId, markMessagesAsRead, stopTypingIndicator]);

  // Initial data fetch
  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [fetchMessages, fetchUnreadCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingCleanupRef.current) {
        clearTimeout(typingCleanupRef.current);
      }
      stopTypingIndicator();
    };
  }, [stopTypingIndicator]);

  return {
    messages,
    loading,
    sending,
    typingUsers,
    isTyping,
    unreadCount,
    sendMessage,
    handleTyping,
    markMessagesAsRead,
    fetchUnreadCount,
    refetchMessages: fetchMessages
  };
};