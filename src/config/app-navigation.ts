import {
  Calculator,
  Files,
  FileText,
  FolderKanban,
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
    id: "prequoter",
    label: "Precotizador",
    href: null,
    icon: Calculator,
    disabled: true,
  },
  {
    id: "quotations",
    label: "Cotizaciones",
    href: null,
    icon: FileText,
    disabled: true,
  },
  {
    id: "documents",
    label: "Documentos",
    href: null,
    icon: Files,
    disabled: true,
  },
  {
    id: "settings",
    label: "Configuración",
    href: null,
    icon: Settings,
    disabled: true,
  },
];
