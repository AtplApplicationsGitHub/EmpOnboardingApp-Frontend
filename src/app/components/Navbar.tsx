"use client";

import React from "react";
import { useAuth } from "../auth/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import {
  Home,
  Users,
  HelpCircle,
  LogOut,
  UserPlus,
  Settings,
  ClipboardListIcon,
  ScrollText,
  MapPin,
  FlaskConical,
  Archive,
  FileBarChart,
  FileCheck
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import {
  useAnimation,
  animationClasses,
  staggerClasses,
} from "../lib/animations";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isVisible = useAnimation();

  if (!user) return null;

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-56 bg-card border-r border-border ${isVisible ? animationClasses.slideInLeft : "opacity-0"
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-foreground">
              Onboarding App
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {" "}
            {user.role === "admin" && (
              <>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/admin/groups"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/groups"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Groups</span>
                </Link>{" "}
                <Link
                  href="/admin/labs"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/labs"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FlaskConical className="h-4 w-4" />
                  <span>Manage Departments</span>
                </Link>
                <Link
                  href="/admin/employees"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/employees"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Process Employees</span>
                </Link>
                <Link
                  href="/admin/archived-employees"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/archived-employees"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Archive className="h-4 w-4" />
                  <span>Archived Employees</span>
                </Link>
                <Link
                  href="/admin/tasks"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/tasks"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ClipboardListIcon className="h-4 w-4" />
                  <span>Manage Tasks</span>
                </Link>
                <Link
                  href="/admin/users"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/users"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage Users</span>
                </Link>
                {/* <Link
                  href="/admin/audit-trail"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/audit-trail"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ScrollText className="h-4 w-4" />
                  <span>Audit Trail</span>
                </Link> */}
                {/* <Link
                  href="/admin/onboardingstatus-report"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/onboardingstatus-report"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FileBarChart className="h-4 w-4" />
                  <span>Status Report</span>
                </Link> */}
                <Link
                  href="/admin/acknowledgement"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/admin/acknowledgement"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Acknowledgement</span>
                </Link>
              </>
            )}
            {user.role === "group_lead" && (
              <>
                <Link
                  href="/group-lead"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/group-lead"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/group-lead/tasks"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/group-lead/tasks"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage Tasks</span>
                </Link>
              </>
            )}
            {user.role === "employee" && (
              <>
                <Link
                  href="/employee"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/employee"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/employee/my-tasks"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === "/employee/my-tasks"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ClipboardListIcon className="h-4 w-4" />
                  <span>Onboarding Checklist</span>
                </Link>

              </>
            )}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.role === "admin"
                  ? "Administrator"
                  : user.role === "group_lead"
                    ? "Group Lead"
                    : "Employee"}
              </span>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
