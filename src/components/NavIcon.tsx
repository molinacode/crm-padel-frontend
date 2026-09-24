import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CircleCheck,
  Dumbbell,
  GraduationCap,
  LayoutGrid,
  Receipt,
  Users,
  Boxes,
  type LucideIcon,
} from 'lucide-react';

export type NavIconName =
  | 'hoy'
  | 'alumnos'
  | 'clases'
  | 'asistencia'
  | 'pagos'
  | 'profesores'
  | 'grupos'
  | 'ejercicios'
  | 'instalaciones'
  | 'avisos'
  | 'reportes';

const icons: Record<NavIconName, LucideIcon> = {
  hoy: CalendarDays,
  alumnos: Users,
  clases: LayoutGrid,
  asistencia: CircleCheck,
  pagos: Receipt,
  profesores: GraduationCap,
  grupos: Boxes,
  ejercicios: Dumbbell,
  instalaciones: Building2,
  avisos: Bell,
  reportes: BarChart3,
};

export default function NavIcon({
  name,
  className = 'h-5 w-5 shrink-0',
}: {
  name: NavIconName;
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon className={className} strokeWidth={1.5} aria-hidden='true' />;
}
