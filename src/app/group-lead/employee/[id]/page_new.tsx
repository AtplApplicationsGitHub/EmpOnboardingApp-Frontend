'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { groupLeadService } from '../../../services/api';
import { Task } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../../components/ui/table';
import { CheckCircle, Clock, ArrowLeft, User, MessageSquare, AlertCircle, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeTasksPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const employeeId = params.id as string;
  const employeeName = searchParams.get('name') ?? 'Unknown Employee';
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [autoSaving, setAutoSaving] = useState<Record<number, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Record<number, Date>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const autoSaveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    const fetchEmployeeTasks = async () => {
      try {
        setLoading(true);
        const allTasks = await groupLeadService.getTasks();
        
        // Filter tasks for this specific employee
        const employeeTasks = allTasks.filter(
          task => task.mock_employee_id === employeeId || 
                   task.mock_employee_name === decodeURIComponent(employeeName)
        );
        
        setTasks(employeeTasks);
        
        // Initialize response state with existing responses
        const initialResponses: Record<number, string> = {};
        const initialLastSaved: Record<number, Date> = {};
        
        employeeTasks.forEach(task => {
          if (task.response) {
            // Map old "Not Applicable" responses to "N/A" for backwards compatibility
            const mappedResponse = task.response === 'Not Applicable' ? 'N/A' : task.response;
            initialResponses[task.id] = mappedResponse;
            // Set saved timestamp for existing responses
            // Use updated_at if available, otherwise use current time as fallback
            initialLastSaved[task.id] = task.updated_at ? new Date(task.updated_at) : new Date();
          }
        });
        
        setResponses(initialResponses);
        setLastSaved(initialLastSaved);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Failed to load employee tasks');
        console.error('Employee tasks fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (employeeId) {
      fetchEmployeeTasks();
    }
  }, [employeeId, employeeName]);

  const handleResponseChange = (taskId: number, value: string) => {
    console.log('Response change:', { taskId, valueLength: value.length, preview: value.substring(0, 50) });
    
    setResponses(prev => ({
      ...prev,
      [taskId]: value
    }));

    // Clear existing timeout for this task
    if (autoSaveTimeouts.current[taskId]) {
      clearTimeout(autoSaveTimeouts.current[taskId]);
    }

    // Only set up auto-save if there's actual content
    // Set up auto-save with debounce (reduced to 800ms for faster response)
    autoSaveTimeouts.current[taskId] = setTimeout(() => {
      autoSaveResponse(taskId, value);
    }, 800);
  };

  const autoSaveResponse = async (taskId: number, response: string) => {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('Auto-save skipped: task not found', { taskId });
      return;
    }

    console.log('Auto-save triggered:', { taskId, response: response.substring(0, 50) + (response.length > 50 ? '...' : '') });

    if (!response || response.trim() === '') {
      console.log('Auto-save skipped: empty response', { taskId, responseLength: response.length });
      return;
    }

    try {
      setAutoSaving(prev => ({ ...prev, [taskId]: true }));
      
      // Submit the task
      await groupLeadService.saveTaskResponse(taskId, response);
      
      // Update the task in local state to reflect it's completed
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, response, status: 'completed', completed_at: new Date().toISOString() }
            : t
        )
      );

      setLastSaved(prev => ({ ...prev, [taskId]: new Date() }));
      
      console.log('Auto-save successful:', { taskId, responseLength: response.length });
      
      toast.success(`Response auto-saved successfully`, {
        style: {
          background: '#10b981',
          color: 'white',
        }
      });
    } catch (err: any) {
      console.error('Auto-save failed:', err);
      toast.error(`Auto-save failed: ${err.response?.status} - ${err.response?.data?.message ?? err.message}`, {
        style: {
          background: '#ef4444',
          color: 'white',
        }
      });
    } finally {
      setAutoSaving(prev => ({ ...prev, [taskId]: false }));
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(autoSaveTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const isTaskEditable = (task: Task) => {
    // Task is editable if it's not past the due date
    return !isOverdue(task.due_date);
  };

  // Helper function to get the current response for a task (from responses state or task.response)
  const getCurrentResponse = (task: Task): string => {
    return responses[task.id] !== undefined ? responses[task.id] : (task.response ?? '');
  };

  // Helper function to check if a task is completed (has a non-empty response)
  const isTaskCompleted = (task: Task): boolean => {
    const currentResponse = getCurrentResponse(task);
    return currentResponse.trim() !== '';
  };

  // Get status flag color and icon
  const getStatusFlag = (task: Task) => {
    const completed = isTaskCompleted(task);
    const overdue = isOverdue(task.due_date);
    
    if (completed && !overdue) {
      return { color: 'text-green-500', icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900', label: 'Completed' };
    } else if (completed && overdue) {
      return { color: 'text-yellow-500', icon: CheckCircle, bg: 'bg-yellow-100 dark:bg-yellow-900', label: 'Completed (Past Due)' };
    } else if (!completed && overdue) {
      return { color: 'text-red-500', icon: AlertCircle, bg: 'bg-red-100 dark:bg-red-900', label: 'Overdue' };
    } else {
      return { color: 'text-blue-500', icon: Clock, bg: 'bg-blue-100 dark:bg-blue-900', label: 'Pending' };
    }
  };

  // Get auto-save status
  const getAutoSaveStatus = (taskId: number) => {
    if (autoSaving[taskId]) {
      return { text: 'Saving...', color: 'text-yellow-500', icon: Save };
    } else if (lastSaved[taskId]) {
      return { text: `Saved ${lastSaved[taskId].toLocaleTimeString()}`, color: 'text-green-500', icon: CheckCircle };
    } else if (responses[taskId] && !lastSaved[taskId]) {
      return { text: 'Not saved', color: 'text-gray-500', icon: AlertCircle };
    } else {
      return { text: '-', color: 'text-gray-400', icon: null };
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentTasks = tasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading employee tasks...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/group-lead')}
                className="flex items-center gap-2 shrink-0"
                size="sm"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Button>
              <div className="p-4 bg-primary/10 rounded-full">
                <User size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{employeeName}</h2>
                <p className="text-muted-foreground">
                  Employee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground">No tasks found for this employee.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => isTaskCompleted(task));
  const employee = tasks[0]; // Get employee info from first task

  return (
    <div className="space-y-2">
      {/* Employee Info Card with Back Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/group-lead')}
              className="flex items-center gap-2 shrink-0"
              size="sm"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Button>
            <div className="p-4 bg-primary/10 rounded-full">
              <User size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{employee.mock_employee_name}</h2>
              <p className="text-muted-foreground">
                Employee Level: {employee.mock_employee_level} • ID: {employee.mock_employee_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-lg font-semibold">
                {completedTasks.length}/{tasks.length} completed
              </p>
              <div className="w-32 bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedTasks.length / tasks.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Employee Tasks ({tasks.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={tasksPerPage}
                onChange={(e) => {
                  setTasksPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-muted-foreground">tasks</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Si No</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="w-32">Due Date</TableHead>
                  <TableHead className="w-32">Auto-Save</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTasks.map((task, index) => {
                  const statusFlag = getStatusFlag(task);
                  const autoSaveStatus = getAutoSaveStatus(task.id);
                  const StatusIcon = statusFlag.icon;
                  const AutoSaveIcon = autoSaveStatus.icon;
                  const isEditable = isTaskEditable(task);
                  
                  return (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      {/* Serial Number */}
                      <TableCell className="font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      
                      {/* Status Flag */}
                      <TableCell>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusFlag.bg}`}>
                          <StatusIcon size={12} className={statusFlag.color} />
                          <span className={statusFlag.color}>{statusFlag.label}</span>
                        </div>
                      </TableCell>
                      
                      {/* Question */}
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium text-sm mb-1">{task.question}</p>
                          <p className="text-xs text-muted-foreground">Day {task.compliance_day}</p>
                        </div>
                      </TableCell>
                      
                      {/* Response */}
                      <TableCell>
                        <div className="max-w-sm">
                          {isEditable ? (
                            <div className="space-y-2">
                              {task.response_type === 'yes_no' ? (
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      className="w-3 h-3 text-primary"
                                      name={`response-${task.id}`}
                                      value="Yes"
                                      checked={responses[task.id] === 'Yes'}
                                      onChange={() => handleResponseChange(task.id, 'Yes')}
                                    />
                                    <span className="text-xs">Yes</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      className="w-3 h-3 text-primary"
                                      name={`response-${task.id}`}
                                      value="No"
                                      checked={responses[task.id] === 'No'}
                                      onChange={() => handleResponseChange(task.id, 'No')}
                                    />
                                    <span className="text-xs">No</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                      type="radio"
                                      className="w-3 h-3 text-primary"
                                      name={`response-${task.id}`}
                                      value="N/A"
                                      checked={responses[task.id] === 'N/A'}
                                      onChange={() => handleResponseChange(task.id, 'N/A')}
                                    />
                                    <span className="text-xs">N/A</span>
                                  </label>
                                </div>
                              ) : (
                                <textarea
                                  className="w-full px-2 py-1 border border-input bg-background text-foreground rounded text-xs resize-none"
                                  rows={2}
                                  value={responses[task.id] ?? ''}
                                  onChange={(e) => handleResponseChange(task.id, e.target.value)}
                                  placeholder="Enter response..."
                                />
                              )}
                            </div>
                          ) : (
                            <div className="text-sm p-2 bg-muted/50 rounded">
                              {getCurrentResponse(task) || 'No response'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Due Date */}
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(task.due_date).toLocaleDateString()}</p>
                          {isOverdue(task.due_date) && (
                            <p className="text-red-500 text-xs font-medium">Overdue</p>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Auto-Save Status */}
                      <TableCell>
                        <div className={`flex items-center gap-1 text-xs ${autoSaveStatus.color}`}>
                          {AutoSaveIcon && <AutoSaveIcon size={12} className={autoSaving[task.id] ? 'animate-pulse' : ''} />}
                          <span>{autoSaveStatus.text}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, tasks.length)} of {tasks.length} tasks
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTasksPage;
