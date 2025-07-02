'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import Button from '../components/ui/button';
import { Users, UserPlus, MessageSquare, Clock, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '../lib/utils';
import { useAnimation, animationClasses, staggerClasses } from '../lib/animations';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalQuestions: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isVisible = useAnimation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch groups to get total count and questions
        const groups = await adminService.getGroups();
        const totalGroups = groups.length;
        const totalQuestions = groups.reduce((sum: number, group: any) => sum + (group.question_count || 0), 0);
        
        // Fetch users count
        const usersResponse = await adminService.getUsers({ page: 1, per_page: 1 }); // Just get first page to see total
        const totalUsers = usersResponse.pagination?.total || 0;
        
        // Fetch tasks count and recent tasks
        const tasks = await adminService.getTasks();
        const totalTasks = tasks.length;
        
        // Debug: Log task data to see what we're working with
        console.log('Tasks data:', tasks);
        console.log('First task example:', tasks[0]);
        
        // Calculate task statistics
        const currentDate = new Date();
        const completedTasks = tasks.filter(task => {
          console.log(`Task ${task.id} status: "${task.status}"`);
          return task.status === 'completed';
        }).length;
        
        const pendingTasks = tasks.filter(task => {
          return task.status === 'pending';
        }).length;
        
        const overdueTasks = tasks.filter(task => {
          if (task.status !== 'pending') return false;
          
          const dueDate = new Date(task.due_date);
          const currentDate = new Date();
          
          // Compare only the date parts (ignore time)
          const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          
          const isOverdue = dueDateOnly < currentDateOnly;
          
          // Log first 5 overdue tasks to understand the pattern
          if (isOverdue && tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < currentDate).indexOf(task) < 5) {
            console.log(`OVERDUE Task ${task.id}:`, {
              status: task.status,
              due_date: task.due_date,
              due_date_parsed: dueDate.toISOString(),
              current_date: currentDate.toISOString(),
              employee: task.mock_employee_name,
              question: task.question?.substring(0, 50) + '...'
            });
          }
          
          return isOverdue;
        }).length;
        
        console.log('Task statistics:', {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks
        });
        
        // Debug logging
        console.log('Task Statistics Debug:', {
          totalTasks,
          completedTasks,
          pendingTasks, 
          overdueTasks,
          sampleTasks: tasks.slice(0, 3).map(t => ({ status: t.status, due_date: t.due_date }))
        });
        
        // Sort tasks by created_at and updated_at to get recent actions
        const sortedTasks = tasks.sort((a, b) => {
          const aTime = new Date(a.completed_at || a.updated_at || a.created_at).getTime();
          const bTime = new Date(b.completed_at || b.updated_at || b.created_at).getTime();
          return bTime - aTime;
        });
        
        // Get all recent actions (don't limit to 10 here since we'll paginate)
        const recentActions = sortedTasks;
        setRecentTasks(recentActions);
        
        setStats({
          totalGroups,
          totalUsers,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          totalQuestions
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Cleanup function (no auto-refresh)
    return () => {
      // No interval to clear
    };
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(recentTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentTasks = recentTasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      
      // Fetch groups to get total count and questions
      const groups = await adminService.getGroups();
      const totalGroups = groups.length;
      const totalQuestions = groups.reduce((sum: number, group: any) => sum + (group.question_count || 0), 0);
      
      // Fetch users count
      const usersResponse = await adminService.getUsers({ page: 1, per_page: 1 }); // Just get first page to see total
      const totalUsers = usersResponse.pagination?.total || 0;
      
      // Fetch tasks count and recent tasks
      const tasks = await adminService.getTasks();
      const totalTasks = tasks.length;
      
      // Debug: Log task data to see what we're working with
      console.log('Manual refresh - Tasks data:', tasks);
      
      // Calculate task statistics
      const currentDate = new Date();
      const completedTasks = tasks.filter(task => {
        return task.status === 'completed';
      }).length;
      
      const pendingTasks = tasks.filter(task => {
        return task.status === 'pending';
      }).length;
      
      const overdueTasks = tasks.filter(task => {
        if (task.status !== 'pending') return false;
        
        const dueDate = new Date(task.due_date);
        const currentDate = new Date();
        
        // Compare only the date parts (ignore time)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        
        const isOverdue = dueDateOnly < currentDateOnly;
        console.log(`Manual refresh - Task ${task.id}: status="${task.status}", due_date="${task.due_date}", due_date_only="${dueDateOnly.toDateString()}", current_date_only="${currentDateOnly.toDateString()}", isOverdue=${isOverdue}`);
        return isOverdue;
      }).length;
      
      console.log('Manual refresh - Task statistics:', {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks
      });
      
      // Debug logging
      console.log('Manual Refresh Task Statistics Debug:', {
        totalTasks,
        completedTasks,
        pendingTasks, 
        overdueTasks
      });
      
      // Sort tasks by created_at and updated_at to get recent actions
      const sortedTasks = tasks.sort((a, b) => {
        const aTime = new Date(a.completed_at || a.updated_at || a.created_at).getTime();
        const bTime = new Date(b.completed_at || b.updated_at || b.created_at).getTime();
        return bTime - aTime;
      });
      
      // Get all recent actions (don't limit to 10 here since we'll paginate)
      const recentActions = sortedTasks;
      setRecentTasks(recentActions);
      
      setStats({
        totalGroups,
        totalUsers,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        totalQuestions
      });
      
      console.log('Manual refresh completed successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to refresh dashboard data');
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
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 space-y-8 ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Header */}
      <div className={`flex justify-between items-start ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your onboarding system and track overall progress
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Groups - Clickable */}
        <Link href="/admin/groups">
          <Card className={`cursor-pointer transition-all duration-200 hover:scale-105 ${animationClasses.hoverLift} ${isVisible ? `${animationClasses.slideInUp} ${staggerClasses[0]}` : 'opacity-0'} hover:shadow-lg hover:border-blue-500/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                  <p className="text-2xl font-bold">{stats.totalGroups}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 opacity-70">Click to manage →</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Users size={20} className="text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Users - Clickable */}
        <Link href="/admin/users">
          <Card className={`cursor-pointer transition-all duration-200 hover:scale-105 ${animationClasses.hoverLift} ${isVisible ? `${animationClasses.slideInUp} ${staggerClasses[1]}` : 'opacity-0'} hover:shadow-lg hover:border-green-500/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 opacity-70">Click to manage →</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <UserPlus size={20} className="text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Questions - Clickable */}
        <Link href="/admin/groups">
          <Card className={`cursor-pointer transition-all duration-200 hover:scale-105 ${animationClasses.hoverLift} ${isVisible ? `${animationClasses.slideInUp} ${staggerClasses[2]}` : 'opacity-0'} hover:shadow-lg hover:border-purple-500/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold">{stats.totalQuestions}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 opacity-70">Click to manage →</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <MessageSquare size={20} className="text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Tasks - Clickable */}
        <Link href="/admin/employees">
          <Card className={`cursor-pointer transition-all duration-200 hover:scale-105 ${animationClasses.hoverLift} ${isVisible ? `${animationClasses.slideInUp} ${staggerClasses[3]}` : 'opacity-0'} hover:shadow-lg hover:border-orange-500/50`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <div className="flex justify-between text-xs mt-1 gap-2">
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {stats.completedTasks}
                    </span>
                    <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      {stats.pendingTasks}
                    </span>
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {stats.overdueTasks}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Click to manage</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-full">
                  <Clock size={20} className="text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Actions */}
      <Card className={`${animationClasses.hoverLift} ${isVisible ? `${animationClasses.slideInUp} ${staggerClasses[4]}` : 'opacity-0'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Actions
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={tasksPerPage}
                onChange={(e) => {
                  setTasksPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
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
          {recentTasks.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Employee</TableHead>
                      <TableHead className="py-2">Level</TableHead>
                      <TableHead className="py-2">Question</TableHead>
                      <TableHead className="py-2">Assignee</TableHead>
                      <TableHead className="py-2">Status</TableHead>
                      <TableHead className="py-2">Date</TableHead>
                      <TableHead className="py-2">Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTasks.map((task, index) => (
                      <TableRow 
                        key={task.id}
                        className={`${animationClasses.fadeIn} hover:bg-muted/50`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="py-2">
                          <div className="font-medium text-sm">{task.mock_employee_name}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              task.mock_employee_level === 'L1'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : task.mock_employee_level === 'L2'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : task.mock_employee_level === 'L3'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {task.mock_employee_level}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="max-w-xs truncate text-sm" title={task.question}>
                            {task.question}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-sm">{task.assignee_name}</TableCell>
                        <TableCell className="py-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : task.status === 'reassigned'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}
                          >
                            {task.status === 'completed' ? 'Completed' : 
                             task.status === 'reassigned' ? 'Reassigned' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(task.completed_at || task.updated_at || task.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {task.response ? (
                            <div className="max-w-xs truncate text-sm" title={task.response}>
                              {task.response}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, recentTasks.length)} of {recentTasks.length} actions
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
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent actions found</p>
              <p className="text-sm">Tasks will appear here as they are assigned or completed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
