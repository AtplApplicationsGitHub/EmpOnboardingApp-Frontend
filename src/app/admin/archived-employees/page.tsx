"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import Button from "../../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Users,
    TicketCheck,
    X
} from "lucide-react";
import { TaskProjection } from "@/app/types";
import { archiveService, taskService, EQuestions } from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-hot-toast";


const PAGE_SIZE = 10;
const clampPercent = (n: number) => Math.max(0, Math.min(100, n));


const ArchivedEmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<TaskProjection[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchFilter, setSearchFilter] = useState("");
    const [dateFormat, setDateFormat] = useState<string | null>(null);
    const [employeesWithQuestions, setEmployeesWithQuestions] = useState<Set<number>>(new Set());
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);
    const [selectedTaskQuestions, setSelectedTaskQuestions] = useState<any[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
    const [completedQuestionCount, setCompletedQuestionCount] = useState(0);
    const [totalQuestionCount, setTotalQuestionCount] = useState(0);


    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalElements / PAGE_SIZE)),
        [totalElements]
    );

    const fetchArchivedEmployees = useCallback(async () => {
        try {
            setError(null);
            const params: Record<string, unknown> = {
                page: currentPage,
                size: PAGE_SIZE,
            };
            const search = searchFilter.trim();
            if (search) params.search = search;
            const [response, formatResponse] = await Promise.all([
                archiveService.getArchiveTask(params),
                taskService.getDateFormat()
            ]);
            setEmployees(response.commonListDto.content ?? []);
            setTotalElements(response.totalElements ?? 0);
            setDateFormat(formatResponse);

            try {
                const employeesWithQuestionsArray = await EQuestions.getEmployeesArchWithQuestions();
                const employeeIdsSet = new Set(employeesWithQuestionsArray);
                setEmployeesWithQuestions(employeeIdsSet);
            } catch (error) {
                setEmployeesWithQuestions(new Set());
            }
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to load archived employees");
            setEmployees([]);
            setTotalElements(0);
        }
    }, [currentPage, searchFilter]);

    useEffect(() => {
        fetchArchivedEmployees();
    }, [fetchArchivedEmployees]);

    const handleViewQuestions = async (taskId: string, employeeName: string) => {
        try {
            setQuestionsLoading(true);
            setSelectedEmployeeName(employeeName);
            const questions = await EQuestions.getQuestionsByTaskArchId(taskId);

            const completedQuestions = questions.filter(
                (question) => question.completedFlag === true
            ).length;
            const totalQuestions = questions.length;
            setSelectedTaskQuestions(questions);
            setCompletedQuestionCount(completedQuestions);
            setTotalQuestionCount(totalQuestions);
            setShowQuestionsModal(true);
        } catch (error) {
            toast.error("Failed to load questions");
        } finally {
            setQuestionsLoading(false);
        }
    };


    const ProgressBar: React.FC<{ value: number; color: string }> = ({
        value,
        color,
    }) => (
        <div className="w-full h-2 rounded bg-muted/40 overflow-hidden" aria-hidden>
            <div
                className={`h-full ${color}`}
                style={{ width: `${clampPercent(value)}%` }}
            />
        </div>
    );

    const handlePageChange = (page: number) => {
        if (page >= 0 && page < totalPages) setCurrentPage(page);
    };

    const generatePageNumbers = () => {
        const pages: Array<number | "..."> = [];
        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
            return pages;
        }
        if (currentPage > 3) pages.push(0, "...");
        for (
            let i = Math.max(1, currentPage - 2);
            i <= Math.min(totalPages - 2, currentPage + 2);
            i++
        ) {
            pages.push(i);
        }
        if (currentPage < totalPages - 4) pages.push("...", totalPages - 1);
        else if (currentPage < totalPages - 3) pages.push(totalPages - 1);
        return pages;
    };



    return (
        <div className="p-8 space-y-6">
            {/* Header / Search */}
            <Card>

                <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => {
                                setSearchFilter(e.target.value);
                                setCurrentPage(0);
                            }}
                            placeholder="Search…"
                            className="w-64 rounded-md border bg-background px-3 py-2 text-sm"
                            aria-label="Search archived employees"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Archived Employees Table */}
            <Card>
                <CardContent className="p-0">
                    {error && (
                        <div className="px-4 py-2 text-sm text-red-500" role="alert">
                            {error}
                        </div>
                    )}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Role & Department</TableHead>
                                <TableHead>DOJ</TableHead>
                                <TableHead>Lab</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users size={48} className="text-muted-foreground" />
                                            <p className="text-muted-foreground">No archived employees found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((employee) => {

                                    // compute progress values
                                    const completed =
                                        (employee as any).completedQuetions ??
                                        (employee as any).completedQuestions ??
                                        0;
                                    const totalQ =
                                        (employee as any).totalQuetions ??
                                        (employee as any).totalQuestions ??
                                        0;
                                    const percent = totalQ ? Math.round((completed / totalQ) * 100) : 0;

                                    let progressColor = "bg-muted-foreground/60";
                                    const status = (employee.status || "").toLowerCase();
                                    if (status === "completed") {
                                        progressColor = "bg-green-600";
                                    } else if (status === "in progress") {
                                        progressColor = "bg-amber-500";
                                    } else if (status === "overdue") {
                                        progressColor = "bg-red-600";
                                    }

                                    return (
                                        <TableRow key={employee.taskIds}>
                                            {/* Employee Name */}
                                            <TableCell className="font-semibold min-w-[140px]">
                                                {employee.name}
                                            </TableCell>

                                            {/* Level */}
                                            <TableCell>{employee.level}</TableCell>

                                            {/* Role & Department */}
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-semibold">{employee.role}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {employee.department}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* DOJ */}
                                            <TableCell className="min-w-[100px]">
                                                {(() => {
                                                    const dojArray = (employee as any).doj;
                                                    if (
                                                        Array.isArray(dojArray) &&
                                                        dateFormat &&
                                                        dojArray.length >= 3
                                                    ) {
                                                        try {
                                                            const dateObject = new Date(
                                                                dojArray[0],
                                                                dojArray[1] - 1,
                                                                dojArray[2]
                                                            );
                                                            if (isNaN(dateObject.getTime())) {
                                                                return "Invalid Date";
                                                            }
                                                            return format(dateObject, dateFormat);
                                                        } catch (error) {
                                                            return "Invalid Date";
                                                        }
                                                    }
                                                    return "Invalid Date";
                                                })()}
                                            </TableCell>

                                            {/* Lab */}
                                            <TableCell className="min-w-[80px]">{employee.lab}</TableCell>

                                            {/* Progress */}
                                            <TableCell className="min-w-[120px]">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold">
                                                            {completed}/{totalQ}
                                                        </span>
                                                        <span className="text-muted-foreground">{percent}%</span>
                                                    </div>
                                                    <ProgressBar value={percent} color={progressColor} />
                                                </div>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="min-w-[100px]">
                                                {status === "completed" ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-green-600/20 text-green-600">
                                                        Completed
                                                    </span>
                                                ) : status === "overdue" ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-red-600/20 text-red-600">
                                                        Overdue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium bg-amber-500/20 text-amber-600">
                                                        In Progress
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                <div className="flex items-center gap-5">
                                                    {/* View Details */}
                                                    <button
                                                        className="rounded-lg p-2 text-[#474BDD]"
                                                        onClick={() =>
                                                            (window.location.href = `/admin/archived-employees/${employee.taskIds}`)
                                                        }
                                                        aria-label="View details"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {/* View Answers */}
                                                    {employeesWithQuestions.has(parseInt(employee.employeeId, 10)) && (
                                                        <button
                                                            className="rounded-lg text-[#3b82f6]"
                                                            onClick={() => {
                                                                const firstTaskId = employee.taskIds.split(",")[0];
                                                                handleViewQuestions(firstTaskId, employee.name);
                                                            }}
                                                            disabled={questionsLoading}
                                                            aria-label="View answers"
                                                            title="View Employee Answers"
                                                        >
                                                            <TicketCheck size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>

                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>

                    </Table>
                </CardContent>
            </Card>

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
                                    aria-label="First page"
                                >
                                    <ChevronsLeft size={16} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className="p-2"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                {generatePageNumbers().map((page, idx) =>
                                    page === "..." ? (
                                        <span
                                            key={`dots-${idx}`}
                                            className="px-3 py-2 text-muted-foreground"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <Button
                                            key={page}
                                            variant={page === currentPage ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page as number)}
                                            className="min-w-[40px]"
                                            aria-current={page === currentPage ? "page" : undefined}
                                        >
                                            {(page as number) + 1}
                                        </Button>
                                    )
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className="p-2"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className="p-2"
                                    aria-label="Last page"
                                >
                                    <ChevronsRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            {showQuestionsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="bg-white dark:bg-black rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden dark:border">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Employee Task Question
                            </h2>
                            <div className="flex-1 flex justify-end items-center">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-primary dark:text-primary">
                                        {completedQuestionCount} / {totalQuestionCount}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Questions
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setShowQuestionsModal(false);
                                    setSelectedTaskQuestions([]);
                                    setSelectedEmployeeName("");
                                }}
                                className="rounded-lg ml-4 dark:border dark:border-gray-700 dark:bg-black dark:hover:bg-gray-900"
                            >
                                <X size={16} className="dark:text-gray-100" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {selectedTaskQuestions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No questions found for this employee.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {selectedTaskQuestions.map((question, index) => (
                                        <div
                                            key={question.id || index}
                                            className="border border-gray-200  rounded-lg p-4 bg-white dark:bg-black"
                                        >
                                            <div className="mb-3">
                                                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                    Question {index + 1}:
                                                </h3>
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    {question.question || "No question text available"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                    Response:
                                                </h4>
                                                <div className="bg-gray-50 dark:bg-black border border-grey-200 rounded-md p-3">
                                                    <p className="text-gray-800 dark:text-gray-200">
                                                        {question.response || "No response provided"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ArchivedEmployeesPage;