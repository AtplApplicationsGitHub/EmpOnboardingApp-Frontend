"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Button from "../../../components/ui/button";
import {
  Card,
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

import { adminService, taskService } from "@/app/services/api";
import { Task, TaskQuestions } from "@/app/types";

import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const qKey = (
  tId: string | number | undefined,
  qId: string | number | undefined
) => `${String(tId ?? "")}:${String(qId ?? "")}`;

const getInitialResp = (q: TaskQuestions) =>
  (q as any).answer ??
  (q as any).responseValue ??
  (q as any).userResponse ??
  (typeof q.response === "string" && q.response !== "text" ? q.response : "") ??
  "";

const isTextType = (q: TaskQuestions) =>
  String(q.responseType ?? "").toLowerCase() === "text";

const EmployeeAcknowledgementDetail: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const taskId = params.id as string;

  const [comments, setComments] = useState<Record<string, string>>({});
  const [verifications, setVerifications] = useState<Record<string, "yes" | "no" | null>>({});
  const [verifiedQuestions, setVerifiedQuestions] = useState<Set<string>>(new Set());

  const [respValues, setRespValues] = useState<Record<string, string>>({});
  const [respSaving, setRespSaving] = useState<Record<string, boolean>>({});

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const t = await taskService.getTaskById(taskId);
      console.log('Fetched Task Data:', t);
      const list: Task[] = Array.isArray(t) ? t : t ? [t] : [];
      setTasks(list);


      const existingComments: Record<string, string> = {};
      const existingVerifications: Record<string, "yes" | "no"> = {};
      const alreadyVerified = new Set<string>();

      list.forEach((task: any) => {
        (task.questionList ?? []).forEach((q: any) => {
          if (q.comments) {
            existingComments[q.id] = q.comments;
            alreadyVerified.add(q.id);

            if (q.answer) {
              existingVerifications[q.id] = q.answer.toLowerCase() === "yes" ? "yes" : "no";
            }
          }

        });
      });

      setComments(existingComments);
      setVerifications(existingVerifications);
      setVerifiedQuestions(alreadyVerified);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load task(s)");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const freezeTask = tasks[0]?.freezeTask;

  useEffect(() => {
    const map: Record<string, string> = {};
    tasks.forEach((task) => {
      (task.questionList ?? []).forEach((q) => {
        map[qKey(task.id, q.id)] = getInitialResp(q);
      });
    });
    setRespValues(map);
    setRespSaving({});
  }, [tasks]);

  const handleCommentChange = (questionId: string, value: string) => {
    setComments((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleVerificationChange = (questionId: string, value: "yes" | "no") => {
    setVerifications((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleVerify = async (questionId: string) => {
    try {
      const comment = comments[questionId];
      const verification = verifications[questionId];

      if (!comment || comment.trim() === "") {
        toast.error("Please enter a comment before verifying");
        return;
      }

      if (verification === null || verification === undefined) {
        toast.error("Please select Yes or No before verifying");
        return;
      }


      setLoading(true);

      const answer = verification.toUpperCase();
      // Debug logs
      console.log("Question ID being sent:", questionId);
      console.log("Comment being sent to BE:", comment);
      console.log("Verification being sent to BE:", answer);

      await adminService.saveVerificationComment(answer, Number(questionId), comment);

      setVerifiedQuestions(prev => new Set([...prev, questionId]));
      toast.success("Question verified successfully");

      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to verify question");
    } finally {
      setLoading(false);
    }
  };

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
          {status === "completed" ? (
            <CheckCircle2 size={12} />
          ) : (
            <Clock size={12} />
          )}
          {status === "completed" ? "Completed" : "Pending"}
        </span>
        {overdue === true && (
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
          <Button onClick={() => router.push("/admin/engineer-verification")}>
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-destructive">Task not found</div>
          <Button
            onClick={() => router.push("/admin/engineer-verification")}
            className="mt-4"
          >
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/engineer-verification")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </Button>
      </div>

      {tasks.map((t) => {
        console.log('Task Item:', t);
        const qList = t.questionList ?? [];

        return (
          <Card key={t.id}>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance Day</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead className="min-w-[150px]">Verification</TableHead>
                    <TableHead className="min-w-[250px]">Comments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={48} className="text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No questions found for this task.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    qList.map((q) => {
                      const questionId = String(q.id);
                      const key = qKey(t.id, q.id);
                      const initial = getInitialResp(q);
                      const value = respValues[key] ?? initial;

                      return (
                        <TableRow key={q.id ?? `${t.id}-${q.questionId}`}>
                          <TableCell className="font-medium">
                            {q.questionId || `Q${q.id}`}
                            <div className="text-xs text-muted-foreground">
                              {isTextType(q) ? "Text" : "Yes/No"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusPills q={q} />
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {q.complianceDay ?? (q as any).complainceDay ?? "—"}
                          </TableCell>

                          <TableCell>
                            <div className="w-full max-w-sm px-3 py-2 text-sm text-foreground">
                              {q.response ? q.response : "—"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant={verifications[questionId] === "yes" ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleVerificationChange(questionId, "yes")}
                                disabled={verifiedQuestions.has(questionId)}
                              >
                                Yes
                              </Button>
                              <Button
                                variant={verifications[questionId] === "no" ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleVerificationChange(questionId, "no")}
                                disabled={verifiedQuestions.has(questionId)}
                              >
                                No
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <input
                              type="text"
                              value={comments[questionId] || ""}
                              onChange={(e) => handleCommentChange(questionId, e.target.value)}
                              disabled={verifiedQuestions.has(questionId)}
                              placeholder="Enter comments..."
                              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${verifiedQuestions.has(questionId)
                                ? 'bg-gray-100 cursor-not-allowed border-gray-300 text-gray-600 opacity-80'
                                : 'bg-background border-input'
                                }`}
                            />
                          </TableCell>

                          <TableCell>
                            {comments[questionId] &&
                              comments[questionId].trim() !== "" &&
                              verifications[questionId] !== null &&
                              verifications[questionId] !== undefined && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleVerify(questionId)}
                                  disabled={verifiedQuestions.has(questionId)}
                                  className="rounded-lg bg-green-500 hover:bg-green-600 text-white"
                                  aria-label="Verify question"
                                >
                                  <CheckCircle size={16} className="mr-1" />
                                  {verifiedQuestions.has(questionId) ? "Verified" : "Verify"}
                                </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EmployeeAcknowledgementDetail;