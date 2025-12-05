"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Edit,
  Trash2,
} from "lucide-react";
import Button from "../../components/ui/button";
import { employeeService } from "@/app/services/api";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Department } from "@/app/types";

const PAGE_SIZE = 10;

type FormState = {
  name: string;
};

const emptyForm: FormState = {
  name: "",
};

const DepartmentsPage: React.FC = () => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<any | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput.trim());
    setCurrentPage(0);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setSelectedDeptId(null);
    setForm({ ...emptyForm });
    setShowModal(true);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const openEditModal = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return;
    setForm({ name: dept.location });
    setSelectedDeptId(deptId);
    setEditMode(true);
    setShowModal(true);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedDeptId(null);
    setForm({ ...emptyForm });
  };

  const fetchDepartments = async () => {
    try {
      const searchTerm = searchFilter || undefined;
      const data = await employeeService.getDepartments(currentPage, searchTerm);
      console.log("Fetched departments:", data);
      setDepartments(data.commonListDto);
      setTotal(data.totalElements);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch departments");
    } finally {
      setIsInitialLoad(false);
    }
  };

  React.useEffect(() => {
    fetchDepartments();
  }, [currentPage, searchFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const location = form.name.trim();
    if (!location) {
      toast.error("Department name is required");
      return;
    }

    const isDuplicate = departments.some(
      (dept) => dept.location.toLowerCase() === location.toLowerCase()
    );
    if (isDuplicate) {
      toast.error("This department already exists");
      return;
    }

    try {
      await employeeService.createDepartment({ location });
      console.log("Department created:", location);
      toast.success("Department created successfully");
      closeModal();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create department");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDeptId) return;

    const location = form.name.trim();
    if (!location) {
      toast.error("Department name is required");
      return;
    }

    const isDuplicate = departments.some(
      (dept) => dept.id !== selectedDeptId && dept.location.toLowerCase() === location.toLowerCase()
    );
    if (isDuplicate) {
      toast.error("This department name already exists");
      return;
    }

    try {
      await employeeService.createDepartment({
        id: selectedDeptId,
        location,
      });
      toast.success("Department updated successfully");
      closeModal();
      fetchDepartments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update department");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (currentPage > 3) pages.push(0, "…");
      for (
        let i = Math.max(1, currentPage - 2);
        i <= Math.min(totalPages - 2, currentPage + 2);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 4) pages.push("…", totalPages - 1);
      else if (currentPage < totalPages - 3) pages.push(totalPages - 1);
    }
    return pages;
  };

  if (isInitialLoad) {
    return null;
  }

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      await employeeService.deleteDepartment(departmentToDelete);
      toast.success("Department deleted successfully!");
      fetchDepartments();
      setShowDeleteModal(false);
      setDepartmentToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete Department.");
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-80">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by department..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>

        {/* Add button */}
        <Button onClick={openCreateModal}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          <span>Add New Department</span>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="table-heading-bg text-primary-gradient">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[35%]">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[25%]">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[25%]">
                  Updated
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[15%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MapPin size={48} className="text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm font-medium">
                        No departments found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  // <tr key={dept.id} className="hover:bg-accent transition-all">
                  <tr key={dept.id} className="hover:bg-[var(--custom-gray)] transition-all">

                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {dept.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {dept.createdTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {dept.updatedTime}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(dept.id)}
                        className="rounded-lg text-primary transition-colors duration-300 hover:text-primary/80 hover:bg-primary/10"
                        title="Edit Department"
                      >
                        <Edit size={18} />
                      </button>
                      {!dept.disableDelete && (
                        <button
                          onClick={() => {
                            setDepartmentToDelete(dept.id);
                            setShowDeleteModal(true);
                          }}
                          className="rounded-lg text-destructive transition-colors duration-300 hover:text-destructive/80 hover:bg-destructive/10 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-muted"
                          title="Delete Department"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <div className="flex items-center justify-between px-4 py-2">
                <div className="text-sm text-muted-foreground">
                  Showing {departments.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                  {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} departments
                </div>
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

                {generatePageNumbers().map((pageNum, idx) => (
                  <React.Fragment key={idx}>
                    {pageNum === "..." ? (
                      <span className="px-3 py-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum as number)}
                        className="min-w-[40px]"
                      >
                        {(pageNum as number) + 1}
                      </Button>
                    )}
                  </React.Fragment>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2"
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-border">
              <CardTitle className="text-xl font-semibold text-primary">
                {editMode ? "Update Department" : "Create New Department"}
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <label className="block text-[13px] font-semibold text-foreground mb-2">
                Department Name <span className="text-destructive">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter department name"
                className="w-full px-3.5 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-muted/30 border-t border-border">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  className="shadow-md transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  onClick={editMode ? handleUpdate : handleCreate}
                >
                  {editMode ? "Update Department" : "Create Department"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && departmentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Department</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-foreground">
                Are you sure you want to delete this department?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDepartmentToDelete(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDepartment}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;