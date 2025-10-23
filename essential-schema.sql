-- Essential schema for Nine-Line Portal
-- Apply this in your Supabase SQL Editor to get website addition working

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    company TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create websites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    status TEXT DEFAULT 'online',
    uptime NUMERIC DEFAULT 100,
    avg_load_time NUMERIC DEFAULT 0,
    last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
    lcp NUMERIC,
    fid NUMERIC,
    cls NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
    ssl_valid BOOLEAN DEFAULT true,
    vulnerabilities INTEGER DEFAULT 0,
    last_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitoring_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.monitoring_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    frequency TEXT DEFAULT '1 minute',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Websites policies
DROP POLICY IF EXISTS "Users can view own websites" ON public.websites;
CREATE POLICY "Users can view own websites" ON public.websites FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own websites" ON public.websites;
CREATE POLICY "Users can insert own websites" ON public.websites FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own websites" ON public.websites;
CREATE POLICY "Users can update own websites" ON public.websites FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own websites" ON public.websites;
CREATE POLICY "Users can delete own websites" ON public.websites FOR DELETE USING (user_id = auth.uid());

-- Performance metrics policies
DROP POLICY IF EXISTS "Users can view own performance metrics" ON public.performance_metrics;
CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics 
FOR SELECT USING (website_id IN (SELECT id FROM public.websites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own performance metrics" ON public.performance_metrics;
CREATE POLICY "Users can insert own performance metrics" ON public.performance_metrics 
FOR INSERT WITH CHECK (website_id IN (SELECT id FROM public.websites WHERE user_id = auth.uid()));

-- Security metrics policies
DROP POLICY IF EXISTS "Users can view own security metrics" ON public.security_metrics;
CREATE POLICY "Users can view own security metrics" ON public.security_metrics 
FOR SELECT USING (website_id IN (SELECT id FROM public.websites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own security metrics" ON public.security_metrics;
CREATE POLICY "Users can insert own security metrics" ON public.security_metrics 
FOR INSERT WITH CHECK (website_id IN (SELECT id FROM public.websites WHERE user_id = auth.uid()));

-- Monitoring locations policies
DROP POLICY IF EXISTS "Users can view own monitoring locations" ON public.monitoring_locations;
CREATE POLICY "Users can view own monitoring locations" ON public.monitoring_locations 
FOR SELECT USING (website_id IN (SELECT id FROM public.websites WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own monitoring locations" ON public.monitoring_locations;
CREATE POLICY "Users can insert own monitoring locations" ON public.monitoring_locations 
FOR INSERT WITH CHECK (website_id IN (SELECT id FROM public.websites WHERE user_id = auth.uid()));

-- Create trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer set search_path = public
AS $$
begin
  INSERT INTO public.profiles (id, email, name, company)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    COALESCE(new.raw_user_meta_data->>'company', null)
  );
  RETURN new;
end;
$$;

-- Create trigger for automatic profile creation on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to create missing profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
begin
  INSERT INTO public.profiles (id, email, name, company)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    COALESCE(au.raw_user_meta_data->>'company', null)
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
end;
$$;

-- Run the function to create any missing profiles
SELECT public.create_missing_profiles();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;