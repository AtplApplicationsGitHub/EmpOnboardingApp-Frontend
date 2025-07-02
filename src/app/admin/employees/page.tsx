'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Group, Employee, QueueEmployee, EmployeeProcessingResponse, EmployeeImportResponse } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import Button from '../../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Plus, Play, Users, CheckCircle, AlertCircle, Clock, Trash2, Download, Upload, 
         ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeProcessingPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [queueEmployees, setQueueEmployees] = useState<QueueEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastProcessingResult, setLastProcessingResult] = useState<EmployeeProcessingResponse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [newEmployee, setNewEmployee] = useState<Partial<QueueEmployee>>({
    sr_no: 0,
    candidate_name: '',
    doj: '',
    department: '',
    role: '',
    level: 'L1',
    total_experience: 0,
    past_organization: '',
    lab_allocation: '',
    compliance_day: 3
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const groupsData = await adminService.getGroups();
      setGroups(groupsData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    if (!newEmployee.candidate_name) {
      toast.error('Please fill in Candidate Name');
      return;
    }

    const employee: QueueEmployee = {
      sr_no: queueEmployees.length + 1,
      candidate_name: newEmployee.candidate_name as string,
      doj: newEmployee.doj || new Date().toISOString().split('T')[0],
      department: newEmployee.department || 'General',
      role: newEmployee.role || 'Employee',
      level: newEmployee.level as 'L1' | 'L2' | 'L3' | 'L4',
      total_experience: newEmployee.total_experience || 0,
      past_organization: newEmployee.past_organization || 'N/A',
      lab_allocation: newEmployee.lab_allocation || 'N/A',
      compliance_day: newEmployee.compliance_day || 3
    };

    setQueueEmployees([...queueEmployees, employee]);
    setNewEmployee({
      sr_no: 0,
      candidate_name: '',
      doj: '',
      department: '',
      role: '',
      level: 'L1',
      total_experience: 0,
      past_organization: '',
      lab_allocation: '',
      compliance_day: 3
    });
    setShowAddModal(false);
    toast.success('Employee added to processing queue');
  };

  const handleRemoveEmployee = (index: number) => {
    const actualIndex = (currentPage - 1) * itemsPerPage + index;
    const updated = queueEmployees.filter((_, i) => i !== actualIndex);
    
    // Renumber the remaining employees
    const renumberedEmployees = updated.map((emp, i) => ({
      ...emp,
      sr_no: i + 1
    }));
    
    setQueueEmployees(renumberedEmployees);
    toast.success('Employee removed from queue');
  };

  const handleProcessQueue = async () => {
    if (queueEmployees.length === 0) {
      toast.error('No employees in queue to process');
      return;
    }

    try {
      setProcessing(true);
      
      // Convert QueueEmployee to Employee format for API
      const employeesToProcess: Employee[] = queueEmployees.map(qe => ({
        employee_id: qe.candidate_name.toLowerCase().replace(/\s+/g, '.'),
        employee_name: qe.candidate_name,
        employee_level: qe.level,
        group_id: 1, // Default group - could be made configurable
      }));

      const result = await adminService.processEmployeeQueue(employeesToProcess);
      setLastProcessingResult(result);
      setQueueEmployees([]); // Clear the queue after successful processing
      toast.success(`Successfully processed ${result.processed_employees.length} employees!`);
    } catch (err: any) {
      console.error('Processing error:', err);
      toast.error(err.response?.data?.message || 'Failed to process employee queue');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearAllTasks = async () => {
    if (!confirm('Are you sure you want to clear ALL existing tasks? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      const result = await adminService.clearAllTasks();
      toast.success(`Successfully cleared ${result.deleted_count} tasks`);
      setLastProcessingResult(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to clear tasks');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setProcessing(true);
      const blob = await adminService.downloadEmployeeTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Employee_Processing_Template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to download template');
    } finally {
      setProcessing(false);
    }
  };

  const handleImportFromExcel = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setImportLoading(true);
      const result: EmployeeImportResponse = await adminService.importEmployeeTemplate(importFile);
      
      // Convert processed employees to QueueEmployee format for the queue
      const queueEmployeesFromResult: QueueEmployee[] = result.processed_employees.map((pe, index) => ({
        sr_no: queueEmployees.length + index + 1,
        candidate_name: pe.employee_name || '',
        doj: pe.doj || '',
        department: pe.department || '',
        role: pe.role || '',
        level: (pe.employee_level as 'L1' | 'L2' | 'L3' | 'L4') || 'L1',
        total_experience: pe.total_experience ? parseFloat(pe.total_experience) : 0,
        past_organization: pe.past_organization || '',
        lab_allocation: pe.lab_allocation || '',
        compliance_day: pe.compliance_day ? parseInt(pe.compliance_day) : 3
      }));
      
      setQueueEmployees([...queueEmployees, ...queueEmployeesFromResult]);
      setImportFile(null);
      setShowImportModal(false);
      toast.success(`Successfully imported ${result.processed_employees.length} employees to queue`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ?? 'Failed to import template';
      const errors = err.response?.data?.errors;
      
      if (errors && Array.isArray(errors)) {
        // Show first few errors in toast, rest in console
        const displayErrors = errors.slice(0, 3).join('; ');
        toast.error(`Import errors: ${displayErrors}${errors.length > 3 ? '...' : ''}`);
        console.error('All import errors:', errors);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleCellEdit = (rowIndex: number, field: string, value: any) => {
    const actualIndex = (currentPage - 1) * itemsPerPage + rowIndex;
    const updatedEmployees = [...queueEmployees];
    updatedEmployees[actualIndex] = {
      ...updatedEmployees[actualIndex],
      [field]: value
    };
    setQueueEmployees(updatedEmployees);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getGroupName = (groupId: number) => {
    return groups.find((g: Group) => g.id === groupId)?.name ?? 'Unknown Group';
  };

  // Pagination calculations
  const totalPages = Math.ceil(queueEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, queueEmployees.length);
  const currentEmployees = queueEmployees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setEditingCell(null); // Clear any editing state when changing pages
  };

  const handlePerPageChange = (newPerPage: number) => {
    setItemsPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page
    setEditingCell(null); // Clear any editing state
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">Employee Processing</h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Streamline your employee onboarding by adding employees to the processing queue and automatically assigning tasks across all groups based on their levels.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-0 overflow-x-auto">
              <Button
                onClick={handleClearAllTasks}
                disabled={processing}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 whitespace-nowrap flex-shrink-0"
              >
                <Trash2 size={14} className="mr-1" />
                <span className="hidden sm:inline">Clear All Tasks</span>
                <span className="sm:hidden">Clear</span>
              </Button>
              
              <Button
                onClick={handleDownloadTemplate}
                disabled={processing}
                variant="outline"
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
              >
                <Download size={14} className="mr-1" />
                <span className="hidden sm:inline">Download Template</span>
                <span className="sm:hidden">Download</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Processing Queue Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Processing Queue
                <span className="text-sm font-normal text-muted-foreground">
                  ({queueEmployees.length} employee{queueEmployees.length !== 1 ? 's' : ''})
                </span>
              </CardTitle>
              
              {/* Per-page selector */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                  className="px-2 py-1 rounded border border-border bg-background"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-muted-foreground">per page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {queueEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No employees in queue</h3>
                <p className="text-muted-foreground mb-6">
                  Add employees manually or import from Excel to get started.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus size={16} className="mr-2" />
                    Add Employee
                  </Button>
                  <Button variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload size={16} className="mr-2" />
                    Import from Excel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Sr No</TableHead>
                        <TableHead className="min-w-[150px]">Candidate Name</TableHead>
                        <TableHead className="min-w-[120px]">DOJ</TableHead>
                        <TableHead className="min-w-[120px]">Department</TableHead>
                        <TableHead className="min-w-[120px]">Role</TableHead>
                        <TableHead className="w-20">Level</TableHead>
                        <TableHead className="w-24">Experience</TableHead>
                        <TableHead className="min-w-[150px]">Past Organization</TableHead>
                        <TableHead className="min-w-[120px]">Lab Allocation</TableHead>
                        <TableHead className="w-24">Compliance Day</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentEmployees.map((employee, index) => (
                        <TableRow key={`${employee.sr_no}-${index}`}>
                          <TableCell className="font-medium">{employee.sr_no}</TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'candidate_name' ? (
                              <input
                                type="text"
                                value={employee.candidate_name}
                                onChange={(e) => handleCellEdit(index, 'candidate_name', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'candidate_name'})}
                              >
                                {employee.candidate_name}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'doj' ? (
                              <input
                                type="date"
                                value={employee.doj}
                                onChange={(e) => handleCellEdit(index, 'doj', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'doj'})}
                              >
                                {formatDate(employee.doj)}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'department' ? (
                              <input
                                type="text"
                                value={employee.department}
                                onChange={(e) => handleCellEdit(index, 'department', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'department'})}
                              >
                                {employee.department}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'role' ? (
                              <input
                                type="text"
                                value={employee.role}
                                onChange={(e) => handleCellEdit(index, 'role', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'role'})}
                              >
                                {employee.role}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'level' ? (
                              <select
                                value={employee.level}
                                onChange={(e) => handleCellEdit(index, 'level', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              >
                                <option value="L1">L1</option>
                                <option value="L2">L2</option>
                                <option value="L3">L3</option>
                                <option value="L4">L4</option>
                              </select>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'level'})}
                              >
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  employee.level === 'L1' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  employee.level === 'L2' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  employee.level === 'L3' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {employee.level}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'total_experience' ? (
                              <input
                                type="number"
                                min="0"
                                value={employee.total_experience}
                                onChange={(e) => handleCellEdit(index, 'total_experience', Number(e.target.value))}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'total_experience'})}
                              >
                                {employee.total_experience} yr{employee.total_experience !== 1 ? 's' : ''}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'past_organization' ? (
                              <input
                                type="text"
                                value={employee.past_organization}
                                onChange={(e) => handleCellEdit(index, 'past_organization', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'past_organization'})}
                              >
                                {employee.past_organization}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'lab_allocation' ? (
                              <input
                                type="text"
                                value={employee.lab_allocation}
                                onChange={(e) => handleCellEdit(index, 'lab_allocation', e.target.value)}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'lab_allocation'})}
                              >
                                {employee.lab_allocation}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingCell?.row === index && editingCell?.field === 'compliance_day' ? (
                              <input
                                type="number"
                                min="1"
                                value={employee.compliance_day}
                                onChange={(e) => handleCellEdit(index, 'compliance_day', Number(e.target.value))}
                                onBlur={() => setEditingCell(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingCell(null)}
                                className="w-full px-2 py-1 text-sm border rounded bg-background"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                onClick={() => setEditingCell({row: index, field: 'compliance_day'})}
                              >
                                Day {employee.compliance_day}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEmployee(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {endIndex} of {queueEmployees.length} employees
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft size={16} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      
                      <span className="text-sm px-3 py-1">
                        {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Process Queue Button */}
                <div className="flex justify-center mt-6 pt-4 border-t border-border">
                  <Button
                    onClick={handleProcessQueue}
                    disabled={processing || queueEmployees.length === 0}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  >
                    {processing ? (
                      <>
                        <Clock size={20} className="mr-2 animate-spin" />
                        Processing Queue...
                      </>
                    ) : (
                      <>
                        <Play size={20} className="mr-2" />
                        Process Queue ({queueEmployees.length})
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Processing Results */}
        {lastProcessingResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastProcessingResult.processed_employees.length > 0 ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-600" />
                )}
                Processing Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Processed: {lastProcessingResult.processed_employees.length}</span>
                  </div>
                  {lastProcessingResult.errors && lastProcessingResult.errors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600" />
                      <span>Errors: {lastProcessingResult.errors.length}</span>
                    </div>
                  )}
                </div>

                {lastProcessingResult.processed_employees.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Successfully Processed:</h4>
                    <div className="grid gap-2">
                      {lastProcessingResult.processed_employees.map((emp, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          <CheckCircle size={14} className="text-green-600" />
                          <span>{emp.employee_name} ({emp.employee_level})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lastProcessingResult.errors && lastProcessingResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Errors:</h4>
                    <div className="grid gap-2">
                      {lastProcessingResult.errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          <AlertCircle size={14} className="text-red-600" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Employee to Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    value={newEmployee.candidate_name}
                    onChange={(e) => setNewEmployee({...newEmployee, candidate_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={newEmployee.doj}
                    onChange={(e) => setNewEmployee({...newEmployee, doj: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., Engineering, HR, Sales"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <select
                    value={newEmployee.level}
                    onChange={(e) => setNewEmployee({...newEmployee, level: e.target.value as 'L1' | 'L2' | 'L3' | 'L4'})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="L4">L4</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Total Experience (years)</label>
                  <input
                    type="number"
                    min="0"
                    value={newEmployee.total_experience}
                    onChange={(e) => setNewEmployee({...newEmployee, total_experience: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Past Organization</label>
                  <input
                    type="text"
                    value={newEmployee.past_organization}
                    onChange={(e) => setNewEmployee({...newEmployee, past_organization: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Previous company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Lab Allocation</label>
                  <input
                    type="text"
                    value={newEmployee.lab_allocation}
                    onChange={(e) => setNewEmployee({...newEmployee, lab_allocation: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Lab or workspace assignment"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Compliance Day</label>
                  <input
                    type="number"
                    min="1"
                    value={newEmployee.compliance_day}
                    onChange={(e) => setNewEmployee({...newEmployee, compliance_day: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddEmployee} className="flex-1">
                  Add to Queue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmployee({
                      sr_no: 0,
                      candidate_name: '',
                      doj: '',
                      department: '',
                      role: '',
                      level: 'L1',
                      total_experience: 0,
                      past_organization: '',
                      lab_allocation: '',
                      compliance_day: 3
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Import from Excel</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Excel File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Expected Format:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Sr No, Candidate Name, DOJ, Department</li>
                  <li>• Role, Level, Total Experience, Past Organization</li>
                  <li>• Lab Allocation, Compliance Day</li>
                </ul>
              </div>
            </CardContent>
            
            {/* Action Buttons - Fixed at bottom */}
            <div className="p-6 pt-4 border-t border-border bg-card flex-shrink-0">
              <div className="flex gap-3">
                <Button
                  onClick={handleImportFromExcel}
                  disabled={!importFile || importLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                >
                  {importLoading ? (
                    <>
                      <Clock size={16} className="animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Import Employees
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeProcessingPage;