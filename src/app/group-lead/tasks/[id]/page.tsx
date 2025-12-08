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
} from "lucide-react";
import SearchableDropdown from "@/app/components/SearchableDropdown";
import toast from "react-hot-toast";

/* ---------- Helpers for editable responses ---------- */

// Build a stable key for a task-question pair
const qKey = (
  tId: string | number | undefined,
  qId: string | number | undefined
) => `${String(tId ?? "")}:${String(qId ?? "")}`;

// Derive the initial response string from a question (adjust fallbacks if needed)
const getInitialResp = (q: TaskQuestions) =>
  (typeof q.response === "string" && q.response !== "text" ? q.response : "") ??
  (q as any).responseValue ??
  (q as any).userResponse ??
  (q as any).answer ??
  "";

// Determine if question expects text vs yes/no
// Based on your logic: q.response === "text" ? Text : Yes/No
const isTextType = (q: TaskQuestions) =>
  String(q.responseType ?? "").toLowerCase() === "text";

const GroupLeadTaskDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [primaryGroupLeadId, setPrimaryGroupLeadId] = useState<number | undefined>(undefined);
  const [primaryGroupLeadSelectedOption, setPrimaryGroupLeadSelectedOption] = useState<DropDownDTO[]>([]);
  const [reAssignTask, setReAssignTask] = useState<string>();
  const [openFeedbackTaskId, setOpenFeedbackTaskId] = useState<string | null>(null);

  // Params
  const taskId = params.id as string;

  // Lab allocation UI
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [isFirstTaskForEmployee, setIsFirstTaskForEmployee] = useState<boolean>(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);

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

  // Fetch labs for a department
  const fetchLabsByDepartment = useCallback(
    async (deptId?: number, currentLab?: string) => {
      if (!deptId) {
        setLabOptions([]);
        return;
      }
      try {
        // Pass the department ID (number) to the API
        const labs = await adminService.getDepartmentLabs(deptId);

        // Transform labs (they already have real IDs from the database)
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

  // Check if all questions in all tasks are completed
  const allQuestionsCompleted = useMemo(() => {
    return tasks.every((task) => {
      const qList = task.questionList ?? [];
      return qList.length > 0 && qList.every((q) =>
        (q.status || "").toLowerCase() === "completed"
      );
    });
  }, [tasks]);

  // Toggle feedback tooltip
  const toggleFeedbackTooltip = useCallback((taskId: string) => {
    setOpenFeedbackTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  // Per-question editable values and saving flags
  const [respValues, setRespValues] = useState<Record<string, string>>({});
  const [respSaving, setRespSaving] = useState<Record<string, boolean>>({});

  // Load tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const t = await taskService.getTaskById(taskId);
      const list: Task[] = Array.isArray(t) ? t : t ? [t] : [];
      setTasks(list);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load task(s)");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // Check if first task for employee
  const checkIfFirstTaskForEmployee = useCallback(async () => {
    if (!taskId) return;

    try {
      const response = await taskService.getTaskForGL({
        page: 0
      });
      const allTasks = response.commonListDto ?? [];

      const currentTask = allTasks.find((task: any) => String(task.id) === String(taskId));
      if (!currentTask) return;

      const currentEmployeeId = (currentTask as any).employeeId;

      const employeeTasks = allTasks
        .filter((task: any) => (task as any).employeeId === currentEmployeeId)
        .sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));

      const isFirst = employeeTasks.length > 0 && String(employeeTasks[0].id) === String(taskId);
      setIsFirstTaskForEmployee(isFirst);
    } catch (error) {
      console.error("Error checking task order:", error);
      setIsFirstTaskForEmployee(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTasks();
    checkIfFirstTaskForEmployee();
  }, [fetchTasks, checkIfFirstTaskForEmployee]);

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

  // Top-of-page fields
  const employeeId = tasks[0]?.employeeId;
  const employeeName = tasks[0]?.employeeName;
  const employeeLevel = tasks[0]?.level;
  const department = tasks[0]?.department;
  const departmentId = tasks[0]?.departmentId;
  const role = tasks[0]?.role;
  const doj = tasks[0]?.doj;
  const lab = tasks[0]?.lab;
  const freezeTask = tasks[0]?.freezeTask; // 'Y' | 'N'
  const assignedFreezeTask = tasks[0]?.assignedFreezeTask;

  // Fetch labs when department changes
  useEffect(() => {
    if (departmentId) {
      fetchLabsByDepartment(departmentId, lab);
    }
  }, [departmentId, lab, fetchLabsByDepartment]);

  // Initialize editable response cache when tasks change
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

  const handleLabChange = useCallback(
    (value: number | number[] | undefined): void => {
      const id = Array.isArray(value) ? value[0] : value;
      void handleSaveLab(id);
    },
    [handleSaveLab]
  );

  // Save a single question response
  const saveQuestionResponse = async (
    tId: string | number,
    q: TaskQuestions,
    value: string
  ) => {
    const key = qKey(tId, q.id);
    try {
      setRespSaving((s) => ({ ...s, [key]: true }));
      await taskService.updateResponse(q.id, value);
      setRespValues((v) => ({ ...v, [key]: value }));
      toast.success("Response saved");
      if (!isTextType(q)) {
        await fetchTasks();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save response");
    } finally {
      setRespSaving((s) => ({ ...s, [key]: false }));
    }
  };

  // View all button handler
  const handleViewAll = () => {
    if (!employeeId) {
      toast.error("Missing employee id.");
      return;
    }
    window.open(`/group-lead/tasks/all/${employeeId}`, "_blank");
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

  const handleSubmit = async () => {
    try {
      const result = await taskService.assignedFreezeTask(taskId);
      console.log('Freeze Task Result:', result);
      toast.success("Task submitted successfully");
      setShowSubmitModal(false);
      // Refresh the task data to reflect the freeze status
      await fetchTasks();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit task");
    }
  };

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
          <Button onClick={() => router.push("/group-lead/tasks")}>
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
            onClick={() => router.push("/group-lead/tasks")}
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-semibold text-primary ml-2">
          Tasks for {employeeName} ({employeeLevel})
        </h3>
        <div className="ml-auto flex items-end gap-3">
          {isFirstTaskForEmployee && (
            <div className="min-w-[220px]">
              <div className="flex items-center gap-2">
                <SearchableDropdown
                  options={labOptions}
                  value={selectedLabId}
                  disabled={false}
                  onChange={handleLabChange}
                  placeholder="Select Lab"
                  displayFullValue={false}
                  isEmployeePage={true}
                  className="w-full"
                />
              </div>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleViewAll}
            className="mt-2"
          >
            View All
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/group-lead/tasks")}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </div>

      {/* Tasks */}
      {tasks.map((t) => {
        console.log('Task Item:', t);
        const qList = t.questionList ?? [];
        const totalTasks = qList.length;
        const completed = qList.filter(
          (q) => (q.status || "").toLowerCase() === "completed"
        ).length;

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
                    <div className="flex items-center gap-2">
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
                    disabled={assignedFreezeTask === true}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={qList.some((q) => q.verificationStatus?.toLowerCase() === "completed") ? 6 : 4} className="text-center py-12">
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
                      const key = qKey(t.id, q.id);
                      const initial = getInitialResp(q);
                      const value = respValues[key] ?? initial;
                      const saving = respSaving[key] === true;
                      const isVerified = q.verificationStatus?.toLowerCase() === "completed";
                      const showVerificationColumns = qList.some((q) => q.verificationStatus?.toLowerCase() === "completed");

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

                          <TableCell className="min-w-[240px]">
                            {isTextType(q) ? (
                              <input
                                type="text"
                                className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                                placeholder="Type response and leave the field"
                                value={value}
                                onChange={(e) =>
                                  setRespValues((v) => ({
                                    ...v,
                                    [key]: e.target.value,
                                  }))
                                }
                                onBlur={async (e) => {
                                  const newVal = e.target.value.trim();
                                  if (newVal === (initial ?? "")) return;
                                  if (saving) return;
                                  if (assignedFreezeTask === true) return;
                                  await saveQuestionResponse(t.id, q, newVal);
                                  await fetchTasks();
                                }}
                                disabled={saving || assignedFreezeTask === true}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const lower = String(value || "").toLowerCase();
                                  const isYes = lower === "yes" || lower === "y" || lower === "true";
                                  const isNo = lower === "no" || lower === "n" || lower === "false";

                                  return (
                                    <>
                                      <Button
                                        type="button"
                                        variant={isYes ? "default" : "outline"}
                                        disabled={saving || assignedFreezeTask === true}
                                        onClick={() => saveQuestionResponse(t.id, q, "YES")}
                                      >
                                        Yes
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={isNo ? "default" : "outline"}
                                        disabled={saving || assignedFreezeTask === true}
                                        onClick={() => saveQuestionResponse(t.id, q, "NO")}
                                      >
                                        No
                                      </Button>
                                      {saving && (
                                        <span className="text-xs text-muted-foreground">
                                          Saving…
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </TableCell>

                          {showVerificationColumns && (
                            <>
                              <TableCell className="text-muted-foreground">
                                {isVerified ? (
                                  (() => {
                                    const verifiedBy = q.verifiedBy && String(q.verifiedBy).trim().length > 0 ? String(q.verifiedBy) : "";
                                    return verifiedBy || "—";
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

      {/* Reassign Task Modal with Async Search */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden ">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b shadow-md border-border">
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
                />
              </div>
            </div>

            {/* Footer with gradient button */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-muted/50 border-t border-border">
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
      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardContent className="pt-6">
              <p className="mb-4 text-md">
                Are you sure you want to submit this task for{" "}
                <span className="font-semibold">{employeeName}</span>? This action
                cannot be undone.
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
                  className="flex-1 bg-primary-gradient"
                >
                  Yes, Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {!assignedFreezeTask && (
        <div className="flex justify-center py-6">
          <Button
            onClick={() => setShowSubmitModal(true)}
            disabled={!allQuestionsCompleted}
            className="px-8 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
        shadow-md transition-all duration-300 ease-in-out 
        hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
        disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupLeadTaskDetailPage;