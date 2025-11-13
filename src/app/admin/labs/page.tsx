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
  labInputs: string[];
};

const emptyForm: FormState = {
  location: "",
  labInputs: [""],
};

const LabsPage: React.FC = () => {
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [labs, setLabs] = useState<Lab[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [locationOptions, setLocationOptions] = useState<DropDownDTO[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existingLabCount, setExistingLabCount] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  const fetchLabs = async (page = currentPage, search = searchFilter) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    fetchLookupData();
  }, [currentPage, searchFilter]);

  const fetchLookupData = async () => {
    try {
      const departments = await adminService.findAllDepartment();
      // console.log("new api", departments); // DEBUG

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

      const matchingLocation = locationOptions.find(
        opt => opt.value === lab.location ||
          opt.value?.toLowerCase() === lab.location?.toLowerCase()
      );

      setForm({
        location: matchingLocation?.value || lab.location || "",
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
    lab: string[];
  } | null => {
    const location = form.location.trim();
    const lab = form.labInputs.map((s) => s.trim()).filter(Boolean);

    if (!location) {
      toast.error("Location is required");
      return null;
    }
    if (!lab.length) {
      toast.error("Add at least one lab");
      return null;
    }
    return { location, lab };
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

  if (loading && labs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading labs...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-full mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        {/* Search Box */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by department..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </form>
        </div>

        {/* Action Button */}
        <Button
          onClick={openCreateModal}
        >
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-heading-bg">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[20%]">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[35%]">
                  Labs
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[18%]">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[18%]">
                  Updated
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[9%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {labs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MapPin size={48} className="text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">No labs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                labs.map((lab) => (
                  <tr
                    key={lab.id}
                    className="transition-all hover:bg-gray-50 group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {lab.location}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(lab.lab) && lab.lab.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {lab.lab.map((name, idx) => (
                            <span
                              key={`${lab.id}-${idx}-${name}`}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{lab.createdTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{lab.updatedTime}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => openEditModal(lab.id)}
                          className="p-2 rounded-lg text-indigo-600 transition-all hover:bg-indigo-50 hover:scale-110"
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
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {generatePageNumbers().map((pageNum, idx) =>
              typeof pageNum === "number" ? (
                <button
                  key={idx}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[40px] h-10 rounded text-sm font-medium transition-all ${currentPage === pageNum
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
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Gradient Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md">
              <CardTitle className="text-1xl font-semibold text-popup-heading">
                {editMode ? "Update Lab" : "Create New Lab"}
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <form onSubmit={editMode ? handleUpdate : handleCreate} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  {editMode ? (
                    <div className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700">
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
                    <label className="block text-[13px] font-semibold text-gray-700">
                      Labs <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addLabRow}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                    >
                      <Plus size={18} />

                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {form.labInputs.map((value, idx) => {
                      const isExistingLab = editMode && idx < existingLabCount;

                      return (
                        <div key={`lab-row-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => updateLabRow(idx, e.target.value)}
                            placeholder={`Lab ${idx + 1}`}
                            required={idx === 0}
                            disabled={isExistingLab}
                            readOnly={isExistingLab}
                            className={`flex-1 px-3.5 py-2.5 border-[1.5px] rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100 ${isExistingLab
                              ? "bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed"
                              : "bg-white border-gray-300"
                              }`}
                          />
                          {!editMode && (
                            <button
                              type="button"
                              onClick={() => removeLabRow(idx)}
                              disabled={form.labInputs.length === 1}
                              className="p-2 rounded-lg text-red-500 transition-all hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

                  <p className="text-xs text-gray-500 mt-2">
                    {editMode
                      ? "Click 'Add Lab' to add new lab rows. Existing labs cannot be modified."
                      : "Click 'Add Lab' to add another row, and '–' to remove a row."}
                  </p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-6 bg-gray-50 border-t border-gray-200">
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
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
shadow-md transition-all duration-300 ease-in-out 
hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
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