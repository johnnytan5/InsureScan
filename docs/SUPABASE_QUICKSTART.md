# Quick Start: Supabase Setup

## 🚀 TL;DR - What You Need to Do

### 1. Run SQL Schema in Supabase (2 minutes)

1. Open your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project: `nkdequnbswxtzqdoosps`
3. Click "SQL Editor" in the left sidebar
4. Click "+ New query"
5. Copy ALL contents from `supabase-schema.sql` (in project root)
6. Paste into the SQL editor
7. Click "Run" button

✅ This creates all database tables, indexes, and security policies.

### 2. Get Your Supabase Credentials (1 minute)

1. In Supabase Dashboard, click the gear icon ⚙️ (Project Settings)
2. Click "Database" from the left menu
3. Scroll to "Connection string"
4. Click "Direct connection" tab
5. Copy the connection string (looks like this):
   ```
   postgresql://postgres.nkdequnbswxtzqdoosps:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. Also go to Project Settings > API and copy:
   - Project URL: `https://nkdequnbswxtzqdoosps.supabase.co`
   - `anon` / `public` key

### 3. Update Your Backend .env File (1 minute)

Edit `backend/.env` and add/update these lines:

```env
# Supabase Database Configuration
SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres.nkdequnbswxtzqdoosps
SUPABASE_DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
SUPABASE_DB_SSLMODE=require

# Supabase Project Details
SUPABASE_PROJECT_REF=nkdequnbswxtzqdoosps
SUPABASE_URL=https://nkdequnbswxtzqdoosps.supabase.co
SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY_HERE
```

### 4. Test the Connection (30 seconds)

```powershell
# Start the backend
cd backend
make dev

# In another terminal, test it:
curl http://localhost:8000/health
curl http://localhost:8000/claims/
```

---

## 📋 What Changed

### Files Modified:

- ✅ `backend/lib/database.py` - Now connects to Supabase
- ✅ `backend/.env.example` - Updated with Supabase variables

### Files Created:

- ✅ `supabase-schema.sql` - SQL to run in Supabase
- ✅ `SUPABASE_MIGRATION.md` - Detailed migration guide
- ✅ `SUPABASE_QUICKSTART.md` - This file

### Documentation Updated:

- ✅ `README.md` - Mentions Supabase
- ✅ `DEPLOYMENT.md` - Updated with Supabase setup

---

## 🔍 Troubleshooting

### "Connection refused" or "Authentication failed"

- Check your password in `backend/.env`
- Make sure user is: `postgres.nkdequnbswxtzqdoosps` (not just `postgres`)

### "SSL connection required"

- Make sure `SUPABASE_DB_SSLMODE=require` is in your `.env`

### "Table does not exist"

- You forgot to run the SQL schema! Go back to Step 1.

### "Permission denied" when inserting data

- Check Row Level Security (RLS) policies in Supabase Dashboard
- Table Editor > Select table > RLS tab

---

## 📚 Need More Details?

See [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for:

- Data migration from existing database
- Security best practices
- Advanced configuration
- Rollback instructions

---

## ✨ Benefits of Supabase

- ☁️ No need to manage PostgreSQL locally
- 🔒 Built-in authentication and security
- 📊 Real-time database subscriptions
- 🎨 Beautiful admin dashboard
- 💾 Automatic backups
- 🆓 Generous free tier
