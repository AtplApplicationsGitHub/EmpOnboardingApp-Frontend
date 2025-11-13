"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
} from "../../components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../../components/ui/table";
import Button from "../../components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
} from "lucide-react";
import { adminService, taskService } from "../../services/api";
import { toast } from "react-hot-toast";
import { Task } from "../../types";
import { useRouter } from "next/navigation";


const PAGE_SIZE = 10;

const AcknowledgementPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAcknowledgementTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, size: PAGE_SIZE };

      const search = searchFilter.trim();
      if (search) {
        params.search = search;
      }

      const data = await adminService.findFilteredTaskAck(params);
      console.log("Fetched acknowledgement tasks:", data);
      setTasks(data.commonListDto || []);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load tasks");
      setTasks([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, searchFilter]);

  useEffect(() => {
    fetchAcknowledgementTasks();
  }, [fetchAcknowledgementTasks]);


  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) setPage(newPage);
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (page > 3) pages.push(0, "...");
      for (
        let i = Math.max(1, page - 2);
        i <= Math.min(totalPages - 2, page + 2);
        i++
      )
        pages.push(i);
      if (page < totalPages - 4) pages.push("...", totalPages - 1);
      else if (page < totalPages - 3) pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="space-y-2">
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by employee, group, department, or role..."
              className="w-96 rounded-md border bg-background px-3 py-2 text-sm"
              aria-label="Search tasks"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Employee Name</TableHead>
                <TableHead>Group ID</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users size={48} className="text-muted-foreground" />
                      <p>No tasks found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.id}</TableCell>
                    <TableCell>{task.employeeName}</TableCell>
                    <TableCell>{task.groupName}</TableCell>
                    <TableCell>{task.level}</TableCell>
                    <TableCell>{task.role}</TableCell>
                    <TableCell>{task.department}</TableCell>

                    {/* Progress Section */}
                    <TableCell>
                      {(() => {
                        const completed =
                          (task as any).completedQuetions ??
                          (task as any).completedQuestions ??
                          0;
                        const totalQ =
                          (task as any).totalQuetions ??
                          (task as any).totalQuestions ??
                          0;
                        const percent = totalQ ? Math.round((completed / totalQ) * 100) : 0;

                        return (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">
                                {completed}/{totalQ}
                              </span>
                              <span className="text-muted-foreground">{percent}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}
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
                            In Progress
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => router.push(`/admin/acknowledgement/${task.id}`)} >
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>

                ))
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
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} />
                </Button>

                {generatePageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={i} className="px-3 py-1 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={i}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(p as number)}
                    >
                      {(p as number) + 1}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages - 1}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page === totalPages - 1}
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

export default AcknowledgementPage;
