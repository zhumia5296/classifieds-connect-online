-- Create analytics tables and functions

-- Analytics events table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics page views table
CREATE TABLE public.analytics_page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics user actions table
CREATE TABLE public.analytics_user_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  action_type TEXT NOT NULL,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  page_url TEXT,
  coordinates JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B test experiments table
CREATE TABLE public.ab_test_experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  traffic_allocation DECIMAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- A/B test variants table
CREATE TABLE public.ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.ab_test_experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  traffic_allocation DECIMAL NOT NULL DEFAULT 0.5,
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User experiment assignments table
CREATE TABLE public.user_experiment_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.ab_test_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, experiment_id)
);

-- Conversion events table
CREATE TABLE public.conversion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_value DECIMAL,
  currency TEXT DEFAULT 'USD',
  experiment_id UUID REFERENCES public.ab_test_experiments(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.ab_test_variants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "Users can insert their own analytics events" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true); -- Allow all inserts for analytics

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for analytics_page_views
CREATE POLICY "Users can insert their own page views" 
ON public.analytics_page_views FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all page views" 
ON public.analytics_page_views FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for analytics_user_actions
CREATE POLICY "Users can insert their own user actions" 
ON public.analytics_user_actions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all user actions" 
ON public.analytics_user_actions FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ab_test_experiments
CREATE POLICY "Admins can manage experiments" 
ON public.ab_test_experiments FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active experiments" 
ON public.ab_test_experiments FOR SELECT 
USING (status = 'active');

-- RLS Policies for ab_test_variants
CREATE POLICY "Admins can manage variants" 
ON public.ab_test_variants FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view variants for active experiments" 
ON public.ab_test_variants FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.ab_test_experiments 
  WHERE id = ab_test_variants.experiment_id AND status = 'active'
));

-- RLS Policies for user_experiment_assignments
CREATE POLICY "Users can view their own assignments" 
ON public.user_experiment_assignments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments" 
ON public.user_experiment_assignments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assignments" 
ON public.user_experiment_assignments FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for conversion_events
CREATE POLICY "Users can insert conversion events" 
ON public.conversion_events FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all conversion events" 
ON public.conversion_events FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

CREATE INDEX idx_analytics_page_views_user_id ON public.analytics_page_views(user_id);
CREATE INDEX idx_analytics_page_views_page_url ON public.analytics_page_views(page_url);
CREATE INDEX idx_analytics_page_views_created_at ON public.analytics_page_views(created_at);

CREATE INDEX idx_analytics_user_actions_user_id ON public.analytics_user_actions(user_id);
CREATE INDEX idx_analytics_user_actions_action_type ON public.analytics_user_actions(action_type);
CREATE INDEX idx_analytics_user_actions_timestamp ON public.analytics_user_actions(timestamp);

-- Create analytics overview function
CREATE OR REPLACE FUNCTION public.get_analytics_overview(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'total_events', (
      SELECT COUNT(*) FROM public.analytics_events 
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'total_page_views', (
      SELECT COUNT(*) FROM public.analytics_page_views 
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'unique_users', (
      SELECT COUNT(DISTINCT user_id) FROM public.analytics_events 
      WHERE created_at BETWEEN start_date AND end_date AND user_id IS NOT NULL
    ),
    'total_sessions', (
      SELECT COUNT(DISTINCT session_id) FROM public.analytics_events 
      WHERE created_at BETWEEN start_date AND end_date AND session_id IS NOT NULL
    )
  );
END;
$$;

-- Add trigger for updated_at on ab_test_experiments
CREATE TRIGGER update_ab_test_experiments_updated_at
  BEFORE UPDATE ON public.ab_test_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();