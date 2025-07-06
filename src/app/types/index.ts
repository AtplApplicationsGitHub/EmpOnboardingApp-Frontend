// Type definitions for the application

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'group_lead';
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  primary_group_lead_id?: number;
  escalation_group_lead_id?: number;
  primary_group_lead_name?: string;
  escalation_group_lead_name?: string;
  question_count?: number;
  pending_tasks_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  group_id: number;
  question_text: string;
  response_type: 'yes_no' | 'text';
  compliance_day: number;
  created_at: string;
  updated_at: string;
  levels: string[]; // 'L1', 'L2', 'L3', or 'L4'
}

export interface Task {
  id: number;
  question_id: number;
  mock_employee_id: string;
  mock_employee_name: string;
  mock_employee_level: string; // 'L1', 'L2', 'L3', or 'L4'
  // Additional employee fields from Excel template
  mock_employee_doj?: string; // Date of Joining
  mock_employee_department?: string; // Department
  mock_employee_role?: string; // Role
  mock_employee_total_experience?: number; // Total Experience in years
  mock_employee_past_organization?: string; // Past Organization
  mock_employee_lab_allocation?: string; // Lab Allocation
  mock_employee_compliance_day?: number; // Compliance Day
  assignee_id: number;
  escalation_user_id: number;
  status: 'pending' | 'completed' | 'reassigned';
  response?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  question: string;
  response_type: 'yes_no' | 'text';
  compliance_day: number;
  assignee_name: string;
  escalation_user_name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Employee {
  employee_id: string;
  employee_name: string;
  employee_level: 'L1' | 'L2' | 'L3' | 'L4';
  group_id?: number; // Optional since employees are assigned to all groups
  // Additional fields from Excel template
  doj?: string;
  department?: string;
  role?: string;
  total_experience?: string;
  past_organization?: string;
  lab_allocation?: string;
  compliance_day?: string;
}

export interface QueueEmployee {
  candidate_name: string;
  doj: string;
  department: string;
  role: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  total_experience: number;
  past_organization: string;
  lab_allocation: string;
  compliance_day: number;
}

export interface ImportedEmployee {
  employee_id: string;
  employee_name: string;
  employee_level: string;
  doj?: string;
  department?: string;
  role?: string;
  total_experience?: string;
  past_organization?: string;
  lab_allocation?: string;
  compliance_day?: string;
}

export interface ProcessedEmployee {
  employee_id: string;
  employee_name: string;
  employee_level: string;
  doj?: string;
  department?: string;
  role?: string;
  total_experience?: string;
  past_organization?: string;
  lab_allocation?: string;
  compliance_day?: string;
  tasks_created: number;
  groups_assigned: number;
  group_details: {
    group_name: string;
    tasks_created: number;
    primary_group_lead: string;
    escalation_group_lead?: string;
  }[];
  message?: string;
}

export interface EmployeeProcessingResponse {
  message: string;
  total_tasks_created: number;
  processed_employees: ProcessedEmployee[];
  created_tasks: Task[];
  errors?: string[];
}

export interface EmployeeImportResponse {
  message: string;
  total_tasks_created: number;
  processed_employees: ProcessedEmployee[];
  created_tasks: Task[];
  errors?: string[];
}

export interface ApiError {
  message: string;
}
