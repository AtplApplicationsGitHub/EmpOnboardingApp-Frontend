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
  TaskProjection,
  EmployeeTaskFilter,
  EmployeeTaskResponse,
  EmployeeFeedback,
  EmployeeQuestions,
  MultiSelectDropDownDTO,
  AuditSearchRequest,
  AuditRecord,
  Lab,
  GLDashboard,
} from "../types";
import { group } from "console";

// Re-export types for easier access
export type { EmployeeTaskFilter, EmployeeTaskResponse } from "../types";

// Create axios instance
const api = axios.create({
  // baseURL: 'https://dev.goval.app:2083/api',
  baseURL: "https://emp-onboard.goval.app:8084/api",
  // baseURL: "http://localhost:8084/api",
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
    return Promise.reject(new Error(error.message || "Request failed"));
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
    return Promise.reject(new Error(error.message || "Response failed"));
  }
);

// Authentication Services
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post("/auth/signin", {
        signInId: email,
        password,
      });

      console.log("Login response:", response.data); // Debug log

      // Validate response structure
      if (!response.data) {
        throw new Error("Invalid response from server");
      }

      const data = response.data;

      // Check if login was actually successful
      if (data.success === false) {
        throw new Error(data.message || "Invalid credentials");
      }

      const accessToken = data.accessToken || data.token;
      if (!accessToken) {
        throw new Error("Invalid credentials - no access token received");
      }

      return {
        accessToken: accessToken,
        userName: data.userName,
        userId: data.userId,
        success: data.success || true,
        message: data.message || "Login successful",
        loginAttemptCount: data.loginAttemptCount || 1,
        newUser: data.newUser || false,
      };
    } catch (error: any) {
      console.error("Login error:", error); // Debug log
      if (error.response?.status === 401) {
        throw new Error("Invalid email or password");
      } else if (error.response?.status === 403) {
        throw new Error("Account access denied");
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw error; // Re-throw our custom errors
      } else {
        throw new Error("Login failed. Please check your credentials.");
      }
    }
  },

  checkUserRole: async (
    email: string
  ): Promise<{
    role: "admin" | "group_lead" | "employee";
    exists: boolean;
  }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await api.get(
        `/auth/checkEmpOrAdmin/${normalizedEmail}`
      );
      const userData = response.data;

      let userRole;
      if (typeof userData === "string") {
        userRole = userData;
      } else if (userData?.role) {
        userRole = userData.role;
      }

      if (userRole) {
        return {
          role: userRole.toLowerCase() as "admin" | "group_lead" | "employee",
          exists: true,
        };
      }

      return { role: "employee", exists: false };
    } catch (error: any) {
      console.error("Failed to check user role:", error);
      throw new Error("Unable to verify user. Please try again.");
    }
  },

  sendOtp: async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const normalizedEmail = email.trim();
      const response = await api.get(`/auth/sendMailOTP/${normalizedEmail}`);

      if (response.data === true) {
        return {
          success: true,
          message: "OTP sent successfully to your email",
        };
      } else {
        throw new Error(
          "Unable to send OTP to this email. Please check if the email is registered."
        );
      }
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      throw new Error("Failed to send OTP. Please try again.");
    }
  },

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    try {
      const normalizedEmail = email.trim();
      const normalizedOtp = otp.trim();

      const requestBody = {
        signInId: normalizedEmail,
        password: normalizedOtp,
      };

      const response = await api.post("/auth/employeeSignIn", requestBody);
      const data = response.data;

      if (data?.success && (data.accessToken || data.token)) {
        return {
          accessToken: data.accessToken || data.token,
          userName: data.userName || normalizedEmail.split("@")[0],
          userId: data.userId || data.id,
          success: true,
          message: data.message || "Login successful",
          loginAttemptCount: data.loginAttemptCount || 1,
          newUser: data.newUser || false,
        };
      } else {
        throw new Error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      if (error.response?.status === 401) {
        throw new Error("Invalid or expired OTP");
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Invalid OTP. Please check the code and try again.");
      }
    }
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
    autoAssign?: string;
  }): Promise<Group> => {
    const response = await api.post<Group>("/group/saveGroup", data);
    return response.data;
  },

  cloneGroup: async (group: Group): Promise<boolean> => {
    const response = await api.post<boolean>("/group/cloneGroup", group);
    return response.data;
  },

  updateGroup: async (data: {
    id: number;
    name: string;
    pgLead?: number;
    egLead?: number;
    autoAssign?: string;
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
    const response = await api.post<{
      commonListDto: Question[];
      totalElements: number;
    }>(`/question/findFilteredQuestionByGroup/${pageNo}/${groupId}`);
    return response.data;
  },

  getEmployeeGroup: async (
    level: string,
    id: number
  ): Promise<DropDownDTO[]> => {
    const response = await api.get<DropDownDTO[]>(
      `/question/getGroups/${level}/${id}`
    );
    return response.data;
  },

  createQuestion: async (data: {
    text: string;
    response: "yes_no" | "text";
    complainceDay: string;
    questionLevel: string[];
    questionDepartment: string[];
    groupId: string;
    defaultFlag?: "yes" | "no";
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
    defaultFlag?: "yes" | "no";
  }): Promise<Question> => {
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

  getTaskCount: async (): Promise<number> => {
    const response = await api.get<number>("/task/taskCountForAdmin");
    return response.data;
  },

  // LookUp

  getLab: async (dep: string): Promise<String[]> => {
    const response = await api.get<String[]>(
      `/location/findByDepartment/${dep}`
    );
    return response.data;
  },

  getLookupItems: async (type: string): Promise<DropDownDTO[]> => {
    const response = await api.get<DropDownDTO[]>(
      `/lookup/getCategoryItemByName/${type}`
    );
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

  isEmployeeEmailExists: async (email: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/employee/emailExists/${email}`);
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
    email: string;
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
    email: string;
  }): Promise<Employee> => {
    const response = await api.post<Employee>("/employee/updateEmployee", data);
    return response.data;
  },

  findByEmployee: async (id: number): Promise<Employee> => {
    const response = await api.get<Employee>(`/employee/findById/${id}`);
    return response.data;
  },

  deleteEmployee: async (id: number): Promise<void> => {
    await api.delete(`/employee/deleteEmployeeMappings/${id}`);
  },

  assignGroupsToEmployee: async (params: {
    groupId: number[];
    employeeId: number;
  }): Promise<Employee> => {
    const { groupId, employeeId } = params;
    const response = await api.post<Employee>(
      `/employee/createTaskForEmployee/${employeeId}`,
      groupId
    );
    return response.data;
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

  achiveEmployees: async (id: number): Promise<void> => {
    const response = await api.get<void>(`/employee/archiveEmployee/${id}`);
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
    // ldap users
getLdapUsers: async (emails: string[]): Promise<User[]> => { 
  const response = await api.post<User[]>(
    "/ldap/loadUsersFromAD",
    emails 
  );
  return response.data;
},
  saveLdapUsers: async (users: User[]): Promise<boolean> => {
  const response = await api.post<boolean>(
    "/user/saveUserList",
    users
  );
  return response.data;
},
};

// Lab Services
export const labService = {
  getLabs: async (
    pageNo: number,
    location?: string
  ): Promise<{
    commonListDto: Lab[];
    totalElements: number;
  }> => {
    const page = pageNo ?? 0;
    const searchTerm = location || null;
    const response = await api.post<{
      commonListDto: Lab[];
      totalElements: number;
    }>(`/location/findFilteredLocation/${searchTerm}/${page}`);
    return response.data;
  },

  createLab: async (data: {
    location: string;
    lab: string[];
  }): Promise<boolean> => {
    const response = await api.post<boolean>("/location/saveLocation", {
      location: data.location,
      lab: data.lab,
    });
    return response.data;
  },

  findLabById: async (id: string): Promise<Lab> => {
    const response = await api.get<Lab>(`/location/findById/${id}`);
    return response.data;
  },

  updateLab: async ({ lab, id }: { lab: string[]; id: string }): Promise<void> => {
    const response = await api.post<void>(`/location/labInlineSave/${id}`, {
      lab,
    });
    return response.data;
  },


  getDepartments: async (): Promise<DropDownDTO[]> => {
    const response = await api.get<DropDownDTO[]>(`/location/findAllLocation`);
    return response.data;
  },
};

export const EQuestions = {
  getEmployeeQuestions: async (
    userId: string,
    pageNo: number
  ): Promise<{
    commonListDto: EmployeeQuestions[];
    totalElements: number;
  }> => {
    const page = pageNo ?? 0;
    const response = await api.post<{
      commonListDto: EmployeeQuestions[];
      totalElements: number;
    }>(`/eQuestions/filteredEmployeesQues/${userId}/${page}`);
    return response.data;
  },

  saveResponse: async (id: number, value: string): Promise<boolean> => {
    const response = await api.post<boolean>(
      `/eQuestions/saveEmployeeResponse/${id}/${value}`
    );
    return response.data;
  },

  getQuestionsByTask: async (taskId: string): Promise<EmployeeQuestions[]> => {
    const response = await api.get<EmployeeQuestions[]>(
      `/eQuestions/getByTaskId/${taskId}`
    );
    return response.data;
  },

  getQuestionsByTaskArchId: async (taskId: string): Promise<EmployeeQuestions[]> => {
  const response = await api.get<EmployeeQuestions[]>(
    `/eQuestions/getByTaskArchId/${taskId}`
  );
  return response.data;
},

  getEmployeesWithQuestions: async (): Promise<number[]> => {
    const response = await api.get<number[]>(
      `/eQuestions/employeesWithQuestions`
    );
    return response.data;
  },

  
  getEmployeesArchWithQuestions: async (): Promise<number[]> => {
    const response = await api.get<number[]>(
      `/eQuestions/employeesArchWithQuestions`
    );
    return response.data;
  },
};

export const auditService = {
  getEventByName: async (): Promise<MultiSelectDropDownDTO[]> => {
    const response = await api.get<MultiSelectDropDownDTO[]>(
      `/audit/getEventByName`
    );
    return response.data;
  },

  getModuleByName: async (): Promise<MultiSelectDropDownDTO[]> => {
    const response = await api.get<MultiSelectDropDownDTO[]>(
      `/audit/getModuleByName`
    );
    return response.data;
  },

  getUserByName: async (): Promise<MultiSelectDropDownDTO[]> => {
    const response = await api.get<MultiSelectDropDownDTO[]>(
      `/audit/getUserByName`
    );
    return response.data;
  },

  findFilteredData: async (
    pageNo: number,
    searchParams: AuditSearchRequest
  ): Promise<{
    commonListDto: AuditRecord[];
    totalElements: number;
  }> => {
    const response = await api.post<{
      commonListDto: AuditRecord[];
      totalElements: number;
    }>(`/audit/findFilteredData/${pageNo}`, searchParams);
    return response.data;
  },
};

//Achieve Services
export const archiveService = {
  getArchiveTask: async (params?: {
    search?: string;
    page?: number;
  }): Promise<{
    commonListDto: {
      content: TaskProjection[];
    };
    totalElements: number;
  }> => {
    const search = params?.search ?? "null";
    const page = params?.page ?? 0;
    const response = await api.post<{
      commonListDto: {
        content: TaskProjection[];
      };
      totalElements: number;
    }>(`/task/filteredArchiveTaskForAdmin/${search}/${page}`);
    return response.data;
  },

  getArchiveTaskById: async (id: string): Promise<Task> => {
    const response = await api.get<Task>(`/task/findByArchTaskId/${id}`);
    return response.data;
  },
};
// Task Management
export const taskService = {
  getTask: async (params?: {
    search?: string;
    page?: number;
  }): Promise<{
    commonListDto: {
      content: TaskProjection[];
    };
    totalElements: number;
  }> => {
    const search = params?.search ?? "null";
    const page = params?.page ?? 0;
    const response = await api.post<{
      commonListDto: {
        content: TaskProjection[];
      };
      totalElements: number;
    }>(`/task/filteredTaskForAdmin/${search}/${page}`);
    return response.data;
  },
  getTaskForGL: async (params?: {
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
  getDashboardForGL: async (): Promise<GLDashboard> => {
    const response = await api.get<GLDashboard>(`/task/taskCountForGL`);
    return response.data;
  },

  getTaskById: async (id?: string): Promise<Task[]> => {
    const response = await api.get<Task[]>(`/task/findById/${id}`);
    return response.data;
  },

  reassignTask: async (taskId: string, id: number): Promise<boolean> => {
    const response = await api.get<boolean>(
      `/task/reassignTask/${taskId}/${id}`
    );
    return response.data;
  },

  freezeTask: async (taskId: string): Promise<boolean> => {
    const response = await api.get<boolean>(`/task/freezeTask/${taskId}`);
    return response.data;
  },

  deleteQuestion: async (id: number, remarks: string): Promise<boolean> => {
    const response = await api.delete(`/employee/deleteQues/${id}/${remarks}`);
    return response.data;
  },

  labAllocation: async (
    id: number,
    labAllocation: string
  ): Promise<boolean> => {
    const response = await api.post<boolean>(
      `/employee/labSave/${labAllocation}/${id}`
    );
    return response.data;
  },

  updateResponse: async (id: number, value: string): Promise<boolean> => {
    const response = await api.post<boolean>(
      `/task/taskQuestionAnswer/${id}/${value}`
    );
    return response.data;
  },

  getDateFormat: async (): Promise<string> => {
    try {
      const response = await api.get("/employee/getConstant/DateFormat");
      return response.data as string;
    } catch (error) {
      console.error("Failed to fetch date format:", error);
      // fallback
      return "dd-MM-yyyy";
    }
  },

  // Get tasks assigned to a specific employee
  getTasksByEmployeeId: async (empId: number): Promise<Task[]> => {
    const response = await api.get<Task[]>(`/task/findByEmpId/${empId}`);
    return response.data;
  },
};

// Helper function to convert TaskProjection to Task
const convertTaskProjectionToTask = (taskProjection: TaskProjection): Task => {
  // Defensive programming: Check if taskProjection is valid
  if (!taskProjection || typeof taskProjection !== "object") {
    console.warn(
      "⚠️ convertTaskProjectionToTask: Invalid taskProjection received:",
      taskProjection
    );
    return {
      id: 0,
      employeeName: "",
      employeeId: 0,
      level: "",
      department: "",
      role: "",
      lab: "",
      groupName: "",
      pastExperience: "",
      prevCompany: "",
      complianceDay: "",
      assignedTo: "",
      totalQuestions: 0,
      completedQuestions: 0,
      status: "",
      doj: "",
      questionList: [],
      createdTime: "",
      updatedTime: "",
      freezeTask: "",
    };
  }

  return {
    id: parseInt(taskProjection.taskIds || "0") || 0, // taskIds maps to id
    employeeName: taskProjection.name || "", // name maps to employeeName
    employeeId: parseInt(taskProjection.employeeId || "0") || 0, // Convert string to number
    level: taskProjection.level || "",
    department: taskProjection.department || "",
    role: taskProjection.role || "",
    lab: taskProjection.lab || "",
    groupName: "", // Not available in TaskProjection
    pastExperience: "", // Not available in TaskProjection
    prevCompany: "", // Not available in TaskProjection
    complianceDay: "", // Not available in TaskProjection
    assignedTo: "", // Not available in TaskProjection
    totalQuestions: taskProjection.totalQuetions || 0,
    completedQuestions: taskProjection.completedQuetions || 0,
    status: taskProjection.status || "",
    doj: taskProjection.doj || "",
    questionList: [], // Not available in TaskProjection
    createdTime: "", // Not available in TaskProjection
    updatedTime: "", // Not available in TaskProjection
    freezeTask: taskProjection.freeze || "", // freeze maps to freezeTask
  };
};

// Group Lead Services
export const groupLeadService = {
  getTasks: async (): Promise<Task[]> => {
    // Use the admin task endpoint (temporary until group lead endpoint is deployed)
    const response = await api.post<{
      commonListDto: {
        content: TaskProjection[];
      };
      totalElements: number;
    }>("/task/filteredTaskForAdmin/null/0");

    // Convert TaskProjection[] to Task[] for compatibility
    return response.data.commonListDto.content.map(convertTaskProjectionToTask);
  },

  getTasksPaginated: async (params?: {
    search?: string;
    page?: number;
  }): Promise<{
    commonListDto: {
      content: Task[];
    };
    totalElements: number;
  }> => {
    const search = params?.search ?? "null";
    const page = params?.page ?? 0;
    const response = await api.post<{
      commonListDto: {
        content: TaskProjection[];
      };
      totalElements: number;
    }>(`/task/filteredTaskForAdmin/${search}/${page}`);

    // Convert TaskProjection[] to Task[] for compatibility
    const convertedContent = response.data.commonListDto.content.map(
      convertTaskProjectionToTask
    );

    return {
      commonListDto: {
        content: convertedContent,
      },
      totalElements: response.data.totalElements,
    };
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

// Employee Services
export const employeeService = {
  // Get all questions assigned to the current employee across all groups (FOR DASHBOARD VIEW)
  getAllQuestions: async (): Promise<any[]> => {
    try {
      // Mock data for employee dashboard questions - to be replaced with API when available
      const mockQuestions = [
        {
          id: "dashboard_q1",
          questionText: "Rate this employee's performance in React development",
          questionType: "Text Response",
          status: "pending",
          groupName: "G3 - T082500003 - GL1",
          groupLeaderName: "Group Leader 1",
          groupId: "3",
        },
        {
          id: "dashboard_q2",
          questionText: "Is this employee ready for advanced React concepts?",
          questionType: "Yes/No/N/A Question",
          status: "pending",
          groupName: "G3 - T082500003 - GL1",
          groupLeaderName: "Group Leader 1",
          groupId: "3",
        },
        {
          id: "dashboard_q3",
          questionText: "How would you rate this employee's TypeScript skills?",
          questionType: "Yes/No/N/A Question",
          status: "answered",
          employeeAnswer: "Yes",
          answeredAt: "2025-08-20T10:30:00Z",
          groupName: "G1 - Frontend Development",
          groupLeaderName: "John Smith",
          groupId: "1",
        },
      ];

      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockQuestions;
    } catch (error) {
      console.error("Failed to fetch employee dashboard questions:", error);
      throw new Error("Failed to fetch employee dashboard questions");
    }
  },

  // Get employee's own tasks/questions to answer (FOR MY TASKS PAGE)
  // getMyTasks: async (
  //   pageNo: number = 0
  // ): Promise<{
  //   commonListDto: Task[];
  //   totalElements: number;
  // }> => {
  //   try {
  //     const response = await api.post(
  //       `/task/filteredTaskForEmployee/${pageNo}`
  //     );
  //     if (response.data?.commonListDto) {
  //       return {
  //         commonListDto: response.data.commonListDto,
  //         totalElements: response.data.totalElements || 0,
  //       };
  //     }
  //     return {
  //       commonListDto: [],
  //       totalElements: 0,
  //     };
  //   } catch (error: any) {
  //     console.error("Failed to fetch employee tasks:", error);
  //     throw new Error("Failed to fetch employee tasks. Please try again.");
  //   }
  // },

  getMyTasks: async (
    page?: number
  ): Promise<{
    commonListDto: Task[];
    totalElements: number;
  }> => {
    const response = await api.post<{
      commonListDto: Task[];
      totalElements: number;
    }>(`/task/filteredTaskForEmployee/${page}`);
    return response.data;
  },
  saveFeedBack: async (data: {
    task: string;
    star: string;
    feedback: string;
  }): Promise<boolean> => {
    const response = await api.post<boolean>(
      `/employee/saveFeedBack/${data.star}/${data.feedback}/${data.task}`
    );
    return response.data;
  },

  getFeedBackByTask: async (task: string): Promise<EmployeeFeedback> => {
    const response = await api.get<EmployeeFeedback>(
      `/employee/getEmployeeFeedBack/${task}`
    );
    return response.data;
  },
  // Legacy method for backward compatibility
  getMyTasksSimple: async (): Promise<any[]> => {
    try {
      const result = await employeeService.getMyTasks(0);
      return result.commonListDto;
    } catch (error) {
      console.error("Failed to fetch employee tasks (simple format):", error);
      return [];
    }
  },

  // Submit answer for a task/question
  submitAnswer: async (
    questionId: string,
    answerData: {
      answer: string;
      questionType?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/employee/submitAnswer/${questionId}`, {
        answer: answerData.answer,
        questionType: answerData.questionType || "Text Response",
      });

      return {
        success: true,
        message: response.data?.message || "Answer submitted successfully",
      };
    } catch (error: any) {
      throw new Error("Failed to submit answer. Please try again.");
    }
  },

  // Get all available filter options for employee tasks
  getTaskFilterOptions: async (): Promise<{
    statuses: string[];
    departments: string[];
    roles: string[];
    labs: string[];
  }> => {
    // This would ideally be a separate API endpoint
    // For now, we'll return common options
    return {
      statuses: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
      departments: ["IT", "HR", "Finance", "Operations", "Marketing"],
      roles: ["Developer", "Manager", "Analyst", "Coordinator", "Specialist"],
      labs: ["Lab A", "Lab B", "Lab C", "Remote"],
    };
  },

  // Submit feedback for a group
  submitGroupFeedback: async (
    groupId: string,
    feedback: { rating: number; comment: string }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("🔧 API: submitGroupFeedback called with:", {
        groupId,
        feedback,
      });

      // This would be the actual feedback submission endpoint
      // For now, we'll simulate a successful response
      const response = await api.post("/employee/group-feedback", {
        groupId,
        rating: feedback.rating,
        comment: feedback.comment,
      });

      console.log("📥 API: Feedback submission response:", response.data);

      return {
        success: true,
        message: "Feedback submitted successfully",
      };
    } catch (error) {
      throw new Error("Failed to submit feedback. Please try again.");
    }
  },
};
