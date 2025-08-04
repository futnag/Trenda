-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Themes table policies
-- All authenticated users can read themes (public data)
CREATE POLICY "Authenticated users can view themes" ON public.themes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update themes (data collection system)
CREATE POLICY "Service role can manage themes" ON public.themes
    FOR ALL USING (auth.role() = 'service_role');

-- Trend data table policies
-- All authenticated users can read trend data
CREATE POLICY "Authenticated users can view trend data" ON public.trend_data
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can manage trend data
CREATE POLICY "Service role can manage trend data" ON public.trend_data
    FOR ALL USING (auth.role() = 'service_role');

-- Competitor analysis table policies
-- All authenticated users can read competitor analysis
CREATE POLICY "Authenticated users can view competitor analysis" ON public.competitor_analysis
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can manage competitor analysis
CREATE POLICY "Service role can manage competitor analysis" ON public.competitor_analysis
    FOR ALL USING (auth.role() = 'service_role');

-- User alerts table policies
-- Users can only manage their own alerts
CREATE POLICY "Users can view own alerts" ON public.user_alerts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own alerts" ON public.user_alerts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own alerts" ON public.user_alerts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own alerts" ON public.user_alerts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Service role can manage all alerts (for system operations)
CREATE POLICY "Service role can manage all alerts" ON public.user_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions table policies
-- Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Only service role can manage subscriptions (Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_themes_updated_at
    BEFORE UPDATE ON public.themes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_competitor_analysis_updated_at
    BEFORE UPDATE ON public.competitor_analysis
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_alerts_updated_at
    BEFORE UPDATE ON public.user_alerts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();