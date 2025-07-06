'use client';

import React, { useState, useEffect } from 'react';
import { groupLeadService } from '../services/api';
import { Task } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Button from '../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { CheckCircle, Clock, AlertCircle, User, ArrowRight, 
         ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react';
import TaskReassignModal from '../components/TaskReassignModal';
import toast from 'react-hot-toast';

interface EmployeeTask {
  employeeId: string;
  employeeName: string;
  employeeLevel: string;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
  earliestDueDate: string;
  isOverdue: boolean;
}

const GroupLeadTaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Reassignment modal state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedTasksForReassign, setSelectedTasksForReassign] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await groupLeadService.getTasks();
        setTasks(tasksData);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Failed to load tasks');
        console.error('Tasks fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();

    // Refresh data when user returns to the page (e.g., from employee tasks page)
    const handleFocus = () => {
      fetchTasks();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Group tasks by employee
  const groupTasksByEmployee = (tasks: Task[]): EmployeeTask[] => {
    const employeeMap = new Map<string, EmployeeTask>();

    console.log('=== DEBUGGING TASK GROUPING ===');
    console.log('Total tasks received:', tasks.length);
    
    // First, let's create a mapping to normalize employee identification
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
    
    console.log('Employee ID to Name mapping:', employeeIdToName);
    console.log('Employee Name to ID mapping:', employeeNameToId);
    
    // Group tasks by employee ID to see if there are duplicates
    const tasksByEmployeeId = new Map<string, Task[]>();
    
    tasks.forEach(task => {
      let normalizedEmployeeId = task.mock_employee_id;
      
      // If the current ID is actually a name and we have a proper ID for this name, use that
      if (employeeNameToId[task.mock_employee_id]) {
        normalizedEmployeeId = employeeNameToId[task.mock_employee_id];
        console.log(`Normalizing ${task.mock_employee_id} to ${normalizedEmployeeId}`);
      }
      // If the current ID doesn't start with EMP but we have a name, 
      // check if there's a proper EMP ID for this employee name
      else if (!task.mock_employee_id.startsWith('EMP') && employeeNameToId[task.mock_employee_name]) {
        normalizedEmployeeId = employeeNameToId[task.mock_employee_name];
        console.log(`Using name-based mapping: ${task.mock_employee_id} -> ${normalizedEmployeeId} for ${task.mock_employee_name}`);
      }
      
      if (!tasksByEmployeeId.has(normalizedEmployeeId)) {
        tasksByEmployeeId.set(normalizedEmployeeId, []);
      }
      tasksByEmployeeId.get(normalizedEmployeeId)!.push(task);
    });

    console.log('Tasks grouped by normalized employee ID:');
    tasksByEmployeeId.forEach((employeeTasks, employeeId) => {
      console.log(`Employee ${employeeId}:`, {
        count: employeeTasks.length,
        names: [...new Set(employeeTasks.map(t => t.mock_employee_name))],
        levels: [...new Set(employeeTasks.map(t => t.mock_employee_level))],
        taskIds: employeeTasks.map(t => t.id),
        originalIds: [...new Set(employeeTasks.map(t => t.mock_employee_id))]
      });
    });

    // Now process each group to create EmployeeTask objects
    tasksByEmployeeId.forEach((groupTasks, normalizedEmployeeId) => {
      const firstTask = groupTasks[0];
      
      const employeeTask: EmployeeTask = {
        employeeId: normalizedEmployeeId,
        employeeName: firstTask.mock_employee_name,
        employeeLevel: firstTask.mock_employee_level,
        tasks: groupTasks,
        completedTasks: 0,
        totalTasks: groupTasks.length,
        earliestDueDate: firstTask.due_date,
        isOverdue: false
      };

      groupTasks.forEach(task => {
        // Check if task is completed based on response rather than status
        // A task is completed if it has a non-empty response
        const hasResponse = task.response && task.response.trim() !== '';
        
        if (hasResponse) {
          employeeTask.completedTasks++;
        }

        // Update earliest due date
        if (new Date(task.due_date) < new Date(employeeTask.earliestDueDate)) {
          employeeTask.earliestDueDate = task.due_date;
        }

        // Check if any task is overdue (no response and past due date)
        if (new Date(task.due_date) < new Date() && !hasResponse) {
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

    console.log('Final grouped employees after normalization:', result.map(emp => ({
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      totalTasks: emp.totalTasks
    })));
    console.log('Total unique employees after normalization:', result.length);

    return result;
  };

  const handleCompleteEmployeeTasks = (employeeId: string, employeeName: string) => {
    // Navigate to employee tasks page
    window.location.href = `/group-lead/employee/${employeeId}?name=${encodeURIComponent(employeeName)}`;
  };

  const handleReassignEmployeeTasks = (employee: EmployeeTask) => {
    // Get all tasks for this employee that are not completed
    const tasksToReassign = employee.tasks.filter(task => {
      // A task is available for reassignment if:
      // 1. It's not marked as completed status-wise, AND
      // 2. It doesn't have a response (null, undefined, or empty string)
      const hasResponse = task.response && task.response.trim() !== '';
      return task.status !== 'completed' && !hasResponse;
    });
    
    console.log('Debug reassignment check:', {
      employeeName: employee.employeeName,
      totalTasks: employee.tasks.length,
      tasksToReassign: tasksToReassign.length,
      taskDetails: employee.tasks.map(task => ({
        id: task.id,
        status: task.status,
        response: task.response,
        hasResponse: task.response && task.response.trim() !== ''
      }))
    });
    
    if (tasksToReassign.length === 0) {
      toast.error('No tasks available for reassignment (all tasks are completed)');
      return;
    }
    
    setSelectedTasksForReassign(tasksToReassign);
    setIsReassignModalOpen(true);
  };

  const handleReassignSuccess = async () => {
    // Refresh the tasks data after successful reassignment
    try {
      const tasksData = await groupLeadService.getTasks();
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Failed to refresh tasks after reassignment:', err);
    }
  };

  const handleCloseReassignModal = () => {
    setIsReassignModalOpen(false);
    setSelectedTasksForReassign([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getStatusBadge = (employee: EmployeeTask) => {
    if (employee.isOverdue) {
      return (
        <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <AlertCircle size={12} />
          OVERDUE
        </span>
      );
    }
    
    if (employee.completedTasks === employee.totalTasks) {
      return (
        <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} />
          COMPLETED
        </span>
      );
    }
    
    return (
      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
        <Clock size={12} />
        PENDING
      </span>
    );
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'L1':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'L2':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'L3':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'L4':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tasks...</div>
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
  const totalPendingTasks = tasks.filter(task => !task.response || task.response.trim() === '').length;
  const totalCompletedTasks = tasks.filter(task => task.response && task.response.trim() !== '').length;

  // Sort employees: overdue first, then by completion percentage (least complete first)
  const sortedEmployees = [...employeeTasks].sort((a, b) => {
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

  // Pagination calculations for all employees
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedEmployees.length);
  const paginatedEmployees = sortedEmployees.slice(startIndex, endIndex);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Tasks</h1>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">
                  {employeeTasks.filter(emp => emp.isOverdue).length}
                </p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle size={20} className="text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Employee Tasks */}
      <Card>
        <CardHeader className="bg-primary/10 border-b border-primary/20">
          <CardTitle className="flex items-center gap-2 text-primary">
            <User size={20} />
            All Employees ({employeeTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {employeeTasks.length === 0 ? (
            <div className="p-8 text-center">
              <User size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No employees found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Sr No</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Compliance Day</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map((employee) => (
                      <TableRow key={employee.employeeId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <User size={16} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{employee.employeeName}</p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadgeClass(employee.employeeLevel)}`}>
                            {employee.employeeLevel}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <span className="font-mono text-sm">{employee.employeeId}</span>
                        </TableCell>
                        
                        <TableCell>
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
                        
                        <TableCell>
                          <div className="text-sm">
                            {new Date(employee.earliestDueDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(employee)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteEmployeeTasks(employee.employeeId, employee.employeeName)}
                              className="flex items-center gap-2"
                            >
                              View Tasks
                              <ArrowRight size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReassignEmployeeTasks(employee)}
                              className="flex items-center gap-2"
                            >
                              <RotateCcw size={14} />
                              Reassign
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
              
              {/* Items per page selector */}
              <div className="p-4 border-t border-border bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <span>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                    className="border rounded px-2 py-1 bg-background"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>employees per page</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Task Reassignment Modal */}
      <TaskReassignModal
        isOpen={isReassignModalOpen}
        onClose={handleCloseReassignModal}
        onReassignSuccess={handleReassignSuccess}
        selectedTasks={selectedTasksForReassign}
        mode={selectedTasksForReassign.length === 1 ? 'single' : 'bulk'}
      />
    </div>
  );
};

export default GroupLeadTaskPage;
