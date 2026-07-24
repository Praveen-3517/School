"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  ClipboardList,
  BarChart3,
  ScrollText,
  Settings,
  ChevronDown,
  UserPlus,
  GanttChart,
  CalendarDays,
  FileText,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { useState } from "react";
import type { Role } from "@/types/enums";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    icon: Users,
    children: [
      { label: "All Students", href: "/admin/students", icon: Users },
      { label: "Add Student", href: "/admin/students/new", icon: UserPlus },
    ],
  },
  {
    label: "Teachers",
    icon: UserCheck,
    children: [
      { label: "All Teachers", href: "/admin/teachers", icon: UserCheck },
      { label: "Add Teacher", href: "/admin/teachers/new", icon: UserPlus },
    ],
  },
  {
    label: "Academic",
    icon: BookOpen,
    children: [
      { label: "Classes", href: "/admin/academic/classes", icon: GanttChart },
      { label: "Sections", href: "/admin/academic/sections", icon: GanttChart },
      { label: "Subjects", href: "/admin/academic/subjects", icon: BookOpen },
      { label: "Sessions", href: "/admin/academic/sessions", icon: CalendarDays },
      { label: "Examinations", href: "/admin/examinations", icon: Award },
    ],
  },
  {
    label: "Records",
    icon: ClipboardList,
    children: [
      { label: "Marks", href: "/admin/marks", icon: FileText },
      { label: "Attendance", href: "/admin/records/attendance", icon: CalendarDays },
      { label: "Remarks", href: "/admin/records/remarks", icon: ClipboardList },
    ],
  },
  {
    label: "Assignments",
    icon: GanttChart,
    children: [
      { label: "Teacher Assignments", href: "/admin/assignments/teachers", icon: UserCheck },
    ],
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ScrollText,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

function NavItemComponent({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => pathname.startsWith(child.href));
  });

  const isActive = item.href
    ? item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href)
    : item.children?.some((child) => pathname.startsWith(child.href)) ?? false;

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={cn("nav-item", isActive && "nav-item-active")}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn("nav-item w-full", isActive && "text-sidebar-foreground")}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>
      {isOpen && !isCollapsed && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "nav-item text-xs py-1.5",
                pathname === child.href || pathname.startsWith(child.href + "/")
                  ? "nav-item-active"
                  : ""
              )}
            >
              <child.icon className="w-3 h-3 shrink-0" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-sidebar-foreground">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "EduManage"}
            </p>
            <p className="text-xs text-sidebar-foreground/50">Admin Portal</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isCollapsed ? "-rotate-90" : "rotate-90"
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* User info at bottom */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
