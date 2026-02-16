# Supabase Migration Guide

This guide will help you migrate your InsureScan application from a local PostgreSQL database to Supabase.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Your Supabase project reference: `nkdequnbswxtzqdoosps`

## Step 1: Set Up Supabase Database Schema

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project or create a new one

2. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "+ New query"

3. **Run the Schema Script**
   - Open the file `supabase-schema.sql` in your project root
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" to execute

This will create:

- `claims` table
- `documents` table
- `images` table
- `videos` table
- All necessary indexes
- Row Level Security (RLS) policies

## Step 2: Get Your Supabase Connection Details

1. **Navigate to Project Settings**
   - Click the gear icon (⚙️) in the left sidebar
   - Select "Database" from the settings menu

2. **Find Connection Info**
   - Scroll to "Connection string"
   - Select "Direct connection" tab
   - You'll see something like:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
     ```

3. **Note These Values:**
   - **Host**: `aws-0-us-east-1.pooler.supabase.com` (or your region)
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres.nkdequnbswxtzqdoosps`
   - **Password**: Your database password (set during project creation)

4. **Get Your API Keys** (for frontend, if needed)
   - Go to Project Settings > API
   - Copy your `anon` / `public` key
   - Copy your Project URL

## Step 3: Update Backend Environment Variables

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create/Update `.env` file**
   If you don't have a `.env` file, copy from example:

   ```bash
   cp .env.example .env
   ```

3. **Update the following variables in `backend/.env`:**

   ```env
   # Supabase Database Configuration
   SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=postgres
   SUPABASE_DB_USER=postgres.nkdequnbswxtzqdoosps
   SUPABASE_DB_PASSWORD=your_actual_password_here
   SUPABASE_DB_SSLMODE=require

   # Supabase Project Details
   SUPABASE_PROJECT_REF=nkdequnbswxtzqdoosps
   SUPABASE_URL=https://nkdequnbswxtzqdoosps.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

## Step 4: Update Frontend Environment Variables

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Create/Update `.env.local` file**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=https://nkdequnbswxtzqdoosps.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

## Step 5: Test the Connection

1. **Start the backend server**

   ```bash
   cd backend
   make dev
   # or
   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Test the health endpoint**

   ```bash
   curl http://localhost:8000/health
   ```

3. **Test the claims endpoint**

   ```bash
   curl http://localhost:8000/claims/
   ```

   You should get an empty array `[]` if no claims exist yet.

4. **Create a test claim**
   ```bash
   curl -X POST http://localhost:8000/claims/ \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Claim", "status": "pending"}'
   ```

## Step 6: Migrate Existing Data (Optional)

If you have existing data in your local PostgreSQL database that you want to migrate:

### Option 1: Export/Import via CSV

1. **Export from local PostgreSQL**

   ```bash
   psql -h localhost -U postgres -d insurescan -c "\COPY claims TO 'claims.csv' CSV HEADER"
   psql -h localhost -U postgres -d insurescan -c "\COPY documents TO 'documents.csv' CSV HEADER"
   psql -h localhost -U postgres -d insurescan -c "\COPY images TO 'images.csv' CSV HEADER"
   psql -h localhost -U postgres -d insurescan -c "\COPY videos TO 'videos.csv' CSV HEADER"
   ```

2. **Import to Supabase**
   - In Supabase Dashboard, go to "Table Editor"
   - Select each table
   - Click "Insert" > "Import from CSV"
   - Upload your CSV files

### Option 2: Use pg_dump/pg_restore

1. **Export data from local database**

   ```bash
   pg_dump -h localhost -U postgres -d insurescan --data-only --inserts -f data.sql
   ```

2. **Import to Supabase via psql**
   ```bash
   psql "postgresql://postgres.nkdequnbswxtzqdoosps:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres" -f data.sql
   ```

## Step 7: Verify Migration

1. **Check tables in Supabase**
   - Go to "Table Editor" in Supabase Dashboard
   - Verify all tables are created
   - Check that data appears if you migrated any

2. **Test your application**
   - Start both backend and frontend
   - Submit a test claim
   - Verify it appears in Supabase Table Editor

## Troubleshooting

### Connection Errors

**Error: SSL connection required**

- Make sure `SUPABASE_DB_SSLMODE=require` is set in your `.env`

**Error: Authentication failed**

- Double-check your password
- Ensure you're using the correct user format: `postgres.nkdequnbswxtzqdoosps`

**Error: Could not connect to server**

- Check your internet connection
- Verify the host URL matches your Supabase region
- Check if your firewall allows outbound connections on port 5432

### RLS (Row Level Security) Issues

If you get permission errors when querying:

- Go to Authentication > Policies in Supabase Dashboard
- Ensure policies allow the operations you need
- For development, you can temporarily disable RLS (not recommended for production)

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use environment-specific credentials** (dev, staging, prod)
3. **Review RLS policies** before going to production
4. **Set up proper authentication** using Supabase Auth if needed
5. **Use connection pooling** for production (Transaction mode)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [psycopg3 Documentation](https://www.psycopg.org/psycopg3/docs/)

## Rollback Plan

If you need to rollback to local PostgreSQL:

1. Restore `backend/lib/database.py` from git history
2. Update `backend/.env` with local PostgreSQL credentials:
   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=insurescan
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_local_password
   ```
3. Restart the backend server
