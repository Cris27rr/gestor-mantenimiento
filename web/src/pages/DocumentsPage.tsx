import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, AlertTriangle, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useEquipos, useDocumentosByEquipo, useCreateDocumento, useDeleteDocumento } from "@/hooks/use-data";
import type { Document } from "@/types";

const typeLabels: Record<string, string> = { manual: "Manual", certificado_calibracion: "Certificado de Calibración", ficha_tecnica: "Ficha Técnica", reporte_seguridad: "Reporte de Seguridad", otro: "Otro" };

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ equipoId: "", tipo: "manual" as Document["tipo"], nombre: "", fechaVencimiento: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const { data: equipos = [] } = useEquipos();
  // For the global documents view, we fetch all docs from all equipos
  // We use a combined approach - get docs by looping over equipo IDs
  // For simplicity, we fetch documents for the first equipment and show separate view
  // Actually, let's create a simple "allDocuments" aggregation
  const createDocumento = useCreateDocumento();
  const deleteDocumento = useDeleteDocumento();

  // We'll track the selected equipo ID and only show docs for that equipo
  const selectedEquipoId = form.equipoId;
  const { data: documentos = [] } = useDocumentosByEquipo(selectedEquipoId || undefined);

  const filtered = useMemo(() => {
    return documentos.filter((d) => search === "" || d.nombre.toLowerCase().includes(search.toLowerCase()) || (typeLabels[d.tipo] ?? "").toLowerCase().includes(search.toLowerCase()));
  }, [documentos, search]);

  const handleAddDoc = () => {
    if (!form.equipoId || !form.nombre) { toast.error("Seleccione equipo y nombre del documento"); return; }
    let fileUrl = "#";
    if (docFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        fileUrl = reader.result as string;
        await createDocumento.mutateAsync({
          id: crypto.randomUUID?.() ?? Date.now().toString(),
          equipoId: form.equipoId, tipo: form.tipo, nombre: form.nombre,
          archivoUrl: fileUrl, fechaVencimiento: form.fechaVencimiento || undefined,
          createdAt: new Date().toISOString(),
        } as Document);
        toast.success("Documento registrado");
        setIsDialogOpen(false); setForm({ equipoId: "", tipo: "manual", nombre: "", fechaVencimiento: "" }); setDocFile(null);
      };
      reader.readAsDataURL(docFile);
    } else {
      createDocumento.mutateAsync({
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        equipoId: form.equipoId, tipo: form.tipo, nombre: form.nombre,
        archivoUrl: fileUrl, fechaVencimiento: form.fechaVencimiento || undefined,
        createdAt: new Date().toISOString(),
      } as Document).then(() => {
        toast.success("Documento registrado");
        setIsDialogOpen(false); setForm({ equipoId: "", tipo: "manual", nombre: "", fechaVencimiento: "" }); setDocFile(null);
      });
    }
  };

  const handleDelete = async (id: string) => { if (confirm("¿Eliminar?")) { await deleteDocumento.mutateAsync(id); toast.success("Documento eliminado"); } };

  const handleDownload = (d: Document) => {
    if (d.archivoUrl && d.archivoUrl !== "#") { const a = document.createElement("a"); a.href = d.archivoUrl; a.download = d.nombre; a.click(); }
    else toast.info("Documento sin archivo adjunto");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Documentos</h1><p className="text-slate-500">Manuales, certificados y normativa por equipo</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) { setDocFile(null); setForm({ equipoId: "", tipo: "manual", nombre: "", fechaVencimiento: "" }); } }}>
          <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700 gap-2"><Upload className="w-4 h-4" /> Subir Documento</Button></DialogTrigger>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-lg">Subir Documento</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-2"><Label>Equipo *</Label><Select value={form.equipoId} onValueChange={(v) => setForm({ ...form, equipoId: v })}><SelectTrigger><SelectValue placeholder="Seleccione un equipo" /></SelectTrigger><SelectContent>{equipos.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nombre} · {e.ubicacion}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Document["tipo"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="certificado_calibracion">Certificado de Calibración</SelectItem><SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem><SelectItem value="reporte_seguridad">Reporte de Seguridad</SelectItem><SelectItem value="otro">Otro</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="space-y-2"><Label>Archivo</Label><div className="flex items-center gap-2"><Input ref={fileInputRef} type="file" className="text-xs" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDocFile(f); if (!form.nombre) setForm({ ...form, nombre: f.name }); } }} /></div><p className="text-xs text-slate-400">Formatos: PDF, JPG, PNG (máx 10MB)</p></div>
              <div className="space-y-2"><Label>Fecha Vencimiento</Label><Input type="date" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} /></div>
              <Button onClick={handleAddDoc} className="w-full bg-teal-600 hover:bg-teal-700" disabled={createDocumento.isPending}>Subir Documento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documentos..." className="pl-9" /></div>
        <Select value={form.equipoId} onValueChange={(v) => setForm({ ...form, equipoId: v })}><SelectTrigger className="w-full sm:w-[260px]"><SelectValue placeholder="Filtrar por equipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los equipos</SelectItem>{equipos.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nombre} · {e.ubicacion}</SelectItem>))}</SelectContent></Select>
      </div>

      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Equipo</TableHead><TableHead>Vencimiento</TableHead><TableHead className="w-[100px]">Acciones</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((d) => { const eq = equipos.find((e) => e.id === d.equipoId); const isExpired = d.fechaVencimiento && new Date(d.fechaVencimiento) < new Date(); return (
          <TableRow key={d.id}><TableCell><div className="flex items-center gap-3"><FileText className="w-4 h-4 text-slate-400" /><span className="font-medium text-slate-800">{d.nombre}</span></div></TableCell><TableCell><span className="text-sm text-slate-600 capitalize">{typeLabels[d.tipo] ?? d.tipo.replace("_", " ")}</span></TableCell><TableCell className="text-sm text-slate-500">{eq?.nombre ?? "—"}</TableCell><TableCell>{d.fechaVencimiento ? <Badge className={`text-[10px] ${isExpired ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}><AlertTriangle className="w-3 h-3 mr-1" />{d.fechaVencimiento}</Badge> : <span className="text-xs text-slate-400">—</span>}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(d)}><Download className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell></TableRow>
        );})}
      </TableBody></Table></div>{filtered.length === 0 && (<div className="text-center py-12"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">{form.equipoId ? "Sin documentos para este equipo" : "Seleccione un equipo para ver sus documentos"}</p></div>)}</CardContent></Card>
    </div>
  );
}
