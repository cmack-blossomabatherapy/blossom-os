// Phase 1 mock data for Blossom OS pages.
// Frontend-only — does not touch Supabase. Replace with live queries in Phase 2.

export interface AcademyTrack {
  id: string;
  name: string;
  description: string;
  courseCount: number;
  estimatedHours: number;
  roles: string[];
  department: string;
  completion: number;
  competencies: string[];
}

export interface BlossomCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  required: boolean;
  estimatedMinutes: number;
  status: "Not Started" | "In Progress" | "Completed";
}

export interface BlossomDepartment {
  id: string;
  name: string;
  owner: string;
  description: string;
  memberCount: number;
  trainings: number;
  resources: number;
  systems: string[];
}

export interface BlossomLocation {
  id: string;
  name: string;
  type: "State" | "Clinic";
  state: string;
  address?: string;
  staffCount: number;
  trainings: number;
  compliance: string[];
}

export interface BlossomUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  state: string;
  location: string;
  manager: string;
  status: "Active" | "Inactive" | "On Leave";
  assignedTracks: number;
  assignedCourses: number;
  completedCourses: number;
  certifications: number;
  competencies: number;
  credits: number;
  lastActive: string;
  trainingStatus: "On Track" | "Behind" | "Complete";
}

export interface BlossomReport {
  id: string;
  title: string;
  description: string;
  category: "Training" | "Certification" | "Activity" | "Compliance";
}

export const academyTracks: AcademyTrack[] = [];

export const blossomCourses: BlossomCourse[] = [];

export const blossomDepartments: BlossomDepartment[] = [];

export const blossomLocations: BlossomLocation[] = [];

export const blossomUsers: BlossomUser[] = [];

export const blossomReports: BlossomReport[] = [];
