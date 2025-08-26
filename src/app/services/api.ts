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
  TaskProjection,
} from "../types";

// Create axios instance
const api = axios.create({
  // baseURL: 'https://dev.goval.app:2083/api',
  // baseURL: "https://employee.onboarding.goval.app:8084/api",
  baseURL: "http://localhost:8084/api",
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
  
  checkUserRole: async (email: string): Promise<{ role: "admin" | "group_lead" | "employee"; exists: boolean }> => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { role: 'employee', exists: false };
    }
    
    // TODO: Replace with actual API call to check user role
    // GET /api/auth/check-user-role?email={email}
    const userRoleLookup: Record<string, 'admin' | 'group_lead'> = {
      // Admin users
      'admin@mailinator.com': 'admin',
      'a2@mailinator.com': 'admin',
      'a3@mailinator.com': 'admin',
      'a4@mailinator.com': 'admin',
      '1@1.com': 'admin',
      '2@mailinator.com': 'admin',
      'admin123@mailinator.com': 'admin',
      'a4@example.com': 'admin',
      'g21@mailinator.com': 'admin',
      
      // Group leader users
      'gl1@mailinator.com': 'group_lead',
      'gl2@mailinator.com': 'group_lead',
      '3@mailinator.com': 'group_lead',
      '4gl@mailinator.com': 'group_lead',
      '5gl@mailinator.com': 'group_lead',
      'a1@mailinator.com': 'group_lead',
      'g2@example.com': 'group_lead',
      'g2@mailinator.com': 'group_lead',
      'a2@example.com': 'group_lead',
      'a1@example.com': 'group_lead'
    };
    
    const userRole = userRoleLookup[email.toLowerCase()];
    
    if (userRole) {
      return { role: userRole, exists: true };
    } else {
      return { role: 'employee', exists: true };
    }
  },
  
  sendOtp: async (email: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Implement actual OTP sending API
    // POST /api/auth/send-otp
    
    // Mock implementation for testing
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`otp_${email}`, mockOtp);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          success: true, 
          message: `OTP sent successfully to ${email}. Check browser console for testing OTP: ${mockOtp}` 
        });
      }, 1000);
    });
  },
  
  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    // TODO: Implement actual OTP verification API
    // POST /api/auth/verify-otp
    
    // Mock implementation for testing
    const storedOtp = sessionStorage.getItem(`otp_${email}`);
    
    if (otp === storedOtp) {
      sessionStorage.removeItem(`otp_${email}`);
      
      return {
        accessToken: 'mock-employee-token-' + Date.now(),
        userName: email.split('@')[0],
        userId: Math.floor(Math.random() * 1000) + 100,
        success: true,
        message: 'OTP verified successfully',
        loginAttemptCount: 1,
        newUser: false
      };
    } else {
      throw new Error('Invalid OTP. Please check the code and try again.');
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

  // LookUp

  getLookupItems: async (type: string): Promise<DropDownDTO[]> => {
    const response = await api.get<DropDownDTO[]>(`/lookup/getCategoryItemByName/${type}`); 
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

  labAllocation: async (
    id: number,
    labAllocation: string
  ): Promise<boolean> => {
    const response = await api.post<boolean>(`/employee/labSave/${labAllocation}/${id}`);
    return response.data;
  },

  updateResponse: async (
    id: number,
    value: string
  ): Promise<boolean> => {
    const response = await api.post<boolean>(`/task/taskQuestionAnswer/${id}/${value}`);
    return response.data;
  },
};


// Group Lead Services
// export const groupLeadService = {
//   getTasks: async (): Promise<Task[]> => {
//     // Use the admin task endpoint (temporary until group lead endpoint is deployed)
//     const response = await api.post<{
//       commonListDto: {
//         content: TaskProjection[];
//       };
//       totalElements: number;
//     }>("/task/filteredTaskForAdmin/null/0");
    
//     // Convert TaskProjection[] to Task[] for compatibility
//     return response.data.commonListDto.content.map(convertTaskProjectionToTask);
//   },

//   getTasksPaginated: async (params?: {
//     search?: string;
//     page?: number;
//   }): Promise<{
//     commonListDto: {
//       content: Task[];
//     };
//     totalElements: number;
//   }> => {
//     const search = params?.search ?? "null";
//     const page = params?.page ?? 0;
//     const response = await api.post<{
//       commonListDto: {
//         content: TaskProjection[];
//       };
//       totalElements: number;
//     }>(`/task/filteredTaskForAdmin/${search}/${page}`);
    
//     // Convert TaskProjection[] to Task[] for compatibility
//     const convertedContent = response.data.commonListDto.content.map(convertTaskProjectionToTask);
    
//     return {
//       commonListDto: {
//         content: convertedContent,
//       },
//       totalElements: response.data.totalElements,
//     };
//   },

//   completeTask: async (taskId: number, response: string): Promise<Task> => {
//     // TODO: Implement backend endpoint - for now return mock response
//     console.warn("Complete task endpoint not implemented yet. Using mock response.");
//     return {
//       id: taskId,
//       employeeName: "Mock Employee",
//       employeeId: 1,
//       level: "L1",
//       department: "IT",
//       role: "Developer",
//       lab: "Lab 1",
//       groupName: "Group 1",
//       pastExperience: "2 years",
//       prevCompany: "Previous Co",
//       complianceDay: "30",
//       assignedTo: "Group Lead",
//       totalQuestions: 5,
//       completedQuestions: 5,
//       status: "Completed",
//       doj: new Date().toISOString(),
//       questionList: [],
//       createdTime: new Date().toISOString(),
//       updatedTime: new Date().toISOString(),
//     };
//   },

//   // User Management for Group Leads
//   getUsers: async (): Promise<User[]> => {
//     const response = await api.get<User[]>("/group-lead/users");
//     return response.data;
//   },

//   createUser: async (data: {
//     name: string;
//     email: string;
//     password: string;
//   }): Promise<User> => {
//     const response = await api.post<User>("/group-lead/users", data);
//     return response.data;
//   },

//   // Task Reassignment
//   getGroupLeaders: async (): Promise<User[]> => {
//     const response = await api.get<User[]>("/group-lead/group-leaders");
//     return response.data;
//   },

//   reassignTask: async (
//     taskId: number,
//     newAssigneeId: number,
//     reason?: string
//   ): Promise<{
//     message: string;
//     task: Task;
//     previous_assignee_id: number;
//     new_assignee: User;
//     reason: string;
//   }> => {
//     const response = await api.put(`/group-lead/tasks/${taskId}/reassign`, {
//       new_assignee_id: newAssigneeId,
//       reason,
//     });
//     return response.data;
//   },

//   bulkReassignTasks: async (
//     taskIds: number[],
//     newAssigneeId: number,
//     reason?: string
//   ): Promise<{
//     message: string;
//     reassigned_count: number;
//     new_assignee: User;
//     tasks: Task[];
//     reason: string;
//   }> => {
//     const response = await api.put("/group-lead/tasks/bulk-reassign", {
//       task_ids: taskIds,
//       new_assignee_id: newAssigneeId,
//       reason,
//     });
//     return response.data;
//   },
// };

// Employee Services
export const employeeService = {
  // Get all questions assigned to the current employee across all groups
  getAllQuestions: async (): Promise<any[]> => {
    try {
      // TODO: API - Get all questions for employee across all groups
      // GET /api/employees/{employeeId}/questions
      
      // Mock data - flattened questions from all groups with format matching screenshot
      const mockQuestions = [
        {
          id: 'q1',
          questionText: 'G3Q2',
          questionType: 'Text Response',
          status: 'pending',
          groupName: 'G3 - T082500003 - GL1',
          groupLeaderName: 'Group Leader 1',
          groupId: '3'
        },
        {
          id: 'q2',
          questionText: 'G3Q1',
          questionType: 'Yes/No/N/A Question',
          status: 'pending',
          groupName: 'G3 - T082500003 - GL1',
          groupLeaderName: 'Group Leader 1',
          groupId: '3'
        },
        {
          id: 'q3',
          questionText: 'G1Q1',
          questionType: 'Yes/No/N/A Question',
          status: 'answered',
          groupLeaderAnswer: 'Yes',
          answeredAt: '2025-08-20T10:30:00Z',
          groupName: 'G1 - Frontend Development',
          groupLeaderName: 'John Smith',
          groupId: '1'
        },
        {
          id: 'q4',
          questionText: 'G1Q2',
          questionType: 'Text Response',
          status: 'answered',
          groupLeaderAnswer: 'Good understanding of basic types and interfaces',
          answeredAt: '2025-08-21T14:15:00Z',
          groupName: 'G1 - Frontend Development',
          groupLeaderName: 'John Smith',
          groupId: '1'
        },
        {
          id: 'q5',
          questionText: 'G2Q1',
          questionType: 'Text Response',
          status: 'pending',
          groupName: 'G2 - Backend Development',
          groupLeaderName: 'Sarah Johnson',
          groupId: '2'
        },
        {
          id: 'q6',
          questionText: 'G2Q2',
          questionType: 'Yes/No/N/A Question',
          status: 'answered',
          groupLeaderAnswer: 'Yes',
          answeredAt: '2025-08-22T11:20:00Z',
          groupName: 'G2 - Backend Development',
          groupLeaderName: 'Sarah Johnson',
          groupId: '2'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockQuestions;

      // Real API call (uncomment when backend is ready):
      // const response = await api.get("/employee/questions");
      // return response.data;
    } catch (error) {
      console.error('Failed to fetch employee questions:', error);
      throw error;
    }
  },

  // Submit feedback for a specific group
  submitGroupFeedback: async (groupId: string, feedback: { rating: number; comment: string }): Promise<any> => {
    try {
      // TODO: API - Submit employee feedback for specific group
      // POST /api/employees/{employeeId}/groups/{groupId}/feedback
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: 'feedback_' + Date.now(),
        groupId,
        rating: feedback.rating,
        comment: feedback.comment,
        submittedAt: new Date().toISOString()
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.post(`/employee/groups/${groupId}/feedback`, {
      //   rating: feedback.rating,
      //   comment: feedback.comment
      // });
      // return response.data;
    } catch (error) {
      console.error('Failed to submit group feedback:', error);
      throw error;
    }
  },

  // Get employee dashboard statistics
  getDashboardStats: async (): Promise<any> => {
    try {
      // TODO: API - Get employee dashboard statistics
      // GET /api/employees/{employeeId}/dashboard-stats
      
      // Mock implementation - calculate from getAllQuestions
      const questions = await employeeService.getAllQuestions();
      
      return {
        totalQuestions: questions.length,
        answeredQuestions: questions.filter(q => q.status === 'answered').length,
        pendingQuestions: questions.filter(q => q.status === 'pending').length,
        completionPercentage: Math.round((questions.filter(q => q.status === 'answered').length / questions.length) * 100)
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.get("/employee/dashboard-stats");
      // return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  },

  // Get task groups assigned to the current employee
  getTaskGroups: async (): Promise<any[]> => {
    try {
      // TODO: API - Get employee's assigned task groups and questions
      // GET /api/employees/{employeeId}/task-groups
      
      // Mock implementation - use getAllQuestions and group them
      const questions = await employeeService.getAllQuestions();
      const groupedQuestions = questions.reduce((groups, question) => {
        const groupKey = question.groupId;
        if (!groups[groupKey]) {
          groups[groupKey] = {
            groupId: question.groupId,
            groupName: question.groupName,
            groupLeaderName: question.groupLeaderName,
            questions: []
          };
        }
        groups[groupKey].questions.push(question);
        return groups;
      }, {} as Record<string, any>);

      return Object.values(groupedQuestions);

      // Real API call (uncomment when backend is ready):
      // const response = await api.get("/employee/task-groups");
      // return response.data;
    } catch (error) {
      console.error('Failed to fetch task groups:', error);
      throw error;
    }
  },

  // Get specific task group details
  getTaskGroupDetails: async (groupId: string): Promise<any> => {
    try {
      // TODO: API - Get specific group details with questions for employee
      // GET /api/employees/{employeeId}/groups/{groupId}
      
      // Mock implementation
      const allQuestions = await employeeService.getAllQuestions();
      const groupQuestions = allQuestions.filter(q => q.groupId === groupId);
      
      if (groupQuestions.length === 0) {
        throw new Error(`Group ${groupId} not found`);
      }

      return {
        groupId,
        groupName: groupQuestions[0].groupName,
        groupLeaderName: groupQuestions[0].groupLeaderName,
        questions: groupQuestions,
        feedback: null // No feedback submitted yet
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.get(`/employee/task-groups/${groupId}`);
      // return response.data;
    } catch (error) {
      console.error('Failed to fetch task group details:', error);
      throw error;
    }
  },

  // Save answers for task group questions
  saveAnswers: async (groupId: string, answers: any[]): Promise<any> => {
    try {
      // TODO: API - Save employee answers for group questions
      // POST /api/employees/{employeeId}/groups/{groupId}/answers
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Answers saved successfully',
        groupId,
        savedAt: new Date().toISOString()
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.post(`/employee/task-groups/${groupId}/answers`, { answers });
      // return response.data;
    } catch (error) {
      console.error('Failed to save answers:', error);
      throw error;
    }
  },

  // Submit final answers for task group
  submitAnswers: async (groupId: string): Promise<any> => {
    try {
      // TODO: API - Submit final answers for group
      // POST /api/employees/{employeeId}/groups/{groupId}/submit
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Answers submitted successfully',
        groupId,
        submittedAt: new Date().toISOString()
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.post(`/employee/task-groups/${groupId}/submit`);
      // return response.data;
    } catch (error) {
      console.error('Failed to submit answers:', error);
      throw error;
    }
  },

  // Get employee profile
  getProfile: async (): Promise<any> => {
    try {
      // TODO: API - Get employee profile details
      // GET /api/employees/{employeeId}/profile
      
      // Mock implementation
      return {
        id: 'emp_' + Math.floor(Math.random() * 1000),
        name: 'John Employee',
        email: 'employee@company.com',
        department: 'Technology',
        level: 'L2',
        startDate: '2025-08-01',
        manager: 'Jane Manager',
        status: 'Active'
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.get("/employee/profile");
      // return response.data;
    } catch (error) {
      console.error('Failed to fetch employee profile:', error);
      throw error;
    }
  },

  // Update employee profile
  updateProfile: async (profileData: any): Promise<any> => {
    try {
      // TODO: API - Update employee profile
      // PUT /api/employees/{employeeId}/profile
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Profile updated successfully',
        updatedAt: new Date().toISOString(),
        ...profileData
      };

      // Real API call (uncomment when backend is ready):
      // const response = await api.put("/employee/profile", profileData);
      // return response.data;
    } catch (error) {
      console.error('Failed to update employee profile:', error);
      throw error;
    }
  },
};
