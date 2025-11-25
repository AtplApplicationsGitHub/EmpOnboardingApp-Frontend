"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { taskService } from "../services/api";
import { GLDashboard } from "../types";
import { CheckCircle, Clock, AlertCircle, User, ArrowRight } from "lucide-react";

// 🎯 Smooth Counter Animation Hook (correct usage)
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

  const cardData = [
    {
      label: "Total Tasks",
      value: totalCount,
      icon: <User className="w-7 h-7 text-white" />,
      gradient: "from-indigo-400 to-blue-500",
      route: "/tasks",
    },
    {
      label: "Completed Tasks",
      value: completedCount,
      icon: <CheckCircle className="w-7 h-7 text-white" />,
      gradient: "from-green-400 to-emerald-500",
      route: "/tasks/completed",
    },
    {
      label: "Pending Tasks",
      value: pendingCount,
      icon: <Clock className="w-7 h-7 text-white" />,
      gradient: "from-amber-400 to-orange-500",
      route: "/tasks/pending",
    },
    {
      label: "Overdue Tasks",
      value: overdueCount,
      icon: <AlertCircle className="w-7 h-7 text-white" />,
      gradient: "from-red-400 to-pink-500",
      route: "/tasks/overdue",
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
          <div className="text-muted-foreground animate-pulse">
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
        <h1 className="text-[17px] font-bold text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Task Dashboard
        </h1>

      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((item, index) => (
          <div key={index} className="group">
            <div
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-4 border border-slate-100 
              hover:shadow-2xl hover:-translate-y-1 transition-all hover:bg-white/95 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 bg-gradient-to-br ${item.gradient} rounded-xl shadow-md`}
                  >
                    {item.icon}
                  </div>

                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-600">
                      {item.label}
                    </p>
                    <p className="text-3xl font-extrabold text-slate-800 mt-1 transition-transform duration-500 group-hover:scale-110">
                      {item.value}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push(item.route)}
                  className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition shadow-sm"
                >
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-white/40 transition-all"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupLeadTaskPage;
