import React, { useState, useEffect } from 'react';
import { User, Task } from '../types';
import { groupLeadService, adminService } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import Button from './ui/button';
import SearchableDropdown from './SearchableDropdown';
import { ArrowRight, X, CheckCircle } from 'lucide-react';
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
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLeaders, setFetchingLeaders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGroupLeaders();
      setReason(''); // Reset reason when modal opens
      setSelectedAssignee(null);
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
      
      // Get all unique assignee IDs from selected tasks to exclude them
      const currentAssigneeIds = new Set(selectedTasks.map(task => task.assignee_id));
      
      // Filter out currently assigned group leaders
      const availableLeaders = leaders.filter(leader => !currentAssigneeIds.has(leader.id));
      
      setGroupLeaders(availableLeaders);
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

    try {
      setLoading(true);

      if (userType === 'admin') {
        // Use admin service
        if (selectedTasks.length === 1) {
          await adminService.reassignTaskToUser(
            selectedTasks[0].id,
            selectedAssignee,
            reason
          );
          toast.success('Task reassigned successfully');
        } else {
          const taskIds = selectedTasks.map(task => task.id);
          const result = await adminService.bulkReassignTasksToUser(
            taskIds,
            selectedAssignee,
            reason
          );
          toast.success(`${result.reassigned_count} tasks reassigned successfully`);
        }
      } else if (selectedTasks.length === 1) {
        // Use group leader service - single task
        await groupLeadService.reassignTask(
          selectedTasks[0].id,
          selectedAssignee,
          reason
        );
        toast.success('Task reassigned successfully');
      } else {
        // Use group leader service - multiple tasks
        const taskIds = selectedTasks.map(task => task.id);
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
      toast.error(error.response?.data?.message ?? 'Failed to reassign tasks');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedLeader = groupLeaders.find(leader => leader.id === selectedAssignee);
  const selectedTasksCount = selectedTasks.length;
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
                <SearchableDropdown
                  options={groupLeaders}
                  value={selectedAssignee ?? undefined}
                  onChange={(value) => setSelectedAssignee(value ?? null)}
                  placeholder="Select a group leader..."
                  required={true}
                  disabled={loading}
                  maxDisplayItems={6}
                />
              )}
              {groupLeaders.length === 0 && !fetchingLeaders && (
                <p className="text-sm text-muted-foreground mt-1">
                  No other group leaders available for reassignment
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
                disabled={loading || !selectedAssignee || !reason.trim() || groupLeaders.length === 0}
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
