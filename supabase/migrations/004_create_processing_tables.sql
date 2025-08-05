-- Create user_notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create theme_insights table for storing analysis insights
CREATE TABLE IF NOT EXISTS public.theme_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    impact VARCHAR(20) CHECK (impact IN ('positive', 'negative', 'neutral')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(theme_id, type)
);

-- Create collection_runs table for tracking data collection operations
CREATE TABLE IF NOT EXISTS public.collection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sources TEXT[] NOT NULL,
    results JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processing_jobs table for tracking background processing
CREATE TABLE IF NOT EXISTS public.processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type);

CREATE INDEX IF NOT EXISTS idx_theme_insights_theme_id ON public.theme_insights(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_insights_type ON public.theme_insights(type);
CREATE INDEX IF NOT EXISTS idx_theme_insights_confidence ON public.theme_insights(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_theme_insights_impact ON public.theme_insights(impact);

CREATE INDEX IF NOT EXISTS idx_collection_runs_user_id ON public.collection_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_runs_status ON public.collection_runs(status);
CREATE INDEX IF NOT EXISTS idx_collection_runs_completed_at ON public.collection_runs(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_job_type ON public.processing_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON public.processing_jobs(created_at DESC);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_theme_insights_theme_confidence ON public.theme_insights(theme_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_collection_runs_user_status ON public.collection_runs(user_id, status, completed_at DESC);

-- Add updated_at trigger for user_notifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_notifications_updated_at 
    BEFORE UPDATE ON public.user_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_theme_insights_updated_at 
    BEFORE UPDATE ON public.theme_insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at 
    BEFORE UPDATE ON public.processing_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for theme_insights (readable by all authenticated users)
CREATE POLICY "Authenticated users can view theme insights" ON public.theme_insights
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for collection_runs
CREATE POLICY "Users can view their own collection runs" ON public.collection_runs
    FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Service role can manage collection runs" ON public.collection_runs
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for processing_jobs (service role only)
CREATE POLICY "Service role can manage processing jobs" ON public.processing_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_notifications TO authenticated;
GRANT SELECT ON public.theme_insights TO authenticated;
GRANT SELECT ON public.collection_runs TO authenticated;

-- Service role permissions
GRANT ALL ON public.user_notifications TO service_role;
GRANT ALL ON public.theme_insights TO service_role;
GRANT ALL ON public.collection_runs TO service_role;
GRANT ALL ON public.processing_jobs TO service_role;