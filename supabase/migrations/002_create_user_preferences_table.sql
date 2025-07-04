-- Create user_preferences table for storing user settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_pathfinding_options JSONB NOT NULL,
  favorite_regions JSONB DEFAULT '[]',
  difficulty_preference TEXT DEFAULT 'moderate' CHECK (difficulty_preference IN ('easy', 'moderate', 'hard', 'extreme')),
  trail_preference TEXT DEFAULT 'trails_preferred' CHECK (trail_preference IN ('roads_only', 'trails_preferred', 'mixed')),
  units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own preferences
CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at on preferences updates
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize default user preferences
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (
    user_id, 
    default_pathfinding_options,
    favorite_regions,
    difficulty_preference,
    trail_preference,
    units
  ) VALUES (
    NEW.id,
    '{
      "maxIterations": 500,
      "offTrailPenalty": 2.0,
      "trailBonus": 0.4,
      "roadBonus": 0.3,
      "maxWaypoints": 50,
      "waypointDistance": 0.01,
      "roadsOnly": false
    }',
    '[]',
    'moderate',
    'trails_preferred',
    'metric'
  );
  RETURN NEW;
END;
$ language 'plpgsql' SECURITY DEFINER;

