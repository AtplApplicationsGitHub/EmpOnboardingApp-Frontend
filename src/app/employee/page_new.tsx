'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from '../components/ui/table';
import Button from '../components/Button';
import { CheckCircle, Clock, AlertCircle, Star, Send, X } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useAnimation, animationClasses } from '../lib/animations';

interface EmployeeQuestion {
  id: string;
  questionText: string;
  questionType: 'Yes/No/N/A Question' | 'Text Response';
  status: 'pending' | 'answered' | 'completed';
  groupLeaderAnswer?: string;
  answeredAt?: string;
  groupName: string;
  groupLeaderName: string;
  groupId: string;
}

interface FeedbackData {
  rating: number;
  comment: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [allQuestions, setAllQuestions] = useState<EmployeeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<EmployeeQuestion | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  const isVisible = useAnimation();
  const questionsPerPage = 10;

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
  }, [user, router, currentPage]);

  const fetchAllQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: API - Get all questions for employee across all groups
      // GET /api/employees/{employeeId}/questions?page={currentPage}&limit={questionsPerPage}
      
      // Mock data - flattened questions from all groups
      const mockQuestions: EmployeeQuestion[] = [
        {
          id: 'q1',
          questionText: 'Have you completed the React training module?',
          questionType: 'Yes/No/N/A Question',
          status: 'answered',
          groupLeaderAnswer: 'Yes',
          answeredAt: '2025-08-20T10:30:00Z',
          groupName: 'Frontend Development',
          groupLeaderName: 'John Smith',
          groupId: '1'
        },
        {
          id: 'q2',
          questionText: 'Describe your experience with TypeScript.',
          questionType: 'Text Response',
          status: 'answered',
          groupLeaderAnswer: 'Good understanding of basic types and interfaces',
          answeredAt: '2025-08-21T14:15:00Z',
          groupName: 'Frontend Development',
          groupLeaderName: 'John Smith',
          groupId: '1'
        },
        {
          id: 'q3',
          questionText: 'Are you familiar with Next.js routing?',
          questionType: 'Yes/No/N/A Question',
          status: 'pending',
          groupName: 'Frontend Development',
          groupLeaderName: 'John Smith',
          groupId: '1'
        },
        {
          id: 'q4',
          questionText: 'Have you set up the development environment?',
          questionType: 'Yes/No/N/A Question',
          status: 'answered',
          groupLeaderAnswer: 'No',
          answeredAt: '2025-08-19T09:45:00Z',
          groupName: 'Frontend Development',
          groupLeaderName: 'John Smith',
          groupId: '1'
        },
        {
          id: 'q5',
          questionText: 'What databases have you worked with?',
          questionType: 'Text Response',
          status: 'pending',
          groupName: 'Backend Development',
          groupLeaderName: 'Sarah Johnson',
          groupId: '2'
        },
        {
          id: 'q6',
          questionText: 'Are you comfortable with SQL queries?',
          questionType: 'Yes/No/N/A Question',
          status: 'answered',
          groupLeaderAnswer: 'Yes',
          answeredAt: '2025-08-22T11:20:00Z',
          groupName: 'Backend Development',
          groupLeaderName: 'Sarah Johnson',
          groupId: '2'
        },
        {
          id: 'q7',
          questionText: 'Explain your approach to API design.',
          questionType: 'Text Response',
          status: 'answered',
          groupLeaderAnswer: 'RESTful APIs with proper status codes and documentation',
          answeredAt: '2025-08-23T16:30:00Z',
          groupName: 'Backend Development',
          groupLeaderName: 'Sarah Johnson',
          groupId: '2'
        },
        {
          id: 'q8',
          questionText: 'Have you used Docker containers?',
          questionType: 'Yes/No/N/A Question',
          status: 'pending',
          groupName: 'Backend Development',
          groupLeaderName: 'Sarah Johnson',
          groupId: '2'
        }
      ];

      setAllQuestions(mockQuestions);
      setTotalPages(Math.ceil(mockQuestions.length / questionsPerPage));
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setError('Failed to load questions');
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

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleFeedback = (question: EmployeeQuestion) => {
    setSelectedQuestion(question);
    setFeedbackRating(0);
    setFeedbackComment('');
    setShowFeedbackModal(true);
  };

  const handleStarClick = (rating: number) => {
    setFeedbackRating(rating);
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedQuestion) return;

    try {
      setSubmittingFeedback(true);
      
      if (feedbackRating === 0) {
        alert('Please provide a rating before submitting.');
        return;
      }
      
      // TODO: API - Submit employee feedback for specific question/group
      // POST /api/employees/{employeeId}/questions/{questionId}/feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowFeedbackModal(false);
      setSelectedQuestion(null);
      setFeedbackRating(0);
      setFeedbackComment('');
      
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleCloseModal = () => {
    setShowFeedbackModal(false);
    setSelectedQuestion(null);
    setFeedbackRating(0);
    setFeedbackComment('');
  };

  const paginatedQuestions = allQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

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
      {/* Fixed Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-foreground">Employee Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Welcome, {user?.username}</span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className={`mb-6 ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
            <h1 className="text-2xl font-bold text-foreground mb-2">My Questions</h1>
            <p className="text-muted-foreground">
              View all your assigned questions and provide feedback
            </p>
          </div>

          {/* Statistics Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ${isVisible ? animationClasses.slideInUp : 'opacity-0'}`}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Answered</p>
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

          {/* Questions Table */}
          <Card className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle>All Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Group Leader</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Date Answered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedQuestions.map((question, idx) => (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-xs">
                          <div className="break-words">
                            {question.questionText}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            question.questionType === 'Yes/No/N/A Question' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
                            {question.questionType}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {question.groupName}
                        </TableCell>
                        <TableCell>
                          {question.groupLeaderName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(question.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                              {getStatusText(question.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {question.status === 'answered' && question.groupLeaderAnswer ? (
                            <div className="break-words">
                              {question.groupLeaderAnswer}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No answer yet</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {question.answeredAt 
                            ? new Date(question.answeredAt).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {question.status === 'answered' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFeedback(question)}
                              className="flex items-center space-x-1"
                            >
                              <Star size={14} />
                              <span>Feedback</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Provide Feedback</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="p-1"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Question:</h4>
                  <p className="text-sm">{selectedQuestion.questionText}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Group:</h4>
                  <p className="text-sm">{selectedQuestion.groupName}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Answer:</h4>
                  <p className="text-sm">{selectedQuestion.groupLeaderAnswer}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rating *</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        className={`text-2xl ${
                          star <= feedbackRating 
                            ? 'text-yellow-400' 
                            : 'text-gray-300 dark:text-gray-600'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your thoughts about this question and answer..."
                    className="w-full px-3 py-2 border border-input rounded-md resize-none bg-background text-foreground"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleFeedbackSubmit}
                    disabled={submittingFeedback || feedbackRating === 0}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    {submittingFeedback ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send size={16} />
                    )}
                    <span>Submit Feedback</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={submittingFeedback}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
