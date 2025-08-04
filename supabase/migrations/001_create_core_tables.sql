-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create themes table
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    monetization_score INTEGER CHECK (monetization_score >= 0 AND monetization_score <= 100),
    market_size BIGINT,
    competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high')),
    technical_difficulty VARCHAR(20) CHECK (technical_difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_revenue_min INTEGER,
    estimated_revenue_max INTEGER,
    data_sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trend_data table
CREATE TABLE IF NOT EXISTS public.trend_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    search_volume INTEGER,
    growth_rate DECIMAL(5,2),
    geographic_data JSONB DEFAULT '{}'::jsonb,
    demographic_data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitor_analysis table
CREATE TABLE IF NOT EXISTS public.competitor_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    competitor_name VARCHAR(255) NOT NULL,
    competitor_url VARCHAR(500),
    pricing_model VARCHAR(100),
    estimated_revenue INTEGER,
    user_count INTEGER,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_alerts table
CREATE TABLE IF NOT EXISTS public.user_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    threshold_value INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_themes_category ON public.themes(category);
CREATE INDEX IF NOT EXISTS idx_themes_monetization_score ON public.themes(monetization_score DESC);
CREATE INDEX IF NOT EXISTS idx_themes_created_at ON public.themes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_themes_competition_level ON public.themes(competition_level);
CREATE INDEX IF NOT EXISTS idx_themes_technical_difficulty ON public.themes(technical_difficulty);

CREATE INDEX IF NOT EXISTS idx_trend_data_theme_id ON public.trend_data(theme_id);
CREATE INDEX IF NOT EXISTS idx_trend_data_source ON public.trend_data(source);
CREATE INDEX IF NOT EXISTS idx_trend_data_timestamp ON public.trend_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trend_data_search_volume ON public.trend_data(search_volume DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_analysis_theme_id ON public.competitor_analysis(theme_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_estimated_revenue ON public.competitor_analysis(estimated_revenue DESC);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_theme_id ON public.user_alerts(theme_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_is_active ON public.user_alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_themes_category_score ON public.themes(category, monetization_score DESC);
CREATE INDEX IF NOT EXISTS idx_trend_data_theme_timestamp ON public.trend_data(theme_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_active ON public.user_alerts(user_id, is_active);