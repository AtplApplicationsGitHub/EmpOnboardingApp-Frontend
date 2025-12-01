'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageSquare, Clock, User, AlertCircle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { adminService } from '../services/api';
import { AdminDashboardCount } from '../types';

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
          className="text-gray-200"
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
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className="text-xs text-gray-500">of {max}</span>
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

  const [tasksCount, setTasksCount] = useState<AdminDashboardCount>();
  const [employessCount, setEmployessCount] = useState<AdminDashboardCount>();

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
        const tasksData = await adminService.getTaskCountForAdmin();
        setTasksCount(tasksData);

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
  const taskCompletionRate = tasksCount?.total
    ? Math.round((tasksCount.completedCount / tasksCount.total) * 100)
    : 0;
  const employeeActiveRate = employessCount?.total
    ? Math.round(((employessCount.total - employessCount.overdueCount) / employessCount.total) * 100)
    : 0;

  return (
    <div className="min-h-screen from-gray-50 to-gray-100">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">Monitor your organization's performance at a glance</p>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Groups</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalGroupsCount}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Questions</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalQuestionsCount}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Departments</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalDepartmentsCount}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Labs</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{totalLabsCount}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Overview Card */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Employee Overview</h3>
                <p className="text-sm text-gray-600">{employessCount?.total || 0} total employees</p>
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
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">In Progress</span>
                </div>
                <span className="text-lg font-bold text-amber-600">{employessCount?.pendingCount || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Overdue</span>
                </div>
                <span className="text-lg font-bold text-red-600">{employessCount?.overdueCount || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-lg font-bold text-green-600">{employessCount?.completedCount || 0}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">Active Rate</span>
                <span className="text-blue-600 font-bold">{employeeActiveRate}%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${employeeActiveRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tasks Overview Card */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Tasks Overview</h3>
                  <p className="text-sm text-gray-600">{tasksCount?.total || 0} total tasks</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{taskCompletionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full mb-2">
                  <User className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{tasksCount?.total || 0}</p>
                <p className="text-xs text-gray-600 mt-1">Total Tasks</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-2">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{tasksCount?.pendingCount || 0}</p>
                <p className="text-xs text-gray-600 mt-1">In Progress</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-2">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{tasksCount?.overdueCount || 0}</p>
                <p className="text-xs text-gray-600 mt-1">Overdue</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{tasksCount?.completedCount || 0}</p>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
            </div>

            {/* Task Status Distribution (moved from separate card) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-bold text-gray-800 mb-4">Task Status Distribution</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completed Tasks</span>
                    <span className="text-sm font-bold text-green-600">{tasksCount?.completedCount || 0} / {tasksCount?.total || 0}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${tasksCount?.total ? (tasksCount.completedCount / tasksCount.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">In Progress Tasks</span>
                    <span className="text-sm font-bold text-amber-600">{tasksCount?.pendingCount || 0} / {tasksCount?.total || 0}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${tasksCount?.total ? (tasksCount.pendingCount / tasksCount.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overdue Tasks</span>
                    <span className="text-sm font-bold text-red-600">{tasksCount?.overdueCount || 0} / {tasksCount?.total || 0}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${tasksCount?.total ? (tasksCount.overdueCount / tasksCount.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;