"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { taskService, EQuestions, adminService } from "../../services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import Button from "../../components/ui/button";
import { Task, EmployeeQuestions, DropDownDTO } from "@/app/types";
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
  Lock,
  Unlock,
  Users,
  TicketCheck,
  X,
  FlaskConical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SearchableDropdown from "@/app/components/SearchableDropdown";

const PAGE_SIZE = 10;

const clampPercent = (n: number) => Math.max(0, Math.min(100, n));

const GroupLeadTasksPage: React.FC = () => {
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [taskStatus, setTaskStatus] = useState(0);
  const [statusOptions, setStatusOptions] = useState<DropDownDTO[]>([]);

  // Employee questions functionality
  const [employeesWithQuestions, setEmployeesWithQuestions] = useState<
    Set<number>
  >(new Set());
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedTaskQuestions, setSelectedTaskQuestions] = useState<
    EmployeeQuestions[]
  >([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [completedQuestionCount, setCompletedQuestionCount] = useState(0);
  const [totalQuestionCount, setTotalQuestionCount] = useState(0);

  const [showLabChangeModal, setShowLabChangeModal] = useState(false);
  const [selectedEmployeeForLabChange, setSelectedEmployeeForLabChange] =
    useState<any>(null);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(
    undefined
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalElements / PAGE_SIZE)),
    [totalElements]
  );

  useEffect(() => {
    setStatusOptions([
      { id: 1, key: "Open", value: "Open" },
      { id: 2, key: "Completed", value: "Completed" }
    ]);
    setTaskStatus(1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchFilter(searchFilter);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchFilter]);

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, unknown> = {
        page: currentPage,
        size: PAGE_SIZE,
      };

      const search = searchFilter.trim(); // Use debounced search
      if (search) params.search = search;

      if (taskStatus) {
        const selectedStatus = statusOptions.find(opt => opt.id === taskStatus);
        if (selectedStatus) {
          params.taskStatus = selectedStatus.key;
        }
      }

      const response = await taskService.getAllTasksForGroupLead(params);
      setAllTasks(response.commonListDto ?? []);
      setTotalElements(response.totalElements ?? 0);

      try {
        const employeesWithQuestionsArray =
          await EQuestions.getEmployeesWithQuestions();
        setEmployeesWithQuestions(new Set(employeesWithQuestionsArray));
      } catch (error) {
        console.error("Error fetching employees with questions:", error);
        setEmployeesWithQuestions(new Set());
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load tasks");
      setAllTasks([]);
      setTotalElements(0);
    }
  }, [currentPage, searchFilter, taskStatus, statusOptions]); // Fixed dependencies

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const handleViewQuestions = async (taskId: string, employeeName: string) => {
    try {
      setQuestionsLoading(true);
      setSelectedEmployeeName(employeeName);
      const questions = await EQuestions.getQuestionsByTask(taskId);
      const completedQuestions = questions.filter(
        (question) => question.completedFlag === true
      ).length;
      const totalQuestions = questions.length;
      setSelectedTaskQuestions(questions);
      setCompletedQuestionCount(completedQuestions);
      setTotalQuestionCount(totalQuestions);
      setShowQuestionsModal(true);
    } catch (error) {
      console.error("Error fetching task questions:", error);
      // You could add a toast notification here
    } finally {
      setQuestionsLoading(false);
    }
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

  const handleFreezeTask = async () => {
    if (!selectedTaskId) return;
    try {
      await taskService.freezeTask(selectedTaskId);
      await fetchTasks();
      setShowFreezeModal(false);
      setSelectedTaskId("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete group");
    }
  };

  const fetchLabsByDepartment = async (
    departmentId: number,
    currentLab?: string
  ) => {
    if (!departmentId) {
      setLabOptions([]);
      return;
    }
    try {
      const labs = await adminService.getDepartmentLabs(departmentId);
      const labOptionsFormatted = labs.map((lab, index) => ({
        ...lab,
        value: lab.value || lab.key
      }));

      setLabOptions(labOptionsFormatted);

      if (currentLab) {
        const matchingLab = labOptionsFormatted.find(
          (lab) => lab.value === currentLab || lab.key === currentLab
        );
        if (matchingLab) {
          setSelectedLabId(matchingLab.id);
        }
      }
    } catch (error) {
      console.error("Error fetching labs:", error);
      setLabOptions([]);
      setError("Failed to fetch labs for this department");
    }
  };

  const handleOpenLabChangeModal = async (employee: any) => {
    setSelectedEmployeeForLabChange(employee);
    setShowLabChangeModal(true);

    if (employee.departmentId) {
      await fetchLabsByDepartment(employee.departmentId, employee.lab);
    } else {
      setLabOptions([]);
      setSelectedLabId(undefined);
    }
  };

  const handleLabChangeSubmit = async () => {
    if (!selectedLabId || !selectedEmployeeForLabChange) return;

    const selectedLab = labOptions.find((lab) => lab.id === selectedLabId);
    if (!selectedLab) return;

    try {
      await taskService.labAllocation(
        Number(selectedEmployeeForLabChange.employeeId),
        selectedLab.id
      );

      toast.success("Lab updated successfully");
      await fetchTasks();

      setShowLabChangeModal(false);
      setSelectedEmployeeForLabChange(null);
      setSelectedLabId(undefined);
      setLabOptions([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update lab");
    }
  };
  const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full h-2 rounded bg-muted/40 overflow-hidden" aria-hidden>
      <div
        className="h-full bg-muted-foreground/60"
        style={{ width: `${clampPercent(value)}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Search Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchableDropdown
            options={statusOptions}
            value={taskStatus}
            required={false}
            displayFullValue={false}
            isEmployeePage={true}
            onChange={(status) => {
              if (status === undefined) {
                setTaskStatus(0);
                setCurrentPage(0);
                setSearchFilter("");
              } else if (!Array.isArray(status)) {
                setTaskStatus(status as number);
                setCurrentPage(0);
                setSearchFilter("");
              }
            }}
            placeholder="Select level"
            allowRemove={false}
          />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setCurrentPage(0);
            }}
            placeholder="Search…"
            className="w-64 px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Search tasks"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="px-4 py-2 text-sm text-red-500" role="alert">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-heading-bg text-primary-gradient">
                  <TableHead>Task ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {allTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={48} className="text-muted-foreground" />
                        <p className="text-muted-foreground">No tasks found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const seenEmployees = new Set<string>();
                    return allTasks.map((task) => {
                      const completed =
                        (task as any).completedQuetions ??
                        (task as any).completedQuestions ??
                        0;
                      const totalQ =
                        (task as any).totalQuetions ??
                        (task as any).totalQuestions ??
                        0;
                      const percent = totalQ
                        ? Math.round((completed / totalQ) * 100)
                        : 0;

                      const employeeId = (task as any).employeeId;
                      const employeeName = (task as any).employeeName;
                      const taskId = String(task.id);
                      const isFirstOccurrence = !seenEmployees.has(employeeId);
                      const hasQuestions = employeesWithQuestions.has(
                        parseInt(employeeId, 10)
                      );

                      if (isFirstOccurrence) {
                        seenEmployees.add(employeeId);
                      }

                      return (
                        <TableRow key={(task as any).id ?? (task as any).id} className="hover:bg-[var(--custom-gray)] transition-all">
                          <TableCell className="font-semibold">
                            {(task as any).id}
                          </TableCell>
                          <TableCell>{(task as any).employeeName}</TableCell>
                          <TableCell>{(task as any).department}</TableCell>
                          <TableCell>{(task as any).level}</TableCell>
                          <TableCell className="">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold">
                                  {completed}/{totalQ}
                                </span>
                                <span className="text-muted-foreground">
                                  {percent}%
                                </span>
                              </div>
                              <ProgressBar value={percent} />
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell >
                            {(() => {
                              const status = (task.status || "").toLowerCase();
                              const base =
                                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ";

                              if (status === "overdue") {
                                return (
                                  <span
                                    className={`${base} bg-red-600/20 text-red-600`}
                                  >
                                    Overdue
                                  </span>
                                );
                              }

                              if (status === "completed") {
                                return (
                                  <span
                                    className={`${base} bg-green-600/20 text-green-600`}
                                  >
                                    Completed
                                  </span>
                                );
                              }

                              return (
                                <span
                                  className={`${base} bg-amber-500/20 text-amber-600`}
                                >
                                  {task.status}
                                </span>
                              );
                            })
                              ()}
                          </TableCell>

                          {/* Verification Status */}
                          <TableCell >
                            {(() => {
                              const verificationStatus = (task.verificationStatus || "").toLowerCase();
                              const base =
                                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap ";

                              if (verificationStatus === "completed") {
                                return (
                                  <span
                                    className={`${base} bg-green-600/20 text-green-600`}
                                  >
                                    Completed
                                  </span>
                                );
                              }

                              return (
                                <span
                                  className={`${base} bg-amber-500/20 text-amber-600`}
                                >
                                  {task.verificationStatus}
                                </span>
                              );
                            })
                              ()}
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center gap-5">
                              <div className="w-[18px]">

                                {!task.lab && isFirstOccurrence && (
                                  <button
                                    className="rounded-lg text-[#eea11d] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                    onClick={() => handleOpenLabChangeModal(task)}
                                    aria-label="Change lab"
                                    title="Change Lab"
                                  >
                                    <FlaskConical size={18} />
                                  </button>
                                )}
                              </div>
                              <button
                                className="rounded-lg text-[#474BDD] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                onClick={() =>
                                  router.push(`/group-lead/tasks/${task.id}`)
                                }
                                aria-label="View details"
                              >
                                <Eye size={18} />
                              </button>

                              {/* View Answers button - only show for first occurrence of employees who have questions */}
                              {isFirstOccurrence && hasQuestions && (
                                <button
                                  className="rounded-lg shrink-0 text-[#3b82f6] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                  onClick={() =>
                                    handleViewQuestions(taskId, employeeName)
                                  }
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
                    });
                  })()
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showLabChangeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md border-b border-border">
              <CardTitle className="text-1xl font-semibold text-primary">
                Change Lab
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Select Lab <span className="text-destructive">*</span>
                  </label>
                  <SearchableDropdown
                    options={labOptions}
                    value={selectedLabId}
                    onChange={(value) => setSelectedLabId(value as number)}
                    placeholder="Select a lab..."
                    className="w-full"
                    isEmployeePage={true}
                    displayFullValue={false}
                    usePortal={true}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-secondary border-t border-border">
              <div className="flex items-center gap-3">
                {/* Cancel Button */}
                <Button
                  type="button"
                  onClick={() => {
                    setShowLabChangeModal(false);
                    setSelectedEmployeeForLabChange(null);
                    setSelectedLabId(undefined);
                    setLabOptions([]);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>

                {/* Update Button */}
                <button
                  onClick={handleLabChangeSubmit}
                  disabled={!selectedLabId}
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
            shadow-md transition-all duration-300 ease-in-out 
            hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Lab
                </button>

              </div>
            </div>

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
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Freeze Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to Freeze the Tasks{" "}
                {/* <span className="font-semibold">{tasks.id}</span>? */}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleFreezeTask}
                  className="flex-1"
                >
                  Yes, Freeze
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFreezeModal(false);
                    setSelectedTaskId("");
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

      {/* Questions Modal */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-semibold text-primary">
                Employee Questions - {selectedEmployeeName}
              </h2>

              {/* Progress counter and Close X */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {completedQuestionCount} / {totalQuestionCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Questions
                  </div>
                </div>

                {/* Close X button */}
                <button
                  onClick={() => {
                    setShowQuestionsModal(false);
                    setSelectedTaskQuestions([]);
                    setSelectedEmployeeName("");
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
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
                      <p className="text-[14px] text-card-foreground leading-relaxed pl-4">
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

            {/* Footer removed */}
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupLeadTasksPage;
