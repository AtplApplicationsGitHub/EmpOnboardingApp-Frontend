"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

const PAGE_SIZE = 10;

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // Zero-based index
  const [groupLeads, setGroupLeads] = useState<DropDownDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [newPrimaryGroupLeadId, setNewPrimaryGroupLeadId] = useState<
    number | undefined
  >();
  const [newEscalationGroupLeadId, setNewEscalationGroupLeadId] = useState<
    number | undefined
  >();
  const [editPrimaryGroupLeadId, setEditPrimaryGroupLeadId] = useState<
    number | undefined
  >();
  const [editEscalationGroupLeadId, setEditEscalationGroupLeadId] = useState<
    number | undefined
  >();

  // Fetch paginated groups and group leads

  const getLeadIdByName = (name?: string) => {
    if (!name) return undefined;
    const found = groupLeads.find((lead) => lead.key === name);
    return found ? Number(found.value) : undefined;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const groupsResponse = await adminService.getGroups(currentPage);
        setGroups(groupsResponse.commonListDto || []);
        setTotal(groupsResponse.totalElements || 0);
        const groupLeadsData = await adminService.getAllGroupLeads();
        setGroupLeads(groupLeadsData);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [currentPage]);

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
    try {
      await adminService.createGroup({
        name: newGroupName.trim(),
        pgLead: newPrimaryGroupLeadId,
        egLead: newEscalationGroupLeadId,
      });
      setShowCreateModal(false);
      setNewGroupName("");
      setNewPrimaryGroupLeadId(undefined);
      setNewEscalationGroupLeadId(undefined);
      setCurrentPage(0);
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
    try {
      await adminService.updateGroup({
        id: editingGroup.id,
        name: editGroupName.trim(),
        pgLead: editPrimaryGroupLeadId,
        egLead: editEscalationGroupLeadId,
      });
      setShowEditModal(false);
      setEditingGroup(null);
      setEditGroupName("");
      setEditPrimaryGroupLeadId(undefined);
      setEditEscalationGroupLeadId(undefined);
      setCurrentPage(0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update group");
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await adminService.deleteGroup(groupId);
      setCurrentPage(0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete group");
    }
  };

  // Open Edit Modal
  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditPrimaryGroupLeadId(getLeadIdByName(group.pgLead));
    setEditEscalationGroupLeadId(getLeadIdByName(group.egLead));
    setShowEditModal(true);
  };

  // Pagination numbers (with ellipsis if you wish; here's a simple version)
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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Groups</h1>
          <p className="text-muted-foreground mt-2">
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
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  {group.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(group)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    Created:{" "}
                    {group.createdTime
                      ? new Date(group.createdTime).toLocaleDateString()
                      : "-"}
                  </div>
                  <div>
                    Last Updated:{" "}
                    {group.updatedTime
                      ? new Date(group.updatedTime).toLocaleDateString()
                      : "-"}
                  </div>
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
                  {/* <div className="flex items-center gap-2 text-sm">
                    <HelpCircle size={14} className="text-blue-500" />
                    <span className="font-medium">Questions:</span>
                    <span className="text-foreground font-semibold">
                      {group.question_count ?? 0}
                    </span>
                  </div> */}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Engineering, Marketing, Sales"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Primary Group Lead <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={groupLeads}
                    value={newPrimaryGroupLeadId}
                    onChange={setNewPrimaryGroupLeadId}
                    placeholder="Select a group lead (Required)"
                    required={true}
                    maxDisplayItems={4}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Escalation Group Lead{" "}
                    <span className="text-sm text-muted-foreground">
                      (Optional)
                    </span>
                  </label>
                  <SearchableDropdown
                    options={groupLeads}
                    value={newEscalationGroupLeadId}
                    onChange={setNewEscalationGroupLeadId}
                    placeholder="Select a group lead (Optional)"
                    required={false}
                    maxDisplayItems={4}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    Create Group
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewGroupName("");
                      setNewPrimaryGroupLeadId(undefined);
                      setNewEscalationGroupLeadId(undefined);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Primary Group Lead <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={groupLeads}
                    value={editPrimaryGroupLeadId}
                    onChange={setEditPrimaryGroupLeadId}
                    placeholder="Select a group lead (Required)"
                    required={true}
                    maxDisplayItems={4}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Escalation Group Lead{" "}
                    <span className="text-sm text-muted-foreground">
                      (Optional)
                    </span>
                  </label>
                  <SearchableDropdown
                    options={groupLeads}
                    value={editEscalationGroupLeadId}
                    onChange={setEditEscalationGroupLeadId}
                    placeholder="Select a group lead (Optional)"
                    required={false}
                    maxDisplayItems={4}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    Update Group
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingGroup(null);
                      setEditGroupName("");
                      setEditPrimaryGroupLeadId(undefined);
                      setEditEscalationGroupLeadId(undefined);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
