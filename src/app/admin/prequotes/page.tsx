import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminPreQuotesPageContent } from "@/features/admin/components/admin-prequotes-page-content";

export default function AdminPreQuotesPage() {
  return (
    <AdminPageShell>
      <AdminPreQuotesPageContent />
    </AdminPageShell>
  );
}