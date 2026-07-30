import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Stethoscope, QrCode, MapPin, Pencil, Trash2, Database } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useEquipos, useCreateEquipo, useDeleteEquipo } from "@/hooks/use-data";
import { supabase } from "@/lib/supabase";
import equiposImportRaw from "@/data/equipos_import.json";
import type { Equipment, EquipmentStatus } from "@/types";

const statusLabels: Record<string, string> = {
  operativo: "Operativo", en_mantenimiento: "En Mantenimiento",
  fuera_de_servicio: "Fuera de Servicio", dado_de_baja: "Dado de Baja", desconocido: "Desconocido",
};
const statusColors: Record<string, string> = {
  operativo: "bg-emerald-100 text-emerald-700", en_mantenimiento: "bg-amber-100 text-amber-700",
  fuera_de_servicio: "bg-red-100 text-red-700", dado_de_baja: "bg-slate-100 text-slate-600", desconocido: "bg-slate-100 text-slate-500",
};

function generateUUID() { return Math.random().toString(36).substring(2, 10); }

export default function EquipmentPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedQr, setSelectedQr] = useState<{ url: string; nombre: string; uuid: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "", marca: "", modelo: "", serial: "", fechaAdquisicion: "",
    ubicacion: "", estado: "operativo" as EquipmentStatus, valorCompra: "", vidaUtil: "",
    descripcion: "", anioFabricacion: "", observaciones: "", servicioTecnico: "",
  });

  const { data: equipos = [], isLoading } = useEquipos();
  const createEquipo = useCreateEquipo();
  const deleteEquipo = useDeleteEquipo();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedEquipment = async () => {
    if (!confirm(`¿Importar ${equiposImportRaw.length} equipos a la base de datos? Esta operación puede tardar unos segundos.`)) return;
    setIsSeeding(true);
    try {
      let idx = 0;
      const batchSize = 50;
      while (idx < equiposImportRaw.length) {
        const batch = equiposImportRaw.slice(idx, idx + batchSize).map((item, i) => {
          const rawEstado = (item as any).estado?.toString().toLowerCase().trim() ?? "";
          let mappedEstado = "desconocido";
          if (rawEstado === "inoperativo" || rawEstado === "fuera_de_servicio") mappedEstado = "fuera_de_servicio";
          else if (rawEstado === "operativo") mappedEstado = "operativo";
          else if (rawEstado === "en_mantenimiento") mappedEstado = "en_mantenimiento";
          else if (rawEstado === "dado_de_baja") mappedEstado = "dado_de_baja";
          const eqNombre = (item.nombre || `Equipo ${idx + i + 1}`).toString().trim();
          const eqMarca = ((item as any).marca || "").toString().trim();
          const eqModelo = ((item as any).modelo || "").toString().trim();
          const eqSerial = ((item as any).serial || "").toString().trim();
          const eqUbicacion = ((item as any).ubicacion || "General").toString().trim();
          const input = `${eqUbicacion}|${eqNombre}|${eqSerial}|eq-${idx + i}`;
          let hash = 0;
          for (let j = 0; j < input.length; j++) hash = ((hash << 5) - hash + input.charCodeAt(j)) | 0;
          const detUuid = (hash >>> 0).toString(16).padStart(8, "0");
          return {
            uuid: detUuid, nombre: eqNombre, marca: eqMarca, modelo: eqModelo, serial: eqSerial,
            ubicacion: eqUbicacion, estado: mappedEstado,
            anio_fabricacion: ((item as any).anioFabricacion || "").toString().trim() || null,
            observaciones: ((item as any).observaciones || "").toString().trim() || null,
            servicio_tecnico: ((item as any).servicioTecnico || "").toString().trim() || null,
          };
        });
        const { error } = await supabase.from("equipos").upsert(batch, { onConflict: "uuid" });
        if (error) { console.error("Seed batch error:", error); throw error; }
        idx += batchSize;
      }
      toast.success(`${equiposImportRaw.length} equipos importados exitosamente`);
      // Force refetch
      window.location.reload();
    } catch (err: any) {
      toast.error(`Error al importar: ${err.message || err}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const areas = useMemo(() => {
    const set = new Set(equipos.map((e) => e.ubicacion || "Sin ubicación"));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }));
  }, [equipos]);

  const filtered = useMemo(() => {
    return equipos.filter((e) => {
      const s = search.toLowerCase();
      const ms = s === "" || e.nombre.toLowerCase().includes(s) || e.marca.toLowerCase().includes(s) || e.serial.toLowerCase().includes(s) || e.ubicacion.toLowerCase().includes(s);
      return ms && (statusFilter === "all" || e.estado === statusFilter) && (areaFilter === "all" || e.ubicacion === areaFilter);
    });
  }, [equipos, search, statusFilter, areaFilter]);

  const groupedByArea = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const eq of filtered) {
      const key = eq.ubicacion || "Sin ubicación";
      const list = map.get(key) || [];
      list.push(eq);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "es", { numeric: true, sensitivity: "base" }));
  }, [filtered]);

  const handleCreate = async () => {
    if (!form.nombre || !form.marca) { toast.error("Complete al menos nombre y marca del equipo"); return; }
    const newUuid = generateUUID();
    const eq: Equipment = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      uuid: newUuid,
      nombre: form.nombre, marca: form.marca, modelo: form.modelo, serial: form.serial,
      fechaAdquisicion: form.fechaAdquisicion, estado: form.estado, ubicacion: form.ubicacion,
      valorCompra: Number(form.valorCompra) || 0, vidaUtil: Number(form.vidaUtil) || 0,
      descripcion: form.descripcion || undefined, anioFabricacion: form.anioFabricacion || undefined,
      observaciones: form.observaciones || undefined, servicioTecnico: form.servicioTecnico || undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await createEquipo.mutateAsync(eq);
    toast.success("Equipo creado exitosamente");
    setIsDialogOpen(false);
    setForm({ nombre: "", marca: "", modelo: "", serial: "", fechaAdquisicion: "", ubicacion: "", estado: "operativo", valorCompra: "", vidaUtil: "", descripcion: "", anioFabricacion: "", observaciones: "", servicioTecnico: "" });
    const url = `${window.location.origin}/equipo/${newUuid}`;
    setSelectedQr({ url, nombre: form.nombre, uuid: newUuid });
    setQrDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) { await deleteEquipo.mutateAsync(deleteId); toast.success("Equipo eliminado"); setDeleteId(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Equipos Médicos</h1><p className="text-slate-500">{equipos.length} equipos registrados en {areas.length} áreas</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700 gap-2"><Plus className="w-4 h-4" /> Nuevo Equipo</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-lg">Registrar Nuevo Equipo</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div><div className="space-y-2"><Label>Marca *</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Modelo</Label><Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></div><div className="space-y-2"><Label>Serial</Label><Input value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Fecha Adquisición</Label><Input type="date" value={form.fechaAdquisicion} onChange={(e) => setForm({ ...form, fechaAdquisicion: e.target.value })} /></div><div className="space-y-2"><Label>Ubicación</Label><Input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="ej. UCI" /></div></div>
              <div className="grid grid-cols-3 gap-3"><div className="space-y-2"><Label>Estado</Label><Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as EquipmentStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="operativo">Operativo</SelectItem><SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem><SelectItem value="fuera_de_servicio">Fuera de Servicio</SelectItem><SelectItem value="dado_de_baja">Dado de Baja</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Valor Compra ($)</Label><Input type="number" value={form.valorCompra} onChange={(e) => setForm({ ...form, valorCompra: e.target.value })} /></div><div className="space-y-2"><Label>Vida Útil (años)</Label><Input type="number" value={form.vidaUtil} onChange={(e) => setForm({ ...form, vidaUtil: e.target.value })} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Año Fabricación</Label><Input value={form.anioFabricacion} onChange={(e) => setForm({ ...form, anioFabricacion: e.target.value })} placeholder="ej. 2022" /></div><div className="space-y-2"><Label>Servicio Técnico</Label><Input value={form.servicioTecnico} onChange={(e) => setForm({ ...form, servicioTecnico: e.target.value })} placeholder="ej. Philips Healthcare" /></div></div>
              <div className="space-y-2"><Label>Observaciones</Label><Input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
              <Button onClick={handleCreate} className="w-full bg-teal-600 hover:bg-teal-700" disabled={createEquipo.isPending}>{createEquipo.isPending ? "Guardando..." : "Guardar Equipo"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" /></div>
        <Select value={areaFilter} onValueChange={setAreaFilter}><SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Filtrar por área" /></SelectTrigger><SelectContent><SelectItem value="all">Todas las áreas</SelectItem>{areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="operativo">Operativo</SelectItem><SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem><SelectItem value="fuera_de_servicio">Fuera de Servicio</SelectItem><SelectItem value="dado_de_baja">Dado de Baja</SelectItem><SelectItem value="desconocido">Desconocido</SelectItem></SelectContent></Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => (<Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><div className="h-28 bg-slate-100 animate-pulse rounded-lg" /></CardContent></Card>))}</div>
      ) : (
        <div className="space-y-8">
          {groupedByArea.map(([area, items]) => (
            <section key={area}>
              <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 bg-slate-50/80 backdrop-blur py-1"><MapPin className="w-4 h-4 text-teal-600" /><h2 className="text-base font-semibold text-slate-800">{area}</h2><Badge className="bg-teal-50 text-teal-700 text-[10px]">{items.length}</Badge></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((eq) => (
                  <Card key={eq.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/equipos/${eq.id}`)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3"><div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-teal-600" /></div><Badge className={`text-[10px] ${statusColors[eq.estado]}`}>{statusLabels[eq.estado]}</Badge></div>
                      <h3 className="font-semibold text-slate-800 mb-1 truncate">{eq.nombre}</h3><p className="text-sm text-slate-500 mb-3">{eq.marca || "—"} {eq.modelo}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {eq.ubicacion}</span><span>SN: {eq.serial || "N/A"}</span></div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/equipos/${eq.id}`)}><Pencil className="w-3 h-3 mr-1" /> Editar</Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => { const url = `${window.location.origin}/equipo/${eq.uuid}`; setSelectedQr({ url, nombre: eq.nombre, uuid: eq.uuid }); setQrDialogOpen(true); }}><QrCode className="w-3 h-3 mr-1" /> QR</Button>
                        <Button variant="outline" size="sm" className="text-xs text-red-600" onClick={() => setDeleteId(eq.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!isLoading && equipos.length === 0 && (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50 shadow-none">
          <CardContent className="p-6 text-center">
            <Database className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-amber-800 mb-1">Base de datos vacía</p>
            <p className="text-xs text-amber-600 mb-4">
              Importa los {equiposImportRaw.length} equipos médicos para comenzar a trabajar con datos reales.
            </p>
            <Button
              onClick={handleSeedEquipment}
              disabled={isSeeding}
              className="bg-amber-600 hover:bg-amber-700 gap-2"
            >
              <Database className="w-4 h-4" />
              {isSeeding ? "Importando equipos..." : `Importar ${equiposImportRaw.length} Equipos`}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && equipos.length === 0 && isSeeding && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Importando equipos, por favor espere...</p>
        </div>
      )}

      {!isLoading && filtered.length === 0 && equipos.length > 0 && (<div className="text-center py-16"><Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No se encontraron equipos</p></div>)}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}><DialogContent className="max-w-sm text-center"><DialogHeader><DialogTitle className="text-base">Código QR</DialogTitle></DialogHeader><div className="flex flex-col items-center gap-3"><p className="text-sm font-medium">{selectedQr?.nombre}</p><QrCanvas url={selectedQr?.url ?? ""} /><p className="text-xs text-slate-400 break-all">{selectedQr?.url}</p><Button variant="outline" size="sm" className="text-xs" onClick={() => { const img = document.querySelector('img[alt="QR"]') as HTMLImageElement; if (img) { const a = document.createElement("a"); a.download = `qr-${selectedQr?.uuid}.png`; a.href = img.src; a.click(); } }}>Descargar PNG</Button></div></DialogContent></Dialog>
    </div>
  );
}

function QrCanvas({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => { if (url) { QRCode.toDataURL(url, { width: 200, margin: 2 }).then(setDataUrl); } }, [url]);
  return dataUrl ? <img src={dataUrl} alt="QR" className="w-48 h-48 rounded-lg border border-slate-200" /> : <div className="w-48 h-48 bg-slate-100 rounded-lg animate-pulse" />;
}
