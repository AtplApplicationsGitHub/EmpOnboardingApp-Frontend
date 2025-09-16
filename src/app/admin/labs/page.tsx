"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminService, labService } from "../../services/api";
import { DropDownDTO, Lab } from "../../types";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Pencil,
  Minus,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "@/app/components/SearchableDropdown";

const PAGE_SIZE = 10;

type FormState = {
  location: string; // stores the "value" from DropDownDTO
  labInputs: string[]; // dynamic input rows for labs
};

const emptyForm: FormState = {
  location: "",
  labInputs: [""],
};

const LabsPage: React.FC = () => {
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [labs, setLabs] = useState<Lab[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-based
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [locationOptions, setLocationOptions] = useState<DropDownDTO[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  // ===== API: Fetch labs (with pagination + optional search) =====
  const fetchLabs = async (page = currentPage, search = searchFilter) => {
    setLoading(true);
    setError(null);
    try {
      const result = await labService.getLabs(page, search);
      setLabs(result.commonListDto || []);
      setTotal(result.totalElements || 0);
    } catch (err: any) {
      console.error("Failed to fetch labs:", err);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchFilter]);

  // ===== API: Lookup data =====
  const fetchLookupData = async () => {
    try {
      const location = await adminService.getLookupItems("Department");
      setLocationOptions(location || []);
    } catch {
      toast.error("Failed to load dropdown options.");
    }
  };

  useEffect(() => {
    fetchLookupData();
  }, []);

  // ===== Search =====
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput.trim());
    setCurrentPage(0);
  };

  // ===== Modal helpers =====
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
      const lab = await labService.findLabById(labId);
      setForm({
        location: lab.location || "",
        labInputs: Array.isArray(lab.lab) && lab.lab.length ? lab.lab : [""],
      });
      setSelectedLabId(labId);
      setEditMode(true);
      setShowModal(true);

      setTimeout(() => {
        locationInputRef.current?.focus();
      }, 100);
    } catch {
      toast.error("Failed to load lab details");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedLabId(null);
    setForm({ ...emptyForm });
  };

  // ===== Dynamic lab inputs =====
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

  // ===== Create / Update =====
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
    const payload = validateAndBuildPayload();
    if (!payload) return;

    try {
      await labService.updateLab({ id: selectedLabId, ...payload });
      toast.success("Lab updated successfully");
      closeModal();
      fetchLabs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update lab");
    }
  };

  // ===== Pagination =====
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const delta = 2;
    const range: Array<number> = [];
    const out: Array<number | string> = [];

    for (
      let i = Math.max(2, currentPage + 1 - delta);
      i <= Math.min(totalPages - 1, currentPage + 1 + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage + 1 - delta > 2) {
      out.push(1, "...");
    } else {
      out.push(1);
    }

    out.push(...range);

    if (currentPage + 1 + delta < totalPages - 1) {
      out.push("...", totalPages);
    } else if (totalPages > 1) {
      out.push(totalPages);
    }

    return out;
  };

  // ===== Loading state (first load) =====
  if (loading && labs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading labs...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearchSubmit}  className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by department..."
              className="w-64"
            />
          </div>
        </form>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={16} />
          Add New Lab
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm text-muted-foreground">
              Showing {labs.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
              {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} labs
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No labs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                labs.map((lab) => (
                  <TableRow key={lab.id}>
                    <TableCell className="flex items-center gap-2">
                      {/* <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 hover:bg-transparent hover:text-primary"
                        onClick={() => openEditModal(lab.id)}
                        aria-label={`Edit ${lab.location}`}
                      >
                        <Pencil size={14} />
                      </Button> */}
                    </TableCell>
                    <TableCell className="font-medium">
                      {lab.location}
                    </TableCell>
                    <TableCell>
                      {Array.isArray(lab.lab) && lab.lab.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lab.lab.map((name, idx) => (
                            <span
                              key={`${lab.id}-${idx}-${name}`}
                              className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          No labs
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lab.createdTime}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lab.updatedTime}
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
                {generatePageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`dots-${i}`}
                      className="px-2 text-muted-foreground"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={`page-${p}`}
                      variant={p === currentPage + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange((p as number) - 1)}
                      className="min-w-[32px] px-2"
                    >
                      {p}
                    </Button>
                  )
                )}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? "Update Lab" : "Create New Lab"}
            </h2>

            <form
              onSubmit={editMode ? handleUpdate : handleCreate}
              className="space-y-4"
            >
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor="location"
                >
                  Department
                </label>
                <SearchableDropdown
                  options={locationOptions}
                  value={
                    locationOptions.find((opt) => opt.value === form.location)
                      ?.id
                  }
                  onChange={(id) => {
                    const selected = locationOptions.find((o) => o.id === id);
                    setForm((prev) => ({
                      ...prev,
                      location: selected?.value ?? "",
                    }));
                  }}
                  placeholder="Select Location"
                  displayFullValue={false}
                  isEmployeePage={true}
                />
                <input ref={locationInputRef} className="sr-only" aria-hidden />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Labs</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLabRow}
                    className="h-8 px-2"
                    aria-label="Add lab row"
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                <div className="space-y-2">
                  {form.labInputs.map((value, idx) => (
                    <div
                      key={`lab-row-${idx}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateLabRow(idx, e.target.value)}
                        placeholder={`Lab ${idx + 1}`}
                        required={idx === 0}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLabRow(idx)}
                        className="h-8 px-2"
                        aria-label={`Remove lab row ${idx + 1}`}
                        disabled={form.labInputs.length === 1}
                        title={
                          form.labInputs.length === 1
                            ? "At least one lab is required"
                            : "Remove"
                        }
                      >
                        <Minus size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Click <span className="font-semibold">+</span> to add another
                  lab row, and <span className="font-semibold">–</span> to
                  remove a row.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editMode ? "Update Lab" : "Create Lab"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabsPage;
