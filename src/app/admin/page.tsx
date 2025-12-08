'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageSquare, Clock, User, AlertCircle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { adminService } from '../services/api';
import { AdminDashboardCount, DailyDashboardCount } from '../types';

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

const ProgressRing = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="transform -rotate-90 w-32 h-32">
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="64"
          cy="64"
          r="40"
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">of {max}</span>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalDepartments: 0,
    totalQuestions: 0,
    totalLabs: 0
  });

  const [dashboardCount, setDashboardCount] = useState<AdminDashboardCount>();
  const [employessCount, setEmployessCount] = useState<AdminDashboardCount>();
  const [dailyDashboard, setDailyDashboard] = useState<DailyDashboardCount>();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const totalGroups = await adminService.getGroupsCount();
        const totalQuestions = await adminService.getQuestionsCount();
        const totalDepartments = await adminService.getDepartmentCount();
        const totalLabs = await adminService.getLabsCount();
        setStats({
          totalGroups,
          totalDepartments,
          totalQuestions,
          totalLabs
        });

        const dailyData = await adminService.getOnboardingDailyCount();
        setDailyDashboard(dailyData);

        const tasksData = await adminService.getTaskCountForAdmin();
        setDashboardCount(tasksData);

        const empData = await adminService.getEmployeeCountForAdmin();
        setEmployessCount(empData);

      } catch (err: any) {
        console.error(err.response?.data?.message || 'Failed to load dashboard data');
      }
    };

    fetchStats();
  }, []);

  const totalGroupsCount = useCountUp(stats.totalGroups);
  const totalDepartmentsCount = useCountUp(stats.totalDepartments);
  const totalQuestionsCount = useCountUp(stats.totalQuestions);
  const totalLabsCount = useCountUp(stats.totalLabs);

  // Calculate percentages for visual representation with safety checks
  const taskCompletionRate = dashboardCount?.total
    ? Math.round((dashboardCount.completedCount / dashboardCount.total) * 100)
    : 0;
  const employeeActiveRate = employessCount?.total
    ? Math.round(((employessCount.total - employessCount.overdueCount) / employessCount.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor your organization's performance at a glance</p>
          </div>
        </div>

        {/* Top Stats Cards */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Groups Card */}
          <div className="relative bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1">Total Groups</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalGroupsCount}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
            </div>
          </div>

          {/* Total Questions Card */}
          <div className="relative bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm tracking-wider text-purple-600 dark:text-purple-400 font-semibold mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalQuestionsCount}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"></div>
            </div>
          </div>

          {/* Total Departments Card */}
          <div className="relative bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm tracking-wider text-green-600 dark:text-green-400 font-semibold mb-1">Total Departments</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalDepartmentsCount}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
            </div>
          </div>

          {/* Total Labs Card */}
          <div className="relative bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm tracking-wider text-orange-600 dark:text-orange-400 font-semibold mb-1">Total Labs</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalLabsCount}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Onboarding Daily Snapshot - Full Width */}
          <div className="col-span-full bg-card rounded-2xl shadow-xl border border-border/50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Onboarding Daily Snapshot</h3>
                  <p className="text-sm text-muted-foreground">Today, {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Daily Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* New Employee Profiles Card */}
              <div className="relative bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1">New Employee Profiles</p>
                      <p className="text-4xl font-bold text-slate-800 dark:text-white">{dailyDashboard?.employeesAdded || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Onboarding Completed Card */}
              <div className="relative bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm tracking-wider text-green-600 dark:text-green-400 font-semibold mb-1">Onboarding Completed</p>
                      <p className="text-4xl font-bold text-slate-800 dark:text-white">{dailyDashboard?.tasksClosed || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's New Joinees Card */}
              <div className="relative bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm tracking-wider text-purple-600 dark:text-purple-400 font-semibold mb-1">Today's New Joinees</p>
                      <p className="text-4xl font-bold text-slate-800 dark:text-white">{dailyDashboard?.joiningToday || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Joiners – Pending Tasks Card */}
              <div className="relative bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm tracking-wider text-orange-600 dark:text-orange-400 font-semibold mb-1">Today's Joiners – Pending Tasks</p>
                      <p className="text-4xl font-bold text-slate-800 dark:text-white">{dailyDashboard?.pendingTasks || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Overview Card */}
          <div className="lg:col-span-1 bg-card rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Employee Overview</h3>
                <p className="text-sm text-muted-foreground">{employessCount?.total || 0} total employees</p>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <ProgressRing
                value={employessCount?.completedCount || 0}
                max={employessCount?.total || 1}
                color="#10b981"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-card-foreground">In Progress</span>
                </div>
                <span className="text-lg font-bold text-amber-600">{employessCount?.pendingCount || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-card-foreground">Overdue</span>
                </div>
                <span className="text-lg font-bold text-red-600">{employessCount?.overdueCount || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-card-foreground">Completed</span>
                </div>
                <span className="text-lg font-bold text-green-600">{employessCount?.completedCount || 0}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-card-foreground font-medium">On Time Completion Rate </span>
                <span className="text-blue-600 font-bold">{employeeActiveRate}%</span>
              </div>
              <div className="mt-2 bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${employeeActiveRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tasks Overview Card */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Tasks Overview</h3>
                  <p className="text-sm text-muted-foreground">{dashboardCount?.total || 0} total tasks</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{taskCompletionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full mb-2">
                  <User className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{dashboardCount?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-2">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{dashboardCount?.pendingCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">In Progress</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-2">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{dashboardCount?.overdueCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Overdue</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{dashboardCount?.completedCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
            </div>

            {/* Task Status Distribution (moved from separate card) */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-md font-bold text-foreground mb-4">Task Status Distribution</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">Completed Tasks</span>
                    <span className="text-sm font-bold text-green-600">{dashboardCount?.completedCount || 0} / {dashboardCount?.total || 0}</span>
                  </div>
                  <div className="bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardCount?.total ? (dashboardCount.completedCount / dashboardCount.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">In Progress Tasks</span>
                    <span className="text-sm font-bold text-amber-600">{dashboardCount?.pendingCount || 0} / {dashboardCount?.total || 0}</span>
                  </div>
                  <div className="bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardCount?.total ? (dashboardCount.pendingCount / dashboardCount.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">Overdue Tasks</span>
                    <span className="text-sm font-bold text-red-600">{dashboardCount?.overdueCount || 0} / {dashboardCount?.total || 0}</span>
                  </div>
                  <div className="bg-muted rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${dashboardCount?.total ? (dashboardCount.overdueCount / dashboardCount.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Groups Overview Section - Full Width Enhanced Design */}
          {dashboardCount?.groupData && dashboardCount.groupData.length > 0 && (
            <div className="col-span-full bg-gradient-to-br from-card to-card/50 rounded-2xl shadow-xl border border-border/50 overflow-hidden">
              {/* Header Section */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-xl shadow-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        Groups Overview
                      </h3>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-center px-3 py-1.5 bg-card rounded-lg border border-border/50 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10">
                      <p className="text-xs">Total Groups</p>
                      <p className="text-lg font-bold text-foreground">{dashboardCount.groupData.length}</p>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-card rounded-lg border border-border/50 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10">
                      <p className="text-xs">Avg. Compliance</p>
                      <p className="text-lg font-bold text-green-600">
                        {Math.round(dashboardCount.groupData.reduce((acc, g) => acc + (g.total > 0 ? ((g.total - g.overdueCount) / g.total) * 100 : 0), 0) / dashboardCount.groupData.length)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto p-2">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-purple-500/10">
                      <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Group
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Group Head
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Total Tasks
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        On Time
                      </th>
                      <th className="text-center py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Overdue
                      </th>
                      <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Compliance Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardCount.groupData.map((group, index) => {
                      const compliance = group.total > 0
                        ? Math.round(((group.total - group.overdueCount) / group.total) * 100)
                        : 0;
                      const onTime = group.total - group.overdueCount;

                      let complianceColor = 'from-green-500 to-emerald-500';
                      let complianceBg = 'bg-green-50 dark:bg-green-950/20';
                      let complianceText = 'text-green-700 dark:text-green-400';
                      let complianceBadge = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';

                      if (compliance < 70) {
                        complianceColor = 'from-red-500 to-pink-500';
                        complianceBg = 'bg-red-50 dark:bg-red-950/20';
                        complianceText = 'text-red-700 dark:text-red-400';
                        complianceBadge = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                      } else if (compliance < 80) {
                        complianceColor = 'from-orange-500 to-amber-500';
                        complianceBg = 'bg-orange-50 dark:bg-orange-950/20';
                        complianceText = 'text-orange-700 dark:text-orange-400';
                        complianceBadge = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
                      }

                      return (
                        <tr
                          key={index}
                          className="border-b border-border/50 hover:bg-muted/30 transition-all duration-200 group"
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center border border-indigo-500/30">
                                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <span className="text-sm font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {group.groupName}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{group.groupHead}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-sm font-bold border border-indigo-200 dark:border-indigo-800">
                                {group.total}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm font-bold border border-green-200 dark:border-green-800">
                                {onTime}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex justify-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-800">
                                {group.overdueCount}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-4">
                              <span className={`inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1.5 rounded-lg ${complianceBadge} text-sm font-bold border border-current/20`}>
                                {compliance}%
                              </span>
                              <div className="flex-1 min-w-[140px] max-w-[220px]">
                                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
                                  <div
                                    className={`bg-gradient-to-r ${complianceColor} h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                    style={{ width: `${compliance}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Department Distribution Chart - Full Width */}
          {dashboardCount?.departmentData && dashboardCount.departmentData.length > 0 && (
            <div className="col-span-full bg-card rounded-2xl shadow-xl border border-border/50 p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Department-Wise Pending Tasks</h3>
                  <p className="text-sm text-muted-foreground">Pending tasks assigned across departments</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Donut Chart */}
                <div className="flex justify-center">
                  <div className="relative w-72 h-72">
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {(() => {
                        const total = dashboardCount.departmentData.reduce((sum, d) => sum + d.total, 0);
                        let cumulativePercent = 0;

                        const colors = [
                          '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
                          '#10b981', '#06b6d4', '#f97316', '#6366f1',
                          '#ef4444', '#14b8a6', '#a855f7', '#eab308'
                        ];

                        return dashboardCount.departmentData.map((dept, index) => {
                          if (dept.total === 0) return null;

                          const percentage = (dept.total / total) * 100;
                          const radius = 70;
                          const circumference = 2 * Math.PI * radius;
                          const strokeLength = (percentage / 100) * circumference;
                          const offset = -cumulativePercent * circumference / 100;

                          cumulativePercent += percentage;

                          return (
                            <circle
                              key={index}
                              cx="100"
                              cy="100"
                              r={radius}
                              fill="transparent"
                              stroke={colors[index % colors.length]}
                              strokeWidth="35"
                              strokeDasharray={`${strokeLength} ${circumference}`}
                              strokeDashoffset={offset}
                              className="transition-all duration-1000 ease-out"
                            />
                          );
                        });
                      })()}
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-4xl font-bold text-foreground">
                        {dashboardCount.departmentData.reduce((sum, d) => sum + d.total, 0)}
                      </span>
                      <span className="text-sm text-muted-foreground mt-1">Total Tasks</span>
                    </div>
                  </div>
                </div>

                {/* Compact Legend */}
                <div className="grid grid-cols-2 gap-2">
                  {dashboardCount.departmentData.map((dept, index) => {
                    const colors = [
                      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
                      '#10b981', '#06b6d4', '#f97316', '#6366f1',
                      '#ef4444', '#14b8a6', '#a855f7', '#eab308'
                    ];

                    const colorHex = colors[index % colors.length];

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: colorHex }}
                          ></div>
                          <span className="text-xs font-medium text-foreground truncate">
                            {dept.departmentName}
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold flex-shrink-0"
                          style={{ color: colorHex }}
                        >
                          {dept.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;