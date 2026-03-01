
import { supabase } from '../integrations/supabase/client';

/**
 * STRATEGIC OPERATIONS LIBRARY
 * Centralized SQL command sets for infrastructure management.
 */

export const NUCLEAR_SCRIPTS = {
  PURGE_ALL_USERS: `
    -- 1. Disconnect Field Units
    DELETE FROM public.volunteers;
    DELETE FROM public.incidents;
    DELETE FROM public.reviews;
    
    -- 2. Clear Logistics Hubs
    DELETE FROM public.resources;
    DELETE FROM public.resource_centers;
    
    -- 3. Purge Public Registry
    DELETE FROM public.profiles;
    
    -- 4. THE NUCLEAR CORE: Delete from Auth Registry
    -- (Requires exec_sql with SECURITY DEFINER)
    DELETE FROM auth.users;
  `,
  
  RESET_SCHEMA: `
    -- Re-initializes columns for CrisisLink 2025 specs
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_center_id UUID;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    
    ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS feedback_status TEXT DEFAULT 'pending';
    
    -- Ensure RLS is permissive for prototype
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Global Unrestricted Access" ON public.profiles;
    CREATE POLICY "Global Unrestricted Access" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
  `,

  CLEAN_MESSY_DATA: `
    DELETE FROM public.incidents WHERE title IS NULL OR title = '';
    DELETE FROM public.profiles WHERE full_name = 'Responder' AND role = 'community';
  `
};

export async function executeStrategicCommand(sql: string) {
  try {
    const { error } = await supabase.rpc('exec_sql', { cmd: sql });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Strategic Command Failed:", err);
    return { success: false, error: err.message };
  }
}
