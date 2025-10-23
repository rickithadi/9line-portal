# Nine-Line.dev Customer Portal - Setup Guide

## 🚀 Quick Start

Your Supabase project is already configured! Follow these steps to get your portal running.

### Step 1: Set Up Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qredqlzgqxirxndpixhz
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to execute the SQL

This will create:
- `profiles` table (user information)
- `websites` table (monitored websites)
- `performance_metrics` table (Core Web Vitals)
- `security_metrics` table (SSL, vulnerabilities)
- `monitoring_locations` table (monitoring points)
- Row Level Security policies (users can only see their own data)
- Automatic triggers for timestamps and profile creation

### Step 2: Configure Email Authentication

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. (Optional) Configure email templates under **Authentication → Email Templates**
4. (Optional) Set up SMTP for custom email sending

### Step 3: Install Dependencies

```bash
npm install @supabase/supabase-js lucide-react
# or
yarn add @supabase/supabase-js lucide-react
```

### Step 4: Run the Application

The portal is a React component. You can integrate it into your existing app or create a new one:

**Option A: Next.js (Recommended)**

```bash
npx create-next-app@latest nine-line-portal
cd nine-line-portal
```

Copy `nine-line-portal.tsx` to `app/page.tsx` or `pages/index.tsx`

```bash
npm run dev
```

**Option B: Create React App**

```bash
npx create-react-app nine-line-portal
cd nine-line-portal
```

Copy `nine-line-portal.tsx` to `src/App.tsx`

```bash
npm start
```

**Option C: Vite**

```bash
npm create vite@latest nine-line-portal -- --template react-ts
cd nine-line-portal
```

Copy `nine-line-portal.tsx` to `src/App.tsx`

```bash
npm run dev
```

## 📋 Features Implemented

### Authentication
- ✅ Email/Password signup with Supabase Auth
- ✅ Email/Password login
- ✅ Secure session management
- ✅ Automatic profile creation on signup
- ✅ Logout functionality

### Dashboard
- ✅ Overview statistics (total sites, uptime, load time, security issues)
- ✅ Website listing with real-time status
- ✅ Expandable website details

### Website Management
- ✅ Add new websites
- ✅ Automatic initialization of:
  - Performance metrics (LCP, FID, CLS)
  - Security scanning (SSL, vulnerabilities)
  - Monitoring locations (US-East, US-West, EU-West, Asia-Pacific)

### Performance Monitoring
- ✅ Core Web Vitals tracking
- ✅ Performance score calculation
- ✅ Visual progress bars

### Security Monitoring
- ✅ SSL certificate validation
- ✅ Vulnerability tracking
- ✅ Last scan timestamps

### Data Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own data
- ✅ Secure API calls through Supabase client

## 🔒 Security Notes

### Row Level Security (RLS)

All tables have RLS enabled. This means:
- Users can only see/edit/delete their own data
- No user can access another user's websites or metrics
- Database-level security (even if someone bypasses your frontend)

### API Keys

Your anon key is safe to use in the browser because:
- RLS policies protect all data
- Users must be authenticated to access their data
- The anon key only allows operations permitted by RLS policies

## 📊 Database Schema Overview

```
profiles
├── id (uuid, references auth.users)
├── email (text)
├── name (text)
├── company (text, nullable)
└── timestamps

websites
├── id (uuid)
├── user_id (uuid, references profiles)
├── domain (text)
├── status (online/offline/warning)
├── uptime (numeric)
├── avg_load_time (numeric)
└── timestamps

performance_metrics
├── id (uuid)
├── website_id (uuid, references websites)
├── lcp (numeric) - Largest Contentful Paint
├── fid (numeric) - First Input Delay
├── cls (numeric) - Cumulative Layout Shift
└── timestamp

security_metrics
├── id (uuid)
├── website_id (uuid, references websites)
├── ssl_valid (boolean)
├── vulnerabilities (integer)
└── timestamps

monitoring_locations
├── id (uuid)
├── website_id (uuid, references websites)
├── location (text)
└── frequency (text)
```

## 🎨 Customization

### Branding
Update the header section to match your branding:
```tsx
<h1 className="text-2xl font-light text-gray-900">Your Company Name</h1>
```

### Colors
The app uses Tailwind CSS. Update colors by changing class names:
- Primary: `bg-gray-900` → `bg-blue-600`
- Borders: `border-gray-200` → `border-blue-200`

### Default Monitoring Locations
Update in `handleAddWebsite` function:
```tsx
const defaultLocations = [
  { location: 'US-East', frequency: '1 minute' },
  { location: 'EU-West', frequency: '5 minutes' },
  // Add more locations
];
```

## 🔧 Next Steps & Enhancements

### Immediate Improvements
1. **Email Verification**: Enable in Supabase Auth settings
2. **Password Reset**: Add forgot password flow
3. **Profile Editing**: Allow users to update their profile

### Feature Additions
1. **Real Monitoring**: Integrate with actual monitoring services
2. **Webhooks**: Set up alerts (email, SMS, Slack)
3. **Historical Data**: Add charts for performance over time
4. **Team Management**: Add multi-user support per account
5. **Billing Integration**: Add Stripe for subscriptions

### Monitoring Integration Ideas
```typescript
// Example: Integrate with Pingdom, UptimeRobot, or build custom
async function updateWebsiteMetrics(websiteId: string) {
  // Fetch real data from monitoring service
  const metrics = await fetchRealMetrics(domain);
  
  // Update database
  await supabase
    .from('performance_metrics')
    .insert({
      website_id: websiteId,
      lcp: metrics.lcp,
      fid: metrics.fid,
      cls: metrics.cls
    });
}
```

## 📱 Deployment

### Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Environment Variables
If you want to use environment variables instead of hardcoded keys:

1. Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://qredqlzgqxirxndpixhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

2. Update `nine-line-portal.tsx`:
```tsx
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## 🐛 Troubleshooting

### "relation does not exist" error
- Make sure you ran the SQL schema in Step 1
- Check that all tables were created in the Supabase Table Editor

### Authentication not working
- Verify email provider is enabled in Supabase Auth settings
- Check browser console for specific error messages
- Ensure Supabase URL and keys are correct

### Can't see websites after adding them
- Check RLS policies are set up correctly
- Verify user is authenticated
- Check browser console and Network tab for errors

### Performance
- Add database indexes (already included in schema)
- Consider pagination for large numbers of websites
- Cache frequently accessed data

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React + Supabase Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

## 🆘 Support

For issues with:
- **Supabase**: Check their [Discord](https://discord.supabase.com)
- **Application**: Review the code comments and error messages
- **Database**: Use Supabase Table Editor to inspect data

## ✅ Testing Checklist

- [ ] Database schema created successfully
- [ ] Can sign up new account
- [ ] Receive email confirmation (if enabled)
- [ ] Can log in with credentials
- [ ] Dashboard loads with stats
- [ ] Can add new website
- [ ] Website appears in list
- [ ] Can expand website details
- [ ] Performance metrics display correctly
- [ ] Can log out
- [ ] Can log back in
- [ ] Data persists across sessions

---

**Built with Nine-Line.dev** 🚀
Intelligence-driven Website Optimization
