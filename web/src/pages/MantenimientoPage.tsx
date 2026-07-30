import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, Wrench, AlertTriangle, Clock, Search, Stethoscope, Check, X, Filter } from "lucide-react";
import { toast } from "sonner";
import { useEquiposLookup, useMantenimientos, useCreateMantenimiento, useUpdateMantenimiento } from "@/hooks/use-data";
import type { MaintenanceSchedule, Equipment } from "@/types";

type SearchField = "todos" | "nombre" | "marca" | "modelo" | "serial" | "ubicacion";

const fieldLabels: Record<SearchField, string> = {
  todos: "Todos",
  nombre: "Nombre",
  marca: "Marca",
  modelo: "Modelo",
  serial: "Serial",
  ubicacion: "Ubicación",
};

const estadoBadge: Record<string, string> = {
  operativo: "bg-emerald-100 text-emerald-700",
  en_mantenimiento: "bg-amber-100 text-amber-700",
  fuera_de_servicio: "bg-red-100 text-red-700",
  dado_de_baja: "bg-slate-100 text-slate-600",
  desconocido: "bg-slate-100 text-slate-500",
};

const estadoShort: Record<string, string> = {
  operativo: "Operativo",
  en_mantenimiento: "En Mant.",
  fuera_de_servicio: "Fuera",
  dado_de_baja: "Baja",
  desconocido: "N/A",
};

export default function MaintenancePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ equipoId: "", frecuenciaMeses: "", proximaFecha: "", horasUso: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("todos");
  const [showResults, setShowResults] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipment | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: equipos = [] } = useEquiposLookup();
  const { data: mantenimientosRaw = [] } = useMantenimientos();
  const createMantenimiento = useCreateMantenimiento();
  const updateMantenimiento = useUpdateMantenimiento();

  const enriched = useMemo(() => {
    return mantenimientosRaw
      .map((m) => ({ ...m, equipo: equipos.find((e) => e.id === m.equipoId) }))
      .sort((a, b) => new Date(a.proximaFecha).getTime() - new Date(b.proximaFecha).getTime());
  }, [mantenimientosRaw, equipos]);

  const upcoming = enriched.filter((m) => {
    const diff = new Date(m.proximaFecha).getTime() - new Date().getTime();
    return diff < 30 * 24 * 60 * 60 * 1000 && m.activo;
  });

  const filteredEquipos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return equipos.slice(0, 20);
    return equipos.filter((e) => {
      const fields: Record<SearchField, string> = {
        todos: e.nombre + " " + e.marca + " " + e.modelo + " " + e.serial + " " + e.ubicacion,
        nombre: e.nombre,
        marca: e.marca,
        modelo: e.modelo,
        serial: e.serial,
        ubicacion: e.ubicacion,
      };
      return fields[searchField].toLowerCase().includes(q);
    }).slice(0, 30);
  }, [equipos, searchQuery, searchField]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectEquipo = (eq: Equipment) => {
    setSelectedEquipo(eq);
    setForm({ ...form, equipoId: eq.id });
    setSearchQuery("");
    setShowResults(false);
  };

  const clearSelectedEquipo = () => {
    setSelectedEquipo(null);
    setForm({ ...form, equipoId: "" });
  };

  const handleCreate = async () => {
    if (!form.equipoId || !form.frecuenciaMeses || !form.proximaFecha) {
      toast.error("Complete los campos obligatorios");
      return;
    }
    await createMantenimiento.mutateAsync({
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      equipoId: form.equipoId,
      frecuenciaMeses: Number(form.frecuenciaMeses),
      proximaFecha: form.proximaFecha,
      activo: true,
      createdAt: new Date().toISOString(),
    } as MaintenanceSchedule);
    toast.success("Programación de mantenimiento creada");
    setIsDialogOpen(false);
    resetDialog();
  };

  const toggleActivo = async (id: string, current: boolean) => {
    await updateMantenimiento.mutateAsync({ id, updates: { activo: !current } });
    toast.success(!current ? "Programación activada" : "Programación desactivada");
  };

  const daysUntil = (date: string) =>
    Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const resetDialog = () => {
    setForm({ equipoId: "", frecuenciaMeses: "", proximaFecha: "", horasUso: "" });
    setSelectedEquipo(null);
    setSearchQuery("");
    setSearchField("todos");
    setShowResults(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Programar button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mantenimientos Programados</h1>
          <p className="text-slate-500">Programación y alertas de mantenimiento preventivo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) resetDialog(); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
              <Plus className="w-4 h-4" /> Programar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">Programar Mantenimiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Equipment search selector */}
              <div className="space-y-2">
                <Label>Equipo *</Label>
                {selectedEquipo ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-teal-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{selectedEquipo.nombre}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {selectedEquipo.marca} {selectedEquipo.modelo} · SN: {selectedEquipo.serial || "N/A"} · {selectedEquipo.ubicacion}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={clearSelectedEquipo}>
                      <X className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative" ref={searchRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                        onFocus={() => setShowResults(true)}
                        placeholder="Buscar equipo por nombre, marca, modelo, serial..."
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Filtrar por:
                      </span>
                      {(Object.keys(fieldLabels) as SearchField[]).map((field) => (
                        <button
                          key={field}
                          onClick={() => { setSearchField(field); setShowResults(true); }}
                          className={
                            "text-xs px-2.5 py-1 rounded-full transition-colors " +
                            (searchField === field
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                          }
                        >
                          {fieldLabels[field]}
                        </button>
                      ))}
                    </div>
                    {showResults && (
                      <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredEquipos.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                            No se encontraron equipos
                          </div>
                        ) : (
                          filteredEquipos.map((eq) => (
                            <button
                              key={eq.id}
                              onClick={() => handleSelectEquipo(eq)}
                              className="w-full text-left p-3 hover:bg-teal-50 border-b border-slate-50 last:border-0 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  <Stethoscope className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-slate-800 text-sm truncate">{eq.nombre}</p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {eq.marca && <span>{eq.marca}</span>}
                                    {eq.modelo && <span> · {eq.modelo}</span>}
                                    {eq.serial && <span> · SN: {eq.serial}</span>}
                                    {eq.ubicacion && <span> · {eq.ubicacion}</span>}
                                  </p>
                                </div>
                                <Badge className={"text-[9px] shrink-0 " + (estadoBadge[eq.estado] ?? "bg-slate-100 text-slate-600")}>
                                  {estadoShort[eq.estado] ?? "N/A"}
                                </Badge>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Frecuencia (meses) *</Label>
                  <Input type="number" value={form.frecuenciaMeses} onChange={(e) => setForm({ ...form, frecuenciaMeses: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Próxima Fecha *</Label>
                  <Input type="date" value={form.proximaFecha} onChange={(e) => setForm({ ...form, proximaFecha: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Horas de Uso (opcional)</Label>
                <Input type="number" value={form.horasUso} onChange={(e) => setForm({ ...form, horasUso: e.target.value })} />
              </div>
              <Button onClick={handleCreate} className="w-full bg-teal-600 hover:bg-teal-700" disabled={createMantenimiento.isPending}>
                <Check className="w-4 h-4 mr-1" /> Guardar Programación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />Alertas Próximas ({upcoming.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((m) => {
              const days = daysUntil(m.proximaFecha);
              const isOverdue = days < 0;
              const cardBg = isOverdue ? "bg-red-50" : days <= 7 ? "bg-amber-50" : "bg-white";
              const badgeClass = isOverdue
                ? "bg-red-100 text-red-700"
                : days <= 7
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700";
              const badgeText = isOverdue ? Math.abs(days) + "d vencido" : days + "d restantes";
              return (
                <Card key={m.id} className={"border-0 shadow-sm " + cardBg}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{m.equipo?.nombre ?? "Desconocido"}</p>
                        <p className="text-xs text-slate-500">{m.equipo?.ubicacion}</p>
                      </div>
                      <Badge className={badgeClass}>{badgeText}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />{m.proximaFecha} · Cada {m.frecuenciaMeses} meses
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All schedules table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wrench className="w-4 h-4 text-teal-600" />Todas las Programaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Equipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Frecuencia</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Próxima</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((m) => {
                  const days = daysUntil(m.proximaFecha);
                  const dateClass = days < 0
                    ? "text-red-600 font-medium"
                    : days <= 7
                      ? "text-amber-600 font-medium"
                      : "text-slate-600";
                  return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{m.equipo?.nombre ?? "Desconocido"}</p>
                        <p className="text-xs text-slate-500">{m.equipo?.ubicacion}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">Cada {m.frecuenciaMeses} meses</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={dateClass}>{m.proximaFecha}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={m.activo ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-slate-100 text-slate-600 text-[10px]"}>
                          {m.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleActivo(m.id, m.activo)}>
                          {m.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {enriched.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hay mantenimientos programados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
