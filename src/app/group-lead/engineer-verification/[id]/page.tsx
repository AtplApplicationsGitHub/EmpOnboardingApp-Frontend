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
  const commentInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const t = await taskService.getTaskByIdForVerification(taskId);
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
          }

          if (q.answer) {
            existingVerifications[q.id] = q.answer.toLowerCase() === "yes" ? "yes" : "no";
          }
          if (task.verifiedFreezeTask === true) {
            alreadyVerified.add(q.id);
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
  const handleCommentSave = (questionId: string, value: string) => {
    setComments((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    adminService.saveTaskVerification(Number(questionId), "comments", value);
  };

  const handleVerificationChange = (questionId: string, value: "yes" | "no") => {
    setVerifications((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    adminService.saveTaskVerification(Number(questionId), "answer", value.toUpperCase());

    // Focus on comment input if "no" is selected
    if (value === "no") {
      setTimeout(() => {
        commentInputRefs.current[questionId]?.focus();
      }, 0);
    }
  };
  // Check if submit button should be enabled
  const isSubmitEnabled = () => {
    // Check if task is already frozen/verified
    const isTaskFrozen = tasks.some((task: any) => task.verifiedFreezeTask === true);
    if (isTaskFrozen) return false; // Disable submit if already verified

    const allQuestions: string[] = [];
    tasks.forEach((task) => {
      (task.questionList ?? []).forEach((q) => {
        allQuestions.push(String(q.id));
      });
    });

    // Check if all questions have verification selected
    for (const qId of allQuestions) {
      if (verifiedQuestions.has(qId)) continue; // Skip already verified questions

      const verification = verifications[qId];
      if (!verification) return false; // No verification selected

      // If verification is "no", comments are mandatory
      if (verification === "no" && (!comments[qId] || comments[qId].trim() === "")) {
        return false;
      }
    }

    return allQuestions.length > 0;
  };

  const handleSubmit = async () => {
    try {
      const result = await taskService.verifiedFreezeTask(taskId);

      if (result) {
        toast.success("Verification submitted successfully!");
        setShowSubmitModal(false);
        await fetchTasks();
      } else {
        toast.error("Failed to submit verification. Please try again.");
        setShowSubmitModal(false);
      }
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      toast.error(error?.response?.data?.message || "Failed to submit task");
      setShowSubmitModal(false);
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
          <Button onClick={() => router.push("/group-lead/engineer-verification")}>
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
            onClick={() => router.push("/group-lead/engineer-verification")}
            className="mt-4"
          >
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/group-lead/engineer-verification")}
          className="flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>

      {tasks.map((t) => {
        console.log('Task Item:', t);
        const qList = t.questionList ?? [];

        return (
          <Card key={t.id}>
            <CardContent className="p-0">
              <Table>
                <TableHeader >
                  <TableRow className="table-heading-bg text-primary-gradient">
                    <TableHead>Question</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance Day</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Comments</TableHead>
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
                              ref={(el) => { commentInputRefs.current[questionId] = el; }}
                              value={comments[questionId] || ""}
                              onChange={(e) => handleCommentChange(questionId, e.target.value)}
                              disabled={verifiedQuestions.has(questionId)}
                              onBlur={(e) => handleCommentSave(questionId, e.target.value)}
                              placeholder="Enter comments..."
                              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${verifiedQuestions.has(questionId)
                                ? 'bg-gray-100 cursor-not-allowed border-gray-300 text-gray-600 opacity-80'
                                : 'bg-background border-input'
                                }`}
                            />
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
      {/* Submit Button */}

      {!tasks.some((task: any) => task.verifiedFreezeTask === true) && (
        <div className="flex justify-center py-6">
          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={!isSubmitEnabled()}
            className="px-8"
          >
            Submit
          </Button>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardContent className="pt-6">
              <p className="mb-4 text-md">
                Are you sure you want to submit? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-[#4c51bf] to-[#5a60d1]"
                >
                  Yes, Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};



export default EmployeeAcknowledgementDetail;