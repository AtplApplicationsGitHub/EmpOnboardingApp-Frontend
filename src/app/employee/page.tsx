'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from '../components/ui/table';
import Button from '../components/Button';
import { CheckCircle, Clock, AlertCircle, Star, Send, X } from 'lucide-react';
import { useAnimation, animationClasses } from '../lib/animations';
import { employeeService } from '../services/api';

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

interface GroupData {
  groupId: string;
  groupName: string;
  groupLeaderName: string;
  questions: EmployeeQuestion[];
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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<EmployeeQuestion | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
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
      
      // Use API service to fetch employee questions
      const questions = await employeeService.getAllQuestions();
      setAllQuestions(questions);
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

  const handleFeedback = (group: GroupData) => {
    setSelectedGroup(group);
    setSelectedQuestion(null);
    setFeedbackRating(0);
    setFeedbackComment('');
    setShowFeedbackModal(true);
  };

  const handleStarClick = (rating: number) => {
    setFeedbackRating(rating);
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedGroup) return;

    try {
      setSubmittingFeedback(true);
      
      if (feedbackRating === 0) {
        alert('Please provide a rating before submitting.');
        return;
      }
      
      // Use API service to submit group feedback
      const result = await employeeService.submitGroupFeedback(selectedGroup.groupId, {
        rating: feedbackRating,
        comment: feedbackComment
      });
      
      setShowFeedbackModal(false);
      setSelectedGroup(null);
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
    setSelectedGroup(null);
    setFeedbackRating(0);
    setFeedbackComment('');
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
                        <p className="text-sm text-muted-foreground">Questions</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleFeedback(group)}
                        disabled={!group.questions.some(q => q.status === 'answered')}
                        className={`flex items-center space-x-2 ${
                          !group.questions.some(q => q.status === 'answered') 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                      >
                        <Star size={16} />
                        <span>Feedback</span>
                      </Button>
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
                          <TableHead>Compliance Day</TableHead>
                          <TableHead>Response</TableHead>
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
                                {question.questionType === 'Yes/No/N/A Question' ? 'Yes/No' : 'Text'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                question.questionType === 'Yes/No/N/A Question' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              }`}>
                                {question.questionType === 'Yes/No/N/A Question' ? 'Yes/No' : 'Text'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(question.status)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                                  {getStatusText(question.status)}
                                </span>
                                {question.status === 'pending' && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {question.answeredAt 
                                ? new Date(question.answeredAt).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: '2-digit'
                                  })
                                : '21-Aug-25'
                              }
                            </TableCell>
                            <TableCell className="max-w-md">
                              {question.status === 'answered' && question.groupLeaderAnswer ? (
                                <div className="break-words">
                                  {question.groupLeaderAnswer}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic">No response yet</span>
                              )}
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

      {/* Feedback Modal */}
      {showFeedbackModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Provide Group Feedback</h3>
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
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Group:</h4>
                  <p className="text-sm font-medium">{selectedGroup.groupName}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Group Leader:</h4>
                  <p className="text-sm">{selectedGroup.groupLeaderName}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Questions in this group:</h4>
                  <div className="text-sm space-y-1">
                    {selectedGroup.questions.map((question, index) => (
                      <div key={question.id} className="flex items-center space-x-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{question.questionText}</span>
                        <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(question.status)}`}>
                          {getStatusText(question.status)}
                        </span>
                      </div>
                    ))}
                  </div>
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
                    placeholder="Share your thoughts about this group and the questions provided..."
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
