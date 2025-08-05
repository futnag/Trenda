-- Create score_history table for tracking monetization score changes over time
CREATE TABLE IF NOT EXISTS score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    factors JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_score_history_theme_id ON score_history(theme_id);
CREATE INDEX IF NOT EXISTS idx_score_history_created_at ON score_history(created_at);
CREATE INDEX IF NOT EXISTS idx_score_history_theme_created ON score_history(theme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_score ON score_history(score);

-- Create composite index for trend analysis queries
CREATE INDEX IF NOT EXISTS idx_score_history_trend_analysis ON score_history(theme_id, created_at DESC, score);

-- Add RLS (Row Level Security) policies
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all score history (public data)
CREATE POLICY "Allow read access to score history" ON score_history
    FOR SELECT USING (true);

-- Policy: Only authenticated users can insert score history (for system operations)
CREATE POLICY "Allow insert for authenticated users" ON score_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only service role can update/delete score history
CREATE POLICY "Allow update for service role" ON score_history
    FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Allow delete for service role" ON score_history
    FOR DELETE USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE score_history IS 'Tracks monetization score changes over time for trend analysis';
COMMENT ON COLUMN score_history.theme_id IS 'Reference to the theme being tracked';
COMMENT ON COLUMN score_history.score IS 'Monetization score value (0-100)';
COMMENT ON COLUMN score_history.factors IS 'JSON object containing the individual factor scores used in calculation';
COMMENT ON COLUMN score_history.metadata IS 'Optional metadata about the score calculation (weights used, data sources, etc.)';
COMMENT ON COLUMN score_history.created_at IS 'Timestamp when the score was calculated and recorded';

-- Create a function to automatically clean up old score history
CREATE OR REPLACE FUNCTION cleanup_old_score_history(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM score_history 
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get score statistics for a theme
CREATE OR REPLACE FUNCTION get_theme_score_stats(theme_uuid UUID)
RETURNS TABLE (
    current_score INTEGER,
    average_score NUMERIC,
    min_score INTEGER,
    max_score INTEGER,
    total_entries BIGINT,
    first_recorded TIMESTAMP WITH TIME ZONE,
    last_recorded TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT score FROM score_history WHERE theme_id = theme_uuid ORDER BY created_at DESC LIMIT 1) as current_score,
        ROUND(AVG(score), 2) as average_score,
        MIN(score) as min_score,
        MAX(score) as max_score,
        COUNT(*) as total_entries,
        MIN(created_at) as first_recorded,
        MAX(created_at) as last_recorded
    FROM score_history 
    WHERE theme_id = theme_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get recent score trend for a theme
CREATE OR REPLACE FUNCTION get_theme_score_trend(theme_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    score INTEGER,
    factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sh.score,
        sh.factors,
        sh.created_at
    FROM score_history sh
    WHERE sh.theme_id = theme_uuid 
        AND sh.created_at >= NOW() - INTERVAL '1 day' * days_back
    ORDER BY sh.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get themes with significant score changes
CREATE OR REPLACE FUNCTION get_themes_with_score_changes(
    threshold_percentage NUMERIC DEFAULT 10.0,
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    theme_id UUID,
    current_score INTEGER,
    previous_score INTEGER,
    change_percentage NUMERIC,
    trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_scores AS (
        SELECT 
            sh.theme_id,
            sh.score,
            sh.created_at,
            ROW_NUMBER() OVER (PARTITION BY sh.theme_id ORDER BY sh.created_at DESC) as rn
        FROM score_history sh
        WHERE sh.created_at >= NOW() - INTERVAL '1 day' * days_back
    ),
    score_changes AS (
        SELECT 
            current.theme_id,
            current.score as current_score,
            previous.score as previous_score,
            CASE 
                WHEN previous.score > 0 THEN 
                    ROUND(((current.score - previous.score)::NUMERIC / previous.score) * 100, 2)
                ELSE 0
            END as change_percentage
        FROM recent_scores current
        LEFT JOIN recent_scores previous ON current.theme_id = previous.theme_id AND previous.rn = 2
        WHERE current.rn = 1 AND previous.score IS NOT NULL
    )
    SELECT 
        sc.theme_id,
        sc.current_score,
        sc.previous_score,
        sc.change_percentage,
        CASE 
            WHEN sc.change_percentage > 0 THEN 'increasing'::TEXT
            ELSE 'decreasing'::TEXT
        END as trend
    FROM score_changes sc
    WHERE ABS(sc.change_percentage) >= threshold_percentage
    ORDER BY ABS(sc.change_percentage) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON score_history TO authenticated;
GRANT INSERT ON score_history TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_score_history(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_theme_score_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_theme_score_trend(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_themes_with_score_changes(NUMERIC, INTEGER) TO authenticated;