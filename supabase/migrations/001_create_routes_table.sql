-- Create routes table for storing user route data
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  route_data JSONB NOT NULL,
  pathfinding_options JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routes_is_public ON routes(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_routes_tags ON routes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_routes_name_search ON routes USING GIN(to_tsvector('english', name));

-- Enable Row Level Security
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own routes and public routes
CREATE POLICY "Users can view own routes and public routes" ON routes
  FOR SELECT USING (
    auth.uid() = user_id OR is_public = TRUE
  );

-- RLS Policy: Users can only insert their own routes
CREATE POLICY "Users can insert own routes" ON routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own routes
CREATE POLICY "Users can update own routes" ON routes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own routes
CREATE POLICY "Users can delete own routes" ON routes
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on route updates
CREATE TRIGGER update_routes_updated_at 
  BEFORE UPDATE ON routes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();