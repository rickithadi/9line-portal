import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Globe, Lock, Mail, Eye, EyeOff, LogOut, Plus, Activity, Shield, Zap, Loader, X } from 'lucide-react';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Profile {
  id: string;
  email: string;
  name: string;
  company: string | null;
}

interface Website {
  id: string;
  domain: string;
  status: 'online' | 'offline' | 'warning';
  uptime: number;
  avg_load_time: number;
  last_check: string;
  lcp?: number;
  fid?: number;
  cls?: number;
  ssl_valid?: boolean;
  vulnerabilities?: number;
  last_scan?: string;
  monitoring_locations?: Array<{ location: string; frequency: string }>;
}

const NineLinePortal = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  
  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [newWebsiteDomain, setNewWebsiteDomain] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setWebsites([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile
  const loadProfile = async (userId: string) => {
    console.log('Loading profile for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      // If profile doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        console.log('Profile not found, attempting to create one...');
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: session.session.user.email,
              name: session.session.user.user_metadata?.name || session.session.user.email,
              company: session.session.user.user_metadata?.company || null,
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating profile:', createError);
            setError(`Failed to create user profile: ${createError.message}`);
          } else {
            console.log('Profile created successfully:', newProfile);
            setProfile(newProfile);
            loadWebsites(userId);
          }
        }
      } else {
        setError(`Failed to load profile: ${error.message}`);
      }
    } else {
      console.log('Profile loaded successfully:', data);
      setProfile(data);
      loadWebsites(userId);
    }
  };

  // Load user websites with all related data
  const loadWebsites = async (userId: string) => {
    console.log('Loading websites for user:', userId);
    setLoading(true);
    
    // Try to get websites using the view first, fallback to direct table access
    let websiteData;
    let websiteError;
    
    // First try the optimized view
    const viewResult = await supabase
      .from('website_stats')
      .select('*')
      .eq('user_id', userId);
    
    if (viewResult.error && viewResult.error.code === '42P01') {
      console.log('website_stats view not found, using direct table access...');
      // View doesn't exist, use direct table access
      const { data: directData, error: directError } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', userId);
      
      websiteData = directData;
      websiteError = directError;
    } else {
      websiteData = viewResult.data;
      websiteError = viewResult.error;
    }

    if (websiteError) {
      console.error('Error loading websites:', websiteError);
      setError(`Failed to load websites: ${websiteError.message}`);
      setLoading(false);
      return;
    }

    console.log('Websites loaded successfully:', websiteData);

    // Get monitoring locations for all websites
    const websiteIds = websiteData?.map(w => w.id) || [];
    let locationsData: any[] = [];
    
    if (websiteIds.length > 0) {
      const { data } = await supabase
        .from('monitoring_locations')
        .select('*')
        .in('website_id', websiteIds);
      locationsData = data || [];
    }

    // Combine the data
    const websitesWithLocations = websiteData?.map(site => ({
      id: site.id,
      domain: site.domain,
      status: site.status as 'online' | 'offline' | 'warning',
      uptime: parseFloat(site.uptime),
      avg_load_time: parseFloat(site.avg_load_time),
      last_check: site.last_check,
      lcp: site.lcp ? parseFloat(site.lcp) : undefined,
      fid: site.fid ? parseFloat(site.fid) : undefined,
      cls: site.cls ? parseFloat(site.cls) : undefined,
      ssl_valid: site.ssl_valid,
      vulnerabilities: site.vulnerabilities || 0,
      last_scan: site.last_scan,
      monitoring_locations: locationsData?.filter(loc => loc.website_id === site.id) || []
    })) || [];

    setWebsites(websitesWithLocations);
    setLoading(false);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      setError(error.message);
    }
    setAuthLoading(false);
  };

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    if (!signupEmail || !signupPassword || !signupName) {
      setError('Please fill in all required fields');
      setAuthLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: {
          name: signupName,
          company: signupCompany || null,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created successfully! You can now login.');
      setShowLogin(true);
      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
      setSignupCompany('');
    }
    setAuthLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoginEmail('');
    setLoginPassword('');
  };

  // Add new website
  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      console.log('Starting website addition process...');
      
      if (!session?.user?.id) {
        setError('User not authenticated');
        setAuthLoading(false);
        return;
      }

      if (!newWebsiteDomain.trim()) {
        setError('Please enter a domain name');
        setAuthLoading(false);
        return;
      }

      console.log('Inserting website:', { user_id: session.user.id, domain: newWebsiteDomain });
      
      // Insert website
      const { data: websiteData, error: websiteError } = await supabase
        .from('websites')
        .insert({
          user_id: session.user.id,
          domain: newWebsiteDomain,
          status: 'online',
          uptime: 100,
          avg_load_time: 0,
        })
        .select()
        .single();

      if (websiteError) {
        console.error('Website insert error:', websiteError);
        setError(`Failed to add website: ${websiteError.message}`);
        setAuthLoading(false);
        return;
      }

      console.log('Website inserted successfully:', websiteData);

      // Insert initial performance metrics
      console.log('Inserting performance metrics...');
      const { error: perfError } = await supabase.from('performance_metrics').insert({
        website_id: websiteData.id,
        lcp: 2.1,
        fid: 50,
        cls: 0.05,
      });

      if (perfError) {
        console.error('Performance metrics error:', perfError);
        setError(`Failed to add performance metrics: ${perfError.message}`);
        setAuthLoading(false);
        return;
      }

      // Insert security metrics
      console.log('Inserting security metrics...');
      const { error: secError } = await supabase.from('security_metrics').insert({
        website_id: websiteData.id,
        ssl_valid: true,
        vulnerabilities: 0,
      });

      if (secError) {
        console.error('Security metrics error:', secError);
        setError(`Failed to add security metrics: ${secError.message}`);
        setAuthLoading(false);
        return;
      }

      // Insert default monitoring locations
      console.log('Inserting monitoring locations...');
      const defaultLocations = [
        { location: 'US-East', frequency: '1 minute' },
        { location: 'US-West', frequency: '1 minute' },
        { location: 'EU-West', frequency: '1 minute' },
        { location: 'Asia-Pacific', frequency: '1 minute' },
      ];

      const { error: locError } = await supabase.from('monitoring_locations').insert(
        defaultLocations.map(loc => ({
          website_id: websiteData.id,
          ...loc,
        }))
      );

      if (locError) {
        console.error('Monitoring locations error:', locError);
        setError(`Failed to add monitoring locations: ${locError.message}`);
        setAuthLoading(false);
        return;
      }

      console.log('Website addition completed successfully!');
      setNewWebsiteDomain('');
      setShowAddWebsite(false);
      setSuccess('Website added successfully!');
      loadWebsites(session.user.id);
      setAuthLoading(false);
    } catch (error) {
      console.error('Unexpected error in handleAddWebsite:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setAuthLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'status-online' : status === 'warning' ? 'status-warning' : 'status-offline';
  };

  const getPerformanceScore = (lcp?: number, fid?: number, cls?: number) => {
    if (!lcp || !fid || !cls) return 0;
    
    let score = 100;
    if (lcp > 2.5) score -= 30;
    else if (lcp > 1.8) score -= 15;
    
    if (fid > 100) score -= 30;
    else if (fid > 50) score -= 15;
    
    if (cls > 0.1) score -= 30;
    else if (cls > 0.05) score -= 15;
    
    return Math.max(score, 0);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-8 w-8 text-brand mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication screens
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-brand mb-2">Nine-Line.dev</h1>
            <div className="h-px w-24 bg-gradient-brand mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Customer Portal</p>
          </div>

          {/* Auth Card */}
          <div className="card p-8 shadow-xl">
            {/* Toggle between Login and Signup */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => {
                  setShowLogin(true);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  showLogin
                    ? 'text-brand border-b-2 border-brand'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowLogin(false);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  !showLogin
                    ? 'text-brand border-b-2 border-brand'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            {showLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="you@company.com"
                      required
                      disabled={authLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="••••••••"
                      required
                      disabled={authLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading && <Loader className="animate-spin" size={16} />}
                  {authLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="input w-full"
                    placeholder="John Doe"
                    required
                    disabled={authLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="input w-full pl-10 pr-4"
                      placeholder="you@company.com"
                      required
                      disabled={authLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={signupCompany}
                    onChange={(e) => setSignupCompany(e.target.value)}
                    className="input w-full"
                    placeholder="Acme Inc."
                    disabled={authLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="input w-full pl-10 pr-10"
                      placeholder="••••••••"
                      required
                      disabled={authLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading && <Loader className="animate-spin" size={16} />}
                  {authLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-light text-brand">Nine-Line.dev</h1>
                <div className="text-xs text-gray-500">Customer Portal</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{profile?.name}</div>
                <div className="text-xs text-gray-500">{profile?.company || profile?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
            <button onClick={() => setSuccess('')} className="ml-auto text-green-700 hover:text-green-900">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Sites</div>
              <Globe className="text-gray-400" size={20} />
            </div>
            <div className="text-3xl font-light text-brand">{websites.length}</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Avg Uptime</div>
              <Activity className="text-green-600" size={20} />
            </div>
            <div className="text-3xl font-light text-brand">
              {websites.length > 0
                ? (websites.reduce((acc, site) => acc + site.uptime, 0) / websites.length).toFixed(2)
                : '0.00'}%
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Avg Load Time</div>
              <Zap className="text-blue-600" size={20} />
            </div>
            <div className="text-3xl font-light text-brand">
              {websites.length > 0
                ? (websites.reduce((acc, site) => acc + site.avg_load_time, 0) / websites.length).toFixed(1)
                : '0.0'}s
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Security Issues</div>
              <Shield className="text-orange-600" size={20} />
            </div>
            <div className="text-3xl font-light text-brand">
              {websites.reduce((acc, site) => acc + (site.vulnerabilities || 0), 0)}
            </div>
          </div>
        </div>

        {/* Websites List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Monitored Websites</h2>
            <button 
              onClick={() => setShowAddWebsite(true)}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>Add Website</span>
            </button>
          </div>

          {websites.length === 0 ? (
            <div className="p-12 text-center">
              <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No websites yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first website to monitor</p>
              <button 
                onClick={() => setShowAddWebsite(true)}
                className="btn-primary inline-flex items-center space-x-2 text-sm"
              >
                <Plus size={16} />
                <span>Add Your First Website</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {websites.map((website) => (
                <div
                  key={website.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedWebsite(selectedWebsite?.id === website.id ? null : website)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(website.status)}`}></div>
                        <h3 className="text-lg font-medium text-gray-900">{website.domain}</h3>
                        <span className="text-xs text-gray-500">{formatTimeAgo(website.last_check)}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Uptime</div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{website.uptime}%</span>
                            {website.uptime >= 99.9 ? (
                              <TrendingUp className="text-green-500" size={14} />
                            ) : (
                              <TrendingDown className="text-red-500" size={14} />
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Load Time</div>
                          <div className="text-sm font-medium text-gray-900">{website.avg_load_time}s</div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Performance Score</div>
                          <div className="text-sm font-medium text-gray-900">
                            {getPerformanceScore(website.lcp, website.fid, website.cls)}/100
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-500 mb-1">Security</div>
                          <div className="flex items-center space-x-2">
                            {website.ssl_valid && <CheckCircle className="text-green-500" size={14} />}
                            <span className="text-sm font-medium text-gray-900">
                              {website.vulnerabilities === 0 ? 'Secure' : `${website.vulnerabilities} issue(s)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedWebsite?.id === website.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-8">
                            {/* Performance Metrics */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">Core Web Vitals</h4>
                              <div className="space-y-3">
                                {website.lcp && (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-600">LCP (Largest Contentful Paint)</span>
                                      <span className="font-medium">{website.lcp}s</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          website.lcp <= 2.5 ? 'bg-green-500' : 'bg-orange-500'
                                        }`}
                                        style={{ width: `${Math.min((website.lcp / 4) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                {website.fid && (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-600">FID (First Input Delay)</span>
                                      <span className="font-medium">{website.fid}ms</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          website.fid <= 100 ? 'bg-green-500' : 'bg-orange-500'
                                        }`}
                                        style={{ width: `${Math.min((website.fid / 300) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                {website.cls && (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-600">CLS (Cumulative Layout Shift)</span>
                                      <span className="font-medium">{website.cls}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          website.cls <= 0.1 ? 'bg-green-500' : 'bg-orange-500'
                                        }`}
                                        style={{ width: `${Math.min((website.cls / 0.25) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Security Status */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">Security Status</h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">SSL Certificate</span>
                                  <span className="flex items-center space-x-1">
                                    {website.ssl_valid ? (
                                      <>
                                        <CheckCircle size={14} className="text-green-500" />
                                        <span className="text-xs font-medium text-green-700">Valid</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle size={14} className="text-red-500" />
                                        <span className="text-xs font-medium text-red-700">Invalid</span>
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Vulnerabilities</span>
                                  <span className="text-xs font-medium text-gray-900">
                                    {website.vulnerabilities}
                                  </span>
                                </div>

                                {website.last_scan && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600">Last Scan</span>
                                    <span className="text-xs font-medium text-gray-900">
                                      {formatTimeAgo(website.last_scan)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Monitoring Info */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-4">Monitoring</h4>
                              <div className="space-y-3">
                                {website.monitoring_locations && website.monitoring_locations.length > 0 && (
                                  <>
                                    <div>
                                      <span className="text-xs text-gray-600 block mb-2">Check Frequency</span>
                                      <span className="text-xs font-medium text-gray-900">
                                        Every {website.monitoring_locations[0].frequency}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-xs text-gray-600 block mb-2">
                                        Locations ({website.monitoring_locations.length})
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {website.monitoring_locations.map((loc, idx) => (
                                          <span
                                            key={idx}
                                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                                          >
                                            {loc.location}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Website Modal */}
      {showAddWebsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Website</h3>
              <button
                onClick={() => {
                  setShowAddWebsite(false);
                  setNewWebsiteDomain('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleAddWebsite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={newWebsiteDomain}
                  onChange={(e) => setNewWebsiteDomain(e.target.value)}
                  className="input w-full"
                  placeholder="example.com"
                  required
                  disabled={authLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Enter without http:// or https://</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddWebsite(false);
                    setNewWebsiteDomain('');
                    setError('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={authLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {authLoading && <Loader className="animate-spin" size={16} />}
                  {authLoading ? 'Adding...' : 'Add Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NineLinePortal;
