"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Button from "../../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

import { taskService } from "@/app/services/api";
import { Task, TaskQuestions } from "@/app/types";

import {
  ArrowLeft,
  User2,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";

const TaskDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<TaskQuestions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const taskId = params.id as string;

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const t = await taskService.getTaskById(taskId);
        setTask(t);
        setQuestions(t?.questionList ?? []);
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load task");
      } finally {
        setLoading(false);
      }
    };
    if (taskId) run();
  }, [taskId]);

  const totalTasks = questions.length;
  const completed = useMemo(
    () =>
      questions.filter(
        (q) => (q.status || "").toLowerCase() === "completed"
      ).length,
    [questions]
  );


  const isOverdue = (q: TaskQuestions) => {
    const done = (q.status || "").toLowerCase() === "completed";
    const due = "2025-08-08"; // support either spelling
    const dueDate = due ? new Date(due) : null;
    return !done && dueDate && dueDate.getTime() < Date.now();
  };

  const StatusPills: React.FC<{ q: TaskQuestions }> = ({ q }) => {
    const status = (q.status || "Pending").toLowerCase();
    const overdue = isOverdue(q);

    const base =
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

    const pending =
      "bg-muted/40 text-foreground/80 border border-border";
    const done =
      "bg-green-500/15 text-green-500 border border-green-500/20";
    const late =
      "bg-red-500/15 text-red-500 border border-red-500/20";

    return (
      <div className="flex items-center gap-2">
        <span className={`${base} ${status === "completed" ? done : pending}`}>
          {status === "completed" ? (
            <CheckCircle2 size={12} />
          ) : (
            <Clock size={12} />
          )}
          {status === "completed" ? "Completed" : "Pending"}
        </span>
        {overdue && (
          <span className={`${base} ${late}`}>
            <AlertCircle size={12} />
            Overdue
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-destructive mb-4">{error}</div>
          <Button onClick={() => router.push("/admin/tasks")}>
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-destructive">Task not found</div>
          <Button onClick={() => router.push("/admin/tasks")} className="mt-4">
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Top heading like the mock */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/tasks")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </Button>
        <h1 className="text-3xl font-bold">Employee Tasks</h1>
      </div>

      <p className="text-muted-foreground">
        Tasks for {task.employeeName} ({task.level}) – ID: {task.id}
      </p>

      {/* Summary / header card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User2 className="text-muted-foreground" size={18} />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {task.assignedTo || "Group Lead"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {completed} of {totalTasks} tasks completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalTasks}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <Button variant="outline" className="gap-2">
                <RefreshCw size={16} />
                Reassign
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compliance Day</TableHead>
                <TableHead>Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No questions found for this task.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      {q.questionId || q.questionId || `Q${q.id}`}
                      <div className="text-xs text-muted-foreground">
                        {q.response === "text" ? "Text" : "Yes/No"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusPills q={q} />
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {q.response && String(q.response).trim().length > 0
                        ? q.response
                        : "No response yet"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailsPage;
