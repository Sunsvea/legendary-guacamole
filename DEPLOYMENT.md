# Deployment Guide

This guide explains how to deploy the Alpine Route Optimizer with proper environment variable configuration.

## Required Environment Variables

Before deploying, you need to configure these environment variables in your hosting platform:

### Mapbox Configuration
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_public_token_here
```
- Get from: https://account.mapbox.com/access-tokens/
- Use a **public token** (starts with `pk.`) - safe for client-side use
- Required for: Interactive maps and route visualization

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
- Get from: Supabase Dashboard → Project Settings → API
- Use the **Project URL** and **anon/public key**
- Required for: User authentication and route persistence

## Deployment Platforms

### Vercel
1. Connect your repository to Vercel
2. Go to Project Settings → Environment Variables
3. Add each variable with the `NEXT_PUBLIC_` prefix
4. Deploy

### Netlify
1. Connect your repository to Netlify
2. Go to Site Settings → Environment Variables
3. Add each variable with the `NEXT_PUBLIC_` prefix
4. Deploy

### Other Platforms
Most modern hosting platforms support environment variables. Look for:
- "Environment Variables" in project settings
- "Build Environment" configuration
- "Config Vars" (Heroku)

## Database Setup

### Supabase Tables
Before first deployment, create the database tables by running the SQL migrations in:
- `src/lib/database/migrations/001_create_routes_table.sql`
- `src/lib/database/migrations/002_create_user_preferences_table.sql`

### Authentication Setup
1. Enable Email authentication in Supabase Dashboard
2. Configure Row Level Security (RLS) policies as defined in the migration files
3. Test authentication in your deployed environment

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL environment variable"
- Ensure environment variables are set in your hosting platform
- Variable names must exactly match (case-sensitive)
- Include the `NEXT_PUBLIC_` prefix
- Redeploy after adding variables

### Authentication Issues
- Verify Supabase URL and anon key are correct
- Check that RLS policies are properly configured
- Ensure email authentication is enabled in Supabase

### Map Loading Issues
- Verify Mapbox token is a public token (starts with `pk.`)
- Check token permissions include necessary scopes
- Ensure token is not expired

## Security Notes

- Never commit `.env.local` to version control
- Only use public/anonymous keys for client-side variables
- Keep service role keys server-side only
- Regularly rotate API keys for security

## Testing Deployment

After deployment, test these features:
1. Route optimization works
2. Map displays correctly
3. User registration/login
4. Route saving functionality
5. Authentication state persistence