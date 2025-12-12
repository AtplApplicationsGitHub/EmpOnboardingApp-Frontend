"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { adminService, taskService } from "@/app/services/api";
import { DropDownDTO, Task, TaskQuestions } from "@/app/types";

import {
  ArrowLeft,
  User2,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
  Star,
  Trash2,
} from "lucide-react";
import SearchableDropdown from "@/app/components/SearchableDropdown";
import toast from "react-hot-toast";

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

const TaskDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [primaryGroupLeadId, setPrimaryGroupLeadId] = useState<number | undefined>(undefined);
  const [primaryGroupLeadSelectedOption, setPrimaryGroupLeadSelectedOption] = useState<DropDownDTO[]>([]);
  const [reAssignTask, setReAssignTask] = useState<string>();
  const taskId = params.id as string;
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
  const [openFeedbackTaskId, setOpenFeedbackTaskId] = useState<string | null>(null);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | undefined>(undefined);
  const [deleteReason, setDeleteReason] = useState("");
  const deleteReasonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTasks();
  }, [taskId]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const t = await taskService.getTaskById(taskId);
      console.log("Fetched task:", t);
      const list: Task[] = Array.isArray(t) ? t : t ? [t] : [];
      setTasks(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load task(s)");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Async search function for group leads
  const searchGroupLeads = async (searchTerm: string): Promise<DropDownDTO[]> => {
    try {
      const results = await adminService.searchGroupLeads(searchTerm);
      return results;
    } catch (err: any) {
      console.error("Failed to search group leads:", err);
      return [];
    }
  };

  // Fetch group lead details by name
  const fetchGroupLeadDetails = async (name?: string): Promise<DropDownDTO | null> => {
    if (!name) return null;
    try {
      const results = await searchGroupLeads(name);
      return results.find((lead) => lead.key === name) || null;
    } catch (err) {
      console.error("Failed to fetch group lead details:", err);
      return null;
    }
  };

  const fetchLabsByDepartment = useCallback(
    async (deptId?: number, currentLab?: string) => {
      if (!deptId) {
        setLabOptions([]);
        return;
      }
      try {
        // Pass the department ID (number) to the API
        const labs = await adminService.getDepartmentLabs(deptId);

        // Transform labs
        const transformedLabs = labs.map(lab => ({
          ...lab,
          value: lab.value || lab.key
        }));

        setLabOptions(transformedLabs);

        // Set currently selected lab
        if (currentLab) {
          const matchingLab = transformedLabs.find(
            (lab) => lab.value === currentLab || lab.key === currentLab
          );
          if (matchingLab) {
            setSelectedLabId(matchingLab.id);
          }
        }
      } catch (error) {
        setLabOptions([]);
        toast.error("Failed to fetch labs for this department");
      }
    },
    []
  );

  const reassignTask = async () => {
    if (!reAssignTask) {
      setError("Missing task id to reassign.");
      return;
    }
    if (primaryGroupLeadId == null) {
      setError("Please select a group lead.");
      return;
    }

    try {
      await taskService.reassignTask(reAssignTask, primaryGroupLeadId);
      setShowReassignModal(false);
      setPrimaryGroupLeadId(undefined);
      setPrimaryGroupLeadSelectedOption([]);
      toast.success("Task reassigned successfully");
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reassign tasks");
      toast.error("Failed to reassign task");
    }
  };

  const employeeId = tasks[0]?.employeeId;
  const employeeName = tasks[0]?.employeeName;
  const employeeLevel = tasks[0]?.level;
  const department = tasks[0]?.department;
  const departmentId = tasks[0]?.departmentId;
  const role = tasks[0]?.role;
  const doj = tasks[0]?.doj;
  const lab = tasks[0]?.lab;
  const freezeTask = tasks[0]?.freezeTask;

  useEffect(() => {
    if (departmentId) {
      fetchLabsByDepartment(departmentId, lab);
    }
  }, [departmentId, lab, fetchLabsByDepartment]);

  const handleSaveLab = async (id?: number) => {
    setSelectedLabId(id);

    const selectedLab = labOptions.find((o) => o.id === id);

    if (!selectedLab) {
      toast.error("Invalid lab selection.");
      return;
    }

    if (!employeeId) {
      toast.error("Missing employee id.");
      return;
    }

    // Check if same lab
    if (selectedLab.value === lab || selectedLab.key === lab) {
      toast.success("Lab already up to date.");
      return;
    }

    try {
      // Call API with employeeId and labId
      await taskService.labAllocation(Number(employeeId), selectedLab.id);

      toast.success("Lab updated");
      await fetchTasks();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Failed to update lab allocation"
      );
      const prevId = labOptions.find((o) => o.value === lab || o.key === lab)?.id;
      setSelectedLabId(prevId);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      if (!questionToDelete) {
        toast.error("No question selected to delete.");
        return;
      }
      await taskService.deleteQuestion(questionToDelete, deleteReason);
      toast.success("Question deleted");
      setShowDeleteModal(false);
      setQuestionToDelete(undefined);
      setDeleteReason("");
      await fetchTasks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to delete question");
    }
  };

  const handleLabChange = useCallback(
    (value: number | number[] | undefined): void => {
      const id = Array.isArray(value) ? value[0] : value;
      void handleSaveLab(id);
    },
    [handleSaveLab]
  );

  const toggleFeedbackTooltip = useCallback((taskId: string) => {
    setOpenFeedbackTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  const overall = useMemo(() => {
    const totalQ = tasks.reduce((s, x) => s + (x.totalQuestions ?? 0), 0);
    const doneQ = tasks.reduce((s, x) => s + (x.completedQuestions ?? 0), 0);
    const pct = totalQ ? Math.round((doneQ / totalQ) * 100) : 0;
    return { totalQ, doneQ, pct };
  }, [tasks]);

  const StatusPills: React.FC<{ q: TaskQuestions }> = ({ q }) => {
    const status = (q.status || "Pending").toLowerCase();

    const base =
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";
    const pending = "bg-muted/40 text-foreground/80 border border-border";
    const done = "bg-green-500/15 text-green-500 border border-green-500/20";
    const late = "bg-red-500/15 text-red-500 border border-red-500/20";

    return (
      <div className="flex items-center gap-2">
        <span className={`${base} ${(status === "completed") ? done : (status === "overdue" ? late : pending)}`}>
          {status === "completed" ? (
            <CheckCircle2 size={12} />
          ) : status === "overdue" ? (
            <AlertCircle size={12} />
          ) : (
            <Clock size={12} />
          )}
          {status === "completed" ? "Completed" : status === "overdue" ? "Overdue" : "Pending"}
        </span>
      </div>
    );
  };

  // Open reassign modal and fetch current assignee details
  const openReassignModal = async (task: Task) => {
    setReAssignTask(task.id.toString());

    // Fetch current assignee details
    if (task.assignedTo) {
      const assigneeDetails = await fetchGroupLeadDetails(task.assignedTo);
      if (assigneeDetails) {
        setPrimaryGroupLeadId(assigneeDetails.id);
        setPrimaryGroupLeadSelectedOption([assigneeDetails]);
      } else {
        setPrimaryGroupLeadId(undefined);
        setPrimaryGroupLeadSelectedOption([]);
      }
    } else {
      setPrimaryGroupLeadId(undefined);
      setPrimaryGroupLeadSelectedOption([]);
    }

    setShowReassignModal(true);
  };
  useEffect(() => {
    if (showDeleteModal) {
      setTimeout(() => {
        deleteReasonInputRef.current?.focus();
      }, 100);
    }
  }, [showDeleteModal]);

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

  if (!tasks.length) {
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
    <div className="space-y-2">
      {/* page header */}

      <div className="flex items-center justify-between">

        <h3 className="text-xl font-semibold ml-2 text-primary">
          Tasks for {employeeName} ({employeeLevel})
        </h3>

        <div className="flex items-center gap-3">


          <div className="min-w-[240px]">
            <SearchableDropdown
              options={labOptions}
              value={selectedLabId}
              disabled={freezeTask === "Y"}
              onChange={handleLabChange}
              placeholder="Select Lab"
              displayFullValue={false}
              isEmployeePage={true}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/tasks")}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>

      </div>

      {/* one CARD per task */}
      {tasks.map((t) => {
        const qList = t.questionList ?? [];
        const totalTasks = qList.length;
        const completed = qList.filter(
          (q) => (q.status || "").toLowerCase() === "completed"
        ).length;
        const pct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

        return (
          <Card key={t.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User2 className="text-muted-foreground" size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      <span className="font-semibold">
                        {t.groupName} - {t.id} - {t.assignedTo}
                      </span>
                    </CardTitle>
                  </div>
                  <div>
                    <div className="relative" data-fb-trigger>
                      <button
                        type="button"
                        onClick={() => toggleFeedbackTooltip(String(t.id))}
                        className="flex items-center gap-1 focus:outline-none"
                        aria-label="Show feedback"
                        title="Show feedback"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Number(t?.efstar ?? 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </button>

                      {/* Tooltip */}
                      {openFeedbackTaskId === String(t.id) && (
                        <div
                          data-fb-tooltip
                          className="absolute z-50 top-full mt-2 left-0 w-72 rounded-lg border border-border bg-card shadow-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">
                              Feedback
                            </span>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:underline"
                              onClick={() => setOpenFeedbackTaskId(null)}
                            >
                              Close
                            </button>
                          </div>

                          {/* Feedback text (from t.feedback) */}
                          <div className="text-sm whitespace-pre-wrap">
                            {t?.feedback &&
                              String(t.feedback).trim().length > 0 ? (
                              String(t.feedback)
                            ) : (
                              <span className="text-muted-foreground">
                                No comments.
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {completed}/{totalTasks}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Questions
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={freezeTask === "Y" || t.status?.toLowerCase() === "completed"}
                    onClick={() => openReassignModal(t)}
                  >
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
                    {qList.some((q) => q.verificationStatus?.toLowerCase() === "completed") && (
                      <>
                        <TableHead>Verified By</TableHead>
                        <TableHead>Comments</TableHead>
                      </>
                    )}
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={qList.some((q) => q.verificationStatus?.toLowerCase() === "completed") ? 7 : 5} className="text-center py-12">
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
                      const isVerified = q.verificationStatus?.toLowerCase() === "completed";
                      const showVerificationColumns = qList.some((q) => q.verificationStatus?.toLowerCase() === "completed");

                      return (
                        <TableRow key={q.id ?? `${t.id}-${q.questionId}`}>
                          <TableCell className="font-medium">
                            {q.questionId || `Q${q.id}`}
                            <div className="text-xs text-muted-foreground">
                              {q.responseType === "text" ? "Text" : "Yes/No"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <StatusPills q={q} />
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {q.complianceDay ?? (q as any).complainceDay ?? "—"}
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {q.response && String(q.response).trim().length > 0
                              ? q.response
                              : "No response yet"}
                          </TableCell>

                          {showVerificationColumns && (
                            <>
                              <TableCell className="text-muted-foreground">
                                {isVerified ? (
                                  (() => {
                                    const verifiedBy = q.verifiedBy && String(q.verifiedBy).trim().length > 0 ? String(q.verifiedBy) : "";

                                    if (verifiedBy) {
                                      return verifiedBy;
                                    } else {
                                      return "—";
                                    }
                                  })()
                                ) : (
                                  "—"
                                )}
                              </TableCell>

                              <TableCell className="text-muted-foreground">
                                {isVerified ? (
                                  (() => {
                                    const answer = q.answer && String(q.answer).trim().length > 0 ? String(q.answer) : "";
                                    const comments = q.comments && String(q.comments).trim().length > 0 ? String(q.comments) : "";

                                    if (answer && comments) {
                                      return `${answer} - ${comments}`;
                                    } else if (answer) {
                                      return answer;
                                    } else if (comments) {
                                      return comments;
                                    } else {
                                      return "—";
                                    }
                                  })()
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-right">
                            <button
                              className=" rounded-lg text-red-500 duration-300 hover:text-[#be123c] hover:bg-[rgba(225,29,72,0.08)] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted "
                              disabled={freezeTask === "Y"}
                              onClick={() => {
                                setQuestionToDelete(q.id);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && questionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete the Question? This action cannot
                be undone.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Reason for deletion <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  ref={deleteReasonInputRef}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="Enter reason"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteQuestion}
                  disabled={!deleteReason.trim()}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>

              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reassign Task Modal with Async Search */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md border-b">
              <h2 className="text-1xl font-semibold text-primary">
                Reassign Task
              </h2>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <div>
                <label className="block text-[13px] font-semibold text-foreground mb-2">
                  Primary Group Lead <span className="text-destructive">*</span>
                </label>
                <SearchableDropdown
                  value={primaryGroupLeadId}
                  onChange={(value) => {
                    const id = Array.isArray(value) ? value[0] : value;
                    setPrimaryGroupLeadId(id as number | undefined);
                  }}
                  placeholder="Type 3+ characters to search..."
                  required
                  maxDisplayItems={10}
                  className="w-full"
                  onSearch={searchGroupLeads}
                  minSearchLength={3}
                  initialSelectedOptions={primaryGroupLeadSelectedOption}
                  usePortal={true}
                />
              </div>
            </div>

            {/* Footer with gradient button */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-accent/30 border-t">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReassignModal(false);
                    setPrimaryGroupLeadId(undefined);
                    setPrimaryGroupLeadSelectedOption([]);
                  }}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={reassignTask}
                  disabled={!primaryGroupLeadId}
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
              shadow-md transition-all duration-300 ease-in-out 
              hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
              disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reassign Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailsPage;