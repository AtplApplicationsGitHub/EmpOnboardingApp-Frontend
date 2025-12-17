"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Card,
    CardContent,
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
    TicketCheck, X
} from "lucide-react";
import { DropDownDTO, TaskProjection } from "@/app/types";
import { archiveService, taskService, EQuestions, adminService } from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import SearchableDropdown from "@/app/components/SearchableDropdown";


const PAGE_SIZE = 10;
const clampPercent = (n: number) => Math.max(0, Math.min(100, n));


const ArchivedEmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchFilter, setSearchFilter] = useState("");
    const [employeesWithQuestions, setEmployeesWithQuestions] = useState<Set<number>>(new Set());
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);
    const [selectedTaskQuestions, setSelectedTaskQuestions] = useState<any[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
    const [completedQuestionCount, setCompletedQuestionCount] = useState(0);
    const [totalQuestionCount, setTotalQuestionCount] = useState(0);
    const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalElements / PAGE_SIZE)),
        [totalElements]
    );

    useEffect(() => {
        const fetchLookupData = async () => {
            try {
                const levels = await adminService.getLookupItems("Level");
                setLevelOptions(levels);

                const departments = await adminService.findAllDepartment();
                const transformedDepartments = departments.map(dept => ({
                    ...dept,
                    value: dept.value || dept.key
                }));
                setDepartmentOptions(transformedDepartments);
            } catch (error) {
                toast.error("Failed to load dropdown options.");
            }
        };
        fetchLookupData();
    }, []);

    const fetchArchivedEmployees = useCallback(async () => {
        try {
            setError(null);
            const params: Record<string, unknown> = {
                page: currentPage,
                size: PAGE_SIZE,
            };
            if (searchFilter.trim())
                params.search = searchFilter.trim();

            if (selectedDepartment)
                params.department = selectedDepartment;

            if (selectedLevel && levelOptions.length > 0) {
                const lvl = levelOptions.find(l => l.id === selectedLevel);
                if (lvl) {
                    params.level = lvl.value;
                }
            }
            const response = await archiveService.getTasksWithFilter(params);
            setEmployees(response.commonListDto ?? []);
            setTotalElements(response.totalElements ?? 0);

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
        finally {
            setIsInitialLoad(false);
        }
    }, [currentPage, searchFilter, selectedDepartment, selectedLevel]);

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
    if (isInitialLoad) {
        return null;
    }


    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SearchableDropdown
                        options={departmentOptions}
                        value={selectedDepartment}
                        required={false}
                        displayFullValue={false}
                        isEmployeePage={true}
                        onChange={(department) => {
                            if (department === undefined) {
                                setSelectedDepartment(undefined);
                                setCurrentPage(0);
                            } else if (!Array.isArray(department)) {
                                setSelectedDepartment(department as number);
                                setCurrentPage(0);
                            }
                        }}
                        placeholder="Select department"
                    />
                    <SearchableDropdown
                        options={levelOptions}
                        value={selectedLevel}
                        required={false}
                        displayFullValue={false}
                        isEmployeePage={true}
                        onChange={(level) => {
                            if (level === undefined) {
                                setSelectedLevel(undefined);
                                setCurrentPage(0);
                            } else if (!Array.isArray(level)) {
                                setSelectedLevel(level as number);
                                setCurrentPage(0);
                            }
                        }}
                        placeholder="Select level"
                    />
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => {
                            setSearchFilter(e.target.value);
                            setCurrentPage(0);
                        }}
                        placeholder="Search…"
                        className="w-64 rounded-md border bg-background px-3 py-2 text-sm text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        aria-label="Search tasks"
                    />
                </div>
            </div>
            {/* Archived Employees Table */}
            <Card>
                <CardContent className="p-0">
                    {error && (
                        <div className="px-4 py-2 text-sm text-red-500" role="alert">
                            {error}
                        </div>
                    )}

                    <Table >
                        <TableHeader>
                            <TableRow className="table-heading-bg text-primary-gradient">
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
                                        <TableRow key={employee.employeeId} className="hover:bg-[var(--custom-gray)] transition-all">
                                            {/* Employee Name */}
                                            <TableCell className="font-semibold min-w-[140px]">
                                                {employee.employeeName}
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
                                                {employee.doj}
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
                                                        className="rounded-lg p-2 text-[#474BDD] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
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
                                                            className="rounded-lg text-[#3b82f6] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                                            onClick={() => {
                                                                handleViewQuestions(employee.taskIds, employee.employeeName);
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12">
                    <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

                        <div className="flex-shrink-0 px-5 py-4 shadow-md flex items-center justify-between border-b border-border">
                            <h2 className="text-1xl font-semibold text-primary">
                                Employee Task Questions
                            </h2>

                            {/* Progress counter */}
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-primary">
                                        {completedQuestionCount} / {totalQuestionCount}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Completed
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowQuestionsModal(false);
                                        setSelectedTaskQuestions([]);
                                        setSelectedEmployeeName("");
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            {selectedTaskQuestions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        No questions found for this employee.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {selectedTaskQuestions.map((question, index) => (
                                        <div key={question.id || index} className="space-y-2">

                                            {/* Question number + text */}
                                            <p className="text-[15px] font-semibold text-foreground leading-relaxed mb-5">
                                                {index + 1}. {question.question || "No question text available"}
                                            </p>

                                            {/* Answer below question */}
                                            <p className="text-[14px] text-foreground leading-relaxed pl-4">
                                                {question.response || "No response provided"}
                                            </p>

                                            {/* Divider */}
                                            {index < selectedTaskQuestions.length - 1 && (
                                                <div className="border-b border-border pt-3"></div>
                                            )}
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