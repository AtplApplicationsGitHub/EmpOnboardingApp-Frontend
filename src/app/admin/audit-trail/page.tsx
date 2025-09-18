"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import {
    Search, Shield, ChevronDown,
    ChevronRight,
} from "lucide-react";
import SearchableDropdown from "../../components/SearchableDropdown";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
} from "../../components/ui/table";
import { auditService } from "../../services/api";
import { DropDownDTO, AuditSearchRequest, AuditRecord } from "@/app/types";
const PAGE_SIZE = 10;

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AuditTrailPage = () => {
    const [fromDate, setFromDate] = useState(getTodayDate());
    const [endDate, setEndDate] = useState(getTodayDate());
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [expandedRowIndices, setExpandedRowIndices] = useState<number[]>([]);
    const [moduleOptions, setModuleOptions] = useState<DropDownDTO[]>([]);
    const [isLoadingModules, setIsLoadingModules] = useState(true);
    const [moduleError, setModuleError] = useState<string | null>(null);
    const [eventOptions, setEventOptions] = useState<DropDownDTO[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [eventError, setEventError] = useState<string | null>(null);
    const [userOptions, setUserOptions] = useState<DropDownDTO[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [userError, setUserError] = useState<string | null>(null);
    const [auditTrailData, setAuditTrailData] = useState<AuditRecord[]>([]);
    const [isLoadingAuditData, setIsLoadingAuditData] = useState(false);
    const [auditDataError, setAuditDataError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                setIsLoadingModules(true);
                const moduleResponse = await auditService.getModuleByName();

                // Transform MultiSelectDropDownDTO to component format
                const transformedModules = moduleResponse.map((item: any) => ({
                    id: item.id,
                    key: item.itemName,
                    value: item.itemName
                }));
                setModuleOptions(transformedModules);
                setModuleError(null);
            } catch (error) {
                setModuleError('Failed to load modules');

            } finally {
                setIsLoadingModules(false);
            }
        };

        fetchModules();
    }, []);


    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoadingEvents(true);
                const eventResponse = await auditService.getEventByName();

                const transformedEvents = eventResponse.map((item: any) => ({
                    id: item.id,
                    key: item.itemName,
                    value: item.itemName
                }));

                setEventOptions(transformedEvents);
                setEventError(null);
            } catch (error) {
                setEventError('Failed to load events');
            } finally {
                setIsLoadingEvents(false);
            }
        };

        fetchEvents();
    }, []);


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoadingUsers(true);
                const userResponse = await auditService.getUserByName();

                const transformedUsers = userResponse.map((item) => ({
                    id: item.id,
                    key: item.itemName,
                    value: item.itemName
                }));
                setUserOptions(transformedUsers);
                setUserError(null);
            } catch (error) {
                setUserError('Failed to load users');
            } finally {
                setIsLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // Handle Search button click
    const handleSearch = async (page: number = 0) => {

        try {
            setIsLoadingAuditData(true);
            setAuditDataError(null);

            // Added 1 day to end date 
            const adjustedEndDate = new Date(endDate);
            adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
            const formattedEndDate = adjustedEndDate.toISOString().split('T')[0];

            // Get selected values as strings (convert IDs to corresponding names)
            const selectedModuleNames = selectedModuleIds.map(id => {
                const module = moduleOptions.find(option => option.id === id);
                return module ? module.value : '';
            }).filter(name => name !== '');

            const selectedEventNames = selectedEventIds.map(id => {
                const event = eventOptions.find(option => option.id === id);
                return event ? event.value : '';
            }).filter(name => name !== '');

            const selectedUserNames = selectedUserIds.map(id => {
                const user = userOptions.find(option => option.id === id);
                return user ? user.value : '';
            }).filter(name => name !== '');

            // Build search request
            const searchRequest: AuditSearchRequest = {
                fromDate: fromDate,
                toDate: formattedEndDate,
                selectedEvent: selectedEventNames,
                selectedModule: selectedModuleNames,
                selectedUser: selectedUserNames,
                userId: 1
            };

            console.log('Search request:', searchRequest); // Debug log

            // Call the API
            const response = await auditService.findFilteredData(page, searchRequest);
            console.log('Search response:', response); // Debug log

            setAuditTrailData(response.commonListDto || []);
            setTotalElements(response.totalElements || 0);
            setCurrentPage(page);
            setExpandedRowIndices([]);

        } catch (error) {
            console.error('Search error:', error);
            setAuditDataError('Failed to fetch audit trail data. Please try again.');
            setAuditTrailData([]);
        } finally {
            setIsLoadingAuditData(false);
        }
    };


    // Handle row expansion
    const handleExpandClick = (index: number) => {
        setExpandedRowIndices((prevIndices) => {
            const isExpanded = prevIndices.includes(index);
            if (isExpanded) {
                return prevIndices.filter((i) => i !== index);
            } else {
                return [...prevIndices, index];
            }
        });
    };
    const totalPages = Math.ceil(totalElements / PAGE_SIZE);

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
                        min={fromDate}
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
                    <Button
                        onClick={() => handleSearch(0)}
                        disabled={isLoadingAuditData}
                    >                        <Search size={16} className="mr-1" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Error message */}
            {auditDataError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{auditDataError}</p>
                </div>
            )}

            {/* The main content */}
            <Card>
                <CardContent className="p-0 space-y-4">
                    <Table className="table-fixed">
                        <TableHeader>
                            <TableRow>
                                <TableCell className="w-11"></TableCell>
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
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Shield size={48} className="text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                No audit trail data found
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                auditTrailData.map((record, index) => (
                                    <React.Fragment key={index}>
                                        {/* Main Row */}
                                        <TableRow>
                                            {/* Expand button column */}
                                            <TableCell className="w-[40px]">
                                                <button
                                                    onClick={() => handleExpandClick(index)}
                                                    className="p-1 rounded-full hover:bg-muted"
                                                >
                                                    {expandedRowIndices.includes(index) ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap overflow-hidden text-ellipsis w-42">
                                                {record.loginUserName}
                                            </TableCell>
                                            <TableCell >
                                                {record.event}
                                            </TableCell>
                                            <TableCell >{record.module}</TableCell>
                                            <TableCell >{record.moduleId}</TableCell>
                                            <TableCell className="font-mono text-sm">{record.ipAddress}</TableCell>
                                            <TableCell className="text-sm ">{record.createdTime}</TableCell>
                                        </TableRow>
                                        {/* Expanded Row Content */}
                                        {expandedRowIndices.includes(index) && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="p-2">
                                                    <div className="flex flex-col space-y-4  bg-card text-card-foreground shadow-sm p-4">
                                                        {record.systemRemarks && (
                                                            <div className="border border-border p-4 rounded-lg">
                                                                <div className="border-b border-border pb-2 mb-2">
                                                                    <h4 className="text-sm font-bold tracking-wide uppercase">
                                                                        System Remarks
                                                                    </h4>
                                                                </div>
                                                                <p
                                                                    className="text-sm text-muted-foreground leading-relaxed"
                                                                    dangerouslySetInnerHTML={{ __html: record.systemRemarks }}
                                                                />
                                                            </div>
                                                        )}
                                                        {record.userRemarks && (
                                                            <div className="border border-border p-4 rounded-lg">
                                                                <div className="border-b border-border pb-2 mb-2">
                                                                    <h4 className="text-sm font-bold tracking-wide uppercase">
                                                                        User Remarks
                                                                    </h4>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground leading-relaxed">{record.userRemarks}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Button
                        disabled={currentPage === 0}
                        onClick={() => handleSearch(currentPage - 1)}
                    >
                        Prev
                    </Button>
                    <span className="px-2 py-1">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => handleSearch(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AuditTrailPage;