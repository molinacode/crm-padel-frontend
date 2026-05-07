import { supabase } from '../lib/supabase';

export interface TablaDiagnosticoInfo {
  existe: boolean;
  registros: number;
}

export interface CampoDiagnosticoInfo {
  existe: boolean;
}

export interface ResultadosDiagnostico {
  tablas: Record<string, TablaDiagnosticoInfo>;
  campos: Record<string, CampoDiagnosticoInfo>;
  errores: string[];
  advertencias: string[];
}

export const diagnosticarBaseDeDatos =
  async (): Promise<ResultadosDiagnostico> => {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DE LA BASE DE DATOS...');

    const resultados: ResultadosDiagnostico = {
      tablas: {},
      campos: {},
      errores: [],
      advertencias: [],
    };

    try {
      console.log('📋 Verificando tablas principales...');

      const tablas = [
        'alumnos',
        'profesores',
        'clases',
        'eventos_clase',
        'alumnos_clases',
        'pagos',
        'asistencias',
        'gastos_material',
      ] as const;

      for (const tabla of tablas) {
        try {
          const { error, count } = await supabase
            .from(tabla)
            .select('*', { count: 'exact', head: true });

          if (error) {
            resultados.errores.push(
              `❌ Error en tabla ${tabla}: ${error.message}`
            );
            console.error(`❌ Error en tabla ${tabla}:`, error);
          } else {
            resultados.tablas[tabla] = {
              existe: true,
              registros: count ?? 0,
            };
            console.log(`✅ Tabla ${tabla}: ${count ?? 0} registros`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          resultados.errores.push(`❌ Excepción en tabla ${tabla}: ${msg}`);
          console.error(`❌ Excepción en tabla ${tabla}:`, err);
        }
      }

      console.log('🔍 Verificando campos específicos...');

      try {
        const { error } = await supabase
          .from('alumnos_clases')
          .select('origen')
          .limit(1);

        if (error && error.code === '42703') {
          resultados.advertencias.push(
            '⚠️ Campo "origen" no existe en alumnos_clases'
          );
          console.warn('⚠️ Campo "origen" no existe en alumnos_clases');
        } else if (error) {
          resultados.errores.push(
            `❌ Error verificando campo origen: ${error.message}`
          );
        } else {
          resultados.campos.origen = { existe: true };
          console.log('✅ Campo "origen" existe en alumnos_clases');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resultados.errores.push(`❌ Excepción verificando origen: ${msg}`);
      }

      try {
        const { error } = await supabase
          .from('eventos_clase')
          .select('modificado_individualmente, fecha_modificacion')
          .limit(1);

        if (error && error.code === '42703') {
          resultados.advertencias.push(
            '⚠️ Campos de modificación no existen en eventos_clase'
          );
          console.warn('⚠️ Campos de modificación no existen en eventos_clase');
        } else if (error) {
          resultados.errores.push(
            `❌ Error verificando campos de modificación: ${error.message}`
          );
        } else {
          resultados.campos.modificacion = { existe: true };
          console.log('✅ Campos de modificación existen en eventos_clase');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resultados.errores.push(
          `❌ Excepción verificando campos de modificación: ${msg}`
        );
      }

      console.log('🔍 Verificando consultas específicas...');

      try {
        const { data, error } = await supabase
          .from('eventos_clase')
          .select(
            `
          id,
          fecha,
          estado,
          clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
        `
          )
          .neq('estado', 'eliminado')
          .limit(5);

        if (error) {
          resultados.errores.push(
            `❌ Error en consulta de eventos: ${error.message}`
          );
          console.error('❌ Error en consulta de eventos:', error);
        } else {
          console.log(
            `✅ Consulta de eventos exitosa: ${data?.length ?? 0} eventos`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resultados.errores.push(`❌ Excepción en consulta de eventos: ${msg}`);
      }

      try {
        const { data, error } = await supabase
          .from('alumnos_clases')
          .select('clase_id, alumno_id, alumnos (nombre)')
          .limit(5);

        if (error) {
          resultados.errores.push(
            `❌ Error en consulta de asignaciones: ${error.message}`
          );
          console.error('❌ Error en consulta de asignaciones:', error);
        } else {
          console.log(
            `✅ Consulta de asignaciones exitosa: ${data?.length ?? 0} asignaciones`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        resultados.errores.push(
          `❌ Excepción en consulta de asignaciones: ${msg}`
        );
      }

      console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
      console.log('================================');

      if (resultados.errores.length === 0) {
        console.log('✅ No se encontraron errores críticos');
      } else {
        console.log(`❌ ${resultados.errores.length} errores encontrados:`);
        resultados.errores.forEach(e => console.log(`   ${e}`));
      }

      if (resultados.advertencias.length > 0) {
        console.log(`⚠️ ${resultados.advertencias.length} advertencias:`);
        resultados.advertencias.forEach(w => console.log(`   ${w}`));
      }

      console.log('\n📋 Estado de las tablas:');
      Object.entries(resultados.tablas).forEach(([tabla, info]) => {
        console.log(
          `   ${tabla}: ${info.existe ? '✅' : '❌'} (${info.registros} registros)`
        );
      });

      console.log('\n🔍 Estado de los campos:');
      Object.entries(resultados.campos).forEach(([campo, info]) => {
        console.log(`   ${campo}: ${info.existe ? '✅' : '❌'}`);
      });

      return resultados;
    } catch (err: unknown) {
      console.error('💥 Error fatal en diagnóstico:', err);
      const msg = err instanceof Error ? err.message : String(err);
      resultados.errores.push(`💥 Error fatal: ${msg}`);
      return resultados;
    }
  };

export const probarConsultasPaginas = async (): Promise<void> => {
  console.log('🧪 PROBANDO CONSULTAS DE CADA PÁGINA...');

  console.log('\n📊 Probando consulta de Dashboard...');
  try {
    const { data, error } = await supabase
      .from('eventos_clase')
      .select(
        `
        id,
        fecha,
        estado,
        clase_id,
        clases (id, nombre, tipo_clase, nivel_clase, dia_semana)
      `
      )
      .neq('estado', 'eliminado');

    if (error) {
      console.error('❌ Error en consulta Dashboard:', error);
    } else {
      console.log(`✅ Dashboard: ${data?.length ?? 0} eventos`);
    }
  } catch (err) {
    console.error('❌ Excepción Dashboard:', err);
  }

  console.log('\n📋 Probando consulta de Asistencias...');
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('eventos_clase')
      .select(
        `
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        clases (id, nombre, nivel_clase, tipo_clase, profesor)
      `
      )
      .eq('fecha', hoy)
      .neq('estado', 'eliminado')
      .neq('estado', 'cancelada');

    if (error) {
      console.error('❌ Error en consulta Asistencias:', error);
    } else {
      console.log(`✅ Asistencias: ${data?.length ?? 0} eventos para hoy`);
    }
  } catch (err) {
    console.error('❌ Excepción Asistencias:', err);
  }

  console.log('\n🏢 Probando consulta de Instalaciones...');
  try {
    const { data, error } = await supabase
      .from('eventos_clase')
      .select(
        `
        id,
        fecha,
        estado,
        clases (
          id,
          nombre,
          tipo_clase
        )
      `
      )
      .order('fecha', { ascending: true });

    if (error) {
      console.error('❌ Error en consulta Instalaciones:', error);
    } else {
      console.log(`✅ Instalaciones: ${data?.length ?? 0} eventos`);
    }
  } catch (err) {
    console.error('❌ Excepción Instalaciones:', err);
  }

  console.log('\n👨‍🏫 Probando consulta de Profesores...');
  try {
    const { data, error } = await supabase
      .from('profesores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('❌ Error en consulta Profesores:', error);
    } else {
      console.log(`✅ Profesores: ${data?.length ?? 0} profesores`);
    }
  } catch (err) {
    console.error('❌ Excepción Profesores:', err);
  }
};
