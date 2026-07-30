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
  AuditLog,
  AccessLog,
} from "@/types";
import equiposImport from "@/data/equipos_import.json";

const DB_KEYS = {
  equipos: "medimaint_equipos",
  ordenes: "medimaint_ordenes",
  repuestos: "medimaint_repuestos",
  repuestosEquipo: "medimaint_repuestos_equipo",
  movimientos: "medimaint_movimientos",
  documentos: "medimaint_documentos",
  fallas: "medimaint_fallas",
  notificaciones: "medimaint_notificaciones",
  mantenimientos: "medimaint_mantenimientos",
  usuarios: "medimaint_usuarios",
  auditLogs: "medimaint_audit_logs",
  accessLogs: "medimaint_access_logs",
};

// Bump this whenever the seeded equipment dataset changes so existing
// browsers get a clean reset of the inventory and its demo data.
const SEED_VERSION = "2026-06-03-full-inventory-v2-deterministic-uuid";
const SEED_VERSION_KEY = "medimaint_seed_version";

// ============================================================
// PERMANENT ACCOUNTS — never modified by seed resets
// ============================================================
const PERMANENT_ACCOUNTS: User[] = [
  {
    id: "cristian98arr",
    nombre: "Cristian Administrador",
    email: "cristian98arr@gmail.com",
    passwordHash: "123456",
    rol: "admin",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
];

// ============================================================
// DEMO USER — internal technician for demo access button
// ============================================================
const DEMO_USER: User = {
  id: "demo-tecnico",
  nombre: "Técnico Demo",
  email: "demo@medimaint.internal",
  passwordHash: "",
  rol: "tecnico",
  createdAt: new Date().toISOString(),
};

const DEMO_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const NULL_VALUES = new Set([
  "",
  "no tiene",
  "n/v",
  "nv",
  "no posee",
  "desconocido",
  "nd",
]);

/** Returns a cleaned value or empty string when it represents a missing field. */
function cleanField(value: unknown): string {
  const v = (value ?? "").toString().trim();
  if (NULL_VALUES.has(v.toLowerCase())) return "";
  return v;
}

function getItem<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  const serialized = JSON.stringify(data);
  localStorage.setItem(key, serialized);
  // Verify the write actually persisted (defense against silent quota failures)
  const verify = localStorage.getItem(key);
  if (verify !== serialized) {
    throw new Error(`[mockDb] Fallo al guardar ${key}: los datos no persistieron (posible cuota de almacenamiento excedida)`);
  }
}

// Simple UUID generator (crypto.randomUUID() when available)
function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================
// Audit & Access Logging (immutable — only INSERT)
// ============================================================

function auditLog(
  userId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
) {
  const logs = getItem<AuditLog>(DB_KEYS.auditLogs);
  logs.push({
    id: uuid(),
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress: "client",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
    createdAt: new Date().toISOString(),
  });
  if (logs.length > 5000) {
    setItem(DB_KEYS.auditLogs, logs.slice(-5000));
  } else {
    setItem(DB_KEYS.auditLogs, logs);
  }
}

function accessLog(
  userId: string,
  userEmail: string,
  action: AccessLog["action"],
  details: string
) {
  const logs = getItem<AccessLog>(DB_KEYS.accessLogs);
  logs.push({
    id: uuid(),
    userId,
    userEmail,
    action,
    ipAddress: "client",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
    details,
    createdAt: new Date().toISOString(),
  });
  if (logs.length > 2000) {
    setItem(DB_KEYS.accessLogs, logs.slice(-2000));
  } else {
    setItem(DB_KEYS.accessLogs, logs);
  }
}

// ============================================================
// Session Token (JWT-like with expiry)
// ============================================================

function signSessionToken(user: User, isDemo: boolean): string {
  const payload = {
    userId: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    exp: Date.now() + (isDemo ? DEMO_SESSION_DURATION_MS : 24 * 60 * 60 * 1000),
    iat: Date.now(),
    isDemo,
  };
  const token = btoa(JSON.stringify(payload));
  localStorage.setItem("medimaint_session_token", token);
  return token;
}

function verifySessionToken(): { userId: string; email: string; rol: string; nombre: string; isDemo: boolean } | null {
  try {
    const token = localStorage.getItem("medimaint_session_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      localStorage.removeItem("medimaint_session_token");
      return null;
    }
    return payload;
  } catch {
    localStorage.removeItem("medimaint_session_token");
    return null;
  }
}

// ============================================================
// Password Policy
// ============================================================

const PASSWORD_POLICY_EXEMPT_EMAILS = new Set([
  "cristian98arr@gmail.com",
]);

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function isPasswordStrongEnough(password: string, email: string): { ok: boolean; reason: string } {
  if (PASSWORD_POLICY_EXEMPT_EMAILS.has(email.toLowerCase())) {
    return { ok: true, reason: "" };
  }
  if (password.length < 8) return { ok: false, reason: "La contraseña debe tener al menos 8 caracteres" };
  if (!/[A-Z]/.test(password)) return { ok: false, reason: "La contraseña debe contener al menos una mayúscula" };
  if (!/[0-9]/.test(password)) return { ok: false, reason: "La contraseña debe contener al menos un número" };
  return { ok: true, reason: "" };
}

function generateShortUuid(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generates a deterministic short UUID based on equipment identity.
 * Using a simple hash ensures the same equipment always gets the same UUID
 * across re-seeds, so printed QR codes remain valid forever.
 * The index disambiguates identical equipment (same ubicacion/nombre/serial).
 */
function deterministicUuid(ubicacion: string, nombre: string, serial: string, index: number): string {
  const input = `${ubicacion}|${nombre}|${serial}|eq-${index}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// Seed data if empty
function seedIfEmpty() {
  // ── Version reset ── clean the inventory + demo data when the dataset changes,
  // while preserving user accounts created from the admin panel.
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (storedVersion !== SEED_VERSION) {
    localStorage.removeItem(DB_KEYS.equipos);
    localStorage.removeItem(DB_KEYS.ordenes);
    localStorage.removeItem(DB_KEYS.fallas);
    localStorage.removeItem(DB_KEYS.mantenimientos);
    localStorage.removeItem(DB_KEYS.movimientos);
    localStorage.removeItem(DB_KEYS.notificaciones);
    localStorage.removeItem(DB_KEYS.documentos);
    localStorage.removeItem(DB_KEYS.repuestosEquipo);
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }

  // ── Seed Users ── (ensure permanent accounts + demo user always exist)
  const usuariosExistentes = getItem<User>(DB_KEYS.usuarios);

  // Always ensure permanent accounts exist (cristian98arr@gmail.com, etc.)
  for (const perm of PERMANENT_ACCOUNTS) {
    const idx = usuariosExistentes.findIndex(
      (u) => u.email.toLowerCase() === perm.email.toLowerCase()
    );
    if (idx >= 0) {
      // Update but preserve password and role
      usuariosExistentes[idx] = {
        ...usuariosExistentes[idx],
        ...perm,
        passwordHash: usuariosExistentes[idx].passwordHash || perm.passwordHash,
        rol: perm.rol,
      };
    } else {
      usuariosExistentes.push(perm);
    }
  }

  // Always ensure demo user exists
  const demoIdx = usuariosExistentes.findIndex(
    (u) => u.id === DEMO_USER.id
  );
  if (demoIdx >= 0) {
    usuariosExistentes[demoIdx] = { ...DEMO_USER, createdAt: usuariosExistentes[demoIdx].createdAt };
  } else {
    usuariosExistentes.push(DEMO_USER);
  }

  setItem(DB_KEYS.usuarios, usuariosExistentes);

  // ── Seed Equipment from import file (merge new entries) ──
  const equiposExistentes: Equipment[] = getItem<Equipment>(DB_KEYS.equipos);

  const equiposImportParsed: Equipment[] = equiposImport.map((item, index) => {
    const rawEstado = (item as any).estado?.toString().toLowerCase().trim() ?? "";
    let mappedEstado: Equipment["estado"];
    if (rawEstado === "inoperativo" || rawEstado === "fuera_de_servicio") {
      mappedEstado = "fuera_de_servicio";
    } else if (rawEstado === "operativo") {
      mappedEstado = "operativo";
    } else if (rawEstado === "en_mantenimiento") {
      mappedEstado = "en_mantenimiento";
    } else if (rawEstado === "dado_de_baja") {
      mappedEstado = "dado_de_baja";
    } else {
      mappedEstado = "desconocido";
    }

    const anio = cleanField((item as any).anioFabricacion);

    const eqNombre = cleanField(item.nombre) || `Equipo ${index + 1}`;
    const eqMarca = cleanField(item.marca);
    const eqModelo = cleanField(item.modelo);
    const eqSerial = cleanField(item.serial);
    const eqUbicacion = cleanField(item.ubicacion) || "General";

    return {
      id: ``, // assigned below
      uuid: deterministicUuid(eqUbicacion, eqNombre, eqSerial, index),
      nombre: eqNombre,
      marca: eqMarca,
      modelo: eqModelo,
      serial: eqSerial,
      fechaAdquisicion: anio ? `${anio}-01-01` : "",
      estado: mappedEstado,
      ubicacion: eqUbicacion,
      valorCompra: 0,
      vidaUtil: 10,
      ...(anio ? { anioFabricacion: anio } : {}),
      ...(cleanField((item as any).observaciones)
        ? { observaciones: cleanField((item as any).observaciones) }
        : {}),
      ...(cleanField((item as any).servicioTecnico)
        ? { servicioTecnico: cleanField((item as any).servicioTecnico) }
        : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Seed the full inventory only when empty. The version reset above guarantees
  // a clean slate when the dataset changes, so every listed equipment is loaded
  // without dropping items that may share a serial across different areas.
  if (equiposExistentes.length === 0) {
    const equiposConId = equiposImportParsed.map((eq, i) => ({
      ...eq,
      id: `eq-import-${i}`,
    }));
    setItem(DB_KEYS.equipos, equiposConId);
  }

  // ── Seed Repuestos ──
  if (!localStorage.getItem(DB_KEYS.repuestos)) {
    const repuestos: SparePart[] = [
      {
        id: "sp1",
        nombre: "Filtro HEPA",
        cantidad: 15,
        stockMinimo: 5,
        descripcion: "Filtro para ventiladores",
        proveedor: "MedSupply",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp2",
        nombre: "Batería Li-Ion 14.4V",
        cantidad: 3,
        stockMinimo: 4,
        descripcion: "Batería para desfibriladores",
        proveedor: "Zoll Direct",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp3",
        nombre: "Cable ECG 12 derivaciones",
        cantidad: 8,
        stockMinimo: 3,
        descripcion: "Cable para monitor multiparamétrico",
        proveedor: "Philips Parts",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp4",
        nombre: "Sonda ecográfica lineal",
        cantidad: 2,
        stockMinimo: 1,
        descripcion: "Sonda para ecógrafo",
        proveedor: "GE Healthcare",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp5",
        nombre: "Electrodo adulto descartable",
        cantidad: 50,
        stockMinimo: 20,
        descripcion: "Electrodos para desfibrilador Zoll",
        proveedor: "Zoll Direct",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp6",
        nombre: "Sensor SpO2 reusable",
        cantidad: 12,
        stockMinimo: 5,
        descripcion: "Sensor de oximetría adulto",
        proveedor: "Philips Parts",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp7",
        nombre: "Manguito de presión NIBP adulto",
        cantidad: 20,
        stockMinimo: 8,
        descripcion: "Brazalete para monitores Philips",
        proveedor: "Philips Parts",
        createdAt: new Date().toISOString(),
      },
      {
        id: "sp8",
        nombre: "Kit de calibración de flujo",
        cantidad: 2,
        stockMinimo: 2,
        descripcion: "Para ventiladores Hamilton C6",
        proveedor: "Hamilton Medical",
        createdAt: new Date().toISOString(),
      },
    ];
    setItem(DB_KEYS.repuestos, repuestos);
  }

  // ── Seed Órdenes de Trabajo ──
  if (!localStorage.getItem(DB_KEYS.ordenes)) {
    const equipos = getItem<Equipment>(DB_KEYS.equipos);
    const eq1 = equipos[0]?.id ?? "eq-import-0";
    const eqUci = equipos.find((e) => e.ubicacion === "UCI")?.id ?? eq1;

    const ordenes: WorkOrder[] = [
      {
        id: "ot1",
        equipoId: eqUci,
        tipo: "correctivo",
        fechaProgramada: "2026-06-10",
        prioridad: "alta",
        estado: "en_proceso",
        descripcion: "Reparación de sistema de humidificación del ventilador",
        repuestosUsados: [],
        tecnicoAsignadoId: "u2",
        tecnicoAsignadoNombre: "Carlos Técnico",
        costo: 1200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ot2",
        equipoId: eq1,
        tipo: "preventivo",
        fechaProgramada: "2026-06-15",
        prioridad: "media",
        estado: "pendiente",
        descripcion: "Mantenimiento preventivo trimestral de monitores",
        repuestosUsados: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ot3",
        equipoId: equipos[4]?.id ?? eq1,
        tipo: "correctivo",
        fechaProgramada: "2026-05-28",
        fechaEjecucion: "2026-05-28",
        fechaCierre: "2026-05-28",
        prioridad: "critica",
        estado: "finalizada",
        descripcion: "Reemplazo de batería y calibración de desfibrilador",
        repuestosUsados: [
          { repuestoId: "sp2", nombre: "Batería Li-Ion 14.4V", cantidadUsada: 1 },
        ],
        costo: 850,
        tecnicoAsignadoId: "u2",
        tecnicoAsignadoNombre: "Carlos Técnico",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setItem(DB_KEYS.ordenes, ordenes);
  }

  // ── Seed Fallas ──
  if (!localStorage.getItem(DB_KEYS.fallas)) {
    const equipos = getItem<Equipment>(DB_KEYS.equipos);
    const eq1 = equipos[0]?.id ?? "eq-import-0";
    const eq2 = equipos[5]?.id ?? eq1;

    const fallas: FailureReport[] = [
      {
        id: "f1",
        equipoId: eq1,
        reportadoPor: "Enfermería General",
        tipoReportante: "personal_medico",
        descripcion: "Pantalla parpadea intermitentemente",
        fechaReporte: "2026-05-18",
        estado: "pendiente",
        createdAt: new Date().toISOString(),
      },
      {
        id: "f2",
        equipoId: eq2,
        reportadoPor: "Dr. García",
        tipoReportante: "personal_medico",
        descripcion: "No enciende al presionar botón de inicio",
        fechaReporte: "2026-05-19",
        estado: "en_proceso",
        ordenTrabajoId: "ot3",
        createdAt: new Date().toISOString(),
      },
    ];
    setItem(DB_KEYS.fallas, fallas);
  }

  // ── Seed Programación de Mantenimiento ──
  if (!localStorage.getItem(DB_KEYS.mantenimientos)) {
    const equipos = getItem<Equipment>(DB_KEYS.equipos);
    const eq1 = equipos[0]?.id ?? "eq-import-0";
    const eq2 = equipos[5]?.id ?? eq1;

    const mantenimientos: MaintenanceSchedule[] = [
      {
        id: "ms1",
        equipoId: eq1,
        frecuenciaMeses: 3,
        proximaFecha: "2026-07-01",
        ultimaFecha: "2026-04-01",
        activo: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ms2",
        equipoId: eq2,
        frecuenciaMeses: 6,
        proximaFecha: "2026-08-15",
        ultimaFecha: "2026-02-15",
        activo: true,
        createdAt: new Date().toISOString(),
      },
    ];
    setItem(DB_KEYS.mantenimientos, mantenimientos);
  }

  // ── Seed Notificaciones ──
  if (!localStorage.getItem(DB_KEYS.notificaciones)) {
    const notificaciones: Notification[] = [
      {
        id: "n1",
        usuarioId: "u1",
        mensaje: "Nuevo reporte de falla en monitor Philips MX800",
        leida: false,
        tipo: "falla",
        entidadId: "f1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "n2",
        usuarioId: "u2",
        mensaje: "OT-001 asignada: Reparación de ventilador",
        leida: false,
        tipo: "ot",
        entidadId: "ot1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "n3",
        usuarioId: "u1",
        mensaje: "Alerta: Repuesto 'Batería Li-Ion' bajo stock",
        leida: true,
        tipo: "stock",
        entidadId: "sp2",
        createdAt: new Date().toISOString(),
      },
    ];
    setItem(DB_KEYS.notificaciones, notificaciones);
  }

  // ── Seed Movimientos ──
  if (!localStorage.getItem(DB_KEYS.movimientos)) {
    const equipos = getItem<Equipment>(DB_KEYS.equipos);
    const eq1 = equipos[0]?.id ?? "eq-import-0";

    const movimientos: Movement[] = [
      {
        id: "mv1",
        equipoId: eq1,
        fecha: "2026-03-10",
        ubicacionOrigen: "Almacén",
        ubicacionDestino: "General",
        responsable: "Carlos Técnico",
        motivo: "Instalación inicial",
        createdAt: new Date().toISOString(),
      },
    ];
    setItem(DB_KEYS.movimientos, movimientos);
  }
}

seedIfEmpty();

// ── CRUD helpers (with audit logging for mutations) ──
function createCrud<T extends { id: string }>(key: string) {
  return {
    getAll: (): T[] => getItem<T>(key),
    getById: (id: string): T | undefined =>
      getItem<T>(key).find((x) => x.id === id),
    create: (item: T): T => {
      const all = getItem<T>(key);
      all.push(item);
      setItem(key, all);
      return all[all.length - 1];
    },
    createWithAudit: (item: T, userId: string, userEmail: string, entityType: string): T => {
      const all = getItem<T>(key);
      all.push(item);
      setItem(key, all);
      auditLog(userId, userEmail, "create", entityType, item.id, null, item as unknown as Record<string, unknown>);
      return item;
    },
    update: (id: string, updates: Partial<T>): T | undefined => {
      const all = getItem<T>(key);
      const idx = all.findIndex((x) => x.id === id);
      if (idx === -1) return undefined;
      all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() } as T;
      setItem(key, all);
      return all[idx];
    },
    updateWithAudit: (id: string, updates: Partial<T>, userId: string, userEmail: string, entityType: string): T | undefined => {
      const all = getItem<T>(key);
      const idx = all.findIndex((x) => x.id === id);
      if (idx === -1) return undefined;
      const oldValues = { ...all[idx] } as unknown as Record<string, unknown>;
      all[idx] = { ...all[idx], ...updates } as T;
      setItem(key, all);
      auditLog(userId, userEmail, "update", entityType, id, oldValues, updates as unknown as Record<string, unknown>);
      return all[idx];
    },
    delete: (id: string): boolean => {
      const all = getItem<T>(key);
      const filtered = all.filter((x) => x.id !== id);
      if (filtered.length === all.length) return false;
      setItem(key, filtered);
      return true;
    },
    deleteWithAudit: (id: string, userId: string, userEmail: string, entityType: string): boolean => {
      const all = getItem<T>(key);
      const item = all.find((x) => x.id === id);
      const filtered = all.filter((x) => x.id !== id);
      if (filtered.length === all.length) return false;
      setItem(key, filtered);
      if (item) {
        auditLog(userId, userEmail, "delete", entityType, id, item as unknown as Record<string, unknown>, null);
      }
      return true;
    },
  };
}

export const db = {
  equipos: {
    ...createCrud<Equipment>(DB_KEYS.equipos),
    getByUuid: (uuid: string) =>
      getItem<Equipment>(DB_KEYS.equipos).find((e) => e.uuid === uuid),
  },
  ordenes: {
    ...createCrud<WorkOrder>(DB_KEYS.ordenes),
    getByEquipoId: (equipoId: string) =>
      getItem<WorkOrder>(DB_KEYS.ordenes).filter(
        (o) => o.equipoId === equipoId
      ),
  },
  repuestos: createCrud<SparePart>(DB_KEYS.repuestos),
  movimientos: {
    ...createCrud<Movement>(DB_KEYS.movimientos),
    getByEquipoId: (equipoId: string) =>
      getItem<Movement>(DB_KEYS.movimientos).filter(
        (m) => m.equipoId === equipoId
      ),
  },
  documentos: {
    ...createCrud<Document>(DB_KEYS.documentos),
    getByEquipoId: (equipoId: string) =>
      getItem<Document>(DB_KEYS.documentos).filter(
        (d) => d.equipoId === equipoId
      ),
  },
  fallas: {
    ...createCrud<FailureReport>(DB_KEYS.fallas),
    getByEquipoId: (equipoId: string) =>
      getItem<FailureReport>(DB_KEYS.fallas).filter(
        (f) => f.equipoId === equipoId
      ),
  },
  notificaciones: {
    ...createCrud<Notification>(DB_KEYS.notificaciones),
    getByUsuarioId: (usuarioId: string) =>
      getItem<Notification>(DB_KEYS.notificaciones).filter(
        (n) => n.usuarioId === usuarioId
      ),
    marcarLeida: (id: string) => {
      const all = getItem<Notification>(DB_KEYS.notificaciones);
      const idx = all.findIndex((n) => n.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], leida: true };
        setItem(DB_KEYS.notificaciones, all);
      }
    },
  },
  mantenimientos: {
    ...createCrud<MaintenanceSchedule>(DB_KEYS.mantenimientos),
    getByEquipoId: (equipoId: string) =>
      getItem<MaintenanceSchedule>(DB_KEYS.mantenimientos).filter(
        (m) => m.equipoId === equipoId
      ),
  },
  repuestosEquipo: {
    ...createCrud<SparePartAssignment>(DB_KEYS.repuestosEquipo),
    getByEquipoId: (equipoId: string) =>
      getItem<SparePartAssignment>(DB_KEYS.repuestosEquipo).filter(
        (r) => r.equipoId === equipoId
      ),
  },
  usuarios: {
    ...createCrud<User>(DB_KEYS.usuarios),
    getByEmail: (email: string) =>
      getItem<User>(DB_KEYS.usuarios).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ),
    verifyPassword: (email: string, password: string): { user: User | undefined; locked: boolean; reason: string } => {
      const user = getItem<User>(DB_KEYS.usuarios).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!user) return { user: undefined, locked: false, reason: "Credenciales incorrectas" };

      // Check lockout
      if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
        const remaining = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
        return { user: undefined, locked: true, reason: `Cuenta bloqueada. Intente nuevamente en ${remaining} minuto(s)` };
      }

      // Verify password
      if (user.passwordHash !== password) {
        const newAttempts = (user.failedAttempts ?? 0) + 1;
        const updates: Partial<User> = { failedAttempts: newAttempts };
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        }
        // Update user in storage
        const all = getItem<User>(DB_KEYS.usuarios);
        const idx = all.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          all[idx] = { ...all[idx], ...updates };
          setItem(DB_KEYS.usuarios, all);
        }
        accessLog(user.id, user.email, "login_failed", `Attempt ${newAttempts}`);
        return { user: undefined, locked: false, reason: "Credenciales incorrectas" };
      }

      // Reset failed attempts on successful login
      if (user.failedAttempts && user.failedAttempts > 0) {
        const all = getItem<User>(DB_KEYS.usuarios);
        const idx = all.findIndex((u) => u.id === user.id);
        if (idx >= 0) {
          all[idx] = { ...all[idx], failedAttempts: 0, lockedUntil: undefined };
          setItem(DB_KEYS.usuarios, all);
        }
      }

      accessLog(user.id, user.email, "login", "Login exitoso");
      signSessionToken(user, false);
      return { user: { ...user, failedAttempts: 0 }, locked: false, reason: "" };
    },
    loginDemo: (): { user: User; token: string } => {
      const demoUser = getItem<User>(DB_KEYS.usuarios).find((u) => u.id === DEMO_USER.id) ?? DEMO_USER;
      accessLog(demoUser.id, demoUser.email, "demo_login", "Acceso Demo");
      const token = signSessionToken(demoUser, true);
      return { user: demoUser, token };
    },
    changePassword: (userId: string, currentPassword: string, newPassword: string): { ok: boolean; reason: string } => {
      const all = getItem<User>(DB_KEYS.usuarios);
      const idx = all.findIndex((u) => u.id === userId);
      if (idx < 0) return { ok: false, reason: "Usuario no encontrado" };
      const user = all[idx];
      if (user.passwordHash !== currentPassword) return { ok: false, reason: "Contraseña actual incorrecta" };
      const policy = isPasswordStrongEnough(newPassword, user.email);
      if (!policy.ok) return policy;
      all[idx] = { ...user, passwordHash: newPassword, passwordChangedAt: new Date().toISOString() };
      setItem(DB_KEYS.usuarios, all);
      auditLog(user.id, user.email, "change_password", "usuario", user.id, null, null);
      return { ok: true, reason: "" };
    },
    verifySession: () => verifySessionToken(),
    isPasswordStrongEnough,
    getPermanentAccounts: () => PERMANENT_ACCOUNTS,
    isPermanentAccount: (email: string) => PASSWORD_POLICY_EXEMPT_EMAILS.has(email.toLowerCase()),
  },
  // Audit & Access logs (read-only for admin)
  auditLogs: {
    getAll: (): AuditLog[] => getItem<AuditLog>(DB_KEYS.auditLogs).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    getByUserId: (userId: string): AuditLog[] => getItem<AuditLog>(DB_KEYS.auditLogs).filter((l) => l.userId === userId),
    getByEntity: (entityType: string, entityId: string): AuditLog[] => getItem<AuditLog>(DB_KEYS.auditLogs).filter((l) => l.entityType === entityType && l.entityId === entityId),
  },
  accessLogs: {
    getAll: (): AccessLog[] => getItem<AccessLog>(DB_KEYS.accessLogs).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  },
};
