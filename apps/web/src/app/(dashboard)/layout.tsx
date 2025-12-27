import { AppSidebar } from "@/components/layouts/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/protected-route";
import { FileActionsProvider } from "@/contexts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <FileActionsProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </FileActionsProvider>
    </ProtectedRoute>
  );
}
