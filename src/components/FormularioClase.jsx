import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function FormularioClase({ clase, onSuccess }) {
  const [datos, setDatos] = useState({
    nombre: '',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
    nivel_clase: 'Iniciación (1)',
    profesor: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_clase: 'grupal' // 'grupal' o 'particular'
  });

  useEffect(() => {
    if (clase) setDatos(clase);
  }, [clase]);

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...datos };
    
    let claseGuardada;
    let claseError;

    if (clase) {
      
      const { error } = await supabase
        .from('clases')
        .update(payload)
        .eq('id', clase.id);
      claseError = error;
      claseGuardada = { ...clase, ...payload };
    } else {
      const { data: claseData, error } = await supabase
        .from('clases')
        .insert([payload])
        .select();
      claseError = error;
      claseGuardada = claseData?.[0] || null;
    }
     if(claseError){
      alert('❌ Error al guardar clase');
      console.error('Error supabase:',claseError);
      return;
    }

    // Si es nueva clase o cambian fechas, genera eventos
    if (!clase || clase.fecha_inicio !== datos.fecha_inicio || clase.fecha_fin !== datos.fecha_fin) {
      if (claseGuardada) {
        const eventosGenerados = await generarEventos(claseGuardada);
        if (!eventosGenerados) {
          alert('⚠️ Clase guardada pero hubo problemas generando algunos eventos');
          onSuccess();
          return;
        }
      } else {
        console.error('❌ No se pudo obtener la clase guardada');
        alert('❌ Error: No se pudo obtener la clase guardada');
        return;
       }
    }

    alert('✅ Clase guardada correctamente');
    onSuccess();
  };
  const generarEventos = async (claseGuardada) => {
    try {
      const eventos = [];
      let fecha = new Date(claseGuardada.fecha_inicio);
      const fin = new Date(claseGuardada.fecha_fin);

      const dias = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
      const diaSemana = dias[claseGuardada.dia_semana];

      while (fecha <= fin) {
        if (fecha.getDay() === diaSemana) {
          eventos.push({
            clase_id: claseGuardada.id,
            fecha: fecha.toISOString().split('T')[0],
            hora_inicio: claseGuardada.hora_inicio,
            hora_fin: claseGuardada.hora_fin
          });
        }
        fecha.setDate(fecha.getDate() + 1);
      }

      const { error } = await supabase.from('eventos_clase').insert(eventos);
      if (error) {
        console.error('Error generando eventos:', error);
        alert('❌ Error al crear los eventos de la clase');
        return false;
      }
      
      console.log(`✅ Se generaron ${eventos.length} eventos para la clase`);
      return true;
    } catch (error) {
      console.error('Error inesperado generando eventos:', error);
      alert('❌ Error inesperado al crear los eventos');
      return false;
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-lg font-semibold">
        {clase ? '✏️ Editar Clase' : '➕ Nueva Clase'}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre *</label>
        <input
          type="text"
          name="nombre"
          value={datos.nombre}
          onChange={handleChange}
          required
          className="input w-full"
          placeholder="Grupo Avanzado"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Día *</label>
        <select name="dia_semana" value={datos.dia_semana} onChange={handleChange} required className="input w-full">
          <option value="">Selecciona un día</option>
          <option value="Lunes">Lunes</option>
          <option value="Martes">Martes</option>
          <option value="Miércoles">Miércoles</option>
          <option value="Jueves">Jueves</option>
          <option value="Viernes">Viernes</option>
          <option value="Sábado">Sábado</option>
          <option value="Domingo">Domingo</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Hora inicio *</label>
          <input
            type="time"
            name="hora_inicio"
            value={datos.hora_inicio}
            onChange={handleChange}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hora fin *</label>
          <input
            type="time"
            name="hora_fin"
            value={datos.hora_fin}
            onChange={handleChange}
            required
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nivel *</label>
          <select name="nivel_clase" value={datos.nivel_clase} onChange={handleChange} className="input w-full">
                    <option value="Iniciación (1)">Iniciación (1)</option>
                    <option value="Iniciación (2)">Iniciación (2)</option>
                    <option value="Medio (3)">Medio (3)</option>
                    <option value="Medio (4)">Medio (4)</option>
                    <option value="Avanzado (5)">Avanzado (5)</option>
                    <option value="Infantil (1)">Infantil (1)</option>
                    <option value="Infantil (2)">Infantil (2)</option>
                    <option value="Infantil (3)">Infantil (3)</option>
          
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Clase *</label>
          <select name="tipo_clase" value={datos.tipo_clase} onChange={handleChange} className="input w-full">
            <option value="grupal">👥 Clase Grupal (hasta 4 alumnos)</option>
            <option value="particular">🎯 Clase Particular (1 alumno)</option>
          </select>
        </div>
      </div>
       <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label>Fecha inicio *</label>
          <input type="date" name="fecha_inicio" value={datos.fecha_inicio} onChange={handleChange} required className="input w-full" />
        </div>
        <div>
          <label>Fecha fin *</label>
          <input type="date" name="fecha_fin" value={datos.fecha_fin} onChange={handleChange} required className="input w-full" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Profesor</label>
        <input
          type="text"
          name="profesor"
          value={datos.profesor}
          onChange={handleChange}
          className="input w-full"
          placeholder="Vivi"
        />
      </div>

      <button type="submit" className="btn-primary">
        {clase ? 'Actualizar' : 'Crear'} Clase
      </button>
    </form>
  );
}