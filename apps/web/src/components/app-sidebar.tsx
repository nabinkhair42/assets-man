"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Files,
  FolderOpen,
  Star,
  Trash2,
  Settings,
  LogOut,
  Stone,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/hooks";

const navItems = [
  { title: "All Files", href: "/files", icon: Files },
  { title: "Folders", href: "/files?view=folders", icon: FolderOpen },
  { title: "Starred", href: "/files?filter=starred", icon: Star },
  { title: "Trash", href: "/trash", icon: Trash2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Stone className="size-6" fill="currentColor" strokeWidth={1.5} stroke="white"/>
          <span className="text-lg font-semibold">Assets Man</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" />
              <span>{logout.isPending ? "Logging out" : "Logout"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
