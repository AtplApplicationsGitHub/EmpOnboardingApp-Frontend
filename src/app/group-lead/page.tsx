"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, User, ClipboardCheck, Activity, TrendingUp } from "lucide-react";
import { GLDashboard } from "../types";
import { taskService } from "../services/api";

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

const GroupLeadTaskPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<GLDashboard>();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasksData = await taskService.getDashboardForGL();
        setDashboard(tasksData);
      } catch (err: any) {
        setError(err.response?.data?.message ?? "Failed to load tasks");
      }
    };

    fetchTasks();

    const handleFocus = () => fetchTasks();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const totalCount = useCountUp(dashboard?.totalTasks);
  const completedCount = useCountUp(dashboard?.totalCompletedTasks);
  const pendingCount = useCountUp(dashboard?.totalPendingTasks);
  const overdueCount = useCountUp(dashboard?.overdueTasks);
  const totalVerificationsCount = useCountUp(dashboard?.totalVerifications);
  const completedVerificationCount = useCountUp(dashboard?.completedVerificationCount);
  const pendingVerificationCount = useCountUp(dashboard?.pendingVerificationCount);
  const overdueVerificationCount = useCountUp(dashboard?.overdueVerificationCount);

  // Calculate percentages with safety checks
  const taskCompletionRate = dashboard?.totalTasks
    ? Math.round((dashboard.totalCompletedTasks / dashboard.totalTasks) * 100)
    : 0;
  const verificationCompletionRate = dashboard?.totalVerifications
    ? Math.round((dashboard.completedVerificationCount / dashboard.totalVerifications) * 100)
    : 0;

  // Error UI
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Task Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Monitor tasks and verifications at a glance</p>
          </div>
        </div>

        {/* Main Content Grid - Both Cards in Same Row */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Tasks Overview Card */}
          {totalCount > 0 && (
            <div className="bg-card rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Tasks Overview</h3>
                    <p className="text-sm text-muted-foreground">{totalCount} total tasks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{taskCompletionRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br  dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full mb-2">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-2">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20  rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-2">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{overdueCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Overdue</p>
                </div>
              </div>

              {/* Task Status Distribution */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-card-foreground mb-4">Task Status Distribution</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Completed Tasks</span>
                      <span className="text-sm font-bold text-green-600">{completedCount} / {totalCount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${dashboard?.totalTasks ? (dashboard.totalCompletedTasks / dashboard.totalTasks) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Pending Tasks</span>
                      <span className="text-sm font-bold text-amber-600">{pendingCount} / {totalCount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${dashboard?.totalTasks ? (dashboard.totalPendingTasks / dashboard.totalTasks) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Overdue Tasks</span>
                      <span className="text-sm font-bold text-red-600">{overdueCount} / {totalCount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${dashboard?.totalTasks ? (dashboard.overdueTasks / dashboard.totalTasks) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Verification Overview Card */}
          {totalVerificationsCount > 0 && (
            <div className="bg-card rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Verification Overview</h3>
                    <p className="text-sm text-muted-foreground">{totalVerificationsCount} total verifications</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-green-600">{verificationCompletionRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full mb-2">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalVerificationsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Verifications</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{completedVerificationCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20  rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-2">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{pendingVerificationCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20  rounded-xl">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-2">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{overdueVerificationCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Overdue</p>
                </div>
              </div>

              {/* Verification Status Distribution */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-card-foreground mb-4">Verification Status Distribution</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Completed Verifications</span>
                      <span className="text-sm font-bold text-green-600">{completedVerificationCount} / {totalVerificationsCount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${dashboard?.totalVerifications ? (dashboard.completedVerificationCount / dashboard.totalVerifications) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Pending Verifications</span>
                      <span className="text-sm font-bold text-amber-600">{pendingVerificationCount} / {totalVerificationsCount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${dashboard?.totalVerifications ? (dashboard.pendingVerificationCount / dashboard.totalVerifications) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Overdue Verifications</span>
                      <span className="text-sm font-bold text-red-600">{overdueVerificationCount} / {totalVerificationsCount}</span>
                    </div>
                    <div className="bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${dashboard?.totalVerifications ? (dashboard.overdueVerificationCount / dashboard.totalVerifications) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GroupLeadTaskPage;