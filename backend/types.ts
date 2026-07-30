/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      documentos: {
        Row: {
          archivo_url: string | null
          created_at: string | null
          equipo_id: string | null
          fecha_vencimiento: string | null
          id: string
          nombre: string
          tipo: string | null
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string | null
          equipo_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre: string
          tipo?: string | null
        }
        Update: {
          archivo_url?: string | null
          created_at?: string | null
          equipo_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          nombre?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          anio_fabricacion: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          fecha_adquisicion: string | null
          id: string
          marca: string | null
          modelo: string | null
          nombre: string
          observaciones: string | null
          serial: string | null
          servicio_tecnico: string | null
          ubicacion: string | null
          updated_at: string | null
          uuid: string
          valor_compra: number | null
          vida_util: number | null
        }
        Insert: {
          anio_fabricacion?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_adquisicion?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre: string
          observaciones?: string | null
          serial?: string | null
          servicio_tecnico?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          uuid: string
          valor_compra?: number | null
          vida_util?: number | null
        }
        Update: {
          anio_fabricacion?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          fecha_adquisicion?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string
          observaciones?: string | null
          serial?: string | null
          servicio_tecnico?: string | null
          ubicacion?: string | null
          updated_at?: string | null
          uuid?: string
          valor_compra?: number | null
          vida_util?: number | null
        }
        Relationships: []
      }
      fallas: {
        Row: {
          created_at: string | null
          descripcion: string
          equipo_id: string | null
          estado: string | null
          fecha_reporte: string
          id: string
          orden_trabajo_id: string | null
          reportado_por: string
          tipo_reportante: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          equipo_id?: string | null
          estado?: string | null
          fecha_reporte: string
          id?: string
          orden_trabajo_id?: string | null
          reportado_por: string
          tipo_reportante?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          equipo_id?: string | null
          estado?: string | null
          fecha_reporte?: string
          id?: string
          orden_trabajo_id?: string | null
          reportado_por?: string
          tipo_reportante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fallas_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fallas_orden_trabajo_id_fkey"
            columns: ["orden_trabajo_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
      mantenimientos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          equipo_id: string | null
          frecuencia_meses: number | null
          horas_uso: number | null
          id: string
          proxima_fecha: string
          ultima_fecha: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          equipo_id?: string | null
          frecuencia_meses?: number | null
          horas_uso?: number | null
          id?: string
          proxima_fecha: string
          ultima_fecha?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          equipo_id?: string | null
          frecuencia_meses?: number | null
          horas_uso?: number | null
          id?: string
          proxima_fecha?: string
          ultima_fecha?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mantenimientos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos: {
        Row: {
          created_at: string | null
          equipo_id: string | null
          fecha: string
          id: string
          motivo: string | null
          responsable: string | null
          ubicacion_destino: string
          ubicacion_origen: string
        }
        Insert: {
          created_at?: string | null
          equipo_id?: string | null
          fecha: string
          id?: string
          motivo?: string | null
          responsable?: string | null
          ubicacion_destino: string
          ubicacion_origen: string
        }
        Update: {
          created_at?: string | null
          equipo_id?: string | null
          fecha?: string
          id?: string
          motivo?: string | null
          responsable?: string | null
          ubicacion_destino?: string
          ubicacion_origen?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string | null
          entidad_id: string | null
          id: string
          leida: boolean | null
          mensaje: string
          tipo: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          entidad_id?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          tipo?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          entidad_id?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          tipo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_trabajo: {
        Row: {
          costo: number | null
          created_at: string | null
          descripcion: string | null
          equipo_id: string | null
          estado: string | null
          fecha_cierre: string | null
          fecha_ejecucion: string | null
          fecha_programada: string | null
          fotos_antes: Json | null
          fotos_despues: Json | null
          id: string
          prioridad: string | null
          repuestos_usados: Json | null
          tecnico_asignado_id: string | null
          tecnico_asignado_nombre: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          costo?: number | null
          created_at?: string | null
          descripcion?: string | null
          equipo_id?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          fecha_ejecucion?: string | null
          fecha_programada?: string | null
          fotos_antes?: Json | null
          fotos_despues?: Json | null
          id?: string
          prioridad?: string | null
          repuestos_usados?: Json | null
          tecnico_asignado_id?: string | null
          tecnico_asignado_nombre?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          costo?: number | null
          created_at?: string | null
          descripcion?: string | null
          equipo_id?: string | null
          estado?: string | null
          fecha_cierre?: string | null
          fecha_ejecucion?: string | null
          fecha_programada?: string | null
          fotos_antes?: Json | null
          fotos_despues?: Json | null
          id?: string
          prioridad?: string | null
          repuestos_usados?: Json | null
          tecnico_asignado_id?: string | null
          tecnico_asignado_nombre?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_tecnico_asignado_id_fkey"
            columns: ["tecnico_asignado_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      repuestos: {
        Row: {
          cantidad: number | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          proveedor: string | null
          stock_minimo: number | null
        }
        Insert: {
          cantidad?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          proveedor?: string | null
          stock_minimo?: number | null
        }
        Update: {
          cantidad?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          proveedor?: string | null
          stock_minimo?: number | null
        }
        Relationships: []
      }
      repuestos_equipo: {
        Row: {
          cantidad_actual: number | null
          created_at: string | null
          equipo_id: string | null
          fecha_asignacion: string | null
          id: string
          observaciones: string | null
          repuesto_id: string | null
          repuesto_nombre: string | null
          ubicacion_fisica: string | null
        }
        Insert: {
          cantidad_actual?: number | null
          created_at?: string | null
          equipo_id?: string | null
          fecha_asignacion?: string | null
          id?: string
          observaciones?: string | null
          repuesto_id?: string | null
          repuesto_nombre?: string | null
          ubicacion_fisica?: string | null
        }
        Update: {
          cantidad_actual?: number | null
          created_at?: string | null
          equipo_id?: string | null
          fecha_asignacion?: string | null
          id?: string
          observaciones?: string | null
          repuesto_id?: string | null
          repuesto_nombre?: string | null
          ubicacion_fisica?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repuestos_equipo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repuestos_equipo_repuesto_id_fkey"
            columns: ["repuesto_id"]
            isOneToOne: false
            referencedRelation: "repuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          avatar: string | null
          created_at: string | null
          email: string
          id: string
          nombre: string
          password_hash: string | null
          rol: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          email: string
          id?: string
          nombre: string
          password_hash?: string | null
          rol?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          password_hash?: string | null
          rol?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
