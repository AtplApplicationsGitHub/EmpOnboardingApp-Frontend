"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "../../../services/api";
import { Group, Question, DropDownDTO } from "../../../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2, HelpCircle, Copy } from "lucide-react";
import SearchableDropdown from "@/app/components/SearchableDropdown";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const GroupDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);

  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [periodOptions, setPeriodOptions] = useState<DropDownDTO[]>([]);
  const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // State for verified by options (for display purposes)
  const [verifiedBySelectedOption, setVerifiedBySelectedOption] = useState<DropDownDTO[]>([]);

  // Pagination state
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    id: 0,
    text: "",
    response: "yes_no" as "yes_no" | "text",
    period: "after",
    complainceDay: "1",
    questionLevel: [] as string[],
    questionDepartment: [] as string[],
    groupId: groupId.toString(),
    defaultflag: "no" as "yes" | "no",
    verifiedBy: undefined as number | undefined,
  });

  // Validate form data
  const validateForm = () => {
    if (!formData.text.trim()) return false;
    if (!formData.response) return false;
    if (formData.response === "yes_no" && !formData.defaultflag) return false;
    if (!formData.period) return false;
    if (!formData.complainceDay || parseInt(formData.complainceDay) < 1) return false;
    if (formData.questionDepartment.length === 0) return false;
    if (formData.questionLevel.length === 0) return false;
    return true;
  };

  useEffect(() => {
    setIsFormValid(validateForm());
  }, [formData]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCreateModal || showEditModal || showDeleteModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCreateModal, showEditModal, showDeleteModal]);

  // Fetch dropdown options
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const periods = await adminService.getLookupItems("Period");
        setPeriodOptions(periods);

        const levels = await adminService.getLookupItems("Level");
        setLevelOptions(levels);

        const departments = await adminService.findAllDepartment();
        const transformedDepartments = departments.map(dept => ({
          ...dept,
          value: dept.value || dept.key
        }));
        setDepartmentOptions(transformedDepartments);
      } catch (error) {
        toast.error("Failed to load dropdown options.");
      }
    };
    fetchLookupData();
  }, []);

  // Async search function for verified by
  const searchVerifiedBy = async (searchTerm: string): Promise<DropDownDTO[]> => {
    try {
      const results = await adminService.searchGroupLeads(searchTerm);
      return results;
    } catch (err: any) {
      console.error("Failed to search verified by options:", err);
      return [];
    }
  };

  // Fetch verified by option details by email
  const fetchVerifiedByDetails = async (email?: string): Promise<DropDownDTO | null> => {
    if (!email) return null;
    try {
      const results = await searchVerifiedBy(email);
      return results.find((lead) => lead.value === email) || null;
    } catch (err) {
      console.error("Failed to fetch verified by details:", err);
      return null;
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, questionPage]);

  const valuesToIds = (values: string[], options: DropDownDTO[]) =>
    options.filter((o) => values.includes(o.value)).map((o) => o.id);

  const idsToValues = (
    ids: number | number[] | undefined,
    options: DropDownDTO[]
  ) => {
    if (ids == null) return [];
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    return options.filter((o) => idSet.has(o.id)).map((o) => o.value);
  };

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupData = await adminService.findGroupById(groupId);
      const questionRes = await adminService.getQuestions(groupId, questionPage);

      setQuestions(questionRes.commonListDto || []);
      setQuestionTotal(questionRes.totalElements || 0);
      setGroup(groupData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load group data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim() || formData.questionLevel.length === 0) return;

    try {
      const { defaultflag, verifiedBy, ...rest } = formData;

      const dataToSend = {
        ...rest,
        ...(verifiedBy && { verifiedBy }),
        ...(formData.response === "yes_no" && { defaultFlag: defaultflag }),
      };

      await adminService.createQuestion(dataToSend);
      setShowCreateModal(false);
      resetForm();
      fetchGroupData();
      toast.success("Question created successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create question");
      toast.error("Failed to create question");
    }
  };

  const handleCloneQuestion = async (question: Question) => {
    try {
      const dataToSend = {
        text: `${question.text}-Copy`,
        response: question.response,
        period: question.period,
        complainceDay: question.complainceDay || "1",
        questionDepartment: question.questionDepartment,
        questionLevel: question.questionLevel,
        groupId: question.groupId.toString(),
        ...(question.verifiedByEmail && { verifiedByEmail: question.verifiedByEmail }),
        ...(question.response === "yes_no" && question.defaultFlag && { defaultFlag: question.defaultFlag }),
      };
      await adminService.createQuestion(dataToSend);
      await fetchGroupData();
      toast.success("Question cloned successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to clone question");
      toast.error("Failed to clone question");
    }
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !formData.text.trim() || formData.questionLevel.length === 0) return;

    try {
      const { defaultflag, verifiedBy, ...rest } = formData;


      const dataToSend = {
        ...rest,
        ...(verifiedBy && { verifiedBy }),
        ...(formData.response === "yes_no" && { defaultFlag: defaultflag }),
      };

      await adminService.updateQuestion(dataToSend);
      setShowEditModal(false);
      setEditingQuestion(null);
      resetForm();
      await fetchGroupData();
      toast.success("Question updated successfully!");
    } catch (err: any) {
      console.error("Error updating question:", err);
      setError(err.response?.data?.message || "Failed to update question");
      toast.error("Failed to update question");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await adminService.deleteQuestion(questionToDelete.id);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      if (questions.length === 1 && questionPage > 0) {
        setQuestionPage((prev) => prev - 1);
      } else {
        fetchGroupData();
      }
      toast.success("Question deleted successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete question");
      toast.error("Failed to delete question");
    }
  };

  const openEditModal = async (question: Question) => {
    setEditingQuestion(question);

    // Fetch verified by details if exists
    let verifiedByOption: DropDownDTO | null = null;
    let verifiedById: number | undefined = undefined;

    if (question.verifiedByEmail) {
      verifiedByOption = await fetchVerifiedByDetails(question.verifiedByEmail);
      if (verifiedByOption) {
        verifiedById = verifiedByOption.id;
        setVerifiedBySelectedOption([verifiedByOption]);
      }
    } else {
      setVerifiedBySelectedOption([]);
    }

    setFormData({
      id: question.id,
      text: question.text,
      response: question.response,
      period: question.period,
      complainceDay: question.complainceDay || "1",
      questionDepartment: question.questionDepartment,
      questionLevel: question.questionLevel,
      groupId: question.groupId.toString(),
      defaultflag: question.defaultFlag || "no",
      verifiedBy: verifiedById,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      text: "",
      response: "yes_no",
      period: "after",
      complainceDay: "1",
      questionDepartment: [],
      questionLevel: [],
      groupId: groupId.toString(),
      defaultflag: "no",
      verifiedBy: undefined,
    });
    setVerifiedBySelectedOption([]);
  };

  const totalQuestionPages = Math.ceil(questionTotal / PAGE_SIZE);

  // Helper function to get verified by display name
  const getVerifiedByDisplayName = (email?: string) => {
    if (!email) return null;

    // Try to find in the questions list first (from fetched data)
    const matchingQuestion = questions.find(q => q.verifiedByEmail === email);
    if (matchingQuestion?.verifiedBy) {
      return matchingQuestion.verifiedBy;
    }

    return email;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading group data...</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-destructive">Group not found</div>
          <Button onClick={() => router.push("/admin/groups")} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[17px] font-bold text-[#4c51bf]">{group.name} Questions</h1>
            <p className="text-[15px] text-muted-foreground mt-2">
              Manage onboarding questions for the {group.name} department
            </p>
          </div>
        </div>
        <div className="flex items-right gap-2">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1">
            <Plus size={16} />
            Add Question
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/groups")}
            className="flex items-center gap-1">
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-destructive/70 hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-4 text-lg">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white font-semibold shadow-[0_4px_12px_rgba(118,75,162,0.5)] hover:scale-110 transition-transform duration-300">
                      {questionPage * PAGE_SIZE + index + 1}
                    </span>
                    {question.text}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {question.response === "yes_no"
                        ? "Yes/No/N/A"
                        : "Text Response"}
                    </span>
                    <span>Due: Day {question.complainceDay}</span>
                    <span>Period: {question.period}</span>

                    <div className="flex items-center gap-1">
                      <span>Levels:</span>
                      {question.questionLevel.map((questionLevel) => (
                        <span
                          key={questionLevel}
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                        >
                          {questionLevel}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <span>Departments:</span>
                      {question.questionDepartment.map((questionDepartment) => (
                        <span
                          key={questionDepartment}
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                        >
                          {questionDepartment}
                        </span>
                      ))}
                    </div>
                    {question.verifiedByEmail && (
                      <span className="-ml-2 px-2 py-1 rounded">
                        Verified by: {getVerifiedByDisplayName(question.verifiedByEmail)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    title="Edit Question"
                    onClick={() => openEditModal(question)}
                    className="rounded-lg text-[#4c51bf] transition-colors duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)]"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleCloneQuestion(question)}
                    className="rounded-lg text-[#7c3aed] transition-colors duration-300 hover:text-[#5b21b6] hover:bg-[rgba(124,58,237,0.08)]"
                    title="Clone Question"
                  >
                    <Copy size={18} />
                  </button>
                  {question.deleteFlag && questions.length > 1 && (
                    <button
                      title="Delete Question"
                      onClick={() => {
                        setQuestionToDelete(question);
                        setShowDeleteModal(true);
                      }}
                      className=" rounded-lg text-red-500  transition-colors duration-300 hover:text-[#be123c] hover:bg-[rgba(225,29,72,0.08)]  "
                    >
                      <Trash2 size={18} />
                    </button>

                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {questions.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Start by creating onboarding questions for the {group.name} department
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={16} className="mr-2" />
                Create First Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {totalQuestionPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuestionPage(0)}
            disabled={questionPage === 0}
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuestionPage(questionPage - 1)}
            disabled={questionPage === 0}
          >
            {"<"}
          </Button>
          <span className="px-2">
            Page {questionPage + 1} of {totalQuestionPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuestionPage(questionPage + 1)}
            disabled={questionPage === totalQuestionPages - 1}
          >
            {">"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuestionPage(totalQuestionPages - 1)}
            disabled={questionPage === totalQuestionPages - 1}
          >
            {">>"}
          </Button>
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[90vh] flex flex-col">
            <Card className="flex flex-col h-full bg-background">
              {/* Fixed Header */}
              <CardHeader className="flex-shrink-0 px-5 py-3 shadow-md">
                <CardTitle className="text-1xl font-semibold text-primary-gradient">
                  {showCreateModal ? "Create New Question" : "Edit Question"}
                </CardTitle>
              </CardHeader>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <CardContent className="p-6">
                  <form
                    onSubmit={showCreateModal ? handleCreateQuestion : handleEditQuestion}
                    className="space-y-6"
                    id="question-form"
                  >
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Question Text *
                      </label>
                      <textarea
                        value={formData.text}
                        autoFocus
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            text: e.target.value,
                          }))
                        }
                        placeholder="Enter the onboarding question..."
                        className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
                        required
                      />
                    </div>

                    {/* Response Type & Default Value */}
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Response Type */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Response Type *
                        </label>
                        <div className="flex gap-4 items-center">
                          <label className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="radio"
                              value="yes_no"
                              checked={formData.response === "yes_no"}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  response: e.target.value as "yes_no",
                                }))
                              }
                              className="text-primary"
                            />
                            Yes/No/N/A Question
                          </label>
                          <label className="flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="radio"
                              value="text"
                              checked={formData.response === "text"}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  response: e.target.value as "text",
                                }))
                              }
                              className="text-primary"
                            />
                            Text Response
                          </label>
                        </div>
                      </div>

                      {/* Default Value - Conditionally rendered */}
                      {formData.response === "yes_no" && (
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-2">
                            Default Value *
                          </label>
                          <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 whitespace-nowrap">
                              <input
                                type="radio"
                                value="yes"
                                checked={formData.defaultflag === "yes"}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    defaultflag: e.target.value as "yes" | "no",
                                  }))
                                }
                                className="text-primary"
                              />
                              Yes
                            </label>
                            <label className="flex items-center gap-2 whitespace-nowrap">
                              <input
                                type="radio"
                                value="no"
                                checked={formData.defaultflag === "no"}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    defaultflag: e.target.value as "yes" | "no",
                                  }))
                                }
                                className="text-primary"
                              />
                              No
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Period */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Period *
                        </label>
                        <div className="relative z-[10000]">
                          <SearchableDropdown
                            className="w-full"
                            options={periodOptions}
                            value={
                              periodOptions.find(
                                (opt) => opt.value === formData.period
                              )?.id
                            }
                            onChange={(id) => {
                              const selectedValue =
                                periodOptions.find((opt) => opt.id === id)
                                  ?.value ?? "";
                              setFormData((prev) => ({
                                ...prev,
                                period: selectedValue as typeof prev.period,
                              }));
                            }}
                            placeholder="Select period"
                            displayFullValue={false}
                            isEmployeePage={true}
                          />
                        </div>
                      </div>

                      {/* Compliance Day */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Compliance Day * (Number of days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={
                            formData.complainceDay === ""
                              ? ""
                              : formData.complainceDay
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              complainceDay: value,
                            }));
                          }}
                          placeholder="Enter number of days"
                          className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Departments */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Departments *
                        </label>
                        <div className="relative z-[9999]">
                          <SearchableDropdown
                            options={departmentOptions}
                            value={valuesToIds(
                              formData.questionDepartment,
                              departmentOptions
                            )}
                            isMultiSelect={true}
                            onChange={(selectedIds) => {
                              setFormData((prev) => ({
                                ...prev,
                                questionDepartment: idsToValues(
                                  selectedIds,
                                  departmentOptions
                                ),
                              }));
                            }}
                            placeholder="Select departments"
                            disabled={showEditModal}
                            showSelectAll={true}
                          />
                        </div>
                      </div>
                      {/* Employee Levels */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Employee Levels * (Select at least one)
                        </label>
                        <div className="relative z-[9998]">
                          <SearchableDropdown
                            options={levelOptions}
                            value={valuesToIds(
                              formData.questionLevel,
                              levelOptions
                            )}
                            isMultiSelect={true}
                            onChange={(selectedIds) => {
                              setFormData((prev) => ({
                                ...prev,
                                questionLevel: idsToValues(
                                  selectedIds,
                                  levelOptions
                                ),
                              }));
                            }}
                            placeholder="Select levels"
                            disabled={showEditModal}
                            showSelectAll={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Verified By with Async Search */}
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Verified By
                        </label>
                        <div className="relative z-[9997]">
                          <SearchableDropdown
                            className="w-full"
                            value={formData.verifiedBy}
                            onChange={(id) => {
                              setFormData((prev) => ({
                                ...prev,
                                verifiedBy: id as number | undefined,
                              }));
                            }}
                            placeholder="Type 3+ characters to search..."
                            displayFullValue={false}
                            onSearch={searchVerifiedBy}
                            minSearchLength={3}
                            initialSelectedOptions={verifiedBySelectedOption}
                          />
                        </div>
                      </div>
                      <div className="flex-1" />
                    </div>

                    <div className="pb-4"></div>
                  </form>
                </CardContent>
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEditingQuestion(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    form="question-form"
                    disabled={!isFormValid}
                    className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
        shadow-md transition-all duration-300 ease-in-out 
        hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
        disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showCreateModal ? "Create Question" : "Update Question"}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && questionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete the question{" "}
                <span className="font-semibold">"{questionToDelete.text}"</span>
                ? This action cannot be undone.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setQuestionToDelete(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteQuestion}
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

export default GroupDetailsPage;