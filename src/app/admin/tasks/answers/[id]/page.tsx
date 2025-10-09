"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EQuestions } from "../../../../services/api";
import { EmployeeQuestions } from "../../../../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import Button from "../../../../components/ui/button";
import {
  ArrowLeft,
  Calendar,
  User,
} from "lucide-react";

const TaskAnswersPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [questions, setQuestions] = useState<EmployeeQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskAnswers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!taskId) {
          setError("Task ID is required");
          return;
        }

        const response = await EQuestions.getQuestionsByTask(taskId);
        console.log("Fetched questions:", response); // Debug log
        setQuestions(response);
      } catch (err: any) {
        console.error("Error fetching task answers:", err);
        setError(err.message || "Failed to load task answers");
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskAnswers();
    }
  }, [taskId]);

  const completedQuestions = questions.filter(question => 
    question.completedFlag === true
  ).length;
  const totalQuestions = questions.length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading task answers...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft size={16} className="mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Questions Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              No questions found for this task.
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Tasks
          </Button>
          <h1 className="text-2xl font-bold">
            Employee Task Questions
          </h1>
        </div>
      </div>

      {/* Questions Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Questions and Responses
            </CardTitle>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {completedQuestions}/{totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground">
                Questions
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 dark:border-gray-700">
                <TableHead className="text-gray-700 dark:text-gray-300">Question</TableHead>
                <TableHead className="text-gray-700 dark:text-gray-300">Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, index) => (
                <TableRow key={question.id || index} className="border-gray-200 dark:border-gray-700">
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100 align-top">
                    {question.question || 'No question text available'}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={question.response || ''}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100 disabled:opacity-75 disabled:cursor-not-allowed"
                        placeholder="No response provided"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskAnswersPage;
