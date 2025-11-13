"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "../../../components/ui/table";;
import Button from "../../../components/ui/button"
import { archiveService, taskService } from "@/app/services/api";
import { Task, TaskQuestions } from "@/app/types";
import { ArrowLeft, User2, CheckCircle2, Clock, AlertCircle, Star } from "lucide-react";

// small progress pill
const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded bg-muted/40 overflow-hidden" aria-hidden>
      <div
        className="h-full bg-muted-foreground/60"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const ArchivedTaskDetails: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFeedbackTaskId, setOpenFeedbackTaskId] = useState<string | null>(
    null
  );

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await archiveService.getArchiveTaskById(id as string);
      setTasks(Array.isArray(data) ? data : [data]);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load archived task");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);


  const StatusPills: React.FC<{ q: TaskQuestions }> = ({ q }) => {
    const status = (q.status || "Pending").toLowerCase();
    const overdue = q.overDueFlag;

    const base =
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
    const pending = "bg-muted/40 text-foreground/80 border border-border";
    const done = "bg-green-500/15 text-green-500 border border-green-500/20";
    const late = "bg-red-500/15 text-red-500 border border-red-500/20";

    return (
      <div className="flex items-center gap-2">
        <span className={`${base} ${status === "completed" ? done : pending}`}>
          {status === "completed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {status === "completed" ? "Completed" : "Pending"}
        </span>
        {overdue && (
          <span className={`${base} ${late}`}>
            <AlertCircle size={12} /> Overdue
          </span>
        )}
      </div>
    );
  };

  const toggleFeedbackTooltip = (taskId: string) => {
    setOpenFeedbackTaskId((prev) => (prev === taskId ? null : taskId));
  };

  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={() => router.push("/admin/archived-employees")}>
          Back
        </Button>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive">No tasks found</div>
        <Button onClick={() => router.push("/admin/archived-employees")}>
          Back
        </Button>
      </div>
    );
  }

  const firstTask = tasks[0];
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/archived-employees")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <h3 className="text-xl font-semibold">
          Archived Tasks — {firstTask.employeeName} ({firstTask.level}) — {tasks.length} task
          {tasks.length === 1 ? "" : "s"} - {firstTask.department} - {firstTask.role} - {firstTask.doj}
        </h3>
      </div>

      {/* Task Cards */}
      {tasks.map((task) => {
        const qList = task.questionList ?? [];
        const totalQuestions = qList.length;
        const completedQuestions = qList.filter((q) => (q.status || "").toLowerCase() === "completed").length;
        const pct = totalQuestions ? Math.round((completedQuestions / totalQuestions) * 100) : 0;

        return (
          <Card key={task.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User2 className="text-muted-foreground" size={18} />
                  </div>
                  <CardTitle className="text-xl">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {task.groupName} - {task.id} - {task.assignedTo}
                      </span>

                      <div className="relative" data-fb-trigger>
                        <button
                          type="button"
                          onClick={() => toggleFeedbackTooltip(String(task.id))}
                          className="flex items-center gap-1 focus:outline-none"
                          aria-label="Show feedback"
                          title="Show feedback"
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= Number(task?.efstar ?? 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                            />
                          ))}
                        </button>

                        {openFeedbackTaskId === String(task.id) && (
                          <div className="absolute z-50 top-full mt-2 left-0 w-72 rounded-lg border border-border bg-card shadow-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">Feedback</span>
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:underline"
                                onClick={() => setOpenFeedbackTaskId(null)}
                              >
                                Close
                              </button>
                            </div>
                            <div className="text-sm whitespace-pre-wrap">
                              {task.feedback && task.feedback.trim().length > 0
                                ? task.feedback
                                : <span className="text-muted-foreground">No comments.</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {completedQuestions}/{totalQuestions}
                  </div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
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
                  {qList.map((q: TaskQuestions) => (
                    <TableRow key={q.id ?? q.questionId}>
                      <TableCell>{q.questionId}</TableCell>
                      <TableCell>
                        <StatusPills q={q} />
                      </TableCell>
                      <TableCell>{q.complianceDay ?? "—"}</TableCell>
                      <TableCell>{q.response && q.response.trim().length > 0 ? q.response : "No response"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ArchivedTaskDetails;