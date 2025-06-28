'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '../../../services/api';
import { Group, Question } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import Button from '../../../components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, HelpCircle } from 'lucide-react';

const GroupDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);
  
  const [group, setGroup] = useState<Group | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    question_text: '',
    response_type: 'yes_no' as 'yes_no' | 'text',
    compliance_day: 1,
    levels: [] as string[]
  });

  const levels = ['L1', 'L2', 'L3', 'L4'];

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const [groupsData, questionsData] = await Promise.all([
        adminService.getGroups(),
        adminService.getQuestions(groupId)
      ]);
      
      const currentGroup = groupsData.find(g => g.id === groupId);
      if (!currentGroup) {
        setError('Group not found');
        return;
      }
      
      setGroup(currentGroup);
      setQuestions(questionsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question_text.trim() || formData.levels.length === 0) return;

    try {
      const newQuestion = await adminService.createQuestion(groupId, formData);
      setQuestions([...questions, newQuestion]);
      resetForm();
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create question');
    }
  };

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !formData.question_text.trim() || formData.levels.length === 0) return;

    try {
      const updatedQuestion = await adminService.updateQuestion(editingQuestion.id, formData);
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? updatedQuestion : q
      ));
      resetForm();
      setEditingQuestion(null);
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.deleteQuestion(questionId);
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const openEditModal = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      response_type: question.response_type,
      compliance_day: parseInt(question.compliance_day.toString()) || 1,
      levels: question.levels
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      response_type: 'yes_no',
      compliance_day: 1,
      levels: []
    });
  };

  const handleLevelToggle = (level: string) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level]
    }));
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
          <Button onClick={() => router.push('/admin/groups')} className="mt-4">
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
            onClick={() => router.push('/admin/groups')}
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
                    {question.question_text}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {question.response_type === 'yes_no' ? 'Yes/No/N/A' : 'Text Response'}
                    </span>
                    <span>Due: Day {question.compliance_day}</span>
                    <div className="flex items-center gap-1">
                      <span>Levels:</span>
                      {question.levels.map(level => (
                        <span key={level} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                          {level}
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
                    onClick={() => handleDeleteQuestion(question.id)}
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

      {/* Create/Edit Question Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {showCreateModal ? 'Create New Question' : 'Edit Question'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={showCreateModal ? handleCreateQuestion : handleEditQuestion} className="space-y-6">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
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
                        checked={formData.response_type === 'yes_no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, response_type: e.target.value as 'yes_no' }))}
                        className="text-primary"
                      />
                      Yes/No/N/A Question
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="text"
                        checked={formData.response_type === 'text'}
                        onChange={(e) => setFormData(prev => ({ ...prev, response_type: e.target.value as 'text' }))}
                        className="text-primary"
                      />
                      Text Response
                    </label>
                  </div>
                </div>

                {/* Compliance Day */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Compliance Day * (Number of days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.compliance_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, compliance_day: parseInt(e.target.value) || 1 }))}
                    placeholder="Enter number of days"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of days from the employee's start date when this task should be completed
                  </p>
                </div>

                {/* Employee Levels */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Employee Levels * (Select at least one)
                  </label>
                  <div className="flex gap-3">
                    {levels.map(level => (
                      <label
                        key={level}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                          formData.levels.includes(level)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.levels.includes(level)}
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
                    {showCreateModal ? 'Create Question' : 'Update Question'}
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
    </div>
  );
};

export default GroupDetailsPage;
