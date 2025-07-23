-- Create trusted contacts table
CREATE TABLE public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_user_id UUID,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  relationship TEXT, -- friend, family, partner, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trusted_contacts_no_self_contact CHECK (user_id != contact_user_id)
);

-- Create safety check-ins table
CREATE TABLE public.safety_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ad_id UUID,
  meetup_location TEXT NOT NULL,
  meetup_address TEXT,
  meetup_latitude NUMERIC,
  meetup_longitude NUMERIC,
  scheduled_time TIMESTAMPTZ NOT NULL,
  expected_duration_minutes INTEGER DEFAULT 60,
  expected_return_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'started', 'completed', 'overdue', 'emergency')),
  last_checkin_time TIMESTAMPTZ,
  emergency_contacts UUID[] DEFAULT '{}',
  notes TEXT,
  contact_person_name TEXT,
  contact_person_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create check-in updates table for real-time status tracking
CREATE TABLE public.checkin_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('en_route', 'arrived', 'safe', 'completed', 'help_needed', 'emergency')),
  location_latitude NUMERIC,
  location_longitude NUMERIC,
  message TEXT,
  is_automatic BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create check-in notifications table
CREATE TABLE public.checkin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('scheduled', 'started', 'update', 'overdue', 'emergency')),
  message TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for trusted_contacts
CREATE POLICY "Users can manage their own trusted contacts" 
ON public.trusted_contacts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view contacts where they are listed" 
ON public.trusted_contacts 
FOR SELECT 
USING (auth.uid() = contact_user_id);

-- RLS policies for safety_checkins
CREATE POLICY "Users can manage their own safety check-ins" 
ON public.safety_checkins 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Trusted contacts can view check-ins where they are emergency contacts" 
ON public.safety_checkins 
FOR SELECT 
USING (
  auth.uid() = ANY(emergency_contacts) OR
  EXISTS (
    SELECT 1 FROM public.trusted_contacts tc 
    WHERE tc.user_id = safety_checkins.user_id 
    AND (tc.contact_user_id = auth.uid() OR tc.id = ANY(safety_checkins.emergency_contacts))
  )
);

-- RLS policies for checkin_updates
CREATE POLICY "Users can manage updates for their own check-ins" 
ON public.checkin_updates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.safety_checkins sc 
    WHERE sc.id = checkin_updates.checkin_id 
    AND sc.user_id = auth.uid()
  )
);

CREATE POLICY "Emergency contacts can view check-in updates" 
ON public.checkin_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.safety_checkins sc 
    WHERE sc.id = checkin_updates.checkin_id 
    AND (
      auth.uid() = ANY(sc.emergency_contacts) OR
      EXISTS (
        SELECT 1 FROM public.trusted_contacts tc 
        WHERE tc.user_id = sc.user_id 
        AND tc.contact_user_id = auth.uid()
      )
    )
  )
);

-- RLS policies for checkin_notifications
CREATE POLICY "System can manage notifications" 
ON public.checkin_notifications 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Contacts can view their notifications" 
ON public.checkin_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.trusted_contacts tc 
    WHERE tc.id = checkin_notifications.contact_id 
    AND tc.contact_user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);
CREATE INDEX idx_trusted_contacts_contact_user_id ON public.trusted_contacts(contact_user_id);
CREATE INDEX idx_safety_checkins_user_id ON public.safety_checkins(user_id);
CREATE INDEX idx_safety_checkins_status ON public.safety_checkins(status);
CREATE INDEX idx_safety_checkins_scheduled_time ON public.safety_checkins(scheduled_time);
CREATE INDEX idx_checkin_updates_checkin_id ON public.checkin_updates(checkin_id);
CREATE INDEX idx_checkin_notifications_contact_id ON public.checkin_notifications(contact_id);
CREATE INDEX idx_safety_checkins_emergency_contacts ON public.safety_checkins USING GIN(emergency_contacts);

-- Create triggers for updated_at
CREATE TRIGGER update_trusted_contacts_updated_at
BEFORE UPDATE ON public.trusted_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_checkins_updated_at
BEFORE UPDATE ON public.safety_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically calculate expected return time
CREATE OR REPLACE FUNCTION calculate_expected_return_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expected_return_time := NEW.scheduled_time + (COALESCE(NEW.expected_duration_minutes, 60) || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_return_time_trigger
BEFORE INSERT OR UPDATE ON public.safety_checkins
FOR EACH ROW
EXECUTE FUNCTION calculate_expected_return_time();

-- Function to create notifications when check-ins are created
CREATE OR REPLACE FUNCTION notify_emergency_contacts()
RETURNS TRIGGER AS $$
DECLARE
  contact_record RECORD;
  message_text TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    message_text := 'Safety check-in scheduled: ' || NEW.meetup_location || ' at ' || to_char(NEW.scheduled_time, 'Mon DD at HH24:MI');
    
    -- Notify all emergency contacts
    FOR contact_record IN 
      SELECT tc.id, tc.contact_name, tc.contact_user_id
      FROM public.trusted_contacts tc
      WHERE tc.user_id = NEW.user_id 
        AND tc.is_active = true
        AND (tc.id = ANY(NEW.emergency_contacts) OR array_length(NEW.emergency_contacts, 1) IS NULL)
    LOOP
      INSERT INTO public.checkin_notifications (
        checkin_id,
        contact_id,
        notification_type,
        message
      ) VALUES (
        NEW.id,
        contact_record.id,
        'scheduled',
        message_text
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_contacts_on_checkin
AFTER INSERT ON public.safety_checkins
FOR EACH ROW
EXECUTE FUNCTION notify_emergency_contacts();

-- Function to handle check-in status updates and notifications
CREATE OR REPLACE FUNCTION handle_checkin_status_update()
RETURNS TRIGGER AS $$
DECLARE
  contact_record RECORD;
  message_text TEXT;
  notification_type TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Determine notification type and message based on status
    CASE NEW.status
      WHEN 'started' THEN
        notification_type := 'started';
        message_text := 'Safety check-in started at ' || NEW.meetup_location;
      WHEN 'completed' THEN
        notification_type := 'update';
        message_text := 'Safety check-in completed successfully';
      WHEN 'overdue' THEN
        notification_type := 'overdue';
        message_text := 'ALERT: Check-in is overdue. Expected return was ' || to_char(NEW.expected_return_time, 'HH24:MI');
      WHEN 'emergency' THEN
        notification_type := 'emergency';
        message_text := 'EMERGENCY: Immediate assistance may be needed at ' || NEW.meetup_location;
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Notify emergency contacts of status change
    FOR contact_record IN 
      SELECT tc.id, tc.contact_name, tc.contact_user_id
      FROM public.trusted_contacts tc
      WHERE tc.user_id = NEW.user_id 
        AND tc.is_active = true
        AND (tc.id = ANY(NEW.emergency_contacts) OR array_length(NEW.emergency_contacts, 1) IS NULL)
    LOOP
      INSERT INTO public.checkin_notifications (
        checkin_id,
        contact_id,
        notification_type,
        message
      ) VALUES (
        NEW.id,
        contact_record.id,
        notification_type,
        message_text
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_status_updates
AFTER UPDATE ON public.safety_checkins
FOR EACH ROW
EXECUTE FUNCTION handle_checkin_status_update();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trusted_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_notifications;

-- Set replica identity for real-time updates
ALTER TABLE public.trusted_contacts REPLICA IDENTITY FULL;
ALTER TABLE public.safety_checkins REPLICA IDENTITY FULL;
ALTER TABLE public.checkin_updates REPLICA IDENTITY FULL;
ALTER TABLE public.checkin_notifications REPLICA IDENTITY FULL;