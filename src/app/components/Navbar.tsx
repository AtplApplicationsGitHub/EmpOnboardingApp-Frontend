"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthContext";
import { cn } from "../lib/utils";
import { useAnimation, animationClasses } from "../lib/animations";
import { useSidebar } from "./SidebarContext";
import {
  Home,
  Users,
  UserPlus,
  Settings,
  ClipboardList,
  FlaskConical,
  Archive,
  FileCheck,
  LogOut,
  Building2,
  FileQuestion,
  Menu,
  ChevronLeft,
  User
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

// ✅ UPDATED: Using CSS variables for automatic light/dark mode support
const itemBase =
  "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all";
const itemIdle =
  "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:translate-x-1";
const itemActive =
  "bg-primary text-primary-foreground shadow-md translate-x-2";
const iconBase = "h-5 w-5 shrink-0";
const iconIdle = "text-muted-foreground group-hover:text-inherit";
const iconActive = "text-primary-foreground";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isVisible = useAnimation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  if (!user) return null;

  const initial = (user.name || "A").trim().charAt(0).toUpperCase();
  const roleLabel =
    user.role === "admin"
      ? "Administrator"
      : user.role === "group_lead"
        ? "Group Lead"
        : "Employee";

  const NavItem = ({
    href,
    label,
    active,
    Icon,
  }: {
    href: string;
    label: string;
    active: boolean;
    Icon: React.ElementType;
  }) => (
    <Link
      href={href}
      className={cn(itemBase, active ? itemActive : itemIdle)}
      title={isCollapsed ? label : ''}
    >
      {active && !isCollapsed && (
        <span className="absolute -left-3 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r bg-primary" />
      )}
      <Icon className={cn(iconBase, active ? iconActive : iconIdle)} />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <div
      className={cn(
        // ✅ CHANGED: bg-white → bg-card, border-[#e2e8f0] → border-border
        "fixed inset-y-0 left-0 z-50 bg-card border-r border-border shadow-lg transition-all duration-300",
        isCollapsed ? "w-20" : "w-56",
        isVisible ? animationClasses.slideInLeft : "opacity-0"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Title with toggle button */}
        <div className="flex h-20 items-center justify-between border-b border-border px-5">
          {!isCollapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img 
                src="/assets/Icon.jpg" 
                alt="Company Logo" 
                className="h-8 w-auto object-contain flex-shrink-0"
              />
              {/* ✅ CHANGED: text-[#4c51bf] → text-primary */}
              <span className="text-[17px] font-bold tracking-wide text-primary whitespace-nowrap">
                Onboarding
              </span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              // ✅ CHANGED: hover:bg-[rgba(76,81,191,0.08)] → hover:bg-primary/10
              "p-2 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0",
              isCollapsed && "mx-auto"
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-primary" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-primary" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-2">
            {user.role === "admin" && (
              <>
                <NavItem
                  href="/admin"
                  label="Dashboard"
                  active={pathname === "/admin"}
                  Icon={Home}
                />
                <NavItem
                  href="/admin/users"
                  label="Users"
                  active={pathname === "/admin/users"}
                  Icon={User}
                />
                <NavItem
                  href="/admin/groups"
                  label="Groups"
                  active={pathname === "/admin/groups"}
                  Icon={Users}
                />
                <NavItem
                  href="/admin/departments"
                  label="Departments"
                  active={pathname === "/admin/departments"}
                  Icon={Building2}
                />
                <NavItem
                  href="/admin/labs"
                  label="Labs"
                  active={pathname === "/admin/labs"}
                  Icon={FlaskConical}
                />
                <NavItem
                  href="/admin/employee-questionnaire"
                  label="Employee Questionnaire"
                  active={pathname === "/admin/employee-questionnaire"}
                  Icon={FileQuestion}
                />
                <NavItem
                  href="/admin/employees"
                  label="Process Employees"
                  active={pathname === "/admin/employees"}
                  Icon={UserPlus}
                />
                <NavItem
                  href="/admin/tasks"
                  label="Tasks"
                  active={pathname === "/admin/tasks"}
                  Icon={ClipboardList}
                />
                <NavItem
                  href="/admin/engineer-verification"
                  label="Verification"
                  active={pathname === "/admin/engineer-verification"}
                  Icon={FileCheck}
                />
                <NavItem
                  href="/admin/archived-employees"
                  label="Archived Employees"
                  active={pathname === "/admin/archived-employees"}
                  Icon={Archive}
                />
              </>
            )}

            {user.role === "group_lead" && (
              <>
                <NavItem
                  href="/group-lead"
                  label="Dashboard"
                  active={pathname === "/group-lead"}
                  Icon={Home}
                />
                <NavItem
                  href="/group-lead/tasks"
                  label="Tasks"
                  active={pathname === "/group-lead/tasks"}
                  Icon={Settings}
                />
                <NavItem
                  href="/group-lead/engineer-verification"
                  label="Verification"
                  active={pathname === "/group-lead/engineer-verification"}
                  Icon={FileCheck}
                />
              </>
            )}

            {user.role === "employee" && (
              <>
                <NavItem
                  href="/employee"
                  label="Dashboard"
                  active={pathname === "/employee"}
                  Icon={Home}
                />
                <NavItem
                  href="/employee/my-tasks"
                  label="Onboarding Checklist"
                  active={pathname === "/employee/my-tasks"}
                  Icon={ClipboardList}
                />
              </>
            )}
          </div>
        </nav>

        {/* Bottom user card */}
        <div className="border-t border-border bg-muted/30 p-5">
          {!isCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* ✅ CHANGED: bg-[#4c51bf] text-white → bg-primary text-primary-foreground */}
                  <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-primary text-[16px] font-bold text-primary-foreground">
                    {initial}
                  </div>
                  <div className="flex flex-col">
                    {/* ✅ CHANGED: text-[#2d3748] → text-foreground */}
                    <span className="text-[14px] font-semibold text-foreground">
                      {user.name}
                    </span>
                    {/* ✅ CHANGED: text-[#718096] → text-muted-foreground */}
                    <span className="text-[12px] text-muted-foreground">{roleLabel}</span>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <button
                onClick={logout}
                // ✅ CHANGED: All hardcoded colors → CSS variables
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-primary text-[16px] font-bold text-primary-foreground">
                {initial}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-accent"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}