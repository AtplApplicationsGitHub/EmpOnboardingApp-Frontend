"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthContext";
import { cn } from "../lib/utils";
import ThemeToggle from "./ThemeToggle";
import { useAnimation, animationClasses } from "../lib/animations";
import {
  Home,
  Users,
  UserPlus,
  Settings,
  ClipboardListIcon,
  FlaskConical,
  Archive,
  FileCheck,
  LogOut,
} from "lucide-react";

const itemBase =
  "group relative flex items-center  gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all";
const itemIdle =
  "text-[#4a5568] hover:text-[#3448c3] hover:bg-[rgba(76,81,191,0.08)] hover:translate-x-1";
const itemActive =
  "bg-[#4c51bf] text-white shadow-md translate-x-2"; // pill + slide
const iconBase = "h-5 w-5 shrink-0";
const iconIdle = "text-[#6b6fcf] group-hover:text-inherit";
const iconActive = "text-white";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isVisible = useAnimation();

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
    >
      {/* left accent for active like HTML ::before */}
      {active && (
        <span className="absolute -left-3 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r bg-[#4c51bf]" />
      )}
      <Icon className={cn(iconBase, active ? iconActive : iconIdle)} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-[#e2e8f0] shadow-[4px_0_12px_rgba(0,0,0,0.08)]",
        isVisible ? animationClasses.slideInLeft : "opacity-0"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Title */}
        <div className="flex h-20 items-center justify-center border-b border-[#e2e8f0] px-5">
          <span className="text-[22px] font-bold tracking-wide text-[#4c51bf]">
            Onboarding App
          </span>
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
                  href="/admin/groups"
                  label="Manage Groups"
                  active={pathname === "/admin/groups"}
                  Icon={Users}
                />
                <NavItem
                  href="/admin/labs"
                  label="Manage Departments"
                  active={pathname === "/admin/labs"}
                  Icon={FlaskConical}
                />
                <NavItem
                  href="/admin/employees"
                  label="Process Employees"
                  active={pathname === "/admin/employees"}
                  Icon={UserPlus}
                />
                <NavItem
                  href="/admin/archived-employees"
                  label="Archived Employees"
                  active={pathname === "/admin/archived-employees"}
                  Icon={Archive}
                />
                <NavItem
                  href="/admin/tasks"
                  label="Manage Tasks"
                  active={pathname === "/admin/tasks"}
                  Icon={ClipboardListIcon}
                />
                <NavItem
                  href="/admin/users"
                  label="Manage Users"
                  active={pathname === "/admin/users"}
                  Icon={Settings}
                />
                <NavItem
                  href="/admin/acknowledgement"
                  label="Acknowledgement"
                  active={pathname === "/admin/acknowledgement"}
                  Icon={FileCheck}
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
                  label="Manage Tasks"
                  active={pathname === "/group-lead/tasks"}
                  Icon={Settings}
                />
                <NavItem
                  href="/group-lead/acknowledgement"
                  label="Acknowledgement"
                  active={pathname === "/group-lead/acknowledgement"}
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
                  Icon={ClipboardListIcon}
                />
              </>
            )}
          </div>
        </nav>

        {/* Bottom user card */}
        <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 pshadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#4c51bf] text-[16px] font-bold text-white">
                {initial}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#2d3748]">
                  {user.name}
                </span>
                <span className="text-[12px] text-[#718096]">{roleLabel}</span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium text-[#4a5568] transition-colors hover:bg-[#f7fafc]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
