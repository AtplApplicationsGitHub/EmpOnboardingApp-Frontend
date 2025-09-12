"use client";

import React, { useState, useEffect } from "react";
import { taskService } from "../services/api";
import { GLDashboard, Task } from "../types";
import { Card, CardContent } from "../components/ui/card";
import { CheckCircle, Clock, AlertCircle, User } from "lucide-react";

const GroupLeadTaskPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<GLDashboard>();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const tasksData = await taskService.getDashboardForGL();
        setDashboard(tasksData);
                console.log("Fetched tasks data", tasksData);
        console.log("Fetched tasks data", dashboard);
      } catch (err: any) {
        setError(err.response?.data?.message ?? "Failed to load tasks");
        console.error("Tasks fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    const handleFocus = () => {
      fetchTasks();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);


  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading tasks...</div>
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

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Tasks</h1>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </p>
                <p className="text-2xl font-bold">{dashboard?.totalEmployees}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <User size={20} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Tasks
                </p>
                <p className="text-2xl font-bold text-yellow-500">
                  {dashboard?.totalPendingTasks}
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-full">
                <Clock size={20} className="text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed Tasks
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {dashboard?.totalCompletedTasks}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {dashboard?.overdueTasks}
                </p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertCircle size={20} className="text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupLeadTaskPage;
