"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { groupLeadService } from "../../services/api";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import { Task } from "@/app/types";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

interface GroupedTask {
  groupId: number;
  groupName: string;
  employeeId: string;
  employeeName: string;
  level: string;
  department: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  status: 'completed' | 'overdue' | 'in_progress';
  dueDate: string;
  tasks: Task[];
}

const clampPercent = (n: number) => Math.max(0, Math.min(100, n));

const GroupLeadTasksPage: React.FC = () => {
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [groupedTasks, setGroupedTasks] = useState<GroupedTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<GroupedTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE)),
    [filteredTasks.length]
  );

  // Group tasks by group and employee
  const groupTasksByGroupAndEmployee = useCallback((tasks: Task[]): GroupedTask[] => {
    const groupMap = new Map<string, GroupedTask>();

    tasks.forEach(task => {
      // Create a unique key for group + employee combination
      const key = `${task.groupName}-${task.employeeName}`;
      
      if (!groupMap.has(key)) {
        // Calculate status based on task completion and due dates
        const completedCount = tasks.filter(t => 
          t.groupName === task.groupName && 
          t.employeeName === task.employeeName && 
          t.status === 'completed'
        ).length;
        
        const totalCount = tasks.filter(t => 
          t.groupName === task.groupName && 
          t.employeeName === task.employeeName
        ).length;

        // Determine overall status
        let status: 'completed' | 'overdue' | 'in_progress' = 'in_progress';
        
        if (completedCount === totalCount) {
          status = 'completed';
        } else {
          // Check if any task is overdue
          const hasOverdue = tasks.some(t => 
            t.groupName === task.groupName && 
            t.employeeName === task.employeeName && 
            t.status === 'overdue'
          );
          status = hasOverdue ? 'overdue' : 'in_progress';
        }

        groupMap.set(key, {
          groupId: task.groupId || 1, // Default to 1 if not available
          groupName: task.groupName,
          employeeId: task.employeeId?.toString() || task.id?.toString() || '',
          employeeName: task.employeeName,
          level: task.level,
          department: task.department,
          role: task.role,
          totalTasks: totalCount,
          completedTasks: completedCount,
          status: status,
          dueDate: task.doj, // Using date of joining as due date reference
          tasks: tasks.filter(t => 
            t.groupName === task.groupName && 
            t.employeeName === task.employeeName
          ),
        });
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => {
      // Sort by status priority: overdue first, then in_progress, then completed
      const statusPriority = { overdue: 0, in_progress: 1, completed: 2 };
      if (a.status !== b.status) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      
      // Then sort by completion percentage (lowest first for in_progress)
      const aPercent = (a.completedTasks / a.totalTasks) * 100;
      const bPercent = (b.completedTasks / b.totalTasks) * 100;
      
      return aPercent - bPercent;
    });
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tasksData = await groupLeadService.getTasks();
      setAllTasks(tasksData);
      
      const grouped = groupTasksByGroupAndEmployee(tasksData);
      setGroupedTasks(grouped);
      setFilteredTasks(grouped);
      
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load tasks");
      setAllTasks([]);
      setGroupedTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  }, [groupTasksByGroupAndEmployee]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks based on search
  useEffect(() => {
    if (!searchFilter.trim()) {
      setFilteredTasks(groupedTasks);
      setCurrentPage(0);
      return;
    }

    const filtered = groupedTasks.filter(task =>
      task.employeeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      task.groupName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      task.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
      task.role.toLowerCase().includes(searchFilter.toLowerCase())
    );
    
    setFilteredTasks(filtered);
    setCurrentPage(0);
  }, [searchFilter, groupedTasks]);

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

  const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full h-2 rounded bg-muted/40 overflow-hidden" aria-hidden>
      <div
        className="h-full bg-muted-foreground/60"
        style={{ width: `${clampPercent(value)}%` }}
      />
    </div>
  );

  const handleViewTasks = (groupedTask: GroupedTask) => {
    // Navigate to employee tasks detail page
    router.push(`/group-lead/tasks/${groupedTask.employeeId}?name=${encodeURIComponent(groupedTask.employeeName)}&group=${encodeURIComponent(groupedTask.groupName)}`);
  };

  // Paginate the filtered tasks
  const paginatedTasks = filteredTasks.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage tasks grouped by employee and group
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by employee, group, department, or role..."
              className="w-96 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
              aria-label="Search tasks"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredTasks.length} employee task group{filteredTasks.length !== 1 ? 's' : ''} found
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
                <TableHead>Group</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Role & Department</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchFilter ? 'No tasks found matching your search' : 'No tasks found'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((groupedTask, index) => {
                  const percent = groupedTask.totalTasks
                    ? Math.round((groupedTask.completedTasks / groupedTask.totalTasks) * 100)
                    : 0;

                  return (
                    <TableRow key={`${groupedTask.groupName}-${groupedTask.employeeName}-${index}`}>
                      {/* Employee Name */}
                      <TableCell className="font-semibold">
                        {groupedTask.employeeName}
                      </TableCell>

                      {/* Group Name */}
                      <TableCell className="font-medium">
                        {groupedTask.groupName}
                      </TableCell>

                      {/* Level */}
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {groupedTask.level}
                        </span>
                      </TableCell>

                      {/* Role & Department */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-base font-semibold">
                            {groupedTask.role}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {groupedTask.department}
                          </span>
                        </div>
                      </TableCell>

                      {/* Progress */}
                      <TableCell className="min-w-[220px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">
                              {groupedTask.completedTasks}/{groupedTask.totalTasks}
                            </span>
                            <span className="text-muted-foreground">
                              {percent}%
                            </span>
                          </div>
                          <ProgressBar value={percent} />
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {(() => {
                          const base =
                            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium";

                          if (groupedTask.status === "overdue") {
                            return (
                              <span
                                className={`${base} bg-red-600/20 text-red-600`}
                              >
                                Overdue
                              </span>
                            );
                          }

                          if (groupedTask.status === "completed") {
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
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-lg"
                          onClick={() => handleViewTasks(groupedTask)}
                          aria-label="View task details"
                        >
                          <Eye size={16} />
                        </Button>
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
                Page {currentPage + 1} of {totalPages} • Showing {paginatedTasks.length} of {filteredTasks.length} employee task groups
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
    </div>
  );
};

export default GroupLeadTasksPage;
