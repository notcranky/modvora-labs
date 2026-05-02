# Supabase Setup Guide

## Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose organization, name it "modvora", pick region (US West for you)
5. Wait for database to provision (1-2 minutes)

## Step 2: Run the Schema
1. In Supabase dashboard, go to "SQL Editor" (left sidebar)
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run"

## Step 3: Get API Keys
1. Go to "Project Settings" (gear icon) → "API"
2. Copy these values:
   - `anon public` → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - URL → NEXT_PUBLIC_SUPABASE_URL

## Step 4: Add to .env.local
Add these lines to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 5: Enable Auth (for user accounts)
1. Go to "Authentication" → "Providers"
2. Enable "Email" provider
3. Configure "Site URL" to your domain (or http://localhost:3000 for local)

## Step 6: Deploy
Push to GitHub and deploy to Vercel with the new env vars.

---

## What This Enables
- ✅ Likes, saves, comments sync across ALL devices
- ✅ Users can log in and have their data follow them
- ✅ Anonymous users still work (but data is device-only)
- ✅ Build of the Week stats are accurate across all users

## Migration
Existing localStorage data will be lost when switching to Supabase. 
To migrate: We can write a script, or just start fresh (recommended for now).
