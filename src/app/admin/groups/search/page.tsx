"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminService } from "../../../services/api";
import {
  Card,
  CardContent,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button";
import { DropDownDTO, Question } from "@/app/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
} from "lucide-react";
import SearchableDropdown from "../../../components/SearchableDropdown";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
const PAGE_SIZE = 10;

const GroupsSearchPage: React.FC = () => {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
  const [groupOptions, setGroupOptions] = useState<DropDownDTO[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);
  const [selectedGroup, setSelectedGroup] = useState<number | undefined>(undefined);

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

        const groups = await adminService.findAllGroups();
        const transformedGroups = groups.map(grp => ({
          ...grp,
          value: grp.value || grp.key
        }));
        setGroupOptions(transformedGroups);
      } catch (error) {
        toast.error("Failed to load dropdown options.");
      }
    };
    fetchLookupData();
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, unknown> = {
        page: currentPage,
        size: PAGE_SIZE,
      };

      params.group = selectedGroup;
      params.department = selectedDepartment;
      if (selectedLevel && levelOptions.length > 0) {
        const lvl = levelOptions.find(l => l.id === selectedLevel);
        if (lvl) {
          params.level = lvl.value;
        }
      }
      const response = await adminService.findQuestionsByFilters(params);
      const questionsList = Array.isArray(response.commonListDto)
        ? response.commonListDto
        : [];
      setQuestions(questionsList);
      setTotalElements(response.totalElements ?? 0);

      const total = response.totalElements ?? 0;

      console.log("Processed questions:", questionsList, "Total:", total);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load Questions");
      setQuestions([]);
      setTotalElements(0);
    }
  }, [currentPage, selectedDepartment, selectedLevel, selectedGroup, levelOptions]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
    <div className="space-y-2">
      {/* Dropdowns */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchableDropdown
            options={groupOptions}
            value={selectedGroup}
            required={false}
            displayFullValue={false}
            onChange={(group) => {
              if (group === undefined) {
                setSelectedGroup(undefined);
                setCurrentPage(0);
              } else if (!Array.isArray(group)) {
                setSelectedGroup(group as number);
                setCurrentPage(0);
              }
            }}
            placeholder="Select Group"
          />
          <SearchableDropdown
            options={departmentOptions}
            value={selectedDepartment}
            required={false}
            displayFullValue={false}
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
        </div>
         <div className="flex items-right gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/groups")}
            className="flex items-center gap-1">
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </div>

      {/* Questions Table */}
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
                <TableHead className="w-[40%]">Question</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Verified by</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No questions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => (
                  <TableRow key={question.id}>
                    {/* Question - wider column */}
                    <TableCell className="font-medium w-[40%]">
                      {question.text}
                    </TableCell>
                    {/* Response */}
                    <TableCell>
                      {question.response === "yes_no" ? "Yes/No" : "Text"}
                    </TableCell>
                    {/* Due (complainceDay) */}
                    <TableCell>
                      {question.complainceDay}
                    </TableCell>
                    {/* Period */}
                    <TableCell>
                      {question.period}
                    </TableCell>
                    {/* Verified by */}
                    <TableCell>
                      {question.verifiedBy || "-"}
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
    </div>
  );
};

export default GroupsSearchPage;