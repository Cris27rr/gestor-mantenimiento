import { jsPDF } from "jspdf";
import type { Equipment, WorkOrder, FailureReport, Movement, MaintenanceSchedule, SparePartAssignment, User } from "@/types";

interface ReportOptions {
  equipo: Equipment;
  ordenes: WorkOrder[];
  fallas: FailureReport[];
  movimientos: Movement[];
  mantenimientos: MaintenanceSchedule[];
  repuestos: SparePartAssignment[];
  usuario: User | null;
  includeFallas: boolean;
  includeMantenimientos: boolean;
  includeTraslados: boolean;
  includeOrdenes: boolean;
  includeRepuestos: boolean;
  selectedOrdenIds: string[];
  selectedFallaIds: string[];
  selectedMovimientoIds: string[];
  selectedMantenimientoIds: string[];
  notes: string;
}

const statusLabels: Record<string, string> = {
  operativo: "Operativo",
  en_mantenimiento: "En Mantenimiento",
  fuera_de_servicio: "Fuera de Servicio",
  dado_de_baja: "Dado de Baja",
  desconocido: "Desconocido",
};

const tipoReportanteLabels: Record<string, string> = {
  personal_medico: "Personal Médico",
  paciente: "Paciente",
  familiar: "Familiar",
  tecnico: "Técnico",
  otro: "Otro",
};

const rolLabels: Record<string, string> = {
  admin: "Administrador",
  director_departamento: "Director de Departamento",
  tecnico: "Técnico de Mantenimiento",
  clinico: "Personal Clínico",
  publico: "Público",
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

/**
 * Generates a comprehensive PDF report for a medical equipment unit.
 * Includes equipment info, selected history events, and a personalized signature.
 */
export function generateEquipmentReport(opts: ReportOptions): void {
  const {
    equipo, ordenes, fallas, movimientos, mantenimientos, repuestos,
    usuario, includeFallas, includeMantenimientos, includeTraslados, includeOrdenes, includeRepuestos,
    selectedOrdenIds, selectedFallaIds, selectedMovimientoIds, selectedMantenimientoIds, notes,
  } = opts;

  // Filter items by selected IDs (empty array = include all for backward compat)
  const filteredOrdenes = selectedOrdenIds.length > 0 ? ordenes.filter((o) => selectedOrdenIds.includes(o.id)) : ordenes;
  const filteredFallas = selectedFallaIds.length > 0 ? fallas.filter((f) => selectedFallaIds.includes(f.id)) : fallas;
  const filteredMovimientos = selectedMovimientoIds.length > 0 ? movimientos.filter((m) => selectedMovimientoIds.includes(m.id)) : movimientos;
  const filteredMantenimientos = selectedMantenimientoIds.length > 0 ? mantenimientos.filter((m) => selectedMantenimientoIds.includes(m.id)) : mantenimientos;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Helper: check page break
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 30) {
      addFooter();
      doc.addPage();
      y = margin;
      addHeaderLine();
    }
  };

  const addHeaderLine = () => {
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.8);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
  };

  const addFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `MediMaint — Sistema de Gestión de Mantenimiento de Equipos Médicos  |  Página ${page}`,
      margin,
      pageHeight - 10
    );
    doc.text(
      `Generado el ${formatDateTime(new Date().toISOString())}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  };

  // ========== HEADER ==========
  y = margin + 4;
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MediMaint", margin, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Informe de Equipo Médico", pageWidth - margin, 16, { align: "right" });

  y = 34;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(equipo.nombre, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${equipo.marca || "N/A"} · ${equipo.modelo || "N/A"} · Serial: ${equipo.serial || "N/A"}`, margin, y);

  y += 4;
  addHeaderLine();
  y += 8;

  // ========== EQUIPMENT INFO ==========
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text("Información del Equipo", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const infoRows: [string, string][] = [
    ["Estado", statusLabels[equipo.estado] ?? equipo.estado],
    ["Ubicación", equipo.ubicacion || "N/A"],
    ["Año de Fabricación", equipo.anioFabricacion || "N/A"],
    ["Fecha de Adquisición", formatDate(equipo.fechaAdquisicion)],
    ["Valor de Compra", `$${(equipo.valorCompra ?? 0).toLocaleString()}`],
    ["Vida Útil", `${equipo.vidaUtil} años`],
    ["Servicio Técnico", equipo.servicioTecnico || "No asignado"],
    ["Observaciones", equipo.observaciones || "Sin observaciones"],
  ];

  const colW = contentWidth / 2;
  for (let i = 0; i < infoRows.length; i += 2) {
    ensureSpace(8);
    const left = infoRows[i];
    const right = infoRows[i + 1];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(left[0].toUpperCase(), margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const leftVal = doc.splitTextToSize(left[1], colW - 15);
    doc.text(leftVal, margin, y + 4);

    if (right) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(right[0].toUpperCase(), margin + colW, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const rightVal = doc.splitTextToSize(right[1], colW - 15);
      doc.text(rightVal, margin + colW, y + 4);
    }

    const maxLines = Math.max(leftVal.length, right ? doc.splitTextToSize(right[1], colW - 15).length : 1);
    y += 5 + (maxLines - 1) * 4 + 3;
  }
  y += 4;

  // ========== EVENTS TIMELINE ==========
  // Build merged timeline
  type TimelineEvent = {
    fecha: string;
    fechaSort: string;
    tipo: string;
    tipoColor: [number, number, number];
    titulo: string;
    detalle: string;
    estado?: string;
  };

  const events: TimelineEvent[] = [];

  if (includeOrdenes) {
    filteredOrdenes.forEach((o) => {
      events.push({
        fecha: formatDate(o.fechaProgramada || o.fechaEjecucion || o.createdAt),
        fechaSort: (o.fechaProgramada || o.fechaEjecucion || o.createdAt || "").toString(),
        tipo: "Orden de Trabajo",
        tipoColor: [59, 130, 246],
        titulo: `${o.tipo.charAt(0).toUpperCase() + o.tipo.slice(1)} — Prioridad: ${o.prioridad}`,
        detalle: o.descripcion || "Sin descripción",
        estado: o.estado.replace("_", " "),
      });
    });
  }

  if (includeFallas) {
    filteredFallas.forEach((f) => {
      events.push({
        fecha: formatDate(f.fechaReporte),
        fechaSort: (f.fechaReporte || f.createdAt || "").toString(),
        tipo: "Falla Reportada",
        tipoColor: [239, 68, 68],
        titulo: `Reportado por: ${f.reportadoPor} (${tipoReportanteLabels[f.tipoReportante] ?? f.tipoReportante})`,
        detalle: f.descripcion,
        estado: f.estado === "pendiente" ? "Pendiente" : f.estado === "en_proceso" ? "En Proceso" : "Resuelto",
      });
    });
  }

  if (includeMantenimientos) {
    filteredMantenimientos.forEach((m) => {
      events.push({
        fecha: formatDate(m.proximaFecha),
        fechaSort: (m.proximaFecha || m.createdAt || "").toString(),
        tipo: "Mantenimiento Programado",
        tipoColor: [13, 148, 136],
        titulo: `Frecuencia: Cada ${m.frecuenciaMeses} meses${m.horasUso ? ` · ${m.horasUso}h de uso` : ""}`,
        detalle: `Próxima fecha: ${formatDate(m.proximaFecha)}${m.ultimaFecha ? ` · Última: ${formatDate(m.ultimaFecha)}` : ""}`,
        estado: m.activo ? "Activo" : "Inactivo",
      });
    });
  }

  if (includeTraslados) {
    filteredMovimientos.forEach((mv) => {
      events.push({
        fecha: formatDate(mv.fecha),
        fechaSort: (mv.fecha || mv.createdAt || "").toString(),
        tipo: "Traslado",
        tipoColor: [168, 85, 247],
        titulo: `${mv.ubicacionOrigen || "?"} → ${mv.ubicacionDestino || "?"}`,
        detalle: `Responsable: ${mv.responsable || "N/A"}${mv.motivo ? ` · Motivo: ${mv.motivo}` : ""}`,
      });
    });
  }

  // Sort by date descending
  events.sort((a, b) => b.fechaSort.localeCompare(a.fechaSort));

  if (events.length > 0) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text("Historial de Eventos", margin, y);
    y += 8;

    events.forEach((evt) => {
      ensureSpace(16);

      // Type badge
      doc.setFillColor(evt.tipoColor[0], evt.tipoColor[1], evt.tipoColor[2]);
      doc.roundedRect(margin, y - 3, 42, 5, 1, 1, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(evt.tipo.toUpperCase(), margin + 2, y + 0.5);

      // Date
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(evt.fecha, margin + 45, y + 0.5);

      // Title
      y += 5;
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
    doc.text(evt.titulo, margin, y);

      // Detail
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const detailLines = doc.splitTextToSize(evt.detalle, contentWidth - 10);
      doc.text(detailLines, margin, y);
      y += detailLines.length * 4;

      // Estado badge
      if (evt.estado) {
        y += 1;
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Estado: ${evt.estado}`, margin, y);
        y += 2;
      }

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    });
  } else {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text("Historial de Eventos", margin, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("No hay eventos seleccionados para este informe.", margin, y);
    y += 6;
  }

  // ========== SPARE PARTS ==========
  if (includeRepuestos && repuestos.length > 0) {
    y += 4;
    ensureSpace(10 + repuestos.length * 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text("Repuestos Asignados", margin, y);
    y += 6;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 4, contentWidth, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("REPUESTO", margin + 2, y);
    doc.text("CANT.", margin + 90, y);
    doc.text("UBICACIÓN", margin + 115, y);
    doc.text("FECHA", margin + 155, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    repuestos.forEach((sp) => {
      ensureSpace(6);
      doc.text(doc.splitTextToSize(sp.repuestoNombre || "N/A", 85), margin + 2, y);
      doc.text(String(sp.cantidadActual ?? 0), margin + 90, y);
      doc.text(doc.splitTextToSize(sp.ubicacionFisica || "—", 35), margin + 115, y);
      doc.text(formatDate(sp.fechaAsignacion), margin + 155, y);
      y += 5;
    });
    y += 4;
  }

  // ========== NOTES / MEMORANDUM SECTION ==========
  if (notes.trim()) {
    y += 6;
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text("Notas y Memorándum", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const noteLines = doc.splitTextToSize(notes.trim(), contentWidth);
    noteLines.forEach((line: string) => {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 6;
  }

  // ========== SIGNATURE SECTION ==========
  y += 10;
  ensureSpace(40);

  // Divider
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Solicitado y Verificado por:", margin, y);
  y += 10;

  // Signature line
  const sigX = margin + 20;
  const sigW = 70;
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.line(sigX, y, sigX + sigW, y);

  // User name above the line (simulated signature)
  if (usuario) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(13);
    doc.setTextColor(13, 148, 136);
    doc.text(usuario.nombre, sigX + sigW / 2, y - 2, { align: "center" });
  }

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  if (usuario) {
    doc.text(usuario.nombre, sigX, y);
    y += 4;
    doc.text(usuario.email, sigX, y);
    y += 4;
    doc.text(`Cargo: ${rolLabels[usuario.rol] ?? usuario.rol}`, sigX, y);
  } else {
    doc.text("Usuario no identificado", sigX, y);
  }

  // Date on the right
  y = y - 8;
  const dateX = pageWidth - margin - 70;
  doc.setDrawColor(51, 65, 85);
  doc.line(dateX, y + 8, dateX + 70, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("FECHA", dateX, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(formatDate(new Date().toISOString()), dateX, y + 4);

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  // Save
  const fileName = `Informe_${equipo.nombre.replace(/[^a-zA-Z0-9]/g, "_")}_${equipo.serial || equipo.uuid.slice(0, 8)}.pdf`;
  doc.save(fileName);
}
