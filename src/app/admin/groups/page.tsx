"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/api";
import { DropDownDTO, Group } from "../../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import Button from "../../components/ui/button";
import SearchableDropdown from "../../components/SearchableDropdown";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  AlertTriangle,
  HelpCircle,
  Copy,
} from "lucide-react";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 10;

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [newPrimaryGroupLeadId, setNewPrimaryGroupLeadId] = useState<number | undefined>();
  const [newEscalationGroupLeadId, setNewEscalationGroupLeadId] = useState<number | undefined>();
  const [editPrimaryGroupLeadId, setEditPrimaryGroupLeadId] = useState<number | undefined>();
  const [editEscalationGroupLeadId, setEditEscalationGroupLeadId] = useState<number | undefined>();
  const [newAutoAssign, setNewAutoAssign] = useState<string>("Yes");
  const [editAutoAssign, setEditAutoAssign] = useState<string>("Yes");

  // Store selected options for each dropdown separately
  const [newPrimarySelectedOptions, setNewPrimarySelectedOptions] = useState<DropDownDTO[]>([]);
  const [newEscalationSelectedOptions, setNewEscalationSelectedOptions] = useState<DropDownDTO[]>([]);
  const [editPrimarySelectedOptions, setEditPrimarySelectedOptions] = useState<DropDownDTO[]>([]);
  const [editEscalationSelectedOptions, setEditEscalationSelectedOptions] = useState<DropDownDTO[]>([]);

  // Auto assign dropdown options
  const autoAssignOptions: DropDownDTO[] = [
    { id: 1, key: "Yes", value: "Yes" },
    { id: 0, key: "No", value: "No" }
  ];

  // Async search function for group leads
  const searchGroupLeads = async (searchTerm: string): Promise<DropDownDTO[]> => {
    try {
      // Call your API with the search term
      // Assuming your API supports search parameter
      const results = await adminService.searchGroupLeads(searchTerm);
      return results;
    } catch (err: any) {
      console.error("Failed to search group leads:", err);
      return [];
    }
  };

  // Filter out the already selected lead from the other dropdown
  const getFilteredSearchFunction = (excludeId?: number) => {
    return async (searchTerm: string): Promise<DropDownDTO[]> => {
      const results = await searchGroupLeads(searchTerm);
      if (excludeId == null) return results;
      return results.filter((opt) => opt.id !== excludeId);
    };
  };

  const fetchPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const groupsResponse = await adminService.getGroups(page);
      setGroups(groupsResponse.commonListDto || []);
      setTotal(groupsResponse.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lead details by name (for edit mode initialization)
  const fetchLeadByName = async (name?: string): Promise<DropDownDTO | null> => {
    if (!name) return null;
    try {
      // Search for the lead by name to get the full object
      const results = await searchGroupLeads(name);
      return results.find((lead) => lead.key === name) || null;
    } catch (err) {
      console.error("Failed to fetch lead details:", err);
      return null;
    }
  };

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setError("Group name is required");
      return;
    }
    if (!newPrimaryGroupLeadId) {
      setError("Primary group lead is required");
      return;
    }

    const payload = {
      name: newGroupName.trim(),
      pgLead: newPrimaryGroupLeadId,
      egLead: newEscalationGroupLeadId,
      autoAssign: newAutoAssign,
    };

    try {
      await adminService.createGroup(payload);
      setShowCreateModal(false);
      setNewGroupName("");
      setNewPrimaryGroupLeadId(undefined);
      setNewEscalationGroupLeadId(undefined);
      setNewAutoAssign("Yes");
      setNewPrimarySelectedOptions([]);
      setNewEscalationSelectedOptions([]);
      setCurrentPage(0);
      await fetchPage(0);
      toast.success("Group created successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create group");
    }
  };

  // Edit Group
  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editGroupName.trim()) {
      setError("Group name is required");
      return;
    }
    if (!editPrimaryGroupLeadId) {
      setError("Primary group lead is required");
      return;
    }

    const payload = {
      id: editingGroup.id,
      name: editGroupName.trim(),
      pgLead: editPrimaryGroupLeadId,
      egLead: editEscalationGroupLeadId,
      autoAssign: editAutoAssign,
    };

    try {
      await adminService.updateGroup(payload);
      setShowEditModal(false);
      setEditingGroup(null);
      setEditGroupName("");
      setEditPrimaryGroupLeadId(undefined);
      setEditEscalationGroupLeadId(undefined);
      setEditAutoAssign("Yes");
      setEditPrimarySelectedOptions([]);
      setEditEscalationSelectedOptions([]);
      await fetchPage(currentPage);
      toast.success("Group updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update group");
    }
  };

  // Delete Group
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await adminService.deleteGroup(groupToDelete.id);
      await fetchPage(currentPage);
      setShowDeleteModal(false);
      setGroupToDelete(null);
      toast.success("Group deleted successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete group");
    }
  };

  // Open Edit Modal - fetch lead details
  const openEditModal = async (group: Group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditAutoAssign(group.autoAssign ?? "Yes");

    // Fetch primary lead details
    const primaryLead = await fetchLeadByName(group.pgLead);
    if (primaryLead) {
      setEditPrimaryGroupLeadId(primaryLead.id);
      setEditPrimarySelectedOptions([primaryLead]);
    } else {
      setEditPrimaryGroupLeadId(undefined);
      setEditPrimarySelectedOptions([]);
    }

    // Fetch escalation lead details
    const escalationLead = await fetchLeadByName(group.egLead);
    if (escalationLead) {
      setEditEscalationGroupLeadId(escalationLead.id);
      setEditEscalationSelectedOptions([escalationLead]);
    } else {
      setEditEscalationGroupLeadId(undefined);
      setEditEscalationSelectedOptions([]);
    }

    setShowEditModal(true);
  };

  const clone = async (group: Group) => {
    if (!group) return;
    try {
      await adminService.cloneGroup(group);
      await fetchPage(0);
      toast.success('Cloned successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to clone group");
    }
  };

  // Pagination numbers
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
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
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading groups...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-bold tracking-wide text-[#4c51bf]">Manage Groups</h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            Create and manage department groups for the onboarding process
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Group
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-destructive/70 hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[17px] flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  {group.name}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(group)}
                    className="rounded-lg text-[#4c51bf] transition-colors duration-300 hover:text-[#2e31a8] hover:bg-[rgba(76,81,191,0.08)]"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => clone(group)}
                    className="rounded-lg text-[#7c3aed] transition-colors duration-300 hover:text-[#5b21b6] hover:bg-[rgba(124,58,237,0.08)]"
                  >
                    <Copy size={18} />
                  </button>
                  {group.deleteFlag && (
                    <button
                      onClick={() => {
                        setGroupToDelete(group);
                        setShowDeleteModal(true);
                      }}
                      className=" rounded-lg text-red-500  transition-colors duration-300 hover:text-[#be123c] hover:bg-[rgba(225,29,72,0.08)]  "
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Created: {group.createdTime}</div>
                  <div>Last Updated: {group.updatedTime}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck size={14} className="text-green-500" />
                    <span className="font-medium">Primary Lead:</span>
                    <span
                      className={
                        group.pgLead
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {group.pgLead || "Not assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle size={14} className="text-orange-500" />
                    <span className="font-medium">Escalation Lead:</span>
                    <span
                      className={
                        group.egLead
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {group.egLead || "Not assigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <HelpCircle size={14} className="text-blue-500" />
                    <span className="font-medium">Questions:</span>
                    <span className="text-foreground font-semibold">
                      {group.quesCount ?? 0}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/admin/groups/${group.id}`)
                    }
                    className="w-full"
                  >
                    Manage Questions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Groups Found</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  Get started by creating your first department group
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} className="mr-2" />
                  Create First Group
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="p-2"
            >
              {"<<"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2"
            >
              {"<"}
            </Button>
            {generatePageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={index} className="px-3 py-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page as number}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page as number)}
                  className="min-w-[40px]"
                >
                  {(page as number) + 1}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="p-2"
            >
              {">"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className="p-2"
            >
              {">>"}
            </Button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="flex-shrink-0 px-5 py-4 shadow-md">
              <CardTitle className="text-1xl font-semibold text-primary-gradient">
                Create New Group
              </CardTitle>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)] px-8 py-6">
              <form onSubmit={handleCreateGroup} id="createGroupForm" className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Engineering, Marketing, Sales"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Primary Group Lead <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={newPrimaryGroupLeadId}
                    onChange={(val) => {
                      setNewPrimaryGroupLeadId(val as number | undefined);
                    }}
                    placeholder="Type 3+ characters to search..."
                    required={true}
                    maxDisplayItems={4}
                    className="w-full"
                    onSearch={getFilteredSearchFunction(newEscalationGroupLeadId)}
                    minSearchLength={3}
                    initialSelectedOptions={newPrimarySelectedOptions}
                    usePortal={true}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Escalation Group Lead{" "}
                    <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <SearchableDropdown
                    value={newEscalationGroupLeadId}
                    onChange={(val) => {
                      setNewEscalationGroupLeadId(val as number | undefined);
                    }}
                    placeholder="Type 3+ characters to search..."
                    required={false}
                    maxDisplayItems={4}
                    className="w-full"
                    onSearch={getFilteredSearchFunction(newPrimaryGroupLeadId)}
                    minSearchLength={3}
                    initialSelectedOptions={newEscalationSelectedOptions}
                    usePortal={true}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Assign Task
                  </label>
                  <SearchableDropdown
                    options={autoAssignOptions}
                    value={
                      autoAssignOptions.find(
                        (option) => option.value === newAutoAssign
                      )?.id
                    }
                    onChange={(id) => {
                      const selectedValue = autoAssignOptions.find(
                        (option) => option.id === id
                      )?.value;
                      setNewAutoAssign(selectedValue || "Yes");
                    }}
                    placeholder="Select auto assign option"
                    required={false}
                    maxDisplayItems={4}
                    isEmployeePage={true}
                    displayFullValue={false}
                    className="w-full"
                    usePortal={true}
                  />
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName("");
                    setNewPrimaryGroupLeadId(undefined);
                    setNewEscalationGroupLeadId(undefined);
                    setNewPrimarySelectedOptions([]);
                    setNewEscalationSelectedOptions([]);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  form="createGroupForm"
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
              shadow-md transition-all duration-300 ease-in-out 
              hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
              disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
            <div className="flex-shrink-0 px-5 py-4 shadow-md">
              <CardTitle className="text-1xl font-semibold text-primary-gradient">
                Edit Group
              </CardTitle>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)] px-8 py-6">
              <form onSubmit={handleEditGroup} id="editGroupForm" className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    placeholder="e.g., Engineering, Marketing, Sales"
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-gray-300 rounded-lg text-sm transition-all focus:outline-none focus:border-indigo-600 focus:ring-[3px] focus:ring-indigo-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Primary Group Lead <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    value={editPrimaryGroupLeadId}
                    onChange={(val) => {
                      setEditPrimaryGroupLeadId(val as number | undefined);
                    }}
                    placeholder="Type 3+ characters to search..."
                    required={true}
                    maxDisplayItems={4}
                    className="w-full"
                    onSearch={getFilteredSearchFunction(editEscalationGroupLeadId)}
                    minSearchLength={3}
                    initialSelectedOptions={editPrimarySelectedOptions}
                    usePortal={true}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Escalation Group Lead{" "}
                    <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <SearchableDropdown
                    value={editEscalationGroupLeadId}
                    onChange={(val) => {
                      setEditEscalationGroupLeadId(val as number | undefined);
                    }}
                    placeholder="Type 3+ characters to search..."
                    required={false}
                    maxDisplayItems={4}
                    className="w-full"
                    onSearch={getFilteredSearchFunction(editPrimaryGroupLeadId)}
                    minSearchLength={3}
                    initialSelectedOptions={editEscalationSelectedOptions}
                    usePortal={true}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-2">
                    Assign Task
                  </label>
                  <SearchableDropdown
                    options={autoAssignOptions}
                    value={
                      autoAssignOptions.find(
                        (option) => option.value === editAutoAssign
                      )?.id
                    }
                    onChange={(id) => {
                      const selectedValue = autoAssignOptions.find(
                        (option) => option.id === id
                      )?.value;
                      setEditAutoAssign(selectedValue || "Yes");
                    }}
                    placeholder="Select auto assign option"
                    required={false}
                    maxDisplayItems={4}
                    className="w-full"
                    isEmployeePage={true}
                    displayFullValue={false}
                    usePortal={true}
                  />
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 flex justify-end items-center px-8 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGroup(null);
                    setEditGroupName("");
                    setEditPrimaryGroupLeadId(undefined);
                    setEditEscalationGroupLeadId(undefined);
                    setEditPrimarySelectedOptions([]);
                    setEditEscalationSelectedOptions([]);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  form="editGroupForm"
                  className="px-6 py-2.5 bg-primary-gradient text-white rounded-lg text-sm font-semibold 
              shadow-md transition-all duration-300 ease-in-out 
              hover:bg-[#3f46a4] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 
              disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && groupToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Delete Group</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Are you sure you want to delete the group{" "}
                <span className="font-semibold">{groupToDelete.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGroupToDelete(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteGroup}
                  className="flex-1"
                >
                  Yes, Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;