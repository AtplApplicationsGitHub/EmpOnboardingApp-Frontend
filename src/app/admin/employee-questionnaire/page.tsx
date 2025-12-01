"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    Edit,
    FileQuestion,
} from "lucide-react";
import { adminService, employeeService } from "../../services/api";
import { DropDownDTO, Questionnaire } from "../../types";
import SearchableDropdown from "@/app/components/SearchableDropdown";
import Button from "../../components/ui/button";
import { Card, CardContent, CardTitle } from "../../components/ui/card";

const PAGE_SIZE = 10;

type FormState = {
    question: string;
    responseType: "yes_no" | "text" | "";
    level: string[];
};

const emptyForm: FormState = {
    question: "",
    responseType: "",
    level: [],
};

const EmployeeQuestionnairePage: React.FC = () => {
    const questionInputRef = useRef<HTMLTextAreaElement>(null);

    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);

    const [searchFilter, setSearchFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [form, setForm] = useState<FormState>(emptyForm);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
        [total]
    );

    // Fetch levels from API
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const response = await adminService.getLookupItems("Level");
                setLevelOptions(response);
            } catch (error) {
                console.error("Failed to fetch levels:", error);
            }
        };

        fetchLevels();
    }, []);

    // Fetch questionnaires from API
    const fetchQuestionnaires = async (page = currentPage, search = searchFilter) => {

        try {
            const response = await employeeService.getMasterEQuestions(page, search);
            console.log("Fetched questionnaires:", response);
            setQuestionnaires(response.commonListDto);
            setTotal(response.totalElements);
        } catch (error) {
            console.error("Failed to fetch questionnaires:", error);
            setQuestionnaires([]);
            setTotal(0);
        } finally {
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        fetchQuestionnaires();
    }, [currentPage, searchFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchFilter(searchInput.trim());
        setCurrentPage(0);
    };

    const openCreateModal = () => {
        setEditMode(false);
        setSelectedQuestionnaireId(null);
        setForm({ ...emptyForm });
        setShowModal(true);

        setTimeout(() => {
            questionInputRef.current?.focus();
        }, 100);
    };

    const openEditModal = (questionnaireId: string) => {
        const questionnaire = questionnaires.find((q) => q.id === questionnaireId);

        if (questionnaire) {
            setForm({
                question: questionnaire.question,
                responseType: questionnaire.responseType as "yes_no" | "text",
                level: questionnaire.levels || [],
            });
            setSelectedQuestionnaireId(questionnaireId);
            setEditMode(true);
            setShowModal(true);

            setTimeout(() => {
                questionInputRef.current?.focus();
            }, 100);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedQuestionnaireId(null);
        setForm({ ...emptyForm });
    };

    // Handle form submission for create/update
    const handleSubmit = async () => {
        if (!form.question.trim() || !form.responseType || form.level.length === 0) {
            alert("Please fill all required fields");
            return;
        }

        try {
            if (editMode && selectedQuestionnaireId) {
                const updateData = {
                    id: selectedQuestionnaireId,
                    question: form.question.trim(),
                    responseType: form.responseType,
                    levels: form.level,
                };

                const success = await employeeService.updateMasterEQuestions(updateData);

                if (success) {
                    console.log("Updated questionnaire:", updateData);
                    await fetchQuestionnaires();
                    closeModal();
                }
            } else {
                const saveData = {
                    question: form.question.trim(),
                    responseType: form.responseType,
                    levels: form.level,
                };

                const success = await employeeService.saveMasterEQuestions(saveData);

                if (success) {
                    console.log("Created questionnaire:", saveData);
                    await fetchQuestionnaires();
                    closeModal();
                }
            }
        } catch (error) {
            console.error("Failed to save/update questionnaire:", error);
            alert("Failed to save/update questionnaire. Please try again.");
        }
    };

    setTimeout(() => {
        questionInputRef.current?.focus();
    }, 100);

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
        <div className="space-y-2 bg-background min-h-screen p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                {/* Search Box */}
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search by question, type, or level..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-card text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                    />
                </div>

                {/* Action Button */}
                <Button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4c51bf] to-[#5a60d1] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                >
                    <Plus size={16} />
                    <span>Add New Question</span>
                </Button>
            </div>

            {/* Table */}
            <Card className="bg-card border-border">
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="table-heading-bg text-primary-gradient">
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[35%] ">
                                    Question
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[15%] ">
                                    Response Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[12%] ">
                                    Level
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[8%]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {questionnaires.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileQuestion size={48} className="text-muted-foreground" />
                                            <p className="text-muted-foreground text-sm font-medium">No questionnaires found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                questionnaires.map((questionnaire) => (
                                    <tr
                                        key={questionnaire.id}
                                        className="transition-all hover:bg-[var(--custom-gray)] group"                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-foreground">
                                                {questionnaire.question}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                                {questionnaire.responseType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${questionnaire.levels?.[0] === "Basic"
                                                ? "bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                                : questionnaire.levels?.[0] === "Intermediate"
                                                    ? "bg-yellow-50 text-yellow-700 border border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                                                    : "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                                                }`}>
                                                {questionnaire.levels?.[0] || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openEditModal(questionnaire.id)}
                                                className="rounded-lg text-[#4c51bf] duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                                                title="Edit Question"
                                            >
                                                <Edit size={18} />
                                            </button>
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

                            {/* Page Info */}
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage + 1} of {totalPages}
                            </div>

                            {/* Showing Info */}
                            <div className="flex items-center justify-between px-4 py-2">
                                <div className="text-sm text-muted-foreground">
                                    Showing {questionnaires.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
                                    {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} questionnaires
                                </div>
                            </div>

                            {/* Pagination Buttons */}
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

                                {generatePageNumbers().map((page, index) => (
                                    <React.Fragment key={index}>
                                        {page === "..." ? (
                                            <span className="px-3 py-2 text-muted-foreground">...</span>
                                        ) : (
                                            <Button
                                                variant={page === currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(page as number)}
                                                className="min-w-[40px]"
                                            >
                                                {(page as number) + 1}
                                            </Button>
                                        )}
                                    </React.Fragment>
                                ))}

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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-12">
                    <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
                        {/* Header */}
                        <div className="flex-shrink-0 px-5 py-3 order-b border-border shadow-md">
                            <CardTitle className="text-xl font-semibold text-primary">
                                {editMode ? "Update Questionnaire" : "Create New Questionnaire"}
                            </CardTitle>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 bg-card">
                            <div className="space-y-5">
                                {/* Question Text */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground mb-2">
                                        Question <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        ref={questionInputRef}
                                        value={form.question}
                                        onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                                        placeholder="Enter the question here..."
                                        className="w-full px-3.5 py-2.5 border-[1.5px] border-border rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-ring resize-none h-24"
                                    />
                                </div>

                                {/* Response Type */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground mb-2">
                                        Response Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-4 items-center">
                                        <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
                                            <input
                                                type="radio"
                                                value="yes_no"
                                                checked={form.responseType === "yes_no"}
                                                onChange={(e) => setForm((prev) => ({ ...prev, responseType: e.target.value as "yes_no" | "text" }))}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-foreground">Yes/No/N/A Question</span>
                                        </label>
                                        <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
                                            <input
                                                type="radio"
                                                value="text"
                                                checked={form.responseType === "text"}
                                                onChange={(e) => setForm((prev) => ({ ...prev, responseType: e.target.value as "yes_no" | "text" }))}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-foreground">Text Response</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Employee Levels */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-foreground mb-2">
                                        Level <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableDropdown
                                        options={levelOptions}
                                        value={levelOptions
                                            .filter(option => form.level.includes(option.value))
                                            .map(option => option.id)
                                        }
                                        onChange={(ids) => {
                                            if (!editMode) {
                                                if (Array.isArray(ids)) {
                                                    const selectedLevels = levelOptions
                                                        .filter(option => ids.includes(option.id))
                                                        .map(option => option.value);
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        level: selectedLevels,
                                                    }));
                                                } else {
                                                    setForm((prev) => ({ ...prev, level: [] }));
                                                }
                                            }
                                        }}
                                        placeholder="Select Levels"
                                        displayFullValue={false}
                                        isEmployeePage={true}
                                        isMultiSelect={true}
                                        disabled={editMode}
                                        showSelectAll={true}
                                        usePortal={true}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-accent/30 border-t border-border">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={closeModal}
                                    className="border-border text-foreground hover:bg-accent"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!form.question.trim() || !form.responseType || !form.level}
                                    className="bg-gradient-to-r from-[#4c51bf] to-[#5a60d1] text-white"
                                >
                                    {editMode ? "Update Question" : "Create Question"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeQuestionnairePage;