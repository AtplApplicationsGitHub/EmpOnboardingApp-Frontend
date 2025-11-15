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
  Archive,
  Search,
  AlertTriangle, X
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

      const departments = await adminService.findAllDepartment();
      // console.log("new api", departments); // DEBUG
      const transformedDepartments = departments.map(dept => ({
        ...dept,
        value: dept.value || dept.key
      }));

      setDepartmentOptions(transformedDepartments);
    } catch (error) {
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

      if (emp.level && emp.department && employeeId) {
        await fetchEmployeeGroups(emp.level, emp.department, employeeId);
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
      labAllocation: "",
    });

    if (selectedDept?.value) {
      fetchLabsByDepartment(selectedDept.value);
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

  const archiveEmployee = async (id: number) => {
    try {
      await adminService.achiveEmployees(id);
      toast.success("Employee Archival successfully!");
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive employee.");
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

  // Get initials for avatar
  // const getInitials = (name: string) => {
  //   const parts = name.split(' ');
  //   if (parts.length >= 2) {
  //     return (parts[0][0] + parts[1][0]).toUpperCase();
  //   }
  //   return name.substring(0, 2).toUpperCase();
  // };

  return (
    <div className="space-y-2">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {/* Search Box */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white transition-all focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm"
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
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Employee</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-heading-bg text-primary-gradient">
                <th className="px-6 py-4 text-left text-xs font-semibold  uppercase tracking-wider w-[18%]">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[16%]">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[13%]">
                  DOJ
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[13%]">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[10%]">
                  Lab
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[8%]">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[11%]">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-[10%]">
                  Compliance
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-[8%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-gray-300" />
                      <p className="text-gray-500 text-sm font-medium">No employees found</p>

                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{emp.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-medium">{emp.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {emp.department || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {emp.labAllocation || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                        {emp.level || "L1"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{emp.role || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {emp.complianceDay ? `Day ${emp.complianceDay}` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-5">
                        <button
                          onClick={() => handleEditEmployee(emp.id)}
                          className="rounded-lg text-[#4c51bf] transition-colors duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)]"
                          title="Edit Employee"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEmployeeToDelete(emp);
                            setShowDeleteModal(true);
                          }}
                      className=" rounded-lg text-red-500  transition-colors duration-300 hover:text-[#be123c] hover:bg-[rgba(225,29,72,0.08)]  "
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
        <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={page === 0}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {generatePageNumbers().map((pageNum, idx) =>
              typeof pageNum === "number" ? (
                <button
                  key={idx}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[40px] h-10 rounded text-sm font-medium transition-all ${page === pageNum
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {pageNum + 1}
                </button>
              ) : (
                <span key={idx} className="px-2 text-gray-400">
                  {pageNum}
                </span>
              )
            )}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="flex-shrink-0  px-5 py-4 shadow-md">

              <CardTitle className="text-1xl font-semibold text-primary-gradient">
                {editMode ? "Edit User" : "Create User"}
              </CardTitle>
            </div>

            {/* Scrollable Body */}
            <div className={`flex-1 ${editMode ? "overflow-y-auto max-h-[calc(90vh-180px)]" : ""} px-8 py-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={(newEmployee.name as string) ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Date of Joining <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEmployee.date ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, date: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm text-gray-700 transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    max="9999-12-31"
                    min="1900-01-01"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
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

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Level <span className="text-red-500">*</span>
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
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
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

                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
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
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    placeholder="Previous company name"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={newEmployee.role ?? ""}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    placeholder="e.g., Software Engineer, Manager"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
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
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    placeholder="Number of compliance days"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={newEmployee.email ?? ""}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    placeholder="Enter email address"
                    disabled={editMode}
                  />
                  {!editMode && emailExists && (
                    <p className="text-red-500 text-sm mt-1">
                      Email already exists
                    </p>
                  )}
                </div>

                {editMode && (
                  <div>
                    <label className="block text-[13px] font-semibold text-gray-700 mb-2">
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
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer with gradient button */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
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
                >
                  Cancel
                </Button>

                <button
                  onClick={editMode ? handleUpdateEmployee : handleAddEmployee}
                  disabled={
                    !newEmployee.name ||
                    !newEmployee.name.trim() ||
                    !newEmployee.level ||
                    !newEmployee.department ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email || "") ||
                    emailExists ||
                    checkingEmail
                  }
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
        shadow-md transition-all duration-300 ease-in-out 
        hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
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

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 shadow-md">
              <CardTitle className="text-1xl font-semibold text-primary-gradient">
                Import from Excel
              </CardTitle>
            </div>

            {/* Body */}
            <div className="flex-1 px-8 py-6">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                  Select Excel File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {importFile && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: <span className="font-medium text-gray-700">{importFile.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Footer with gradient button */}
            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
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
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
              shadow-md transition-all duration-300 ease-in-out 
              hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
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