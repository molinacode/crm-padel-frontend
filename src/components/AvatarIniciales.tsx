function inicialesDe(nombre?: string | null) {
  const partes = String(nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letras = `${partes[0]?.[0] || ''}${partes[1]?.[0] || ''}`;
  return (letras || '?').toUpperCase();
}

interface AvatarInicialesProps {
  nombre?: string | null;
  fotoUrl?: string | null;
  className?: string;
  textoClassName?: string;
}

export default function AvatarIniciales({
  nombre,
  fotoUrl,
  className = '',
  textoClassName = 'text-2xl',
}: AvatarInicialesProps) {
  if (fotoUrl) {
    return <img src={fotoUrl} alt={nombre || ''} className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center bg-slate-800 text-amber-200 font-semibold ${className}`}
      aria-label={nombre || 'Sin foto'}
    >
      <span className={textoClassName}>{inicialesDe(nombre)}</span>
    </div>
  );
}
