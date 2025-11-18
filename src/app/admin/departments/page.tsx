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
  Delete,
  Trash2,
} from "lucide-react";
import Button from "../../components/ui/button";
import { employeeService } from "@/app/services/api";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";


const PAGE_SIZE = 10;

type Department = {
  id: string;
  location: string;
  lab?: string;
  createdTime: string;
  updatedTime: string;
  disableDelete:boolean;
};

type FormState = {
  name: string;
};

const emptyForm: FormState = {
  name: "",
};

const DepartmentsPage: React.FC = () => {
  const nameInputRef = useRef<HTMLInputElement>(null);


  const [loading, setLoading] = useState(false);

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
  const [departmentToDelete, setDepartmentToDelete] = useState<any | null>(
    null
  );
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

  // Fetch departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const searchTerm = searchFilter || undefined;
      const data = await employeeService.getDepartments(currentPage, searchTerm);
      console.log("Fetched departments:", data);
      setDepartments(data.commonListDto);
      setTotal(data.totalElements);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    fetchDepartments();
  }, [currentPage, searchFilter]);


  // Handle create department
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const location = form.name.trim();
    if (!location) {
      toast.error("Department name is required");
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
  };;

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
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by department..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </form>

        {/* Add button */}
        <Button
          onClick={openCreateModal}
        >
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
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <p className="text-gray-500 text-sm">Loading departments...</p>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MapPin size={48} className="text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">
                        No departments found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {dept.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dept.createdTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {dept.updatedTime}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(dept.id)}
                        className="rounded-lg text-[#4c51bf] transition-colors duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)]"
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
                          className="rounded-lg text-red-500 transition-colors duration-300 hover:text-[#be123c] hover:bg-[rgba(225,29,72,0.08)]"
                          title="Delete Employee"
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
                  {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} users
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronsLeft size={18} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                {generatePageNumbers().map((pageNum, idx) =>
                  typeof pageNum === "number" ? (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[40px] h-10 rounded text-sm font-medium ${currentPage === pageNum
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum + 1}
                    </button>
                  ) : (
                    <span key={idx} className="px-2 text-gray-400">
                      {pageNum}
                    </span>
                  )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md">
              <CardTitle className="text-1xl font-semibold text-primary-gradient">
                {editMode ? "Update Department" : "Create New Department"}
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter department name"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  className="
                shadow-md transition-all duration-300 ease-in-out hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  onClick={editMode ? handleUpdate : handleCreate}
                >
                  {editMode ? "Update Department" : "Create Department"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && departmentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Department</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteDepartment}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
