"use client";
import React, { useEffect, useRef, useState } from "react";
import { taskService } from "../../services/api";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { Users } from "lucide-react";

const TasksPage: React.FC = () => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const PAGE_SIZE = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTasks();
    if (showCreateModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentPage, showCreateModal]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const fetchTasks = async () => {
    try {
      const params: any = { page: currentPage };
      if (searchFilter && searchFilter.trim() !== "") {
        params.search = searchFilter.trim();
      }
      const response = await taskService.getTask(params);
      setTasks(response.commonListDto || []);
      setTotal(response.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      // setLoading(false);
    }
  };

  const levelBadge = (level: "L1" | "L2" | "L3" | "L4") => {
    const map: Record<string, string> = {
      L1: "bg-blue-900 text-blue-100",
      L2: "bg-green-900 text-green-100",
      L3: "bg-yellow-900 text-yellow-900 dark:text-yellow-100",
      L4: "bg-red-900 text-red-100",
    };
    return `inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-md w-fit ${
      map[level] ?? ""
    }`;
  };

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
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
    }
    return pages;
  };

  const onView = (task: Task) => {
    console.log("View clicked:", task);
  };

  const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full h-2 rounded bg-muted/40 overflow-hidden">
      <div
        className="h-full bg-muted-foreground/60"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm text-muted-foreground">
              Showing {tasks.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
              {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} tasks
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead className="w-12"></TableHead> */}
                <TableHead>Employee</TableHead>
                <TableHead>Role & Experience</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No Tasks found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => {
                  const completed = task.completedQuestions ?? 0;
                  const total = task.totalQuestions ?? 0;
                  const percent = total
                    ? Math.round((completed / total) * 100)
                    : 0;
                  const dueDate = task.createdTime;
                  const isOverdue = dueDate
                    ? new Date(dueDate).getTime() < Date.now() &&
                      completed < total
                    : false;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-foreground">
                              {task.employeeName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {task.id}
                            </span>
                            <span>{task.level}</span>
                          </div>
                        </TableCell>
                      </TableCell>
                      <TableCell className="font-medium">
                        {" "}
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-white">
                            {task.role}
                          </span>
                          <span className="text-sm text-gray-400">
                            Lab: {task.lab}
                          </span>
                          <span className="text-sm text-gray-400">
                            {task.pastExperience} yrs exp
                          </span>
                          <span className="text-sm text-gray-400">
                            Prev: {task.prevCompany}
                          </span>
                          <span className="text-sm text-gray-400">
                            {task.complianceDay} day complaince
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">
                              {completed}/{total}
                            </span>
                            <span className="text-muted-foreground">
                              {percent}%
                            </span>
                          </div>
                          <ProgressBar value={percent} />
                          {dueDate && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-600/20 text-red-600 px-3 py-1 text-sm">
                            <span className="i-lucide-alert-circle" />
                            Overdue
                          </span>
                        ) : completed >= total && total > 0 ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-green-600/20 text-green-600 px-3 py-1 text-sm">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-400 px-3 py-1 text-sm">
                            In Progress
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            (window.location.href = `/admin/tasks/${task.id}`)
                          }
                        //   onClick={() => onView?.(task)} // hook your handler
                          className="rounded-lg"
                          aria-label="View details"
                          title="View details"
                        >
                          <Eye size={16} />
                          {/* <span className="i-lucide-eye" /> */}
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
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className="p-2"
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="p-2"
                >
                  <ChevronLeft size={16} />
                </Button>
                {generatePageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === "..." ? (
                      <span className="px-3 py-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="min-w-[40px]"
                      >
                        {(page as number) + 1}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2"
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
export default TasksPage;
