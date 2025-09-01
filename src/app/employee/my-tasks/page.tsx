"use client";

import React, { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import Button from "../../components/Button";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Send,
  Star,
  User2,
  Users,
} from "lucide-react";
import { EmployeeFeedback, Task } from "@/app/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { employeeService } from "@/app/services/api";

const MyTasksPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [feedBack, setFeedBack] = useState<EmployeeFeedback | null>(null);

  const PAGE_SIZE = 10;

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeService.getMyTasks(currentPage);
      const list = response?.commonListDto ?? [];
      setTasks(Array.isArray(list) ? list : []);
      setTotal(Number(response?.totalElements ?? 0));
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("Fetched tasks:", list);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load task(s)");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // ✅ FIXED: no stray braces; populate local form from API result
  const fetchFeedback = useCallback(async (taskId: string) => {
    try {
      const response = await employeeService.getFeedBackByTask(taskId);
      setFeedBack(response ?? null);

      // Pre-fill form fields if feedback exists
      const starNum =
        typeof response?.star === "string"
          ? parseInt(response.star as unknown as string, 10) || 0
          : (response?.star as number) || 0;

      setFeedbackRating(starNum);
      setFeedbackComment(response?.feedback ?? "");
    } catch (e: any) {
      // If no feedback or error, clear to defaults
      setFeedBack(null);
      setFeedbackRating(0);
      setFeedbackComment("");
      // eslint-disable-next-line no-console
      console.error("Failed to fetch feedback:", e);
    }
  }, []);

  const norm = (s?: string | null) => (s ?? "").toLowerCase();

  const getStatusIcon = (status?: string | null) => {
    switch (norm(status)) {
      case "answered":
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      setSubmittingFeedback(true);
      if (feedbackRating === 0) {
        alert("Please provide a rating before submitting.");
        return;
      }
      if (!selectedTaskId) {
        alert("No task selected for feedback.");
        return;
      }
      const feedBackDTO = {
        task: String(selectedTaskId),
        star: String(feedbackRating),
        feedback: feedbackComment,
      };
      await employeeService.saveFeedBack(feedBackDTO);

      // Reflect success locally
      setFeedBack((prev) =>
        prev && prev.taskId === selectedTaskId
          ? { ...prev, star: feedbackRating, feedback: feedbackComment, completed: true }
          : ({
              taskId: selectedTaskId,
              star: feedbackRating,
              feedback: feedbackComment,
              completed: true,
            } as any)
      );

      setFeedbackRating(0);
      setFeedbackComment("");
      alert("Feedback submitted successfully!");
      setShowFeedbackModal(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (currentPage > 3) pages.push(0, "...");
      for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages - 2, currentPage + 2); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 4) pages.push("...", totalPages - 1);
      else if (currentPage < totalPages - 3) pages.push(totalPages - 1);
    }
    return pages;
  };

  const getStatusText = (status?: string | null) => {
    switch (norm(status)) {
      case "answered":
      case "completed":
        return "Answered";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status?: string | null) => {
    switch (norm(status)) {
      case "answered":
      case "completed":
        return "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30";
      case "pending":
        return "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30";
      default:
        return "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800";
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ✅ When modal opens for a given task, fetch existing feedback & prefill
  useEffect(() => {
    if (showFeedbackModal && selectedTaskId) {
      void fetchFeedback(selectedTaskId);
    }
  }, [showFeedbackModal, selectedTaskId, fetchFeedback]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  const handleStarClick = (rating: number) => {
    setFeedbackRating(rating);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchTasks}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tasks?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Your Tasks</CardTitle>
          </CardHeader>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <Users size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">No tasks found.</p>
              <Button onClick={fetchTasks} className="mt-2">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {tasks.map((t, tIdx) => {
        const qList = Array.isArray(t?.questionList) ? t.questionList : [];
        const totalQuestions = qList.length;
        const completed = qList.filter((q) => norm(q?.status) === "completed").length ?? 0;
        const pct = totalQuestions ? Math.round((completed / totalQuestions) * 100) : 0;

        return (
          <Card key={t?.id ?? `task-${tIdx}`} className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User2 className="text-muted-foreground" size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      <span className="font-semibold">
                        {t?.groupName ?? "Group"} — {t?.id ?? "—"} — {t?.assignedTo ?? "Unassigned"}
                      </span>
                    </CardTitle>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Feedback button */}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setSelectedTaskId(String(t?.id ?? ""));
                      setShowFeedbackModal(true);
                    }}
                  >
                    <Star className="w-4 h-4" />
                    Feedback
                  </Button>

                  <div className="text-center">
                    <div className="text-3xl font-bold">{totalQuestions}</div>
                    <div className="text-xs text-muted-foreground">Questions</div>
                  </div>
                  <div className="min-w-[72px] text-center">
                    <div className="text-3xl font-bold">{pct}%</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Compliance Day</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={48} className="text-muted-foreground" />
                          <p className="text-muted-foreground">No questions found for this task.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    qList.map((q, idx) => {
                      const typeLabel = norm(q?.responseType) === "text" ? "Text" : "Yes/No";
                      return (
                        <TableRow
                          key={
                            q?.id ??
                            (q?.questionId ? `${t?.id}-${q.questionId}` : `${t?.id}-row-${idx}`)
                          }
                        >
                          <TableCell className="font-medium">
                            {q?.questionId ?? (q?.id ? `Q${q.id}` : "—")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{typeLabel}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(q?.status)}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  q?.status
                                )}`}
                              >
                                {getStatusText(q?.status)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {t.lab ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {q?.complianceDay ?? (q as any)?.complainceDay ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {(() => {
                              const r = q?.response;
                              const s = r == null ? "" : String(r).trim();
                              return s.length > 0 ? s : "No response yet";
                            })()}
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Feedback for Task {selectedTaskId ?? "—"}</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowFeedbackModal(false)}
                className="ml-3"
              >
                Close
              </Button>
            </div>

            {feedBack?.completed ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Your Feedback:
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (Number(feedBack?.star ?? 0))
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {feedBack?.feedback || "No comments provided."}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Feedback submitted successfully
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rating (1–5 stars)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="focus:outline-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= feedbackRating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your thoughts about this group's questions and answers..."
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback || feedbackRating === 0 || !selectedTaskId}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingFeedback ? "Submitting..." : "Submit Feedback"}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className="p-2"
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="p-2"
                >
                  <ChevronLeft size={16} />
                </Button>
                {generatePageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === "..." ? (
                      <span className="px-3 py-2 text-muted-foreground">...</span>
                    ) : (
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="min-w-[40px]"
                      >
                        {(page as number) + 1}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2"
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MyTasksPage;
