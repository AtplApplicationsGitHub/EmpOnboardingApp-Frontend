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
import { useAnimation, animationClasses } from '../../lib/animations';
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
      if (empId.startsWith('EMP') || empId.startsWith('T')) {
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
      // If the current ID doesn't start with expected patterns but we have a name, 
      // check if there's a proper ID for this employee name
      else if (!task.mock_employee_id.startsWith('EMP') && !task.mock_employee_id.startsWith('T') && employeeNameToId[task.mock_employee_name]) {
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

      // Department filter
      if (filters.department && employee.employeeDepartment !== filters.department) {
        return false;
      }

      // Status filter
      if (filters.status) {
        if (filters.status === 'completed' && employee.completedTasks !== employee.totalTasks) {
          return false;
        }
        if (filters.status === 'pending' && employee.completedTasks === employee.totalTasks) {
          return false;
        }
        if (filters.status === 'overdue' && !employee.isOverdue) {
          return false;
        }
      }

      return true;
    });
  };

  const handleViewEmployeeTasks = (employee: EmployeeTask) => {
    // Navigate to the detailed view for this employee
    router.push(`/admin/tasks/${encodeURIComponent(employee.employeeId)}`);
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
    
    // If completion is same, sort by earliest due date
    return new Date(a.earliestDueDate).getTime() - new Date(b.earliestDueDate).getTime();
  });

  // Pagination
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Statistics Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`}>
        <Card className={`${animationClasses.slideInUp}`} style={{ animationDelay: '0ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employeeTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${animationClasses.slideInUp}`} style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
                <p className="text-2xl font-bold">{totalPendingTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${animationClasses.slideInUp}`} style={{ animationDelay: '200ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{totalCompletedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${animationClasses.slideInUp}`} style={{ animationDelay: '300ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                <p className="text-2xl font-bold">{totalOverdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={animationClasses.slideInUp} style={{ animationDelay: '400ms' }}>
        <CardHeader>
          <CardTitle>Filter Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search employees..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>

            <select
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              className="px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">All Levels</option>
              <option value="L1">L1</option>
              <option value="L2">L2</option>
              <option value="L3">L3</option>
              <option value="L4">L4</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">In Progress</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters({...filters, department: e.target.value})}
              className="px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
            </select>

            <Button
              variant="outline"
              onClick={() => setFilters({
                searchTerm: '',
                department: '',
                status: '',
                level: '',
                joiningDateFrom: '',
                joiningDateTo: '',
                escalationStatus: ''
              })}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Tasks Table */}
      <Card className={animationClasses.slideInUp} style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Employee Task Management
            </CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold">{sortedEmployees.length}</div>
              <span className="text-sm text-muted-foreground">employees</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedEmployees.length > 0 ? (
            <>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Employee</TableHead>
                        <TableHead className="w-[25%]">Role & Experience</TableHead>
                        <TableHead className="w-[20%]">Progress</TableHead>
                        <TableHead className="w-[15%]">Status</TableHead>
                        <TableHead className="w-[10%]">Actions</TableHead>
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
                          {/* Employee Info */}
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="font-medium text-sm truncate">{employee.employeeName}</div>
                              <div className="font-mono text-xs text-muted-foreground truncate">{employee.employeeId}</div>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getLevelBadgeClass(employee.employeeLevel)}`}>
                                {employee.employeeLevel}
                              </span>
                            </div>
                          </TableCell>
                          
                          {/* Role & Experience */}
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium truncate">{employee.employeeRole ?? 'N/A'}</div>
                              <div className="text-xs text-muted-foreground truncate">{employee.employeeDepartment ?? 'N/A'}</div>
                              {employee.employeeLabAllocation && (
                                <div className="text-xs text-muted-foreground truncate">
                                  Lab: {employee.employeeLabAllocation}
                                </div>
                              )}
                              {employee.employeeTotalExperience && (
                                <div className="text-xs text-muted-foreground">
                                  {employee.employeeTotalExperience} years exp
                                </div>
                              )}
                              {employee.employeePastOrganization && (
                                <div className="text-xs text-muted-foreground truncate" title={employee.employeePastOrganization}>
                                  Prev: {employee.employeePastOrganization}
                                </div>
                              )}
                              {employee.employeeComplianceDay && (
                                <div className="text-xs text-muted-foreground">
                                  {employee.employeeComplianceDay} day compliance
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
                                {new Date(employee.earliestDueDate).toLocaleDateString()}
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
                </div>
              </div>
              
              {/* Pagination Controls */}
              {filteredEmployees.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 px-4 py-4">
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
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No employees found</h3>
              <p className="text-muted-foreground">No employees match your current filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTasksPage;
