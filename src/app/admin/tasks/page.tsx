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
} from "lucide-react";
import SearchableDropdown from "../../components/SearchableDropdown";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const PAGE_SIZE = 10;

const clampPercent = (n: number) => Math.max(0, Math.min(100, n));

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskProjection[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [employeesWithQuestions, setEmployeesWithQuestions] = useState<
    Set<number>
  >(new Set());
  const [dateFormat, setDateFormat] = useState<string | null>(null);
  const [showLabChangeModal, setShowLabChangeModal] = useState(false);
  const [selectedEmployeeForLabChange, setSelectedEmployeeForLabChange] = useState<any>(null);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<number | undefined>(undefined);
  const [loadingLabs, setLoadingLabs] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalElements / PAGE_SIZE)),
    [totalElements]
  );

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, unknown> = {
        page: currentPage,
        size: PAGE_SIZE,
      };
      const search = searchFilter.trim();
      if (search) params.search = search;
      const response = await taskService.getTask(params);
      const taskList = response.commonListDto.content ?? [];
      setTasks(taskList);
      setTotalElements(response.totalElements ?? 0);

      // Get list of employees who have questions assigned (from employee_question table)
      try {
        const employeesWithQuestionsArray =
          await EQuestions.getEmployeesWithQuestions();
        setEmployeesWithQuestions(new Set(employeesWithQuestionsArray));
      } catch (error) {
        console.error("Error fetching employees with questions:", error);
        setEmployeesWithQuestions(new Set());
      }

      const [tasksResponse, formatResponse] = await Promise.all([
        taskService.getTask(params),
        taskService.getDateFormat(),
      ]);
      setTasks(tasksResponse.commonListDto.content ?? []);
      setTotalElements(tasksResponse.totalElements ?? 0);
      setDateFormat(formatResponse); // Store the fetched format string
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load tasks");
      setTasks([]);
      setTotalElements(0);
    }
  }, [currentPage, searchFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Function to fetch labs based on department
  const fetchLabsByDepartment = async (department: string,currentLab?: string) => {
    if (!department) {
      setLabOptions([]);
      return;
    }
    try {
      const labs = await adminService.getLab(department);
      const labOptionsFormatted: DropDownDTO[] = labs.map((lab, index) => ({
        id: index + 1,
        value: lab as string,
        key: lab as string
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
      console.error("Error fetching labs:", error);
      setLabOptions([]);
      setError("Failed to fetch labs for this department");
    }
  };

  // Open Lab Change Modal
 const handleOpenLabChangeModal = async (employee: any) => {
    setSelectedEmployeeForLabChange(employee);
    setShowLabChangeModal(true);

    if (employee.department) {
      await fetchLabsByDepartment(employee.department, employee.lab);
    } else {
      setLabOptions([]);
      setSelectedLabId(undefined);
    }
  };

  // Lab Change Submission
const handleLabChangeSubmit = async () => {
  if (!selectedLabId || !selectedEmployeeForLabChange) return;

  const selectedLab = labOptions.find(lab => lab.id === selectedLabId);
  if (!selectedLab) return;

  try {
    await taskService.labAllocation(
      selectedEmployeeForLabChange.employeeId,
      selectedLab.value
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
              className="w-64 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              aria-label="Search tasks"
            />
          </div>
        </CardContent>
      </Card>

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
                        {(task as any).name}
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
                        {(() => {
                          const dojArray = (task as any).doj;
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-lg"
                            onClick={() =>
                              (window.location.href = `/admin/tasks/${task.taskIds}`)
                            }
                            aria-label="View details"
                          >
                            <Eye size={16} />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-lg"
                            onClick={() => handleOpenLabChangeModal(task)}
                            aria-label="Change lab"
                            title="Change Lab"
                          >
                            <FlaskConical size={16} />
                          </Button>

                          {/* View Answers button - only show for employees who have questions assigned */}
                          {employeesWithQuestions.has(
                            parseInt(task.employeeId, 10)
                          ) && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-lg "
                                onClick={() => {
                                  // Use the first task ID from the comma-separated list
                                  const firstTaskId = task.taskIds.split(",")[0];
                                  window.location.href = `/admin/tasks/answers/${firstTaskId}`;
                                }}
                                aria-label="View answers"
                                title="View Employee Answers"
                              >
                                <TicketCheck size={16} />
                              </Button>
                            )}

                          {task.status?.toLowerCase() === "completed" &&
                            task.freeze === "N" &&
                            (task.lab ?? "").toString().trim() !== "" && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-lg"
                                aria-label="Completed"
                                onClick={() => {
                                  setSelectedTaskId(task.taskIds);
                                  setShowFreezeModal(true);
                                }}
                              >
                                <Unlock size={16} />
                              </Button>
                            )}
                          {task.status?.toLowerCase() === "completed" &&
                            task.freeze === "Y" && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-lg ml-2"
                                aria-label="Frozen"
                                disabled
                              >
                                <Lock size={16} />
                              </Button>
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
      {showLabChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
              
                Change Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
             
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Lab:</label>
                {loadingLabs ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-sm text-muted-foreground">Loading labs...</div>
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
                  />
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleLabChangeSubmit}
                  disabled={!selectedLabId}
                  className="flex-1"
                >
                  Update Lab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLabChangeModal(false);
                    setSelectedEmployeeForLabChange(null);
                    setSelectedLabId(undefined);
                    setLabOptions([]);
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
    </div>
  );
};


export default TasksPage;
