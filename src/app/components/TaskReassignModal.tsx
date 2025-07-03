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
  userType?: 'admin' | 'group_lead';
}

const TaskReassignModal: React.FC<TaskReassignModalProps> = ({
  isOpen,
  onClose,
  onReassignSuccess,
  selectedTasks,
  mode,
  userType = 'group_lead'
}) => {
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Async search function for group leads
  const searchGroupLeads = async (searchTerm: string): Promise<User[]> => {
    try {
      // Get current assignee IDs to exclude
      const currentAssigneeIds = new Set(selectedTasks.map(task => task.assignee_id));
      
      if (userType === 'admin') {
        const results = await adminService.searchGroupLeads(searchTerm);
        // Filter out currently assigned group leaders
        return results.filter(leader => !currentAssigneeIds.has(leader.id));
      } else {
        // For group_lead users, get all group leaders and filter locally
        const result = await groupLeadService.getGroupLeaders();
        // Filter out currently assigned group leaders
        const availableLeaders = result.filter(leader => !currentAssigneeIds.has(leader.id));
        
        // Apply search filter
        const filtered = availableLeaders.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filtered;
      }
    } catch (error) {
      console.error('Failed to search group leads:', error);
      return [];
    }
  };

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setSelectedAssignee(null);
    }
  }, [isOpen, selectedTasks]);

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
        await groupLeadService.reassignTask(
          selectedTasks[0].id,
          selectedAssignee,
          reason
        );
        toast.success('Task reassigned successfully');
      } else {
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
              <SearchableDropdown
                enableAsyncSearch={true}
                onSearch={searchGroupLeads}
                value={selectedAssignee ?? undefined}
                onChange={(value) => setSelectedAssignee(value ?? null)}
                placeholder="Type to search for group leaders..."
                required={true}
                disabled={loading}
              />
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
            {selectedAssignee && selectedTasksCount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle size={16} />
                  <span className="font-medium">Assignment Preview</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {selectedTasksCount} question{selectedTasksCount > 1 ? 's' : ''} will be reassigned to the selected user
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
                disabled={loading || !selectedAssignee || !reason.trim()}
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
