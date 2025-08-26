"use client";

import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import { Search, Shield } from "lucide-react";
import SearchableDropdown from "../../components/SearchableDropdown";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "../../components/ui/table";

const AuditTrailPage = () => {
    // State to hold the selected dates
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    const auditTrailData = [
        {
            id: 1,
            username: "admin",
            event: "LOGIN",
            module: "Users",
            moduleId: 3,
            ipAddress: "192.168.1.100",
            createdTime: "2024-03-15 09:30:45"
        },
        {
            id: 2,
            username: "john",
            event: "CREATE",
            module: "Employees",
            moduleId: 1,
            ipAddress: "192.168.1.101",
            createdTime: "2024-03-15 10:15:22"
        },
        {
            id: 3,
            username: "jane",
            event: "UPDATE",
            module: "Assets",
            moduleId: 2,
            ipAddress: "192.168.1.102",
            createdTime: "2024-03-15 11:45:13"
        }
    ];
    const moduleOptions = [
        { id: 1, key: "Employees", value: "Employees" },
        { id: 2, key: "Assets", value: "Assets" },
        { id: 3, key: "Users", value: "Users" },
        { id: 4, key: "Reports", value: "Reports" },
    ];

    const eventOptions = [
        { id: 1, key: "LOGIN", value: "User Login" },
        { id: 2, key: "LOGOUT", value: "User Logout" },
        { id: 3, key: "CREATE", value: "Record Created" },
        { id: 4, key: "UPDATE", value: "Record Updated" },
        { id: 5, key: "DELETE", value: "Record Deleted" },
    ];

    const userOptions = [
        { id: 1, key: "admin@sys.com", value: "Admin" },
        { id: 2, key: "john@sys.com", value: "John" },
        { id: 3, key: "jane@sys.com", value: "Jane" },
    ];

    // Handle search click
    const handleSearch = async () => {
        const searchParams = {
            fromDate,
            endDate,
            moduleIds: selectedModuleIds,
            eventIds: selectedEventIds,
            userIds: selectedUserIds,
        };

        console.log("Search Params:", searchParams);

    };

    return (
        <div className="p-6 max-w-9xl mx-auto space-y-6">

            <div className="flex items-end gap-2">
                {/* From Date Input */}
                <div className="flex flex-col gap-1 w-36 flex-shrink-0">
                    <label className="text-sm font-medium">From Date</label>
                    <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>

                {/* End Date Input */}
                <div className="flex flex-col gap-1 w-36 flex-shrink-0">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                {/* Module Dropdown (with multi-select) */}
                <div className="flex flex-col gap-1 flex-1 min-w-10">
                    <label className="text-sm font-medium">Select Module</label>
                    <SearchableDropdown
                        options={moduleOptions}
                        value={selectedModuleIds} // Pass the array of IDs
                        isMultiSelect={true} // Enable multi-select behavior
                        onChange={(ids) => {
                            // The component now returns an array of IDs
                            setSelectedModuleIds(ids as number[] || []);
                        }}
                        placeholder="Select Module(s)"
                    />
                </div>

                {/* Event Dropdown (with multi-select) */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="text-sm font-medium">Event</label>
                    <SearchableDropdown
                        options={eventOptions}
                        value={selectedEventIds}
                        isMultiSelect={true}
                        onChange={(ids) => {
                            if (Array.isArray(ids)) {
                                setSelectedEventIds(ids);
                            } else {
                                setSelectedEventIds([]);
                            }
                        }}
                        placeholder="Select Event(s)"
                    />
                </div>

                {/* Users Dropdown (with multi-select) */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <label className="text-sm font-medium">User</label>
                    <SearchableDropdown
                        options={userOptions}
                        value={selectedUserIds}
                        isMultiSelect={true}
                        onChange={(ids) => {
                            if (Array.isArray(ids)) {
                                setSelectedUserIds(ids);
                            } else {
                                setSelectedUserIds([]);
                            }
                        }}
                        placeholder="Select User(s)"
                    />
                </div>

                {/* Search Button */}
                <div className="flex-shrink-0">
                    <Button onClick={handleSearch}>
                        <Search size={16} />
                        Search
                    </Button>
                </div>
            </div>

            {/* The main content */}
            <Card>
                <CardContent className="p-0 space-y-4">
                    <Table className="table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableCell className="w-42">Username</TableCell>
                                <TableCell >Event</TableCell>
                                <TableCell>Module</TableCell>
                                <TableCell >Module ID</TableCell>
                                <TableCell >IP Address</TableCell>
                                <TableCell>Created Time</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditTrailData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Shield size={48} className="text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                No audit trail data found
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                auditTrailData.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium whitespace-nowrap overflow-hidden text-ellipsis w-42">
                                            {record.username}
                                        </TableCell>
                                        <TableCell >
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${record.event === "LOGIN"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                    : record.event === "LOGOUT"
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                        : record.event === "CREATE"
                                                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                                            : record.event === "UPDATE"
                                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                }`}>
                                                {record.event}
                                            </span>
                                        </TableCell>
                                        <TableCell >{record.module}</TableCell>
                                        <TableCell >{record.moduleId}</TableCell>
                                        <TableCell className="font-mono text-sm">{record.ipAddress}</TableCell>
                                        <TableCell className="text-sm ">{record.createdTime}</TableCell>
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

export default AuditTrailPage;