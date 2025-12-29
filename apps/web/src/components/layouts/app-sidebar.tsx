"use client";

import { useState } from "react";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Files,
  Clock,
  FolderPlus,
  Star,
  Trash2,
  Settings,
  LogOut,
  Stone,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutDialog } from "@/components/dialog/logout-dialog";
import { useFileActions } from "@/contexts";

const navItems = [
  { title: "All Files", href: "/files", icon: Files },
  { title: "Shared with me", href: "/share", icon: Users },
  { title: "Recent", href: "/recent", icon: Clock },
  { title: "Starred", href: "/starred", icon: Star },
  { title: "Trash", href: "/trash", icon: Trash2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { triggerUpload, triggerCreateFolder, isUploading } = useFileActions();

  const isTrashPage = pathname === "/trash";

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Stone
              className="size-6 shrink-0"
              fill="currentColor"
              strokeWidth={1.5}
              stroke="white"
            />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              Assets Man
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* New Button - Google Drive style (hidden on Trash page) */}
          {!isTrashPage && (
            <SidebarGroup>
              <SidebarGroupContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                      disabled={isUploading}
                    >
                      <Plus className="size-4" />
                      <span className="group-data-[collapsible=icon]:hidden">New</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={triggerCreateFolder}>
                      <FolderPlus className="size-4 mr-2" />
                      New Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={triggerUpload} disabled={isUploading}>
                      <Upload className="size-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload File"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
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
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="/settings">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setLogoutDialogOpen(true)}
                tooltip="Logout"
              >
                <LogOut className="size-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <LogoutDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} />
    </>
  );
}
