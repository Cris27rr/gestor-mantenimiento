import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ClipboardList, Filter, Calendar, User, Wrench, Package, Trash2, X, Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useOrdenes, useEquiposLookup, useRepuestos, useUsuarios, useCreateOrden, useUpdateOrden, useDeleteOrden, useUpdateRepuesto } from "@/hooks/use-data";
import type { MaintenanceType, MaintenancePriority, WorkOrderStatus } from "@/types";

const typeLabels: Record<string, string> = { preventivo: "Preventivo", correctivo: "Correctivo", calibracion: "Calibración", verificacion: "Verificación" };
const priorityLabels: Record<string, string> = { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" };
const priorityColors: Record<string, string> = { baja: "bg-slate-100 text-slate-700", media: "bg-blue-100 text-blue-700", alta: "bg-amber-100 text-amber-700", critica: "bg-red-100 text-red-700" };
const statusLabels: Record<string, string> = { pendiente: "Pendiente", en_proceso: "En Proceso", finalizada: "Finalizada", verificada: "Verificada" };
const statusColors: Record<string, string> = { pendiente: "bg-amber-100 text-amber-700", en_proceso: "bg-blue-100 text-blue-700", finalizada: "bg-emerald-100 text-emerald-700", verificada: "bg-teal-100 text-teal-700" };

interface SpareUsageForm { repuestoId: string; nombre: string; cantidadUsada: string; }

export default function WorkOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOt, setSelectedOt] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ equipoId: "", tipo: "correctivo" as MaintenanceType, fechaProgramada: "", prioridad: "media" as MaintenancePriority, descripcion: "", tecnicoId: "" });
  const [spareUsage, setSpareUsage] = useState<SpareUsageForm[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ordenes = [] } = useOrdenes();

  // Pre-fill equipoId from URL query param (used by Dashboard alert shortcut)
  useEffect(() => {
    const equipoIdParam = searchParams.get("equipoId");
    if (equipoIdParam) {
      setForm((prev) => ({ ...prev, equipoId: equipoIdParam }));
      setIsDialogOpen(true);
    }
  }, [searchParams]);
  const { data: equipos = [] } = useEquiposLookup();
  const { data: repuestos = [] } = useRepuestos();
  const { data: usuariosRaw = [] } = useUsuarios();
  const createOrden = useCreateOrden();
  const updateOrden = useUpdateOrden();
  const deleteOrden = useDeleteOrden();
  const updateRepuesto = useUpdateRepuesto();

  const usuarios = usuariosRaw.filter((u) => u.rol === "tecnico" || u.rol === "admin" || u.rol === "director_departamento");

  const filtered = useMemo(() => {
    return ordenes
      .map((o) => ({ ...o, equipoNombre: equipos.find((e) => e.id === o.equipoId)?.nombre ?? "Desconocido" }))
      .filter((o) => {
        const s = search.toLowerCase();
        const ms = s === "" || o.equipoNombre.toLowerCase().includes(s) || o.descripcion.toLowerCase().includes(s) || (o.tecnicoAsignadoNombre?.toLowerCase().includes(s) ?? false);
        return ms && (statusFilter === "all" || o.estado === statusFilter);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordenes, equipos, search, statusFilter]);

  const addSpareRow = () => setSpareUsage([...spareUsage, { repuestoId: "", nombre: "", cantidadUsada: "1" }]);
  const removeSpareRow = (idx: number) => setSpareUsage(spareUsage.filter((_, i) => i !== idx));
  const updateSpareRow = (idx: number, field: keyof SpareUsageForm, value: string) => {
    const updated = [...spareUsage];
    if (field === "repuestoId") { const r = repuestos.find((rp) => rp.id === value); updated[idx] = { ...updated[idx], repuestoId: value, nombre: r?.nombre ?? "" }; }
    else updated[idx] = { ...updated[idx], [field]: value };
    setSpareUsage(updated);
  };

  const handleCreate = async () => {
    if (!form.equipoId || !form.descripcion.trim()) { toast.error("Complete equipo y descripción"); return; }
    if (form.descripcion.trim().length < 10) { toast.error("La descripción debe tener al menos 10 caracteres"); return; }
    const tecnico = usuarios.find((u) => u.id === form.tecnicoId);
    const repuestosUsados = spareUsage.filter((s) => s.repuestoId && s.nombre).map((s) => ({ repuestoId: s.repuestoId, nombre: s.nombre, cantidadUsada: Number(s.cantidadUsada) || 1 }));
    for (const usage of repuestosUsados) {
      const r = repuestos.find((rp) => rp.id === usage.repuestoId);
      if (r) await updateRepuesto.mutateAsync({ id: r.id, updates: { cantidad: Math.max(0, r.cantidad - usage.cantidadUsada) } });
    }
    await createOrden.mutateAsync({
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      equipoId: form.equipoId, tipo: form.tipo, fechaProgramada: form.fechaProgramada || undefined,
      prioridad: form.prioridad, estado: "pendiente", descripcion: form.descripcion.trim(),
      tecnicoAsignadoId: form.tecnicoId || undefined, tecnicoAsignadoNombre: tecnico?.nombre,
      repuestosUsados,
      fotosAntes: uploadedImages.length > 0 ? uploadedImages : undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    } as any);
    toast.success("Orden de trabajo creada");
    setIsDialogOpen(false); setForm({ equipoId: "", tipo: "correctivo", fechaProgramada: "", prioridad: "media", descripcion: "", tecnicoId: "" }); setSpareUsage([]); setUploadedImages([]);
  };

  const handleStatusChange = async (id: string, newStatus: WorkOrderStatus) => {
    const orden = ordenes.find((o) => o.id === id);
    if (!orden) return;
    const updates: any = { estado: newStatus, updatedAt: new Date().toISOString() };
    if (newStatus === "en_proceso") updates.fechaEjecucion = new Date().toISOString().split("T")[0];
    if (newStatus === "finalizada" || newStatus === "verificada") updates.fechaCierre = new Date().toISOString().split("T")[0];
    await updateOrden.mutateAsync({ id, updates });
    toast.success(`Estado actualizado a: ${statusLabels[newStatus]}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar esta orden de trabajo?")) { await deleteOrden.mutateAsync(id); toast.success("Orden eliminada"); }
  };

  const selectedOrder = selectedOt ? ordenes.find((o) => o.id === selectedOt) : null;
  const selectedEquipo = selectedOrder ? equipos.find((e) => e.id === selectedOrder.equipoId) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Órdenes de Trabajo</h1><p className="text-slate-500">Gestión de mantenimientos y reparaciones</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setSpareUsage([]); }}>
          <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700 gap-2"><Plus className="w-4 h-4" /> Nueva OT</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-lg">Crear Orden de Trabajo</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Equipo *</Label><Select value={form.equipoId} onValueChange={(v) => setForm({ ...form, equipoId: v })}><SelectTrigger><SelectValue placeholder="Seleccione un equipo" /></SelectTrigger><SelectContent>{equipos.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nombre} · {e.ubicacion}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as MaintenanceType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="preventivo">Preventivo</SelectItem><SelectItem value="correctivo">Correctivo</SelectItem><SelectItem value="calibracion">Calibración</SelectItem><SelectItem value="verificacion">Verificación</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Prioridad</Label><Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v as MaintenancePriority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="baja">Baja</SelectItem><SelectItem value="media">Media</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="critica">Crítica</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Fecha Programada</Label><Input type="date" value={form.fechaProgramada} onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })} /></div>
              <div className="space-y-2"><Label>Técnico Asignado</Label><Select value={form.tecnicoId} onValueChange={(v) => setForm({ ...form, tecnicoId: v })}><SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger><SelectContent><SelectItem value="none">Sin asignar</SelectItem>{usuarios.map((u) => (<SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Descripción *</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describa el trabajo (mínimo 10 caracteres)" rows={3} /></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> Repuestos</Label><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addSpareRow}><Plus className="w-3 h-3 mr-1" /> Agregar</Button></div>
                {spareUsage.map((s, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select value={s.repuestoId} onValueChange={(v) => updateSpareRow(idx, "repuestoId", v)}><SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{repuestos.map((r) => (<SelectItem key={r.id} value={r.id}>{r.nombre} (Stock: {r.cantidad})</SelectItem>))}</SelectContent></Select>
                    <Input type="number" min="1" value={s.cantidadUsada} onChange={(e) => updateSpareRow(idx, "cantidadUsada", e.target.value)} className="w-16 h-8 text-xs" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeSpareRow(idx)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Fotos (Antes)</Label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const readers: Promise<string>[] = [];
                  for (let i = 0; i < files.length; i++) {
                    readers.push(new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(files[i]);
                    }));
                  }
                  Promise.all(readers).then((urls) => {
                    setUploadedImages((prev) => [...prev, ...urls]);
                  });
                  e.target.value = "";
                }} />
                <Button type="button" variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-3 h-3" /> Subir imágenes
                </Button>
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                          onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={handleCreate} className="w-full bg-teal-600 hover:bg-teal-700" disabled={createOrden.isPending}>{createOrden.isPending ? "Creando..." : "Crear Orden de Trabajo"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[200px]"><Filter className="w-3 h-3 mr-2" /><SelectValue placeholder="Filtrar estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pendiente">Pendiente</SelectItem><SelectItem value="en_proceso">En Proceso</SelectItem><SelectItem value="finalizada">Finalizada</SelectItem><SelectItem value="verificada">Verificada</SelectItem></SelectContent></Select>
      </div>

      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Equipo</TableHead><TableHead>Tipo</TableHead><TableHead>Prioridad</TableHead><TableHead>Estado</TableHead><TableHead>Técnico</TableHead><TableHead>Programada</TableHead><TableHead className="w-[140px]">Acciones</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((o) => (
          <TableRow key={o.id} className="cursor-pointer hover:bg-slate-50" onClick={() => { setSelectedOt(o.id); setDetailOpen(true); }}>
            <TableCell className="font-medium text-slate-800">{o.equipoNombre}</TableCell>
            <TableCell><span className="text-sm text-slate-600">{typeLabels[o.tipo]}</span></TableCell>
            <TableCell><Badge className={`text-[10px] ${priorityColors[o.prioridad]}`}>{priorityLabels[o.prioridad]}</Badge></TableCell>
            <TableCell><Badge className={`text-[10px] ${statusColors[o.estado]}`}>{statusLabels[o.estado]}</Badge></TableCell>
            <TableCell className="text-sm text-slate-600">{o.tecnicoAsignadoNombre ?? "—"}</TableCell>
            <TableCell className="text-sm text-slate-500">{o.fechaProgramada ?? "—"}</TableCell>
            <TableCell><div className="flex gap-1"><Select value={o.estado} onValueChange={(v) => { if (o.estado !== v) handleStatusChange(o.id, v as WorkOrderStatus); }}><SelectTrigger className="h-7 text-xs w-[110px]" onClick={(e) => e.stopPropagation()}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, l]) => (<SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>))}</SelectContent></Select><Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(o.id); }}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell>
          </TableRow>
        ))}
      </TableBody></Table></div>{filtered.length === 0 && (<div className="text-center py-12"><ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">No se encontraron órdenes</p></div>)}</CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="text-lg">Detalle de OT</DialogTitle></DialogHeader>
        {selectedOrder && selectedEquipo && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Equipo</p><p className="font-medium text-slate-800">{selectedEquipo.nombre}</p><p className="text-xs text-slate-500">{selectedEquipo.ubicacion} · {selectedEquipo.marca} {selectedEquipo.modelo}</p></div>
            <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500">Tipo</p><p className="text-sm font-medium">{typeLabels[selectedOrder.tipo]}</p></div><div><p className="text-xs text-slate-500">Prioridad</p><Badge className={`text-[10px] mt-1 ${priorityColors[selectedOrder.prioridad]}`}>{priorityLabels[selectedOrder.prioridad]}</Badge></div></div>
            <div><p className="text-xs text-slate-500">Estado</p><Select value={selectedOrder.estado} onValueChange={(v) => handleStatusChange(selectedOrder.id, v as WorkOrderStatus)}><SelectTrigger className="w-[180px] mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, l]) => (<SelectItem key={k} value={k}>{l}</SelectItem>))}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Programada</p><p className="text-sm">{selectedOrder.fechaProgramada ?? "—"}</p></div><div><p className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Técnico</p><p className="text-sm">{selectedOrder.tecnicoAsignadoNombre ?? "Sin asignar"}</p></div></div>
            <div><p className="text-xs text-slate-500">Descripción</p><p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg">{selectedOrder.descripcion}</p></div>
            {selectedOrder.repuestosUsados?.length > 0 && (<div><p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Package className="w-3 h-3" /> Repuestos</p><div className="space-y-1">{selectedOrder.repuestosUsados.map((r: any) => (<div key={r.repuestoId} className="flex justify-between text-sm p-2 bg-slate-50 rounded"><span>{r.nombre}</span><span className="font-medium">x{r.cantidadUsada}</span></div>))}</div></div>)}
            {(selectedOrder.fotosAntes?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Camera className="w-3 h-3" /> Fotos ({selectedOrder.fotosAntes!.length})</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedOrder.fotosAntes!.map((url, idx) => (
                    <img key={idx} src={url} alt={`Foto ${idx + 1}`} className="w-20 h-20 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(url, "_blank")} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent></Dialog>
    </div>
  );
}
