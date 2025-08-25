'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import Button from '../../../components/Button';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Eye, Star, Send } from 'lucide-react';
import ThemeToggle from '../../../components/ThemeToggle';
import { useAnimation, animationClasses } from '../../../lib/animations';

interface EmployeeQuestion {
  id: string;
  questionText: string;
  questionType: 'Yes/No/N/A Question' | 'Text Response';
  status: 'pending' | 'answered' | 'completed';
  groupLeaderAnswer?: string;
  answeredAt?: string;
}

interface EmployeeTaskGroup {
  id: string;
  groupName: string;
  groupLeaderName: string;
  questions: EmployeeQuestion[];
  feedback?: {
    rating: number;
    comment: string;
    submitted: boolean;
  };
}

const GroupDetailPage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<EmployeeTaskGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    fetchGroupDetails();
  }, [user, router, groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: API - Get specific group details with questions for employee
      // GET /api/employees/{employeeId}/groups/{groupId}
      const mockGroups: EmployeeTaskGroup[] = [
        {
          id: '1',
          groupName: 'Frontend Development',
          groupLeaderName: 'John Smith',
          questions: [
            {
              id: 'q1',
              questionText: 'G1Q1',
              questionType: 'Yes/No/N/A Question',
              status: 'answered',
              groupLeaderAnswer: 'Yes',
              answeredAt: '2025-08-20T10:30:00Z'
            },
            {
              id: 'q2',
              questionText: 'G1Q2',
              questionType: 'Text Response',
              status: 'answered',
              groupLeaderAnswer: 'Completed',
              answeredAt: '2025-08-21T14:15:00Z'
            },
            {
              id: 'q3',
              questionText: 'G1Q3',
              questionType: 'Yes/No/N/A Question',
              status: 'pending'
            },
            {
              id: 'q4',
              questionText: 'G1Q4',
              questionType: 'Yes/No/N/A Question',
              status: 'answered',
              groupLeaderAnswer: 'No',
              answeredAt: '2025-08-22T09:20:00Z'
            },
            {
              id: 'q5',
              questionText: 'G1Q5',
              questionType: 'Text Response',
              status: 'pending'
            }
          ]
        },
        {
          id: '2',
          groupName: 'Backend Development',
          groupLeaderName: 'Sarah Johnson',
          questions: [
            {
              id: 'q6',
              questionText: 'G2Q1',
              questionType: 'Yes/No/N/A Question',
              status: 'answered',
              groupLeaderAnswer: 'N/A',
              answeredAt: '2025-08-19T16:45:00Z'
            },
            {
              id: 'q7',
              questionText: 'G2Q2',
              questionType: 'Yes/No/N/A Question',
              status: 'pending'
            },
            {
              id: 'q8',
              questionText: 'G2Q3',
              questionType: 'Text Response',
              status: 'answered',
              groupLeaderAnswer: 'Approved',
              answeredAt: '2025-08-21T11:30:00Z'
            },
            {
              id: 'q9',
              questionText: 'G2Q4',
              questionType: 'Text Response',
              status: 'pending'
            }
          ]
        },
        {
          id: '3',
          groupName: 'DevOps & Deployment',
          groupLeaderName: 'Mike Wilson',
          questions: [
            {
              id: 'q10',
              questionText: 'G3Q1',
              questionType: 'Yes/No/N/A Question',
              status: 'pending'
            },
            {
              id: 'q11',
              questionText: 'G3Q2',
              questionType: 'Yes/No/N/A Question',
              status: 'answered',
              groupLeaderAnswer: 'Yes',
              answeredAt: '2025-08-20T15:45:00Z'
            },
            {
              id: 'q12',
              questionText: 'G3Q3',
              questionType: 'Text Response',
              status: 'pending'
            }
          ]
        }
      ];
      
      const foundGroup = mockGroups.find(g => g.id === groupId);
      if (!foundGroup) {
        setError('Group not found');
        return;
      }
      
      setGroup(foundGroup);
    } catch (err) {
      console.error('Failed to fetch group details:', err);
      setError('Failed to load group details. Please try again.');
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
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
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

  const handleBack = () => {
    router.push('/employee');
  };

  const handleStarClick = (rating: number) => {
    setFeedbackRating(rating);
  };

  const handleFeedbackSubmit = async () => {
    try {
      setSubmittingFeedback(true);
      
      if (feedbackRating === 0) {
        alert('Please provide a rating before submitting.');
        return;
      }
      
      // TODO: API - Submit employee feedback for group
      // POST /api/employees/{employeeId}/groups/{groupId}/feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (group) {
        setGroup({
          ...group,
          feedback: { rating: feedbackRating, comment: feedbackComment, submitted: true }
        });
      }
      
      // Clear the form
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error || 'Group not found'}</p>
            <Button onClick={handleBack} variant="primary">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{group.groupName}</h1>
                <p className="text-muted-foreground">
                  Group Leader: {group.groupLeaderName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold text-foreground">{group.questions.length}</p>
                </div>
                <Eye className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Answered</p>
                  <p className="text-2xl font-bold text-foreground">
                    {group.questions.filter(q => q.status === 'answered').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={`${isVisible ? animationClasses.slideInRight : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {group.questions.filter(q => q.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Table */}
        <Card className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle>Questions & Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date Answered
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {group.questions.map((question, idx) => (
                    <tr key={question.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <td className="px-6 py-4 text-sm text-foreground">
                        <div className="max-w-xs">
                          {question.questionText}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          question.questionType === 'Yes/No/N/A Question' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {question.questionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(question.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                            {getStatusText(question.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {question.status === 'answered' && question.groupLeaderAnswer ? (
                          <div className="max-w-md">
                            <p className="text-sm text-foreground">{question.groupLeaderAnswer}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No answer yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {question.answeredAt 
                          ? new Date(question.answeredAt).toLocaleString()
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle>Feedback for {group.groupName}</CardTitle>
          </CardHeader>
          <CardContent>
            {group.feedback?.submitted ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">Your Feedback:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= group.feedback!.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">{group.feedback.comment}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">Feedback submitted successfully</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rating */}
                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-foreground mb-2">
                    Rating (1-5 stars)
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        className="focus:outline-none"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= feedbackRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    id="comment"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share your thoughts about this group's questions and answers..."
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback || feedbackRating === 0}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingFeedback ? 'Submitting...' : 'Submit Feedback'}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupDetailPage;
