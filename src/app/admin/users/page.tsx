import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminUsersPageContent } from "@/features/admin/components/admin-users-page-content";

export default function AdminUsersPage() {
  return (
    <AdminPageShell>
      <AdminUsersPageContent />
    </AdminPageShell>
  );
}