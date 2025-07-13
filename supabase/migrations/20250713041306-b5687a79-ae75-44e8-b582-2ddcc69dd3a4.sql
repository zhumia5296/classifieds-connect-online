-- Add real-time messaging enhancements
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.messages(id);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 seconds'),
    UNIQUE(user_id, ad_id, recipient_id)
);

-- Enable RLS on typing indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing indicators
CREATE POLICY "Users can manage their own typing indicators"
ON public.typing_indicators
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view typing indicators for their conversations"
ON public.typing_indicators
FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

-- Enable realtime for messages and typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.typing_indicators 
  WHERE expires_at < now();
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires_at ON public.typing_indicators(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(ad_id, sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.messages
  WHERE recipient_id = user_uuid
    AND is_read = false;
$$;