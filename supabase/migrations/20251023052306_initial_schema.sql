-- Nine-Line.dev Database Schema for Supabase

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text not null,
  company text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Websites table
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

-- Enable RLS on websites
alter table websites enable row level security;

-- Websites policies
create policy "Users can view their own websites"
  on websites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own websites"
  on websites for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own websites"
  on websites for update
  using (auth.uid() = user_id);

create policy "Users can delete their own websites"
  on websites for delete
  using (auth.uid() = user_id);

-- Performance metrics table
create table performance_metrics (
  id uuid default uuid_generate_v4() primary key,
  website_id uuid references websites(id) on delete cascade not null,
  lcp numeric(5,2) not null, -- Largest Contentful Paint (seconds)
  fid numeric(5,2) not null, -- First Input Delay (milliseconds)
  cls numeric(5,3) not null, -- Cumulative Layout Shift
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on performance_metrics
alter table performance_metrics enable row level security;

-- Performance metrics policies
create policy "Users can view performance metrics for their websites"
  on performance_metrics for select
  using (
    exists (
      select 1 from websites
      where websites.id = performance_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

create policy "Users can insert performance metrics for their websites"
  on performance_metrics for insert
  with check (
    exists (
      select 1 from websites
      where websites.id = performance_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

-- Security metrics table
create table security_metrics (
  id uuid default uuid_generate_v4() primary key,
  website_id uuid references websites(id) on delete cascade not null unique,
  ssl_valid boolean default false,
  vulnerabilities integer default 0,
  last_scan timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on security_metrics
alter table security_metrics enable row level security;

-- Security metrics policies
create policy "Users can view security metrics for their websites"
  on security_metrics for select
  using (
    exists (
      select 1 from websites
      where websites.id = security_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

create policy "Users can insert security metrics for their websites"
  on security_metrics for insert
  with check (
    exists (
      select 1 from websites
      where websites.id = security_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

create policy "Users can update security metrics for their websites"
  on security_metrics for update
  using (
    exists (
      select 1 from websites
      where websites.id = security_metrics.website_id
      and websites.user_id = auth.uid()
    )
  );

-- Monitoring locations table
create table monitoring_locations (
  id uuid default uuid_generate_v4() primary key,
  website_id uuid references websites(id) on delete cascade not null,
  location text not null,
  frequency text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on monitoring_locations
alter table monitoring_locations enable row level security;

-- Monitoring locations policies
create policy "Users can view monitoring locations for their websites"
  on monitoring_locations for select
  using (
    exists (
      select 1 from websites
      where websites.id = monitoring_locations.website_id
      and websites.user_id = auth.uid()
    )
  );

create policy "Users can insert monitoring locations for their websites"
  on monitoring_locations for insert
  with check (
    exists (
      select 1 from websites
      where websites.id = monitoring_locations.website_id
      and websites.user_id = auth.uid()
    )
  );

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

-- Trigger to create profile on signup
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

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_websites_updated_at before update on websites
  for each row execute procedure update_updated_at_column();

create trigger update_security_metrics_updated_at before update on security_metrics
  for each row execute procedure update_updated_at_column();

-- Indexes for better performance
create index websites_user_id_idx on websites(user_id);
create index performance_metrics_website_id_idx on performance_metrics(website_id);
create index performance_metrics_timestamp_idx on performance_metrics(timestamp desc);
create index security_metrics_website_id_idx on security_metrics(website_id);
create index monitoring_locations_website_id_idx on monitoring_locations(website_id);

-- View for website statistics
create or replace view website_stats as
select 
  w.id,
  w.user_id,
  w.domain,
  w.status,
  w.uptime,
  w.avg_load_time,
  w.last_check,
  pm.lcp,
  pm.fid,
  pm.cls,
  sm.ssl_valid,
  sm.vulnerabilities,
  sm.last_scan,
  (
    select count(*)
    from monitoring_locations ml
    where ml.website_id = w.id
  ) as monitoring_location_count
from websites w
left join lateral (
  select lcp, fid, cls
  from performance_metrics
  where website_id = w.id
  order by timestamp desc
  limit 1
) pm on true
left join security_metrics sm on sm.website_id = w.id;

-- Grant access to the view
grant select on website_stats to authenticated;
