"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import Button from "../../components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Users,
} from "lucide-react";
import { format } from "date-fns";


const PAGE_SIZE = 10;

interface ArchivedEmployee {

    employeeId: string;
    name: string;
    department: string;
    role: string;
    level: string;
    taskIds: string;
    totalQuetions: number;
    completedQuetions: number;
    pendingQuetions: number;
    status: string;
    freeze: string;
    doj: string;
    lab: string;
}


const ArchivedEmployeesPage: React.FC = () => {
    const [employees, setEmployees] = useState<ArchivedEmployee[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchFilter, setSearchFilter] = useState("");
    const [dateFormat, setDateFormat] = useState<string | null>(null);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalElements / PAGE_SIZE)),
        [totalElements]
    );

    const fetchArchivedEmployees = useCallback(async () => {
        try {
            setError(null);
            const params: Record<string, unknown> = {
                page: currentPage,
                size: PAGE_SIZE,
            };
            const search = searchFilter.trim();
            if (search) params.search = search;

            //  Replace with actual API call when backend is ready
            // const response = await archivedEmployeeService.getArchivedEmployees(params);
            // setEmployees(response.commonListDto.content ?? []);
            // setTotalElements(response.totalElements ?? 0);

            setEmployees([]);
            setTotalElements(0);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Failed to load archived employees");
            setEmployees([]);
            setTotalElements(0);
        }
    }, [currentPage, searchFilter]);

    useEffect(() => {
        fetchArchivedEmployees();
    }, [fetchArchivedEmployees]);

      
   
    const handlePageChange = (page: number) => {
        if (page >= 0 && page < totalPages) setCurrentPage(page);
    };

    const generatePageNumbers = () => {
        const pages: Array<number | "..."> = [];
        if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) pages.push(i);
            return pages;
        }
        if (currentPage > 3) pages.push(0, "...");
        for (
            let i = Math.max(1, currentPage - 2);
            i <= Math.min(totalPages - 2, currentPage + 2);
            i++
        ) {
            pages.push(i);
        }
        if (currentPage < totalPages - 4) pages.push("...", totalPages - 1);
        else if (currentPage < totalPages - 3) pages.push(totalPages - 1);
        return pages;
    };

    

    return (
        <div className="p-8 space-y-6">
            {/* Header / Search */}
            <Card>

                <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => {
                                setSearchFilter(e.target.value);
                                setCurrentPage(0);
                            }}
                            placeholder="Search…"
                            className="w-64 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                            aria-label="Search archived employees"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Archived Employees Table */}
            <Card>
                <CardContent className="p-0">
                    {error && (
                        <div className="px-4 py-2 text-sm text-red-500" role="alert">
                            {error}
                        </div>
                    )}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Role & Department</TableHead>
                                <TableHead>DOJ</TableHead>
                                <TableHead>Lab</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users size={48} className="text-muted-foreground" />
                                            <p className="text-muted-foreground">No archived employees found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((employee) => (
                                    <TableRow >
                                        {/* Employee Name */}
                                        <TableCell className="font-semibold min-w-[140px]">
                                            {employee.name}
                                        </TableCell>
                                        {/* Level */}
                                        <TableCell>{employee.level}</TableCell>
                                        {/* Role & Department */}
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-base font-semibold">
                                                    {employee.role}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {employee.department}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* DOJ */}
                                        <TableCell className="min-w-[100px]">
                                            {/* {(() => {
                                                const dojArray = (task as any).doj;
                                                if (
                                                    Array.isArray(dojArray) &&
                                                    dateFormat &&
                                                    dojArray.length >= 3
                                                ) {
                                                    try {
                                                        const dateObject = new Date(
                                                            dojArray[0],
                                                            dojArray[1] - 1,
                                                            dojArray[2]
                                                        );
                                                        if (isNaN(dateObject.getTime())) {
                                                            return "Invalid Date";
                                                        }
                                                        return format(dateObject, dateFormat);
                                                    } catch (error) {
                                                        return "Invalid Date";
                                                    }
                                                }
                                                return "Invalid Date";
                                            })()} */}
                                        </TableCell>
                                        {/* Lab */}
                                        <TableCell className="min-w-[80px]">
                                            {employee.lab}
                                        </TableCell>
                                        {/* Progress */}
                                        <TableCell className="min-w-[120px]">

                                        </TableCell>
                                        {/* Status */}
                                        <TableCell className="min-w-[100px]">

                                        </TableCell>
                                        {/* Actions */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="rounded-lg"
                                                    onClick={() =>
                                                        (window.location.href = `/admin/archived-employees/${employee.employeeId}`)
                                                    }
                                                    aria-label="View details"
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage + 1} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(0)}
                                    disabled={currentPage === 0}
                                    className="p-2"
                                    aria-label="First page"
                                >
                                    <ChevronsLeft size={16} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    className="p-2"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                {generatePageNumbers().map((page, idx) =>
                                    page === "..." ? (
                                        <span
                                            key={`dots-${idx}`}
                                            className="px-3 py-2 text-muted-foreground"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <Button
                                            key={page}
                                            variant={page === currentPage ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page as number)}
                                            className="min-w-[40px]"
                                            aria-current={page === currentPage ? "page" : undefined}
                                        >
                                            {(page as number) + 1}
                                        </Button>
                                    )
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className="p-2"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(totalPages - 1)}
                                    disabled={currentPage === totalPages - 1}
                                    className="p-2"
                                    aria-label="Last page"
                                >
                                    <ChevronsRight size={16} />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ArchivedEmployeesPage;