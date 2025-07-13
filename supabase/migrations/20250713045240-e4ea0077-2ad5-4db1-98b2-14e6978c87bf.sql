-- Enable real-time for messages and typing_indicators tables
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.typing_indicators REPLICA IDENTITY FULL;

-- Add tables to realtime publication to enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Create an index for better real-time performance on messages
CREATE INDEX IF NOT EXISTS idx_messages_realtime 
ON public.messages (ad_id, created_at, sender_id, recipient_id);

-- Create an index for typing indicators performance  
CREATE INDEX IF NOT EXISTS idx_typing_indicators_realtime
ON public.typing_indicators (ad_id, recipient_id, expires_at);