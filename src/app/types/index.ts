// Type definitions for the application

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "group_lead" | "employee";
  createdTime?: string;
  updatedTime?: string;
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
  quesCount?: number;
  deleteFlag?: boolean;
  autoAssign?: string;
}

export interface Employee {
  id: number;
  name: string;
  date: string;
  departmentId: number;
  labId: number;
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
  deleteFlag?: boolean;
  group?: string;
  archiveFlag?: boolean;
}

export interface EmployeeImportResult {
  successCount: number;
  errorCount: number;
  errors?: Array<string | { row?: number; message?: string }>;
}

export interface Lab {
  id: string;
  departmentId: number,
  location: string;
  lab: string[];
  createdTime: string;
  updatedTime: string;
}

export interface Department {
  id: string;
  location: string;
  lab?: string;
  createdTime: string;
  updatedTime: string;
};


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

export interface EmployeeFeedback {
  id: string;
  feedback: string;
  star: number;
  taskId: string;
  completed: boolean;
}

export interface Question {
  id: number;
  text: string;
  response: "yes_no" | "text";
  complainceDay: string;
  questionLevel: string[];
  questionDepartment: string[];
  period: string;
  groupId: number;
  createdTime: string;
  updatedTime: string;
  defaultFlag?: "yes" | "no";
  deleteFlag?: boolean;
  verifiedBy?: string;
  verifiedByEmail?: string;
  verifiedById?: number;
}

export interface GLDashboard {
  totalEmployees: number;
  totalPendingTasks: number;
  totalCompletedTasks: number;
  overdueTasks: number;
  totalTasks: number;
  totalVerifications: number;
  completedVerificationCount: number;
  pendingVerificationCount: number;
  overdueVerificationCount: number;
}

export interface AdminDashboardCount {
  total: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  groupName:string;
  groupHead:string;
  groupData: AdminDashboardCount[];
}

export interface Task {
  id: number;
  employeeId: number;
  employeeName: string;
  level: string;
  department: string;
  role: string;
  lab: string;
  groupName: string;
  groupId?: number;
  pastExperience: string;
  prevCompany: string;
  complianceDay: string;
  assignedTo: string;
  totalQuestions: number;
  completedQuestions: number;
  status: string;
  doj: string;
  freezeTask: string;
  questionList: TaskQuestions[];
  questionText?: string;
  response?: string;
  efstar?: string;
  feedback?: string;
  createdTime: string;
  updatedTime: string;
  answer?: "yes" | "no"
  assignedFreezeTask?: boolean;
  departmentId?: number;

  // Additional fields that might come from API
  // mock_employee_id?: string;
  // mock_employee_name?: string;
  // mock_employee_level?: string;
  // completed_at?: string;
}

export interface EmployeeQuestions {
  id: number;
  question: string;
  responseType: string;
  response: string;
  completedFlag: boolean;
  freezeFlag: boolean;

}

export interface TaskQuestions {
  id: number;
  questionId: string;
  response: string;
  responseType: "yes_no" | "text";
  status: string;
  complianceDay: string;
  overDueFlag: boolean;
  comments: string;
  groupName: string;
  createdTime: string;
  answer: string;
  verifiedBy: string;
  verificationStatus: string;
}

export interface TaskProjection {
  employeeId: string;
  name: string;
  department: string;
  role: string;
  level: string;
  taskIds: string;
  totalQuetions: number;
  completedQuetions: number;
  pendingQuetions: number;
  status: string;
  freeze: string;
  doj: string;
  lab: string;
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
  group_id?: number;
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

export interface PdfDto {
  pdf: string;
  fileName: string;
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

// Filter interfaces for employee task filtering
export interface EmployeeTaskFilter {
  status?: string;
  department?: string;
  role?: string;
  lab?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  groupId?: number;
}

export interface EmployeeTaskResponse {
  commonListDto: {
    content: TaskProjection[];
  };
  totalElements: number;
  totalPages?: number;
  currentPage?: number;
}

export interface MultiSelectDropDownDTO {
  id: number;
  itemName: string;
}

export interface AuditSearchRequest {
  fromDate: string;
  toDate: string;
  selectedEvent: string[];
  selectedModule: string[];
  selectedUser: string[];
  userId: number;
}

export interface AuditRecord {
  loginUserId: number;
  loginUserName: string;
  event: string;
  ipAddress: string;
  createdTime: string;
  fromDate: string;
  toDate: string;
  systemRemarks: string;
  userRemarks: string;
  module: string;
  moduleId: string;
}

export interface LdapResponse {
  successUsers: User[];
  message?: string;
}

export interface OnboardingPipelineDTO {
  id: number;
  employeeName: string;
  employeeEmail: string;
  department: string;
  level: string;
  currentStage: string;
  groupsPending: string;
  nextSLADue: string;
  overallStatus: string;
  owner: string;
}

export interface Questionnaire {
  id: string;
  question: string;
  responseType: string;
  levels: string[];
  createdDate?: string;
  updatedTime?: string;
};

export interface TaskStepperUser {
  userName: string;
  status: string;
  totalQuestions: number;
  completedQuestions: number;
  lastUpdatedTime:string;
}

export interface TaskStepperGroup {
  groupName: string;
  users: TaskStepperUser[];
}