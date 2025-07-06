'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Task } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import Button from '../../components/Button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { CheckCircle, Clock, AlertCircle, User, Users, Search,
         ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAnimation, animationClasses, staggerClasses } from '../../lib/animations';
import { useRouter } from 'next/navigation';

interface EmployeeTask {
  employeeId: string;
  employeeName: string;
  employeeLevel: string;
  // Additional employee fields from Excel template
  employeeDoj?: string;
  employeeDepartment?: string;
  employeeRole?: string;
  employeeTotalExperience?: number;
  employeePastOrganization?: string;
  employeeLabAllocation?: string;
  employeeComplianceDay?: number;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
  earliestDueDate: string;
  isOverdue: boolean;
}

const AdminTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: '',
    department: '',
    status: '',
    level: '',
    joiningDateFrom: '',
    joiningDateTo: '',
    escalationStatus: ''
  });

  const isVisible = useAnimation();
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await adminService.getTasks();
        setTasks(tasksData);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Failed to load tasks');
        console.error('Tasks fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Group tasks by employee (similar to group leader logic)
  const groupTasksByEmployee = (tasks: Task[]): EmployeeTask[] => {
    const employeeMap = new Map<string, EmployeeTask>();

    console.log('=== GROUPING TASKS BY EMPLOYEE ===');
    console.log('Total tasks received:', tasks.length);
    
    // Create a mapping to normalize employee identification
    const employeeIdToName: Record<string, string> = {};
    const employeeNameToId: Record<string, string> = {};
    
    // First pass: establish ID-name relationships
    tasks.forEach(task => {
      const empId = task.mock_employee_id;
      const empName = task.mock_employee_name;
      
      // If ID looks like a proper employee ID (EMP###), map it to the name
      if (empId.startsWith('EMP')) {
        employeeIdToName[empId] = empName;
        employeeNameToId[empName] = empId;
      }
    });
    
    // Group tasks by employee ID
    const tasksByEmployeeId = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      let normalizedEmployeeId = task.mock_employee_id;
      
      // If the current ID is actually a name and we have a proper ID for this name, use that
      if (employeeNameToId[task.mock_employee_id]) {
        normalizedEmployeeId = employeeNameToId[task.mock_employee_id];
      }
      // If the current ID doesn't start with EMP but we have a name, 
      // check if there's a proper EMP ID for this employee name
      else if (!task.mock_employee_id.startsWith('EMP') && employeeNameToId[task.mock_employee_name]) {
        normalizedEmployeeId = employeeNameToId[task.mock_employee_name];
      }
      
      if (!tasksByEmployeeId.has(normalizedEmployeeId)) {
        tasksByEmployeeId.set(normalizedEmployeeId, []);
      }
      tasksByEmployeeId.get(normalizedEmployeeId)!.push(task);
    });

    // Process each group to create EmployeeTask objects
    tasksByEmployeeId.forEach((groupTasks, normalizedEmployeeId) => {
      const firstTask = groupTasks[0];
      
      const employeeTask: EmployeeTask = {
        employeeId: normalizedEmployeeId,
        employeeName: firstTask.mock_employee_name,
        employeeLevel: firstTask.mock_employee_level,
        // Additional employee fields from Excel template
        employeeDoj: firstTask.mock_employee_doj,
        employeeDepartment: firstTask.mock_employee_department,
        employeeRole: firstTask.mock_employee_role,
        employeeTotalExperience: firstTask.mock_employee_total_experience,
        employeePastOrganization: firstTask.mock_employee_past_organization,
        employeeLabAllocation: firstTask.mock_employee_lab_allocation,
        employeeComplianceDay: firstTask.mock_employee_compliance_day,
        tasks: groupTasks,
        completedTasks: 0,
        totalTasks: groupTasks.length,
        earliestDueDate: firstTask.due_date,
        isOverdue: false
      };

      groupTasks.forEach(task => {
        // Check if task is completed based on status
        if (task.status === 'completed') {
          employeeTask.completedTasks++;
        }

        // Update earliest due date
        if (new Date(task.due_date) < new Date(employeeTask.earliestDueDate)) {
          employeeTask.earliestDueDate = task.due_date;
        }

        // Check if any task is overdue (pending and past due date)
        const currentDate = new Date();
        const dueDate = new Date(task.due_date);
        if (task.status === 'pending' && dueDate < currentDate) {
          employeeTask.isOverdue = true;
        }
      });

      employeeMap.set(normalizedEmployeeId, employeeTask);
    });

    const result = Array.from(employeeMap.values()).sort((a, b) => {
      // Sort by overdue first, then by earliest due date
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.earliestDueDate).getTime() - new Date(b.earliestDueDate).getTime();
    });

    console.log('Final grouped employees:', result.map(emp => ({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      totalTasks: emp.totalTasks,
      completedTasks: emp.completedTasks,
      isOverdue: emp.isOverdue
    })));

    return result;
  };

  // Filter employees based on search criteria
  const filterEmployees = (employees: EmployeeTask[]): EmployeeTask[] => {
    return employees.filter(employee => {
      // Search term filter (name or ID)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = employee.employeeName.toLowerCase().includes(searchLower);
        const idMatch = employee.employeeId.toLowerCase().includes(searchLower);
        if (!nameMatch && !idMatch) return false;
      }

      // Level filter
      if (filters.level && employee.employeeLevel !== filters.level) {
        return false;
      }

      // Status filter
      if (filters.status) {
        let employeeStatus: string;
        if (employee.isOverdue) {
          employeeStatus = 'overdue';
        } else if (employee.completedTasks === employee.totalTasks) {
          employeeStatus = 'complete';
        } else {
          employeeStatus = 'in-progress';
        }
        if (employeeStatus !== filters.status) return false;
      }

      // Escalation status filter (overdue tasks)
      if (filters.escalationStatus) {
        if (filters.escalationStatus === 'escalated' && !employee.isOverdue) return false;
        if (filters.escalationStatus === 'normal' && employee.isOverdue) return false;
      }

      // Joining date filter (using earliest due date as proxy)
      if (filters.joiningDateFrom) {
        const joiningFrom = new Date(filters.joiningDateFrom);
        const employeeDate = new Date(employee.earliestDueDate);
        if (employeeDate < joiningFrom) return false;
      }

      if (filters.joiningDateTo) {
        const joiningTo = new Date(filters.joiningDateTo);
        const employeeDate = new Date(employee.earliestDueDate);
        if (employeeDate > joiningTo) return false;
      }

      return true;
    });
  };

  const handleViewEmployeeTasks = (employee: EmployeeTask) => {
    // Navigate to the detailed view for this employee
    router.push(`/admin/tasks/${encodeURIComponent(employee.employeeId)}`);
  };

  const handleCellEdit = async (rowIndex: number, field: string, value: any) => {
    const actualIndex = (currentPage - 1) * itemsPerPage + rowIndex;
    const employee = sortedEmployees[actualIndex];
    
    try {
      // Prepare the update object based on the field being edited
      const updates: any = {};
      const fieldMap: { [key: string]: string } = {
        'employeeName': 'mock_employee_name',
        'employeeLevel': 'mock_employee_level',
        'employeeId': 'mock_employee_id',
        'employeeDoj': 'mock_employee_doj',
        'employeeDepartment': 'mock_employee_department',
        'employeeRole': 'mock_employee_role',
        'employeeTotalExperience': 'mock_employee_total_experience',
        'employeePastOrganization': 'mock_employee_past_organization',
        'employeeLabAllocation': 'mock_employee_lab_allocation',
        'employeeComplianceDay': 'mock_employee_compliance_day'
      };
      
      const apiField = fieldMap[field];
      if (!apiField) {
        toast.error(`Invalid field: ${field}`);
        return;
      }
      
      updates[apiField] = value;
      
      // Call the API to update employee data
      await adminService.updateEmployeeData(employee.employeeId, updates);
      
      // Update local state
      const updatedTasks = [...tasks];
      let hasChanges = false;
      
      for (let i = 0; i < updatedTasks.length; i++) {
        if (updatedTasks[i].mock_employee_id === employee.employeeId) {
          if (updatedTasks[i][apiField as keyof Task] !== value) {
            (updatedTasks[i] as any)[apiField] = value;
            hasChanges = true;
          }
        }
      }
      
      if (hasChanges) {
        setTasks(updatedTasks);
        toast.success(`Updated ${field} for ${employee.employeeName}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to update ${field}`);
      console.error('Error updating employee field:', error);
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'L1': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'L2': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'L3': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'L4': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadge = (employee: EmployeeTask) => {
    if (employee.isOverdue) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle size={12} className="mr-1" />
          Overdue
        </span>
      );
    }
    
    if (employee.completedTasks === employee.totalTasks) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle size={12} className="mr-1" />
          Complete
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock size={12} className="mr-1" />
        In Progress
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setEditingCell(null); // Clear any editing state when changing pages
  };

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      const tasksData = await adminService.getTasks();
      setTasks(tasksData);
      toast.success('Tasks data refreshed!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh tasks data');
      console.error('Manual refresh error', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 ${animationClasses.fadeIn}`}>
        <div className="flex items-center justify-center py-12">
          <div className={`text-muted-foreground flex items-center gap-2 ${animationClasses.pulse}`}>
            <div className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${animationClasses.spin}`}></div>
            Loading tasks...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  const employeeTasks = groupTasksByEmployee(tasks);
  const filteredEmployees = filterEmployees(employeeTasks);
  
  const totalPendingTasks = tasks.filter(task => task.status === 'pending').length;
  const totalCompletedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalOverdueTasks = tasks.filter(task => {
    const currentDate = new Date();
    const dueDate = new Date(task.due_date);
    return task.status === 'pending' && dueDate < currentDate;
  }).length;

  // Sort employees: overdue first, then by completion percentage (least complete first)
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    // First priority: overdue employees (urgent)
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    
    // Second priority: sort by completion percentage (least complete first for priority)
    const aCompletionPercent = (a.completedTasks / a.totalTasks) * 100;
    const bCompletionPercent = (b.completedTasks / b.totalTasks) * 100;
    
    // If both are overdue or both are not overdue, sort by completion (incomplete first)
    if (aCompletionPercent !== bCompletionPercent) {
      return aCompletionPercent - bCompletionPercent;
    }
    
    // Third priority: by earliest due date
    return new Date(a.earliestDueDate).getTime() - new Date(b.earliestDueDate).getTime();
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedEmployees.length);
  const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex);

  return (
    <div className={`p-8 space-y-8 ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Header */}
      <div className={`flex justify-between items-start ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
        <div>
          <h1 className="text-3xl font-bold">Manage Tasks</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all employee onboarding tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleManualRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${loading ? animationClasses.spin : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <span className="text-xs text-muted-foreground">
            Auto-refresh: 30s
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg ${animationClasses.slideInUp}`}>
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-destructive/70 hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      {/* Compact Filter Bar */}
      <Card className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp : 'opacity-0'}`}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Term */}
            <div className="relative min-w-[200px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search employees..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Level Filter */}
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[100px]"
            >
              <option value="">All Levels</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="L4">L4</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[120px]"
            >
              <option value="">All Statuses</option>
              <option value="complete">Complete</option>
              <option value="in-progress">In Progress</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Escalation Status */}
            <select
              value={filters.escalationStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, escalationStatus: e.target.value }))}
              className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[100px]"
            >
              <option value="">All</option>
              <option value="normal">Normal</option>
              <option value="escalated">Escalated</option>
            </select>

            {/* Compliance Day From */}
            <div className="relative">
              <input
                type="date"
                value={filters.joiningDateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, joiningDateFrom: e.target.value }))}
                className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[140px]"
                title="Compliance Day From"
              />
            </div>

            {/* Compliance Day To */}
            <div className="relative">
              <input
                type="date"
                value={filters.joiningDateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, joiningDateTo: e.target.value }))}
                className="px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[140px]"
                title="Compliance Day To"
              />
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                searchTerm: '',
                department: '',
                status: '',
                level: '',
                joiningDateFrom: '',
                joiningDateTo: '',
                escalationStatus: ''
              })}
              className="flex items-center gap-2 px-3 py-2 text-sm"
              title="Clear all filters"
            >
              <X size={14} />
              Clear
            </Button>

            {/* Results Counter */}
            <div className="text-sm text-muted-foreground ml-auto">
              {sortedEmployees.length} of {employeeTasks.length} employees
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp + ' ' + staggerClasses[0] : 'opacity-0'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employeeTasks.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <User size={20} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp + ' ' + staggerClasses[1] : 'opacity-0'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                <p className="text-2xl font-bold text-yellow-500">{totalPendingTasks}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Clock size={20} className="text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp + ' ' + staggerClasses[2] : 'opacity-0'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold text-green-500">{totalCompletedTasks}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp + ' ' + staggerClasses[3] : 'opacity-0'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-500">{totalOverdueTasks}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle size={20} className="text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      <Card className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp + ' ' + staggerClasses[4] : 'opacity-0'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Tasks ({sortedEmployees.length} employees)
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-muted-foreground">employees</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedEmployees.length > 0 ? (
            <>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Employee ID</TableHead>
                      <TableHead className="w-40">Candidate Name</TableHead>
                      <TableHead className="w-20">Level</TableHead>
                      <TableHead className="w-28">Department</TableHead>
                      <TableHead className="w-32">Progress</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map((employee, index) => (
                      <TableRow 
                        key={employee.employeeId}
                        className={`${animationClasses.fadeIn} hover:bg-muted/50 cursor-pointer`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => handleViewEmployeeTasks(employee)}
                      >
                        {/* Employee ID */}
                        <TableCell className="py-3">
                          <span className="font-mono text-xs">{employee.employeeId}</span>
                        </TableCell>
                        
                        {/* Candidate Name with additional info */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{employee.employeeName}</div>
                            <div className="text-xs text-muted-foreground">
                              {employee.employeeRole} • DOJ: {employee.employeeDoj || 'N/A'}
                            </div>
                            {employee.employeeTotalExperience && (
                              <div className="text-xs text-muted-foreground">
                                {employee.employeeTotalExperience} years exp
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Level */}
                        <TableCell className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadgeClass(employee.employeeLevel)}`}>
                            {employee.employeeLevel}
                          </span>
                        </TableCell>
                        
                        {/* Department with additional info */}
                        <TableCell className="py-3">
                          <div className="space-y-1">
                            <div className="text-sm">{employee.employeeDepartment || 'N/A'}</div>
                            {employee.employeeLabAllocation && (
                              <div className="text-xs text-muted-foreground">
                                Lab: {employee.employeeLabAllocation}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Progress */}
                        <TableCell className="py-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">
                                {employee.completedTasks}/{employee.totalTasks}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((employee.completedTasks / employee.totalTasks) * 100)}%
                              </div>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5">
                              <div 
                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(employee.completedTasks / employee.totalTasks) * 100}%`
                                }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Due: {new Date(employee.earliestDueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell className="py-3">
                          {getStatusBadge(employee)}
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEmployeeTasks(employee);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Expandable details section - show on row click */}
                {/* We can add this later if needed */}
              </div>
              
              {/* Pagination Controls */}
              {filteredEmployees.length > itemsPerPage && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 w-16 border border-input bg-background px-2 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No employees found</h3>
              <p className="text-muted-foreground">No employees match your current filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background font-medium"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors font-medium text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeName'})}
                            >
                              {employee.employeeName}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* DOJ */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeDoj' ? (
                            <input
                              type="date"
                              value={employee.employeeDoj || ''}
                              onChange={(e) => handleCellEdit(index, 'employeeDoj', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeDoj'})}
                            >
                              {employee.employeeDoj || '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Department */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeDepartment' ? (
                            <input
                              type="text"
                              value={employee.employeeDepartment || ''}
                              onChange={(e) => handleCellEdit(index, 'employeeDepartment', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeDepartment'})}
                            >
                              {employee.employeeDepartment || '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Role */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeRole' ? (
                            <input
                              type="text"
                              value={employee.employeeRole || ''}
                              onChange={(e) => handleCellEdit(index, 'employeeRole', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeRole'})}
                            >
                              {employee.employeeRole || '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Level */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeLevel' ? (
                            <select
                              value={employee.employeeLevel}
                              onChange={(e) => handleCellEdit(index, 'employeeLevel', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            >
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="L3">L3</option>
                              <option value="L4">L4</option>
                            </select>
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                              onClick={() => setEditingCell({row: index, field: 'employeeLevel'})}
                            >
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadgeClass(employee.employeeLevel)}`}>
                                {employee.employeeLevel}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Total Experience */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeTotalExperience' ? (
                            <input
                              type="number"
                              step="0.1"
                              value={employee.employeeTotalExperience || ''}
                              onChange={(e) => handleCellEdit(index, 'employeeTotalExperience', parseFloat(e.target.value) || 0)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeTotalExperience'})}
                            >
                              {employee.employeeTotalExperience ? `${employee.employeeTotalExperience} years` : '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Past Organization */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeePastOrganization' ? (
                            <input
                              type="text"
                              value={employee.employeePastOrganization || ''}
                              onChange={(e) => handleCellEdit(index, 'employeePastOrganization', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeePastOrganization'})}
                            >
                              {employee.employeePastOrganization || '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Lab Allocation */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeLabAllocation' ? (
                            <input
                              type="text"
                              value={employee.employeeLabAllocation || ''}
                              onChange={(e) => handleCellEdit(index, 'employeeLabAllocation', e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeLabAllocation'})}
                            >
                              {employee.employeeLabAllocation || '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Compliance Day */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {editingCell?.row === index && editingCell?.field === 'employeeComplianceDay' ? (
                            <input
                              type="number"
                              value={employee.employeeComplianceDay || ''}
                              onChange={(e) => handleCellEdit(index, 'employeeComplianceDay', parseInt(e.target.value) || 0)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="w-full px-2 py-1 text-sm border rounded bg-background"
                              autoFocus
                            />
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors text-sm"
                              onClick={() => setEditingCell({row: index, field: 'employeeComplianceDay'})}
                            >
                              {employee.employeeComplianceDay ? `${employee.employeeComplianceDay} days` : '-'}
                            </div>
                          )}
                        </TableCell>
                        
                        {/* Progress */}
                        <TableCell className="py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-sm">
                              {employee.completedTasks}/{employee.totalTasks}
                            </div>
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(employee.completedTasks / employee.totalTasks) * 100}%`
                                }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((employee.completedTasks / employee.totalTasks) * 100)}%
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Earliest Compliance */}
                        <TableCell className="py-2 whitespace-nowrap">
                          <div className="text-sm">
                            {new Date(employee.earliestDueDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell className="py-2 whitespace-nowrap">
                          {getStatusBadge(employee)}
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell className="py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEmployeeTasks(employee)}
                              className="flex items-center gap-2"
                            >
                              <Eye size={14} />
                              View Tasks
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {endIndex} of {sortedEmployees.length} employees
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft size={16} />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    
                    <span className="text-sm px-3 py-1">
                      {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">No employees found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No employee tasks are available to display.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTasksPage;
