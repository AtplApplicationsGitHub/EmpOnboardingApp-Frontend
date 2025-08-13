// Type definitions for the application

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "group_lead";
  createdTime: string;
  updatedTime: string;
}

export interface DropDownDTO {
  id: number;
  key: string;
  value: string;
}

export interface Group {
  id: number;
  name: string;
  pgLead?: string;
  egLead?: string;
  createdTime: string;
  updatedTime: string;
}

export interface Employee {
  id: number;
  name: string;
  date: string;
  department: string;
  role: string;
  email: string;
  level: "L1" | "L2" | "L3" | "L4";
  totalExperience: string;
  labAllocation: string;
  pastOrganization: string;
  complianceDay: string;
  createdTime: string;
  updatedTime: string;
}
// export interface Group {
//   id: number;
//   name: string;
//   pgLeadId?: number;
//   egLeadId?: number;
//   pgLeadName?: string;
//   egLeadName?: string;
//   question_count?: number;
//   created_at: string;
//   updated_at: string;
// }

export interface Question {
  id: number;
  text: string;
  response: "yes_no" | "text";
  complianceDay: string;
  questionLevel: string[];
  groupId: number;
  createdTime: string;
  updatedTime: string;
}

export interface Task {
  id: number;
  question_id: number;
  mock_employee_id: string;
  mock_employee_name: string;
  mock_employee_level: string; // 'L1', 'L2', 'L3', or 'L4'
  assignee_id: number;
  escalation_user_id: number;
  status: "pending" | "completed" | "reassigned";
  response?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  question: string;
  response_type: "yes_no" | "text";
  compliance_day: number;
  assignee_name: string;
  escalation_user_name: string;
}

export interface AuthResponse {
  accessToken: string;
  userName: string | null;
  userId: number;
  success: boolean;
  message: string;
  loginAttemptCount: number;
  newUser: boolean;
}

export interface Employee {
  employee_id: string;
  employee_name: string;
  employee_level: "L1" | "L2" | "L3" | "L4";
  group_id?: number; // Optional since employees are assigned to all groups
}

export interface QueueEmployee {
  sr_no: number;
  candidate_name: string;
  doj: string;
  department: string;
  role: string;
  level: "L1" | "L2" | "L3" | "L4";
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
