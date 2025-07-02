import axios from 'axios';
import { 
  AuthResponse, User, Group, Question, Task, Employee, EmployeeProcessingResponse
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: 'https://dev.goval.app:2083/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // Redirect to login if we're not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Admin Services
export const adminService = {
  // Group Management
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/admin/groups');
    return response.data;
  },
    createGroup: async (data: { 
    name: string; 
    primary_group_lead_id?: number; 
    escalation_group_lead_id?: number; 
  }): Promise<Group> => {
    const response = await api.post<Group>('/admin/groups', data);
    return response.data;
  },
  
  updateGroup: async (id: number, data: { 
    name: string; 
    primary_group_lead_id?: number; 
    escalation_group_lead_id?: number; 
  }): Promise<Group> => {
    const response = await api.put<Group>(`/admin/groups/${id}`, data);
    return response.data;
  },
  
  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/admin/groups/${id}`);
  },
  
  // Question Management
  getQuestions: async (groupId: number, level?: string): Promise<Question[]> => {
    const params = level ? { level } : {};
    const response = await api.get<Question[]>(`/admin/groups/${groupId}/questions`, { params });
    return response.data;
  },
  
  createQuestion: async (
    groupId: number, 
    data: {
      question_text: string;
      response_type: 'yes_no' | 'text';
      compliance_day: string;
      levels: string[];
    }
  ): Promise<Question> => {
    const response = await api.post<Question>(`/admin/groups/${groupId}/questions`, data);
    return response.data;
  },
  
  updateQuestion: async (
    questionId: number, 
    data: {
      question_text?: string;
      response_type?: 'yes_no' | 'text';
      compliance_day?: string;
      levels?: string[];
    }
  ): Promise<Question> => {
    const response = await api.put<Question>(`/admin/questions/${questionId}`, data);
    return response.data;
  },
  
  deleteQuestion: async (questionId: number): Promise<void> => {
    await api.delete(`/admin/questions/${questionId}`);
  },
  
  // Task Management
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/admin/tasks');
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
    const response = await api.post<Task>('/admin/tasks', data);
    return response.data;
  },
  
  reassignTask: async (taskId: number): Promise<Task> => {
    const response = await api.put<{message: string; task: Task}>(`/admin/tasks/${taskId}/reassign`);
    return response.data.task;
  },

  // New admin reassignment methods
  reassignTaskToUser: async (taskId: number, assigneeId: number, reason: string): Promise<{
    message: string;
    task: Task;
    previous_assignee: string;
    new_assignee: string;
    reason: string;
  }> => {
    const response = await api.put(`/admin/tasks/${taskId}/reassign-to-user`, {
      assignee_id: assigneeId,
      reason: reason
    });
    return response.data;
  },

  bulkReassignTasksToUser: async (taskIds: number[], assigneeId: number, reason: string): Promise<{
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
    const response = await api.put('/admin/tasks/bulk-reassign-to-user', {
      task_ids: taskIds,
      assignee_id: assigneeId,
      reason: reason
    });
    return response.data;
  },

  // Group Lead User Management
  getUsers: async (params?: {
    role?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      pages: number;
      has_prev: boolean;
      has_next: boolean;
      prev_num: number | null;
      next_num: number | null;
    };
  }> => {
    const response = await api.get<{
      users: User[];
      pagination: {
        page: number;
        per_page: number;
        total: number;
        pages: number;
        has_prev: boolean;
        has_next: boolean;
        prev_num: number | null;
        next_num: number | null;
      };
    }>('/admin/users', { params });
    return response.data;
  },

  // Helper method to get all group leads for forms (without pagination)
  getAllGroupLeads: async (): Promise<User[]> => {
    const response = await api.get<{
      users: User[];
      pagination: any;
    }>('/admin/users', { params: { role: 'group_lead', per_page: 50 } }); // Get up to 50 group leads
    return response.data.users;
  },
  
  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'group_lead';
  }): Promise<User> => {
    const response = await api.post<User>('/admin/users', data);
    return response.data;
  },
  
  // Employee Processing
  processEmployees: async (employees: Employee[]): Promise<EmployeeProcessingResponse> => {
    const response = await api.post<EmployeeProcessingResponse>('/admin/process-employees', { employees });
    return response.data;
  },
  
  createTestEmployeeBatch: async (): Promise<EmployeeProcessingResponse> => {
    const response = await api.post<EmployeeProcessingResponse>('/admin/test-employee-batch');
    return response.data;
  },
  
  createTestEmployeeQueue: async (): Promise<{ message: string; employees: Employee[] }> => {
    const response = await api.post<{ message: string; employees: Employee[] }>('/admin/test-employee-queue');
    return response.data;
  },
  
  processEmployeeQueue: async (employees: Employee[]): Promise<EmployeeProcessingResponse> => {
    const response = await api.post<EmployeeProcessingResponse>('/admin/process-employee-queue', { employees });
    return response.data;
  },
  
  clearAllTasks: async (): Promise<{message: string; deleted_count: number}> => {
    const response = await api.delete<{message: string; deleted_count: number}>('/admin/clear-tasks');
    return response.data;
  },

  // Excel Template Download and Import
  downloadEmployeeTemplate: async (): Promise<Blob> => {
    const response = await api.get('/admin/employee-template/download', {
      responseType: 'blob'
    });
    return response.data;
  },

  importEmployeeTemplate: async (file: File): Promise<EmployeeProcessingResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<EmployeeProcessingResponse>('/admin/employee-template/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Reports and Audit Trail
  getDailyTaskSummary: async (days?: number): Promise<any[]> => {
    const params = days ? { days } : {};
    const response = await api.get('/admin/reports/daily-task-summary', { params });
    return response.data;
  },

  getGroupLeaderOverview: async (): Promise<any[]> => {
    const response = await api.get('/admin/reports/group-leader-overview');
    return response.data;
  },

  getCandidateChecklist: async (): Promise<any[]> => {
    const response = await api.get('/admin/reports/candidate-checklist');
    return response.data;
  },

  getAuditLogs: async (): Promise<any[]> => {
    const response = await api.get('/admin/audit-logs');
    return response.data;
  },

  exportReport: async (reportType: string): Promise<Blob> => {
    const response = await api.get(`/admin/reports/export/${reportType}`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

// Group Lead Services
export const groupLeadService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/group-lead/tasks');
    return response.data;
  },
  
  completeTask: async (taskId: number, response: string): Promise<Task> => {
    const result = await api.put<{message: string; task: Task}>(
      `/group-lead/tasks/${taskId}/complete`, 
      { response }
    );
    return result.data.task;
  },
  
  saveTaskResponse: async (taskId: number, response: string): Promise<Task> => {
    const result = await api.put<{message: string; task: Task}>(
      `/group-lead/tasks/${taskId}/save`, 
      { response }
    );
    return result.data.task;
  },
  
  // User Management for Group Leads
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/group-lead/users');
    return response.data;
  },
  
  createUser: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> => {
    const response = await api.post<User>('/group-lead/users', data);
    return response.data;
  },

  // Task Reassignment
  getGroupLeaders: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/group-lead/group-leaders');
    return response.data;
  },

  reassignTask: async (taskId: number, newAssigneeId: number, reason?: string): Promise<{
    message: string;
    task: Task;
    previous_assignee_id: number;
    new_assignee: User;
    reason: string;
  }> => {
    const response = await api.put(`/group-lead/tasks/${taskId}/reassign`, {
      new_assignee_id: newAssigneeId,
      reason
    });
    return response.data;
  },

  bulkReassignTasks: async (taskIds: number[], newAssigneeId: number, reason?: string): Promise<{
    message: string;
    reassigned_count: number;
    new_assignee: User;
    tasks: Task[];
    reason: string;
  }> => {
    const response = await api.put('/group-lead/tasks/bulk-reassign', {
      task_ids: taskIds,
      new_assignee_id: newAssigneeId,
      reason
    });
    return response.data;
  },
};
