"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { groupLeadService } from "../../../services/api";
import { Task } from "../../../types";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import Button from "../../../components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../../components/ui/table";
import { 
  ArrowLeft, 
  User, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const GroupLeadTaskDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const employeeId = params.id as string;
  const employeeName = searchParams.get('name') ?? 'Unknown Employee';
  const groupName = searchParams.get('group') ?? 'Unknown Group';
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [savingStates, setSavingStates] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch tasks for this specific employee
  useEffect(() => {
    const fetchEmployeeTasks = async () => {
      try {
        setLoading(true);
        const allTasks = await groupLeadService.getTasks();
        
        // Filter tasks for this specific employee and group
        const employeeTasks = allTasks.filter(
          task => (task.employeeId?.toString() === employeeId || 
                   task.id?.toString() === employeeId ||
                   task.employeeName === decodeURIComponent(employeeName)) &&
                   task.groupName === decodeURIComponent(groupName)
        );
        
        setTasks(employeeTasks);
        
        // Initialize responses with existing task responses
        const initialResponses: Record<number, string> = {};
        employeeTasks.forEach(task => {
          if (task.response) {
            initialResponses[task.id] = task.response;
          }
        });
        setResponses(initialResponses);
        
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load employee tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeTasks();
  }, [employeeId, employeeName, groupName]);

  const handleResponseChange = (taskId: number, value: string) => {
    setResponses(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  const handleSaveResponse = async (taskId: number) => {
    const response = responses[taskId];
    if (!response || response.trim() === '') {
      toast.error('Please provide a response before saving');
      return;
    }

    try {
      setSavingStates(prev => ({ ...prev, [taskId]: true }));
      
      await groupLeadService.saveTaskResponse(taskId, response);
      
      // Update the task in local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, response, status: 'completed' }
            : t
        )
      );
      
      toast.success('Response saved successfully');
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save response');
    } finally {
      setSavingStates(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const getTaskStatus = (task: Task) => {
    if (task.status === 'completed' || (task.response && task.response.trim() !== '')) {
      return { icon: CheckCircle, text: 'Completed', color: 'text-green-600' };
    }
    
    if (task.status === 'overdue') {
      return { icon: AlertCircle, text: 'Overdue', color: 'text-red-600' };
    }
    
    return { icon: Clock, text: 'Pending', color: 'text-amber-600' };
  };

  const getResponseInputType = (question: string) => {
    // Simple logic to determine input type based on question content
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('yes') && lowerQuestion.includes('no')) {
      return 'select';
    }
    return 'textarea';
  };

  // Pagination
  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, tasks.length);
  const currentTasks = tasks.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading tasks...</p>
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

  const completedTasks = tasks.filter(task => 
    task.status === 'completed' || (task.response && task.response.trim() !== '')
  ).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-3xl font-bold">{employeeName}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{groupName}</span>
            </div>
            <span>•</span>
            <span>{completedTasks} of {tasks.length} tasks completed</span>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Task Progress</h3>
            <div className="text-sm text-muted-foreground">
              {Math.round((completedTasks / tasks.length) * 100)}% Complete
            </div>
          </div>
          <div className="w-full bg-muted/40 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Questions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-80">Response</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No tasks found for this employee</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentTasks.map((task, index) => {
                  const statusInfo = getTaskStatus(task);
                  const globalIndex = startIndex + index + 1;
                  const inputType = getResponseInputType(task.questionText || '');
                  const isCompleted = task.status === 'completed' || (task.response && task.response.trim() !== '');
                  const isSaving = savingStates[task.id];

                  return (
                    <TableRow key={task.id}>
                      {/* Question Number */}
                      <TableCell className="font-medium text-center">
                        {globalIndex}
                      </TableCell>

                      {/* Question Text */}
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm leading-relaxed">
                            {task.questionText || 'Question text not available'}
                          </p>
                          {task.complianceDay && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: Day {task.complianceDay}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Response Input */}
                      <TableCell>
                        <div className="space-y-2">
                          {inputType === 'select' ? (
                            <select
                              value={responses[task.id] || ''}
                              onChange={(e) => handleResponseChange(task.id, e.target.value)}
                              className="w-full p-2 border rounded-md bg-background text-sm"
                              disabled={isCompleted}
                            >
                              <option value="">Select response...</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          ) : (
                            <textarea
                              value={responses[task.id] || ''}
                              onChange={(e) => handleResponseChange(task.id, e.target.value)}
                              placeholder="Enter your response..."
                              className="w-full p-2 border rounded-md bg-background text-sm resize-none"
                              rows={3}
                              disabled={isCompleted}
                            />
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                          <statusInfo.icon size={16} />
                          <span className="text-sm font-medium">{statusInfo.text}</span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        {!isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveResponse(task.id)}
                            disabled={isSaving || !responses[task.id]?.trim()}
                            className="flex items-center gap-2"
                          >
                            {isSaving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : (
                              <Save size={14} />
                            )}
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                        {isCompleted && (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {endIndex} of {tasks.length} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={i === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(i)}
                      className="min-w-[40px]"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupLeadTaskDetailPage;
