import React, { useState, useEffect } from 'react';
import { User, Task } from '../types';
import {  adminService } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import Button from './ui/button';
import { ArrowRight, X, CheckCircle, FileText, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReassignSuccess: () => void;
  selectedTasks: Task[];
  mode: 'single' | 'bulk';
  userType?: 'admin' | 'group_lead'; // New prop to determine which service to use
}

const TaskReassignModal: React.FC<TaskReassignModalProps> = ({
  isOpen,
  onClose,
  onReassignSuccess,
  selectedTasks,
  mode,
  userType = 'group_lead' // Default to group_lead for backward compatibility
}) => {
  const [groupLeaders, setGroupLeaders] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLeaders, setFetchingLeaders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGroupLeaders();
      setReason(''); // Reset reason when modal opens
      setSelectedAssignee(null);
      // Initially select all tasks
      setSelectedTaskIds(new Set(selectedTasks.map(task => task.id)));
    }
  }, [isOpen, selectedTasks]);

  const fetchGroupLeaders = async () => {
    try {
      setFetchingLeaders(true);
      let leaders: User[];
      
      if (userType === 'admin') {
        // Use admin service to get group leaders
        const result = await adminService.getUsers({ role: 'group_lead' });
        leaders = result.users;
      } else {
        // Use group leader service
        leaders = await groupLeadService.getGroupLeaders();
      }
      
      setGroupLeaders(leaders);
    } catch (error: any) {
      console.error('Failed to fetch group leaders:', error);
      toast.error('Failed to load group leaders');
    } finally {
      setFetchingLeaders(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedAssignee) {
      toast.error('Please select a group leader to reassign to');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for reassignment');
      return;
    }

    if (selectedTaskIds.size === 0) {
      toast.error('Please select at least one question to reassign');
      return;
    }

    try {
      setLoading(true);

      const tasksToReassign = selectedTasks.filter(task => selectedTaskIds.has(task.id));

      if (userType === 'admin') {
        // Use admin service
        if (tasksToReassign.length === 1) {
          await adminService.reassignTaskToUser(
            tasksToReassign[0].id,
            selectedAssignee,
            reason
          );
          toast.success('Task reassigned successfully');
        } else {
          const taskIds = tasksToReassign.map(task => task.id);
          const result = await adminService.bulkReassignTasksToUser(
            taskIds,
            selectedAssignee,
            reason
          );
          toast.success(`${result.reassigned_count} tasks reassigned successfully`);
        }
      } else if (tasksToReassign.length === 1) {
        // Use group leader service - single task
        await groupLeadService.reassignTask(
          tasksToReassign[0].id,
          selectedAssignee,
          reason
        );
        toast.success('Task reassigned successfully');
      } else {
        // Use group leader service - multiple tasks
        const taskIds = tasksToReassign.map(task => task.id);
        const result = await groupLeadService.bulkReassignTasks(
          taskIds,
          selectedAssignee,
          reason
        );
        toast.success(`${result.reassigned_count} tasks reassigned successfully`);
      }

      onReassignSuccess();
      onClose();
    } catch (error: any) {
      console.error('Reassignment failed:', error);
      toast.error(error.response?.data?.message || 'Failed to reassign tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId: number) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === selectedTasks.length) {
      // Deselect all
      setSelectedTaskIds(new Set());
    } else {
      // Select all
      setSelectedTaskIds(new Set(selectedTasks.map(task => task.id)));
    }
  };

  if (!isOpen) return null;

  const selectedLeader = groupLeaders.find(leader => leader.id === selectedAssignee);
  const selectedTasksCount = selectedTaskIds.size;
  const questionText = selectedTasksCount > 1 ? 'Questions' : 'Question';
  const buttonText = loading 
    ? 'Reassigning...' 
    : `Reassign ${selectedTasksCount} ${questionText}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="bg-primary/10 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <ArrowRight size={20} />
                Reassign Task{selectedTasks.length > 1 ? 's' : ''}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Question Selection */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  Select Questions to Reassign
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loading}
                  className="text-xs"
                >
                  {selectedTaskIds.size === selectedTasks.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {selectedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-background rounded border border-border/50 hover:border-border transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`task-${task.id}`}
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => handleTaskToggle(task.id)}
                      disabled={loading}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`task-${task.id}`}
                        className="block cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserIcon size={14} className="text-muted-foreground" />
                          <span className="font-medium text-sm">{task.mock_employee_name}</span>
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {task.mock_employee_level}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {task.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Day {task.compliance_day}</span>
                          <span>•</span>
                          <span className="capitalize">{task.response_type.replace('_', ' ')}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  {selectedTasksCount} of {selectedTasks.length} questions selected for reassignment
                </p>
              </div>
            </div>

            {/* Group Leader Selection */}
            <div>
              <label htmlFor="assignee-select" className="block text-sm font-medium mb-2">
                Reassign to Group Leader *
              </label>
              {fetchingLeaders ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                  Loading group leaders...
                </div>
              ) : (
                <select
                  id="assignee-select"
                  value={selectedAssignee || ''}
                  onChange={(e) => setSelectedAssignee(Number(e.target.value) || null)}
                  className="w-full p-2 border border-input bg-background rounded-md text-sm"
                  disabled={loading}
                >
                  <option value="">Select a group leader...</option>
                  {groupLeaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} ({leader.email})
                    </option>
                  ))}
                </select>
              )}
              {groupLeaders.length === 0 && !fetchingLeaders && (
                <p className="text-sm text-muted-foreground mt-1">
                  No other group leaders available
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason-textarea" className="block text-sm font-medium mb-2">
                Reason for Reassignment *
              </label>
              <textarea
                id="reason-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for this reassignment..."
                className="w-full p-2 border border-input bg-background rounded-md text-sm resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Preview */}
            {selectedLeader && selectedTasksCount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle size={16} />
                  <span className="font-medium">Assignment Preview</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {selectedTasksCount} question{selectedTasksCount > 1 ? 's' : ''} will be assigned to{' '}
                  <strong>{selectedLeader.name}</strong>
                </p>
                <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                  Due dates will remain unchanged as per current requirements
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                disabled={loading || !selectedAssignee || !reason.trim() || selectedTasksCount === 0 || groupLeaders.length === 0}
                className="flex-1"
              >
                {buttonText}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskReassignModal;
