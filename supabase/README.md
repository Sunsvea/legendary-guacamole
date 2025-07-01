# Supabase Database Setup

This directory contains SQL migrations and setup instructions for the Alpine Route Optimizer Supabase database.

## Quick Setup

### 1. Database Deployment

Execute these SQL migrations in your Supabase SQL Editor:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/hvwohdkcjcaooebsahjj
2. **Navigate to**: SQL Editor
3. **Execute migrations in order**:
   - `migrations/001_create_routes_table.sql`
   - `migrations/002_create_user_preferences_table.sql`

### 2. Verify Setup

After running migrations, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('routes', 'user_preferences');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('routes', 'user_preferences');

-- Check policies exist
SELECT policyname, tablename FROM pg_policies 
WHERE schemaname = 'public';
```

## Database Schema

### Routes Table
```sql
CREATE TABLE routes (
  id TEXT PRIMARY KEY,                    -- Route identifier
  user_id UUID REFERENCES auth.users,    -- Route owner
  name TEXT NOT NULL,                     -- Route name
  route_data JSONB NOT NULL,              -- Complete route object
  pathfinding_options JSONB NOT NULL,     -- Algorithm settings
  is_public BOOLEAN DEFAULT FALSE,        -- Public visibility
  tags TEXT[] DEFAULT '{}',               -- Route tags
  created_at TIMESTAMPTZ DEFAULT NOW(),   -- Creation timestamp
  updated_at TIMESTAMPTZ DEFAULT NOW()    -- Last update timestamp
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  default_pathfinding_options JSONB NOT NULL,
  favorite_regions JSONB DEFAULT '[]',
  difficulty_preference TEXT DEFAULT 'moderate',
  trail_preference TEXT DEFAULT 'trails_preferred',
  units TEXT DEFAULT 'metric',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS)

### Routes Policies
- **SELECT**: Users can view their own routes + all public routes
- **INSERT**: Users can only create routes for themselves  
- **UPDATE**: Users can only update their own routes
- **DELETE**: Users can only delete their own routes

### User Preferences Policies
- **ALL Operations**: Users can only access their own preferences

## Indexes for Performance

### Routes Table
- `idx_routes_user_id` - Fast user route lookups
- `idx_routes_created_at` - Chronological sorting
- `idx_routes_is_public` - Public route filtering
- `idx_routes_tags` - GIN index for tag searches
- `idx_routes_name_search` - Full-text search on route names

### User Preferences Table
- `idx_user_preferences_user_id` - Fast preference lookups

## Automatic Features

### Timestamps
- **Auto-update**: `updated_at` automatically updates on row changes
- **Creation tracking**: `created_at` set on row creation

### User Onboarding
- **Auto-preferences**: Default preferences created when user signs up
- **Sensible defaults**: Moderate difficulty, trails preferred, metric units

## Testing

Run database schema tests:
```bash
npm test -- src/lib/database/__tests__/database-schema.test.ts
```

## Production Considerations

### Backup Strategy
- **Automatic**: Supabase provides automated backups
- **Point-in-time**: Recovery available for paid plans

### Monitoring
- **Query performance**: Monitor via Supabase dashboard
- **RLS policies**: Ensure proper access control

### Scaling
- **Free tier limits**: 500MB database, 50K MAU
- **Indexes**: Optimized for expected query patterns
- **Connection pooling**: Built-in with Supabase

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: Check user authentication state
2. **Permission denied**: Verify RLS policies match application logic  
3. **Migration failures**: Check for existing objects before creating

### Useful Queries

```sql
-- Check current user
SELECT auth.uid();

-- View user's routes
SELECT * FROM routes WHERE user_id = auth.uid();

-- Check RLS policy effectiveness
SELECT * FROM routes; -- Should only show accessible routes
```