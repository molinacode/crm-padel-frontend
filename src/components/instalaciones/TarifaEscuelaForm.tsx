import { useState } from 'react';
import type { FormEvent } from 'react';
import { precioEscuelaEnFecha, type TarifaEscuela } from '../../utils/tarifaEscuela';

function hoyIso() {
  const hoy = new Date();
  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, '0'),
    String(hoy.getDate()).padStart(2, '0'),
  ].join('-');
}

interface TarifaEscuelaFormProps {
  tarifas: TarifaEscuela[];
  error?: string;
  onGuardar: (importe: number, vigenteDesde: string) => Promise<void>;
}

export default function TarifaEscuelaForm({ tarifas, error, onGuardar }: TarifaEscuelaFormProps) {
  const [importe, setImporte] = useState('21');
  const [vigenteDesde, setVigenteDesde] = useState(hoyIso);
  const [aviso, setAviso] = useState('');
  const precioHoy = precioEscuelaEnFecha(tarifas, hoyIso());

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAviso('');
    try {
      await onGuardar(Number(importe), vigenteDesde);
      setAviso(`Desde ${vigenteDesde} cada clase de escuela cuenta ${importe} €. Los días anteriores no cambian.`);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'No se pudo guardar');
    }
  };

  return (
    <form onSubmit={onSubmit} className='flex flex-wrap items-end gap-3 rounded-lg border border-[#2a332c] px-4 py-3'>
      <div>
        <p className='text-sm text-[#8c8678]'>Alquiler escuela hoy</p>
        <p className='text-lg font-semibold text-[#f5f1e8]'>{precioHoy} €</p>
      </div>
      <label className='text-sm text-[#d8d2c4]'>
        Nuevo importe
        <input
          type='number'
          min='0'
          step='0.01'
          value={importe}
          onChange={event => setImporte(event.target.value)}
          className='mt-1 block w-28 rounded-lg border border-[#2a332c] bg-[#121810] px-3 py-2'
        />
      </label>
      <label className='text-sm text-[#d8d2c4]'>
        Vigente desde
        <input
          type='date'
          min={hoyIso()}
          value={vigenteDesde}
          onChange={event => setVigenteDesde(event.target.value)}
          className='mt-1 block rounded-lg border border-[#2a332c] bg-[#121810] px-3 py-2'
        />
      </label>
      <button type='submit' className='rounded-lg bg-[#c9a658] px-4 py-2 font-semibold text-[#0e1410]'>
        Guardar precio
      </button>
      {(aviso || error) && <p className='w-full text-sm text-[#d8d2c4]'>{aviso || error}</p>}
    </form>
  );
}
