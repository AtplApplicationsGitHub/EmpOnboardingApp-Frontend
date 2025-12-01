"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminService, labService } from "../../services/api";
import { DropDownDTO, Lab } from "../../types";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import {
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Edit,
  Minus,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "@/app/components/SearchableDropdown";

const PAGE_SIZE = 10;

type FormState = {
  location: string;
  departmentId: number,
  labInputs: string[];
};

const emptyForm: FormState = {
  location: "",
  departmentId: 0,
  labInputs: [""],
};

const LabsPage: React.FC = () => {
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [labs, setLabs] = useState<Lab[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationOptions, setLocationOptions] = useState<DropDownDTO[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingLabCount, setExistingLabCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  const fetchLabs = async (page = currentPage, search = searchFilter) => {
    setError(null);
    try {
      const result = await labService.getLabs(page, search);
      setLabs(result.commonListDto || []);
      setTotal(result.totalElements || 0);
    } catch (err: any) {
      if (
        err?.message?.includes("Network Error") ||
        err?.message?.includes("CORS")
      ) {
        setError(
          "Unable to connect to server. Please ensure the backend is running and CORS is configured."
        );
      } else {
        setError("Failed to fetch labs. Please try again.");
      }
      setLabs([]);
      setTotal(0);
    } finally {
      fetchLookupData();
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    fetchLookupData();
  }, [currentPage, searchFilter]);

  const fetchLookupData = async () => {
    try {
      const departments = await adminService.findAllDepartment();
      const transformedDepartments = departments.map(dept => ({
        ...dept,
        value: dept.value || dept.key
      }));
      setLocationOptions(transformedDepartments);
    } catch {
      toast.error("Failed to load dropdown options.");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput.trim());
    setCurrentPage(0);
  };

  const openCreateModal = () => {
    setEditMode(false);
    setSelectedLabId(null);
    setForm({ ...emptyForm });
    setShowModal(true);

    setTimeout(() => {
      locationInputRef.current?.focus();
    }, 100);
  };

  const openEditModal = async (labId: string) => {
    try {
      if (locationOptions.length === 0) {
        await fetchLookupData();
      }

      const lab = await labService.findLabById(labId);

      const existingLabs = Array.isArray(lab.lab) && lab.lab.length > 0
        ? lab.lab
        : [""];

      setForm({
        location: lab.location || "",
        departmentId: lab.departmentId || 0,
        labInputs: existingLabs,
      });

      setExistingLabCount(existingLabs.length);

      setSelectedLabId(labId);
      setEditMode(true);
      setShowModal(true);

      setTimeout(() => {
        const firstLabInput = document.querySelector('input[placeholder="Lab 1"]') as HTMLInputElement;
        firstLabInput?.focus();
      }, 100);
    } catch (error) {
      toast.error("Failed to load lab details");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedLabId(null);
    setForm({ ...emptyForm });
    setExistingLabCount(0);
  };

  const addLabRow = () => {
    setForm((prev) => ({ ...prev, labInputs: [...prev.labInputs, ""] }));
  };

  const removeLabRow = (index: number) => {
    setForm((prev) => {
      const next = [...prev.labInputs];
      next.splice(index, 1);
      return { ...prev, labInputs: next.length ? next : [""] };
    });
  };

  const updateLabRow = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.labInputs];
      next[index] = value;
      return { ...prev, labInputs: next };
    });
  };

  const validateAndBuildPayload = (): {
    location: string;
    departmentId: number;
    lab: string[];
  } | null => {
    const location = form.location.trim();
    const lab = form.labInputs.map((s) => s.trim()).filter(Boolean);
    const departmentId = form.departmentId;
    if (!location) {
      toast.error("Location is required");
      return null;
    }
    if (!lab.length) {
      toast.error("Add at least one lab");
      return null;
    }
    return { location, departmentId, lab };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = validateAndBuildPayload();
    if (!payload) return;

    try {
      await labService.createLab(payload);
      toast.success("Lab created successfully");
      closeModal();
      fetchLabs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create lab");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) return;

    const lab = form.labInputs.map((s) => s.trim()).filter(Boolean);

    if (!lab.length) {
      toast.error("At least one lab is required");
      return;
    }

    try {
      await labService.updateLab({ lab, id: selectedLabId });
      toast.success("Lab updated successfully");
      closeModal();
      fetchLabs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update lab");
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

  if (isInitialLoad) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {/* Search Box */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by department..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        {/* Action Button */}
        <Button onClick={openCreateModal}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          <span>Add New Lab</span>
        </Button>
      </div>
      {/* Results Count */}
      {/* {labs.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {currentPage * PAGE_SIZE + 1} to {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} labs
        </div>
      )} */}
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="table-heading-bg text-primary-gradient">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[20%]">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[35%]">
                  Labs
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[9%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {labs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MapPin size={48} className="text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm font-medium">No labs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                labs.map((lab) => (
                  <tr
                    key={lab.id}
                    className="hover:bg-[var(--custom-gray)] group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">
                        {lab.location}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(lab.lab) && lab.lab.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {lab.lab.map((name, idx) => (
                            <span
                              key={`${lab.id}-${idx}-${name}`}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => openEditModal(lab.id)}
                          className="rounded-lg text-[#4c51bf] duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                          title="Edit Lab"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
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
                  Showing {labs.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                  {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} users
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-input text-foreground transition-all hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft size={18} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg border border-input text-foreground transition-all hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>

                {generatePageNumbers().map((pageNum, idx) =>
                  typeof pageNum === "number" ? (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[40px] h-10 rounded text-sm font-medium transition-all ${currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-input text-foreground hover:bg-muted"
                        }`}
                    >
                      {pageNum + 1}
                    </button>
                  ) : (
                    <span key={idx} className="px-2 text-muted-foreground">
                      {pageNum}
                    </span>
                  )
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-input text-foreground transition-all hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-lg border border-input text-foreground transition-all hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Gradient Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-border">
              <CardTitle className="text-xl font-semibold text-primary">
                {editMode ? "Update Lab" : "Create New Lab"}
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <form onSubmit={editMode ? handleUpdate : handleCreate} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Department <span className="text-destructive">*</span>
                  </label>
                  {editMode ? (
                    <div className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-muted text-foreground">
                      {form.location}
                    </div>
                  ) : (
                    <SearchableDropdown
                      options={locationOptions}
                      value={
                        locationOptions.find((opt) => opt.value === form.location)?.id
                      }
                      onChange={(id) => {
                        const selected = locationOptions.find((o) => o.id === id);
                        setForm((prev) => ({
                          ...prev,
                          location: selected?.value ?? "",
                          departmentId: selected?.id ?? 0
                        }));
                      }}
                      placeholder="Select Department"
                      displayFullValue={false}
                      isEmployeePage={true}
                      disabled={false}
                    />
                  )}
                  <input ref={locationInputRef} className="sr-only" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[13px] font-semibold text-foreground">
                      Labs <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addLabRow}
                      title="Add Lab"
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.labInputs.map((value, idx) => {
                      return (
                        <div key={`lab-row-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateLabRow(idx, e.target.value)}
                            placeholder={`Lab ${idx + 1}`}
                            required={idx === 0}
                            className="flex-1 px-3.5 py-2.5 border-[1.5px] rounded-lg text-sm bg-background text-foreground border-input transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                          />
                          {!editMode && (
                            <button
                              type="button"
                              onClick={() => removeLabRow(idx)}
                              disabled={form.labInputs.length === 1}
                              className="p-2 rounded-lg text-destructive transition-all hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
                              title={
                                form.labInputs.length === 1
                                  ? "At least one lab is required"
                                  : "Remove"
                              }
                            >
                              <Minus size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {editMode
                      ? "Click 'Add Lab' to add new lab rows."
                      : "Click 'Add Lab' to add another row."}
                  </p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-muted/50 border-t border-border">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <button
                  onClick={editMode ? handleUpdate : handleCreate}
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-300 ease-in-out hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  {editMode ? "Update Lab" : "Create Lab"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabsPage;