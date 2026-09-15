import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDashboardPageContent } from "@/features/admin/components/admin-dashboard-page-content";

export default function AdminPage() {
  return (
    <AdminPageShell>
      <AdminDashboardPageContent />
    </AdminPageShell>
  );
}