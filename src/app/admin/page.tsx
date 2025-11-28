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

const useCountUp = (value: number | undefined, duration = 700) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!value) return;
    let start = 0;
    const increment = value / (duration / 16);
    const animate = () => {
      start += increment;
      if (start < value) {
        setCount(Math.floor(start));
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    animate();
  }, [value, duration]);

  return count;
};

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

  const isVisible = useAnimation();

  const totalGroupsCount = useCountUp(stats.totalGroups);
  const totalUsersCount = useCountUp(stats.totalUsers);
  const totalQuestionsCount = useCountUp(stats.totalQuestions);
  const totalTasksCount = useCountUp(stats.tasks);

  const cardData = [
    {
      label: "Total Groups",
      value: totalGroupsCount,
      icon: <Users className="w-4 h-4 text-white" />,
      gradient: "from-blue-500 to-blue-600",
      route: "/admin/groups",
    },
    {
      label: "Total Users",
      value: totalUsersCount,
      icon: <UserPlus className="w-4 h-4 text-white" />,
      gradient: "from-green-500 to-emerald-600",
      route: "/admin/users",
    },
    {
      label: "Total Questions",
      value: totalQuestionsCount,
      icon: <MessageSquare className="w-4 h-4 text-white" />,
      gradient: "from-purple-500 to-purple-600",
      route: "/admin/groups",
    },
    {
      label: "Total Tasks",
      value: totalTasksCount,
      icon: <Clock className="w-4 h-4 text-white" />,
      gradient: "from-orange-500 to-orange-600",
      route: null,
    },
  ];


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
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const totalPages = Math.ceil(recentTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const currentTasks = recentTasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
    <div className="space-y-2">
      <div className="mb-4 animate-fade-in">
        <h1 className="text-[17px] font-bold text-primary">
          Admin Dashboard
        </h1>
      </div>

      {/* Statistics Cards - Using CSS variables for automatic dark mode support */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">        {cardData.map((item, index) => {
        const CardWrapper = 'div';
        const wrapperProps = {};

        return (
          <CardWrapper key={index} {...wrapperProps}>
            <div
              className="bg-card border border-border rounded-lg shadow-lg p-4 
                hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 
                transition-all duration-300 relative overflow-hidden cursor-pointer"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-xl font-bold text-foreground 
      transition-transform duration-500 group-hover:scale-110">
                      {item.value}
                    </p>
                  </div>
                </div>

                <div className={`p-2 bg-gradient-to-br ${item.gradient} rounded-lg`}>
                  {item.icon}
                </div>
              </div>
            </div>
          </CardWrapper>
        );
      })}
      </div>
    </div>
  );
};

export default AdminDashboard;