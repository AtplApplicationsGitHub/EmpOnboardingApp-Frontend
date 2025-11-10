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

  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );
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
  const [verifiedByOptions, setVerifiedByOptions] = useState<DropDownDTO[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Pagination state
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);
  const [verifiedByPage, setVerifiedByPage] = useState(0);
  const [verifiedByTotal, setVerifiedByTotal] = useState(0);
  const [verifiedBySearch, setVerifiedBySearch] = useState("");

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
    verifiedBy: "",
  });

  // Validate form data
  const validateForm = () => {
    if (!formData.text.trim()) return false;
    if (!formData.response) return false;
    if (formData.response === "yes_no" && !formData.defaultflag) return false;
    if (!formData.period) return false;
    if (!formData.complainceDay || parseInt(formData.complainceDay) < 1)
      return false;
    if (formData.questionDepartment.length === 0) return false;
    if (formData.questionLevel.length === 0) return false;
    // if (!formData.verifiedBy) return false;
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

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCreateModal, showEditModal, showDeleteModal]);

  //fetch dropdown options
  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const periods = await adminService.getLookupItems("Period");
        setPeriodOptions(periods);

        const levels = await adminService.getLookupItems("Level");
        setLevelOptions(levels);

        const departments = await adminService.findAllDepartment();
        // console.log("new api", departments); // DEBUG
        const transformedDepartments = departments.map(dept => ({
          ...dept,
          value: dept.value || dept.key
        }));

        setDepartmentOptions(transformedDepartments);
        await fetchVerifiedByOptions();
      } catch (error) {
        toast.error("Failed to load dropdown options.");
      }
    };
    fetchLookupData();
  }, []);

  //fetch verifiedBy options with pagination and search
  const fetchVerifiedByOptions = async (search?: string, page: number = 0) => {
    try {
      const groupLeadsResponse = await adminService.getAllGroupLeads(
        search || verifiedBySearch || undefined,
        page
      );
      setVerifiedByOptions(groupLeadsResponse.leads || []);
      setVerifiedByTotal(groupLeadsResponse.total || 0);
    } catch (error) {
      console.error("Failed to load group leads:", error);
    }
  };
  useEffect(() => {
    fetchVerifiedByOptions(verifiedBySearch, verifiedByPage);
  }, [verifiedByPage, verifiedBySearch]);

  //handlers for verifiedBy pagination
  const handleVerifiedByNextPage = () => {
    const totalPages = Math.ceil(verifiedByTotal / 10); // Assuming PAGE_SIZE of 10
    if (verifiedByPage < totalPages - 1) {
      setVerifiedByPage(prev => prev + 1);
    }
  };

  //handlers for verifiedBy pagination
  const handleVerifiedByPrevPage = () => {
    if (verifiedByPage > 0) {
      setVerifiedByPage(prev => prev - 1);
    }
  };
  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
    // eslint-disable-next-line
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
      const questionRes = await adminService.getQuestions(
        groupId,
        questionPage
      );
      //debug logs
      // console.log(" Question Response:", questionRes); // DEBUG
      // console.log("Questions:", questionRes.commonListDto); //  DEBUG
      // console.log(" Total:", questionRes.totalElements); //  DEBUG
      // console.log(" Current Page:", questionPage); //  DEBUG

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
        ...(verifiedBy && { verifiedByEmail: verifiedBy }),
        ...(formData.response === "yes_no" && { defaultFlag: defaultflag }),
      };
      console.log("Creating Question with data:", dataToSend);
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
        ...(verifiedBy && { verifiedByEmail: verifiedBy }),
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

  // const handleEditQuestion = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (
  //     !editingQuestion ||
  //     !formData.text.trim() ||
  //     formData.questionLevel.length === 0
  //   )
  //     return;

  //   try {
  //     const { defaultflag, verifiedBy, ...rest } = formData;

  //     console.log("=== EDIT QUESTION DEBUG ===");
  //     // console.log(" Form verifiedBy VALUE:", verifiedBy);

  //     const verifiedByKey = verifiedByOptions.find(opt => opt.value === verifiedBy)?.key || "";
  //     // console.log(" Found verifiedByKey:", verifiedByKey);

  //     const dataToSend = {
  //       ...rest,
  //       verifiedBy: verifiedByKey,
  //       ...(formData.response === "yes_no" && { defaultFlag: defaultflag }),
  //     };

  //     console.log(" Data being sent to API:", dataToSend);

  //     // Call update API
  //     await adminService.updateQuestion(dataToSend);

  //     // Close modal first for better UX
  //     setShowEditModal(false);
  //     setEditingQuestion(null);
  //     resetForm();

  //     // Fetch data from database
  //     await fetchGroupData();

  //     //debug logs
  //     console.log(" Fresh questions from database:", questions);

  //     // Find the specific question we just updated
  //     const updatedQuestion = questions.find(q => q.id === editingQuestion.id);
  //     // console.log("Updated question from DB:", updatedQuestion);
  //     // console.log(" Updated question's verifiedBy from DB:", updatedQuestion?.verifiedBy);

  //     // toast.success("Question updated successfully!");
  //   } catch (err: any) {
  //     console.error("Error updating question:", err);
  //     setError(err.response?.data?.message || "Failed to update question");
  //     toast.error("Failed to update question");
  //   }
  // };
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);

    const matchingOption = verifiedByOptions.find(
      opt => opt.value === question.verifiedByEmail
    );

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
      verifiedBy: matchingOption?.value || "",
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
      verifiedBy: "",
    });
  };
  const handleLevelToggle = (level: string) => {
    setFormData((prev) => ({
      ...prev,
      questionLevel: prev.questionLevel.includes(level)
        ? prev.questionLevel.filter((l) => l !== level)
        : [...prev.questionLevel, level],
    }));
  };

  const totalQuestionPages = Math.ceil(questionTotal / PAGE_SIZE);

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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/groups")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Groups
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{group.name} Questions</h1>
            <p className="text-muted-foreground mt-2">
              Manage onboarding questions for the {group.name} department
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Question
        </Button>
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
                    {question.verifiedBy && (
                      <span className="-ml-2 px-2 py-1 rounded">
                        Verified by: {verifiedByOptions.find(opt => opt.value === question.verifiedBy)?.key || question.verifiedBy}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(question)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleCloneQuestion(question)}
                    className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Clone Question"
                  >
                    <Copy size={16} />
                  </button>
                  {question.deleteFlag && questions.length > 1 && (
                    <button
                      onClick={() => {
                        setQuestionToDelete(question);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
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
                Start by creating onboarding questions for the {group.name}{" "}
                department
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
              <CardHeader className="flex-shrink-0 border-b">
                <CardTitle className="text-xl">
                  {showCreateModal ? "Create New Question" : "Edit Question"}
                </CardTitle>
              </CardHeader>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <CardContent className="p-6">
                  <form
                    onSubmit={
                      showCreateModal
                        ? handleCreateQuestion
                        : handleEditQuestion
                    }
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
                      {/* <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Employee Levels * (Select at least one)
                        </label>
                        <div className="flex gap-3 flex-wrap">
                          {levelOptions.map((levelOption) => (
                            <label
                              key={levelOption.value}
                              className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${formData.questionLevel.includes(
                                levelOption.value
                              )
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-input hover:border-primary/50"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.questionLevel.includes(
                                  levelOption.value
                                )}
                                onChange={() =>
                                  handleLevelToggle(levelOption.value)
                                }
                                className="sr-only"
                                disabled={showEditModal}
                              />
                              {levelOption.value}
                            </label>
                          ))}
                        </div>
                      </div> */}
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
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Verified By
                        </label>
                        <div className="relative">
                          <SearchableDropdown
                            className="w-full"
                            options={verifiedByOptions}
                            value={
                              verifiedByOptions.find(
                                (opt) => opt.value === formData.verifiedBy
                              )?.id
                            }
                            onChange={(id) => {
                              const selectedValue = verifiedByOptions.find((opt) => opt.id === id)?.value ?? "";
                              setFormData((prev) => ({
                                ...prev,
                                verifiedBy: selectedValue,
                              }));
                            }}
                            placeholder="Select who will verify"
                            displayFullValue={false}
                            onNextPage={handleVerifiedByNextPage}
                            onPrevPage={handleVerifiedByPrevPage}
                            currentPage={verifiedByPage}
                            totalPages={Math.ceil(verifiedByTotal / 10)}
                            hasNextPage={verifiedByPage < Math.ceil(verifiedByTotal / 10) - 1}
                          />
                        </div>
                      </div>

                      <div className="flex-1 " />
                    </div>

                    <div className="pb-4"></div>
                    {/* <div className="pb-4"></div> */}
                  </form>
                </CardContent>
              </div>

              {/* Sticky Footer with Buttons */}
              <div className="flex-shrink-0 border-t bg-background p-6">
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    form="question-form"
                    disabled={!isFormValid}
                    className="flex-1"
                  >
                    {showCreateModal ? "Create Question" : "Update Question"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEditingQuestion(null);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
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
                  variant="destructive"
                  onClick={handleDeleteQuestion}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupDetailsPage;
