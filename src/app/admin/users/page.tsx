"use client";

import React, { useState, useEffect, useRef } from "react";
import { adminService } from "../../services/api";
import { User, DropDownDTO } from "../../types";
import { Card, CardContent } from "../../components/ui/card";
import Button from "../../components/ui/button";
import Input from "../../components/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  Users,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Pencil,
  X,
  Trash,
} from "lucide-react";
import toast from "react-hot-toast";
import SearchableDropdown from "../../components/SearchableDropdown";


const PAGE_SIZE = 10;

const UsersPage: React.FC = () => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-based paging
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [roles, setRoles] = useState<DropDownDTO[]>([]);
  const [showLdapModal, setShowLdapModal] = useState(false);
  const [ldapUsers, setLdapUsers] = useState<string[]>([]);
  const [ldapInputValue, setLdapInputValue] = useState("");
  const [ldapLoading, setLdapLoading] = useState(false);
  const [fetchedLdapUsers, setFetchedLdapUsers] = useState<(User & { emailError?: string })[]>([]);
  const [showLdapUsersTable, setShowLdapUsersTable] = useState(false);


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "group_lead" as "admin" | "group_lead",
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  interface MockLdapResponse {
    successUserInfoList: Array<{
      name: string;
      email: string;

    }>;
    failedUserList: string[];
  }


  // Fetch roles for dropdown
  const fetchRoles = async () => {
    try {
      const rolesData = await adminService.getLookupItems("Role");
      console.log("Roles fetched:", rolesData);
      setRoles(rolesData);
    } catch (error) {
      toast.error("Failed to load user roles.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (showCreateModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [searchFilter, currentPage, showCreateModal]);

  const fetchUsers = async () => {
    try {
      // setLoading(true);
      const params: any = { page: currentPage };
      if (searchFilter && searchFilter.trim() !== "") {
        params.search = searchFilter.trim();
      }
      const response = await adminService.getUsers(params);
      setUsers(response.commonListDto || []);
      setTotal(response.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      // setLoading(false);
    }
  };



  // 1. CREATE
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      toast.error("All fields are required");
      return;
    }
    try {
      console.log("Creating user with data:", formData);
      await adminService.createUser(formData);
      setFormData({ name: "", email: "", password: "", role: "group_lead" });
      setShowCreateModal(false);
      toast.success("User created successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  // 2. UPDATE
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    if (!formData.name.trim() || !formData.role.trim()) {
      toast.error("Name and Role are required");
      return;
    }
    try {
      // For update, you may not need to send password if not changing it
      const updatePayload = {
        id: selectedUserId,
        name: formData.name,
        role: formData.role,
      };
      await adminService.updateUser(updatePayload);
      setShowCreateModal(false);
      setFormData({ name: "", email: "", password: "", role: "group_lead" });
      setEditMode(false);
      setSelectedUserId(null);
      toast.success("User updated successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleEmailChange = async (value: string) => {
    setFormData({ ...formData, email: value });
    if (!value || editMode) return;
    setCheckingEmail(true);
    try {
      const res = await adminService.isEmailExists(value);
      setEmailExists(res);
    } catch (error) {
      console.error("Email check failed", error);
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validatePassword = (password: string) => {
    const rules = [
      { regex: /.{8,}/, message: "At least 8 characters" },
      { regex: /[A-Z]/, message: "At least one uppercase letter" },
      { regex: /[a-z]/, message: "At least one lowercase letter" },
      { regex: /[0-9]/, message: "At least one number" },
      {
        regex: /[!@#$%^&*(),.?":{}|<>]/,
        message: "At least one special character",
      },
    ];

    for (const rule of rules) {
      if (!rule.regex.test(password)) {
        return rule.message;
      }
    }
    return null;
  };

  // Reset Modal
  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "group_lead" });
    setShowCreateModal(false);
    setEditMode(false);
    setSelectedUserId(null);
  };

  // Search logic
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(searchInput);
    setCurrentPage(0);
  };

  // For update: open modal, load user data by id
  const handleEditUser = async (userId: number) => {
    try {
      // setLoading(true);
      const user = await adminService.findById(userId);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role as "admin" | "group_lead",
      });
      setEditMode(true);
      setSelectedUserId(userId);
      setShowCreateModal(true);
    } catch (err: any) {
      toast.error("Failed to load user");
    } finally {
      // setLoading(false);
    }
  };

  const handleLdapKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ldapInputValue.trim()) {
      e.preventDefault();
      const username = ldapInputValue.trim();
      if (!ldapUsers.includes(username)) {
        setLdapUsers([...ldapUsers, username]);
      }
      setLdapInputValue("");
    }
  };

  const removeLdapUser = (username: string) => {
    setLdapUsers(ldapUsers.filter(u => u !== username));
  };

  // Handle Add LDAP User
  const handleGetLdapUsers = async () => {
    if (ldapUsers.length === 0) {
      toast.error("Please add at least one LDAP username");
      return;
    }

    try {
      setLdapLoading(true);

      const response = await adminService.getLdapUsers(ldapUsers);

      console.log("LDAP API Response:", response);

      const usersArray = response.successUsers || [];

      console.log("Users Array:", usersArray);
      // console.log("Array Length:", usersArray.length);

      if (!Array.isArray(usersArray) || usersArray.length === 0) {
        toast.error("No users found in LDAP");
        setShowLdapUsersTable(false);
        setFetchedLdapUsers([]);
        return;
      }

      const initializedUsers = usersArray.map((user, index) => ({
        id: index + 1,
        name: user.name,
        email: user.email,
        role: "group_lead" as "admin" | "group_lead",
      }));

      // console.log("Initialized Users:", initializedUsers);

      setFetchedLdapUsers(initializedUsers);
      setShowLdapUsersTable(true);

      // console.log("State Updated Successfully");
      // console.log("Show Table:", true);
      // console.log("Fetched Users Count:", initializedUsers.length);

      if (initializedUsers.length > 0) {
        toast.success(`Successfully fetched ${initializedUsers.length} LDAP user(s)`);
      }
    } catch (err: any) {
      console.error("LDAP Fetch Error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch LDAP users");
      setShowLdapUsersTable(false);
      setFetchedLdapUsers([]);
    } finally {
      setLdapLoading(false);
    }
  };

  //save ldap user
  const handleSaveLdapUsers = async () => {
    if (fetchedLdapUsers.length === 0) {
      toast.error("No users to save");
      return;
    }

    try {
      setLdapLoading(true);

      // Check emails individually
      const emailValidationPromises = fetchedLdapUsers.map(user =>
        adminService.isEmailExists(user.email)
      );

      const emailExistsResults = await Promise.all(emailValidationPromises);

      // Map users with per-user email error
      const updatedUsers = fetchedLdapUsers.map((user, index) => ({
        ...user,
        emailError: emailExistsResults[index] ? "Email already exists" : undefined,
      }));

      setFetchedLdapUsers(updatedUsers);

      // Stop saving if any email exists
      if (emailExistsResults.some(exists => exists)) {
        // toast.error("Please fix the errors before saving.");
        setLdapLoading(false);
        return;
      }

      // Save users if no errors
      await adminService.saveLdapUsers(fetchedLdapUsers);

      toast.success(`Successfully saved ${fetchedLdapUsers.length} LDAP user(s)`);

      // Reset modal state
      setShowLdapModal(false);
      setLdapUsers([]);
      setLdapInputValue("");
      setFetchedLdapUsers([]);
      setShowLdapUsersTable(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save LDAP users");
    } finally {
      setLdapLoading(false);
    }
  };


  // Pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
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
          <div className="text-muted-foreground">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header with Search and Add User */}
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
        </form>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowLdapModal(true)}

            className="flex items-center gap-2"
          >
            <Users size={16} />
            Add LDAP User
          </Button>
          <Button
            onClick={() => {
              setFormData({
                name: "",
                email: "",
                password: "",
                role: "group_lead",
              });
              setEditMode(false);
              setSelectedUserId(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add New User
          </Button>
        </div>
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

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-sm text-muted-foreground">
              Showing {users.length > 0 ? currentPage * PAGE_SIZE + 1 : 0} to{" "}
              {Math.min((currentPage + 1) * PAGE_SIZE, total)} of {total} users
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={48} className="text-muted-foreground" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-2">
                      {user.role === "admin" ? (
                        <Shield size={16} className="text-red-500" />
                      ) : (
                        <UserCheck size={16} className="text-blue-500" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-1 hover:bg-transparent hover:text-primary"
                        onClick={() => handleEditUser(user.id)}
                      >
                        <Pencil size={14} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === "admin"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                      >
                        {user.role === "admin" ? "Administrator" : "Group Lead"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdTime}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.updatedTime}
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
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="p-2"
                >
                  <ChevronLeft size={16} />
                </Button>
                {generatePageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === "..." ? (
                      <span className="px-3 py-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="min-w-[40px]"
                      >
                        {(page as number) + 1}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2"
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="p-2"
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Update User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? "Update User" : "Create New User"}
            </h2>
            <form
              onSubmit={editMode ? handleUpdateUser : handleCreateUser}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  id="name"
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter user's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled={editMode}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Enter user's email address"
                  required
                />
                {!editMode && emailExists && (
                  <p className="text-red-500 text-sm mt-1">
                    Email already exists
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      role: e.target.value as "admin" | "group_lead",
                    });
                  }}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.key}>
                      {role.key}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password only for create */}
              {!editMode && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, password: value });
                      setPasswordError(validatePassword(value));
                    }}
                    placeholder="Enter password"
                    required
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    emailExists ||
                    checkingEmail ||
                    (!!passwordError && !editMode)
                  }
                >
                  {editMode ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/*ldap module*/}
      {showLdapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Bulk Import LDAP Users</h2>
              <X
                size={24}
                className="text-foreground  cursor-pointer transition-colors"
                onClick={() => {
                  setShowLdapModal(false);
                  setLdapUsers([]);
                  setLdapInputValue("");
                  setFetchedLdapUsers([]);
                  setShowLdapUsersTable(false);
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-primary transition-all"
                    style={{
                      minHeight: '42px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {ldapUsers.map((user, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                        >
                          {user}
                          <button
                            type="button"
                            onClick={() => removeLdapUser(user)}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                            disabled={ldapLoading}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        value={ldapInputValue}
                        onChange={(e) => setLdapInputValue(e.target.value)}
                        onKeyDown={handleLdapKeyDown}
                        placeholder={ldapUsers.length === 0 ? "Type username and press Enter" : ""}
                        autoFocus
                        disabled={ldapLoading}
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGetLdapUsers}
                  disabled={ldapLoading || ldapUsers.length === 0}
                  className="whitespace-nowrap h-[42px]"
                >
                  {ldapLoading ? "Getting Users..." : "Get Users"}
                </Button>
              </div>

              {/* Fetched Users Table */}
              {showLdapUsersTable && fetchedLdapUsers.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">
                      Fetched Users ({fetchedLdapUsers.length})
                    </h3>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fetchedLdapUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="w-8">
                              {user.emailError && (
                                <button
                                  onClick={() => {
                                    const updatedUsers = [...fetchedLdapUsers];
                                    updatedUsers.splice(index, 1);
                                    setFetchedLdapUsers(updatedUsers);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete user"
                                >
                                  <Trash size={16} />
                                </button>
                              )}
                            </TableCell>


                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex flex-col">
                                {user.email}
                                {user.emailError && (
                                  <span className="text-red-500 text-xs mt-1">{user.emailError}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <SearchableDropdown
                                options={roles}
                                value={roles.find((r) => r.key === user.role)?.id}
                                onChange={(selectedId) => {
                                  const selectedRole = roles.find((r) => r.id === selectedId);
                                  if (selectedRole) {
                                    const updatedUsers = [...fetchedLdapUsers];
                                    updatedUsers[index].role = selectedRole.key as "admin" | "group_lead";
                                    setFetchedLdapUsers(updatedUsers);
                                  }
                                }}
                                placeholder="Select role"
                                isMultiSelect={false}
                                className="w-full"
                                isEmployeePage={true}
                                displayFullValue={false}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                {showLdapUsersTable && fetchedLdapUsers.length > 0 && (
                  <Button
                    onClick={handleSaveLdapUsers}
                    disabled={ldapLoading || fetchedLdapUsers.some(u => u.emailError)}                  >
                    {ldapLoading
                      ? "Saving..."
                      : `Save ${fetchedLdapUsers.length} User${fetchedLdapUsers.length !== 1 ? 's' : ''}`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersPage;
