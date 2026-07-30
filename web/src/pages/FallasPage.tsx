import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  User,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Clock,
  ExternalLink,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFallas, useEquiposLookup, useOrdenes, useCreateOrden, useUpdateFalla } from "@/hooks/use-data";
import type { ReporterType } from "@/types";

const reporterTypeLabels: Record<ReporterType, string> = {
  paciente: "Paciente",
  familiar: "Familiar",
  personal_medico: "Personal Médico",
  tecnico: "Técnico",
  otro: "Otro",
};

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En Proceso",
  resuelto: "Resuelto",
};

const statusColors: Record<string, string> = {
  pendiente: "bg-red-100 text-red-700",
  en_proceso: "bg-amber-100 text-amber-700",
  resuelto: "bg-emerald-100 text-emerald-700",
};

export default function FallasPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isTecnico = hasRole(["admin", "director_departamento", "tecnico"]);
  const { data: fallas = [], isLoading } = useFallas();
  const { data: equipos = [] } = useEquiposLookup();
  const { data: ordenes = [] } = useOrdenes();
  const createOrden = useCreateOrden();
  const updateFalla = useUpdateFalla();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const pendientes = fallas.filter((f) => f.estado === "pendiente").length;
    const enProceso = fallas.filter((f) => f.estado === "en_proceso").length;
    const resueltos = fallas.filter((f) => f.estado === "resuelto").length;
    return { pendientes, enProceso, resueltos, total: fallas.length };
  }, [fallas]);

  const enriched = useMemo(() => {
    return fallas
      .map((f) => {
        const eq = equipos.find((e) => e.id === f.equipoId);
        const ot = f.ordenTrabajoId ? ordenes.find((o) => o.id === f.ordenTrabajoId) : null;
        return {
          ...f,
          equipoNombre: eq?.nombre ?? "Desconocido",
          equipoUbicacion: eq?.ubicacion ?? "",
          equipoUuid: eq?.uuid ?? "",
          otEstado: ot?.estado ?? null,
        };
      })
      .filter((f) => {
        const s = search.toLowerCase();
        const matchesSearch =
          s === "" ||
          f.equipoNombre.toLowerCase().includes(s) ||
          f.descripcion.toLowerCase().includes(s) ||
          f.reportadoPor.toLowerCase().includes(s);
        const matchesStatus = statusFilter === "all" || f.estado === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.fechaReporte).getTime() - new Date(a.fechaReporte).getTime());
  }, [fallas, equipos, ordenes, search, statusFilter]);

  const handleCreateOt = async (f: (typeof enriched)[number]) => {
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
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Historial de Fallas</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><div className="h-16 bg-slate-100 animate-pulse rounded-lg" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial de Fallas</h1>
          <p className="text-slate-500">Reportes recibidos, en proceso y resueltos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Reportes</p><p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p></div><div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center"><Megaphone className="w-5 h-5 text-slate-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Pendientes</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.pendientes}</p></div><div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">En Proceso</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.enProceso}</p></div><div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-emerald-500"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Resueltos</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.resueltos}</p></div><div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por equipo, reportante o descripción..." className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><Filter className="w-3 h-3 mr-2" /><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="resuelto">Resuelto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Reportante</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>OT</TableHead>
                  {isTecnico && <TableHead className="w-[120px]">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((f) => (
                  <TableRow key={f.id} className="hover:bg-slate-50">
                    <TableCell>
                      <button
                        onClick={() => navigate(`/equipos/${f.equipoId}`)}
                        className="text-left hover:text-teal-700 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-800">{f.equipoNombre}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{f.equipoUbicacion}</p>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium text-slate-800 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" />{f.reportadoPor}</p>
                        <p className="text-xs text-slate-500">{reporterTypeLabels[f.tipoReportante] ?? f.tipoReportante}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-700 max-w-xs line-clamp-2">{f.descripcion}</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 whitespace-nowrap">{f.fechaReporte}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[f.estado] ?? "bg-slate-100 text-slate-600"}`}>
                        {statusLabels[f.estado] ?? f.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {f.ordenTrabajoId ? (
                        <button
                          onClick={() => navigate("/ordenes")}
                          className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1"
                        >
                          <ClipboardList className="w-3 h-3" /> Ver OT
                          {f.otEstado && (
                            <Badge className={`text-[9px] ml-1 ${f.otEstado === "pendiente" ? "bg-amber-100 text-amber-700" : f.otEstado === "en_proceso" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {f.otEstado.replace("_", " ")}
                            </Badge>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    {isTecnico && (
                      <TableCell>
                        {f.estado === "pendiente" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1 px-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                            onClick={() => handleCreateOt(f)}
                            disabled={createOrden.isPending}
                          >
                            <ClipboardList className="w-3 h-3" /> Crear OT
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 text-slate-400"
                            onClick={() => navigate(`/equipos/${f.equipoId}`)}
                          >
                            Ver equipo <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {enriched.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {statusFilter !== "all"
                  ? `No hay fallas en estado "${statusLabels[statusFilter]}"`
                  : "No se encontraron fallas reportadas"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
