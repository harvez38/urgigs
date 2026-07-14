export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'business' | 'worker';
  full_name: string;
  phone: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string; // FK -> users.id
  company_name: string;
  industry: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  verified: boolean;
  created_at: string;
}

export interface WorkerProfile {
  id: string;
  user_id: string; // FK -> users.id
  skills_tags: string[];
  hourly_rate_min: number;
  hourly_rate_max: number;
  availability: 'full_time' | 'part_time' | 'flexible';
  experience_years: number;
  bio: string;
  rating: number;
  gigs_completed: number;
  created_at: string;
}

export type ShiftStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'paid' | 'cancelled';

export interface Shift {
  id: string;
  business_id: string; // FK -> business_profiles.id
  posted_by: string; // FK -> users.id
  worker_id: string | null; // FK -> users.id (assigned worker)
  title: string;
  description: string;
  category: string;
  hourly_rate: number;
  start_time: string;
  end_time: string;
  location: string;
  city: string;
  state: string;
  slots_total: number;
  slots_filled: number;
  status: ShiftStatus;
  requirements: string[];
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
}
export interface Notification {
  id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
