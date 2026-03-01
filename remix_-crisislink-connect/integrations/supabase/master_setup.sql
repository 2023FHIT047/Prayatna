
-- ======================================================
-- CRISISLINK INDIA: MASTER DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ======================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE EXEC_SQL FUNCTION (Required for Admin Sync Terminal)
CREATE OR REPLACE FUNCTION public.exec_sql(cmd text)
RETURNS void AS $$
BEGIN
    EXECUTE cmd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'community',
    city TEXT DEFAULT 'Mumbai',
    full_name TEXT,
    avatar_url TEXT,
    assigned_center_id UUID,
    phone_number TEXT,
    is_approved BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    emergency_contact TEXT,
    specialization TEXT,
    organization TEXT,
    department TEXT,
    id_type TEXT,
    id_number TEXT,
    blood_group TEXT,
    experience_years INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RESOURCE CENTERS
CREATE TABLE IF NOT EXISTS public.resource_centers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    manager_id UUID REFERENCES public.profiles(id),
    type TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INCIDENTS
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'reported',
    severity TEXT DEFAULT 'medium',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    city TEXT NOT NULL,
    reporter_id UUID REFERENCES auth.users,
    reporter_name TEXT,
    reporter_phone TEXT,
    image_url TEXT,
    address TEXT,
    verified BOOLEAN DEFAULT false,
    feedback_status TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    quantity INTEGER DEFAULT 0,
    unit TEXT,
    status TEXT DEFAULT 'available',
    center_id UUID REFERENCES public.resource_centers(id) ON DELETE CASCADE,
    city TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. VOLUNTEERS
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    city TEXT,
    status TEXT DEFAULT 'active',
    skills TEXT[],
    availability BOOLEAN DEFAULT true,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    last_seen TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT,
    role TEXT,
    content TEXT,
    rating INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. NOTIFICATIONS (EBS)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    sector TEXT,
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. DISPATCHES
CREATE TABLE IF NOT EXISTS public.dispatches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES public.resources(id),
    incident_id UUID REFERENCES public.incidents(id),
    center_id UUID REFERENCES public.resource_centers(id),
    resource_name TEXT,
    incident_title TEXT,
    quantity INTEGER,
    unit TEXT,
    status TEXT DEFAULT 'preparing',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. ROW LEVEL SECURITY (RLS) - UNRESTRICTED FOR PROTOTYPE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow All" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.resource_centers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.incidents FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.resources FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.volunteers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.reviews FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON public.dispatches FOR ALL TO public USING (true) WITH CHECK (true);

-- 12. AUTH TRIGGER FOR PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, city)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Responder'),
    COALESCE(new.raw_user_meta_data->>'role', 'community'),
    COALESCE(new.raw_user_meta_data->>'city', 'Mumbai')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
