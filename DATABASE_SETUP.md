# Nine-Line Portal - Quick Database Setup

## Step 1: Run SQL Schema in Supabase

1. Go to: https://supabase.com/dashboard/project/qredqlzgqxirxndpixhz/editor
2. Click "New Query"
3. Copy and paste the SQL from `supabase-schema.sql`
4. Click "Run" or press Ctrl/Cmd + Enter

## What This Creates

### Tables
✅ **profiles** - User account information
✅ **websites** - Monitored websites  
✅ **performance_metrics** - Core Web Vitals (LCP, FID, CLS)
✅ **security_metrics** - SSL certificates, vulnerabilities
✅ **monitoring_locations** - Global monitoring points

### Security
✅ Row Level Security (RLS) on all tables
✅ Users can only access their own data
✅ Automatic profile creation on signup
✅ Timestamp triggers for updated_at fields

### Views
✅ **website_stats** - Optimized view combining all website data

## Step 2: Verify Setup

After running the SQL, verify in Supabase:

1. Go to Table Editor
2. You should see these tables:
   - profiles
   - websites
   - performance_metrics
   - security_metrics
   - monitoring_locations

3. Click on each table and verify RLS is enabled (shield icon)

## Step 3: Test the Portal

Run your application:
```bash
npm install
npm run dev
```

Then:
1. ✅ Sign up with a test account
2. ✅ Login with your credentials
3. ✅ Add a website (e.g., "example.com")
4. ✅ View the website details
5. ✅ Check that data persists after logout/login

## Troubleshooting

**Error: "relation does not exist"**
- You forgot to run the SQL schema
- Go back to Step 1

**Error: "new row violates row-level security policy"**
- RLS policies weren't created properly
- Re-run the entire SQL schema

**Can't sign up**
- Check Authentication → Providers in Supabase
- Make sure Email is enabled

**Emails not sending**
- Default: Uses Supabase's email service (limited)
- Production: Configure SMTP in Authentication → Email

## Sample Data (Optional)

If you want to test with sample data, run this after the main schema:

```sql
-- Insert a test user (use this email/password to login)
-- Email: test@nine-line.dev
-- Password: test123456

-- Note: You'll need to sign up through the app first,
-- then you can manually insert websites for testing
```

## Next Steps

Once your database is set up:

1. ✅ Test authentication flows
2. ✅ Add your first website
3. ✅ Customize the portal (branding, colors)
4. ✅ Deploy to production
5. ✅ Set up monitoring integrations

## Production Checklist

Before going live:

- [ ] Enable email verification in Supabase Auth
- [ ] Set up custom SMTP for emails
- [ ] Configure password reset flow
- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Set up backups in Supabase
- [ ] Configure rate limiting
- [ ] Add monitoring for the portal itself
- [ ] Set up staging environment
- [ ] Load test with expected user volume

## Database Maintenance

### Backup Strategy
- Supabase automatically backs up daily
- Export important data regularly
- Consider point-in-time recovery setup

### Performance Monitoring
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Cleanup Old Data (Optional)
```sql
-- Delete performance metrics older than 90 days
DELETE FROM performance_metrics 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum tables to reclaim space
VACUUM ANALYZE performance_metrics;
```

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Nine-Line Portal Issues: Check application logs

---

**Ready to launch!** 🚀
