"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import type { Role } from "@/types/enums";

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/teacher",
    icon: LayoutDashboard,
  },
  {
    title: "My Students",
    href: "/teacher/students",
    icon: Users,
  },
  {
    title: "Attendance",
    href: "/teacher/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Marks & Grades",
    href: "/teacher/marks",
    icon: ClipboardList,
  },
  {
    title: "Timetable",
    href: "/teacher/timetable",
    icon: BookOpen,
  },
];

interface TeacherSidebarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

export function TeacherSidebar({ user }: TeacherSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg">EduManage Portal</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          <div className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Main Menu
          </div>
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            // Check if active (exact match for dashboard, prefix match for others)
            const isActive =
              link.href === "/teacher"
                ? pathname === "/teacher"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary font-medium"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.title}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
