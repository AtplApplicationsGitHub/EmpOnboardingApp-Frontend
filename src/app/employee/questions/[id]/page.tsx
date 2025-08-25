'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import Button from '../../../components/Button';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Send, Save } from 'lucide-react';
import ThemeToggle from '../../../components/ThemeToggle';
import { useAnimation, animationClasses } from '../../../lib/animations';

interface Question {
  id: string;
  questionText: string;
  questionType: 'text' | 'multiple_choice' | 'yes_no' | 'rating';
  options?: string[];
  answer?: string;
  isAnswered: boolean;
  required: boolean;
}

interface TaskGroupDetails {
  id: string;
  groupName: string;
  taskTitle: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  dueDate?: string;
  assignedDate: string;
  questions: Question[];
  feedback?: string;
  canSubmit: boolean;
}

const EmployeeQuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskGroupId = params.id as string;
  
  const [taskGroup, setTaskGroup] = useState<TaskGroupDetails | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
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

    fetchTaskGroupDetails();
  }, [user, router, taskGroupId]);

  const fetchTaskGroupDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call when backend endpoint is available
      // const response = await employeeService.getTaskGroupDetails(taskGroupId);
      
      // Mock data for now
      const mockData: TaskGroupDetails = {
        id: taskGroupId,
        groupName: 'Development Team',
        taskTitle: 'Onboarding - React Development',
        description: 'Complete these questions to demonstrate your understanding of React development concepts and our company processes.',
        status: 'in_progress',
        dueDate: '2025-08-30',
        assignedDate: '2025-08-20',
        canSubmit: true,
        questions: [
          {
            id: '1',
            questionText: 'What is your previous experience with React?',
            questionType: 'text',
            answer: 'I have 2 years of experience working with React in my previous company...',
            isAnswered: true,
            required: true,
          },
          {
            id: '2',
            questionText: 'Which of the following React concepts are you familiar with?',
            questionType: 'multiple_choice',
            options: ['Hooks', 'Context API', 'Redux', 'React Router', 'Testing'],
            answer: 'Hooks,Context API,React Router',
            isAnswered: true,
            required: true,
          },
          {
            id: '3',
            questionText: 'Are you comfortable working with TypeScript?',
            questionType: 'yes_no',
            answer: 'Yes',
            isAnswered: true,
            required: true,
          },
          {
            id: '4',
            questionText: 'Rate your confidence level with Git/GitHub (1-5)',
            questionType: 'rating',
            answer: '4',
            isAnswered: true,
            required: true,
          },
          {
            id: '5',
            questionText: 'Describe your understanding of component lifecycle in React.',
            questionType: 'text',
            answer: '',
            isAnswered: false,
            required: true,
          },
          {
            id: '6',
            questionText: 'Have you worked with Next.js before?',
            questionType: 'yes_no',
            answer: '',
            isAnswered: false,
            required: false,
          }
        ],
        feedback: 'Great progress so far! Your answers show good understanding of React concepts. Please complete the remaining questions.'
      };
      
      setTaskGroup(mockData);
      
      // Initialize answers from existing data
      const initialAnswers: Record<string, string> = {};
      mockData.questions.forEach(question => {
        if (question.answer) {
          initialAnswers[question.id] = question.answer;
        }
      });
      setAnswers(initialAnswers);
      
    } catch (error) {
      console.error('Error fetching task group details:', error);
      setError('Failed to load task group details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear any success message when user starts editing
    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // await employeeService.saveAnswers(taskGroupId, answers);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Answers saved as draft successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving answers:', error);
      setError('Failed to save answers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!taskGroup) return;
    
    // Validate required questions
    const requiredQuestions = taskGroup.questions.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
    
    if (missingAnswers.length > 0) {
      setError(`Please answer all required questions. Missing: ${missingAnswers.length} question(s)`);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // await employeeService.submitAnswers(taskGroupId, answers, feedbackText);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccessMessage('Answers submitted successfully!');
      
      // Redirect back to dashboard after successful submission
      setTimeout(() => {
        router.push('/employee');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting answers:', error);
      setError('Failed to submit answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const currentAnswer = answers[question.id] || '';
    
    switch (question.questionType) {
      case 'text':
        return (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={4}
          />
        );
        
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map(option => {
              const selectedOptions = currentAnswer.split(',').filter(Boolean);
              const isSelected = selectedOptions.includes(option);
              
              return (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const selectedOptions = currentAnswer.split(',').filter(Boolean);
                      if (e.target.checked) {
                        selectedOptions.push(option);
                      } else {
                        const index = selectedOptions.indexOf(option);
                        if (index > -1) {
                          selectedOptions.splice(index, 1);
                        }
                      }
                      handleAnswerChange(question.id, selectedOptions.join(','));
                    }}
                    className="rounded border-border focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-foreground">{option}</span>
                </label>
              );
            })}
          </div>
        );
        
      case 'yes_no':
        return (
          <div className="space-y-2">
            {['Yes', 'No'].map(option => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="border-border focus:ring-2 focus:ring-primary"
                />
                <span className="text-foreground">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'rating':
        return (
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5].map(rating => (
              <label key={rating} className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={rating.toString()}
                  checked={currentAnswer === rating.toString()}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="border-border focus:ring-2 focus:ring-primary"
                />
                <span className="text-foreground">{rating}</span>
              </label>
            ))}
          </div>
        );
        
      default:
        return null;
    }
  };

  const getAnsweredCount = () => {
    if (!taskGroup) return 0;
    return taskGroup.questions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length;
  };

  const getRequiredAnsweredCount = () => {
    if (!taskGroup) return 0;
    const requiredQuestions = taskGroup.questions.filter(q => q.required);
    return requiredQuestions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!taskGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Task Group Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The requested task group could not be found.
              </p>
              <Button onClick={() => router.push('/employee')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = getAnsweredCount();
  const requiredAnsweredCount = getRequiredAnsweredCount();
  const totalRequired = taskGroup.questions.filter(q => q.required).length;
  const canSubmit = requiredAnsweredCount === totalRequired && taskGroup.canSubmit;

  return (
    <div className={`min-h-screen bg-background ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Header */}
      <header className={`bg-card border-b border-border ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/employee')}
                className={`${animationClasses.hoverScale} flex items-center space-x-2`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{taskGroup.taskTitle}</h1>
                <p className="text-muted-foreground">Group: {taskGroup.groupName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Status Messages */}
          {error && (
            <Card className={`mb-6 border-destructive ${animationClasses.slideInUp}`}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {successMessage && (
            <Card className={`mb-6 border-green-500 bg-green-50 ${animationClasses.slideInUp}`}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>{successMessage}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Overview */}
          <Card className={`mb-6 ${isVisible ? animationClasses.slideInUp : 'opacity-0'}`}>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${taskGroup.questions.length > 0 ? (answeredCount / taskGroup.questions.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {answeredCount}/{taskGroup.questions.length}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Required Questions</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${totalRequired > 0 ? (requiredAnsweredCount / totalRequired) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {requiredAnsweredCount}/{totalRequired}
                    </span>
                  </div>
                </div>
                
                {taskGroup.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {new Date(taskGroup.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              {taskGroup.description && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">{taskGroup.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-6">
            {taskGroup.questions.map((question, index) => {
              const isAnswered = answers[question.id] && answers[question.id].trim() !== '';
              
              return (
                <Card 
                  key={question.id} 
                  className={`${animationClasses.hoverLift} ${isVisible ? animationClasses.slideInUp : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">Q{index + 1}.</span>
                          <span>{question.questionText}</span>
                          {question.required && (
                            <span className="text-destructive text-sm">*</span>
                          )}
                        </div>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {isAnswered ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {renderQuestionInput(question)}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feedback Section */}
          {taskGroup.feedback && (
            <Card className={`mt-6 ${animationClasses.slideInUp}`}>
              <CardHeader>
                <CardTitle>Feedback from Group Leader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800">{taskGroup.feedback}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Feedback Input */}
          <Card className={`mt-6 ${animationClasses.slideInUp}`}>
            <CardHeader>
              <CardTitle>Additional Comments (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share any additional thoughts, questions, or feedback about this task group..."
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={`mt-8 flex justify-between items-center ${animationClasses.slideInUp}`}>
            <div className="text-sm text-muted-foreground">
              {!canSubmit && totalRequired > requiredAnsweredCount && (
                <span>Complete {totalRequired - requiredAnsweredCount} more required question(s) to submit</span>
              )}
            </div>
            
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className={`${animationClasses.hoverScale} flex items-center space-x-2`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSubmitAnswers}
                disabled={!canSubmit || saving || submitting}
                className={`${animationClasses.hoverScale} flex items-center space-x-2`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Answers</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeQuestionsPage;
