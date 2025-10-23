# Nine-Line.dev Customer Portal

**Intelligence-driven Website Optimization Platform**

A modern, secure customer portal for monitoring website performance, uptime, and security built with React, TypeScript, and Supabase.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Supabase](https://img.shields.io/badge/supabase-integrated-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)

## ✨ Features

### 🔐 Authentication & Security
- Secure email/password authentication via Supabase
- Row Level Security (RLS) - users can only access their own data
- Automatic session management
- Password requirements enforcement

### 📊 Dashboard
- Real-time overview of all monitored websites
- Key metrics at a glance:
  - Total sites monitored
  - Average uptime percentage
  - Average load time
  - Security issues count

### 🌐 Website Monitoring
- Add unlimited websites to monitor
- Track performance metrics:
  - **LCP** (Largest Contentful Paint)
  - **FID** (First Input Delay) 
  - **CLS** (Cumulative Layout Shift)
- Monitor uptime and availability
- Security scanning (SSL, vulnerabilities)
- Multiple geographic monitoring locations

### 📈 Performance Analytics
- Core Web Vitals tracking
- Performance score calculation (0-100)
- Visual progress indicators
- Trend analysis

### 🔒 Security Monitoring
- SSL certificate validation
- Vulnerability tracking
- Security scan timestamps
- Issue alerts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

### 1. Database Setup

```bash
# Go to your Supabase SQL Editor:
# https://supabase.com/dashboard/project/qredqlzgqxirxndpixhz/editor

# Run the supabase-schema.sql file
```

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
nine-line-portal/
├── nine-line-portal.tsx      # Main application component
├── supabase-schema.sql        # Database schema
├── package.json               # Dependencies
├── SETUP.md                   # Detailed setup guide
├── DATABASE_SETUP.md          # Database-specific setup
└── README.md                  # This file
```

## 🔧 Configuration

### Supabase Connection

Your Supabase project is already configured in `nine-line-portal.tsx`:

```typescript
const supabase = createClient(
  'https://qredqlzgqxirxndpixhz.supabase.co',
  'your_anon_key'
);
```

### Environment Variables (Optional)

For production, use environment variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://qredqlzgqxirxndpixhz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 📊 Database Schema

### Core Tables

**profiles**
- User account information
- Automatically created on signup
- Linked to Supabase Auth

**websites**
- Monitored website domains
- Status, uptime, load time
- Linked to user profiles

**performance_metrics**
- Core Web Vitals data
- Timestamped measurements
- Historical tracking

**security_metrics**
- SSL certificate status
- Vulnerability counts
- Scan timestamps

**monitoring_locations**
- Geographic monitoring points
- Check frequencies
- Per-website configuration

See [supabase-schema.sql](supabase-schema.sql) for full schema.

## 🎨 Customization

### Branding

Update the logo and company name:

```tsx
<h1 className="text-2xl font-light text-gray-900">
  Your Company Name
</h1>
```

### Styling

The app uses Tailwind CSS. Customize colors:

```tsx
// Primary color
bg-gray-900 → bg-blue-600

// Borders
border-gray-200 → border-blue-200
```

### Monitoring Locations

Add/remove default monitoring points in `handleAddWebsite`:

```tsx
const defaultLocations = [
  { location: 'US-East', frequency: '1 minute' },
  { location: 'EU-West', frequency: '1 minute' },
  { location: 'Asia-Pacific', frequency: '5 minutes' },
];
```

## 🔐 Security

### Row Level Security (RLS)

All tables use RLS policies:
- Users can only access their own data
- Policies are enforced at the database level
- Even compromised clients can't access other users' data

### Authentication

- Passwords hashed with bcrypt
- JWT tokens for session management
- Automatic token refresh
- Secure cookie storage

### API Keys

The anon key is safe to expose because:
- RLS policies protect all data
- Users must authenticate to access data
- Database enforces all security rules

## 📈 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy
```

### Manual Deployment

```bash
npm run build
# Deploy the 'out' or '.next' directory
```

## 🧪 Testing

### Test Account Flow

1. Sign up: `test@yourdomain.com` / `password123`
2. Add website: `example.com`
3. View metrics and details
4. Logout and login again
5. Verify data persistence

### Database Verification

```sql
-- Check user was created
SELECT * FROM profiles;

-- Check website was added
SELECT * FROM websites;

-- Verify RLS is working
-- (try to query as different user)
```

## 🐛 Troubleshooting

### Common Issues

**"relation does not exist"**
- Run the SQL schema in Supabase

**Authentication fails**
- Check email provider is enabled in Supabase Auth

**Can't see websites**
- Verify RLS policies are set up
- Check browser console for errors

**Slow performance**
- Add database indexes (included in schema)
- Consider pagination for 100+ websites

See [SETUP.md](SETUP.md) for more troubleshooting tips.

## 🛣️ Roadmap

### Planned Features

- [ ] Historical performance charts
- [ ] Email/SMS alerts for downtime
- [ ] Slack integration
- [ ] Team member management
- [ ] API access for programmatic monitoring
- [ ] Mobile app
- [ ] Custom reporting
- [ ] Competitor tracking (from pitch deck)
- [ ] Geographic intelligence dashboard

### Integration Ideas

- Stripe for billing
- Twilio for SMS alerts
- SendGrid for email notifications
- Datadog/New Relic for real monitoring
- Zapier for workflow automation

## 📚 Documentation

- [Setup Guide](SETUP.md) - Complete setup instructions
- [Database Setup](DATABASE_SETUP.md) - Database-specific guide
- [Supabase Docs](https://supabase.com/docs) - Supabase documentation
- [Next.js Docs](https://nextjs.org/docs) - Next.js documentation

## 🤝 Contributing

This is a commercial project for Nine-Line.dev. For internal contributions:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit for review

## 📄 License

Proprietary - Nine-Line.dev © 2024

## 🆘 Support

For support:
- Check documentation in this repository
- Review Supabase docs for database issues
- Check browser console for client errors
- Enable Supabase logging for API issues

## 🎯 Key Metrics

Target performance:
- **Load Time**: < 1 second
- **First Contentful Paint**: < 1.8s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: 95+

Current stats:
- **Tables**: 5 core tables
- **RLS Policies**: 15+ security policies
- **API Calls**: Optimized with views
- **Bundle Size**: < 300KB gzipped

## 🔗 Links

- Production: TBD
- Staging: TBD
- Supabase Project: https://supabase.com/dashboard/project/qredqlzgqxirxndpixhz
- Design System: Tailwind CSS + Lucide Icons

---

**Built with 💙 by Nine-Line.dev**

Intelligence-driven Website Optimization
