-- Create user_usage table for tracking feature usage
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user/feature/month combination
    UNIQUE(user_id, feature, month)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_feature ON user_usage(feature);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_feature_month ON user_usage(user_id, feature, month);

-- Enable RLS on user_usage table
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_usage
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_user_usage(
    p_user_id UUID,
    p_feature VARCHAR(50),
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
    current_month VARCHAR(7);
    new_count INTEGER;
BEGIN
    current_month := to_char(NOW(), 'YYYY-MM');
    
    INSERT INTO user_usage (user_id, feature, month, count)
    VALUES (p_user_id, p_feature, current_month, p_amount)
    ON CONFLICT (user_id, feature, month)
    DO UPDATE SET 
        count = user_usage.count + p_amount,
        updated_at = NOW()
    RETURNING count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage
CREATE OR REPLACE FUNCTION get_user_usage(
    p_user_id UUID,
    p_feature VARCHAR(50)
)
RETURNS INTEGER AS $$
DECLARE
    current_month VARCHAR(7);
    usage_count INTEGER;
BEGIN
    current_month := to_char(NOW(), 'YYYY-MM');
    
    SELECT count INTO usage_count
    FROM user_usage
    WHERE user_id = p_user_id
    AND feature = p_feature
    AND month = current_month;
    
    RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_user_usage(UUID, VARCHAR(50), INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_usage(UUID, VARCHAR(50)) TO authenticated;