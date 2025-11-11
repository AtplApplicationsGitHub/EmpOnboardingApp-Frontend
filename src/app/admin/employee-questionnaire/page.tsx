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


const PAGE_SIZE = 10;

type FormState = {
    question: string;
    responseType: "yes_no" | "text" | "";
    level: string;
};

const emptyForm: FormState = {
    question: "",
    responseType: "",
    level: "",
};



const EmployeeQuestionnairePage: React.FC = () => {
    const questionInputRef = useRef<HTMLInputElement>(null);

    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);

    const [searchFilter, setSearchFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const [form, setForm] = useState<FormState>(emptyForm);


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
        setLoading(true);

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
            setLoading(false);
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
                level: questionnaire.level || "",
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
        if (!form.question.trim() || !form.responseType || !form.level) {
            alert("Please fill all required fields");
            return;
        }

        try {
            // Prepare data for API
            const saveData = {
                ...(editMode && selectedQuestionnaireId ? { id: selectedQuestionnaireId } : {}),
                question: form.question.trim(),
                responseType: form.responseType,
                level: form.level
            };

            const success = await employeeService.saveMasterEQuestions(saveData);

            if (success) {
                console.log(editMode ? "Updated questionnaire:" : "Created questionnaire:", saveData);
                // Refresh the list after successful create/update
                await fetchQuestionnaires();
                closeModal();
            }
        } catch (error) {
            console.error("Failed to save questionnaire:", error);
            alert("Failed to save questionnaire. Please try again.");
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

    if (loading && questionnaires.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading questionnaires...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-full mx-auto min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                {/* Search Box */}
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by question, type, or level..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-primary-gradient">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[35%]">
                                    Question
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[15%]">
                                    Response Type
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[12%]">
                                    Level
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-[15%]">
                                    Created
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider w-[8%]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {questionnaires.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FileQuestion size={48} className="text-gray-300" />
                                            <p className="text-gray-500 text-sm font-medium">No questionnaires found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                questionnaires.map((questionnaire) => (
                                    <tr
                                        key={questionnaire.id}
                                        className="transition-all hover:bg-gray-50 group"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-900">
                                                {questionnaire.question}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {questionnaire.responseType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${questionnaire.level === "Basic"
                                                ? "bg-green-50 text-green-700 border border-green-100"
                                                : questionnaire.level === "Intermediate"
                                                    ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                                                    : "bg-red-50 text-red-700 border border-red-100"
                                                }`}>
                                                {questionnaire.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{questionnaire.createdDate}</span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => openEditModal(questionnaire.id)}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
                                                title="Edit Question"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {/* {questionnaires.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                    Showing {currentPage * PAGE_SIZE + 1} to {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} questionnaires
                </div>
            )} */}
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
                    <div className="relative w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
                        {/* Gradient Header */}
                        <div className="flex-shrink-0 bg-gradient-to-r from-[#4c51bf] to-[#5a60d1] px-8 py-6 shadow-md">
                            <h2 className="text-2xl font-semibold text-white">
                                {editMode ? "Update Questionnaire" : "Create New Questionnaire"}
                            </h2>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto px-8 py-6">
                            <div className="space-y-5">
                                {/* Question Text */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                                        Question <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={form.question}
                                        onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                                        placeholder="Enter the question here..."
                                        className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100 resize-none h-24"
                                    />
                                </div>

                                {/* Response Type */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">
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
                                            <span className="text-sm text-gray-700">Yes/No/N/A Question</span>
                                        </label>
                                        <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
                                            <input
                                                type="radio"
                                                value="text"
                                                checked={form.responseType === "text"}
                                                onChange={(e) => setForm((prev) => ({ ...prev, responseType: e.target.value as "yes_no" | "text" }))}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">Text Response</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Employee Levels */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                                        Level <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableDropdown
                                        options={levelOptions}
                                        value={
                                            levelOptions.find(
                                                (option) => option.value === form.level
                                            )?.id
                                        }
                                        onChange={(id) => {
                                            const selectedLevel = levelOptions.find(
                                                (option) => option.id === id
                                            )?.value;
                                            setForm((prev) => ({
                                                ...prev,
                                                level: selectedLevel || "",
                                            }));
                                        }}
                                        placeholder="Select Level"
                                        displayFullValue={false}
                                        isEmployeePage={true}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 flex justify-end items-center px-8 py-6 bg-gray-50 border-t border-gray-200">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 bg-[#ff5555] text-white border border-[#ff5555] rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out hover:bg-[#ff5555] hover:shadow-md hover:-translate-y-0.5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!form.question.trim() || !form.responseType || !form.level}
                                    className="px-6 py-2.5 bg-gradient-to-r from-[#4c51bf] to-[#5a60d1] text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editMode ? "Update Question" : "Create Question"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeQuestionnairePage;
