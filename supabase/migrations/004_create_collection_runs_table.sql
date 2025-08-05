-- Create collection_runs table to track data collection executions
CREATE TABLE IF NOT EXISTS collection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sources TEXT[] NOT NULL,
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_collection_runs_user_id ON collection_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_runs_completed_at ON collection_runs(completed_at);
CREATE INDEX IF NOT EXISTS idx_collection_runs_sources ON collection_runs USING GIN(sources);

-- Enable RLS
ALTER TABLE collection_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own collection runs" ON collection_runs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collection runs" ON collection_runs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON collection_runs TO authenticated;
GRANT USAGE ON SEQUENCE collection_runs_id_seq TO authenticated;