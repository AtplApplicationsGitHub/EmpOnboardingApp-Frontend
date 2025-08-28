"use client";

import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import { Search } from "lucide-react";
import SearchableDropdown from "../../components/SearchableDropdown";


const AuditTrailPage = () => {
    // State to hold the selected dates
    const [fromDate, setFromDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]); 
     const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]); 
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);  

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
        { id: 1, key: "admin@company.com", value: "System Administrator" },
        { id: 2, key: "john.doe@company.com", value: "John Doe" },
        { id: 3, key: "jane.smith@company.com", value: "Jane Smith" },
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
           
            <div className="flex flex-wrap items-end gap-4 ">
                {/* From Date Input */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">From Date</label>
                    <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </div>

                {/* End Date Input */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                 {/* Module Dropdown (with multi-select) */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium"> Select Module</label>
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
                <div className="flex flex-col gap-1">
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
                <div className="flex flex-col gap-1">
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
                        displayFullValue={true}
                    />
                </div>

                {/* Search Button */}
                <Button onClick={handleSearch}>
                    <Search size={16} className="mr-2" />
                    Search
                </Button>
            </div>
            
            {/* The main content */}
            <Card>
                <CardContent className="p-0">
                    {/* This section will contain the audit trail data table */}
                    <div className="text-center text-muted-foreground p-12 border-b border-border">
                        <p>No data to display</p>
                    </div>
                    <div className="text-center text-muted-foreground p-4">
                        <p className="text-sm">0 total</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AuditTrailPage;