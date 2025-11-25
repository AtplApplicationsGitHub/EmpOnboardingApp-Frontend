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
import { TaskProjection, DropDownDTO } from "@/app/types";
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
  Info,
  Lock,
  TicketCheck,
  Unlock,
  Users,
  Verified,
  FlaskConical,
  X,
} from "lucide-react";
import SearchableDropdown from "../../components/SearchableDropdown";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const PAGE_SIZE = 10;

const clampPercent = (n: number) => Math.max(0, Math.min(100, n));

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [employeesWithQuestions, setEmployeesWithQuestions] = useState<
    Set<number>
  >(new Set());
  const [dateFormat, setDateFormat] = useState<string | null>(null);
  const [showLabChangeModal, setShowLabChangeModal] = useState(false);
  const [selectedEmployeeForLabChange, setSelectedEmployeeForLabChange] =
    useState<any>(null);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(
    undefined
  );
  const [loadingLabs, setLoadingLabs] = useState(false);
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

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, unknown> = {
        page: currentPage,
        size: PAGE_SIZE,
      };

      if (searchFilter.trim())
        params.search = searchFilter.trim();
      
      if (selectedDepartment )
        params.department = selectedDepartment;

      if (selectedLevel && levelOptions.length > 0) {
        const lvl = levelOptions.find(l => l.id === selectedLevel);
        if (lvl) {
          params.level = lvl.value;
        }
      }

      const response = await taskService.getTasksWithFilter(params);
      setTasks(response.commonListDto ?? []);
      setTotalElements(response.totalElements ?? 0);

      try {
        const employeesWithQuestionsArray =
          await EQuestions.getEmployeesWithQuestions();
        setEmployeesWithQuestions(new Set(employeesWithQuestionsArray));
      } catch (error) {
        setEmployeesWithQuestions(new Set());
      }

      const formatResponse = await taskService.getDateFormat();
      setDateFormat(formatResponse);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load tasks");
      setTasks([]);
      setTotalElements(0);
    }
  }, [currentPage, searchFilter, selectedDepartment, selectedLevel]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Function to fetch labs based on department
  const fetchLabsByDepartment = async (
    departmentId: number,
    currentLab?: number
  ) => {
    if (!departmentId) {
      setLabOptions([]);
      return;
    }
    try {
      const labs = await adminService.getDepartmentLabs(departmentId);
      const transformedLabs = labs.map(lab => ({
        ...lab,
        value: lab.value || lab.key
      }));
      setLabOptions(transformedLabs);

      setLabOptions(transformedLabs);

      if (currentLab) {
        const matchingLab = transformedLabs.find(
          (lab) => lab.id === currentLab
        );
        if (matchingLab) {
          setSelectedLabId(matchingLab.id);
        }
      }
    } catch (error) {
      setLabOptions([]);
      setError("Failed to fetch labs for this department");
    }
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
      toast.error("Failed to load questions");
    } finally {
      setQuestionsLoading(false);
    }
  };
  // Open Lab Change Modal
  const handleOpenLabChangeModal = async (employee: any) => {
    setSelectedEmployeeForLabChange(employee);
    setShowLabChangeModal(true);
    if (employee.departmentId) {
      await fetchLabsByDepartment(employee.departmentId, employee.labId);
    } else {
      setLabOptions([]);
      setSelectedLabId(undefined);
    }
  };

  // Lab Change Submission
  const handleLabChangeSubmit = async () => {
    if (!selectedLabId || !selectedEmployeeForLabChange) return;

    const selectedLab = labOptions.find((lab) => lab.id === selectedLabId);
    if (!selectedLab) return;

    try {
      await taskService.labAllocation(
        selectedEmployeeForLabChange.employeeId,
        selectedLabId
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

  const handleFreezeTask = async (shouldArchive: boolean) => {
    if (!selectedTaskId || selectedEmployeeId === null) return;

    try {
      if (shouldArchive) {
        await Promise.all([
          taskService.freezeTask(selectedTaskId),
          adminService.achiveEmployees(selectedEmployeeId)
        ]);
        toast.success("Employee archived and tasks frozen successfully");
      } else {
        await taskService.freezeTask(selectedTaskId);
        toast.success("Tasks frozen successfully");
      }

      await fetchTasks();
      setShowFreezeModal(false);
      setSelectedTaskId("");
      setSelectedEmployeeId(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to complete operation";
      setError(errorMessage);
      toast.error(errorMessage);
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

  return (
    <div className="space-y-2">
      {/* Header / Search */}
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
            className="w-64 rounded-md border bg-background px-3 py-2 text-sm"
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

          <Table>
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
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No tasks found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => {
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

                  let progressColor = "bg-muted-foreground/60";
                  const status = (task.status || "").toLowerCase();
                  if (status === "completed") {
                    progressColor = "bg-green-600";
                  } else if (status === "in progress") {
                    progressColor = "bg-amber-500";
                  }

                  return (
                    <TableRow
                      key={(task as any).id ?? (task as any).employeeId}
                    >
                      {/* Employee Name */}
                      <TableCell className="font-semibold min-w-[140px]">
                        {(task as any).employeeName}
                      </TableCell>
                      {/* Level */}
                      <TableCell>{(task as any).level}</TableCell>
                      {/* Role & Department */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-base font-semibold">
                            {(task as any).role}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {(task as any).department}
                          </span>
                        </div>
                      </TableCell>
                      {/* DOJ */}
                      <TableCell className="min-w-[100px]">
                        {(task as any).doj}
                      </TableCell>
                      {/* Lab */}
                      <TableCell className="min-w-[80px]">
                        {(task as any).lab}
                      </TableCell>
                      {/* Progress */}
                      <TableCell className="min-w-[120px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">
                              {completed}/{totalQ}
                            </span>
                            <span className="text-muted-foreground">
                              {percent}%
                            </span>
                          </div>
                          <ProgressBar value={percent} color={progressColor} />
                        </div>
                      </TableCell>
                      {/* Status */}
                      <TableCell className="min-w-[100px]">
                        {(() => {
                          const status = (task.status || "").toLowerCase();
                          const base =
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium";
                          if (completed === 0) {
                            return (
                              <span
                                className={`${base} bg-blue-600/20 text-blue-600`}
                              >
                                Open
                              </span>
                            );
                          }
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
                              In Progress
                            </span>
                          );
                        })()}
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-5">
                          <div className="w-[18px]">
                            {!task.lab && (
                              <button
                                className="rounded-lg text-[#eea11d]"
                                onClick={() => handleOpenLabChangeModal(task)}
                                aria-label="Change lab"
                                title="Change Lab"
                              >
                                <FlaskConical size={18} />
                              </button>

                            )}
                          </div>
                          <button
                            className="rounded-lg p-2 text-[#474BDD]"
                            onClick={() => (window.location.href = `/admin/tasks/${(task as any).id}`)}
                            aria-label="View details"
                          >
                            <Eye size={18} />
                          </button>

                          {/* View Answers button - only show for employees who have questions assigned */}
                          {employeesWithQuestions.has(parseInt(task.employeeId, 10)) && (
                            <button
                              className="rounded-lg text-[#3b82f6]"
                              onClick={() => {
                                handleViewQuestions(task.id, task.employeeName);
                              }}
                              disabled={questionsLoading}
                              aria-label="View answers"
                              title="View Employee Answers"
                            >
                              <TicketCheck size={18} />
                            </button>
                          )}

                          {task.status?.toLowerCase() === "completed" &&
                            task.freezeTask === "N" && task.labId && (
                              <button
                                className="rounded-lg"
                                aria-label="Archive and Freeze"
                                title="Archive and Freeze Employee"
                                onClick={() => {
                                  setSelectedTaskId(task.id);
                                  setSelectedEmployeeId(parseInt(task.employeeId, 10));
                                  setShowFreezeModal(true);
                                }}
                              >
                                <Unlock size={18} />
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
      {showFreezeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Archive Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Do you want to Archive and Freeze this employee?
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="default"
                  onClick={() => handleFreezeTask(true)}
                  className="w-full"
                >
                  Yes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFreezeModal(false)}
                  className="w-full"
                >
                  No
                </Button>

              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showLabChangeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="flex-shrink-0 px-5 py-4 shadow-md">
              <CardTitle className="text-1xl font-semibold text-primary-gradient">
                Change Lab
              </CardTitle>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Select Lab <span className="text-red-500">*</span>
                  </label>
                  {loadingLabs ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="text-sm text-muted-foreground">
                        Loading labs...
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3">
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

                <button
                  onClick={handleLabChangeSubmit}
                  disabled={!selectedLabId}
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
              shadow-md transition-all duration-300 ease-in-out 
              hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
              disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQuestionsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

            <div className="flex-shrink-0 px-5 py-4 shadow-md flex items-center justify-between">
              <h2 className="text-1xl font-semibold text-primary-gradient">
                Employee Task Questions
              </h2>

              {/* Progress counter */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">
                    {completedQuestionCount} / {totalQuestionCount}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Completed
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {selectedTaskQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    No questions found for this employee.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedTaskQuestions.map((question, index) => (
                    <div key={question.id || index} className="space-y-2">

                      {/* Question number + text */}
                      <p className="text-[15px] font-semibold text-gray-800 leading-relaxed mb-5">
                        {index + 1}. {question.question || "No question text available"}
                      </p>

                      {/* Answer below question */}
                      <p className="text-[14px] text-gray-700 leading-relaxed pl-4 ">
                        {question.response || "No response provided"}
                      </p>


                      {/* Divider */}
                      {index < selectedTaskQuestions.length - 1 && (
                        <div className="border-b border-gray-200 pt-3"></div>
                      )}
                    </div>
                  ))}
                </div>

              )}
            </div>

            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => {
                  setShowQuestionsModal(false);
                  setSelectedTaskQuestions([]);
                  setSelectedEmployeeName("");
                }}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
