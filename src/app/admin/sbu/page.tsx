"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminService, sbuService } from "../../services/api";
import { DropDownDTO, Sbu, SbuDepartmentsDTO } from "../../types";
import { Card, CardContent, CardTitle, CardHeader } from "../../components/ui/card";
import Button from "../../components/ui/button";
import {
    Plus,
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Edit,
    X,
    Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "@/app/components/SearchableDropdown";

const PAGE_SIZE = 10;

type FormState = {
    sbuName: string;
    departments: SbuDepartmentsDTO[];
};

const emptyForm: FormState = {
    sbuName: "",
    departments: [],
};

const SBUPage: React.FC = () => {
    const sbuNameInputRef = useRef<HTMLInputElement>(null);

    const [sbus, setSbus] = useState<Sbu[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedSbuId, setSelectedSbuId] = useState<string | null>(null);

    const [searchFilter, setSearchFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sbuToDelete, setSbuToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [nameError, setNameError] = useState<string>("");

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
        [total]
    );

    // Fetch SBUs
    const fetchSBUs = async (page = currentPage, search = searchFilter) => {
        setError(null);
        try {
            const result = await sbuService.loadSbu(page, search);
            console.log("Fetched SBUs:", result);
            setSbus(result.commonListDto || []);
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
                setError("Failed to fetch SBUs. Please try again.");
            }
            setSbus([]);
            setTotal(0);
        } finally {
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        fetchSBUs();
    }, [currentPage, searchFilter]);


    const loadDepartments = async (sbuId: any) => {
        const departments = await sbuService.getNonSelectedDepartmentsForSbu(Number(sbuId));
        const transformedDepartments = departments.map(dept => ({
            ...dept,
            value: dept.value || dept.key
        }));
        setDepartmentOptions(transformedDepartments);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchFilter(searchInput.trim());
        setCurrentPage(0);
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedSbuId(null);
        setForm({ ...emptyForm });
        setShowModal(true);
        loadDepartments(0);
        setTimeout(() => {
            sbuNameInputRef.current?.focus();
        }, 100);
    };

    const checkSbuNameExists = async (name: string) => {
        if (!name.trim()) {
            setNameError("");
            return;
        }

        setIsCheckingName(true);
        try {
            const id = selectedSbuId ? Number(selectedSbuId) : 0;
            const exists = await sbuService.sbuNameExists(id, name.trim());

            if (exists) {
                setNameError("This SBU name already exists");
            } else {
                setNameError("");
            }
        } catch (error) {
            console.error("Error checking SBU name:", error);
            setNameError("");
        } finally {
            setIsCheckingName(false);
        }
    };

    // Add debounce effect for name checking
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (form.sbuName) {
                checkSbuNameExists(form.sbuName);
            }
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [form.sbuName, selectedSbuId]);


    // Open Edit Modal prefill form
    const openEditModal = async (sbuId: string) => {
        try {
            loadDepartments(Number(sbuId));
            const sbu = await sbuService.findById(Number(sbuId));

            if (sbu) {
                setForm({
                    sbuName: sbu.sbuName || "",
                    departments: sbu.departments || [],
                });

                setSelectedSbuId(sbuId);
                setEditMode(true);
                setShowModal(true);

                setTimeout(() => {
                    sbuNameInputRef.current?.focus();
                }, 100);
            }
        } catch (error) {
            toast.error("Failed to load SBU detais");
        }
    };

    const deleteSelectedDept = async (deptId: number) => {
        try {
            const departments = await sbuService.deleteSbuDepartment(Number(selectedSbuId), deptId);
            if (departments) {
                toast.success("Department deleted successfully");
                setForm((prev) => ({
                    ...prev,
                    departments: prev.departments.filter(dept => dept.id !== deptId)
                }));
                loadDepartments(Number(selectedSbuId));
            } else {
                toast.error("Failed to delete Department");
            }
        } catch (error) {
            toast.error("Failed to delete Department");
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedSbuId(null);
        setForm({ ...emptyForm });
        setNameError("");
        setIsCheckingName(false);
        fetchSBUs();
    };

    // Open Delete Modal
    const openDeleteModal = (sbuId: string, sbuName: string) => {
        setSbuToDelete({ id: sbuId, name: sbuName });
        setShowDeleteModal(true);
    };

    // Close Delete Modal
    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setSbuToDelete(null);
    };
    // Handle Delete SBU
    const handleDelete = async () => {
        if (!sbuToDelete) return;

        try {
            await sbuService.deleteSbu(Number(sbuToDelete.id));
            toast.success("SBU deleted successfully");
            closeDeleteModal();
            fetchSBUs();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete SBU");
        }
    };
    const validateAndBuildPayload = (): {
        sbuName: string;
        departments: SbuDepartmentsDTO[];
    } | null => {
        const sbuName = form.sbuName.trim();
        const departments = form.departments;

        if (!sbuName) {
            toast.error("SBU Name is required");
            return null;
        }
        if (!departments || departments.length === 0) {
            toast.error("At least one Department is required");
            return null;
        }

        return { sbuName, departments };
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = validateAndBuildPayload();
        if (!payload) return;

        try {
            await sbuService.saveSbu(payload);
            toast.success("SBU created successfully");
            closeModal();
            fetchSBUs();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create SBU");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSbuId) return;

        const sbuName = form.sbuName.trim();
        const departments = form.departments;

        if (!sbuName) {
            toast.error("SBU Name is required");
            return;
        }

        if (!departments || departments.length === 0) {
            toast.error("At least one Department is required");
            return;
        }
        try {

            await sbuService.saveSbu({
                id: Number(selectedSbuId),
                sbuName,
                departments
            });
            console.log("Updating SBU with ID:", departments);
            toast.success("SBU updated successfully");
            closeModal();
            fetchSBUs();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update SBU");
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
                            placeholder="Search by SBU name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </form>
                </div>

                {/* Action Button */}
                <Button onClick={openCreateModal}>
                    <Plus size={16} style={{ marginRight: '8px' }} />
                    <span>Add New SBU</span>
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="table-heading-bg text-primary-gradient">
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[15%]">
                                    SBU Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[35%]">
                                    Department
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[9%]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sbus.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Building2 size={48} className="text-muted-foreground/50" />
                                            <p className="text-muted-foreground text-sm font-medium">No SBUs found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sbus.map((sbu) => (
                                    <tr
                                        key={sbu.id}
                                        className="hover:bg-[var(--custom-gray)] group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-foreground">
                                                {sbu.sbuName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-foreground">
                                                {sbu.departments.map(d => d.departmentName).join(', ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => openEditModal(sbu.id)}
                                                    className="rounded-lg text-[#4c51bf] duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                                    title="Edit SBU"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                {!sbu.disableDelete ? (
                                                    <button
                                                        onClick={() => openDeleteModal(sbu.id, sbu.sbuName)}
                                                        className="rounded-lg text-destructive duration-300 hover:text-destructive/80 hover:bg-destructive/10 dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                                        title="Delete SBU"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <div className="w-[34px] h-[34px]"></div>
                                                )}
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
                                    Showing {sbus.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                                    {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} SBUs
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
                                {editMode ? "Update SBU" : "Create New SBU"}
                            </CardTitle>
                        </div>

                        {/* Body */}
                        <div className="flex-1 px-8 py-6">
                            <form onSubmit={editMode ? handleUpdate : handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground mb-2">
                                        SBU Name <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        ref={sbuNameInputRef}
                                        type="text"
                                        value={form.sbuName}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, sbuName: e.target.value }));
                                            setNameError(""); // Clear error when user types
                                        }}
                                        placeholder="Enter SBU name"
                                        required
                                        disabled={false}
                                        className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 disabled:bg-muted disabled:cursor-not-allowed ${nameError ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-input"
                                            }`}
                                    />
                                    {isCheckingName && (
                                        <p className="mt-1 text-xs text-muted-foreground">Checking availability...</p>
                                    )}
                                    {nameError && (
                                        <p className="mt-1 text-xs text-red-600">{nameError}</p>
                                    )}
                                </div>

                                <div>
                                    {editMode && form.departments.length > 0 && (
                                        <div className="w-full mb-3 space-y-2">
                                            <span className="block text-[13px] font-semibold text-foreground mb-2">Existing Departments:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {form.departments.map(dept => (
                                                    <div
                                                        key={dept.id}
                                                        className="inline-flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-xs text-secondary-foreground font-medium"
                                                    >
                                                        {dept.departmentName}
                                                        {!dept.disableDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteSelectedDept(dept.id)}
                                                                className="ml-1 p-0.5 rounded-full hover:bg-muted"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <label className="block text-[13px] font-semibold text-foreground mb-2">
                                        Department <span className="text-destructive">*</span>
                                    </label>
                                    <SearchableDropdown
                                        options={departmentOptions}
                                        value={form.departments.map(d => d.id)}
                                        onChange={(ids) => {
                                            const selectedIds = Array.isArray(ids) ? ids : ids ? [ids] : [];

                                            const existingDeptMap = new Map(
                                                form.departments.map(dept => [dept.id, dept])
                                            );

                                            const updatedDepartments = selectedIds.map(id => {
                                                if (existingDeptMap.has(id)) {
                                                    return existingDeptMap.get(id)!;
                                                }

                                                const option = departmentOptions.find(opt => opt.id === id);
                                                return {
                                                    id: id,
                                                    departmentName: option?.value || option?.key || '',
                                                    disableDelete: false
                                                };
                                            });

                                            setForm((prev) => ({
                                                ...prev,
                                                departments: updatedDepartments
                                            }));
                                        }}
                                        placeholder={editMode ? "Add more departments" : "Select Departments"}
                                        displayFullValue={false}
                                        isEmployeePage={true}
                                        disabled={false}
                                        isMultiSelect={true}
                                        showSelectAll={true}
                                        usePortal={true}
                                        allowRemove={false}
                                    />
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
                                    disabled={
                                        !form.sbuName.trim() ||
                                        form.departments.length === 0 ||
                                        isCheckingName ||
                                        !!nameError
                                    }
                                    className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-300 ease-in-out hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {editMode ? "Update SBU" : "Create SBU"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && sbuToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-sm mx-4">
                        <CardHeader>
                            <CardTitle>Delete SBU</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4 text-foreground">
                                Are you sure you want to delete the SBU{" "}
                                <span className="font-semibold">{sbuToDelete.name}</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={closeDeleteModal}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
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

export default SBUPage;
