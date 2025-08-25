'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import Button from '../components/Button';
import { Eye, CheckCircle, Clock, AlertCircle, Star, Send } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useAnimation, animationClasses } from '../lib/animations';

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

interface EmployeeQuestion {
  id: string;
  questionText: string;
  questionType: 'Yes/No/N/A Question' | 'Text Response';
  status: 'pending' | 'answered' | 'completed';
  groupLeaderAnswer?: string;
  answeredAt?: string;
}

const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [taskGroups, setTaskGroups] = useState<EmployeeTaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
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

    fetchEmployeeTaskGroups();
  }, [user, router]);

  const fetchEmployeeTaskGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: API - Get employee's assigned task groups and questions
      // GET /api/employees/{employeeId}/task-groups
      const mockData: EmployeeTaskGroup[] = [
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
      
      setTaskGroups(mockData);
    } catch (err: any) {
      setError(err.message || 'Failed to load your assigned questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/employee/group/${groupId}`);
  };

  // Pagination helpers
  const totalPages = Math.ceil(taskGroups.length / itemsPerPage);
  const getCurrentPageGroups = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return taskGroups.slice(startIndex, endIndex);
  };

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
            <Button onClick={fetchEmployeeTaskGroups} variant="primary">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className={`${isVisible ? animationClasses.slideInLeft : 'opacity-0'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Groups</p>
                <p className="text-2xl font-bold text-foreground">{taskGroups.length}</p>
              </div>
              <Eye className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '100ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold text-foreground">
                  {taskGroups.reduce((sum, group) => sum + group.questions.length, 0)}
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
                <p className="text-sm font-medium text-muted-foreground">Answered Questions</p>
                <p className="text-2xl font-bold text-foreground">
                  {taskGroups.reduce((sum, group) => 
                    sum + group.questions.filter(q => q.status === 'answered').length, 0
                  )}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Groups Table */}
        <Card className={`${isVisible ? animationClasses.slideInUp : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle>My Task Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Group Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {getCurrentPageGroups().map((group, idx) => {
                    const answeredCount = group.questions.filter(q => q.status === 'answered').length;
                    const totalCount = group.questions.length;
                    const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
                    
                    return (
                      <tr key={group.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {group.groupName}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {group.groupLeaderName}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {totalCount} Questions
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground min-w-fit">
                              {answeredCount}/{totalCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button
                            onClick={() => handleViewGroup(group.id)}
                            variant="primary"
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, taskGroups.length)} of {taskGroups.length} groups
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="ghost"
                    size="sm"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? "primary" : "ghost"}
                      size="sm"
                      className="min-w-[2rem]"
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="ghost"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {taskGroups.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any questions assigned yet. Check back later or contact your group leader.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default EmployeeDashboard;
