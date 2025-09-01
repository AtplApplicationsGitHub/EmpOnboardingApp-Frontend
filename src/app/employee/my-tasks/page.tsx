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
  Clock,
  Send,
  Star,
  User2,
  Users,
} from "lucide-react";
import { Task } from "@/app/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { employeeService } from "@/app/services/api";
import { useAnimation, animationClasses } from "@/app/lib/animations";

const MyTasksPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const isVisible = useAnimation();


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
        const completed =
          qList.filter((q) => norm(q?.status) === "completed").length ?? 0;
        const pct = totalQuestions
          ? Math.round((completed / totalQuestions) * 100)
          : 0;

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
                        {t?.groupName ?? "Group"} — {t?.id ?? "—"} —{" "}
                        {t?.assignedTo ?? "Unassigned"}
                      </span>
                    </CardTitle>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{totalQuestions}</div>
                    <div className="text-xs text-muted-foreground">
                      Questions
                    </div>
                  </div>
                  <div className="min-w-[72px] text-center">
                    <div className="text-3xl font-bold">{pct}%</div>
                    <div className="text-xs text-muted-foreground">
                      Completed
                    </div>
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
                    <TableHead>Compliance Day</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qList.length === 0 ? (
                    <TableRow>
                      {/* match 5 headers */}
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={48} className="text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No questions found for this task.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    qList.map((q, idx) => {
                      const typeLabel =
                        norm(q?.responseType) === "text" ? "Text" : "Yes/No";
                      return (
                        <TableRow
                          key={
                            q?.id ??
                            (q?.questionId
                              ? `${t?.id}-${q.questionId}`
                              : `${t?.id}-row-${idx}`)
                          }
                        >
                          {/* Question */}
                          <TableCell className="font-medium">
                            {q?.questionId ?? (q?.id ? `Q${q.id}` : "—")}
                          </TableCell>

                          {/* Type */}
                          <TableCell className="text-muted-foreground">
                            {typeLabel}
                          </TableCell>

                          {/* Status */}
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

                          {/* Compliance Day */}
                          <TableCell className="text-muted-foreground">
                            {q?.complianceDay ??
                              // fallback for old field name
                              (q as any)?.complainceDay ??
                              "—"}
                          </TableCell>

                          {/* Response */}
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

      {/* Feedback Section */}
      <Card
        className={`${isVisible ? animationClasses.slideInUp : "opacity-0"}`}
        style={{ animationDelay: "400ms" }}
      >
        <CardHeader>
          <CardTitle>Feedback for {group.groupName}</CardTitle>
        </CardHeader>
        <CardContent>
          {group.feedback?.submitted ? (
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
                        star <= group.feedback!.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {group.feedback.comment}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Feedback submitted successfully
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Rating (1-5 stars)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
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
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Comments (optional)
                </label>
                <textarea
                  id="comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share your thoughts about this group's questions and answers..."
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback || feedbackRating === 0}
                className="flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minimal pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <Button
          disabled={currentPage <= 0}
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page <span className="font-semibold">{currentPage + 1}</span>
          {total ? (
            <span className="ml-2">
              • Total <span className="font-semibold">{total}</span>
            </span>
          ) : null}
        </div>
        <Button onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
      </div>
    </>
  );
};

export default MyTasksPage;
