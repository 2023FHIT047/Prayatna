export type UserRole = 'admin' | 'community' | 'volunteer' | 'resource_manager' | 'coordinator';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  city: string;
  full_name?: string;
  avatar_url?: string;
  assigned_center_id?: string; 
  phone_number?: string;
  is_approved: boolean; // Verification flag
  is_online: boolean;    // Presence flag
  // Role Specifics
  emergency_contact?: string; // For Community
  specialization?: string;    // For Volunteer
  organization?: string;      // For Resource Manager
  department?: string;        // For Coordinator
  // Vetting & Vitals
  id_type?: 'Aadhaar' | 'Voter ID' | 'Passport' | 'PAN Card' | 'Driving License';
  id_number?: string;
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  experience_years?: number;
  bio?: string;
}

export interface ResourceCenter {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  manager_id?: string;
  type: 'medical' | 'food' | 'general' | 'shelter';
}

export type IncidentStatus = 'reported' | 'verifying' | 'active' | 'resolved' | 'dismissed';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type VolunteerTaskStatus = 'pending' | 'in_progress' | 'completed';
export type FeedbackStatus = 'none' | 'pending' | 'contacted' | 'completed';

export interface FieldReport {
  id: string;
  volunteer_id: string;
  volunteer_name: string;
  text: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  city: string;
  reporter_id: string;
  reporter_name?: string;
  reporter_phone?: string;
  created_at: string;
  image_url?: string;
  address?: string;
  verified?: boolean;
  assigned_volunteers?: string[]; 
  assigned_centers?: string[];    
  volunteer_tasks?: Record<string, VolunteerTaskStatus>; 
  field_reports?: FieldReport[];
  feedback_status?: FeedbackStatus;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  status: 'available' | 'deployed' | 'maintenance';
  center_id: string; 
  city: string;
  latitude: number;
  longitude: number;
}

export type DispatchStatus = 'preparing' | 'transit' | 'delivered';

export interface Dispatch {
  id: string;
  resource_id: string;
  incident_id: string;
  center_id: string;
  resource_name: string;
  incident_title: string;
  quantity: number;
  unit: string;
  status: DispatchStatus;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  profile_id: string;
  full_name: string;
  city: string;
  status: 'active' | 'inactive' | 'on_mission' | 'distress';
  skills: string[];
  availability: boolean;
  latitude?: number;
  longitude?: number;
  last_seen?: string;
}

export interface Notification {
  id: string;
  created_at: string;
  title: string;
  message: string;
  type: 'hazard' | 'logistics' | 'success' | 'info';
  sector?: string;
  priority?: string;
}