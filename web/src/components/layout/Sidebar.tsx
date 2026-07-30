import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Stethoscope,
  ClipboardList,
  Wrench,
  Package,
  Users,
  FileText,
  Bell,
  Megaphone,
  QrCode,
  LogOut,
  Menu,
  X,
  Timer,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; roles: UserRole[] }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "director_departamento", "tecnico", "clinico"] },
  { to: "/equipos", label: "Equipos", icon: Stethoscope, roles: ["admin", "director_departamento", "tecnico", "clinico"] },
  { to: "/ordenes", label: "Órdenes de Trabajo", icon: ClipboardList, roles: ["admin", "director_departamento", "tecnico"] },
  { to: "/fallas", label: "Historial de Fallas", icon: Megaphone, roles: ["admin", "director_departamento", "tecnico"] },
  { to: "/mantenimientos", label: "Mantenimientos", icon: Wrench, roles: ["admin", "director_departamento", "tecnico"] },
  { to: "/repuestos", label: "Repuestos", icon: Package, roles: ["admin", "director_departamento", "tecnico"] },
  { to: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  { to: "/documentos", label: "Documentos", icon: FileText, roles: ["admin", "director_departamento", "tecnico"] },
  { to: "/auditoria", label: "Auditoría", icon: ShieldCheck, roles: ["admin", "director_departamento"] },
  { to: "/escanear", label: "Escanear QR", icon: QrCode, roles: ["admin", "director_departamento", "tecnico", "clinico"] },
];;

export default function Sidebar() {
  const { user, logout, hasRole, isDemoSession } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navItems.filter((item) => hasRole(item.roles));

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">MediMaint</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-slate-100">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">MediMaint</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-teal-600" : "text-slate-400")} />
                {item.label}
                {item.to === "/ordenes" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" title="Órdenes pendientes" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              {user?.nombre?.charAt(0) ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.nombre}</p>
              <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                {user?.rol}
                {isDemoSession && <Badge className="text-[9px] bg-amber-100 text-amber-700 py-0 px-1">Demo</Badge>}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
