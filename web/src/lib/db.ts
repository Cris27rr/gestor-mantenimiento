import { supabase } from "@/lib/supabase";
import type {
  Equipment,
  WorkOrder,
  SparePart,
  Movement,
  Document,
  FailureReport,
  Notification,
  MaintenanceSchedule,
  User,
  SparePartAssignment,
} from "@/types";

// ============================================================
// Column mapping: TypeScript camelCase ↔ Supabase snake_case
// ============================================================

function toEquipment(row: any): Equipment {
  return {
    id: row.id,
    uuid: row.uuid,
    nombre: row.nombre,
    marca: row.marca ?? "",
    modelo: row.modelo ?? "",
    serial: row.serial ?? "",
    fechaAdquisicion: row.fecha_adquisicion ?? "",
    estado: row.estado ?? "operativo",
    ubicacion: row.ubicacion ?? "General",
    valorCompra: Number(row.valor_compra) || 0,
    vidaUtil: Number(row.vida_util) || 10,
    anioFabricacion: row.anio_fabricacion || undefined,
    observaciones: row.observaciones || undefined,
    servicioTecnico: row.servicio_tecnico || undefined,
    descripcion: row.descripcion || undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function fromEquipment(eq: Partial<Equipment>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (eq.uuid !== undefined) r.uuid = eq.uuid;
  if (eq.nombre !== undefined) r.nombre = eq.nombre;
  if (eq.marca !== undefined) r.marca = eq.marca;
  if (eq.modelo !== undefined) r.modelo = eq.modelo;
  if (eq.serial !== undefined) r.serial = eq.serial;
  if (eq.fechaAdquisicion !== undefined) r.fecha_adquisicion = eq.fechaAdquisicion;
  if (eq.estado !== undefined) r.estado = eq.estado;
  if (eq.ubicacion !== undefined) r.ubicacion = eq.ubicacion;
  if (eq.valorCompra !== undefined) r.valor_compra = eq.valorCompra;
  if (eq.vidaUtil !== undefined) r.vida_util = eq.vidaUtil;
  if (eq.anioFabricacion !== undefined) r.anio_fabricacion = eq.anioFabricacion || null;
  if (eq.observaciones !== undefined) r.observaciones = eq.observaciones || null;
  if (eq.servicioTecnico !== undefined) r.servicio_tecnico = eq.servicioTecnico || null;
  if (eq.descripcion !== undefined) r.descripcion = eq.descripcion || null;
  if (eq.updatedAt !== undefined) r.updated_at = eq.updatedAt;
  return r;
}

function toWorkOrder(row: any): WorkOrder {
  return {
    id: row.id,
    equipoId: row.equipo_id ?? "",
    tipo: row.tipo ?? "correctivo",
    fechaProgramada: row.fecha_programada ?? "",
    fechaEjecucion: row.fecha_ejecucion ?? "",
    fechaCierre: row.fecha_cierre ?? "",
    tecnicoAsignadoId: row.tecnico_asignado_id ?? "",
    tecnicoAsignadoNombre: row.tecnico_asignado_nombre ?? "",
    prioridad: row.prioridad ?? "media",
    estado: row.estado ?? "pendiente",
    descripcion: row.descripcion ?? "",
    repuestosUsados: (row.repuestos_usados as any[]) ?? [],
    fotosAntes: (row.fotos_antes as string[]) ?? [],
    fotosDespues: (row.fotos_despues as string[]) ?? [],
    costo: Number(row.costo) || 0,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

function fromWorkOrder(o: Partial<WorkOrder>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (o.equipoId !== undefined) r.equipo_id = o.equipoId;
  if (o.tipo !== undefined) r.tipo = o.tipo;
  if (o.fechaProgramada !== undefined) r.fecha_programada = o.fechaProgramada;
  if (o.fechaEjecucion !== undefined) r.fecha_ejecucion = o.fechaEjecucion;
  if (o.fechaCierre !== undefined) r.fecha_cierre = o.fechaCierre;
  if (o.tecnicoAsignadoId !== undefined) r.tecnico_asignado_id = o.tecnicoAsignadoId || null;
  if (o.tecnicoAsignadoNombre !== undefined) r.tecnico_asignado_nombre = o.tecnicoAsignadoNombre;
  if (o.prioridad !== undefined) r.prioridad = o.prioridad;
  if (o.estado !== undefined) r.estado = o.estado;
  if (o.descripcion !== undefined) r.descripcion = o.descripcion;
  if (o.repuestosUsados !== undefined) r.repuestos_usados = o.repuestosUsados;
  if (o.fotosAntes !== undefined) r.fotos_antes = o.fotosAntes;
  if (o.fotosDespues !== undefined) r.fotos_despues = o.fotosDespues;
  if (o.costo !== undefined) r.costo = o.costo;
  if (o.updatedAt !== undefined) r.updated_at = o.updatedAt;
  return r;
}

function toSparePart(row: any): SparePart {
  return {
    id: row.id,
    nombre: row.nombre,
    cantidad: row.cantidad ?? 0,
    stockMinimo: row.stock_minimo ?? 0,
    descripcion: row.descripcion ?? "",
    proveedor: row.proveedor ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromSparePart(sp: Partial<SparePart>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (sp.nombre !== undefined) r.nombre = sp.nombre;
  if (sp.cantidad !== undefined) r.cantidad = sp.cantidad;
  if (sp.stockMinimo !== undefined) r.stock_minimo = sp.stockMinimo;
  if (sp.descripcion !== undefined) r.descripcion = sp.descripcion;
  if (sp.proveedor !== undefined) r.proveedor = sp.proveedor;
  return r;
}

function toMovement(row: any): Movement {
  return {
    id: row.id,
    equipoId: row.equipo_id ?? "",
    fecha: row.fecha ?? "",
    ubicacionOrigen: row.ubicacion_origen ?? "",
    ubicacionDestino: row.ubicacion_destino ?? "",
    responsable: row.responsable ?? "",
    motivo: row.motivo ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromMovement(m: Partial<Movement>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (m.equipoId !== undefined) r.equipo_id = m.equipoId;
  if (m.fecha !== undefined) r.fecha = m.fecha;
  if (m.ubicacionOrigen !== undefined) r.ubicacion_origen = m.ubicacionOrigen;
  if (m.ubicacionDestino !== undefined) r.ubicacion_destino = m.ubicacionDestino;
  if (m.responsable !== undefined) r.responsable = m.responsable;
  if (m.motivo !== undefined) r.motivo = m.motivo;
  return r;
}

function toDocument(row: any): Document {
  return {
    id: row.id,
    equipoId: row.equipo_id ?? "",
    tipo: row.tipo ?? "otro",
    nombre: row.nombre ?? "",
    archivoUrl: row.archivo_url ?? "",
    fechaVencimiento: row.fecha_vencimiento ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromDocument(d: Partial<Document>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (d.equipoId !== undefined) r.equipo_id = d.equipoId;
  if (d.tipo !== undefined) r.tipo = d.tipo;
  if (d.nombre !== undefined) r.nombre = d.nombre;
  if (d.archivoUrl !== undefined) r.archivo_url = d.archivoUrl;
  if (d.fechaVencimiento !== undefined) r.fecha_vencimiento = d.fechaVencimiento;
  return r;
}

function toFailureReport(row: any): FailureReport {
  return {
    id: row.id,
    equipoId: row.equipo_id ?? "",
    reportadoPor: row.reportado_por ?? "",
    tipoReportante: row.tipo_reportante ?? "otro",
    descripcion: row.descripcion ?? "",
    fechaReporte: row.fecha_reporte ?? "",
    estado: row.estado ?? "pendiente",
    ordenTrabajoId: row.orden_trabajo_id ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromFailureReport(f: Partial<FailureReport>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (f.equipoId !== undefined) r.equipo_id = f.equipoId;
  if (f.reportadoPor !== undefined) r.reportado_por = f.reportadoPor;
  if (f.tipoReportante !== undefined) r.tipo_reportante = f.tipoReportante;
  if (f.descripcion !== undefined) r.descripcion = f.descripcion;
  if (f.fechaReporte !== undefined) r.fecha_reporte = f.fechaReporte;
  if (f.estado !== undefined) r.estado = f.estado;
  if (f.ordenTrabajoId !== undefined) r.orden_trabajo_id = f.ordenTrabajoId || null;
  return r;
}

function toNotification(row: any): Notification {
  return {
    id: row.id,
    usuarioId: row.usuario_id ?? "",
    mensaje: row.mensaje ?? "",
    leida: row.leida ?? false,
    tipo: row.tipo ?? "ot",
    entidadId: row.entidad_id ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toMaintenanceSchedule(row: any): MaintenanceSchedule {
  return {
    id: row.id,
    equipoId: row.equipo_id ?? "",
    frecuenciaMeses: row.frecuencia_meses ?? 6,
    proximaFecha: row.proxima_fecha ?? "",
    ultimaFecha: row.ultima_fecha ?? "",
    horasUso: row.horas_uso ?? undefined,
    activo: row.activo ?? true,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromMaintenanceSchedule(m: Partial<MaintenanceSchedule>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (m.equipoId !== undefined) r.equipo_id = m.equipoId;
  if (m.frecuenciaMeses !== undefined) r.frecuencia_meses = m.frecuenciaMeses;
  if (m.proximaFecha !== undefined) r.proxima_fecha = m.proximaFecha;
  if (m.ultimaFecha !== undefined) r.ultima_fecha = m.ultimaFecha;
  if (m.horasUso !== undefined) r.horas_uso = m.horasUso || null;
  if (m.activo !== undefined) r.activo = m.activo;
  return r;
}

function toUser(row: any): User {
  return {
    id: row.id,
    nombre: row.nombre ?? "",
    email: row.email ?? "",
    passwordHash: row.password_hash ?? "",
    rol: row.rol ?? "clinico",
    avatar: row.avatar ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromUser(u: Partial<User>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (u.nombre !== undefined) r.nombre = u.nombre;
  if (u.email !== undefined) r.email = u.email;
  if (u.passwordHash !== undefined) r.password_hash = u.passwordHash;
  if (u.rol !== undefined) r.rol = u.rol;
  if (u.avatar !== undefined) r.avatar = u.avatar;
  return r;
}

function toSparePartAssignment(row: any): SparePartAssignment {
  return {
    id: row.id,
    equipoId: row.equipo_id ?? "",
    repuestoId: row.repuesto_id ?? "",
    repuestoNombre: row.repuesto_nombre ?? "",
    cantidadActual: row.cantidad_actual ?? 0,
    ubicacionFisica: row.ubicacion_fisica ?? "",
    fechaAsignacion: row.fecha_asignacion ?? "",
    observaciones: row.observaciones ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function fromSparePartAssignment(s: Partial<SparePartAssignment>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  if (s.equipoId !== undefined) r.equipo_id = s.equipoId;
  if (s.repuestoId !== undefined) r.repuesto_id = s.repuestoId;
  if (s.repuestoNombre !== undefined) r.repuesto_nombre = s.repuestoNombre;
  if (s.cantidadActual !== undefined) r.cantidad_actual = s.cantidadActual;
  if (s.ubicacionFisica !== undefined) r.ubicacion_fisica = s.ubicacionFisica;
  if (s.fechaAsignacion !== undefined) r.fecha_asignacion = s.fechaAsignacion;
  if (s.observaciones !== undefined) r.observaciones = s.observaciones;
  return r;
}

// ============================================================
// Async Database API (Supabase-backed)
// ============================================================

export const db = {
  // --- Equipos ---
  equipos: {
    getAll: async (): Promise<Equipment[]> => {
      const { data } = await supabase.from("equipos").select("*").order("ubicacion");
      return (data ?? []).map(toEquipment);
    },
    getById: async (id: string): Promise<Equipment | undefined> => {
      const { data } = await supabase.from("equipos").select("*").eq("id", id).single();
      return data ? toEquipment(data) : undefined;
    },
    getByUuid: async (uuid: string): Promise<Equipment | undefined> => {
      const { data } = await supabase.from("equipos").select("*").eq("uuid", uuid).single();
      return data ? toEquipment(data) : undefined;
    },
    create: async (eq: Equipment): Promise<Equipment> => {
      const { data, error } = await supabase.from("equipos").insert({
        id: eq.id,
        uuid: eq.uuid,
        nombre: eq.nombre,
        marca: eq.marca,
        modelo: eq.modelo,
        serial: eq.serial,
        fecha_adquisicion: eq.fechaAdquisicion,
        estado: eq.estado,
        ubicacion: eq.ubicacion,
        valor_compra: eq.valorCompra,
        vida_util: eq.vidaUtil,
        anio_fabricacion: eq.anioFabricacion || null,
        observaciones: eq.observaciones || null,
        servicio_tecnico: eq.servicioTecnico || null,
        descripcion: eq.descripcion || null,
      }).select().single();
      if (error) throw new Error(`Supabase equipos.create: ${error.message}`);
      return toEquipment(data!);
    },
    update: async (id: string, updates: Partial<Equipment>): Promise<Equipment | undefined> => {
      const { data, error } = await supabase.from("equipos").update(fromEquipment(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase equipos.update: ${error.message}`);
      return data ? toEquipment(data) : undefined;
    },
    search: async (query: string, limit: number = 10): Promise<Equipment[]> => {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      const { data } = await supabase
        .from("equipos")
        .select("*")
        .or(`nombre.ilike.%${q}%,serial.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%,ubicacion.ilike.%${q}%`)
        .order("nombre")
        .limit(limit);
      return (data ?? []).map(toEquipment);
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("equipos").delete().eq("id", id);
      return !error;
    },
  },

  // --- Órdenes de Trabajo ---
  ordenes: {
    getAll: async (): Promise<WorkOrder[]> => {
      const { data } = await supabase.from("ordenes_trabajo").select("*").order("created_at", { ascending: false });
      return (data ?? []).map(toWorkOrder);
    },
    getById: async (id: string): Promise<WorkOrder | undefined> => {
      const { data } = await supabase.from("ordenes_trabajo").select("*").eq("id", id).single();
      return data ? toWorkOrder(data) : undefined;
    },
    getByEquipoId: async (equipoId: string): Promise<WorkOrder[]> => {
      const { data } = await supabase.from("ordenes_trabajo").select("*").eq("equipo_id", equipoId).order("created_at", { ascending: false });
      return (data ?? []).map(toWorkOrder);
    },
    create: async (o: WorkOrder): Promise<WorkOrder> => {
      const { data, error } = await supabase.from("ordenes_trabajo").insert({
        id: o.id,
        equipo_id: o.equipoId,
        tipo: o.tipo,
        fecha_programada: o.fechaProgramada,
        fecha_ejecucion: o.fechaEjecucion,
        fecha_cierre: o.fechaCierre,
        tecnico_asignado_id: o.tecnicoAsignadoId || null,
        tecnico_asignado_nombre: o.tecnicoAsignadoNombre,
        prioridad: o.prioridad,
        estado: o.estado,
        descripcion: o.descripcion,
        repuestos_usados: o.repuestosUsados as any,
        fotos_antes: o.fotosAntes as any,
        fotos_despues: o.fotosDespues as any,
        costo: o.costo,
      }).select().single();
      if (error) throw new Error(`Supabase ordenes.create: ${error.message}`);
      return toWorkOrder(data!);
    },
    update: async (id: string, updates: Partial<WorkOrder>): Promise<WorkOrder | undefined> => {
      const { data, error } = await supabase.from("ordenes_trabajo").update(fromWorkOrder(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase ordenes.update: ${error.message}`);
      return data ? toWorkOrder(data) : undefined;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("ordenes_trabajo").delete().eq("id", id);
      return !error;
    },
  },

  // --- Repuestos ---
  repuestos: {
    getAll: async (): Promise<SparePart[]> => {
      const { data } = await supabase.from("repuestos").select("*").order("nombre");
      return (data ?? []).map(toSparePart);
    },
    getById: async (id: string): Promise<SparePart | undefined> => {
      const { data } = await supabase.from("repuestos").select("*").eq("id", id).single();
      return data ? toSparePart(data) : undefined;
    },
    create: async (sp: SparePart): Promise<SparePart> => {
      const { data, error } = await supabase.from("repuestos").insert({
        id: sp.id,
        nombre: sp.nombre,
        cantidad: sp.cantidad,
        stock_minimo: sp.stockMinimo,
        descripcion: sp.descripcion,
        proveedor: sp.proveedor,
      }).select().single();
      if (error) throw new Error(`Supabase repuestos.create: ${error.message}`);
      return toSparePart(data!);
    },
    update: async (id: string, updates: Partial<SparePart>): Promise<SparePart | undefined> => {
      const { data, error } = await supabase.from("repuestos").update(fromSparePart(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase repuestos.update: ${error.message}`);
      return data ? toSparePart(data) : undefined;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("repuestos").delete().eq("id", id);
      return !error;
    },
  },

  // --- Movimientos ---
  movimientos: {
    getAll: async (): Promise<Movement[]> => {
      const { data } = await supabase.from("movimientos").select("*").order("created_at", { ascending: false });
      return (data ?? []).map(toMovement);
    },
    getByEquipoId: async (equipoId: string): Promise<Movement[]> => {
      const { data } = await supabase.from("movimientos").select("*").eq("equipo_id", equipoId).order("created_at", { ascending: false });
      return (data ?? []).map(toMovement);
    },
    create: async (m: Movement): Promise<Movement> => {
      const { data, error } = await supabase.from("movimientos").insert({
        id: m.id,
        equipo_id: m.equipoId,
        fecha: m.fecha,
        ubicacion_origen: m.ubicacionOrigen,
        ubicacion_destino: m.ubicacionDestino,
        responsable: m.responsable,
        motivo: m.motivo,
      }).select().single();
      if (error) throw new Error(`Supabase movimientos.create: ${error.message}`);
      return toMovement(data!);
    },
  },

  // --- Documentos ---
  documentos: {
    getAll: async (): Promise<Document[]> => {
      const { data } = await supabase.from("documentos").select("*").order("created_at", { ascending: false });
      return (data ?? []).map(toDocument);
    },
    getByEquipoId: async (equipoId: string): Promise<Document[]> => {
      const { data } = await supabase.from("documentos").select("*").eq("equipo_id", equipoId).order("created_at", { ascending: false });
      return (data ?? []).map(toDocument);
    },
    create: async (d: Document): Promise<Document> => {
      const { data, error } = await supabase.from("documentos").insert({
        id: d.id,
        equipo_id: d.equipoId,
        tipo: d.tipo,
        nombre: d.nombre,
        archivo_url: d.archivoUrl,
        fecha_vencimiento: d.fechaVencimiento || null,
      }).select().single();
      if (error) throw new Error(`Supabase documentos.create: ${error.message}`);
      return toDocument(data!);
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("documentos").delete().eq("id", id);
      return !error;
    },
  },

  // --- Fallas ---
  fallas: {
    getAll: async (): Promise<FailureReport[]> => {
      const { data } = await supabase.from("fallas").select("*").order("created_at", { ascending: false });
      return (data ?? []).map(toFailureReport);
    },
    getByEquipoId: async (equipoId: string): Promise<FailureReport[]> => {
      const { data } = await supabase.from("fallas").select("*").eq("equipo_id", equipoId).order("created_at", { ascending: false });
      return (data ?? []).map(toFailureReport);
    },
    create: async (f: FailureReport): Promise<FailureReport> => {
      const { data, error } = await supabase.from("fallas").insert({
        id: f.id,
        equipo_id: f.equipoId,
        reportado_por: f.reportadoPor,
        tipo_reportante: f.tipoReportante,
        descripcion: f.descripcion,
        fecha_reporte: f.fechaReporte,
        estado: f.estado,
        orden_trabajo_id: f.ordenTrabajoId || null,
      }).select().single();
      if (error) throw new Error(`Supabase fallas.create: ${error.message}`);
      return toFailureReport(data!);
    },
    update: async (id: string, updates: Partial<FailureReport>): Promise<FailureReport | undefined> => {
      const { data, error } = await supabase.from("fallas").update(fromFailureReport(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase fallas.update: ${error.message}`);
      return data ? toFailureReport(data) : undefined;
    },
  },

  // --- Notificaciones ---
  notificaciones: {
    getAll: async (): Promise<Notification[]> => {
      const { data } = await supabase.from("notificaciones").select("*").order("created_at", { ascending: false });
      return (data ?? []).map(toNotification);
    },
    getByUsuarioId: async (usuarioId: string): Promise<Notification[]> => {
      const { data } = await supabase.from("notificaciones").select("*").eq("usuario_id", usuarioId).order("created_at", { ascending: false });
      return (data ?? []).map(toNotification);
    },
    create: async (n: Notification): Promise<Notification> => {
      const { data, error } = await supabase.from("notificaciones").insert({
        id: n.id,
        usuario_id: n.usuarioId,
        mensaje: n.mensaje,
        leida: n.leida,
        tipo: n.tipo,
        entidad_id: n.entidadId || null,
      }).select().single();
      if (error) throw new Error(`Supabase notificaciones.create: ${error.message}`);
      return toNotification(data!);
    },
    marcarLeida: async (id: string): Promise<void> => {
      const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
      if (error) console.error("Supabase notificaciones.marcarLeida:", error.message);
    },
  },

  // --- Mantenimientos ---
  mantenimientos: {
    getAll: async (): Promise<MaintenanceSchedule[]> => {
      const { data } = await supabase.from("mantenimientos").select("*").order("proxima_fecha");
      return (data ?? []).map(toMaintenanceSchedule);
    },
    getByEquipoId: async (equipoId: string): Promise<MaintenanceSchedule[]> => {
      const { data } = await supabase.from("mantenimientos").select("*").eq("equipo_id", equipoId);
      return (data ?? []).map(toMaintenanceSchedule);
    },
    create: async (m: MaintenanceSchedule): Promise<MaintenanceSchedule> => {
      const { data, error } = await supabase.from("mantenimientos").insert({
        id: m.id,
        equipo_id: m.equipoId,
        frecuencia_meses: m.frecuenciaMeses,
        proxima_fecha: m.proximaFecha,
        ultima_fecha: m.ultimaFecha,
        horas_uso: m.horasUso || null,
        activo: m.activo,
      }).select().single();
      if (error) throw new Error(`Supabase mantenimientos.create: ${error.message}`);
      return toMaintenanceSchedule(data!);
    },
    update: async (id: string, updates: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule | undefined> => {
      const { data, error } = await supabase.from("mantenimientos").update(fromMaintenanceSchedule(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase mantenimientos.update: ${error.message}`);
      return data ? toMaintenanceSchedule(data) : undefined;
    },
  },

  // --- Repuestos por Equipo ---
  repuestosEquipo: {
    getAll: async (): Promise<SparePartAssignment[]> => {
      const { data } = await supabase.from("repuestos_equipo").select("*");
      return (data ?? []).map(toSparePartAssignment);
    },
    getByEquipoId: async (equipoId: string): Promise<SparePartAssignment[]> => {
      const { data } = await supabase.from("repuestos_equipo").select("*").eq("equipo_id", equipoId);
      return (data ?? []).map(toSparePartAssignment);
    },
    create: async (s: SparePartAssignment): Promise<SparePartAssignment> => {
      const { data, error } = await supabase.from("repuestos_equipo").insert({
        id: s.id,
        equipo_id: s.equipoId,
        repuesto_id: s.repuestoId,
        repuesto_nombre: s.repuestoNombre,
        cantidad_actual: s.cantidadActual,
        ubicacion_fisica: s.ubicacionFisica,
        fecha_asignacion: s.fechaAsignacion,
        observaciones: s.observaciones,
      }).select().single();
      if (error) throw new Error(`Supabase repuestosEquipo.create: ${error.message}`);
      return toSparePartAssignment(data!);
    },
    update: async (id: string, updates: Partial<SparePartAssignment>): Promise<SparePartAssignment | undefined> => {
      const { data, error } = await supabase.from("repuestos_equipo").update(fromSparePartAssignment(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase repuestosEquipo.update: ${error.message}`);
      return data ? toSparePartAssignment(data) : undefined;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("repuestos_equipo").delete().eq("id", id);
      return !error;
    },
  },

  // --- Usuarios ---
  usuarios: {
    getAll: async (): Promise<User[]> => {
      const { data } = await supabase.from("usuarios").select("*").order("nombre");
      return (data ?? []).map(toUser);
    },
    getById: async (id: string): Promise<User | undefined> => {
      const { data } = await supabase.from("usuarios").select("*").eq("id", id).single();
      return data ? toUser(data) : undefined;
    },
    getByEmail: async (email: string): Promise<User | undefined> => {
      const { data } = await supabase.from("usuarios").select("*").ilike("email", email).single();
      return data ? toUser(data) : undefined;
    },
    create: async (u: User): Promise<User> => {
      const { data, error } = await supabase.from("usuarios").insert({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        password_hash: u.passwordHash,
        rol: u.rol,
        avatar: u.avatar,
      }).select().single();
      if (error) throw new Error(`Supabase usuarios.create: ${error.message}`);
      return toUser(data!);
    },
    update: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
      const { data, error } = await supabase.from("usuarios").update(fromUser(updates) as any).eq("id", id).select().single();
      if (error) throw new Error(`Supabase usuarios.update: ${error.message}`);
      return data ? toUser(data) : undefined;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      return !error;
    },
    verifyPassword: async (email: string, password: string): Promise<User | undefined> => {
      const { data } = await supabase.from("usuarios").select("*").ilike("email", email).single();
      if (!data) return undefined;
      if (data.password_hash === password) return toUser(data);
      return undefined;
    },
  },
};
