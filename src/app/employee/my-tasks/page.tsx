'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from '../../components/ui/table';
import Button from '../../components/Button';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAnimation, animationClasses } from '../../lib/animations';
import { employeeService } from '../../services/api';

interface EmployeeQuestion {
  id: string;
  questionText: string;
  questionType: 'Yes/No/N/A Question' | 'Text Response';
  status: 'pending' | 'answered' | 'completed';
  employeeAnswer?: string;
  answeredAt?: string;
  dueDate?: string;
  groupName: string;
  groupLeaderName: string;
  groupId: string;
}

interface GroupData {
  groupId: string;
  groupName: string;
  groupLeaderName: string;
  questions: EmployeeQuestion[];
}

interface AnswerData {
  questionId: string;
  answer: string;
}

const MyTasksPage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [allQuestions, setAllQuestions] = useState<EmployeeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [savingAnswers, setSavingAnswers] = useState<Record<string, boolean>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isOverdue = (question: EmployeeQuestion) => {
    if (!question.dueDate || question.status === 'answered') return false;
    return new Date(question.dueDate) < new Date();
  };

  const isVisible = useAnimation();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'employee') {
      router.push('/');
      return;
    }

    fetchAllQuestions();
  }, [user, router]);

  const fetchAllQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using backup/hardcoded questions for My Tasks page
      const backupQuestions: EmployeeQuestion[] = [
        {
          id: "1",
          questionText: "Have you completed the mandatory safety training?",
          questionType: "Yes/No/N/A Question",
          status: "pending",
          dueDate: "2024-01-15",
          groupName: "Safety & Compliance",
          groupLeaderName: "John Smith",
          groupId: "1"
        },
        {
          id: "2", 
          questionText: "Please describe your previous work experience relevant to this role.",
          questionType: "Text Response",
          status: "pending",
          dueDate: "2024-01-20",
          groupName: "HR & Onboarding",
          groupLeaderName: "Sarah Johnson",
          groupId: "2"
        },
        {
          id: "3",
          questionText: "Do you have access to all required systems and tools?",
          questionType: "Yes/No/N/A Question", 
          status: "answered",
          employeeAnswer: "Yes",
          answeredAt: "2024-01-10T10:30:00Z",
          dueDate: "2024-01-12",
          groupName: "IT & Systems",
          groupLeaderName: "Mike Davis",
          groupId: "3"
        },
        {
          id: "4",
          questionText: "What are your initial thoughts about the company culture?",
          questionType: "Text Response",
          status: "pending",
          dueDate: "2024-01-25",
          groupName: "HR & Onboarding",
          groupLeaderName: "Sarah Johnson",
          groupId: "2"
        },
        {
          id: "5",
          questionText: "Have you received your employee handbook and reviewed it completely?",
          questionType: "Yes/No/N/A Question",
          status: "pending",
          dueDate: "2024-01-18",
          groupName: "HR & Onboarding", 
          groupLeaderName: "Sarah Johnson",
          groupId: "2"
        }
      ];
      
      setAllQuestions(backupQuestions);
      
      // Initialize answer inputs with existing answers
      const initialAnswers: Record<string, string> = {};
      backupQuestions.forEach(question => {
        if (question.employeeAnswer) {
          initialAnswers[question.id] = question.employeeAnswer;
        }
      });
      setAnswerInputs(initialAnswers);
    } catch (error) {
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30';
      default:
        return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'answered':
        return 'Answered';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  // Auto-save function with debounce
  const handleAnswerChangeWithSave = async (questionId: string, value: string) => {
    setAnswerInputs(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Don't auto-save empty values
    if (!value.trim()) return;

    // Auto-save after typing stops (debounced)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingAnswers(prev => ({ ...prev, [questionId]: true }));
        
        const question = allQuestions.find(q => q.id === questionId);
        if (!question) return;
        
        await employeeService.submitAnswer(questionId, {
          answer: value.trim(),
          questionType: question.questionType
        });
        
        // Update local state
        setAllQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                employeeAnswer: value.trim(), 
                status: 'answered',
                answeredAt: new Date().toISOString()
              }
            : q
        ));
      } catch (error) {
        // Silently handle error - user will be notified via UI if needed
      } finally {
        setSavingAnswers(prev => ({ ...prev, [questionId]: false }));
      }
    }, 1000);
  };

  const renderAnswerInput = (question: EmployeeQuestion) => {
    const currentAnswer = answerInputs[question.id] || question.employeeAnswer || '';
    const isSaving = savingAnswers[question.id];

    if (question.questionType === 'Yes/No/N/A Question') {
      const lower = String(currentAnswer || "").toLowerCase();
      const isYes = lower === "yes" || lower === "y" || lower === "true";
      const isNo = lower === "no" || lower === "n" || lower === "false";
      const isNA = lower === "n/a" || lower === "na" || lower === "not applicable";

      return (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isYes ? "default" : "outline"}
            disabled={isSaving}
            onClick={() => handleAnswerChangeWithSave(question.id, "YES")}
            className="text-sm"
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={isNo ? "default" : "outline"}
            disabled={isSaving}
            onClick={() => handleAnswerChangeWithSave(question.id, "NO")}
            className="text-sm"
          >
            No
          </Button>
          <Button
            type="button"
            variant={isNA ? "default" : "outline"}
            disabled={isSaving}
            onClick={() => handleAnswerChangeWithSave(question.id, "N/A")}
            className="text-sm"
          >
            N/A
          </Button>
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
            placeholder="Type response and leave the field"
            value={currentAnswer}
            onChange={(e) => {
              setAnswerInputs(prev => ({
                ...prev,
                [question.id]: e.target.value
              }));
            }}
            onBlur={(e) => {
              const newVal = e.target.value.trim();
              if (newVal === (question.employeeAnswer ?? "")) return; // no change
              if (isSaving) return;
              if (newVal) {
                handleAnswerChangeWithSave(question.id, newVal);
              }
            }}
            disabled={isSaving}
          />
          {isSaving && (
            <span className="text-xs text-muted-foreground">Saving…</span>
          )}
        </div>
      );
    }
  };

  // Group questions by group
  const groupedQuestions = allQuestions.reduce((groups, question) => {
    const groupKey = question.groupId;
    if (!groups[groupKey]) {
      groups[groupKey] = {
        groupId: question.groupId,
        groupName: question.groupName,
        groupLeaderName: question.groupLeaderName,
        questions: []
      };
    }
    groups[groupKey].questions.push(question);
    return groups;
  }, {} as Record<string, {
    groupId: string;
    groupName: string;
    groupLeaderName: string;
    questions: EmployeeQuestion[];
  }>);

  const groupsArray = Object.values(groupedQuestions);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchAllQuestions()} variant="primary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className={`mb-6 ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
            <h1 className="text-2xl font-bold text-foreground mb-2">My Tasks</h1>
            <p className="text-muted-foreground">
              Answer your assigned questions and submit your responses
            </p>
          </div>

          {/* Statistics Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ${isVisible ? animationClasses.slideInUp : 'opacity-0'}`}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                    <p className="text-2xl font-bold text-foreground">
                      {allQuestions.length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground">
                      {allQuestions.filter(q => q.status === 'answered').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-foreground">
                      {allQuestions.filter(q => q.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grouped Questions */}
          <div className="space-y-6">
            {groupsArray.map((group, groupIndex) => (
              <Card key={group.groupId} className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: `${200 + (groupIndex * 100)}ms` }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 rounded-full p-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{group.groupName}</CardTitle>
                        <p className="text-sm text-muted-foreground">Group Leader: {group.groupLeaderName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{group.questions.length}</p>
                        <p className="text-sm text-muted-foreground">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {group.questions.filter(q => q.status === 'answered').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>My Response</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.questions.map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="max-w-xs">
                              <div className="break-words font-medium">
                                {question.questionText}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {question.questionType === 'Yes/No/N/A Question' ? 'Yes/No/N/A' : 'Text Response'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                question.questionType === 'Yes/No/N/A Question' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              }`}>
                                {question.questionType === 'Yes/No/N/A Question' ? 'Yes/No/N/A' : 'Text'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(question.status)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                                  {getStatusText(question.status)}
                                </span>
                                {isOverdue(question) && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {question.dueDate 
                                ? new Date(question.dueDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: '2-digit'
                                  })
                                : '—'
                              }
                            </TableCell>
                            <TableCell className="max-w-md">
                              {renderAnswerInput(question)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasksPage;
