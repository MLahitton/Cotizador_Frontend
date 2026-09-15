import {
  BookOpenCheck,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Layers3,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AppNavigationItem {
  id: string;
  label: string;
  href: string | null;
  icon: LucideIcon;
  disabled: boolean;
  description?: string;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    id: "user-dashboard",
    label: "Panel",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: false,
    userOnly: true,
  },
  {
    id: "admin-dashboard",
    label: "Panel",
    href: "/admin",
    icon: LayoutDashboard,
    disabled: false,
    adminOnly: true,
  },
  {
    id: "admin-users",
    label: "Usuarios",
    href: "/admin/users",
    icon: Users,
    disabled: false,
    adminOnly: true,
  },
  {
    id: "admin-prequotes",
    label: "Precotizaciones",
    href: "/admin/prequotes",
    icon: FileText,
    disabled: false,
    adminOnly: true,
  },
  {
    id: "clients",
    label: "Clientes",
    href: "/clients",
    icon: Users,
    disabled: false,
  },
  {
    id: "projects",
    label: "Proyectos",
    href: "/projects",
    icon: FolderKanban,
    disabled: false,
  },
  {
    id: "fp-pro-proposal",
    label: "Propuesta FP Pro",
    href: "/proposals/fp-pro",
    icon: FileSpreadsheet,
    disabled: false,
  },
  {
    id: "glass-catalog",
    label: "Catálogo de vidrios",
    href: "/catalogs/glass-types",
    icon: Layers3,
    disabled: false,
  },
  {
    id: "canonical-catalog",
    label: "Catálogo técnico",
    href: "/catalogs/canonical",
    icon: BookOpenCheck,
    disabled: false,
  },
  {
    id: "settings",
    label: "Configuración",
    href: null,
    icon: Settings,
    disabled: true,
  },
];