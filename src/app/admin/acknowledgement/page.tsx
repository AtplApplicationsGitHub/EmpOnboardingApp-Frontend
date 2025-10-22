"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "../../components/ui/card";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
} from "lucide-react";
import Button from "../../components/ui/button";
import { TaskQuestions } from "../../types";
import { adminService } from "../../services/api";
import SearchableDropdown from "../../components/SearchableDropdown";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;



const AcknowledgementPage: React.FC = () => {
  const [questions, setQuestions] = useState<TaskQuestions[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Record<number, string>>({});




  useEffect(() => {
    fetchEmployees();
  }, [searchFilter, page]);


  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = { page };
      const data = await adminService.acknowledgementQuestion(params);
      setQuestions(data.commonListDto || []);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  // Handle comment input change
const handleCommentChange = (id: number, value: string) => {
    setComments((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle verify action
 const handleVerify = async (id: number) => {
    try {
      const comment = comments[id];
      if (!comment || comment.trim() === "") {
        toast.error("Please enter a comment before verifying");
        return;
      }

      setLoading(true);
      await adminService.saveVerificationComment(id, comment);
      
      toast.success("Question verified successfully");
      
      // Clear the comment after successful verification
      setComments((prev) => ({
        ...prev,
        [id]: "",
      }));
      
      // Optionally refresh the data
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to verify question");
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
      ) {
        pages.push(i);
      }
      if (page < totalPages - 4) pages.push("...", totalPages - 1);
      else if (page < totalPages - 3) pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="p-6 max-w-9xl mx-auto space-y-6">
      {/* Questions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No Questions found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((ques) => (
                  <TableRow key={ques.id}>
                    <TableCell className="min-w-[140px]">
                      {ques.groupName}
                    </TableCell>
                    <TableCell className="font-medium min-w-[140px]">
                      {ques.questionId}
                    </TableCell>
                    <TableCell className="min-w-[140px]">
                      {ques.response}
                    </TableCell>
                   <TableCell className="min-w-[200px]">
                      <input
                        type="text"
                        value={comments[ques.id] || ""}
                        onChange={(e) =>
                          handleCommentChange(ques.id, e.target.value)
                        }
                        placeholder="Enter comments..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </TableCell>
                     <TableCell>
                      {comments[ques.id] && comments[ques.id].trim() !== "" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(ques.id)}
                          className="rounded-lg"
                          aria-label="Verify question"
                        >
                          <CheckCircle size={16} className="mr-1" />
                          Verify
                        </Button>
                      )}
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
                  className="p-2"
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="p-2"
                >
                  <ChevronLeft size={16} />
                </Button>
                {generatePageNumbers().map((p, idx) =>
                  p === "..." ? (
                    <span key={idx} className="px-3 py-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={idx}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(p as number)}
                      className="min-w-[40px]"
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
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page === totalPages - 1}
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

export default AcknowledgementPage;
