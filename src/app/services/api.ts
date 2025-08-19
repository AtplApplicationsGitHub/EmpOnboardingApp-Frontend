import axios from "axios";
import {
  AuthResponse,
  User,
  Group,
  Question,
  Task,
  Employee,
  EmployeeProcessingResponse,
  DropDownDTO,
  PdfDto,
  EmployeeImportResult,
  QueueEmployee,
} from "../types";

// Create axios instance
const api = axios.create({
  // baseURL: 'https://dev.goval.app:2083/api',
  baseURL: "https://employee.onboarding.goval.app:8084/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      // Redirect to login if we're not already there
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth/login")
      ) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/signin", {
      signInId: email,
      password,
    });
    return response.data;
  },
  findById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/user/findById/${id}`);
    return response.data;
  },
};

// Admin Services
export const adminService = {
  // Group Management

  getGroups: async (
    pageNo: number
  ): Promise<{
    commonListDto: Group[];
    totalElements: number;
  }> => {
    const page = pageNo ?? 0;
    const response = await api.post<{
      commonListDto: Group[];
      totalElements: number;
    }>(`/group/findFilteredGroups/${page}`);
    return response.data;
  },
  findGroupById: async (id: number): Promise<Group> => {
    const response = await api.get<Group>(`/group/findById/${id}`);
    return response.data;
  },

  getAllGroupLeads: async (): Promise<DropDownDTO[]> => {
    const response = await api.get<DropDownDTO[]>("/group/loadGL");
    return response.data;
  },
  createGroup: async (data: {
    name: string;
    pgLead?: number;
    egLead?: number;
  }): Promise<Group> => {
    const response = await api.post<Group>("/group/saveGroup", data);
    return response.data;
  },

  updateGroup: async (data: {
    id: number;
    name: string;
    pgLead?: number;
    egLead?: number;
  }): Promise<Group> => {
    const response = await api.post<Group>(`/group/updateGroup`, data);
    return response.data;
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/group/deleteGroup/${id}`);
  },

  // Question Management
  getQuestions: async (
    groupId: number,
    pageNo: number = 0
  ): Promise<{
    commonListDto: Question[];
    totalElements: number;
  }> => {
    // const params = level ? { level } : {};
    const response = await api.post<{
      commonListDto: Question[];
      totalElements: number;
    }>(`/question/findFilteredQuestionByGroup/${pageNo}/${groupId}`);
    return response.data;
  },

  createQuestion: async (data: {
    text: string;
    response: "yes_no" | "text";
    complainceDay: string;
    questionLevel: string[];
    groupId: string;
  }): Promise<Question> => {
    const response = await api.post<Question>(`/question/saveQuestion`, data);
    return response.data;
  },

  updateQuestion: async (data: {
    id?: number;
    text?: string;
    response?: "yes_no" | "text";
    complainceDay?: string;
    questionLevel?: string[];
  }): Promise<Question> => {
    console.log("Updating question with data:", data);
    const response = await api.post<Question>(`/question/updateQuestion`, data);
    return response.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await api.delete(`/question/deleteQuestion/${questionId}`);
  },

  // Task Management
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>("/admin/tasks");
    return response.data;
  },

  createTask: async (data: {
    question_id: number;
    mock_employee_id: string;
    mock_employee_name: string;
    mock_employee_level: string;
    assignee_id: number;
    escalation_user_id: number;
  }): Promise<Task> => {
    const response = await api.post<Task>("/admin/tasks", data);
    return response.data;
  },

  reassignTask: async (taskId: number): Promise<Task> => {
    const response = await api.put<{ message: string; task: Task }>(
      `/admin/tasks/${taskId}/reassign`
    );
    return response.data.task;
  },

  // Dashboard

  getUserCount: async (): Promise<number> => {
    const response = await api.get<number>("/user/countUser");
    return response.data;
  },

  getGroupsCount: async (): Promise<number> => {
    const response = await api.get<number>("/group/countGroup");
    return response.data;
  },

  getQuestionsCount: async (): Promise<number> => {
    const response = await api.get<number>("/question/countQuestions");
    return response.data;
  },

  // New admin reassignment methods
  reassignTaskToUser: async (
    taskId: number,
    assigneeId: number,
    reason: string
  ): Promise<{
    message: string;
    task: Task;
    previous_assignee: string;
    new_assignee: string;
    reason: string;
  }> => {
    const response = await api.put(`/admin/tasks/${taskId}/reassign-to-user`, {
      assignee_id: assigneeId,
      reason: reason,
    });
    return response.data;
  },

  bulkReassignTasksToUser: async (
    taskIds: number[],
    assigneeId: number,
    reason: string
  ): Promise<{
    message: string;
    reassigned_count: number;
    reassigned_tasks: Array<{
      id: number;
      previous_assignee: string;
      employee_name: string;
    }>;
    new_assignee: string;
    reason: string;
  }> => {
    const response = await api.put("/admin/tasks/bulk-reassign-to-user", {
      task_ids: taskIds,
      assignee_id: assigneeId,
      reason: reason,
    });
    return response.data;
  },

  // Group Lead User Management
  getUsers: async (params?: {
    search?: string;
    page?: number;
  }): Promise<{
    commonListDto: User[];
    totalElements: number;
  }> => {
    const search = params?.search ?? "null";
    const page = params?.page ?? 0;
    const response = await api.post<{
      commonListDto: User[];
      totalElements: number;
    }>(`/user/findFilteredPatient/${search}/${page}`);
    return response.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "group_lead";
  }): Promise<User> => {
    const response = await api.post<User>("/user/saveUser", data);
    return response.data;
  },

  updateUser: async (data: {
    id: number;
    name: string;
    role: "admin" | "group_lead";
  }): Promise<User> => {
    const response = await api.post<User>("/user/updateUser", data);
    return response.data;
  },

  findById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/user/findById/${id}`);
    return response.data;
  },

  isEmailExists: async (email: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/user/emailExists/${email}`);
    return response.data;
  },

  getEmployee: async (params?: {
    search?: string;
    page?: number;
  }): Promise<{
    commonListDto: Employee[];
    totalElements: number;
  }> => {
    const search = params?.search ?? "null";
    const page = params?.page ?? 0;
    const response = await api.post<{
      commonListDto: Employee[];
      totalElements: number;
    }>(`/employee/findFilteredEmployee/${search}/${page}`);
    return response.data;
  },

  createEmployee: async (data: {
    name: string;
    date: string;
    department: string;
    role: string;
    level: "L1" | "L2" | "L3" | "L4";
    totalExperience: string;
    labAllocation: string;
    pastOrganization: string;
    complianceDay: string;
  }): Promise<Employee> => {
    const response = await api.post<Employee>("/employee/saveEmployee", data);
    return response.data;
  },

  updateEmployee: async (data: {
    id: number;
    name: string;
    date: string;
    department: string;
    role: string;
    level: "L1" | "L2" | "L3" | "L4";
    totalExperience: string;
    labAllocation: string;
    pastOrganization: string;
    complianceDay: string;
  }): Promise<Employee> => {
    const response = await api.post<Employee>("/employee/updateEmployee", data);
    return response.data;
  },

  findByEmployee: async (id: number): Promise<Employee> => {
    const response = await api.get<Employee>(`/employee/findById/${id}`);
    return response.data;
  },

deleteEmployee: async (id: number): Promise<void> => {
  await api.delete(`/employee/deleteEmployee/${id}`);
},

  excelExportEmployee: async (): Promise<PdfDto> => {
    const response = await api.post<PdfDto>(
      "/employee/generateAddEmployeeExcel",
      {}
    );
    return response.data;
  },

  importEmployees: async (file: File): Promise<EmployeeImportResult> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<EmployeeImportResult>(
      "/employee/importEmployees",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );
    return data;
  },

  processEmployees: async (
    employees: Employee[]
  ): Promise<EmployeeProcessingResponse> => {
    const response = await api.post<EmployeeProcessingResponse>(
      "/admin/process-employees",
      { employees }
    );
    return response.data;
  },

  createTestEmployeeBatch: async (): Promise<EmployeeProcessingResponse> => {
    const response = await api.post<EmployeeProcessingResponse>(
      "/admin/test-employee-batch"
    );
    return response.data;
  },

  createTestEmployeeQueue: async (): Promise<{
    message: string;
    employees: Employee[];
  }> => {
    const response = await api.post<{ message: string; employees: Employee[] }>(
      "/admin/test-employee-queue"
    );
    return response.data;
  },

  processEmployeeQueue: async (
    employees: Employee[]
  ): Promise<EmployeeProcessingResponse> => {
    const response = await api.post<EmployeeProcessingResponse>(
      "/admin/process-employee-queue",
      { employees }
    );
    return response.data;
  },

  clearAllTasks: async (): Promise<{
    message: string;
    deleted_count: number;
  }> => {
    const response = await api.delete<{
      message: string;
      deleted_count: number;
    }>("/admin/clear-tasks");
    return response.data;
  },

  // Excel Template Download and Import
  downloadEmployeeTemplate: async (): Promise<Blob> => {
    const response = await api.get("/admin/employee-template/download", {
      responseType: "blob",
    });
    return response.data;
  },

  importEmployeeTemplate: async (
    file: File
  ): Promise<EmployeeProcessingResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<EmployeeProcessingResponse>(
      "/admin/employee-template/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};

// Task Management
export const taskService = {
  getTask: async (params?: {
    search?: string;
    page?: number;
  }): Promise<{
    commonListDto: Task[];
    totalElements: number;
  }> => {
    const search = params?.search ?? "null";
    const page = params?.page ?? 0;
    const response = await api.post<{
      commonListDto: Task[];
      totalElements: number;
    }>(`/task/findFilteredTask/${search}/${page}`);
    return response.data;
  },

  getTaskById: async ( id?: string ): Promise<Task> => {
    const response = await api.get<Task>(
      `/task/findById/${id}`
    );
    return response.data;
  },
};

// Group Lead Services
export const groupLeadService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>("/group-lead/tasks");
    return response.data;
  },

  completeTask: async (taskId: number, response: string): Promise<Task> => {
    const result = await api.put<{ message: string; task: Task }>(
      `/group-lead/tasks/${taskId}/complete`,
      { response }
    );
    return result.data.task;
  },

  saveTaskResponse: async (taskId: number, response: string): Promise<Task> => {
    const result = await api.put<{ message: string; task: Task }>(
      `/group-lead/tasks/${taskId}/save`,
      { response }
    );
    return result.data.task;
  },

  // User Management for Group Leads
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>("/group-lead/users");
    return response.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> => {
    const response = await api.post<User>("/group-lead/users", data);
    return response.data;
  },

  // Task Reassignment
  getGroupLeaders: async (): Promise<User[]> => {
    const response = await api.get<User[]>("/group-lead/group-leaders");
    return response.data;
  },

  reassignTask: async (
    taskId: number,
    newAssigneeId: number,
    reason?: string
  ): Promise<{
    message: string;
    task: Task;
    previous_assignee_id: number;
    new_assignee: User;
    reason: string;
  }> => {
    const response = await api.put(`/group-lead/tasks/${taskId}/reassign`, {
      new_assignee_id: newAssigneeId,
      reason,
    });
    return response.data;
  },

  bulkReassignTasks: async (
    taskIds: number[],
    newAssigneeId: number,
    reason?: string
  ): Promise<{
    message: string;
    reassigned_count: number;
    new_assignee: User;
    tasks: Task[];
    reason: string;
  }> => {
    const response = await api.put("/group-lead/tasks/bulk-reassign", {
      task_ids: taskIds,
      new_assignee_id: newAssigneeId,
      reason,
    });
    return response.data;
  },
};
