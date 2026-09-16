import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminActivityPageContent } from "@/features/admin/components/admin-activity-page-content";

export default function AdminActivityPage() {
  return (
    <AdminPageShell>
      <AdminActivityPageContent />
    </AdminPageShell>
  );
}