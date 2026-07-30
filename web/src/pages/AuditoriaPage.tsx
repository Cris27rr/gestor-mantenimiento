import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ShieldCheck,
  Search,
  Download,
  FileText,
  AlertTriangle,
  ClipboardList,
  MapPin,
  Wrench,
  Package,
  LogIn,
  LogOut,
  Lock,
  Eye,
  TrendingUp,
  Filter,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { db as mockDb } from "@/lib/mockDb";
import {
  useFallas,
  useOrdenes,
  useEquipos,
  useUsuarios,
  useMantenimientos,
} from "@/hooks/use-data";
import type { AuditLog, AccessLog } from "@/types";

interface ActivityEntry {
  id: string;
  usuario: string;
  userEmail: string;
  accion: string;
  tipo: string;
  entidadId: string;
  equipoNombre: string;
  detalle: string;
  fecha: string;
  fuente: "supabase" | "audit" | "access";
}

const actionIcons: Record<string, typeof AlertTriangle> = {
  falla: AlertTriangle,
  orden: ClipboardList,
  movimiento: MapPin,
  mantenimiento: Wrench,
  repuesto: Package,
  login: LogIn,
  logout: LogOut,
  login_failed: Lock,
  demo_login: Eye,
  create: FileText,
  update: TrendingUp,
  delete: AlertTriangle,
  change_password: Lock,
};

const actionLabels: Record<string, string> = {
  falla: "Falla Reportada",
  orden: "Orden de Trabajo",
  movimiento: "Traslado de Equipo",
  mantenimiento: "Mantenimiento Programado",
  repuesto: "Repuesto Asignado",
  login: "Inicio de Sesión",
  logout: "Cierre de Sesión",
  login_failed: "Intento Fallido",
  demo_login: "Acceso Demo",
  create: "Creación",
  update: "Actualización",
  delete: "Eliminación",
  change_password: "Cambio de Contraseña",
};

const actionColors: Record<string, string> = {
  falla: "bg-red-100 text-red-700",
  orden: "bg-blue-100 text-blue-700",
  movimiento: "bg-purple-100 text-purple-700",
  mantenimiento: "bg-teal-100 text-teal-700",
  repuesto: "bg-amber-100 text-amber-700",
  login: "bg-emerald-100 text-emerald-700",
  logout: "bg-slate-100 text-slate-600",
  login_failed: "bg-red-100 text-red-700",
  demo_login: "bg-amber-100 text-amber-700",
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  change_password: "bg-slate-100 text-slate-600",
};

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function AuditoriaPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

  const { data: fallas = [] } = useFallas();
  const { data: ordenes = [] } = useOrdenes();
  const { data: equipos = [] } = useEquipos();
  const { data: usuarios = [] } = useUsuarios();
  const { data: mantenimientos = [] } = useMantenimientos();

  // Get audit & access logs from mockDb (localStorage)
  const auditLogs: AuditLog[] = useMemo(() => mockDb.auditLogs.getAll(), []);
  const accessLogs: AccessLog[] = useMemo(() => mockDb.accessLogs.getAll(), []);

  // Build unified activity feed from all sources
  const allActivities: ActivityEntry[] = useMemo(() => {
    const activities: ActivityEntry[] = [];
    const equipoNombre = (id: string) =>
      equipos.find((e) => e.id === id)?.nombre ?? "Equipo no encontrado";

    // Fallas from Supabase
    fallas.forEach((f) => {
      activities.push({
        id: `falla-${f.id}`,
        usuario: f.reportadoPor,
        userEmail: "",
        accion: "reportada",
        tipo: "falla",
        entidadId: f.equipoId,
        equipoNombre: equipoNombre(f.equipoId),
        detalle: f.descripcion,
        fecha: f.createdAt || f.fechaReporte,
        fuente: "supabase",
      });
    });

    // Órdenes from Supabase
    ordenes.forEach((o) => {
      activities.push({
        id: `orden-${o.id}`,
        usuario: o.tecnicoAsignadoNombre ?? "Sin asignar",
        userEmail: "",
        accion: o.estado === "finalizada" || o.estado === "verificada" ? "completada" : "creada",
        tipo: "orden",
        entidadId: o.equipoId,
        equipoNombre: equipoNombre(o.equipoId),
        detalle: `${o.tipo} · ${o.descripcion}`,
        fecha: o.createdAt,
        fuente: "supabase",
      });
    });

    // Mantenimientos from Supabase
    mantenimientos.forEach((m) => {
      activities.push({
        id: `mant-${m.id}`,
        usuario: "Sistema",
        userEmail: "",
        accion: "programado",
        tipo: "mantenimiento",
        entidadId: m.equipoId,
        equipoNombre: equipoNombre(m.equipoId),
        detalle: `Frecuencia: cada ${m.frecuenciaMeses} meses · Próxima: ${m.proximaFecha}`,
        fecha: m.createdAt,
        fuente: "supabase",
      });
    });

    // Audit logs from localStorage
    auditLogs.forEach((log) => {
      activities.push({
        id: `audit-${log.id}`,
        usuario: log.userEmail,
        userEmail: log.userEmail,
        accion: log.action,
        tipo: log.entityType === "usuario" ? "update" : log.action,
        entidadId: log.entityId,
        equipoNombre: log.entityType,
        detalle: `${log.action} en ${log.entityType}`,
        fecha: log.createdAt,
        fuente: "audit",
      });
    });

    // Access logs from localStorage
    accessLogs.forEach((log) => {
      activities.push({
        id: `access-${log.id}`,
        usuario: log.userEmail,
        userEmail: log.userEmail,
        accion: log.action,
        tipo: log.action,
        entidadId: "",
        equipoNombre: "",
        detalle: log.details,
        fecha: log.createdAt,
        fuente: "access",
      });
    });

    return activities.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [fallas, ordenes, equipos, mantenimientos, auditLogs, accessLogs]);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    allActivities.forEach((a) => {
      if (a.usuario) users.add(a.usuario);
    });
    return Array.from(users).sort();
  }, [allActivities]);

  // Filtered activities
  const filtered = useMemo(() => {
    return allActivities.filter((a) => {
      if (actionFilter !== "all" && a.tipo !== actionFilter) return false;
      if (userFilter !== "all" && a.usuario !== userFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          a.usuario.toLowerCase().includes(q) ||
          a.equipoNombre.toLowerCase().includes(q) ||
          a.detalle.toLowerCase().includes(q) ||
          a.tipo.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allActivities, actionFilter, userFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    allActivities.forEach((a) => {
      byType[a.tipo] = (byType[a.tipo] ?? 0) + 1;
    });
    return {
      total: allActivities.length,
      fallas: byType["falla"] ?? 0,
      ordenes: byType["orden"] ?? 0,
      mantenimientos: byType["mantenimiento"] ?? 0,
      logins: (byType["login"] ?? 0) + (byType["demo_login"] ?? 0),
    };
  }, [allActivities]);

  const exportCSV = () => {
    const headers = ["Fecha", "Usuario", "Tipo", "Acción", "Equipo/Entidad", "Detalle"];
    const rows = filtered.map((a) => [
      formatDateTime(a.fecha),
      a.usuario,
      actionLabels[a.tipo] ?? a.tipo,
      a.accion,
      a.equipoNombre,
      a.detalle.replace(/"/g, "'"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Auditoria_MediMaint_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Auditoría exportada a CSV");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let y = margin + 6;

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("MediMaint — Registro de Auditoría", margin, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${formatDateTime(new Date().toISOString())}`, pageWidth - margin, 14, { align: "right" });

    y = 28;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total de registros: ${filtered.length}`, margin, y);
    y += 8;

    // Table header
    const colWidths = [40, 45, 35, 30, 55, 80];
    const colHeaders = ["FECHA", "USUARIO", "TIPO", "ACCIÓN", "EQUIPO/ENTIDAD", "DETALLE"];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, colWidths.reduce((a, b) => a + b, 0), 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    let x = margin;
    colHeaders.forEach((h, i) => {
      doc.text(h, x + 1, y);
      x += colWidths[i];
    });
    y += 6;

    // Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    filtered.forEach((a, idx) => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 3, colWidths.reduce((a, b) => a + b, 0), 5, "F");
      }

      x = margin;
      const cells = [
        formatDateTime(a.fecha),
        a.usuario.length > 25 ? a.usuario.slice(0, 25) + "..." : a.usuario,
        actionLabels[a.tipo] ?? a.tipo,
        a.accion,
        a.equipoNombre.length > 30 ? a.equipoNombre.slice(0, 30) + "..." : a.equipoNombre,
        a.detalle.length > 45 ? a.detalle.slice(0, 45) + "..." : a.detalle,
      ];
      cells.forEach((c, i) => {
        doc.text(String(c), x + 1, y);
        x += colWidths[i];
      });
      y += 5;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `MediMaint — Auditoría  |  Página ${i} de ${totalPages}`,
        margin,
        pageHeight - 6
      );
    }

    doc.save(`Auditoria_MediMaint_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Auditoría exportada a PDF");
  };

  const actionTypes = [
    { value: "all", label: "Todas las acciones" },
    { value: "falla", label: "Fallas Reportadas" },
    { value: "orden", label: "Órdenes de Trabajo" },
    { value: "mantenimiento", label: "Mantenimientos" },
    { value: "login", label: "Inicios de Sesión" },
    { value: "demo_login", label: "Accesos Demo" },
    { value: "login_failed", label: "Intentos Fallidos" },
    { value: "create", label: "Creaciones" },
    { value: "update", label: "Actualizaciones" },
    { value: "delete", label: "Eliminaciones" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            Auditoría del Sistema
          </h1>
          <p className="text-slate-500">
            Registro completo de actividades — quién hizo qué y cuándo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1">
            <FileText className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Registros</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Fallas Reportadas</p>
                <p className="text-2xl font-bold text-red-600 mt-0.5">{stats.fallas}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Órdenes de Trabajo</p>
                <p className="text-2xl font-bold text-blue-600 mt-0.5">{stats.ordenes}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Mantenimientos</p>
                <p className="text-2xl font-bold text-teal-600 mt-0.5">{stats.mantenimientos}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Inicios de Sesión</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.logins}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <LogIn className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por usuario, equipo, detalle..."
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-1 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos los usuarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {uniqueUsers.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Registro de Actividades ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hay actividades que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="text-xs">Fecha/Hora</TableHead>
                    <TableHead className="text-xs">Usuario</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Equipo / Entidad</TableHead>
                    <TableHead className="text-xs">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const Icon = actionIcons[a.tipo] ?? FileText;
                    const colorClass = actionColors[a.tipo] ?? "bg-slate-100 text-slate-600";
                    return (
                      <TableRow key={a.id} className="hover:bg-slate-50">
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(a.fecha)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                              {a.usuario.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-slate-700 truncate max-w-[120px]">{a.usuario}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className={`text-[10px] gap-1 ${colorClass}`}>
                            <Icon className="w-3 h-3" />
                            {actionLabels[a.tipo] ?? a.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-[160px] truncate">
                          {a.equipoNombre || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[300px]">
                          <p className="truncate">{a.detalle}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info note */}
      <div className="p-4 rounded-lg bg-teal-50 border border-teal-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-teal-800">Información de Auditoría</p>
            <p className="text-xs text-teal-600 mt-1">
              Este registro combina datos de operaciones (fallas, órdenes, mantenimientos desde la base de datos compartida)
              con registros de acceso y auditoría locales (inicios de sesión, cambios de contraseña, intentos fallidos).
              Los registros locales se almacenan por dispositivo navegador. Exporte periódicamente para mantener un respaldo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
