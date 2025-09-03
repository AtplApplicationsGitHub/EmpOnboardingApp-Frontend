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
import { DropDownDTO,AuditSearchRequest,AuditRecord } from "@/app/types";


const AuditTrailPage = () => {
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
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
    const [currentPage] = useState(1);    



    // const auditTrailData = [
    //     {
    //         id: 1,
    //         username: "admin",
    //         event: "LOGIN",
    //         module: "Users",
    //         moduleId: 3,
    //         ipAddress: "192.168.1.100",
    //         createdTime: "2024-03-15 09:30:45",
    //         details: "User 'admin' logged in successfully from IP 192.168.1.100."

    //     },
    //     {
    //         id: 2,
    //         username: "john",
    //         event: "CREATE",
    //         module: "Employees",
    //         moduleId: 1,
    //         ipAddress: "192.168.1.101",
    //         createdTime: "2024-03-15 10:15:22",
    //         details: "New employee record created for 'John Doe'. The employee ID is 1234."
    //     },
    //     {
    //         id: 3,
    //         username: "jane",
    //         event: "UPDATE",
    //         module: "Assets",
    //         moduleId: 2,
    //         ipAddress: "192.168.1.102",
    //         createdTime: "2024-03-15 11:45:13",
    //         details: "Asset ID 'A456' status updated from 'in-use' to 'maintenance'."
    //     }
    // ];
    // const moduleOptions = [
    //     { id: 1, key: "Employees", value: "Employees" },
    //     { id: 2, key: "Assets", value: "Assets" },
    //     { id: 3, key: "Users", value: "Users" },
    //     { id: 4, key: "Reports", value: "Reports" },
    // ];

//   const userOptions = [
//         { id: 1, key: "admin@sys.com", value: "Admin" },
//         { id: 2, key: "john@sys.com", value: "John" },
//         { id: 3, key: "jane@sys.com", value: "Jane" },
//     ];

    // const eventOptions = [
    //     { id: 1, key: "LOGIN", value: "User Login" },
    //     { id: 2, key: "LOGOUT", value: "User Logout" },
    //     { id: 3, key: "CREATE", value: "Record Created" },
    //     { id: 4, key: "UPDATE", value: "Record Updated" },
    //     { id: 5, key: "DELETE", value: "Record Deleted" },
    // ];


        useEffect(() => {
        const fetchModules = async () => {
            try {
                setIsLoadingModules(true);
                const moduleResponse = await auditService.getModuleByName();
                // console.log('Module response:', moduleResponse); // Debug log
                
                // Transform MultiSelectDropDownDTO to component format
                const transformedModules = moduleResponse.map((item: any) => ({
                    id: item.id,
                    key: item.itemName,
                    value: item.itemName
                }));
                // console.log('Transformed modules:', transformedModules); // Debug log
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
                // console.log('event response:', eventResponse); // Debug log

                // Transform the received data to the component's required format
                const transformedEvents = eventResponse.map((item: any) => ({
                    id: item.id,
                    key: item.itemName, 
                    value: item.itemName
                }));
            //  console.log('Transformed event:', transformedEvents); // Debug log

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
                console.log('User response:', userResponse); // Debug log
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


    // Helper function to get names from IDs
    const getNamesByIds = (ids: number[], options: DropDownDTO[]): string[] => {
        return ids.map(id => {
            const option = options.find(opt => opt.id === id);
            return option ? option.key : '';
        }).filter(name => name !== '');
    };

    // Handle search click
    const handleSearch = async () => {
        try {
            setIsLoadingAuditData(true);
            setAuditDataError(null);

            // Convert IDs to names for the API request
            const selectedModuleNames = getNamesByIds(selectedModuleIds, moduleOptions);
            const selectedEventNames = getNamesByIds(selectedEventIds, eventOptions);
            const selectedUserNames = getNamesByIds(selectedUserIds, userOptions);

            const searchParams: AuditSearchRequest = {
                fromDate,
                toDate: endDate,
                selectedEvent: selectedEventNames,
                selectedModule: selectedModuleNames,
                selectedUser: selectedUserNames,
                userId: 1 
            };

            console.log("Search Params:", searchParams);

            const auditData = await auditService.findFilteredData(currentPage, searchParams);
            console.log("BE response (auditData):", auditData);
           setAuditTrailData(Array.isArray(auditData) ? auditData : []);
        

            
        } catch (error) {
            console.error("Search failed:", error);
            setAuditDataError("Failed to fetch audit data. Please try again.");
            setAuditTrailData([]);
        } finally {
            setIsLoadingAuditData(false);
        }
    };

    // Handle row expansion
    const handleExpandClick = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
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
                        onClick={handleSearch} 
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
                                 auditTrailData.map((record ) => (
                                    <React.Fragment key={record.loginUserId  }>
                                        {/* Main Row */}
                                        <TableRow>
                                            {/* Expand button column */}
                                            <TableCell className="w-[40px]">
                                                <button
                                                    onClick={() => handleExpandClick(record.loginUserId )}
                                                    className="p-1 rounded-full hover:bg-muted"
                                                >
                                                    {expandedRow === (record.loginUserId ) ? (
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
                                     {expandedRow === (record.loginUserId ) && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="p-4 bg-muted/50">
                                                    <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {record.systemRemarks && (
                                                                <div>
                                                                    <p className="font-medium text-foreground">System Remarks:</p>
                                                                    <p>{record.systemRemarks}</p>
                                                                </div>
                                                            )}
                                                            {record.userRemarks && (
                                                                <div>
                                                                    <p className="font-medium text-foreground">User Remarks:</p>
                                                                    <p>{record.userRemarks}</p>
                                                                </div>
                                                            )}
                                                        </div>
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
        </div>
    );
};

export default AuditTrailPage;