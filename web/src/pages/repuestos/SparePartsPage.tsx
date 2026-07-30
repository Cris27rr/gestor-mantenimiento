import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Package, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRepuestos, useCreateRepuesto, useUpdateRepuesto, useDeleteRepuesto } from "@/hooks/use-data";
import type { SparePart } from "@/types";

export default function SparePartsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", cantidad: "", stockMinimo: "", descripcion: "", proveedor: "" });

  const { data: repuestos = [] } = useRepuestos();
  const createRepuesto = useCreateRepuesto();
  const updateRepuesto = useUpdateRepuesto();
  const deleteRepuesto = useDeleteRepuesto();

  const filtered = useMemo(() => {
    return repuestos
      .filter((r) => search === "" || r.nombre.toLowerCase().includes(search.toLowerCase()) || r.proveedor?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.cantidad - a.stockMinimo - (b.cantidad - b.stockMinimo));
  }, [repuestos, search]);

  const handleSave = async () => {
    if (!form.nombre || !form.cantidad || !form.stockMinimo) { toast.error("Complete los campos obligatorios"); return; }
    if (editId) {
      await updateRepuesto.mutateAsync({ id: editId, updates: { nombre: form.nombre, cantidad: Number(form.cantidad), stockMinimo: Number(form.stockMinimo), descripcion: form.descripcion, proveedor: form.proveedor } });
      toast.success("Repuesto actualizado");
    } else {
      await createRepuesto.mutateAsync({ id: crypto.randomUUID?.() ?? Date.now().toString(), nombre: form.nombre, cantidad: Number(form.cantidad), stockMinimo: Number(form.stockMinimo), descripcion: form.descripcion, proveedor: form.proveedor, createdAt: new Date().toISOString() } as SparePart);
      toast.success("Repuesto creado");
    }
    setIsDialogOpen(false); setEditId(null); setForm({ nombre: "", cantidad: "", stockMinimo: "", descripcion: "", proveedor: "" });
  };

  const handleEdit = (r: (typeof repuestos)[0]) => { setEditId(r.id); setForm({ nombre: r.nombre, cantidad: String(r.cantidad), stockMinimo: String(r.stockMinimo), descripcion: r.descripcion ?? "", proveedor: r.proveedor ?? "" }); setIsDialogOpen(true); };

  const handleDelete = async (id: string) => { if (confirm("¿Eliminar este repuesto?")) { await deleteRepuesto.mutateAsync(id); toast.success("Repuesto eliminado"); } };

  const lowStock = repuestos.filter((r) => r.cantidad <= r.stockMinimo);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Inventario de Repuestos</h1><p className="text-slate-500">Gestión de stock y consumibles</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) { setEditId(null); setForm({ nombre: "", cantidad: "", stockMinimo: "", descripcion: "", proveedor: "" }); } }}>
          <DialogTrigger asChild><Button className="bg-teal-600 hover:bg-teal-700 gap-2"><Plus className="w-4 h-4" /> Nuevo Repuesto</Button></DialogTrigger>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-lg">{editId ? "Editar" : "Nuevo"} Repuesto</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Cantidad *</Label><Input type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} /></div><div className="space-y-2"><Label>Stock Mínimo *</Label><Input type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} /></div></div>
              <div className="space-y-2"><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div className="space-y-2"><Label>Proveedor</Label><Input value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full bg-teal-600 hover:bg-teal-700" disabled={createRepuesto.isPending || updateRepuesto.isPending}>{editId ? "Guardar Cambios" : "Crear Repuesto"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lowStock.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{lowStock.map((r) => (<Card key={r.id} className="border-red-200 bg-red-50 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /><div><p className="text-sm font-medium text-slate-800">{r.nombre}</p><p className="text-xs text-slate-500">Stock: {r.cantidad} / Mínimo: {r.stockMinimo}</p></div><Badge className="ml-auto bg-red-100 text-red-700 text-[10px]">Bajo Stock</Badge></CardContent></Card>))}</div>
      )}

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar repuestos..." className="pl-9" /></div>

      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>Cantidad</TableHead><TableHead>Stock Mínimo</TableHead><TableHead>Proveedor</TableHead><TableHead>Estado</TableHead><TableHead className="w-[100px]">Acciones</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((r) => { const isLow = r.cantidad <= r.stockMinimo; return (<TableRow key={r.id}><TableCell className="font-medium text-slate-800">{r.nombre}</TableCell><TableCell className="text-sm text-slate-500">{r.descripcion ?? "—"}</TableCell><TableCell className={isLow ? "text-red-600 font-semibold" : ""}>{r.cantidad}</TableCell><TableCell className="text-slate-500">{r.stockMinimo}</TableCell><TableCell className="text-sm text-slate-500">{r.proveedor ?? "—"}</TableCell><TableCell><Badge className={isLow ? "bg-red-100 text-red-700 text-[10px]" : "bg-emerald-100 text-emerald-700 text-[10px]"}>{isLow ? "Bajo Stock" : "OK"}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell></TableRow>); })}
      </TableBody></Table></div>{filtered.length === 0 && (<div className="text-center py-12"><Package className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">No se encontraron repuestos</p></div>)}</CardContent></Card>
    </div>
  );
}
