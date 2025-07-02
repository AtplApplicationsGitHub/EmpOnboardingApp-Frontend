'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import Button from '../../components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  FileText, 
  BarChart3, 
  Download, 
  Clock,
  User,
  CheckCircle,
  Mail,
  Activity,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAnimation, animationClasses } from '../../lib/animations';

interface AuditLogEntry {
  id: string;
  userName: string;
  moduleName: string;
  eventName: string;
  systemRemarks: string;
  oldValue?: string;
  newValue?: string;
  datetime: string;
}

interface ReportData {
  dailyTaskSummary: {
    date: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  }[];
  groupLeaderOverview: {
    groupLeader: string;
    totalEmployees: number;
    completedEmployees: number;
    averageCompletion: number;
  }[];
  candidateChecklist: {
    candidateName: string;
    candidateId: string;
    joinDate: string;
    completionStatus: 'complete' | 'in-progress' | 'overdue';
    tasksCompleted: number;
    totalTasks: number;
  }[];
}

const AdminReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'audit'>('reports');
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    searchTerm: '',
    module: '',
    dateFrom: '',
    dateTo: '',
    eventType: ''
  });

  const isVisible = useAnimation();

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportData();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Fetch actual report data from API
      const [dailySummary, groupLeaderOverview, candidateChecklist] = await Promise.all([
        adminService.getDailyTaskSummary(15),
        adminService.getGroupLeaderOverview(),
        adminService.getCandidateChecklist()
      ]);      const reportData: ReportData = {
        dailyTaskSummary: dailySummary,
        groupLeaderOverview: groupLeaderOverview,
        candidateChecklist: candidateChecklist
      };

      // Report data fetched successfully (for future use)
      console.log('Report data fetched:', reportData);
    } catch (error) {
      toast.error('Failed to fetch report data');
      console.error('Report data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Fetch actual audit logs from API
      const auditLogsData = await adminService.getAuditLogs();
      setAuditLogs(auditLogsData);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
      console.error('Audit logs fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (reportType: string) => {
    try {
      const blob = await adminService.exportReport(reportType.toLowerCase().replace(/\s+/g, '-'));
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType.toLowerCase().replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportType} report exported successfully!`);
    } catch (error) {
      toast.error(`Failed to export ${reportType} report`);
      console.error('Export error:', error);
    }
  };

  const filterAuditLogs = (logs: AuditLogEntry[]) => {
    return logs.filter(log => {
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          log.userName.toLowerCase().includes(searchLower) ||
          log.moduleName.toLowerCase().includes(searchLower) ||
          log.eventName.toLowerCase().includes(searchLower) ||
          log.systemRemarks.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.module && log.moduleName !== filters.module) {
        return false;
      }

      if (filters.eventType && log.eventName !== filters.eventType) {
        return false;
      }

      if (filters.dateFrom) {
        const logDate = new Date(log.datetime);
        const fromDate = new Date(filters.dateFrom);
        if (logDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const logDate = new Date(log.datetime);
        const toDate = new Date(filters.dateTo);
        if (logDate > toDate) return false;
      }

      return true;
    });
  };

  const filteredAuditLogs = filterAuditLogs(auditLogs);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredAuditLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAuditLogs = filteredAuditLogs.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case 'Task Management':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Authentication':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Employee Management':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Group Management':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Question Management':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className={`p-8 space-y-8 ${isVisible ? animationClasses.fadeIn : 'opacity-0'}`}>
      {/* Header */}
      <div className={`flex justify-between items-start ${isVisible ? animationClasses.slideInDown : 'opacity-0'}`}>
        <div>
          <h1 className="text-3xl font-bold">Reports & Audit Trail</h1>
          <p className="text-muted-foreground mt-2">
            Generate reports and view system audit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => activeTab === 'reports' ? fetchReportData() : fetchAuditLogs()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? animationClasses.spin : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Reports
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'audit'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity size={16} className="inline mr-2" />
          Audit Trail
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Daily Task Status Summary */}
            <Card className={`${animationClasses.hoverLift} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Daily Task Status Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Real-time report summarizing all onboarding tasks for candidates joining in the next 15 days.
                </p>
                <Button 
                  onClick={() => handleExportReport('Daily Task Status Summary')}
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Group Leader Overview */}
            <Card className={`${animationClasses.hoverLift} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-green-500" />
                  Group Leader Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Track task completion efficiency by group leader assignment rates.
                </p>
                <Button 
                  onClick={() => handleExportReport('Group Leader Overview')}
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Candidate Checklist Completion */}
            <Card className={`${animationClasses.hoverLift} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  Candidate Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide an overview of the readiness status for each candidate.
                </p>
                <Button 
                  onClick={() => handleExportReport('Candidate Checklist')}
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Checklist Completion Report */}
            <Card className={`${animationClasses.hoverLift} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Checklist Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Identify tasks that required escalation due to non-compliance with timelines.
                </p>
                <Button 
                  onClick={() => handleExportReport('Checklist Completion')}
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Audit Trail Report */}
            <Card className={`${animationClasses.hoverLift} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-red-500" />
                  Audit Trail Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Maintain compliance with audit by tracking all system interactions.
                </p>
                <Button 
                  onClick={() => handleExportReport('Audit Trail')}
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Email Status Logs */}
            <Card className={`${animationClasses.hoverLift} cursor-pointer transition-all duration-200 hover:shadow-lg`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-indigo-500" />
                  Email Status Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Know the list of emails triggered with status tracking and delivery confirmation.
                </p>
                <Button 
                  onClick={() => handleExportReport('Email Status Logs')}
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Download size={16} />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Audit Log Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="audit-search" className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="audit-search"
                      type="text"
                      placeholder="Search logs..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="module-select" className="block text-sm font-medium mb-2">Module</label>
                  <select
                    id="module-select"
                    value={filters.module}
                    onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Modules</option>
                    <option value="Task Management">Task Management</option>
                    <option value="Employee Management">Employee Management</option>
                    <option value="Group Management">Group Management</option>
                    <option value="Question Management">Question Management</option>
                    <option value="Authentication">Authentication</option>
                    <option value="Email Service">Email Service</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="event-select" className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    id="event-select"
                    value={filters.eventType}
                    onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Events</option>
                    <option value="Task Completion">Task Completion</option>
                    <option value="Task Reassignment">Task Reassignment</option>
                    <option value="Admin Task Reassignment">Admin Task Reassignment</option>
                    <option value="Bulk Task Reassignment">Bulk Task Reassignment</option>
                    <option value="User Creation">User Creation</option>
                    <option value="Group Creation">Group Creation</option>
                    <option value="Group Update">Group Update</option>
                    <option value="Group Deletion">Group Deletion</option>
                    <option value="Question Creation">Question Creation</option>
                    <option value="Question Update">Question Update</option>
                    <option value="Question Deletion">Question Deletion</option>
                    <option value="Employee Processing">Employee Processing</option>
                    <option value="User Sign-In">User Sign-In</option>
                    <option value="User Sign-Out">User Sign-Out</option>
                    <option value="Email Notification">Email Notification</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date-from" className="block text-sm font-medium mb-2">From Date</label>
                  <input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="date-to" className="block text-sm font-medium mb-2">To Date</label>
                  <input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Audit Trail Logs
                  <span className="ml-2 px-2 py-1 bg-muted rounded-md text-sm font-normal">
                    {filteredAuditLogs.length} entries
                  </span>
                </CardTitle>
                <Button
                  onClick={() => handleExportReport('Audit Logs')}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Export Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] min-w-[100px]">User</TableHead>
                      <TableHead className="w-[140px] min-w-[120px]">Module</TableHead>
                      <TableHead className="w-[120px] min-w-[100px]">Event</TableHead>
                      <TableHead className="flex-1 min-w-[300px]">Details</TableHead>
                      <TableHead className="w-[140px] min-w-[120px]">Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${animationClasses.spin}`}></div>
                            Loading audit logs...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {currentAuditLogs.length > 0 ? (
                          currentAuditLogs.map((log) => (
                            <TableRow 
                              key={log.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="font-medium truncate max-w-[120px] min-w-[100px]" title={log.userName}>
                                {log.userName}
                              </TableCell>
                              <TableCell className="truncate max-w-[140px] min-w-[120px]" title={log.moduleName}>
                                <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getModuleBadgeColor(log.moduleName)}`}>
                                  {log.moduleName}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium truncate max-w-[120px] min-w-[100px]" title={log.eventName}>
                                {log.eventName}
                              </TableCell>
                              <TableCell className="min-w-[300px]">
                                <div className="space-y-1">
                                  <p className="text-sm text-foreground break-words">{log.systemRemarks}</p>
                                  {(log.oldValue || log.newValue) && (
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      {log.oldValue && (
                                        <span className="break-words">
                                          <span className="font-medium text-red-600">Old:</span> {log.oldValue}
                                        </span>
                                      )}
                                      {log.oldValue && log.newValue && <span className="text-muted-foreground">→</span>}
                                      {log.newValue && (
                                        <span className="break-words">
                                          <span className="font-medium text-green-600">New:</span> {log.newValue}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap min-w-[120px]">
                                {new Date(log.datetime).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="text-sm font-semibold text-foreground">No audit logs found</h3>
                              <p className="text-sm text-muted-foreground">
                                No audit trail entries match your current filters.
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAuditLogs.length)} of {filteredAuditLogs.length} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || 
                                 page === totalPages || 
                                 (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
