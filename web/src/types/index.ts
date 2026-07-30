export type UserRole = "admin" | "director_departamento" | "tecnico" | "clinico" | "publico";

export interface User {
  id: string;
  nombre: string;
  email: string;
  passwordHash?: string;
  rol: UserRole;
  avatar?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  passwordChangedAt?: string;
  failedAttempts?: number;
  lockedUntil?: string;
  createdAt: string;
}

export interface SessionToken {
  userId: string;
  email: string;
  rol: UserRole;
  nombre: string;
  exp: number;
  iat: number;
  isDemo: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userEmail: string;
  action: "login" | "logout" | "login_failed" | "demo_login";
  ipAddress: string;
  userAgent: string;
  details: string;
  createdAt: string;
}

export type EquipmentStatus = "operativo" | "en_mantenimiento" | "fuera_de_servicio" | "dado_de_baja" | "desconocido";

export interface Equipment {
  id: string;
  uuid: string;
  nombre: string;
  marca: string;
  modelo: string;
  serial: string;
  fechaAdquisicion: string;
  estado: EquipmentStatus;
  ubicacion: string;
  valorCompra: number;
  vidaUtil: number;
  qrCodeUrl?: string;
  descripcion?: string;
  anioFabricacion?: string;
  observaciones?: string;
  servicioTecnico?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType = "preventivo" | "correctivo" | "calibracion" | "verificacion";
export type MaintenancePriority = "baja" | "media" | "alta" | "critica";
export type WorkOrderStatus = "pendiente" | "en_proceso" | "finalizada" | "verificada";

export interface WorkOrder {
  id: string;
  equipoId: string;
  tipo: MaintenanceType;
  fechaProgramada?: string;
  fechaEjecucion?: string;
  fechaCierre?: string;
  tecnicoAsignadoId?: string;
  tecnicoAsignadoNombre?: string;
  prioridad: MaintenancePriority;
  estado: WorkOrderStatus;
  descripcion: string;
  repuestosUsados: SparePartUsage[];
  fotosAntes?: string[];
  fotosDespues?: string[];
  costo?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  id: string;
  nombre: string;
  cantidad: number;
  stockMinimo: number;
  descripcion?: string;
  proveedor?: string;
  createdAt: string;
}

export interface SparePartUsage {
  repuestoId: string;
  nombre: string;
  cantidadUsada: number;
}

export interface Movement {
  id: string;
  equipoId: string;
  fecha: string;
  ubicacionOrigen: string;
  ubicacionDestino: string;
  responsable: string;
  motivo?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  equipoId: string;
  tipo: "manual" | "certificado_calibracion" | "ficha_tecnica" | "reporte_seguridad" | "otro";
  nombre: string;
  archivoUrl: string;
  fechaVencimiento?: string;
  createdAt: string;
}

export type ReporterType = "paciente" | "familiar" | "personal_medico" | "tecnico" | "otro";

export interface FailureReport {
  id: string;
  equipoId: string;
  reportadoPor: string;
  tipoReportante: ReporterType;
  descripcion: string;
  fechaReporte: string;
  estado: "pendiente" | "en_proceso" | "resuelto";
  ordenTrabajoId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  usuarioId: string;
  mensaje: string;
  leida: boolean;
  tipo: "mantenimiento" | "falla" | "stock" | "ot" | "documento";
  entidadId?: string;
  createdAt: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipoId: string;
  frecuenciaMeses: number;
  proximaFecha: string;
  ultimaFecha?: string;
  horasUso?: number;
  activo: boolean;
  createdAt: string;
}

export interface SparePartAssignment {
  id: string;
  equipoId: string;
  repuestoId: string;
  repuestoNombre: string;
  cantidadActual: number;
  ubicacionFisica: string;
  fechaAsignacion: string;
  observaciones: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEquipos: number;
  operativos: number;
  enMantenimiento: number;
  fueraDeServicio: number;
  mantenimientosPendientes: number;
  fallasPendientes: number;
  repuestosBajoStock: number;
  tiempoPromedioReparacion: number;
}

export interface RoleDashboardConfig {
  showStats: boolean;
  showFaultAlerts: boolean;
  showCharts: boolean;
  showUpcomingMaintenance: boolean;
  showRecentOrders: boolean;
  showQuickActions: boolean;
  showMyOrders: boolean;
}
