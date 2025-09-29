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
  Archive,
} from "lucide-react";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import { Employee, DropDownDTO } from "../../types";
import { adminService } from "../../services/api";
import SearchableDropdown from "../../components/SearchableDropdown";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const formatDateForInput = (dateString: string | undefined | null) => {
  if (!dateString) {
    return "";
  }
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
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
  const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
  const [groupOptions, setGroupOptions] = useState<DropDownDTO[]>([]);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [originalGroupValue, setOriginalGroupValue] = useState<string>("");
  const [groupChanged, setGroupChanged] = useState(false);
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
    group: '',
  });

  // Fetch lookup data for Levels Labs and Departments
  const fetchLookupData = async () => {
    try {
      const levels = await adminService.getLookupItems("Level");
      setLevelOptions(levels);

      const departments = await adminService.getLookupItems("Department");
      setDepartmentOptions(departments);
    } catch (error) {
      // console.error("Failed to fetch lookup items:", error);
      toast.error("Failed to load dropdown options.");
    }
  };

  // Fetch labs based on selected department
  const fetchLabsByDepartment = async (departmentValue: string) => {
    if (!departmentValue) {
      setLabOptions([]);
      return;
    }

    try {
      const labs = await adminService.getLab(departmentValue);
      console.log("Fetched labs ", labs); // Debug log
      const labDropdownOptions: DropDownDTO[] = labs.map((lab, index) => ({
        id: index + 1,
        value: lab as string,
        key: lab as string
      }));
      setLabOptions(labDropdownOptions);
    } catch (error) {
      toast.error("Failed to load lab options for selected department.");
      setLabOptions([]);
    }
  };

  // Fetch groups based on selected level and employee id
  const fetchEmployeeGroups = async (level: string, employeeId: number) => {
    if (!level || !employeeId) {
      setGroupOptions([]);
      return;
    }

    try {
      const groups = await adminService.getEmployeeGroup(level, employeeId);
      // console.log("Fetched groups:", groups); // Debug log


      // Transform the response into DropDownDTO format
      const groupDropdownOptions: DropDownDTO[] = groups.map((group: any, index: number) => ({
        id: group.id || index + 1,
        value: group.name || group.key || group.value || "Unknown",
        key: group.key || group.name || group.value || `group-${index}`
      }));


      setGroupOptions(groupDropdownOptions);
      // console.log("DEBUG - Group options set to:", groupDropdownOptions);
    } catch (error) {
      console.error("Failed to fetch employee groups:", error);
      toast.error("Failed to load group options.");
      setGroupOptions([]);
    }
  };

  useEffect(() => {
    fetchLookupData();
  }, []);

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
      console.log("Fetched employees:", data); // Debug log
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

    try {
      await adminService.createEmployee({
        name: newEmployee.name,
        date: newEmployee.date || new Date().toISOString().split("T")[0],
        department: newEmployee.department || "General",
        role: newEmployee.role || "Employee",
        level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
        totalExperience: newEmployee.totalExperience || "0",
        pastOrganization: newEmployee.pastOrganization || "N/A",
        labAllocation: newEmployee.labAllocation || "",
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
        group: "",
      });
      setShowAddModal(false);
      setEmailExists(false);
      setCheckingEmail(false);
      setLabOptions([]);
      setGroupOptions([]);
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
      console.log("Fetched employee:", emp); // Debug log

      const formattedDate = formatDateForInput(emp.date);

      setOriginalGroupValue(emp.group || "");
      setGroupChanged(false);
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
        group: emp.group || "",
      });


      if (emp.department) {
        await fetchLabsByDepartment(emp.department);
      }

      // Fetch groups for the employee's level and ID
      if (emp.level && employeeId) {
        await fetchEmployeeGroups(emp.level, employeeId);
      }

      setEditMode(true);
      setSelectedEmployeeId(employeeId);
      setShowAddModal(true);
      setEmailExists(false);
      setCheckingEmail(false);
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
        group: newEmployee.group,
      };

      await adminService.updateEmployee(updatePayload as Employee);

      if (groupChanged && newEmployee.group && newEmployee.group !== originalGroupValue) {
        try {
          // Find the group ID from the selected group value
          const selectedGroupOption = groupOptions.find(
            option => option.value === newEmployee.group
          );

          //  console.log("DEBUG - All available group options:", groupOptions);
          //     console.log("DEBUG - Looking for group:", newEmployee.group);
          //     console.log("DEBUG - Selected Group Option:", selectedGroupOption);
          //   console.log("empid", Number(selectedEmployeeId)) // Debug log


          if (selectedGroupOption) {
            await adminService.assignGroupsToEmployee({
              groupId: [selectedGroupOption.id],
              employeeId: Number(selectedEmployeeId)
            });
            toast.success("Employee updated and group assigned successfully!");
          } else {
            toast.success("Employee updated successfully!");
            toast.error("Group assignment failed - group not found.");
          }
        } catch (groupError: any) {
          console.error("Group assignment failed:", groupError);
          console.log("DEBUG - Full error details:", groupError.response?.data);
          toast.success("Employee updated successfully!");
        }
      }


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
        group: "",
      });
      setShowAddModal(false);
      setEditMode(false);
      setSelectedEmployeeId(null);
      setEmailExists(false);
      setCheckingEmail(false);
      setLabOptions([]);
      setGroupOptions([]);
      setOriginalGroupValue("");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update employee.");
    }
  };

  const handleEmailChange = async (value: string) => {
    setNewEmployee({ ...newEmployee, email: value });
    if (!value || editMode) return;

    setCheckingEmail(true);
    try {
      const res = await adminService.isEmployeeEmailExists(value);
      setEmailExists(res);
    } catch (error) {
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleDepartmentChange = (value: number | number[] | undefined) => {
    const departmentId = Array.isArray(value) ? value[0] : value;

    const selectedDept = departmentOptions.find(
      (option) => option.id === departmentId
    );

    setNewEmployee({
      ...newEmployee,
      department: selectedDept?.value || "",
      labAllocation: "", // Reset lab allocation when department changes
    });

    if (selectedDept?.value) {
      fetchLabsByDepartment(selectedDept.value);
    } else {
      setLabOptions([]); // Reset lab options
    }
  };

  // Handle group change
  const handleGroupChange = (id: number | number[] | undefined) => {
    const selectedGroup = groupOptions.find(option => option.id === id);
    const newGroupValue = selectedGroup?.value || "";

    setNewEmployee({
      ...newEmployee,
      group: newGroupValue
    });

    // Track if group was actually changed from original value
    setGroupChanged(newGroupValue !== originalGroupValue && newGroupValue !== "");
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

    const archiveEmployee = async (id:number) => {
    try {
      console.log("Archiving employee with id:", id); // Debug log
      await adminService.achiveEmployees(id);
      toast.success("Employee Archival successfully!");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive employee.");
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
          `Import reported ${errorCount} error(s). ${preview}${normalizedErrors.length > 3 ? "..." : ""
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

      const fileName: string = data.fileName ?? `AddEmployee_${Date.now()}.xlsx`;
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
    <div className="p-6 max-w-9xl mx-auto space-y-6">
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
              {/* <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap flex-shrink-0"
                onClick={handleDownloadTemplate}
              >
                <Download size={14} className="mr-1" />
                <span className="hidden sm:inline">Download Template</span>
                <span className="sm:hidden">Download</span>
              </Button> */}
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
                  setEmailExists(false);
                  setCheckingEmail(false);
                  setLabOptions([]);
                  setGroupOptions([]);
                  setOriginalGroupValue("");
                  setGroupChanged(false);
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
                    group: "",
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
                <TableCell className="w-28"></TableCell>
                <TableCell className="w-40">Name</TableCell>
                <TableCell className="w-44">Email</TableCell>
                <TableCell className="w-24">DOJ</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Lab</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Role</TableCell>
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
                    <TableCell className="w-28 flex items-center justify-start gap-0.3">
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
                        onClick={() => archiveEmployee(emp.id)}
                      >
                        <Archive size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        // disabled={!emp.deleteFlag}
                        onClick={() => {
                          setEmployeeToDelete(emp);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap overflow-hidden w-40">
                      {emp.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis w-44">
                      {emp.email}
                    </TableCell>

                    <TableCell className="whitespace-nowrap w-24">
                      {emp.date}
                    </TableCell>
                    <TableCell>{emp.department || "N/A"}</TableCell>
                    <TableCell>{emp.labAllocation || ""}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${emp.level === "L1"
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
                    <TableCell>{emp.role || "N/A"}</TableCell>

                    <TableCell>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-[90vh] flex flex-col">
            <Card className="flex flex-col h-full bg-background">
              {/* Fixed Header */}
              <CardHeader className="flex-shrink-0 border-b p-5">
                <CardTitle className="text-2xl">
                  {editMode ? "Edit User" : "Create User"}
                </CardTitle>
              </CardHeader>

              {/* Form Content */}
              <div className={`flex-1 ${editMode ? "overflow-y-auto" : ""}`}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 mt-3 md:grid-cols-2 gap-4">
                    {/* Candidate Name */}
                    <div>
                      <label className="block text-sm font-medium mb-1 ">
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

                    {/* Date of Joining */}
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

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Department *
                      </label>
                      <SearchableDropdown
                        options={departmentOptions}
                        value={
                          departmentOptions.find(
                            (option) => option.value === newEmployee.department
                          )?.id
                        }
                        onChange={handleDepartmentChange}
                        placeholder="Select Department"
                        displayFullValue={false}
                        isEmployeePage={true}
                        disabled={editMode}
                      />
                    </div>

                    {/* Lab Allocation */}
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
                            labAllocation: selectedLab || "",
                          });
                        }}
                        placeholder={
                          !newEmployee.department
                            ? "Select Department First"
                            : labOptions.length === 0
                              ? "No labs available"
                              : "Select Lab"
                        }
                        displayFullValue={false}
                        isEmployeePage={true}
                        disabled={!newEmployee.department || labOptions.length === 0}
                      />
                    </div>

                    {/* Level */}
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

                    {/* Total Experience */}
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

                    {/* Past Organization */}
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

                    {/* Role */}
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

                    {/* Compliance Day */}
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

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <Input
                        type="email"
                        value={newEmployee.email ?? ""}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        placeholder="Enter email address"
                        disabled={editMode}
                      />
                      {!editMode && emailExists && (
                        <p className="text-red-500 text-sm mt-1">
                          Email already exists
                        </p>
                      )}
                    </div>

                    {/* Group - only for edit mode */}
                    {editMode && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Select Group
                        </label>
                        <SearchableDropdown
                          options={groupOptions}
                          value={
                            groupOptions.find(
                              (option) => option.value === newEmployee.group
                            )?.id
                          }
                          onChange={handleGroupChange}
                          placeholder={
                            !newEmployee.level || !selectedEmployeeId
                              ? "Level and Employee ID required"
                              : groupOptions.length === 0
                                ? "No groups available"
                                : "Select Group"
                          }
                          displayFullValue={false}
                          isEmployeePage={true}
                          disabled={
                            !newEmployee.level ||
                            !selectedEmployeeId ||
                            groupOptions.length === 0
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Sticky Footer */}
              <div className="flex-shrink-0 border-t bg-background p-6 flex gap-3">
                <Button
                  onClick={editMode ? handleUpdateEmployee : handleAddEmployee}
                  className="flex-1"
                  disabled={
                    !newEmployee.name ||
                    !newEmployee.name.trim() ||
                    !newEmployee.level ||
                    !newEmployee.department ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email || "") ||
                    emailExists ||
                    checkingEmail
                  }
                >
                  {editMode ? "Update User" : "Create User"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEmailExists(false);
                    setCheckingEmail(false);
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
                      group: "",
                    });
                    setSelectedEmployeeId(null);
                    setEditMode(false);
                    setGroupOptions([]);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
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
