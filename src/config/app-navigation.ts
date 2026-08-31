import {
  BookOpenCheck,
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
}

export const appNavigationItems: AppNavigationItem[] = [
  {
    id: "dashboard",
    label: "Panel",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: false,
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
