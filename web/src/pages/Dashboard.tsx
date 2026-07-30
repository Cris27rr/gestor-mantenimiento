import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Wrench,
  Package,
  TrendingUp,
  Megaphone,
  ArrowRight,
  User,
  MapPin,
  Plus,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  Users,
  Timer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  useEquipos,
  useOrdenes,
  useRepuestos,
  useFallas,
  useMantenimientos,
  useCreateOrden,
  useUpdateFalla,
} from "@/hooks/use-data";
import type { ReporterType, UserRole } from "@/types";

const statusConfig = {
  operativo: { label: "Operativo", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  en_mantenimiento: { label: "En Mantenimiento", color: "bg-amber-100 text-amber-700", icon: Wrench },
  fuera_de_servicio: { label: "Fuera de Servicio", color: "bg-red-100 text-red-700", icon: XCircle },
  dado_de_baja: { label: "Dado de Baja", color: "bg-slate-100 text-slate-600", icon: XCircle },
};

const reporterTypeLabels: Record<ReporterType, string> = {
  paciente: "Paciente",
  familiar: "Familiar",
  personal_medico: "Personal Médico",
  tecnico: "Técnico",
  otro: "Otro",
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#64748b"];

const roleDashboardConfig: Record<UserRole, { title: string; subtitle: string }> = {
  admin: { title: "Panel de Administración", subtitle: "Control total del sistema de mantenimiento" },
  director_departamento: { title: "Panel de Director", subtitle: "Supervisión del departamento de mantenimiento" },
  tecnico: { title: "Panel de Técnico", subtitle: "Órdenes asignadas y alertas activas" },
  clinico: { title: "Panel Clínico", subtitle: "Estado de equipos y reporte de fallas" },
  publico: { title: "Panel de Control", subtitle: "Resumen general" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, hasRole, isDemoSession } = useAuth();
  const { data: equipos = [], isLoading: eqLoading } = useEquipos();
  const { data: ordenes = [], isLoading: otLoading } = useOrdenes();
  const { data: repuestos = [] } = useRepuestos();
  const { data: fallas = [] } = useFallas();
  const { data: mantenimientos = [] } = useMantenimientos();
  const createOrden = useCreateOrden();
  const updateFalla = useUpdateFalla();

  const isLoading = eqLoading || otLoading;
  const rol = user?.rol ?? "publico";
  const isAdmin = hasRole(["admin"]);
  const isDirector = hasRole(["admin", "director_departamento"]);
  const isTecnico = hasRole(["admin", "director_departamento", "tecnico"]);
  const isClinico = hasRole(["clinico"]);
  const roleConfig = roleDashboardConfig[rol] ?? roleDashboardConfig.publico;

  const stats = useMemo(() => {
    const porEstado = {
      operativo: equipos.filter((e) => e.estado === "operativo").length,
      en_mantenimiento: equipos.filter((e) => e.estado === "en_mantenimiento").length,
      fuera_de_servicio: equipos.filter((e) => e.estado === "fuera_de_servicio").length,
      dado_de_baja: equipos.filter((e) => e.estado === "dado_de_baja").length,
    };
    const bajoStock = repuestos.filter((r) => r.cantidad <= r.stockMinimo).length;
    const otPendientes = ordenes.filter((o) => o.estado === "pendiente" || o.estado === "en_proceso").length;
    const fallasPendientes = fallas.filter((f) => f.estado === "pendiente" || f.estado === "en_proceso").length;
    return { porEstado, bajoStock, otPendientes, fallasPendientes };
  }, [equipos, ordenes, repuestos, fallas]);

  const pieData = useMemo(
    () =>
      Object.entries(stats.porEstado).map(([key, value]) => ({
        name: statusConfig[key as keyof typeof statusConfig]?.label ?? key,
        value,
      })),
    [stats.porEstado]
  );

  // ── Técnico: My assigned orders ──
  const myOrders = useMemo(() => {
    if (!isTecnico || !user) return [];
    return ordenes
      .filter((o) => o.tecnicoAsignadoId === user.id || o.tecnicoAsignadoNombre === user.nombre)
      .map((o) => ({
        ...o,
        equipoNombre: equipos.find((e) => e.id === o.equipoId)?.nombre ?? "Desconocido",
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordenes, equipos, user, isTecnico]);

  // ── Upcoming maintenance ──
  const upcomingMaintenance = useMemo(() => {
    return mantenimientos
      .filter((m) => m.activo)
      .map((m) => {
        const eq = equipos.find((e) => e.id === m.equipoId);
        return { ...m, equipoNombre: eq?.nombre ?? "Desconocido", ubicacion: eq?.ubicacion ?? "" };
      })
      .sort((a, b) => new Date(a.proximaFecha).getTime() - new Date(b.proximaFecha).getTime())
      .slice(0, 5);
  }, [mantenimientos, equipos]);

  // ── Recent work orders ──
  const recentWorkOrders = useMemo(() => {
    return [...ordenes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((o) => ({
        ...o,
        equipoNombre: equipos.find((e) => e.id === o.equipoId)?.nombre ?? "Desconocido",
      }));
  }, [ordenes, equipos]);

  // ── Bar chart data ──
  const barData = useMemo(() => {
    const porUbicacion: Record<string, number> = {};
    equipos.forEach((e) => {
      porUbicacion[e.ubicacion] = (porUbicacion[e.ubicacion] ?? 0) + 1;
    });
    return Object.entries(porUbicacion).map(([name, value]) => ({ name, value }));
  }, [equipos]);

  // ── Fault alerts (only pendiente — once an OT is created they become en_proceso and leave this list) ──
  const faultAlerts = useMemo(() => {
    return [...fallas]
      .filter((f) => f.estado === "pendiente")
      .sort((a, b) => new Date(b.fechaReporte).getTime() - new Date(a.fechaReporte).getTime())
      .slice(0, 5)
      .map((f) => {
        const eq = equipos.find((e) => e.id === f.equipoId);
        return { ...f, equipoNombre: eq?.nombre ?? "Desconocido", equipoUbicacion: eq?.ubicacion ?? "" };
      });
  }, [fallas, equipos]);

  const handleCreateOtFromAlert = async (e: React.MouseEvent, f: typeof faultAlerts[number]) => {
    e.stopPropagation();
    const otId = crypto.randomUUID?.() ?? Date.now().toString();
    await createOrden.mutateAsync({
      id: otId,
      equipoId: f.equipoId,
      tipo: "correctivo",
      prioridad: "alta",
      estado: "pendiente",
      descripcion: f.descripcion || "Falla reportada — pendiente de diagnóstico",
      fechaProgramada: new Date().toISOString().split("T")[0],
      repuestosUsados: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    await updateFalla.mutateAsync({ id: f.id, updates: { estado: "en_proceso", ordenTrabajoId: otId } });
    navigate("/ordenes");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="text-2xl font-bold text-slate-800">Cargando...</h1></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><div className="h-20 bg-slate-100 animate-pulse rounded-lg" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{roleConfig.title}</h1>
          <p className="text-slate-500">
            {roleConfig.subtitle}
            {isDemoSession && (
              <Badge className="ml-2 bg-amber-100 text-amber-700 text-[10px] align-middle">Demo · 30 min</Badge>
            )}
          </p>
        </div>
        {isDemoSession && (
          <Badge variant="outline" className="border-amber-300 text-amber-700 gap-1">
            <Timer className="w-3 h-3" /> Sesión Demo
          </Badge>
        )}
      </div>

      {/* ── ADMIN / TÉCNICO: Stats cards ── */}
      {isTecnico && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Equipos</p><p className="text-3xl font-bold text-slate-800 mt-1">{equipos.length}</p></div><div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Activity className="w-5 h-5 text-teal-600" /></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">OT Pendientes</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats.otPendientes}</p></div><div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Fallas Reportadas</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats.fallasPendientes}</p></div><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Bajo Stock</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats.bajoStock}</p></div><div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center"><Package className="w-5 h-5 text-rose-600" /></div></div></CardContent></Card>
        </div>
      )}

      {/* ── CLÍNICO: Simplified stats ── */}
      {isClinico && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Equipos Operativos</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.porEstado.operativo}</p></div><div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">En Mantenimiento</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.porEstado.en_mantenimiento}</p></div><div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Wrench className="w-5 h-5 text-amber-600" /></div></div></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Fuera de Servicio</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.porEstado.fuera_de_servicio}</p></div><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div></div></CardContent></Card>
        </div>
      )}

      {/* ── TÉCNICO: My assigned orders ── */}
      {isTecnico && user && myOrders.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-500" /> Mis Órdenes Asignadas
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-slate-500 gap-1" onClick={() => navigate("/ordenes")}>
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {myOrders.slice(0, 5).map((o) => {
              const sc: Record<string, string> = { pendiente: "bg-amber-100 text-amber-700", en_proceso: "bg-blue-100 text-blue-700", finalizada: "bg-emerald-100 text-emerald-700", verificada: "bg-teal-100 text-teal-700" };
              const tl: Record<string, string> = { preventivo: "Preventivo", correctivo: "Correctivo", calibracion: "Calibración", verificacion: "Verificación" };
              return (
                <div key={o.id} onClick={() => navigate("/ordenes")} className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{o.equipoNombre}</p>
                    <p className="text-xs text-slate-500">{tl[o.tipo]} · {o.fechaProgramada ?? "Sin fecha"}</p>
                  </div>
                  <Badge className={`text-[10px] ${sc[o.estado] ?? "bg-slate-100"}`}>{o.estado.replace("_", " ")}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── ADMIN / TÉCNICO: Fault Alerts ── */}
      {isTecnico && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-red-500" /> Alertas de Fallas Reportadas
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-slate-500 gap-1" onClick={() => navigate("/fallas")}>
                Ver historial <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {faultAlerts.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay fallas pendientes. ¡Todo al día!</p>
              </div>
            ) : (
              faultAlerts.map((f) => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/60 hover:bg-red-50 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/equipos/${f.equipoId}`)}>
                    <p className="text-sm font-medium text-slate-800 group-hover:text-teal-700 transition-colors">{f.equipoNombre}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {f.equipoUbicacion}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{f.descripcion}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{f.reportadoPor} ({reporterTypeLabels[f.tipoReportante] ?? f.tipoReportante})</span>
                      <span>{f.fechaReporte}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className="text-[10px] bg-red-100 text-red-700">
                      Pendiente
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] gap-1 px-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                      onClick={(e) => handleCreateOtFromAlert(e, f)}
                      disabled={createOrden.isPending}
                    >
                      <Plus className="w-3 h-3" /> Crear OT
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* ── CLÍNICO: Quick actions ── */}
      {isClinico && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/equipos")}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center"><Activity className="w-6 h-6 text-teal-600" /></div>
              <div><p className="font-medium text-slate-800">Ver Inventario</p><p className="text-sm text-slate-500">Consultar estado de equipos</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/escanear")}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
              <div><p className="font-medium text-slate-800">Escanear QR</p><p className="text-sm text-slate-500">Reportar falla de equipo</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ADMIN / DIRECTOR: Charts ── */}
      {isDirector && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-800">Equipos por Estado</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">{pieData.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">{pieData.map((entry, idx) => (<div key={entry.name} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} /><span className="text-slate-600">{entry.name}</span></div><span className="font-semibold text-slate-800">{entry.value}</span></div>))}</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-slate-800">Equipos por Ubicación</CardTitle></CardHeader>
            <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></CardContent>
          </Card>
        </div>
      )}

      {/* ── ADMIN / DIRECTOR: Quick actions ── */}
      {isDirector && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 justify-start gap-3 border-slate-200 hover:border-teal-300 hover:bg-teal-50" onClick={() => navigate("/ordenes")}>
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <div className="text-left"><p className="text-sm font-medium">Órdenes de Trabajo</p><p className="text-xs text-slate-500">Gestionar mantenimientos</p></div>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start gap-3 border-slate-200 hover:border-teal-300 hover:bg-teal-50" onClick={() => navigate("/repuestos")}>
            <Package className="w-5 h-5 text-teal-600" />
            <div className="text-left"><p className="text-sm font-medium">Repuestos</p><p className="text-xs text-slate-500">Inventario de consumibles</p></div>
          </Button>
          {isAdmin ? (
            <Button variant="outline" className="h-auto py-4 justify-start gap-3 border-slate-200 hover:border-teal-300 hover:bg-teal-50" onClick={() => navigate("/usuarios")}>
              <Users className="w-5 h-5 text-teal-600" />
              <div className="text-left"><p className="text-sm font-medium">Usuarios</p><p className="text-xs text-slate-500">Administrar cuentas</p></div>
            </Button>
          ) : (
            <Button variant="outline" className="h-auto py-4 justify-start gap-3 border-slate-200 hover:border-teal-300 hover:bg-teal-50" onClick={() => navigate("/auditoria")}>
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <div className="text-left"><p className="text-sm font-medium">Auditoría</p><p className="text-xs text-slate-500">Registro de actividades</p></div>
            </Button>
          )}
          <Button variant="outline" className="h-auto py-4 justify-start gap-3 border-slate-200 hover:border-teal-300 hover:bg-teal-50" onClick={() => navigate("/documentos")}>
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <div className="text-left"><p className="text-sm font-medium">Documentos</p><p className="text-xs text-slate-500">Manuales y certificados</p></div>
          </Button>
        </div>
      )}

      {/* ── ADMIN / TÉCNICO: Upcoming maintenance + Recent orders ── */}
      {isTecnico && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2"><Wrench className="w-4 h-4 text-teal-600" />Próximos Mantenimientos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcomingMaintenance.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center">No hay mantenimientos programados</p> : upcomingMaintenance.map((m) => (
                <div key={m.id} onClick={() => navigate(`/equipos/${m.equipoId}`)} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"><div><p className="text-sm font-medium text-slate-800">{m.equipoNombre}</p><p className="text-xs text-slate-500">{m.ubicacion}</p></div><Badge variant="outline" className="text-xs">{m.proximaFecha}</Badge></div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-600" />Órdenes Recientes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recentWorkOrders.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center">Sin órdenes de trabajo</p> : recentWorkOrders.map((o) => {
                const sc: Record<string, string> = { pendiente: "bg-amber-100 text-amber-700", en_proceso: "bg-blue-100 text-blue-700", finalizada: "bg-emerald-100 text-emerald-700", verificada: "bg-teal-100 text-teal-700" };
                const tl: Record<string, string> = { preventivo: "Preventivo", correctivo: "Correctivo", calibracion: "Calibración", verificacion: "Verificación" };
                return (
                  <div key={o.id} onClick={() => navigate(`/ordenes`)} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"><div className="min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{o.equipoNombre}</p><p className="text-xs text-slate-500">{tl[o.tipo]} · {o.tecnicoAsignadoNombre ?? "Sin asignar"}</p></div><Badge className={`text-[10px] ${sc[o.estado] ?? "bg-slate-100"}`}>{o.estado.replace("_", " ")}</Badge></div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
