"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
} from "../../components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "../../components/ui/table";
import SearchableDropdown from "../../components/SearchableDropdown";
import { toast } from "react-hot-toast";
import { adminService } from "../../services/api";
import { DropDownDTO, OnboardingPipelineDTO } from "../../types";

const OnboardingPipelinePage: React.FC = () => {
    const [searchInput, setSearchInput] = useState("");
    const [searchFilter, setSearchFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateRange, setDateRange] = useState({
        startDate: "2025-09-01",
        endDate: "2025-09-14"
    });
    const [loading, setLoading] = useState(false);
    const [pipelineData, setPipelineData] = useState<OnboardingPipelineDTO[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<DropDownDTO[]>([]);
    const [levelOptions, setLevelOptions] = useState<DropDownDTO[]>([]);
    const [statusOptions, setStatusOptions] = useState<DropDownDTO[]>([
        { id: 1, key: "IN_PROGRESS", value: "In Progress" },
        { id: 2, key: "WAITING", value: "Waiting on Group" },
        { id: 3, key: "COMPLETED", value: "Completed" },
        { id: 4, key: "AT_RISK", value: "At Risk" },
        { id: 5, key: "OVERDUE", value: "Overdue" }
    ]);

    // Fetch lookup data for Levels and Departments
    const fetchLookupData = async () => {
        try {
            const levels = await adminService.getLookupItems("Level");
            setLevelOptions(levels);

            const departments = await adminService.getLookupItems("Department");
            setDepartmentOptions(departments);
        } catch (error) {
            toast.error("Failed to load dropdown options.");
        }
    };

    useEffect(() => {
        fetchLookupData();
    }, []);

    const fetchPipelineData = async () => {
        try {
            setLoading(true);

            // MOCK DATA 
            const mockData: OnboardingPipelineDTO[] = [
                {
                    id: 1,
                    employeeName: "Aisha Khan",
                    employeeEmail: "aisha.khan@example.com",
                    department: "Engineering",
                    level: "L2",
                    currentStage: "Access Provisioning",
                    groupsPending: "IT",
                    nextSLADue: "2025-09-16",
                    overallStatus: "At Risk",
                    owner: "IT Group Head"
                },
                {
                    id: 2,
                    employeeName: "Rahul Verma",
                    employeeEmail: "rahul.v@example.com",
                    department: "Sales",
                    level: "L1",
                    currentStage: "Q&A Review",
                    groupsPending: "Sales Ops",
                    nextSLADue: "2025-09-13",
                    overallStatus: "Overdue",
                    owner: "Sales Ops Head"
                },
                {
                    id: 3,
                    employeeName: "Meera Iyer",
                    employeeEmail: "meera.iyer@example.com",
                    department: "HR",
                    level: "L3",
                    currentStage: "Completed",
                    groupsPending: "—",
                    nextSLADue: "—",
                    overallStatus: "Completed",
                    owner: "—"
                }
            ];

            // Apply filters
            let filteredData = mockData;

            // if (searchFilter) {
            //     filteredData = filteredData.filter(
            //         (item) =>
            //             item.employeeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
            //             item.employeeEmail.toLowerCase().includes(searchFilter.toLowerCase()) ||
            //             item.department.toLowerCase().includes(searchFilter.toLowerCase())
            //     );
            // }

            if (departmentFilter) {
                filteredData = filteredData.filter(
                    (item) => item.department === departmentFilter
                );
            }

            if (levelFilter) {
                filteredData = filteredData.filter((item) => item.level === levelFilter);
            }

            if (statusFilter) {
                filteredData = filteredData.filter(
                    (item) => item.overallStatus === statusFilter
                );
            }

            setPipelineData(filteredData);

            // TO REPLACE WITH API CALL:
            // const params = {
            //     search: searchFilter,
            //     department: departmentFilter,
            //     level: levelFilter,
            //     status: statusFilter,
            //     startDate: dateRange.startDate,
            //     endDate: dateRange.endDate
            // };
            // const response = await adminService.getOnboardingPipeline(params);
            // setPipelineData(response.data || []);

        } catch (error) {
            toast.error("Failed to load pipeline data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLookupData();
        fetchPipelineData();
    }, []);

    useEffect(() => {
        fetchPipelineData();
    }, [searchFilter, departmentFilter, levelFilter, statusFilter]);

    // const handleSearchSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setSearchFilter(searchInput);
    //     console.log("Searching for:", searchInput);
    // };

    // const handleClearFilters = () => {
    //     setDepartmentFilter("");
    //     setLevelFilter("");
    //     setStatusFilter("");
    //     setSearchInput("");
    //     setSearchFilter("");
    // };

    const handleDepartmentChange = (value: number | number[] | undefined) => {
        const departmentId = Array.isArray(value) ? value[0] : value;
        const selectedDept = departmentOptions.find(
            (option) => option.id === departmentId
        );
        setDepartmentFilter(selectedDept?.value || "");
        console.log("Department selected:", selectedDept?.value);
    };

    const handleLevelChange = (value: number | number[] | undefined) => {
        const levelId = Array.isArray(value) ? value[0] : value;
        const selectedLevel = levelOptions.find((option) => option.id === levelId);
        setLevelFilter(selectedLevel?.value || "");
        console.log("Level selected:", selectedLevel?.value);
    };

    const handleStatusChange = (value: number | number[] | undefined) => {
        const statusId = Array.isArray(value) ? value[0] : value;
        const selectedStatus = statusOptions.find(
            (option) => option.id === statusId
        );
        setStatusFilter(selectedStatus?.value || "");
        console.log("Status selected:", selectedStatus?.value);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "Completed":
                return "bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-900 dark:text-emerald-200";
            case "At Risk":
                return "bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-900 dark:text-amber-200";
            case "Overdue":
                return "bg-red-50 text-red-800 border-red-400 dark:bg-red-900 dark:text-red-200";
            case "In Progress":
                return "bg-blue-50 text-blue-800 border-blue-400 dark:bg-blue-900 dark:text-blue-200";
            case "Waiting on Group":
                return "bg-gray-50 text-gray-800 border-gray-400 dark:bg-gray-900 dark:text-gray-200";
            default:
                return "bg-gray-50 text-gray-800 border-gray-400 dark:bg-gray-900 dark:text-gray-200";
        }
    };

    return (
          <div className="p-6 max-w-9xl mx-auto space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    {/* Title and Date Range */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight mb-3">
                            Onboarding Pipeline & Status
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Date range:</span>
                            <span className="font-semibold text-foreground">
                                {dateRange.startDate} → {dateRange.endDate}
                            </span>
                            <span>•</span>
                            <span>Generated:</span>
                            <span className="font-semibold text-foreground">
                                {new Date().toISOString().split("T")[0]}
                            </span>
                        </div>
                    </div>

                    {/* Filter Row */}
                    <div className="mt-6">
                        <div className="flex flex-wrap gap-6 items-center">
                            {/* Department Filter */}
                            <div className="flex items-center gap-2 min-w-[260px]">
                                <label className="text-sm font-medium whitespace-nowrap">
                                    Department:
                                </label>
                                <div className="flex-1">
                                    <SearchableDropdown
                                        options={departmentOptions}
                                        value={
                                            departmentOptions.find(
                                                (option) => option.value === departmentFilter
                                            )?.id
                                        }
                                        onChange={handleDepartmentChange}
                                        placeholder="All Departments"
                                        displayFullValue={false}
                                        isEmployeePage={true}
                                    />
                                </div>
                            </div>

                            {/* Level Filter */}
                            <div className="flex items-center gap-2 min-w-[220px]">
                                <label className="text-sm font-medium whitespace-nowrap">
                                    Level:
                                </label>
                                <div className="flex-1">
                                    <SearchableDropdown
                                        options={levelOptions}
                                        value={
                                            levelOptions.find((option) => option.value === levelFilter)?.id
                                        }
                                        onChange={handleLevelChange}
                                        placeholder="All Levels"
                                        displayFullValue={false}
                                        isEmployeePage={true}
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2 min-w-[260px]">
                                <label className="text-sm font-medium whitespace-nowrap">
                                    Status:
                                </label>
                                <div className="flex-1">
                                    <SearchableDropdown
                                        options={statusOptions}
                                        value={
                                            statusOptions.find((option) => option.value === statusFilter)?.id
                                        }
                                        onChange={handleStatusChange}
                                        placeholder="All Statuses"
                                        displayFullValue={false}
                                        isEmployeePage={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* Table */}
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell className="font-semibold">Employee</TableCell>
                                <TableCell className="font-semibold">Dept / Level</TableCell>
                                <TableCell className="font-semibold">Current Stage</TableCell>
                                <TableCell className="font-semibold">Groups Pending</TableCell>
                                <TableCell className="font-semibold">Next SLA Due</TableCell>
                                <TableCell className="font-semibold">Overall Status</TableCell>
                                <TableCell className="font-semibold">Owner</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                            <p className="text-muted-foreground">Loading pipeline data...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : pipelineData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <p className="text-muted-foreground">
                                            No employees found in onboarding pipeline
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pipelineData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.employeeName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.employeeEmail}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.department} / {item.level}
                                        </TableCell>
                                        <TableCell>{item.currentStage}</TableCell>
                                        <TableCell>{item.groupsPending}</TableCell>
                                        <TableCell>{item.nextSLADue}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                                                    item.overallStatus
                                                )}`}
                                            >
                                                {item.overallStatus}
                                            </span>
                                        </TableCell>
                                        <TableCell>{item.owner}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardingPipelinePage;