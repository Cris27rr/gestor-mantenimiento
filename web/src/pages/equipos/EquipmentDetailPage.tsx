import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Stethoscope, QrCode, Save, FileText, Wrench, MapPin, AlertTriangle, Factory, Info, Upload, Trash2, Package, Plus, Pencil, ClipboardList, Download, FileCheck } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useAuth } from "@/context/AuthContext";
import { generateEquipmentReport } from "@/lib/equipmentReport";
import { useEquipo, useUpdateEquipo } from "@/hooks/use-data";
import { useOrdenesByEquipo } from "@/hooks/use-data";
import { useMovimientosByEquipo, useCreateMovimiento } from "@/hooks/use-data";
import { useFallasByEquipo } from "@/hooks/use-data";
import { useDocumentosByEquipo, useCreateDocumento, useDeleteDocumento } from "@/hooks/use-data";
import { useMantenimientosByEquipo } from "@/hooks/use-data";
import { useRepuestos, useRepuestosEquipoByEquipo, useCreateRepuestoEquipo, useUpdateRepuestoEquipo, useDeleteRepuestoEquipo } from "@/hooks/use-data";
import type { Document, SparePartAssignment, Equipment } from "@/types";

const statusLabels: Record<string, string> = { operativo: "Operativo", en_mantenimiento: "En Mantenimiento", fuera_de_servicio: "Fuera de Servicio", dado_de_baja: "Dado de Baja", desconocido: "Desconocido" };
const statusColors: Record<string, string> = { operativo: "bg-emerald-100 text-emerald-700", en_mantenimiento: "bg-amber-100 text-amber-700", fuera_de_servicio: "bg-red-100 text-red-700", dado_de_baja: "bg-slate-100 text-slate-600", desconocido: "bg-slate-100 text-slate-500" };

const defaultEquipment: Equipment = {
  id: "", uuid: "", nombre: "", marca: "", modelo: "", serial: "",
  fechaAdquisicion: "", estado: "operativo", ubicacion: "", valorCompra: 0,
  vidaUtil: 10, createdAt: "", updatedAt: "",
};

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveForm, setMoveForm] = useState({ destino: "", responsable: "", motivo: "" });
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [docForm, setDocForm] = useState({ tipo: "manual" as Document["tipo"], nombre: "", fechaVencimiento: "" });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [spDialogOpen, setSpDialogOpen] = useState(false);
  const [spEditId, setSpEditId] = useState<string | null>(null);
  const [spForm, setSpForm] = useState({ repuestoId: "", cantidadActual: "1", ubicacionFisica: "", observaciones: "" });
  const [editForm, setEditForm] = useState<Equipment>(defaultEquipment);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportOpts, setReportOpts] = useState({
    includeFallas: true,
    includeMantenimientos: true,
    includeTraslados: true,
    includeOrdenes: true,
    includeRepuestos: true,
  });
  const [selectedOrdenIds, setSelectedOrdenIds] = useState<string[]>([]);
  const [selectedFallaIds, setSelectedFallaIds] = useState<string[]>([]);
  const [selectedMovimientoIds, setSelectedMovimientoIds] = useState<string[]>([]);
  const [selectedMantenimientoIds, setSelectedMantenimientoIds] = useState<string[]>([]);
  const [reportNotes, setReportNotes] = useState("");
  const { user: currentUser } = useAuth();

  const { data: eq, isLoading, error } = useEquipo(id);
  const updateEquipo = useUpdateEquipo();
  const { data: ordenes = [] } = useOrdenesByEquipo(id);
  const { data: movimientos = [] } = useMovimientosByEquipo(id);
  const createMovimiento = useCreateMovimiento();
  const { data: fallas = [] } = useFallasByEquipo(id);
  const { data: documentos = [] } = useDocumentosByEquipo(id);
  const createDocumento = useCreateDocumento();
  const deleteDocumento = useDeleteDocumento();
  const { data: mantenimientos = [] } = useMantenimientosByEquipo(id);
  const { data: spareAssignments = [] } = useRepuestosEquipoByEquipo(id);
  const { data: allSpares = [] } = useRepuestos();
  const createSpareEquipo = useCreateRepuestoEquipo();
  const updateSpareEquipo = useUpdateRepuestoEquipo();
  const deleteSpareEquipo = useDeleteRepuestoEquipo();

  // Sync editForm when equipment data loads (avoids conditional hook call)
  useEffect(() => {
    if (eq) setEditForm({ ...eq });
  }, [eq]);

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Cargando equipo...</div>;
  if (error || !eq) return <div className="p-8 text-center text-slate-500">Equipo no encontrado</div>;

  const handleSave = async () => {
    await updateEquipo.mutateAsync({ id: eq.id, updates: { ...editForm, updatedAt: new Date().toISOString() } });
    toast.success("Equipo actualizado"); setIsEditing(false);
  };

  const generateQr = async () => {
    const url = `${window.location.origin}/equipo/${eq.uuid}`;
    const data = await QRCode.toDataURL(url, { width: 240, margin: 2 });
    setQrDataUrl(data); setQrOpen(true);
  };

  const handleMove = async () => {
    if (!moveForm.destino || !moveForm.responsable) { toast.error("Complete los campos obligatorios"); return; }
    await createMovimiento.mutateAsync({ id: crypto.randomUUID?.() ?? Date.now().toString(), equipoId: eq.id, fecha: new Date().toISOString().split("T")[0], ubicacionOrigen: eq.ubicacion, ubicacionDestino: moveForm.destino, responsable: moveForm.responsable, motivo: moveForm.motivo, createdAt: new Date().toISOString() });
    await updateEquipo.mutateAsync({ id: eq.id, updates: { ubicacion: moveForm.destino, updatedAt: new Date().toISOString() } });
    toast.success("Traslado registrado"); setMoveDialogOpen(false); setMoveForm({ destino: "", responsable: "", motivo: "" });
  };

  const handleAddDoc = () => {
    if (!docForm.nombre) { toast.error("Ingrese el nombre del documento"); return; }
    let fileUrl = "#";
    const createDoc = (url: string) => {
      createDocumento.mutateAsync({ id: crypto.randomUUID?.() ?? Date.now().toString(), equipoId: eq.id, tipo: docForm.tipo, nombre: docForm.nombre, archivoUrl: url, fechaVencimiento: docForm.fechaVencimiento || undefined, createdAt: new Date().toISOString() } as Document).then(() => {
        toast.success("Documento registrado"); setDocDialogOpen(false); setDocForm({ tipo: "manual", nombre: "", fechaVencimiento: "" }); setDocFile(null);
      });
    };
    if (docFile) { const reader = new FileReader(); reader.onload = () => createDoc(reader.result as string); reader.readAsDataURL(docFile); }
    else createDoc(fileUrl);
  };

  const handleDeleteDoc = async (docId: string) => { if (confirm("¿Eliminar?")) { await deleteDocumento.mutateAsync(docId); toast.success("Documento eliminado"); } };

  const handleSaveSpare = async () => {
    if (!spForm.repuestoId || !spForm.cantidadActual) { toast.error("Seleccione repuesto y cantidad"); return; }
    const r = allSpares.find((x) => x.id === spForm.repuestoId);
    if (spEditId) {
      await updateSpareEquipo.mutateAsync({ id: spEditId, updates: { repuestoId: spForm.repuestoId, repuestoNombre: r?.nombre ?? "", cantidadActual: Number(spForm.cantidadActual), ubicacionFisica: spForm.ubicacionFisica, observaciones: spForm.observaciones } });
      toast.success("Asignación actualizada");
    } else {
      await createSpareEquipo.mutateAsync({ id: crypto.randomUUID?.() ?? Date.now().toString(), equipoId: eq.id, repuestoId: spForm.repuestoId, repuestoNombre: r?.nombre ?? "", cantidadActual: Number(spForm.cantidadActual), ubicacionFisica: spForm.ubicacionFisica, fechaAsignacion: new Date().toISOString().split("T")[0], observaciones: spForm.observaciones, createdAt: new Date().toISOString() } as SparePartAssignment);
      toast.success("Repuesto asignado");
    }
    setSpDialogOpen(false); setSpEditId(null); setSpForm({ repuestoId: "", cantidadActual: "1", ubicacionFisica: "", observaciones: "" });
  };

  const handleDeleteSpare = async (spId: string) => { if (confirm("¿Eliminar?")) { await deleteSpareEquipo.mutateAsync(spId); toast.success("Asignación eliminada"); } };

  const depreciacionEstimada = Math.round((eq.valorCompra ?? 0) * 0.1 * ((new Date().getFullYear() - new Date(eq.fechaAdquisicion || Date.now()).getFullYear()) || 1));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/equipos")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1"><h1 className="text-2xl font-bold text-slate-800">{eq.nombre}</h1><p className="text-slate-500">{eq.marca} {eq.modelo} · SN: {eq.serial || "N/A"}</p></div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setReportOpen(true)} className="gap-1"><FileText className="w-4 h-4" /> Informe</Button>
          <Button variant="outline" size="sm" onClick={generateQr}><QrCode className="w-4 h-4 mr-1" /> QR</Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>{isEditing ? "Cancelar" : "Editar"}</Button>
          {isEditing && <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Guardar</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm"><CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Nombre</Label><Input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} /></div><div className="space-y-2"><Label>Marca</Label><Input value={editForm.marca} onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })} /></div></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Modelo</Label><Input value={editForm.modelo} onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })} /></div><div className="space-y-2"><Label>Serial</Label><Input value={editForm.serial} onChange={(e) => setEditForm({ ...editForm, serial: e.target.value })} /></div></div>
                <div className="grid grid-cols-3 gap-3"><div className="space-y-2"><Label>Ubicación</Label><Input value={editForm.ubicacion} onChange={(e) => setEditForm({ ...editForm, ubicacion: e.target.value })} /></div><div className="space-y-2"><Label>Estado</Label><Select value={editForm.estado} onValueChange={(v) => setEditForm({ ...editForm, estado: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="operativo">Operativo</SelectItem><SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem><SelectItem value="fuera_de_servicio">Fuera de Servicio</SelectItem><SelectItem value="dado_de_baja">Dado de Baja</SelectItem><SelectItem value="desconocido">Desconocido</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Año Fabricación</Label><Input value={editForm.anioFabricacion ?? ""} onChange={(e) => setEditForm({ ...editForm, anioFabricacion: e.target.value })} /></div></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Valor Compra ($)</Label><Input type="number" value={editForm.valorCompra} onChange={(e) => setEditForm({ ...editForm, valorCompra: Number(e.target.value) })} /></div><div className="space-y-2"><Label>Vida Útil (años)</Label><Input type="number" value={editForm.vidaUtil} onChange={(e) => setEditForm({ ...editForm, vidaUtil: Number(e.target.value) })} /></div></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Servicio Técnico</Label><Input value={editForm.servicioTecnico ?? ""} onChange={(e) => setEditForm({ ...editForm, servicioTecnico: e.target.value })} /></div><div className="space-y-2"><Label>Fecha Adquisición</Label><Input type="date" value={editForm.fechaAdquisicion ? editForm.fechaAdquisicion.split("T")[0] : ""} onChange={(e) => setEditForm({ ...editForm, fechaAdquisicion: e.target.value })} /></div></div>
                <div className="space-y-2"><Label>Observaciones</Label><Input value={editForm.observaciones ?? ""} onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })} /></div>
                <div className="space-y-2"><Label>Descripción</Label><Input value={editForm.descripcion ?? ""} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado</p><Badge className={statusColors[eq.estado]}>{statusLabels[eq.estado]}</Badge></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ubicación</p><p className="text-sm font-medium text-slate-800 flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" />{eq.ubicacion}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Año Fabricación</p><p className="text-sm font-medium text-slate-800 flex items-center gap-1"><Factory className="w-4 h-4 text-slate-400" />{eq.anioFabricacion || "N/A"}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha Adquisición</p><p className="text-sm font-medium text-slate-800">{eq.fechaAdquisicion || "No registrada"}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Valor Compra</p><p className="text-sm font-medium text-slate-800">${eq.valorCompra?.toLocaleString() ?? 0}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Vida Útil</p><p className="text-sm font-medium text-slate-800">{eq.vidaUtil} años</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Depreciación Estimada</p><p className="text-sm font-medium text-slate-800">${depreciacionEstimada}</p></div>
                <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Servicio Técnico</p><p className="text-sm font-medium text-slate-800">{eq.servicioTecnico || "No asignado"}</p></div>
                {eq.observaciones && (<div className="col-span-2"><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observaciones</p><p className="text-sm text-slate-700 flex items-start gap-1"><Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />{eq.observaciones}</p></div>)}
                {eq.descripcion && (<div className="col-span-2"><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Descripción</p><p className="text-sm text-slate-700">{eq.descripcion}</p></div>)}
              </div>
            )}
          </CardContent></Card>

          <Tabs defaultValue="ordenes" className="w-full">
            <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">
              <TabsTrigger value="ordenes" className="text-xs">Órdenes ({ordenes.length})</TabsTrigger>
              <TabsTrigger value="movimientos" className="text-xs">Traslados ({movimientos.length})</TabsTrigger>
              <TabsTrigger value="fallas" className="text-xs">Fallas ({fallas.length})</TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs">Documentos ({documentos.length})</TabsTrigger>
              <TabsTrigger value="repuestos" className="text-xs">Repuestos ({spareAssignments.length})</TabsTrigger>
              <TabsTrigger value="mantenimiento" className="text-xs">Programación</TabsTrigger>
            </TabsList>

            <TabsContent value="ordenes" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-2">{ordenes.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Sin órdenes de trabajo</p> : ordenes.map((o) => (<div key={o.id} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between"><div><p className="text-sm font-medium text-slate-800 capitalize">{o.tipo} · {o.prioridad}</p><p className="text-xs text-slate-500">{o.descripcion}</p></div><Badge className="text-[10px] bg-amber-100 text-amber-700">{o.estado.replace("_", " ")}</Badge></div>))}</CardContent></Card></TabsContent>

            <TabsContent value="movimientos" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex justify-end mb-3"><Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}><DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><MapPin className="w-3 h-3 mr-1" /> Registrar Traslado</Button></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-base">Registrar Traslado</DialogTitle></DialogHeader><div className="space-y-3 pt-2"><div className="space-y-2"><Label>Ubicación Destino *</Label><Input value={moveForm.destino} onChange={(e) => setMoveForm({ ...moveForm, destino: e.target.value })} /></div><div className="space-y-2"><Label>Responsable *</Label><Input value={moveForm.responsable} onChange={(e) => setMoveForm({ ...moveForm, responsable: e.target.value })} /></div><div className="space-y-2"><Label>Motivo</Label><Input value={moveForm.motivo} onChange={(e) => setMoveForm({ ...moveForm, motivo: e.target.value })} /></div><Button onClick={handleMove} className="w-full bg-teal-600 hover:bg-teal-700">Registrar</Button></div></DialogContent></Dialog></div>{movimientos.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Sin traslados</p> : <div className="space-y-2">{movimientos.map((m) => (<div key={m.id} className="p-3 rounded-lg bg-slate-50 text-sm"><p className="font-medium text-slate-800">{m.ubicacionOrigen} → {m.ubicacionDestino}</p><p className="text-xs text-slate-500">{m.fecha} · {m.responsable}{m.motivo ? ` · ${m.motivo}` : ""}</p></div>))}</div>}</CardContent></Card></TabsContent>

            <TabsContent value="fallas" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-2">{fallas.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Sin fallas reportadas para este equipo</p> : fallas.map((f) => (<div key={f.id} className="p-3 rounded-lg bg-red-50 flex items-start gap-3"><AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm text-slate-800">{f.descripcion}</p><p className="text-xs text-slate-500">Reportado por: {f.reportadoPor} ({f.tipoReportante === "personal_medico" ? "Personal Médico" : f.tipoReportante === "paciente" ? "Paciente" : f.tipoReportante === "familiar" ? "Familiar" : f.tipoReportante === "tecnico" ? "Técnico" : "Otro"}) · {f.fechaReporte}</p>{f.ordenTrabajoId && (<button onClick={() => navigate("/ordenes")} className="text-xs text-teal-600 hover:text-teal-800 mt-1 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Ver orden de trabajo asociada</button>)}</div><Badge className={`text-[10px] shrink-0 ${f.estado === "pendiente" ? "bg-red-100 text-red-700" : f.estado === "en_proceso" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{f.estado === "pendiente" ? "Pendiente" : f.estado === "en_proceso" ? "En Proceso" : "Resuelto"}</Badge></div>))}</CardContent></Card></TabsContent>

            <TabsContent value="documentos" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex justify-end mb-3"><Dialog open={docDialogOpen} onOpenChange={(v) => { setDocDialogOpen(v); if (!v) { setDocFile(null); setDocForm({ tipo: "manual", nombre: "", fechaVencimiento: "" }); } }}><DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><Upload className="w-3 h-3 mr-1" /> Subir Documento</Button></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-base">Subir Documento</DialogTitle></DialogHeader><div className="space-y-3 pt-2"><div className="space-y-2"><Label>Tipo</Label><Select value={docForm.tipo} onValueChange={(v) => setDocForm({ ...docForm, tipo: v as Document["tipo"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="certificado_calibracion">Certificado de Calibración</SelectItem><SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem><SelectItem value="reporte_seguridad">Reporte de Seguridad</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Nombre *</Label><Input value={docForm.nombre} onChange={(e) => setDocForm({ ...docForm, nombre: e.target.value })} /></div><div className="space-y-2"><Label>Archivo</Label><Input ref={fileInputRef} type="file" className="text-xs" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDocFile(f); if (!docForm.nombre) setDocForm({ ...docForm, nombre: f.name }); } }} /><p className="text-xs text-slate-400">Formatos: PDF, JPG, PNG, DOC</p></div><div className="space-y-2"><Label>Fecha de Vencimiento</Label><Input type="date" value={docForm.fechaVencimiento} onChange={(e) => setDocForm({ ...docForm, fechaVencimiento: e.target.value })} /></div><Button onClick={handleAddDoc} className="w-full bg-teal-600 hover:bg-teal-700">Subir Documento</Button></div></DialogContent></Dialog></div>{documentos.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Sin documentos</p> : <div className="space-y-2">{documentos.map((d) => (<div key={d.id} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between text-sm"><div className="flex items-center gap-3"><FileText className="w-4 h-4 text-slate-400" /><div><p className="font-medium text-slate-800">{d.nombre}</p><p className="text-xs text-slate-500 capitalize">{(d.tipo === "certificado_calibracion" ? "Certificado de Calibración" : d.tipo === "ficha_tecnica" ? "Ficha Técnica" : d.tipo === "reporte_seguridad" ? "Reporte de Seguridad" : d.tipo === "manual" ? "Manual" : d.tipo)}</p></div></div><div className="flex items-center gap-2">{d.fechaVencimiento && <Badge variant="outline" className="text-[10px]">Vence: {d.fechaVencimiento}</Badge>}<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (d.archivoUrl && d.archivoUrl !== "#") { const a = document.createElement("a"); a.href = d.archivoUrl; a.download = d.nombre; a.click(); } else toast.info("Sin archivo adjunto"); }}><FileText className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteDoc(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div></div>))}</div>}</CardContent></Card></TabsContent>

            <TabsContent value="repuestos" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex justify-end mb-3"><Dialog open={spDialogOpen} onOpenChange={(v) => { setSpDialogOpen(v); if (!v) { setSpEditId(null); setSpForm({ repuestoId: "", cantidadActual: "1", ubicacionFisica: "", observaciones: "" }); } }}><DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><Plus className="w-3 h-3 mr-1" /> Agregar Repuesto</Button></DialogTrigger><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-base">{spEditId ? "Editar" : "Asignar"} Repuesto</DialogTitle></DialogHeader><div className="space-y-3 pt-2"><div className="space-y-2"><Label>Repuesto *</Label><Select value={spForm.repuestoId} onValueChange={(v) => setSpForm({ ...spForm, repuestoId: v })} disabled={!!spEditId}><SelectTrigger><SelectValue placeholder="Seleccione un repuesto" /></SelectTrigger><SelectContent>{allSpares.map((r) => (<SelectItem key={r.id} value={r.id}>{r.nombre} (Stock: {r.cantidad})</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label>Cantidad *</Label><Input type="number" min="1" value={spForm.cantidadActual} onChange={(e) => setSpForm({ ...spForm, cantidadActual: e.target.value })} /></div><div className="space-y-2"><Label>Ubicación Física</Label><Input value={spForm.ubicacionFisica} onChange={(e) => setSpForm({ ...spForm, ubicacionFisica: e.target.value })} placeholder="ej. Gaveta 3, Taller" /></div><div className="space-y-2"><Label>Observaciones</Label><Input value={spForm.observaciones} onChange={(e) => setSpForm({ ...spForm, observaciones: e.target.value })} /></div><Button onClick={handleSaveSpare} className="w-full bg-teal-600 hover:bg-teal-700">{spEditId ? "Guardar Cambios" : "Asignar Repuesto"}</Button></div></DialogContent></Dialog></div>{spareAssignments.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Sin repuestos asignados</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Repuesto</TableHead><TableHead>Cantidad</TableHead><TableHead>Ubicación</TableHead><TableHead>Asignado</TableHead><TableHead className="w-[100px]">Acciones</TableHead></TableRow></TableHeader><TableBody>{spareAssignments.map((s) => (<TableRow key={s.id}><TableCell className="font-medium text-slate-800">{s.repuestoNombre}</TableCell><TableCell>{s.cantidadActual}</TableCell><TableCell className="text-sm text-slate-500">{s.ubicacionFisica || "—"}</TableCell><TableCell className="text-sm text-slate-500">{s.fechaAsignacion}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSpEditId(s.id); setSpForm({ repuestoId: s.repuestoId, cantidadActual: String(s.cantidadActual), ubicacionFisica: s.ubicacionFisica, observaciones: s.observaciones }); setSpDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteSpare(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div>}</CardContent></Card></TabsContent>

            <TabsContent value="mantenimiento" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-4">{mantenimientos.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Sin mantenimientos programados</p> : <div className="space-y-2">{mantenimientos.map((m) => (<div key={m.id} className="p-3 rounded-lg bg-slate-50 text-sm flex items-center justify-between"><div><p className="font-medium text-slate-800">Cada {m.frecuenciaMeses} meses</p><p className="text-xs text-slate-500">Próximo: {m.proximaFecha}{m.horasUso ? ` · ${m.horasUso}h de uso` : ""}</p></div><Badge className={m.activo ? "bg-emerald-100 text-emerald-700 text-[10px]" : "bg-slate-100 text-slate-600 text-[10px]"}>{m.activo ? "Activo" : "Inactivo"}</Badge></div>))}</div>}</CardContent></Card></TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3"><Stethoscope className="w-6 h-6 text-teal-600" /></div>
            <p className="text-sm font-medium text-slate-800">Código QR</p>
            <p className="text-xs text-slate-500 mb-3">Escanee para ver información pública</p>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={generateQr}><QrCode className="w-3.5 h-3.5 mr-1" /> Ver / Descargar QR</Button>
            <p className="text-[10px] text-slate-400 mt-2 break-all">{window.location.origin}/equipo/{eq.uuid}</p>
          </CardContent></Card>
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}><DialogContent className="max-w-sm text-center"><DialogHeader><DialogTitle className="text-base">Código QR</DialogTitle></DialogHeader><div className="flex flex-col items-center gap-3">{qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-56 h-56 rounded-lg border border-slate-200" /> : <div className="w-56 h-56 bg-slate-100 rounded-lg animate-pulse" />}<p className="text-xs text-slate-400 break-all">{window.location.origin}/equipo/{eq.uuid}</p><Button variant="outline" size="sm" className="text-xs" onClick={() => { if (qrDataUrl) { const a = document.createElement("a"); a.download = `qr-${eq.uuid}.png`; a.href = qrDataUrl; a.click(); } }}>Descargar PNG</Button></div></DialogContent></Dialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={(v) => {
        setReportOpen(v);
        if (!v) {
          setSelectedOrdenIds([]);
          setSelectedFallaIds([]);
          setSelectedMovimientoIds([]);
          setSelectedMantenimientoIds([]);
          setReportNotes("");
        }
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-teal-600" /> Generar Informe de Equipo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Signature preview */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-2">El informe se firmará con tus datos:</p>
              <div className="flex items-center gap-3">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.nombre} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-700">{currentUser?.nombre.charAt(0).toUpperCase() ?? "?"}</div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{currentUser?.nombre ?? "Usuario no identificado"}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email ?? "—"}</p>
                  <p className="text-xs text-teal-600">{currentUser?.rol === "admin" ? "Administrador" : currentUser?.rol === "director_departamento" ? "Director de Departamento" : currentUser?.rol === "tecnico" ? "Técnico de Mantenimiento" : currentUser?.rol === "clinico" ? "Personal Clínico" : currentUser?.rol}</p>
                </div>
              </div>
            </div>

            {/* Event type toggles with per-item selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Eventos a incluir en el informe:</p>

              {/* Órdenes de Trabajo */}
              {ordenes.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <label className="flex items-center justify-between p-2.5 bg-white cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={reportOpts.includeOrdenes} onChange={(e) => setReportOpts({ ...reportOpts, includeOrdenes: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">📋 Órdenes de Trabajo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reportOpts.includeOrdenes && (
                        <button onClick={(e) => { e.preventDefault(); setSelectedOrdenIds(selectedOrdenIds.length === ordenes.length ? [] : ordenes.map(o => o.id)); }} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100">{selectedOrdenIds.length === ordenes.length ? "Quitar todas" : "Seleccionar todas"}</button>
                      )}
                      <Badge className="text-[10px] bg-slate-100 text-slate-600">{ordenes.length}</Badge>
                    </div>
                  </label>
                  {reportOpts.includeOrdenes && (
                    <div className="border-t border-slate-100 bg-slate-50/50 max-h-40 overflow-y-auto">
                      {ordenes.map((o) => (
                        <label key={o.id} className="flex items-start gap-2 p-2 hover:bg-white cursor-pointer">
                          <input type="checkbox" checked={selectedOrdenIds.includes(o.id)} onChange={(e) => setSelectedOrdenIds(e.target.checked ? [...selectedOrdenIds, o.id] : selectedOrdenIds.filter(id => id !== o.id))} className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700 capitalize">{o.tipo} · {o.prioridad} · <span className="text-slate-500">{o.estado.replace("_", " ")}</span></p>
                            <p className="text-xs text-slate-400 truncate">{o.descripcion}</p>
                          </div>
                        </label>
                      ))}
                      {selectedOrdenIds.length === 0 && <p className="text-[10px] text-slate-400 p-2 italic">Si no selecciona ninguna, se incluirán todas</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Fallas */}
              {fallas.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <label className="flex items-center justify-between p-2.5 bg-white cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={reportOpts.includeFallas} onChange={(e) => setReportOpts({ ...reportOpts, includeFallas: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">⚠️ Fallas Reportadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reportOpts.includeFallas && (
                        <button onClick={(e) => { e.preventDefault(); setSelectedFallaIds(selectedFallaIds.length === fallas.length ? [] : fallas.map(f => f.id)); }} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100">{selectedFallaIds.length === fallas.length ? "Quitar todas" : "Seleccionar todas"}</button>
                      )}
                      <Badge className="text-[10px] bg-slate-100 text-slate-600">{fallas.length}</Badge>
                    </div>
                  </label>
                  {reportOpts.includeFallas && (
                    <div className="border-t border-slate-100 bg-slate-50/50 max-h-40 overflow-y-auto">
                      {fallas.map((f) => (
                        <label key={f.id} className="flex items-start gap-2 p-2 hover:bg-white cursor-pointer">
                          <input type="checkbox" checked={selectedFallaIds.includes(f.id)} onChange={(e) => setSelectedFallaIds(e.target.checked ? [...selectedFallaIds, f.id] : selectedFallaIds.filter(id => id !== f.id))} className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700">{f.reportadoPor} · <span className="capitalize">{f.estado}</span></p>
                            <p className="text-xs text-slate-400 truncate">{f.descripcion}</p>
                          </div>
                        </label>
                      ))}
                      {selectedFallaIds.length === 0 && <p className="text-[10px] text-slate-400 p-2 italic">Si no selecciona ninguna, se incluirán todas</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Mantenimientos */}
              {mantenimientos.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <label className="flex items-center justify-between p-2.5 bg-white cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={reportOpts.includeMantenimientos} onChange={(e) => setReportOpts({ ...reportOpts, includeMantenimientos: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">🔧 Mantenimientos Programados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reportOpts.includeMantenimientos && (
                        <button onClick={(e) => { e.preventDefault(); setSelectedMantenimientoIds(selectedMantenimientoIds.length === mantenimientos.length ? [] : mantenimientos.map(m => m.id)); }} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100">{selectedMantenimientoIds.length === mantenimientos.length ? "Quitar todos" : "Seleccionar todos"}</button>
                      )}
                      <Badge className="text-[10px] bg-slate-100 text-slate-600">{mantenimientos.length}</Badge>
                    </div>
                  </label>
                  {reportOpts.includeMantenimientos && (
                    <div className="border-t border-slate-100 bg-slate-50/50 max-h-32 overflow-y-auto">
                      {mantenimientos.map((m) => (
                        <label key={m.id} className="flex items-start gap-2 p-2 hover:bg-white cursor-pointer">
                          <input type="checkbox" checked={selectedMantenimientoIds.includes(m.id)} onChange={(e) => setSelectedMantenimientoIds(e.target.checked ? [...selectedMantenimientoIds, m.id] : selectedMantenimientoIds.filter(id => id !== m.id))} className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700">Cada {m.frecuenciaMeses} meses · Próxima: {m.proximaFecha}</p>
                          </div>
                        </label>
                      ))}
                      {selectedMantenimientoIds.length === 0 && <p className="text-[10px] text-slate-400 p-2 italic">Si no selecciona ninguno, se incluirán todos</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Traslados */}
              {movimientos.length > 0 && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <label className="flex items-center justify-between p-2.5 bg-white cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={reportOpts.includeTraslados} onChange={(e) => setReportOpts({ ...reportOpts, includeTraslados: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                      <span className="text-sm text-slate-700">📍 Traslados / Movimientos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reportOpts.includeTraslados && (
                        <button onClick={(e) => { e.preventDefault(); setSelectedMovimientoIds(selectedMovimientoIds.length === movimientos.length ? [] : movimientos.map(mv => mv.id)); }} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100">{selectedMovimientoIds.length === movimientos.length ? "Quitar todos" : "Seleccionar todos"}</button>
                      )}
                      <Badge className="text-[10px] bg-slate-100 text-slate-600">{movimientos.length}</Badge>
                    </div>
                  </label>
                  {reportOpts.includeTraslados && (
                    <div className="border-t border-slate-100 bg-slate-50/50 max-h-32 overflow-y-auto">
                      {movimientos.map((mv) => (
                        <label key={mv.id} className="flex items-start gap-2 p-2 hover:bg-white cursor-pointer">
                          <input type="checkbox" checked={selectedMovimientoIds.includes(mv.id)} onChange={(e) => setSelectedMovimientoIds(e.target.checked ? [...selectedMovimientoIds, mv.id] : selectedMovimientoIds.filter(id => id !== mv.id))} className="w-3.5 h-3.5 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700">{mv.ubicacionOrigen} → {mv.ubicacionDestino}</p>
                            <p className="text-xs text-slate-400">{mv.fecha} · {mv.responsable}</p>
                          </div>
                        </label>
                      ))}
                      {selectedMovimientoIds.length === 0 && <p className="text-[10px] text-slate-400 p-2 italic">Si no selecciona ninguno, se incluirán todos</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Repuestos (no per-item selection, just toggle) */}
              {spareAssignments.length > 0 && (
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-teal-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={reportOpts.includeRepuestos} onChange={(e) => setReportOpts({ ...reportOpts, includeRepuestos: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <span className="text-sm text-slate-700">📦 Repuestos Asignados</span>
                  </div>
                  <Badge className="text-[10px] bg-slate-100 text-slate-600">{spareAssignments.length}</Badge>
                </label>
              )}
            </div>

            {/* Notes / Memorandum */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Notas / Memorándum (opcional)</Label>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Escriba aquí detalles, memorándum, observaciones adicionales o cualquier información relevante para este informe..."
                rows={4}
                className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 resize-none"
              />
              <p className="text-xs text-slate-400">Este texto se incluirá en el PDF antes de la sección de firma.</p>
            </div>

            <Button
              onClick={async () => {
                setReportLoading(true);
                try {
                  generateEquipmentReport({
                    equipo: eq,
                    ordenes,
                    fallas,
                    movimientos,
                    mantenimientos,
                    repuestos: spareAssignments,
                    usuario: currentUser,
                    ...reportOpts,
                    selectedOrdenIds,
                    selectedFallaIds,
                    selectedMovimientoIds,
                    selectedMantenimientoIds,
                    notes: reportNotes,
                  });
                  toast.success("Informe PDF generado correctamente");
                  setReportOpen(false);
                } catch (err) {
                  console.error("Report generation error:", err);
                  toast.error("Error al generar el informe");
                } finally {
                  setReportLoading(false);
                }
              }}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={reportLoading}
            >
              {reportLoading ? (
                <>Generando...</>
              ) : (
                <><Download className="w-4 h-4 mr-1" /> Generar y Descargar PDF</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
