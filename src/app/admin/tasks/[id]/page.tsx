"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { set } from "react-hook-form";
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
  const [groupLeads, setGroupLeads] = useState<DropDownDTO[]>([]);
  const [primaryGroupLeadId, setPrimaryGroupLeadId] = useState<
    number | undefined
  >(undefined);
  const [reAssignTask, setReAssignTask] = useState<string>();
  const taskId = params.id as string;
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(
    undefined
  );
  const [openFeedbackTaskId, setOpenFeedbackTaskId] = useState<string | null>(
    null
  );
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | undefined>(
    undefined
  );
  const [deleteReason, setDeleteReason] = useState("");


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

  const fetchGroupLeads = useCallback(async () => {
    try {
      const groupLeadsData = await adminService.getAllGroupLeads();
      setGroupLeads(groupLeadsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load group leads");
    }
  }, []);

  // const fetchLabs = useCallback(async () => {
  //   try {
  //     const labs = await adminService.getLookupItems("Lab");
  //     setLabOptions(labs);
  //   } catch (error) {
  //     toast.error("Failed to load lab options.");
  //   }
  // }, []);

  const fetchLabsByDepartment = useCallback(
    async (department?: string, currentLab?: string) => {
      if (!department) {
        setLabOptions([]);
        return;
      }
      try {
        const labs = await adminService.getLab(department);
        const labOptionsFormatted: DropDownDTO[] = labs.map((lab, index) => ({
          id: index + 1,
          value: lab as string,
          key: lab as string,
        }));

        setLabOptions(labOptionsFormatted);

        if (currentLab) {
          const matchingLab = labOptionsFormatted.find(
            (lab) => lab.value === currentLab
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


  const getLeadIdByName = (name?: string) => {
    if (!name) return undefined;
    const found = groupLeads.find((lead) => lead.key === name);
    return found ? Number(found.id) : undefined;
  };

  const reassignTask = () => {
    if (!reAssignTask) {
      setError("Missing task id to reassign.");
      return;
    }
    if (primaryGroupLeadId == null) {
      setError("Please select a group lead.");
      return;
    }
    taskService
      .reassignTask(reAssignTask, primaryGroupLeadId)
      .then(() => {
        setShowReassignModal(false);
        setPrimaryGroupLeadId(undefined);
        toast.success("Task Reassign successfully");
        fetchTasks();
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || "Failed to reassign tasks");
      });
  };

  useEffect(() => {
    fetchGroupLeads();
  }, [fetchGroupLeads]);

  const employeeId = tasks[0]?.employeeId;
  const employeeName = tasks[0]?.employeeName;
  const employeeLevel = tasks[0]?.level;
  const department = tasks[0]?.department;
  const role = tasks[0]?.role;
  const doj = tasks[0]?.doj;
  const lab = tasks[0]?.lab;
  const freezeTask = tasks[0]?.freezeTask;

  useEffect(() => {
    if (department) {
      fetchLabsByDepartment(department, lab);
    }
  }, [department, lab, fetchLabsByDepartment]);

  // lab change handler
  const handleSaveLab = async (id?: number) => {
    setSelectedLabId(id);
    const selectedLabValue = labOptions.find((o) => o.id === id)?.value;
    if (!selectedLabValue) {
      toast.error("Invalid lab selection.");
      return;
    }
    if (!employeeId) {
      toast.error("Missing employee id.");
      return;
    }
    if (selectedLabValue === lab) {
      toast.success("Lab already up to date.");
      return;
    }
    try {
      await taskService.labAllocation(employeeId, selectedLabValue);
      toast.success("Lab updated");
      await fetchTasks();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ?? "Failed to update lab allocation"
      );
      const prevId = labOptions.find((o) => o.value === lab)?.id;
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
    <div className="p-6 md:p-8 space-y-6">
      {/* page header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/tasks")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </Button>
        <h3 className="text-xl font-semibold">
          {" "}
          Tasks for {employeeName} ({employeeLevel}) 
        </h3>
        <div className="ml-auto flex items-end gap-3">
          <div className="min-w-[240px]">
            <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      {/* <p className="text-muted-foreground">
            Tasks for {employeeName} ({employeeLevel}) — {tasks.length} task
            {tasks.length === 1 ? "" : "s"} • {overall.doneQ}/{overall.totalQ} done ({overall.pct}%)
        </p> */}

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
                    disabled={freezeTask === "Y"}
                    onClick={() => {
                      setShowReassignModal(true);
                      setPrimaryGroupLeadId(getLeadIdByName(t.assignedTo));
                      setReAssignTask(t.id.toString());
                    }}
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
                      <TableCell colSpan={qList.some((q) => q.verificationStatus?.toLowerCase() === "completed") ? 7 : 5} className="text-center py-12">                        <div className="flex flex-col items-center gap-2">
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
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              disabled={freezeTask === "Y"}
                              onClick={() => {
                                setQuestionToDelete(q.id);
                                setShowDeleteModal(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
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
                Are you sure you want to delete the Question This action cannot
                be undone.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Reason for deletion
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  placeholder="Enter reason"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteQuestion}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reassign Task</h2>

            <div className="pt-4">
              <label className="block text-sm font-medium mb-2">
                Primary Group Lead
              </label>
              <SearchableDropdown
                options={groupLeads}
                value={primaryGroupLeadId}
                onChange={(value) => {
                  const id = Array.isArray(value) ? value[0] : value;
                  setPrimaryGroupLeadId(id);
                }}
                placeholder="Select a group lead"
                required
                maxDisplayItems={4}
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-8">
              {/* PRIMARY: actually triggers the reassign */}
              <Button
                type="button"
                className="flex-1"
                onClick={reassignTask}
                disabled={!primaryGroupLeadId}
              >
                Reassign Task
              </Button>

              {/* CANCEL: just closes */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReassignModal(false);
                  setPrimaryGroupLeadId(undefined);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailsPage;
