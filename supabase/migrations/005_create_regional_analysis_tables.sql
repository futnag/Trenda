-- Create regional analysis tables for demographic and geographic data

-- Create localized_opportunities table
CREATE TABLE IF NOT EXISTS public.localized_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    region VARCHAR(3) NOT NULL, -- ISO country code
    theme VARCHAR(255) NOT NULL,
    local_need TEXT NOT NULL,
    market_gap INTEGER CHECK (market_gap >= 0 AND market_gap <= 100),
    cultural_factors JSONB DEFAULT '[]'::jsonb,
    regulatory_considerations JSONB DEFAULT '[]'::jsonb,
    estimated_revenue_min INTEGER DEFAULT 0,
    estimated_revenue_max INTEGER DEFAULT 0,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regional_trends table
CREATE TABLE IF NOT EXISTS public.regional_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(3) NOT NULL, -- ISO country code
    region_name VARCHAR(100) NOT NULL,
    market_potential INTEGER CHECK (market_potential >= 0 AND market_potential <= 100),
    competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
    demographics JSONB DEFAULT '{}'::jsonb,
    total_themes INTEGER DEFAULT 0,
    average_monetization_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create demographic_segments table
CREATE TABLE IF NOT EXISTS public.demographic_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    demographics JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_market_size BIGINT DEFAULT 0,
    average_relevance DECIMAL(5,2) DEFAULT 0,
    theme_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create segment_themes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.segment_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id VARCHAR(100) NOT NULL REFERENCES public.demographic_segments(segment_id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
    market_potential INTEGER CHECK (market_potential >= 0 AND market_potential <= 100),
    competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
    estimated_revenue_min INTEGER DEFAULT 0,
    estimated_revenue_max INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(segment_id, theme_id)
);

-- Create user_filter_states table for saving filter configurations
CREATE TABLE IF NOT EXISTS public.user_filter_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regional_comparisons table for storing comparison results
CREATE TABLE IF NOT EXISTS public.regional_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of country codes
    comparison_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    best_region VARCHAR(3),
    worst_region VARCHAR(3),
    average_market_potential DECIMAL(5,2) DEFAULT 0,
    total_market_size BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours') -- Cache for 24 hours
);

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_localized_opportunities_theme_id ON public.localized_opportunities(theme_id);
CREATE INDEX IF NOT EXISTS idx_localized_opportunities_region ON public.localized_opportunities(region);
CREATE INDEX IF NOT EXISTS idx_localized_opportunities_market_gap ON public.localized_opportunities(market_gap DESC);
CREATE INDEX IF NOT EXISTS idx_localized_opportunities_confidence ON public.localized_opportunities(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_regional_trends_region ON public.regional_trends(region);
CREATE INDEX IF NOT EXISTS idx_regional_trends_market_potential ON public.regional_trends(market_potential DESC);
CREATE INDEX IF NOT EXISTS idx_regional_trends_competition_level ON public.regional_trends(competition_level);

CREATE INDEX IF NOT EXISTS idx_demographic_segments_segment_id ON public.demographic_segments(segment_id);
CREATE INDEX IF NOT EXISTS idx_demographic_segments_average_relevance ON public.demographic_segments(average_relevance DESC);
CREATE INDEX IF NOT EXISTS idx_demographic_segments_total_market_size ON public.demographic_segments(total_market_size DESC);

CREATE INDEX IF NOT EXISTS idx_segment_themes_segment_id ON public.segment_themes(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_themes_theme_id ON public.segment_themes(theme_id);
CREATE INDEX IF NOT EXISTS idx_segment_themes_relevance_score ON public.segment_themes(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_segment_themes_market_potential ON public.segment_themes(market_potential DESC);

CREATE INDEX IF NOT EXISTS idx_user_filter_states_user_id ON public.user_filter_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_filter_states_is_default ON public.user_filter_states(is_default);
CREATE INDEX IF NOT EXISTS idx_user_filter_states_is_public ON public.user_filter_states(is_public);
CREATE INDEX IF NOT EXISTS idx_user_filter_states_usage_count ON public.user_filter_states(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_regional_comparisons_expires_at ON public.regional_comparisons(expires_at);
CREATE INDEX IF NOT EXISTS idx_regional_comparisons_regions ON public.regional_comparisons USING GIN(regions);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_localized_opportunities_region_gap ON public.localized_opportunities(region, market_gap DESC);
CREATE INDEX IF NOT EXISTS idx_segment_themes_segment_relevance ON public.segment_themes(segment_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_filter_states_user_default ON public.user_filter_states(user_id, is_default);

-- Add updated_at triggers
CREATE TRIGGER handle_localized_opportunities_updated_at
    BEFORE UPDATE ON public.localized_opportunities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_regional_trends_updated_at
    BEFORE UPDATE ON public.regional_trends
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_demographic_segments_updated_at
    BEFORE UPDATE ON public.demographic_segments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_user_filter_states_updated_at
    BEFORE UPDATE ON public.user_filter_states
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.localized_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demographic_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_filter_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_comparisons ENABLE ROW LEVEL SECURITY;

-- Localized opportunities policies (public read, service role write)
CREATE POLICY "Authenticated users can view localized opportunities" ON public.localized_opportunities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage localized opportunities" ON public.localized_opportunities
    FOR ALL USING (auth.role() = 'service_role');

-- Regional trends policies (public read, service role write)
CREATE POLICY "Authenticated users can view regional trends" ON public.regional_trends
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage regional trends" ON public.regional_trends
    FOR ALL USING (auth.role() = 'service_role');

-- Demographic segments policies (public read, service role write)
CREATE POLICY "Authenticated users can view demographic segments" ON public.demographic_segments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage demographic segments" ON public.demographic_segments
    FOR ALL USING (auth.role() = 'service_role');

-- Segment themes policies (public read, service role write)
CREATE POLICY "Authenticated users can view segment themes" ON public.segment_themes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage segment themes" ON public.segment_themes
    FOR ALL USING (auth.role() = 'service_role');

-- User filter states policies (users manage their own, public ones readable by all)
CREATE POLICY "Users can view own filter states" ON public.user_filter_states
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view public filter states" ON public.user_filter_states
    FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

CREATE POLICY "Users can manage own filter states" ON public.user_filter_states
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Regional comparisons policies (public read, service role write)
CREATE POLICY "Authenticated users can view regional comparisons" ON public.regional_comparisons
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage regional comparisons" ON public.regional_comparisons
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up expired regional comparisons
CREATE OR REPLACE FUNCTION public.cleanup_expired_regional_comparisons()
RETURNS void AS $$
BEGIN
    DELETE FROM public.regional_comparisons 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update demographic segment statistics
CREATE OR REPLACE FUNCTION public.update_demographic_segment_stats(segment_id_param VARCHAR(100))
RETURNS void AS $$
BEGIN
    UPDATE public.demographic_segments 
    SET 
        theme_count = (
            SELECT COUNT(*) 
            FROM public.segment_themes 
            WHERE segment_id = segment_id_param
        ),
        average_relevance = (
            SELECT COALESCE(AVG(relevance_score), 0) 
            FROM public.segment_themes 
            WHERE segment_id = segment_id_param
        ),
        total_market_size = (
            SELECT COALESCE(SUM((estimated_revenue_min + estimated_revenue_max) / 2), 0)
            FROM public.segment_themes 
            WHERE segment_id = segment_id_param
        ),
        updated_at = NOW()
    WHERE segment_id = segment_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to get regional market potential
CREATE OR REPLACE FUNCTION public.get_regional_market_potential(region_code VARCHAR(3))
RETURNS TABLE (
    region VARCHAR(3),
    theme_count INTEGER,
    avg_monetization_score DECIMAL(5,2),
    total_opportunities INTEGER,
    avg_market_gap DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        region_code as region,
        COUNT(DISTINCT t.id)::INTEGER as theme_count,
        COALESCE(AVG(t.monetization_score), 0)::DECIMAL(5,2) as avg_monetization_score,
        COUNT(lo.id)::INTEGER as total_opportunities,
        COALESCE(AVG(lo.market_gap), 0)::DECIMAL(5,2) as avg_market_gap
    FROM public.themes t
    LEFT JOIN public.localized_opportunities lo ON t.id = lo.theme_id AND lo.region = region_code
    LEFT JOIN public.trend_data td ON t.id = td.theme_id 
        AND td.geographic_data ? region_code
    WHERE td.geographic_data ? region_code OR lo.region = region_code;
END;
$$ LANGUAGE plpgsql;