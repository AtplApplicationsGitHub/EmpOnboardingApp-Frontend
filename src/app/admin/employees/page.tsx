"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Edit,
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
  Search,
  MailPlus
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
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );
  const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
  const [labOptions, setLabOptions] = useState<DropDownDTO[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
  const [sbuOptions, setSbuOptions] = useState<DropDownDTO[]>([]);
  const [groupOptions, setGroupOptions] = useState<DropDownDTO[]>([]);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [originalGroupValue, setOriginalGroupValue] = useState<string>("");
  const [groupChanged, setGroupChanged] = useState(false);
   const emailDebounceRef = useRef<number | null>(null);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    date: "",
    departmentId: 0,
    labId: 0,
    role: "",
    level: "L1",
    totalExperience: "0",
    pastOrganization: "",
    complianceDay: "",
    email: "",
    group: '',
  });

  // Fetch lookup data for Levels Labs and Departments
  const fetchLookupData = async () => {
    try {
      const levels = await adminService.getLookupItems("Level");
      setLevelOptions(levels);

      const sbus = await adminService.findAllSbu();
      const transformedSbus = sbus.map(sbu => ({
        ...sbu,
        value: sbu.value || sbu.key
      }));

      setSbuOptions(transformedSbus);
    } catch (error) {
      toast.error("Failed to load dropdown options.");
    }
  };

  const fetchDepartmentBySub = async (subId: number) => {
    if (!subId) {
      setDepartmentOptions([]);
      return;
    }

    try {
      const departments = await adminService.getDepartmentsBySbu(subId);
      const transformedDepartments = departments.map(dept => ({
        ...dept,
        value: dept.value || dept.key
      }));

      setDepartmentOptions(transformedDepartments);
    } catch (error) {
      toast.error("Failed to load lab options for selected department.");
      setLabOptions([]);
    }
  };

  // Fetch labs based on selected department
  const fetchLabsByDepartment = async (departmentId: number) => {
    if (!departmentId) {
      setLabOptions([]);
      return;
    }

    try {
      const labs = await adminService.getDepartmentLabs(departmentId);
      const transformedLabs = labs.map(lab => ({
        ...lab,
        value: lab.value || lab.key
      }));
      setLabOptions(transformedLabs);
    } catch (error) {
      toast.error("Failed to load lab options for selected department.");
      setLabOptions([]);
    }
  };

  // Fetch groups based on selected level and employee id
  const fetchEmployeeGroups = async (level: string, department: string, employeeId: number) => {
    if (!level || !department || !employeeId) {
      setGroupOptions([]);
      return;
    }

    try {
      const groups = await adminService.getEmployeeGroup(level, department, employeeId);

      const groupDropdownOptions: DropDownDTO[] = groups.map((group: any, index: number) => ({
        id: group.id || index + 1,
        value: group.name || group.key || group.value || "Unknown",
        key: group.key || group.name || group.value || `group-${index}`
      }));

      setGroupOptions(groupDropdownOptions);
    } catch (error) {
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
      setIsInitialLoad(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput);
    setPage(0);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name) {
      toast.error("Please fill in Candidate Name");
      return;
    }

    try {
      await adminService.createEmployee({
        name: newEmployee.name,
        date: newEmployee.date || new Date().toISOString().split("T")[0],
        sbuId: newEmployee.sbuId || 0,
        departmentId: newEmployee.departmentId || 0,
        labId: newEmployee.labId || 0,
        role: newEmployee.role || "Employee",
        level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
        totalExperience: newEmployee.totalExperience || "0",
        pastOrganization: newEmployee.pastOrganization || "N/A",
        complianceDay: newEmployee.complianceDay || "",
        email: newEmployee.email || "N/A",
      });

      toast.success("Employee added successfully");

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

  const resendMail = async (employeeId: number) => {
    if (!employeeId) return;

    try {
      const response = await adminService.resendWelcomeMail(employeeId);
      if (response)
        toast.success("Email sent suceessfully");
      else
        toast.error("Failed to send Email");
    } catch (err: any) {
      toast.error("Failed to send Email");
    }
  };

  const handleEditEmployee = async (employeeId: number) => {
    if (!employeeId) return;

    try {
      const emp: Employee = await adminService.findByEmployee(employeeId);
      const formattedDate = formatDateForInput(emp.date);

      setOriginalGroupValue(emp.group || "");
      setGroupChanged(false);

      setNewEmployee({
        name: emp.name,
        date: formattedDate,
        department: emp.department,
        sbuId: emp.sbuId,
        departmentId: emp.departmentId,
        labId: emp.labId,
        role: emp.role,
        level: emp.level,
        totalExperience: emp.totalExperience,
        pastOrganization: emp.pastOrganization,
        labAllocation: emp.labAllocation,
        complianceDay: emp.complianceDay,
        email: emp.email,
        group: emp.group || "",
      });

      if (emp.sbuId) {
        await fetchDepartmentBySub(emp.sbuId);
      }

      if (emp.departmentId) {
        await fetchLabsByDepartment(emp.departmentId);
      }

      if (emp.level && emp.department && employeeId) {
        await fetchEmployeeGroups(emp.level, emp.department, employeeId);
      }

      setEditMode(true);
      setSelectedEmployeeId(employeeId);
      setShowAddModal(true);
      setEmailExists(false);
      setCheckingEmail(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 150);
    } catch (err: any) {
      toast.error("Failed to load employee data");
    }
  };

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
        sbuId: newEmployee.sbuId,
        departmentId: newEmployee.departmentId,
        labId: newEmployee.labId,
        role: newEmployee.role,
        date: newEmployee.date || undefined,
        level: newEmployee.level as "L1" | "L2" | "L3" | "L4",
        totalExperience: newEmployee.totalExperience,
        pastOrganization: newEmployee.pastOrganization,
        complianceDay: newEmployee.complianceDay,
        email: newEmployee.email,
        group: newEmployee.group,
      };

      await adminService.updateEmployee(updatePayload as Employee);

      if (groupChanged && newEmployee.group && newEmployee.group !== originalGroupValue) {
        try {
          const selectedGroupOption = groupOptions.find(
            option => option.value === newEmployee.group
          );

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
          toast.success("Employee updated successfully!");
        }
      }

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

  const handleEmailChange = (value: string) => {
  // update UI immediately
  setNewEmployee(prev => ({ ...prev, email: value }));

  // clear previous timer
  if (emailDebounceRef.current) {
    clearTimeout(emailDebounceRef.current);
  }

  // if empty, reset flags and skip API
  if (!value) {
    setEmailExists(false);
    setCheckingEmail(false);
    return;
  }

  // set new debounce timer (e.g. 500ms)
  emailDebounceRef.current = window.setTimeout(async () => {
    setCheckingEmail(true);
    try {
      const res = await adminService.isEmployeeEmailExists(
        selectedEmployeeId || 0,
        value
      );
      setEmailExists(res);
    } catch (error) {
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  }, 500);
};

  const handleSubChange = (value: number | number[] | undefined) => {
    const subId = Array.isArray(value) ? value[0] : value;
    if (subId) {
      setNewEmployee({
        ...newEmployee,
        sbuId: subId,
        departmentId: undefined,
      });
      fetchDepartmentBySub(subId);
    } else {
      setLabOptions([]);
    }
  };

  const handleDepartmentChange = (value: number | number[] | undefined) => {
    const departmentId = Array.isArray(value) ? value[0] : value;
    const selectedDept = departmentOptions.find(
      (option) => option.id === departmentId
    );

    setNewEmployee({
      ...newEmployee,
      departmentId: selectedDept?.id || 0,
      labAllocation: "",
    });

    if (selectedDept?.id) {
      fetchLabsByDepartment(selectedDept.id);
    } else {
      setLabOptions([]);
    }

    if (editMode && selectedEmployeeId && newEmployee.level) {
      setGroupOptions([]);
      if (selectedDept?.value) {
        fetchEmployeeGroups(newEmployee.level, selectedDept.value, selectedEmployeeId);
      }
    }
  };

  const handleGroupChange = (id: number | number[] | undefined) => {
    const selectedGroup = groupOptions.find(option => option.id === id);
    const newGroupValue = selectedGroup?.value || "";

    setNewEmployee({
      ...newEmployee,
      group: newGroupValue
    });

    setGroupChanged(newGroupValue !== originalGroupValue && newGroupValue !== "");
  };

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
      toast.error(err.response?.data?.message ?? "Failed to download file");
    } finally {
      setProcessing(false);
    }
  };

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

  if (isInitialLoad) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {/* Search Box */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowImportModal(true)}
            disabled={processing}
            className="flex items-center gap-2 px-5 py-2.5 bg-card text-card-foreground border border-border rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground shadow-sm"
          >
            <Upload size={16} />
            <span>Import from Excel</span>
          </button>

          <Button
            onClick={() => {
              setShowAddModal(true);
              setEditMode(false);
              setSelectedEmployeeId(null);
              setEmailExists(false);
              setCheckingEmail(false);
              setDepartmentOptions([]);
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
              setTimeout(() => {
                nameInputRef.current?.focus();
              }, 150);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-md overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-heading-bg text-primary-gradient">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[16%]">
                  Name
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[16%]">
                  Email
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[16%]">
                  DOJ
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[10%]">
                  SBU
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[10%]">
                  Department
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[10%]">
                  Lab
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[8%]">
                  Level
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[11%]">
                  Role
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[10%]">
                  Compliance
                </th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[8%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm font-medium">No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="text-sm hover:bg-[var(--custom-gray)] transition-all">
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-foreground">{emp.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      {emp.email}
                    </td>
                    <td className="px-4 py-4">
                      {emp.date}
                    </td>
                    <td className="px-4 py-4">
                      {emp.sbuName || ""}
                    </td>
                    <td className="px-4 py-4">
                      {emp.department || ""}
                    </td>
                    <td className="px-4 py-4">
                      {emp.labAllocation || "-"}
                    </td>
                    <td className="px-4 py-4">
                      {emp.level || ""}
                    </td>
                    <td className="px-4 py-4">
                      {emp.role || "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      {emp.complianceDay ? `Day ${emp.complianceDay}` : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-5">
                        <button
                          onClick={() => handleEditEmployee(emp.id)}
                          className="rounded-lg text-primary transition-colors duration-300 hover:text-primary/80 hover:bg-primary/10"
                          title="Edit Employee"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => resendMail(emp.id)}
                          className="rounded-lg text-[#4c51bf] duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)] dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                          title="Resend Welcome Mail"
                        >
                          <MailPlus size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEmployeeToDelete(emp);
                            setShowDeleteModal(true);
                          }}
                          className="rounded-lg text-destructive duration-300 hover:text-destructive/80 hover:bg-destructive/10 dark:text-foreground transition-all hover:bg-indigo-50 dark:hover:bg-muted"
                          title="Delete Employee"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <div className="text-sm text-muted-foreground">
                  Showing {employees.length > 0 ? page * PAGE_SIZE + 1 : 0} to{" "}
                  {Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements} employees
                </div>
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
                {generatePageNumbers().map((pageNum, index) => (
                  <React.Fragment key={index}>
                    {pageNum === "..." ? (
                      <span className="px-3 py-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum as number)}
                        className="min-w-[40px]"
                      >
                        {(pageNum as number) + 1}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
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
          <div className="relative w-full max-w-2xl flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="flex-shrink-0 px-5 py-4 shadow-md border-b border-border">
              <CardTitle className="text-1xl font-semibold text-primary">
                {editMode ? "Edit User" : "Create User"}
              </CardTitle>
            </div>

            {/* Scrollable Body */}
            <div className={`flex-1 overflow-y-auto max-h-[calc(110vh-200px)] px-8 py-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Candidate Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={(newEmployee.name as string) ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    value={newEmployee.email ?? ""}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    placeholder="Enter email address"
                  />
                  {emailExists && (
                    <p className="text-destructive text-sm mt-1">
                      Email already exists
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    SBU <span className="text-destructive">*</span>
                  </label>
                  <SearchableDropdown
                    options={sbuOptions}
                    value={
                      sbuOptions.find(
                        (option) => option.id === newEmployee.sbuId
                      )?.id
                    }
                    onChange={handleSubChange}
                    placeholder="Select SBU"
                    displayFullValue={false}
                    isEmployeePage={true}
                    disabled={editMode}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <SearchableDropdown
                    options={departmentOptions}
                    value={
                      departmentOptions.find(
                        (option) => option.id === newEmployee.departmentId
                      )?.id
                    }
                    onChange={handleDepartmentChange}
                    placeholder="Select Department"
                    displayFullValue={false}
                    isEmployeePage={true}
                    disabled={editMode}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Date of Joining <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEmployee.date ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, date: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm text-foreground bg-background transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    max="9999-12-31"
                    min="1900-01-01"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Level <span className="text-destructive">*</span>
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
                  <label className="block text-[13px] font-semibold text-foreground mb-2">Role</label>
                  <input
                    type="text"
                    value={newEmployee.role ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
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
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    placeholder="Number of compliance days"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    Total Experience (years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={newEmployee.totalExperience ?? "0"}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseInt(value);

                      if (value === "" || value === "-") {
                        setNewEmployee({
                          ...newEmployee,
                          totalExperience: value,
                        });
                      } else if (!isNaN(numValue)) {
                        if (numValue <= 40 && numValue >= 0) {
                          setNewEmployee({
                            ...newEmployee,
                            totalExperience: value,
                          });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const numValue = parseInt(value);

                      if (value === "" || isNaN(numValue) || numValue < 0) {
                        setNewEmployee({
                          ...newEmployee,
                          totalExperience: "0",
                        });
                      } else if (numValue > 40) {
                        setNewEmployee({
                          ...newEmployee,
                          totalExperience: "40",
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
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
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20"
                    placeholder="Previous company name"
                  />
                </div>
                {editMode && (
                  <div>
                    <label className="block text-[13px] font-semibold text-foreground mb-2">
                      Lab Allocation
                    </label>
                    <SearchableDropdown
                      options={labOptions}
                      value={
                        labOptions.find(
                          (option) => option.id === newEmployee.labId
                        )?.id
                      }
                      onChange={(id) => {
                        const selectedLab = labOptions.find(
                          (option) => option.id === id
                        )?.id;
                        setNewEmployee({
                          ...newEmployee,
                          labId: selectedLab || 0,
                        });
                      }}
                      placeholder={
                        !newEmployee.departmentId
                          ? "Select Department First"
                          : labOptions.length === 0
                            ? "No labs available"
                            : "Select Lab"
                      }
                      displayFullValue={false}
                      isEmployeePage={true}
                      disabled={!newEmployee.departmentId || labOptions.length === 0}
                      
                    />
                  </div>
                )}

                {editMode && (
                  <div>
                    <label className="block text-[13px] font-semibold text-foreground mb-2">
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
                        !newEmployee.level || !newEmployee.department || !selectedEmployeeId
                          ? "Level, Department and Employee ID required"
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
                      usePortal={true}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer with gradient button */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-accent/30 border-t border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  type="button"
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
                  className="border-border text-foreground hover:bg-accent"
                >
                  Cancel
                </Button>

                <button
                  onClick={editMode ? handleUpdateEmployee : handleAddEmployee}
                  disabled={
                    !newEmployee.name ||
                    !newEmployee.name.trim() ||
                    !newEmployee.level ||
                    !newEmployee.departmentId ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email || "") ||
                    emailExists ||
                    checkingEmail|| !newEmployee.date
                  }
                  className="px-6 py-2.5 bg-primary-gradient text-primary-foreground rounded-lg text-sm font-semibold 
        shadow-md transition-all duration-300 ease-in-out 
        hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
        disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editMode ? "Update User" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-foreground">
                Are you sure you want to delete the employee{" "}
                <span className="font-semibold">{employeeToDelete.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
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
                <Button
                  variant="destructive"
                  onClick={handleDeleteEmployee}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md border-b border-border">
              <CardTitle className="text-1xl font-semibold text-primary">
                Import from Excel
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <div>
                <label className="block text-[13px] font-semibold text-foreground mb-2">
                  Select Excel File <span className="text-destructive">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-input rounded-lg text-sm bg-background text-foreground transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: <span className="font-medium text-foreground">{importFile.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Footer with gradient button */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-card border-t border-border">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                >
                  Cancel
                </Button>
                <button
                  onClick={handleImportFromExcel}
                  disabled={!importFile || importLoading}
                  className="px-6 py-2.5 bg-primary-gradient text-primary-foreground rounded-lg text-sm font-semibold 
              shadow-md transition-all duration-300 ease-in-out 
              hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importLoading ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import Employees
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;