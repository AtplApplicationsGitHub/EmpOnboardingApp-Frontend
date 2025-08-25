"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Pencil,
  Download,
  Upload,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Clock,
} from "lucide-react";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import { Employee } from "../../types";
import { adminService } from "../../services/api";
import SearchableDropdown from "../../components/SearchableDropdown";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const formatDateForInput = (dateString: string | undefined | null) => {
  // If the date is null, undefined, or an empty string, return an empty string.
  if (!dateString) {
    return "";
  }

  // If the date is already in YYYY-MM-DD format, return it directly
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  // Try to create a Date object
  const date = new Date(dateString);

  // Check if the date object is valid. isNaN() is the standard way to check for a valid date.
  if (isNaN(date.getTime())) {
    return ""; // Return an empty string if the date is invalid
  }

  // Get the year, month, and day as separate values
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1
  const day = date.getDate().toString().padStart(2, "0");

  // Return the new date in YYYY-MM-DD format
  return `${year}-${month}-${day}`;
};

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    date: "",
    department: "",
    role: "",
    level: "L1",
    totalExperience: "0",
    pastOrganization: "",
    labAllocation: "",
    complianceDay: "",
    email: "",
  });

  //Arrays for dropdown
  const levelOptions = [
    { id: 1, key: "L1", value: "L1" },
    { id: 2, key: "L2", value: "L2" },
    { id: 3, key: "L3", value: "L3" },
    { id: 4, key: "L4", value: "L4" },
  ];

  const labOptions = [
    { id: 101, key: "Lab1", value: "Lab1" },
    { id: 102, key: "Lab2", value: "Lab2" },
  ];
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
      console.log("Fetched employees after update:", data.commonListDto);
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
      toast.error("Please fill in Candidate Name");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newEmployee.email && !emailRegex.test(newEmployee.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      await adminService.createEmployee({
        name: newEmployee.name,
        date: newEmployee.date || new Date().toISOString().split("T")[0],
        department: newEmployee.department || "General",
        role: newEmployee.role || "Employee",
        level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
        totalExperience: newEmployee.totalExperience || "0",
        pastOrganization: newEmployee.pastOrganization || "N/A",
        labAllocation: newEmployee.labAllocation || "N/A",
        complianceDay: newEmployee.complianceDay || "",
        email: newEmployee.email || "N/A",
      });

      toast.success("Employee added successfully");

      // Reset the form
      setNewEmployee({
        name: "",
        date: "",
        department: "",
        role: "",
        level: "L1",
        totalExperience: "0",
        pastOrganization: "",
        labAllocation: "",
        complianceDay: "",
        email: "",
      });
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add employee");
    }
  };

  //edit
  const handleEditEmployee = async (employeeId: number) => {
    if (!employeeId) return;

    try {
      const emp: Employee = await adminService.findByEmployee(employeeId);
      console.log("Received from backend:", emp);

      // const formattedDate = new Date(emp.date).toISOString().split('T')[0];
      const formattedDate = formatDateForInput(emp.date);
      console.log("Formatted date:", formattedDate);

      // Prefill the modal form with fetched employee data
      setNewEmployee({
        name: emp.name,
        date: formattedDate,
        department: emp.department,
        role: emp.role,
        level: emp.level,
        totalExperience: emp.totalExperience,
        pastOrganization: emp.pastOrganization,
        labAllocation: emp.labAllocation,
        complianceDay: emp.complianceDay,
        email: emp.email,
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
      toast.error("Candidate Name is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newEmployee.email && !emailRegex.test(newEmployee.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      const updatePayload = {
        id: selectedEmployeeId,
        name: newEmployee.name,
        department: newEmployee.department,
        role: newEmployee.role,
        date: newEmployee.date || undefined,
        level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
        totalExperience: newEmployee.totalExperience,
        pastOrganization: newEmployee.pastOrganization,
        labAllocation: newEmployee.labAllocation,
        complianceDay: newEmployee.complianceDay,
        email: newEmployee.email,
      };

      console.log("Sending to backend:", updatePayload);
      await adminService.updateEmployee(updatePayload as Employee);

      toast.success("Employee updated successfully!");

      // Reset state and close the modal
      setNewEmployee({
        name: "",
        date: "",
        department: "",
        role: "",
        level: "L1",
        totalExperience: "0",
        pastOrganization: "",
        labAllocation: "",
        complianceDay: "",
        email: "",
      });
      setShowAddModal(false);
      setEditMode(false);
      setSelectedEmployeeId(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update employee.");
    }
  };

  //delete
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      await adminService.deleteEmployee(employeeToDelete.id);
      toast.success("Employee deleted successfully!");
      fetchEmployees();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete employee.");
    }
  };

  //download template

  const base64ToBlob = (b64: string, mime: string) => {
    const byteString = atob(b64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mime });
  };

  const handleImportFromExcel = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    if (!/\.(xlsx|xls)$/i.test(importFile.name)) {
      toast.error("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    try {
      setImportLoading(true);
      setImportErrors([]);
      debugger;
      const result = await adminService.importEmployees(importFile);
      const errorCount: number = result.errorCount ?? 0;
      const rawErrors = result.errors ?? [];
      const normalizedErrors: string[] = Array.isArray(rawErrors)
        ? rawErrors.map((e: any) =>
            typeof e === "string"
              ? e
              : `Row ${e?.row ?? "?"}: ${e?.message ?? "Unknown error"}`
          )
        : [];
      if (errorCount > 0) {
        setImportErrors(normalizedErrors);
        const preview = normalizedErrors.slice(0, 3).join("; ");
        toast.error(
          `Import reported ${errorCount} error(s). ${preview}${
            normalizedErrors.length > 3 ? "..." : ""
          }`
        );
      }
      fetchEmployees();
      setImportFile(null);
      setShowImportModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to import employees");
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setProcessing(true);
      const data = await adminService.excelExportEmployee();
      const base64: string = data.pdf;
      if (!base64) throw new Error("No base64 file content in response.");

      const fileName: string =
        data.fileName ?? `AddEmployee_${Date.now()}.xls`;
      const blob = base64ToBlob(
        base64,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message ?? "Failed to download file");
    } finally {
      setProcessing(false);
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
      if (page > 3) pages.push(0, "...");
      for (
        let i = Math.max(1, page - 2);
        i <= Math.min(totalPages - 2, page + 2);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 4) pages.push("...", totalPages - 1);
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
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
                onClick={handleDownloadTemplate}
              >
                <Download size={14} className="mr-1" />
                <span className="hidden sm:inline">Download Template</span>
                <span className="sm:hidden">Download</span>
              </Button>
              <Button
                onClick={() => setShowImportModal(true)}
                disabled={processing}
                variant="outline"
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
              >
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
                    name: "",
                    date: "",
                    department: "",
                    role: "",
                    level: "L1",
                    totalExperience: "0",
                    pastOrganization: "",
                    labAllocation: "",
                    complianceDay: "",
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
        <CardContent className="p-0 space-y-4 ">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableCell></TableCell>
                <TableCell className="w-44">Name</TableCell>
                <TableCell className="w-40">Email</TableCell>
                <TableCell className="w-24">DOJ</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Lab</TableCell>
                <TableCell>Compliance Day</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No employees found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="flex gap-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditEmployee(emp.id)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        disabled={!emp.deleteFlag}
                        onClick={() => {
                          setEmployeeToDelete(emp);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap overflow-hidden w-44">
                      {emp.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {emp.email}
                    </TableCell>

                    <TableCell className="whitespace-nowrap w-24">
                      {emp.date}
                    </TableCell>
                    <TableCell>{emp.department || "N/A"}</TableCell>
                    <TableCell>{emp.role || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          emp.level === "L1"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : emp.level === "L2"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : emp.level === "L3"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {emp.level || "L1"}
                      </span>
                    </TableCell>
                    <TableCell>{emp.labAllocation || "N/A"}</TableCell>
                    <TableCell className="w-20">
                    {emp.complianceDay ? `Day ${emp.complianceDay}` : "-"}
                    </TableCell>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                  className="p-2"
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="p-2"
                >
                  <ChevronLeft size={16} />
                </Button>
                {generatePageNumbers().map((p, idx) =>
                  p === "..." ? (
                    <span key={idx} className="px-3 py-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={idx}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(p as number)}
                      className="min-w-[40px]"
                    >
                      {(p as number) + 1}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages - 1}
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={page === totalPages - 1}
                  className="p-2"
                >
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
              <CardTitle>
                {editMode ? "Edit User" : "Create New User"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    value={(newEmployee.name as string) ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={newEmployee.date ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newEmployee.department ?? ""}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., Engineering, HR, Sales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <input
                    type="text"
                    value={newEmployee.role ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Level *
                  </label>
                  <SearchableDropdown
                    options={levelOptions}
                    value={
                      levelOptions.find(
                        (option) => option.value === newEmployee.level
                      )?.id
                    }
                    onChange={(id) => {
                      const selectedLevel = levelOptions.find(
                        (option) => option.id === id
                      )?.value;
                      setNewEmployee({
                        ...newEmployee,
                        level: selectedLevel as "L1" | "L2" | "L3" | "L4",
                      });
                    }}
                    displayFullValue={false}
                    isEmployeePage={true}
                    disabled={editMode}  
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Total Experience (years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newEmployee.totalExperience ?? "0"}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        totalExperience: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Past Organization
                  </label>
                  <input
                    type="text"
                    value={newEmployee.pastOrganization ?? ""}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        pastOrganization: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Previous company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Lab Allocation
                  </label>
                  <SearchableDropdown
                    options={labOptions}
                    value={
                      labOptions.find(
                        (option) => option.value === newEmployee.labAllocation
                      )?.id
                    }
                    onChange={(id) => {
                      const selectedLab = labOptions.find(
                        (option) => option.id === id
                      )?.value;
                      setNewEmployee({
                        ...newEmployee,
                        labAllocation: selectedLab as "Lab1" | "Lab2",
                      });
                    }}
                    placeholder="Select Lab"
                    displayFullValue={false}
                    isEmployeePage={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Compliance Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newEmployee.complianceDay ?? "3"}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        complianceDay: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Number of compliance days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                   <Input
    type="email"
    value={newEmployee.email ?? ""}
    onChange={(e) =>
      setNewEmployee({ ...newEmployee, email: e.target.value })
    }
    className="w-full px-3 py-2 border rounded-md bg-background"
    placeholder="Enter email address"
    disabled={editMode}
  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={editMode ? handleUpdateEmployee : handleAddEmployee}
                  className="flex-1"
                  disabled={!newEmployee.name || !newEmployee.email || !newEmployee.level}
                >
                  {editMode ? "Update User" : "Create User"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewEmployee({
                      name: "",
                      date: "",
                      department: "",
                      role: "",
                      level: "L1",
                      totalExperience: "0",
                      pastOrganization: "",
                      labAllocation: "",
                      complianceDay: "3",
                      email: "",
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
      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete the employee{" "}
                <span className="font-semibold">{employeeToDelete.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteEmployee}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEmployeeToDelete(null);
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
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Expected Format:
                </h4>
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

export default EmployeesPage;
