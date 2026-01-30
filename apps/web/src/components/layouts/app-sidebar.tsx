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
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Files,
  Clock,
  FolderPlus,
  Star,
  Trash2, LogOut,
  Stone,
  Plus,
  Upload,
  Users,
  Keyboard
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutDialog } from "@/components/dialog/logout-dialog";
import { KeyboardShortcutsDialog } from "@/components/dialog/keyboard-shortcuts-dialog";
import { StorageIndicator } from "@/components/layouts/storage-indicator";
import { useFileActions } from "@/contexts/file-actions-context";
import { useTheme } from "next-themes";
import {Sun, Moon} from "lucide-react"

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
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const { triggerUpload, triggerCreateFolder, isUploading } = useFileActions();
    const { setTheme, resolvedTheme } = useTheme()


  const isTrashPage = pathname === "/trash";

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Stone
              className="size-6 shrink-0 text-accent-foreground"
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
                      <span className="group-data-[collapsible=icon]:hidden">
                        New
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem onClick={triggerCreateFolder}>
                      <FolderPlus className="size-4 mr-2" />
                      New Folder
                      <DropdownMenuShortcut>Alt+N</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={triggerUpload}
                      disabled={isUploading}
                    >
                      <Upload className="size-4 mr-2" />
                      {isUploading ? "Uploading" : "Upload File"}
                      <DropdownMenuShortcut>Ctrl+U</DropdownMenuShortcut>
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
            <StorageIndicator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setShortcutsDialogOpen(true)}
                tooltip="Keyboard Shortcuts"
              >
                <Keyboard className="size-4" />
                <span>Shortcuts</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                <span>
                  {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
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

      <LogoutDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
      />
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />
    </>
  );
}
