"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../../../components/ui/table";
import Button from "../../../components/ui/button";
import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Users,
  Check,
  CheckCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Task } from "../../../types";
import { adminService, taskService } from "../../../services/api";

const PAGE_SIZE = 10;

const EmployeeAcknowledgementDetail: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [verifications, setVerifications] = useState<Record<number, "yes" | "no" | null>>({});
  const [verifiedTasks, setVerifiedTasks] = useState<Set<number>>(new Set());



  useEffect(() => {
    fetchEmployeeAcknowledgementTasks();
  }, [employeeId, page]);

  const fetchEmployeeAcknowledgementTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTaskById(employeeId);

      //it should be list even for single employee
      const list: Task[] = Array.isArray(response) ? response : response ? [response] : [];

      // Update table data
      setTasks(list);
      setTotalElements(list.length);

      // Handle existing comments and verified tasks
      const existingComments: Record<number, string> = {};
      const alreadyVerified = new Set<number>();

      list.forEach((task: any) => {
        if (task.comments) {
          existingComments[task.id] = task.comments;
          alreadyVerified.add(task.id);
        }
      });

      setComments(existingComments);
      setVerifiedTasks(alreadyVerified);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load employee tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };


  // Handle comment input change
  const handleCommentChange = (taskId: number, value: string) => {
    setComments((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  // Handle verification change (Yes/No buttons)
  const handleVerificationChange = (taskId: number, value: "yes" | "no") => {
    setVerifications((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };


  // Handle verify action
  const handleVerify = async (taskId: number) => {
    try {
      const comment = comments[taskId];
      const verification = verifications[taskId];

      if (!comment || comment.trim() === "") {
        toast.error("Please enter a comment before verifying");
        return;
      }

      if (verification === null || verification === undefined) {
        toast.error("Please select Yes or No before verifying");
        return;
      }

      console.log("Comment being sent to BE:", comment); // Debug log
      console.log("Verification being sent to BE:", verification); // Debug log
      console.log("Type of comment:", typeof comment); // Debug log

      setLoading(true);

      //answer is either "yes" or "no"
      const answer = verifications[taskId] as string;
      await adminService.saveVerificationComment(answer, taskId, comment);
      setVerifiedTasks(prev => new Set([...prev, taskId]));
      toast.success("Task verified successfully");

      // Optionally refresh the data
      fetchEmployeeAcknowledgementTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to verify task");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6 space-y-6 max-w-full mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/acknowledgement")}
          className="rounded-lg"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Group ID</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-[150px]">Verification</TableHead>
                  <TableHead className="min-w-[250px]">Comments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <p>Loading...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
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
                      <TableCell>{task.groupName}</TableCell>
                      <TableCell>{task.groupId}</TableCell>
                      <TableCell>{task.level}</TableCell>
                      <TableCell>{task.role}</TableCell>
                      <TableCell>{task.department}</TableCell>

                      {/* Progress Section */}
                      <TableCell>
                        {(() => {
                          const completed = task.completedQuestions ?? 0;
                          const totalQ = task.totalQuestions ?? 0;
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

                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.complianceDay === "Compliant"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {task.complianceDay}
                        </span>
                      </TableCell>

                      {/* Verification Column - Yes/No Buttons */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant={verifications[task.id] === "yes" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVerificationChange(task.id, "yes")}
                          >
                            Yes
                          </Button>
                          <Button
                            variant={verifications[task.id] === "no" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleVerificationChange(task.id, "no")}
                          >
                            No
                          </Button>
                        </div>
                      </TableCell>

                      {/* Comments Column */}
                      <TableCell>
                        <input
                          type="text"
                          value={comments[task.id] || ""}
                          onChange={(e) => handleCommentChange(task.id, e.target.value)}
                          disabled={verifiedTasks.has(task.id)}
                          placeholder="Enter comments..."
                          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${verifiedTasks.has(task.id)
                            ? 'bg-gray-100 cursor-not-allowed border-gray-300 text-gray-600 opacity-80'
                            : 'bg-background border-input'
                            }`}
                        />
                      </TableCell>

                      {/* Actions Column - Verify Button */}
                      <TableCell>
                        {comments[task.id] &&
                          comments[task.id].trim() !== "" &&
                          verifications[task.id] !== null &&
                          verifications[task.id] !== undefined && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleVerify(task.id)}
                              disabled={verifiedTasks.has(task.id)}
                              className="rounded-lg bg-green-500 hover:bg-green-600 text-white"
                              aria-label="Verify task"
                            >
                              <CheckCircle size={16} className="mr-1" />
                              {verifiedTasks.has(task.id) ? "Verified" : "Verify"}
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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

export default EmployeeAcknowledgementDetail;