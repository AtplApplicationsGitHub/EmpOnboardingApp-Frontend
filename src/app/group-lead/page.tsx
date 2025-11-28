"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { taskService } from "../services/api";
import { GLDashboard } from "../types";
import { CheckCircle, Clock, AlertCircle, User, ArrowRight, ClipboardCheck } from "lucide-react";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<GLDashboard>();

  const totalCount = useCountUp(dashboard?.totalTasks);
  const completedCount = useCountUp(dashboard?.totalCompletedTasks);
  const pendingCount = useCountUp(dashboard?.totalPendingTasks);
  const overdueCount = useCountUp(dashboard?.overdueTasks);
  const totalVerificationsCount = useCountUp(dashboard?.totalVerifications);
  const completedVerificationCount = useCountUp(dashboard?.completedVerificationCount);
  const pendingVerificationCount = useCountUp(dashboard?.pendingVerificationCount);
  const overdueVerificationCount = useCountUp(dashboard?.overdueVerificationCount);

  const taskCards = [
    {
      label: "Tasks",
      value: totalCount,
      icon: <User className="w-5 h-5 text-white" />,
      gradient: "from-indigo-400 to-blue-500",
      route: "/tasks",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      gradient: "from-green-400 to-emerald-500",
      route: "/tasks/completed",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: <Clock className="w-5 h-5 text-white" />,
      gradient: "from-amber-400 to-orange-500",
      route: "/tasks/pending",
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      gradient: "from-red-400 to-pink-500",
      route: "/tasks/overdue",
    },
  ];

  const verificationCards = [
    {
      label: "Verification",
      value: totalVerificationsCount,
      icon: <ClipboardCheck className="w-5 h-5 text-white" />,
      gradient: "from-purple-400 to-violet-500",
      route: "/verification",
    },
    {
      label: "Completed",
      value: completedVerificationCount,
      icon: <CheckCircle className="w-5 h-5 text-white" />,
      gradient: "from-green-400 to-emerald-500",
      route: "/verification/completed",
    },
    {
      label: "Pending",
      value: pendingVerificationCount,
      icon: <Clock className="w-5 h-5 text-white" />,
      gradient: "from-amber-400 to-orange-500",
      route: "/verification/pending",
    },
    {
      label: "Overdue",
      value: overdueVerificationCount,
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      gradient: "from-red-400 to-pink-500",
      route: "/verification/overdue",
    },
  ];

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await taskService.getDashboardForGL();
        setDashboard(tasksData);
        console.log("Fetched GL Dashboard Data:", tasksData);
      } catch (err: any) {
        setError(err.response?.data?.message ?? "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    const handleFocus = () => fetchTasks();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Loading UI
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground flex items-center gap-2 animate-pulse">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading tasks...
          </div>
        </div>
      </div>
    );
  }

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
    <div className="space-y-2">
      <div className="mb-4 animate-fade-in">
        <h1 className="text-[17px] font-bold text-primary">
          Task Dashboard
        </h1>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {taskCards.map((item, index) => {
          const CardWrapper = item.route ? 'a' : 'div';
          const wrapperProps = item.route
            ? {
              href: item.route,
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                window.location.href = item.route;
              }
            }
            : {};

          return (
            <CardWrapper key={index} className="group block" {...wrapperProps}>
              <div
                className="bg-card border border-border rounded-2xl shadow-lg p-4 
                hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 
                transition-all duration-300 relative overflow-hidden cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 bg-gradient-to-br ${item.gradient} rounded-lg shadow-md 
                      group-hover:shadow-lg transition-shadow duration-300`}
                    >
                      {item.icon}
                    </div>

                    <div className="flex flex-col">
                      <p className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground 
                      transition-transform duration-500 group-hover:scale-110">
                        {item.value}
                      </p>
                    </div>
                  </div>

                  {item.route && (
                    <button
                      className="p-2 bg-secondary hover:bg-secondary/80 
                      rounded-full transition-colors duration-200 shadow-sm"
                    >
                      <ArrowRight className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Verification Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-3">
        {verificationCards.map((item, index) => {
          const CardWrapper = item.route ? 'a' : 'div';
          const wrapperProps = item.route
            ? {
              href: item.route,
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                window.location.href = item.route;
              }
            }
            : {};

          return (
            <CardWrapper key={index} className="group block" {...wrapperProps}>
              <div
                className="bg-card border border-border rounded-2xl shadow-lg p-4 
                hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 
                transition-all duration-300 relative overflow-hidden cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 bg-gradient-to-br ${item.gradient} rounded-lg shadow-md 
                      group-hover:shadow-lg transition-shadow duration-300`}
                    >
                      {item.icon}
                    </div>

                    <div className="flex flex-col">
                      <p className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground 
                      transition-transform duration-500 group-hover:scale-110">
                        {item.value}
                      </p>
                    </div>
                  </div>

                  {item.route && (
                    <button
                      className="p-2 bg-secondary hover:bg-secondary/80 
                      rounded-full transition-colors duration-200 shadow-sm"
                    >
                      <ArrowRight className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
};

export default GroupLeadTaskPage;