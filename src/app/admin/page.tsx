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
import TaskReassignModal from '../components/TaskReassignModal';
import { Users, UserPlus, MessageSquare, Clock, Activity, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '../lib/utils';
import { useAnimation, animationClasses, staggerClasses } from '../lib/animations';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalUsers: 0,
    totalQuestions: 0,
    tasks: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reassignment modal state
  // const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  // const [selectedTasksForReassign, setSelectedTasksForReassign] = useState<any[]>([]);

  const isVisible = useAnimation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const totalGroups = await adminService.getGroupsCount();
        const totalQuestions = await adminService.getQuestionsCount();
        const totalUsers = await adminService.getUserCount();
        const tasks = await adminService.getTaskCount();

         setStats({
          totalGroups,
          totalUsers,
          totalQuestions,
          tasks
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
   }, []);

    

  // Pagination logic
  const totalPages = Math.ceil(recentTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentTasks = recentTasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  //unused refreshhhh
  // const handleManualRefresh = async () => {
  //   try {
  //     setLoading(true);
      
  //     const totalGroups = await adminService.getGroupsCount();
  //     const totalQuestions = await adminService.getQuestionsCount();
  //     const totalUsers = await adminService.getUserCount();
      
  //     // Fetch tasks count and recent tasks
  //     const tasks = await adminService.getTasks();
  //     const totalTasks = tasks.length;
      
  //     // Sort tasks by created_at and updated_at to get recent actions
  //     const sortedTasks = tasks.sort((a, b) => {
  //       const aTime = new Date(a.completed_at || a.updated_at || a.created_at).getTime();
  //       const bTime = new Date(b.completed_at || b.updated_at || b.created_at).getTime();
  //       return bTime - aTime;
  //     });
      
  //     // Get all recent actions (don't limit to 10 here since we'll paginate)
  //     const recentActions = sortedTasks;
  //     setRecentTasks(recentActions);
      
  //     setStats({
  //       totalGroups,
  //       totalUsers,
  //       totalTasks,
  //       totalQuestions
  //     });
      
  //     console.log('Manual refresh completed successfully');
  //   } catch (err: any) {
  //     setError(err.response?.data?.message || 'Failed to refresh dashboard data');
  //     console.error('Manual refresh error', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Reassignment handlers
  // const handleReassignTask = (task: any) => {
  //   // Only allow reassignment of pending tasks
  //   if (task.status !== 'pending') {
  //     return;
  //   }
    
  //   setSelectedTasksForReassign([task]);
  //   setIsReassignModalOpen(true);
  // };

  // const handleReassignSuccess = async () => {
  //   // Refresh the tasks data after successful reassignment
  //   await handleManualRefresh();
  // };

  // const handleCloseReassignModal = () => {
  //   setIsReassignModalOpen(false);
  //   setSelectedTasksForReassign([]);
  // };

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

        {/* Total Tasks - Non-clickable */}
        <Card className={`${animationClasses.hoverLift} ${isVisible ? `${animationClasses.slideInUp} ${staggerClasses[3]}` : 'opacity-0'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.tasks}</p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Clock size={20} className="text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      

      {/* Reassignment Modal */}
      {/* <TaskReassignModal
        isOpen={isReassignModalOpen}
        onClose={handleCloseReassignModal}
        onReassignSuccess={handleReassignSuccess}
        selectedTasks={selectedTasksForReassign}
        mode={selectedTasksForReassign.length === 1 ? 'single' : 'bulk'}
        userType="admin"
      /> */}
    </div>
  );
};

export default AdminDashboard;
