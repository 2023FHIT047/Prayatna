
import { supabase } from '../integrations/supabase/client';

// Define DEV_ID_MAP locally as it's missing from AuthContext but required for strategic test account provisioning.
/**
 * DEV_ID_MAP: Fixed UUIDs for strategic test accounts in the development environment.
 */
export const DEV_ID_MAP = {
  admin: '00000000-0000-0000-0000-000000000001',
  volunteer: '00000000-0000-0000-0000-000000000002',
  coordinator: '00000000-0000-0000-0000-000000000003',
  resource_manager: '00000000-0000-0000-0000-000000000004',
  community: '00000000-0000-0000-0000-000000000005',
};

/**
 * CrisisLink Authority Promotion Utility
 */
export const promoteToAdmin = async (userId: string, email: string) => {
  console.log("Initiating High-Level Authority Promotion...");
  try {
    const { error } = await (supabase.from('profiles') as any).upsert({
      id: userId,
      email: email,
      role: 'admin',
      city: 'Mumbai',
      full_name: 'System Override Admin',
      phone_number: '+91 00000 00000',
      is_approved: true, // Admins must be approved
      department: 'STRATEGIC_OVERRIDE'
    });

    if (error) throw error;
    alert("AUTHORITY GRANTED: Your account has been promoted to Strategic Admin. Please refresh the page.");
    window.location.reload();
  } catch (err: any) {
    console.error("Promotion failed:", err);
    alert(`PROMOTION FAILED: ${err.message}`);
  }
};

/**
 * Manual Debrief Deployment Helper
 */
export const deployTestReview = async (review: { full_name: string, role: string, content: string, rating: number, is_verified: boolean, incident_id?: string | null }) => {
  try {
    const { error } = await supabase.from('reviews').insert([review]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Debrief archival failed:", err);
    return false;
  }
};

/**
 * Provisions test identities and operational volunteer records
 */
export const provisionTestUsers = async () => {
  console.log("Provisioning Strategic Test Identities...");
  try {
    const testProfiles = [
      { id: DEV_ID_MAP.admin, email: 'admin@crisislink.in', role: 'admin', full_name: 'Master Admin', city: 'Mumbai', department: 'COMMAND', is_approved: true },
      { id: DEV_ID_MAP.volunteer, email: 'volunteer@crisislink.in', role: 'volunteer', full_name: 'Arjun Volunteer', city: 'Mumbai', specialization: 'Search & Rescue', is_approved: true },
      { id: DEV_ID_MAP.coordinator, email: 'coordinator@crisislink.in', role: 'coordinator', full_name: 'Priya Coordinator', city: 'Delhi', department: 'Crisis Ops', is_approved: true },
      { id: DEV_ID_MAP.resource_manager, email: 'manager@crisislink.in', role: 'resource_manager', full_name: 'Rahul Logistics', city: 'Bengaluru', organization: 'Regional Supply Depot', is_approved: true },
      { id: DEV_ID_MAP.community, email: 'resident@crisislink.in', role: 'community', full_name: 'Aditi Resident', city: 'Mumbai', emergency_contact: '9999999999', is_approved: true },
    ];

    const { error: pError } = await (supabase.from('profiles') as any).upsert(testProfiles);
    if (pError) throw pError;

    // Critically: Provision the volunteer into the operational table
    const volunteerRecord = {
      profile_id: DEV_ID_MAP.volunteer,
      full_name: 'Arjun Volunteer',
      city: 'Mumbai',
      status: 'active',
      skills: ['Search & Rescue', 'First Aid'],
      availability: true,
      latitude: 19.0760, // Mumbai Center approx
      longitude: 72.8777
    };
    
    await (supabase.from('volunteers') as any).upsert([volunteerRecord], { onConflict: 'profile_id' });

    alert("TACTICAL PROVISIONING COMPLETE: Mumbai Volunteer Arjun is now active.");
  } catch (err: any) {
    console.error("Provisioning failed:", err);
    alert(`PROVISIONING ERROR: ${err.message}`);
  }
};

/**
 * Seeds the project with initial data including tactical personnel
 */
export const seedProjectData = async () => {
  console.log("Commencing Strategic Re-Deployment...");

  try {
    // 1. DELETE IN CORRECT ORDER
    await (supabase.from('resources').delete() as any).neq('id', 'placeholder');
    await (supabase.from('volunteers').delete() as any).neq('id', 'placeholder');
    await (supabase.from('incidents').delete() as any).neq('id', 'placeholder');
    await (supabase.from('resource_centers').delete() as any).neq('id', 'placeholder');
    await (supabase.from('reviews').delete() as any).neq('id', 'placeholder');

    // 2. Seed Centers
    const centers = [
      { id: 'center-mumbai-001', name: 'Mumbai West Medical Depot', city: 'Mumbai', address: 'Bandra West Hub', latitude: 19.0596, longitude: 72.8295, type: 'medical' },
      { id: 'center-delhi-001', name: 'Delhi North Food Relief', city: 'Delhi', address: 'Rohini Sector 11', latitude: 28.7144, longitude: 77.1158, type: 'food' },
      { id: 'center-blr-001', name: 'Bengaluru IT-Crisis Cell', city: 'Bengaluru', address: 'Electronic City Phase 1', latitude: 12.8448, longitude: 77.6632, type: 'general' }
    ];
    await (supabase.from('resource_centers') as any).upsert(centers);

    // 3. Seed Resources
    const resources = [
      { id: 'res-001', name: 'Oxygen Concentrators', type: 'Medical', quantity: 45, unit: 'Units', status: 'available', center_id: 'center-mumbai-001', city: 'Mumbai', latitude: 19.0596, longitude: 72.8295 },
      { id: 'res-003', name: 'Dry Rations (Bulk)', type: 'Food', quantity: 1200, unit: 'KG', status: 'available', center_id: 'center-delhi-001', city: 'Delhi', latitude: 28.7144, longitude: 77.1158 }
    ];
    await (supabase.from('resources') as any).upsert(resources);

    // 4. Seed Tactical Incidents
    const incidents = [
      { 
        title: 'Monsoon Flood Alert', 
        description: 'Rising water levels in Mithi River.', 
        severity: 'high', 
        latitude: 19.0728, 
        longitude: 72.8826, 
        city: 'Mumbai', 
        status: 'active',
        verified: true
      }
    ];
    await (supabase.from('incidents') as any).upsert(incidents);

    // 5. Seed an extra "Global" volunteer for visibility
    await (supabase.from('volunteers') as any).insert([
      { 
        full_name: 'Sector Unit 7', 
        city: 'Mumbai', 
        status: 'active', 
        skills: ['Logistics'], 
        availability: true,
        latitude: 19.1000,
        longitude: 72.9000
      }
    ]);

    alert("STRATEGIC DEPLOYMENT SUCCESSFUL: Mumbai Sector Initialized.");
  } catch (err: any) {
    console.error("Deployment failed:", err);
  }
};
