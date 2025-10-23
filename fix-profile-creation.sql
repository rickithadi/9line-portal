-- Fix profile creation issue
-- This ensures profiles are created properly and fixes foreign key constraints

-- First, let's make sure the trigger function exists and is correct
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

-- Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add a policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to manually create missing profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
begin
  -- Insert profiles for any auth.users that don't have profiles
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

-- Verify profiles exist
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as auth_user_count FROM auth.users;