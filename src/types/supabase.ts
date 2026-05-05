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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alumnos: {
        Row: {
          activo: boolean | null
          created_at: string
          disponibilidad: Json | null
          email: string | null
          fecha_baja: string | null
          foto_url: string | null
          id: string
          nivel: string | null
          nombre: string
          observaciones: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          disponibilidad?: Json | null
          email?: string | null
          fecha_baja?: string | null
          foto_url?: string | null
          id?: string
          nivel?: string | null
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          disponibilidad?: Json | null
          email?: string | null
          fecha_baja?: string | null
          foto_url?: string | null
          id?: string
          nivel?: string | null
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alumnos_clases: {
        Row: {
          alumno_id: string
          clase_id: string | null
          evento_id: string | null
          id: string | null
          origen: string | null
          tipo_asignacion: string | null
        }
        Insert: {
          alumno_id: string
          clase_id?: string | null
          evento_id?: string | null
          id?: string | null
          origen?: string | null
          tipo_asignacion?: string | null
        }
        Update: {
          alumno_id?: string
          clase_id?: string | null
          evento_id?: string | null
          id?: string | null
          origen?: string | null
          tipo_asignacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alumnos_clases_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumnos_clases_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumnos_clases_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_clase"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          alumno_id: string | null
          clase_id: string | null
          estado: string | null
          fecha: string | null
          id: string
        }
        Insert: {
          alumno_id?: string | null
          clase_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
        }
        Update: {
          alumno_id?: string | null
          clase_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      clases: {
        Row: {
          contabiliza_como: string | null
          created_at: string | null
          dia_semana: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          instalacion_id: number | null
          nivel_clase: string | null
          nombre: string | null
          observaciones: string | null
          profesor: string | null
          recurrencia: string | null
          tipo_clase: string | null
          updated_at: string | null
        }
        Insert: {
          contabiliza_como?: string | null
          created_at?: string | null
          dia_semana?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          instalacion_id?: number | null
          nivel_clase?: string | null
          nombre?: string | null
          observaciones?: string | null
          profesor?: string | null
          recurrencia?: string | null
          tipo_clase?: string | null
          updated_at?: string | null
        }
        Update: {
          contabiliza_como?: string | null
          created_at?: string | null
          dia_semana?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          instalacion_id?: number | null
          nivel_clase?: string | null
          nombre?: string | null
          observaciones?: string | null
          profesor?: string | null
          recurrencia?: string | null
          tipo_clase?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clases_instalacion_id_fkey"
            columns: ["instalacion_id"]
            isOneToOne: false
            referencedRelation: "instalaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      clases_ejercicios: {
        Row: {
          activo: boolean | null
          clase_id: string
          created_at: string | null
          duracion_minutos: number | null
          ejercicio_id: string
          fecha_asignacion: string | null
          id: string
          observaciones: string | null
          orden_ejercicio: number | null
          profesor: string | null
          tematica: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          clase_id: string
          created_at?: string | null
          duracion_minutos?: number | null
          ejercicio_id: string
          fecha_asignacion?: string | null
          id?: string
          observaciones?: string | null
          orden_ejercicio?: number | null
          profesor?: string | null
          tematica?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          clase_id?: string
          created_at?: string | null
          duracion_minutos?: number | null
          ejercicio_id?: string
          fecha_asignacion?: string | null
          id?: string
          observaciones?: string | null
          orden_ejercicio?: number | null
          profesor?: string | null
          tematica?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clases_ejercicios_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_ejercicios_ejercicio_id_fkey"
            columns: ["ejercicio_id"]
            isOneToOne: false
            referencedRelation: "ejercicios"
            referencedColumns: ["id"]
          },
        ]
      }
      ejercicios: {
        Row: {
          categoria: string | null
          created_at: string | null
          description: string | null
          dificultad: string | null
          duracion_minutos: number | null
          id: string
          instrucciones: string
          material_necesario: string | null
          nombre: string
          observaciones: string | null
          tipo: string | null
          variantes: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          description?: string | null
          dificultad?: string | null
          duracion_minutos?: number | null
          id?: string
          instrucciones: string
          material_necesario?: string | null
          nombre: string
          observaciones?: string | null
          tipo?: string | null
          variantes?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          description?: string | null
          dificultad?: string | null
          duracion_minutos?: number | null
          id?: string
          instrucciones?: string
          material_necesario?: string | null
          nombre?: string
          observaciones?: string | null
          tipo?: string | null
          variantes?: string | null
        }
        Relationships: []
      }
      eventos_clase: {
        Row: {
          clase_id: string | null
          es_modificacion: boolean | null
          estado: string | null
          excluir_alquiler: boolean | null
          fecha: string | null
          fecha_modificacion: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          modificado_individualmente: boolean | null
        }
        Insert: {
          clase_id?: string | null
          es_modificacion?: boolean | null
          estado?: string | null
          excluir_alquiler?: boolean | null
          fecha?: string | null
          fecha_modificacion?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          modificado_individualmente?: boolean | null
        }
        Update: {
          clase_id?: string | null
          es_modificacion?: boolean | null
          estado?: string | null
          excluir_alquiler?: boolean | null
          fecha?: string | null
          fecha_modificacion?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          modificado_individualmente?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_clase_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos_material: {
        Row: {
          cantidad: number
          categoria: string | null
          concepto: string
          created_at: string
          descripcion: string | null
          factura_url: string | null
          fecha_gasto: string
          fecha_gasto_mes: string | null
          id: number
          observaciones: string | null
          proveedor: string | null
          updated_at: string | null
        }
        Insert: {
          cantidad: number
          categoria?: string | null
          concepto: string
          created_at?: string
          descripcion?: string | null
          factura_url?: string | null
          fecha_gasto?: string
          fecha_gasto_mes?: string | null
          id?: number
          observaciones?: string | null
          proveedor?: string | null
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          categoria?: string | null
          concepto?: string
          created_at?: string
          descripcion?: string | null
          factura_url?: string | null
          fecha_gasto?: string
          fecha_gasto_mes?: string | null
          id?: number
          observaciones?: string | null
          proveedor?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      instalaciones: {
        Row: {
          capacidad: number | null
          created_at: string
          id: number
          nombre: string
          precio_hora: number | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          capacidad?: number | null
          created_at?: string
          id?: number
          nombre: string
          precio_hora?: number | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidad?: number | null
          created_at?: string
          id?: number
          nombre?: string
          precio_hora?: number | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      liberaciones_plaza: {
        Row: {
          alumno_id: string
          clase_id: string
          estado: string
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          motivo: string
        }
        Insert: {
          alumno_id: string
          clase_id: string
          estado?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          motivo: string
        }
        Update: {
          alumno_id?: string
          clase_id?: string
          estado?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "liberaciones_plaza_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liberaciones_plaza_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_profesor: {
        Row: {
          alumno_id: string | null
          cambios_aplicados: Json | null
          cambios_planificados: Json | null
          clase_id: string | null
          created_at: string | null
          estado: string | null
          fecha_creacion: string | null
          fecha_lectura: string | null
          id: string
          leida: boolean | null
          mensaje: string
          metadata: Json | null
          prioridad: string | null
          profesor: string
          tipo: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          alumno_id?: string | null
          cambios_aplicados?: Json | null
          cambios_planificados?: Json | null
          clase_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          fecha_lectura?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          metadata?: Json | null
          prioridad?: string | null
          profesor: string
          tipo: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          alumno_id?: string | null
          cambios_aplicados?: Json | null
          cambios_planificados?: Json | null
          clase_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          fecha_lectura?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          metadata?: Json | null
          prioridad?: string | null
          profesor?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_profesor_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_profesor_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          alumno_id: string | null
          cantidad: number | null
          clases_cubiertas: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_pago: string | null
          id: string
          mes_cubierto: string | null
          metodo: string | null
          tipo_pago: string | null
        }
        Insert: {
          alumno_id?: string | null
          cantidad?: number | null
          clases_cubiertas?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_pago?: string | null
          id?: string
          mes_cubierto?: string | null
          metodo?: string | null
          tipo_pago?: string | null
        }
        Update: {
          alumno_id?: string | null
          cantidad?: number | null
          clases_cubiertas?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_pago?: string | null
          id?: string
          mes_cubierto?: string | null
          metodo?: string | null
          tipo_pago?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_clases_internas: {
        Row: {
          clase_id: string
          created_at: string
          created_by: string | null
          estado: string
          fecha: string
          id: string
          notas: string | null
        }
        Insert: {
          clase_id: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha: string
          id?: string
          notas?: string | null
        }
        Update: {
          clase_id?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_clases_internas_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      profesores: {
        Row: {
          activo: boolean | null
          apellidos: string
          created_at: string | null
          direccion: string | null
          email: string
          especialidad: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nivel_experiencia: string | null
          nombre: string
          observaciones: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellidos: string
          created_at?: string | null
          direccion?: string | null
          email: string
          especialidad?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nivel_experiencia?: string | null
          nombre: string
          observaciones?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellidos?: string
          created_at?: string | null
          direccion?: string | null
          email?: string
          especialidad?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nivel_experiencia?: string | null
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recuperaciones_clase: {
        Row: {
          alumno_id: string
          clase_id: string
          created_at: string | null
          estado: string
          falta_justificada_id: string
          fecha_falta: string
          fecha_recuperacion: string | null
          id: string
          observaciones: string | null
          tipo_recuperacion: string
          updated_at: string | null
        }
        Insert: {
          alumno_id: string
          clase_id: string
          created_at?: string | null
          estado?: string
          falta_justificada_id: string
          fecha_falta: string
          fecha_recuperacion?: string | null
          id?: string
          observaciones?: string | null
          tipo_recuperacion?: string
          updated_at?: string | null
        }
        Update: {
          alumno_id?: string
          clase_id?: string
          created_at?: string | null
          estado?: string
          falta_justificada_id?: string
          fecha_falta?: string
          fecha_recuperacion?: string | null
          id?: string
          observaciones?: string | null
          tipo_recuperacion?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recuperaciones_clase_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recuperaciones_clase_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recuperaciones_clase_falta_justificada_id_fkey"
            columns: ["falta_justificada_id"]
            isOneToOne: false
            referencedRelation: "asistencias"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_alumnos: {
        Row: {
          alumno_id: string | null
          created_at: string
          fecha_seguimiento: string
          id: string
          objetivos: string | null
          profesor_id: string | null
          progreso: string | null
          tipo: string | null
        }
        Insert: {
          alumno_id?: string | null
          created_at?: string
          fecha_seguimiento: string
          id?: string
          objetivos?: string | null
          profesor_id?: string | null
          progreso?: string | null
          tipo?: string | null
        }
        Update: {
          alumno_id?: string | null
          created_at?: string
          fecha_seguimiento?: string
          id?: string
          objetivos?: string | null
          profesor_id?: string | null
          progreso?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_alumnos_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
        ]
      }
      tematicas_clase: {
        Row: {
          activa: boolean | null
          clase_id: string
          created_at: string | null
          ejercicios_asignados: number | null
          fecha_asignacion: string
          id: string
          observaciones: string | null
          profesor: string
          tematica: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          clase_id: string
          created_at?: string | null
          ejercicios_asignados?: number | null
          fecha_asignacion?: string
          id?: string
          observaciones?: string | null
          profesor: string
          tematica: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          clase_id?: string
          created_at?: string | null
          ejercicios_asignados?: number | null
          fecha_asignacion?: string
          id?: string
          observaciones?: string | null
          profesor?: string
          tematica?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tematicas_clase_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string | null
          foto_url: string | null
          id: number
          nombre: string
          rol: string
        }
        Insert: {
          created_at?: string | null
          foto_url?: string | null
          id?: number
          nombre: string
          rol?: string
        }
        Update: {
          created_at?: string | null
          foto_url?: string | null
          id?: number
          nombre?: string
          rol?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_cambios_notificacion: {
        Args: { p_cambios_aplicados?: Json; p_estado?: string; p_id: string }
        Returns: boolean
      }
      crear_notificacion_profesor:
        | {
            Args: {
              p_alumno_id?: string
              p_clase_id?: string
              p_mensaje: string
              p_metadata?: Json
              p_prioridad?: string
              p_profesor: string
              p_tipo: string
              p_titulo: string
            }
            Returns: string
          }
        | {
            Args: {
              p_alumno_id?: string
              p_cambios_aplicados?: Json
              p_cambios_planificados?: Json
              p_clase_id?: string
              p_estado?: string
              p_mensaje: string
              p_metadata?: Json
              p_prioridad?: string
              p_profesor: string
              p_tipo: string
              p_titulo: string
            }
            Returns: string
          }
      es_alumno_activo: {
        Args: { p_alumno_id: string; p_fecha_consulta?: string }
        Returns: boolean
      }
      expire_old_liberations: { Args: never; Returns: undefined }
      marcar_notificacion_leida: { Args: { p_id: string }; Returns: boolean }
      obtener_ejercicios_clase_tematica: {
        Args: { p_clase_id: string; p_tematica?: string }
        Returns: {
          duracion_minutos: number
          ejercicio_categoria: string
          ejercicio_description: string
          ejercicio_dificultad: string
          ejercicio_id: string
          ejercicio_nombre: string
          fecha_asignacion: string
          id: string
          observaciones: string
          orden_ejercicio: number
          profesor: string
          tematica: string
        }[]
      }
      obtener_notificaciones_profesor: {
        Args: { p_limit?: number; p_profesor: string }
        Returns: {
          alumno_id: string
          clase_id: string
          fecha_creacion: string
          fecha_lectura: string
          id: string
          leida: boolean
          mensaje: string
          metadata: Json
          prioridad: string
          tipo: string
          titulo: string
        }[]
      }
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
