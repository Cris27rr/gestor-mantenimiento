import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, MapPin, AlertCircle, CheckCircle, Calendar, Send, QrCode, Factory, FileText } from "lucide-react";
import { toast } from "sonner";
import { useEquipoByUuid, useMantenimientosByEquipo, useCreateFalla, useUsuarios, useCreateNotificacion } from "@/hooks/use-data";
import type { ReporterType } from "@/types";

const statusLabels: Record<string, string> = {
  operativo: "Operativo", en_mantenimiento: "En Mantenimiento", fuera_de_servicio: "Fuera de Servicio", dado_de_baja: "Dado de Baja", desconocido: "Desconocido",
};
const statusColors: Record<string, string> = {
  operativo: "bg-emerald-100 text-emerald-700", en_mantenimiento: "bg-amber-100 text-amber-700",
  fuera_de_servicio: "bg-red-100 text-red-700", dado_de_baja: "bg-slate-100 text-slate-600", desconocido: "bg-slate-100 text-slate-500",
};
const reporterTypeLabels: Record<ReporterType, string> = {
  paciente: "Paciente", familiar: "Familiar", personal_medico: "Personal Médico", tecnico: "Técnico", otro: "Otro",
};

export default function PublicEquipmentPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: equipo, isLoading, error } = useEquipoByUuid(uuid);
  const { data: mantenimientos = [] } = useMantenimientosByEquipo(equipo?.id);
  const { data: usuarios = [] } = useUsuarios();
  const createFalla = useCreateFalla();
  const createNotificacion = useCreateNotificacion();

  const [reportForm, setReportForm] = useState({
    reportadoPor: "", tipoReportante: "personal_medico" as ReporterType, descripcion: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-slate-400">Cargando...</div></div>;
  }

  if (error || !equipo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="border-0 shadow-lg max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Equipo no encontrado</h2>
          <p className="text-slate-500 mb-4">El código QR escaneado no corresponde a ningún equipo registrado.</p>
          <Button variant="outline" onClick={() => navigate("/escanear")} className="gap-2"><QrCode className="w-4 h-4" /> Escanear otro código</Button>
        </Card>
      </div>
    );
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!reportForm.reportadoPor.trim() || reportForm.reportadoPor.trim().length < 3) errs.reportadoPor = "El nombre debe tener al menos 3 caracteres";
    if (!reportForm.descripcion.trim() || reportForm.descripcion.trim().length < 10) errs.descripcion = "La descripción debe tener al menos 10 caracteres";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleReport = async () => {
    if (!validate()) { toast.error("Corrija los campos obligatorios"); return; }
    try {
      const fallaId = crypto.randomUUID?.() ?? Date.now().toString();
      await createFalla.mutateAsync({
        id: fallaId, equipoId: equipo.id, reportadoPor: reportForm.reportadoPor.trim(),
        tipoReportante: reportForm.tipoReportante, descripcion: reportForm.descripcion.trim(),
        fechaReporte: new Date().toISOString().split("T")[0], estado: "pendiente", createdAt: new Date().toISOString(),
      });

      // Notify admins and techs (fire-and-forget, don't block success on notification failure)
      try {
        for (const u of usuarios.filter((x) => x.rol === "admin" || x.rol === "tecnico" || x.rol === "director_departamento")) {
          await createNotificacion.mutateAsync({
            id: crypto.randomUUID?.() ?? Date.now().toString(), usuarioId: u.id,
            mensaje: `Nueva falla reportada en ${equipo.nombre} (${equipo.ubicacion}) por ${reportForm.reportadoPor}`,
            leida: false, tipo: "falla", entidadId: equipo.id, createdAt: new Date().toISOString(),
          });
        }
      } catch {
        // Notifications are non-critical — the falla is already saved
      }

      setSubmitted(true);
      toast.success("Falla reportada. El área de mantenimiento ha sido notificada.");
    } catch (err) {
      console.error("Error al reportar falla:", err);
      toast.error("No se pudo guardar el reporte. Intente nuevamente.");
    }
  };

  const mantenimiento = mantenimientos.find((m) => m.activo);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-teal-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4"><Stethoscope className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold">{equipo.nombre}</h1>
          <p className="text-teal-100 mt-1">{equipo.marca} {equipo.modelo}</p>
          <Badge className={`mt-3 ${statusColors[equipo.estado]} bg-opacity-90`}>{statusLabels[equipo.estado]}</Badge>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Número de Serie</p><p className="text-sm font-medium text-slate-800">{equipo.serial || "No registrado"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ubicación</p><p className="text-sm font-medium text-slate-800 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {equipo.ubicacion}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Año Fabricación</p><p className="text-sm font-medium text-slate-800 flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-slate-400" />{equipo.anioFabricacion || "No registrado"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha Adquisición</p><p className="text-sm font-medium text-slate-800">{equipo.fechaAdquisicion || "No registrada"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Servicio Técnico</p><p className="text-sm font-medium text-slate-800">{equipo.servicioTecnico || "No asignado"}</p></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Próximo Mantenimiento</p><p className="text-sm font-medium text-slate-800 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{mantenimiento ? mantenimiento.proximaFecha : "No programado"}</p></div>
              {equipo.observaciones && (<div className="col-span-2"><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observaciones</p><p className="text-sm font-medium text-slate-800 flex items-start gap-1"><FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />{equipo.observaciones}</p></div>)}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center"><Button variant="outline" onClick={() => navigate("/escanear")} className="gap-2 text-slate-600"><QrCode className="w-4 h-4" /> Escanear otro equipo</Button></div>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" />Reportar una Falla</CardTitle></CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-6"><CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" /><h3 className="text-lg font-semibold text-slate-800 mb-1">¡Reporte Enviado!</h3><p className="text-sm text-slate-500">El área de mantenimiento ha sido notificada.</p><p className="text-xs text-slate-400 mt-4">Fecha: {new Date().toLocaleString("es-ES")}</p></div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Tipo de persona que reporta *</Label><Select value={reportForm.tipoReportante} onValueChange={(v) => setReportForm({ ...reportForm, tipoReportante: v as ReporterType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(reporterTypeLabels) as [ReporterType, string][]).map(([k, label]) => (<SelectItem key={k} value={k}>{label}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Nombre o identificador *</Label><Input value={reportForm.reportadoPor} onChange={(e) => setReportForm({ ...reportForm, reportadoPor: e.target.value })} placeholder="ej. Juan Pérez - Enfermero UCI" />{errors.reportadoPor && <p className="text-xs text-red-500">{errors.reportadoPor}</p>}</div>
                <div className="space-y-2"><Label>Descripción de la falla *</Label><Input value={reportForm.descripcion} onChange={(e) => setReportForm({ ...reportForm, descripcion: e.target.value })} placeholder="Describa el problema (mínimo 10 caracteres)..." />{errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion}</p>}</div>
                <Button onClick={handleReport} className="w-full bg-red-600 hover:bg-red-700 gap-2" disabled={createFalla.isPending}><Send className="w-4 h-4" />Enviar Reporte</Button>
                <p className="text-xs text-slate-400 text-center">Todos los campos con * son obligatorios.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="text-center text-xs text-slate-400 py-4">MediMaint · Gestión de Mantenimiento de Equipos Médicos</div>
      </div>
    </div>
  );
}
