"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "../../../services/api";
import { Group, Question } from "../../../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import Button from "../../../components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2, HelpCircle } from "lucide-react";
import SearchableDropdown from "@/app/components/SearchableDropdown";

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

  // Pagination state
  const [questionPage, setQuestionPage] = useState(0);
  const [questionTotal, setQuestionTotal] = useState(0);

  const periodOptions = [
    { id: 101, key: "after", value: "after" },
    { id: 102, key: "before", value: "before" },
  ];

  // Form states
  const [formData, setFormData] = useState({
    id: 0,
    text: "",
    response: "yes_no" as "yes_no" | "text",
    period: "after",
    complainceDay: "1",
    questionLevel: [] as string[],
    groupId: groupId.toString(),
  });

  const levels = ["L1", "L2", "L3", "L4"];

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
    // eslint-disable-next-line
  }, [groupId, questionPage]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupData = await adminService.findGroupById(groupId);
      // Get paginated questions
      const questionRes = await adminService.getQuestions(
        groupId,
        questionPage
      );
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
      await adminService.createQuestion(formData);
      setShowCreateModal(false);
      resetForm();
      // Refetch to get the latest questions (could land on new last page, but keeping at current page for now)
      fetchGroupData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create question");
    }
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !editingQuestion ||
      !formData.text.trim() ||
      formData.questionLevel.length === 0
    )
      return;

    try {
      formData.id = editingQuestion.id;
      await adminService.updateQuestion(formData);
      setShowEditModal(false);
      setEditingQuestion(null);
      resetForm();
      fetchGroupData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update question");
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const openEditModal = (question: Question) => {
    console.log("Editing question:", question);
    setEditingQuestion(question);
    setFormData({
      id: question.id,
      text: question.text,
      response: question.response,
      period: question.period,
      complainceDay: question.complainceDay || "1",
      questionLevel: question.questionLevel,
      groupId: question.groupId.toString(),
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
      questionLevel: [],
      groupId: groupId.toString(),
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
        {questions.map((question) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle size={20} className="text-primary" />
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
                    onClick={() => {
                      setQuestionToDelete(question);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4  max-h-[95vh]">
            <CardHeader>
              <CardTitle>
                {showCreateModal ? "Create New Question" : "Edit Question"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={
                  showCreateModal ? handleCreateQuestion : handleEditQuestion
                }
                className="space-y-6"
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

                {/* Response Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Response Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
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
                    <label className="flex items-center gap-2">
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

               {/* New container for Period and Compliance Day fields */}
<div className="flex flex-col md:flex-row gap-6">
    {/* Period */}
    <div className="flex-1">
        <label className="block text-sm font-medium mb-2">
            Period *
        </label>
        <div className="flex gap-4">
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
                        periodOptions.find((opt) => opt.id === id)?.value ??
                        "";
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
            value={parseInt(formData.complainceDay)}
            onChange={(e) =>
                setFormData((prev) => ({
                    ...prev,
                    complainceDay: e.target.value,
                }))
            }
            placeholder="Enter number of days"
            className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
        />
        <p className="text-xs text-muted-foreground mt-1">
            Number of days from the employee's start date when this task
            should be completed
        </p>
    </div>
</div>

                {/* Employee Levels */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Employee Levels * (Select at least one)
                  </label>
                  <div className="flex gap-3">
                    {levels.map((level) => (
                      <label
                        key={level}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                          formData.questionLevel.includes(level)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.questionLevel.includes(level)}
                          onChange={() => handleLevelToggle(level)}
                          className="sr-only"
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
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
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && questionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Group</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete the Question{" "}
                <span className="font-semibold">{questionToDelete.text}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
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
