type BadgeVariant = 'open' | 'closed' | 'paid' | 'unpaid' | 'pending' | 'failed' | 'A' | 'B' | 'C' | 'worker' | 'foreman';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
  paid: 'bg-[#fff3d4] text-[#d4780e]',
  unpaid: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-700',
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  worker: 'bg-[#f5e8d8] text-[#7a4528]',
  foreman: 'bg-[#2c1810] text-[#e8c9a8]',
};

const LABELS: Partial<Record<BadgeVariant, string>> = {
  open: 'Abierto',
  closed: 'Cerrado',
  paid: 'Pagado',
  unpaid: 'Sin pagar',
  pending: 'Pendiente',
  failed: 'Fallido',
  worker: 'Trabajador',
  foreman: 'Capataz',
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export function Badge({ variant, label }: BadgeProps) {
  const displayLabel = label ?? LABELS[variant] ?? variant;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANT_CLASSES[variant] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {displayLabel}
    </span>
  );
}
