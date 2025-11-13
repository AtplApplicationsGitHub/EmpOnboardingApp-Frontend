"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Button from "../../../../components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "../../../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../../components/ui/table";

import { taskService } from "@/app/services/api";
import { Task, TaskQuestions } from "@/app/types";

import {
    ArrowLeft,
    User2,
    Clock,
    AlertCircle,
    CheckCircle2,
    Users,
    Star,
} from "lucide-react";
import toast from "react-hot-toast";

const EmployeeTasksPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openFeedbackTaskId, setOpenFeedbackTaskId] = useState<string | null>(
        null
    );

    const employeeId = params.employeeId as string;

    const fetchEmployeeTasks = useCallback(async () => {
        if (!employeeId) return;

        try {
            setLoading(true);
            setError(null);

            // Convert employeeId to number for the API call
            const empIdNumber = parseInt(employeeId, 10);
            if (isNaN(empIdNumber)) {
                throw new Error("Invalid employee ID");
            }

            const employeeTasks = await taskService.getTasksByEmployeeId(empIdNumber);
            console.log("Fetched employee tasks:", employeeTasks);

            const taskList: Task[] = Array.isArray(employeeTasks) ? employeeTasks : employeeTasks ? [employeeTasks] : [];
            setTasks(taskList);

        } catch (e: any) {
            console.error("Error fetching employee tasks:", e);
            setError(e?.response?.data?.message || "Failed to load employee tasks");
            setTasks([]);
            toast.error("Failed to load employee tasks");
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        fetchEmployeeTasks();
    }, [fetchEmployeeTasks]);

    // Extract employee info from first task
    const employeeName = tasks[0]?.employeeName;
    const employeeLevel = tasks[0]?.level;
    const department = tasks[0]?.department;
    const role = tasks[0]?.role;
    const doj = tasks[0]?.doj;

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
                <div className="text-center py-12 text-muted-foreground">Loading employee tasks...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <div className="text-destructive mb-4">{error}</div>
                    <Button onClick={() => router.push("/group-lead/tasks/[id]")}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!tasks.length) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <div className="text-destructive">No tasks found for this employee</div>
                    <Button onClick={() => router.back()} className="mt-4">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">

            <div className="flex items-center gap-3">
                {/* <Button
                    variant="outline"
                    onClick={() => router.push("/group-lead/tasks")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    Back
                </Button> */}
                <h3 className="text-xl font-semibold">
                    Tasks for {employeeName} {employeeLevel && `(${employeeLevel})`} — {tasks.length} task
                    {tasks.length === 1 ? "" : "s"}
                    {department && ` - ${department}`}
                    {role && ` - ${role}`}
                    {doj && ` - ${doj}`}
                </h3>
            </div>

            {/* One CARD per task */}
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

                                                    {/* Feedback text */}
                                                    {<div className="text-sm whitespace-pre-wrap">
                                                        {t?.feedback &&
                                                            String(t.feedback).trim().length > 0 ? (
                                                            String(t.feedback)
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                No comments.
                                                            </span>
                                                        )}
                                                    </div>}
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
                                                    <p className="text-muted-foreground">
                                                        No questions found for this task.
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        qList.map((q) => (
                                            <TableRow key={q.id ?? `${t.id}-${q.questionId}`}>
                                                <TableCell className="font-medium">
                                                    {q.questionId || `Q${q.id}`}
                                                    <div className="text-xs text-muted-foreground">
                                                        {String(q.responseType ?? "").toLowerCase() === "text" ? "Text" : "Yes/No"}
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

                                            </TableRow>
                                        ))
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

export default EmployeeTasksPage;