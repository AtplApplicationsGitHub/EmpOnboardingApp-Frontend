'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Pencil, Download, Upload, Plus, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2 } from 'lucide-react';
import Button from '../../components/ui/button';
import Input from '../../components/Input';
import { Employee } from '../../types'; 
import { adminService } from '../../services/api';
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 10;

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    date: '',
    department: '',
    role: '',
    level: 'L1',
    totalExperience: '0',
    pastOrganization: '',
    labAllocation: '',
    complianceDay: '3'
  });

  useEffect(() => {
    fetchEmployees();
  }, [searchFilter, page]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: any = { page };
      if (searchFilter && searchFilter.trim() !== "") {
        params.search = searchFilter.trim();
      }
      const data = await adminService.getEmployee(params);
      setEmployees(data.commonListDto || []);
      setTotalElements(data.totalElements || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput);
    setPage(0);
  };

  //create
  const handleAddEmployee = async () => {
    if (!newEmployee.name) {
      toast.error('Please fill in Candidate Name');
      return;
    }

    
    try {
      await adminService.createEmployee({
        name: newEmployee.name,
        date: newEmployee.date || new Date().toISOString().split('T')[0],
        department: newEmployee.department || 'General',
        role: newEmployee.role || 'Employee',
        level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
        totalExperience: newEmployee.totalExperience || '0',
        pastOrganization: newEmployee.pastOrganization || 'N/A',
        labAllocation: newEmployee.labAllocation || 'N/A',
        complianceDay: newEmployee.complianceDay || '3'
      });

      toast.success('Employee added successfully');

      // Reset the form
      setNewEmployee({
        name: '',
        date: '',
        department: '',
        role: '',
        level: 'L1',
        totalExperience: '0',
        pastOrganization: '',
        labAllocation: '',
        complianceDay: '3'
      });
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    }
  };

  //edit
 const handleEditEmployee = async (employeeId: number) => {
  if (!employeeId) return;

  try {
    // Fetch employee data by ID
    const emp: Employee = await adminService.findByEmployee(employeeId);

    console.log(emp)
    const formattedDate = new Date(emp.date).toISOString().split('T')[0];

    // Prefill the modal form with fetched employee data
    setNewEmployee({
      name: emp.name,
      date: emp.date,
      department: emp.department,
      role: emp.role,
      level: emp.level,
      totalExperience: emp.totalExperience,
      pastOrganization: emp.pastOrganization,
      labAllocation: emp.labAllocation,
      complianceDay: emp.complianceDay,
    });

    setEditMode(true);
    setSelectedEmployeeId(employeeId);
    setShowAddModal(true);

  } catch (err: any) {
    toast.error("Failed to load employee data");
  }
};

  //update
 const handleUpdateEmployee = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedEmployeeId) return;
  
  if (!newEmployee.name?.trim()) {
    toast.error('Candidate Name is required.');
    return;
  }

  try {
    
    const updatePayload = {
      id: selectedEmployeeId,
      name: newEmployee.name,
      date: newEmployee.date ? new Date(newEmployee.date).toISOString() : undefined,
      department: newEmployee.department,
      role: newEmployee.role,
      level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
      totalExperience: newEmployee.totalExperience,
      pastOrganization: newEmployee.pastOrganization,
      labAllocation: newEmployee.labAllocation,
      complianceDay: newEmployee.complianceDay,
    };

    await adminService.updateEmployee(updatePayload as Employee);

    toast.success('Employee updated successfully!');
    
    // Reset state and close the modal
    setNewEmployee({
      name: '',
      date: '',
      department: '',
      role: '',
      level: 'L1',
      totalExperience: '0',
      pastOrganization: '',
      labAllocation: '',
      complianceDay: '3'
    });
    setShowAddModal(false);
    setEditMode(false);
    setSelectedEmployeeId(null);
    fetchEmployees();

  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to update employee.');
  }
};

  // Pagination logic
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) setPage(newPage);
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      if (page > 3) pages.push(0, '...');
      for (let i = Math.max(1, page - 2); i <= Math.min(totalPages - 2, page + 2); i++) {
        pages.push(i);
      }
      if (page < totalPages - 4) pages.push('...', totalPages - 1);
      else if (page < totalPages - 3) pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <Input
                  type="text"
                  placeholder="Search employees..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-64"
                />
              </form>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-0">
              <Button variant="outline" size="sm" className="whitespace-nowrap flex-shrink-0">
                <Download size={14} className="mr-1" />
                <span className="hidden sm:inline">Download Template</span>
                <span className="sm:hidden">Download</span>
              </Button>
              <Button variant="outline" size="sm" className="whitespace-nowrap flex-shrink-0">
                <Upload size={14} className="mr-1" />
                <span className="hidden sm:inline">Import from Excel</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
                onClick={() => {
                  setShowAddModal(true);
                  setEditMode(false);
                  setSelectedEmployeeId(null);
                  setNewEmployee({
                    name: '',
                    date: '',
                    department: '',
                    role: '',
                    level: 'L1',
                    totalExperience: '0',
                    pastOrganization: '',
                    labAllocation: '',
                    complianceDay: '3'
                  });
                }}
              >
                <Plus size={14} className="mr-1" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>DOJ</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Total Exp</TableCell>
                <TableCell>Past Org</TableCell>
                <TableCell>Lab Alloc</TableCell>
                <TableCell>Compliance Day</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No employees found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex gap-0.5">
                      <Button size="sm" variant="ghost" onClick={() => handleEditEmployee(emp.id)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500">
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>
                      {new Date(emp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{emp.department || 'N/A'}</TableCell>
                    <TableCell>{emp.role || 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${emp.level === 'L1'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : emp.level === 'L2'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : emp.level === 'L3'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                      >
                       {emp.level || 'L1'}
                      </span>
                    </TableCell>
                     <TableCell>{emp.totalExperience || '0'}</TableCell>
                    <TableCell>{emp.pastOrganization || 'N/A'}</TableCell>
                    <TableCell>{emp.labAllocation || 'N/A'}</TableCell>
                    <TableCell>Day {emp.complianceDay || '3'}</TableCell>
                    <TableCell>{emp.createdTime || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(0)} disabled={page === 0} className="p-2">
                  <ChevronsLeft size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="p-2">
                  <ChevronLeft size={16} />
                </Button>
                {generatePageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span key={idx} className="px-3 py-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={idx}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(p as number)}
                      className="min-w-[40px]"
                    >
                      {(p as number) + 1}
                    </Button>
                  )
                )}
                <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1} className="p-2">
                  <ChevronRight size={16} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages - 1)} disabled={page === totalPages - 1} className="p-2">
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editMode ? 'Edit User' : 'Create New User'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    value={newEmployee.name ?? ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={newEmployee.date ?? ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={newEmployee.department ?? ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., Engineering, HR, Sales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={newEmployee.role ?? ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <select
                    value={newEmployee.level ?? 'L1'}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, level: e.target.value as 'L1' | 'L2' | 'L3' | 'L4' })
                    }
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
                    min={0}
                    value={newEmployee.totalExperience ?? '0'}
                    onChange={(e) => setNewEmployee({ ...newEmployee, totalExperience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Past Organization</label>
                  <input
                    type="text"
                    value={newEmployee.pastOrganization ?? ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, pastOrganization: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Previous company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lab Allocation</label>
                  <input
                    type="text"
                    value={newEmployee.labAllocation ?? ''}
                    onChange={(e) => setNewEmployee({ ...newEmployee, labAllocation: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Lab or workspace assignment"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Compliance Day</label>
                  <input
                    type="number"
                    min={1}
                    value={newEmployee.complianceDay ?? '3'}
                    onChange={(e) => setNewEmployee({ ...newEmployee, complianceDay: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Number of compliance days"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={editMode ? handleUpdateEmployee : handleAddEmployee} className="flex-1">
                  {editMode ? 'Update User' : 'Create User'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmployee({
                      name: '',
                      date: '',
                      department: '',
                      role: '',
                      level: 'L1',
                      totalExperience: '0',
                      pastOrganization: '',
                      labAllocation: '',
                      complianceDay: '3'
                    });
                    setSelectedEmployeeId(null);
                    setEditMode(false);
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
    </div>
  );
};

export default EmployeesPage;