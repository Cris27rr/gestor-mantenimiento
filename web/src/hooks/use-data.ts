import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
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
// React Query hooks for all entities
// Each entity gets: useList, useItem, useCreate, useUpdate, useDelete
// ============================================================

// --- Equipos ---
export function useEquipos() {
  return useQuery({ queryKey: ["equipos"], queryFn: () => db.equipos.getAll() });
}

export function useEquiposLookup() {
  return useQuery({
    queryKey: ["equipos", "lookup"],
    queryFn: () => db.equipos.listForLookup(),
  });
}

export function useEquipo(id: string | undefined) {
  return useQuery({
    queryKey: ["equipos", id],
    queryFn: () => db.equipos.getById(id!),
    enabled: !!id,
  });
}

export function useEquipoByUuid(uuid: string | undefined) {
  return useQuery({
    queryKey: ["equipos", "uuid", uuid],
    queryFn: () => db.equipos.getByUuid(uuid!),
    enabled: !!uuid,
  });
}

export function useSearchEquipos(query: string) {
  return useQuery({
    queryKey: ["equipos", "search", query],
    queryFn: () => db.equipos.search(query, 8),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useCreateEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eq: Equipment) => db.equipos.create(eq),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipos"] }),
  });
}

export function useUpdateEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Equipment> }) =>
      db.equipos.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipos"] }),
  });
}

export function useDeleteEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.equipos.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipos"] }),
  });
}

// --- Órdenes de Trabajo ---
export function useOrdenes() {
  return useQuery({ queryKey: ["ordenes"], queryFn: () => db.ordenes.getAll() });
}

export function useOrden(id: string | undefined) {
  return useQuery({
    queryKey: ["ordenes", id],
    queryFn: () => db.ordenes.getById(id!),
    enabled: !!id,
  });
}

export function useOrdenesByEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["ordenes", "equipo", equipoId],
    queryFn: () => db.ordenes.getByEquipoId(equipoId!),
    enabled: !!equipoId,
  });
}

export function useCreateOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (o: WorkOrder) => db.ordenes.create(o),
    onSuccess: (newOrden) => {
      qc.setQueryData<WorkOrder[]>(["ordenes"], (old) =>
        old ? [...old, newOrden] : [newOrden]
      );
      qc.setQueryData<WorkOrder[]>(["ordenes", "equipo", newOrden.equipoId], (old) =>
        old ? [...old, newOrden] : undefined
      );
      // Also update fallas cache when an OT is created from a falla alert
      qc.invalidateQueries({ queryKey: ["fallas"], refetchType: "all" });
      qc.invalidateQueries({ queryKey: ["equipos"], refetchType: "all" });
    },
  });
}

export function useUpdateOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WorkOrder> }) =>
      db.ordenes.update(id, updates),
    onSuccess: (updated, { id, updates }) => {
      qc.setQueryData<WorkOrder[]>(["ordenes"], (old) =>
        old?.map((o) => (o.id === id ? { ...o, ...updates, ...updated } : o)) ?? old
      );
      const equipoId = updated?.equipoId;
      if (equipoId) {
        qc.setQueryData<WorkOrder[]>(["ordenes", "equipo", equipoId], (old) =>
          old?.map((o) => (o.id === id ? { ...o, ...updates, ...updated } : o)) ?? old
        );
      }
    },
  });
}

export function useDeleteOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.ordenes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ordenes"] }),
  });
}

// --- Repuestos ---
export function useRepuestos() {
  return useQuery({ queryKey: ["repuestos"], queryFn: () => db.repuestos.getAll() });
}

export function useCreateRepuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sp: SparePart) => db.repuestos.create(sp),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestos"] }),
  });
}

export function useUpdateRepuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SparePart> }) =>
      db.repuestos.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestos"] }),
  });
}

export function useDeleteRepuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.repuestos.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestos"] }),
  });
}

// --- Movimientos ---
export function useMovimientosByEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["movimientos", equipoId],
    queryFn: () => db.movimientos.getByEquipoId(equipoId!),
    enabled: !!equipoId,
  });
}

export function useCreateMovimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Movement) => db.movimientos.create(m),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movimientos"] }),
  });
}

// --- Documentos ---
export function useDocumentosByEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["documentos", equipoId],
    queryFn: () => db.documentos.getByEquipoId(equipoId!),
    enabled: !!equipoId,
  });
}

export function useCreateDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Document) => db.documentos.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documentos"] }),
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.documentos.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documentos"] }),
  });
}

// --- Fallas ---
export function useFallas() {
  return useQuery({
    queryKey: ["fallas"],
    queryFn: () => db.fallas.getAll(),
    staleTime: 30_000,
    refetchOnMount: true,
  });
}

export function useFallasByEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["fallas", equipoId],
    queryFn: () => db.fallas.getByEquipoId(equipoId!),
    enabled: !!equipoId,
  });
}

export function useCreateFalla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: FailureReport) => db.fallas.create(f),
    onSuccess: (newFalla) => {
      // Direct cache update — bypasses any refetch timing issues
      qc.setQueryData<FailureReport[]>(["fallas"], (old) =>
        old ? [...old, newFalla] : [newFalla]
      );
      // Also update the equipo-specific query if it exists in cache
      qc.setQueryData<FailureReport[]>(["fallas", newFalla.equipoId], (old) =>
        old ? [...old, newFalla] : undefined
      );
      // Invalidate notifications for good measure
      qc.invalidateQueries({ queryKey: ["notificaciones"], refetchType: "all" });
    },
  });
}

export function useUpdateFalla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FailureReport> }) =>
      db.fallas.update(id, updates),
    onSuccess: (_updated, { id, updates }) => {
      qc.setQueryData<FailureReport[]>(["fallas"], (old) =>
        old?.map((f) => (f.id === id ? { ...f, ...updates } : f)) ?? old
      );
      const equipoId = updates.equipoId ?? qc.getQueryData<FailureReport[]>(["fallas"])?.find((f) => f.id === id)?.equipoId;
      if (equipoId) {
        qc.setQueryData<FailureReport[]>(["fallas", equipoId], (old) =>
          old?.map((f) => (f.id === id ? { ...f, ...updates } : f)) ?? old
        );
      }
    },
  });
}

// --- Notificaciones ---
export function useNotificaciones(usuarioId: string | undefined) {
  return useQuery({
    queryKey: ["notificaciones", usuarioId],
    queryFn: () => db.notificaciones.getByUsuarioId(usuarioId!),
    enabled: !!usuarioId,
  });
}

export function useCreateNotificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (n: Notification) => db.notificaciones.create(n),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }),
  });
}

export function useMarcarNotificacionLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.notificaciones.marcarLeida(id),
    onSuccess: (_void, id) => {
      qc.setQueriesData<Notification[]>({ queryKey: ["notificaciones"] }, (old) =>
        old?.map((n) => (n.id === id ? { ...n, leida: true } : n)) ?? old
      );
    },
  });
}

// --- Mantenimientos ---
export function useMantenimientos() {
  return useQuery({ queryKey: ["mantenimientos"], queryFn: () => db.mantenimientos.getAll() });
}

export function useMantenimientosByEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["mantenimientos", equipoId],
    queryFn: () => db.mantenimientos.getByEquipoId(equipoId!),
    enabled: !!equipoId,
  });
}

export function useCreateMantenimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: MaintenanceSchedule) => db.mantenimientos.create(m),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mantenimientos"] }),
  });
}

export function useUpdateMantenimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MaintenanceSchedule> }) =>
      db.mantenimientos.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mantenimientos"] }),
  });
}

// --- Repuestos por Equipo ---
export function useRepuestosEquipoByEquipo(equipoId: string | undefined) {
  return useQuery({
    queryKey: ["repuestosEquipo", equipoId],
    queryFn: () => db.repuestosEquipo.getByEquipoId(equipoId!),
    enabled: !!equipoId,
  });
}

export function useCreateRepuestoEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: SparePartAssignment) => db.repuestosEquipo.create(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestosEquipo"] }),
  });
}

export function useUpdateRepuestoEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SparePartAssignment> }) =>
      db.repuestosEquipo.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestosEquipo"] }),
  });
}

export function useDeleteRepuestoEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.repuestosEquipo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestosEquipo"] }),
  });
}

// --- Usuarios ---
export function useUsuarios() {
  return useQuery({ queryKey: ["usuarios"], queryFn: () => db.usuarios.getAll() });
}

export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (u: User) => db.usuarios.create(u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useUpdateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      db.usuarios.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useDeleteUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.usuarios.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}
