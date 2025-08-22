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
  (q as any).answer ??
  (q as any).responseValue ??
  (q as any).userResponse ??
  (typeof q.response === "string" && q.response !== "text" ? q.response : "") ??
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
  const [groupLeads, setGroupLeads] = useState<DropDownDTO[]>([]);
  const [primaryGroupLeadId, setPrimaryGroupLeadId] = useState<number | undefined>(undefined);
  const [reAssignTask, setReAssignTask] = useState<string>();

  // Params
  const taskId = params.id as string;

  // Lab allocation UI
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
  const labOptions = [
    { id: 101, key: "Lab1", value: "Lab1" },
    { id: 102, key: "Lab2", value: "Lab2" },
  ];

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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Load group leads
  const fetchGroupLeads = useCallback(async () => {
    try {
      const groupLeadsData = await adminService.getAllGroupLeads();
      setGroupLeads(groupLeadsData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load group leads");
    }
  }, []);

  useEffect(() => {
    fetchGroupLeads();
  }, [fetchGroupLeads]);

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
        toast.success("Task reassigned successfully");
        fetchTasks();
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || "Failed to reassign tasks");
      });
  };

  // Top-of-page fields
  const employeeId = tasks[0]?.employeeId;
  const employeeName = tasks[0]?.employeeName;
  const employeeLevel = tasks[0]?.level;
  const department = tasks[0]?.department;
  const role = tasks[0]?.role;
  const doj = tasks[0]?.doj;
  const lab = tasks[0]?.lab;
  const freezeTask = tasks[0]?.freezeTask; // 'Y' | 'N'

  // Initialize lab dropdown selection from current lab
  useEffect(() => {
    const id = labOptions.find((opt) => opt.value === lab)?.id;
    setSelectedLabId(id);
  }, [lab]);

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

  // Save lab allocation (auto-save on change)
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
      toast.error(e?.response?.data?.message ?? "Failed to update lab allocation");
      const prevId = labOptions.find((o) => o.value === lab)?.id;
      setSelectedLabId(prevId);
    }
  };

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
      fetchTasks();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to save response");
    } finally {
      setRespSaving((s) => ({ ...s, [key]: false }));
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
          {status === "completed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
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
          <Button onClick={() => router.push("/group-lead/tasks")}>Back to Tasks</Button>
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-destructive">Task not found</div>
          <Button onClick={() => router.push("/group-lead/tasks")} className="mt-4">
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/group-lead/tasks")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </Button>
        <h3 className="text-xl font-semibold">
          Tasks for {employeeName} ({employeeLevel}) — {tasks.length} task
          {tasks.length === 1 ? "" : "s"} - {department} - {role} - {doj}
        </h3>
        <div className="ml-auto flex items-end gap-3">
          <div className="min-w-[240px]">
            <div className="flex items-center gap-2">
              <SearchableDropdown
                options={labOptions}
                value={selectedLabId}
                disabled={freezeTask === "Y"}
                onChange={(id) => handleSaveLab(id)}
                placeholder="Select Lab"
                displayFullValue={false}
                isEmployeePage={true}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      {tasks.map((t) => {
        const qList = t.questionList ?? [];
        const totalTasks = qList.length;

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
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{totalTasks}</div>
                    <div className="text-xs text-muted-foreground">Questions</div>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users size={48} className="text-muted-foreground" />
                          <p className="text-muted-foreground">No questions found for this task.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    qList.map((q) => {
                      const key = qKey(t.id, q.id);
                      const initial = getInitialResp(q);
                      const value = respValues[key] ?? initial;
                      const saving = respSaving[key] === true;

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
                                onBlur={(e) => {
                                  const newVal = e.target.value.trim();
                                  if (newVal === (initial ?? "")) return; // no change
                                  if (saving) return;
                                  if (freezeTask === "Y") return;
                                  saveQuestionResponse(t.id, q, newVal);
                                }}
                                disabled={saving || freezeTask === "Y"}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const lower = String(value || "").toLowerCase();
                                  const isYes =
                                    lower === "yes" || lower === "y" || lower === "true";
                                  const isNo =
                                    lower === "no" || lower === "n" || lower === "false";

                                  return (
                                    <>
                                      <Button
                                        type="button"
                                        variant={isYes ? "default" : "outline"}
                                        disabled={saving || freezeTask === "Y"}
                                        onClick={() => saveQuestionResponse(t.id, q, "YES")}
                                      >
                                        Yes
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={isNo ? "default" : "outline"}
                                        disabled={saving || freezeTask === "Y"}
                                        onClick={() => saveQuestionResponse(t.id, q, "NO")}
                                      >
                                        No
                                      </Button>
                                      {saving && (
                                        <span className="text-xs text-muted-foreground">Saving…</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
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

      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reassign Task</h2>

            <div className="pt-4">
              <label className="block text-sm font-medium mb-2">Primary Group Lead</label>
              <SearchableDropdown
                options={groupLeads}
                value={primaryGroupLeadId}
                onChange={(value) => setPrimaryGroupLeadId(value)}
                placeholder="Select a group lead"
                required
                maxDisplayItems={4}
                className="w-full"
              />
            </div>

            <div className="flex gap-3 pt-8">
              <Button
                type="button"
                className="flex-1"
                onClick={reassignTask}
                disabled={!primaryGroupLeadId}
              >
                Reassign Task
              </Button>
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

export default GroupLeadTaskDetailPage;
