-- Fix security issues for the newly created functions
CREATE OR REPLACE FUNCTION calculate_expected_return_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expected_return_time := NEW.scheduled_time + (COALESCE(NEW.expected_duration_minutes, 60) || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';