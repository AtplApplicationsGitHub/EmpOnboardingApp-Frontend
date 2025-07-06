'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
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
import { CheckCircle, Clock, AlertCircle, User, ArrowLeft, RefreshCcw } from 'lucide-react';
import TaskReassignModal from '../../../components/TaskReassignModal';
import toast from 'react-hot-toast';
import { useAnimation, animationClasses, staggerClasses } from '../../../lib/animations';
import { formatDateTime } from '../../../lib/utils';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface GroupLeaderTasks {
  groupLeaderId: number;
  groupLeaderName: string;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
}

const EmployeeTaskDetailsPage: React.FC = () => {
  const params = useParams();
  const employeeId = params.employeeId as string;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employee, setEmployee] = useState<{ id: string; name: string; level: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reassignment modal state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedTasksForReassign, setSelectedTasksForReassign] = useState<Task[]>([]);

  const isVisible = useAnimation();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await adminService.getTasks();
        
        // Filter tasks for this specific employee
        const employeeTasks = tasksData.filter(task => 
          task.mock_employee_id === employeeId || 
          task.mock_employee_name === employeeId
        );
        
        if (employeeTasks.length > 0) {
          setEmployee({
            id: employeeTasks[0].mock_employee_id,
            name: employeeTasks[0].mock_employee_name,
            level: employeeTasks[0].mock_employee_level
          });
        }
        
        setTasks(employeeTasks);
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Failed to load tasks');
        console.error('Tasks fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (employeeId) {
      fetchTasks();
    }
  }, [employeeId]);

  // Group tasks by group leader
  const groupTasksByGroupLeader = (tasks: Task[]): GroupLeaderTasks[] => {
    const groupLeaderMap = new Map<number, GroupLeaderTasks>();

    tasks.forEach(task => {
      if (!groupLeaderMap.has(task.assignee_id)) {
        groupLeaderMap.set(task.assignee_id, {
          groupLeaderId: task.assignee_id,
          groupLeaderName: task.assignee_name,
          tasks: [],
          completedTasks: 0,
          totalTasks: 0
        });
      }

      const groupLeaderTasks = groupLeaderMap.get(task.assignee_id)!;
      groupLeaderTasks.tasks.push(task);
      groupLeaderTasks.totalTasks++;
      
      if (task.status === 'completed') {
        groupLeaderTasks.completedTasks++;
      }
    });

    return Array.from(groupLeaderMap.values())
      .sort((a, b) => a.groupLeaderName.localeCompare(b.groupLeaderName));
  };

  const handleReassignGroupLeaderTasks = (groupLeader: GroupLeaderTasks) => {
    // Get all pending tasks for this group leader
    const pendingTasks = groupLeader.tasks.filter(task => task.status === 'pending');
    
    if (pendingTasks.length === 0) {
      toast.error('No pending tasks to reassign for this group leader.');
      return;
    }
    
    setSelectedTasksForReassign(pendingTasks);
    setIsReassignModalOpen(true);
  };

  const handleReassignSuccess = async () => {
    // Refresh the tasks data after successful reassignment
    setIsReassignModalOpen(false);
    setSelectedTasksForReassign([]);
    
    // Re-fetch tasks
    try {
      const tasksData = await adminService.getTasks();
      const employeeTasks = tasksData.filter(task => 
        task.mock_employee_id === employeeId || 
        task.mock_employee_name === employeeId
      );
      setTasks(employeeTasks);
      toast.success('Task reassigned successfully');
    } catch (err) {
      console.error('Error refreshing tasks:', err);
    }
  };

  const handleCloseReassignModal = () => {
    setIsReassignModalOpen(false);
    setSelectedTasksForReassign([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'reassigned':
        return <RefreshCcw className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'pending':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'reassigned':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  };

  const isTaskOverdue = (task: Task) => {
    if (task.status !== 'pending') return false;
    const dueDate = new Date(task.due_date);
    const currentDate = new Date();
    
    // Compare only the date parts (ignore time)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    return dueDateOnly < currentDateOnly;
  };

  if (loading) {
    return (
      <div className={`p-8 ${animationClasses.fadeIn}`}>
        <div className="flex items-center justify-center py-12">
          <div className={`text-muted-foreground flex items-center gap-2 ${animationClasses.pulse}`}>
            <div className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${animationClasses.spin}`}></div>
            Loading employee tasks...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${animationClasses.fadeIn}`}>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Link href="/admin/tasks">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className={`p-8 ${animationClasses.fadeIn}`}>
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">Employee not found</div>
          <Link href="/admin/tasks">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const groupedTasks = groupTasksByGroupLeader(tasks);

  return (
    <div className={`p-8 space-y-8 ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <Link href="/admin/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Employee Tasks</h1>
            <p className="text-muted-foreground mt-2">
              Tasks for {employee.name} ({employee.level}) - ID: {employee.id}
            </p>
          </div>
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

      {/* Tasks grouped by Group Leader */}
      {groupedTasks.length === 0 ? (
        <Card className={`${animationClasses.fadeIn}`}>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
            <p className="text-muted-foreground">
              This employee doesn't have any tasks assigned yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedTasks.map((groupLeader, groupIndex) => {
            const staggerClass = staggerClasses[groupIndex % staggerClasses.length];
            const animationClass = isVisible ? animationClasses.slideInUp + ' ' + staggerClass : 'opacity-0';
            const cardClassName = animationClasses.hoverLift + ' ' + animationClass;
            
            return (
              <Card 
                key={groupLeader.groupLeaderId}
                className={cardClassName}
              >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{groupLeader.groupLeaderName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {groupLeader.completedTasks} of {groupLeader.totalTasks} tasks completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{groupLeader.totalTasks}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    {groupLeader.tasks.some(task => task.status === 'pending') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReassignGroupLeaderTasks(groupLeader)}
                        className="flex items-center gap-2"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Reassign
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2">Question</TableHead>
                        <TableHead className="py-2">Status</TableHead>
                        <TableHead className="py-2">Compliance Day</TableHead>
                        <TableHead className="py-2">Response</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupLeader.tasks.map((task, taskIndex) => (
                        <TableRow 
                          key={task.id}
                          className={`${animationClasses.fadeIn} hover:bg-muted/50 ${isTaskOverdue(task) ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                          style={{ animationDelay: `${taskIndex * 50}ms` }}
                        >
                          <TableCell className="py-3">
                            <div className="max-w-md">
                              <div className="font-medium text-sm truncate" title={task.question}>
                                {task.question}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {task.response_type === 'yes_no' ? 'Yes/No' : 'Text Response'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(task.status)}
                              <span className={getStatusBadge(task.status)}>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </span>
                              {isTaskOverdue(task) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="text-sm">
                              {formatDateTime(task.due_date)}
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="max-w-xs">
                              {task.response ? (
                                <div className="text-sm">{task.response}</div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No response yet</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Task Reassignment Modal */}
      <TaskReassignModal
        isOpen={isReassignModalOpen}
        onClose={handleCloseReassignModal}
        onReassignSuccess={handleReassignSuccess}
        selectedTasks={selectedTasksForReassign}
        mode="bulk"
        userType="admin"
      />
    </div>
  );
};

export default EmployeeTaskDetailsPage;
