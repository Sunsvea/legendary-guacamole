-- Add country column to routes table for efficient country-based filtering
ALTER TABLE routes ADD COLUMN country TEXT;

-- Create index for country filtering performance
CREATE INDEX IF NOT EXISTS idx_routes_country ON routes(country) WHERE country IS NOT NULL;

-- Create partial index for public routes by country (common query pattern)
CREATE INDEX IF NOT EXISTS idx_routes_public_country ON routes(country, created_at DESC) 
  WHERE is_public = TRUE AND country IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN routes.country IS 'Country where the route is located, detected from start coordinates using reverse geocoding';