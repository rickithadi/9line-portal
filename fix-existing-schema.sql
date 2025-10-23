-- Fix existing database schema - handle existing tables properly
-- This script works with whatever tables already exist

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Check and create profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
        create table profiles (
          id uuid references auth.users on delete cascade not null primary key,
          email text unique not null,
          name text not null,
          company text,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
    END IF;
END $$;

-- Check and create websites table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'websites') THEN
        create table websites (
          id uuid default uuid_generate_v4() primary key,
          user_id uuid references profiles(id) on delete cascade not null,
          domain text not null,
          status text not null default 'online' check (status in ('online', 'offline', 'warning')),
          uptime numeric(5,2) default 100.00,
          avg_load_time numeric(5,2) default 0.00,
          last_check timestamp with time zone default timezone('utc'::text, now()) not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
          unique(user_id, domain)
        );
    END IF;
END $$;

-- Handle performance_metrics table - drop and recreate if it exists with wrong structure
DO $$ 
BEGIN
    -- Check if table exists and has wrong structure
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'performance_metrics') THEN
        -- Check if website_id column exists
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'performance_metrics' 
            AND column_name = 'website_id'
        ) THEN
            -- Table exists but has wrong structure, drop and recreate
            DROP TABLE performance_metrics CASCADE;
        END IF;
    END IF;
    
    -- Create the table if it doesn't exist or was dropped
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'performance_metrics') THEN
        create table performance_metrics (
          id uuid default uuid_generate_v4() primary key,
          website_id uuid references websites(id) on delete cascade not null,
          lcp numeric(5,2) not null,
          fid numeric(5,2) not null,
          cls numeric(5,3) not null,
          timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
    END IF;
END $$;

-- Check and create security_metrics table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'security_metrics') THEN
        create table security_metrics (
          id uuid default uuid_generate_v4() primary key,
          website_id uuid references websites(id) on delete cascade not null unique,
          ssl_valid boolean default false,
          vulnerabilities integer default 0,
          last_scan timestamp with time zone default timezone('utc'::text, now()) not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
    END IF;
END $$;

-- Check and create monitoring_locations table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'monitoring_locations') THEN
        create table monitoring_locations (
          id uuid default uuid_generate_v4() primary key,
          website_id uuid references websites(id) on delete cascade not null,
          location text not null,
          frequency text not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
    END IF;
END $$;

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table websites enable row level security;
alter table performance_metrics enable row level security;
alter table security_metrics enable row level security;
alter table monitoring_locations enable row level security;

-- Drop and recreate all policies to ensure they're correct

-- Profiles policies
drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Websites policies
drop policy if exists "Users can view their own websites" on websites;
create policy "Users can view their own websites"
  on websites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own websites" on websites;
create policy "Users can insert their own websites"
  on websites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own websites" on websites;
create policy "Users can update their own websites"
  on websites for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own websites" on websites;
create policy "Users can delete their own websites"
  on websites for delete
  using (auth.uid() = user_id);

-- Performance metrics policies
drop policy if exists "Users can view performance metrics for their websites" on performance_metrics;
create policy "Users can view performance metrics for their websites"
  on performance_metrics for select
  using (
    exists (
      select 1 from websites
      where websites.id = performance_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert performance metrics for their websites" on performance_metrics;
create policy "Users can insert performance metrics for their websites"
  on performance_metrics for insert
  with check (
    exists (
      select 1 from websites
      where websites.id = performance_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

-- Security metrics policies
drop policy if exists "Users can view security metrics for their websites" on security_metrics;
create policy "Users can view security metrics for their websites"
  on security_metrics for select
  using (
    exists (
      select 1 from websites
      where websites.id = security_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert security metrics for their websites" on security_metrics;
create policy "Users can insert security metrics for their websites"
  on security_metrics for insert
  with check (
    exists (
      select 1 from websites
      where websites.id = security_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update security metrics for their websites" on security_metrics;
create policy "Users can update security metrics for their websites"
  on security_metrics for update
  using (
    exists (
      select 1 from websites
      where websites.id = security_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

-- Monitoring locations policies
drop policy if exists "Users can view monitoring locations for their websites" on monitoring_locations;
create policy "Users can view monitoring locations for their websites"
  on monitoring_locations for select
  using (
    exists (
      select 1 from websites
      where websites.id = monitoring_locations.website_id
      and websites.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert monitoring locations for their websites" on monitoring_locations;
create policy "Users can insert monitoring locations for their websites"
  on monitoring_locations for insert
  with check (
    exists (
      select 1 from websites
      where websites.id = monitoring_locations.website_id
      and websites.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete monitoring locations for their websites" on monitoring_locations;
create policy "Users can delete monitoring locations for their websites"
  on monitoring_locations for delete
  using (
    exists (
      select 1 from websites
      where websites.id = monitoring_locations.website_id
      and websites.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'company', null)
  );
  return new;
end;
$$;

-- Drop existing trigger and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Drop existing triggers and recreate
drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

drop trigger if exists update_websites_updated_at on websites;
create trigger update_websites_updated_at before update on websites
  for each row execute procedure update_updated_at_column();

drop trigger if exists update_security_metrics_updated_at on security_metrics;
create trigger update_security_metrics_updated_at before update on security_metrics
  for each row execute procedure update_updated_at_column();

-- Create indexes for better performance (will be ignored if they exist)
create index if not exists websites_user_id_idx on websites(user_id);
create index if not exists performance_metrics_website_id_idx on performance_metrics(website_id);
create index if not exists performance_metrics_timestamp_idx on performance_metrics(timestamp desc);
create index if not exists security_metrics_website_id_idx on security_metrics(website_id);
create index if not exists monitoring_locations_website_id_idx on monitoring_locations(website_id);