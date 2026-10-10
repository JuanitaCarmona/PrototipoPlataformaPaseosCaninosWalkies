export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export function petNameFromJoin(
  pets?: { name: string } | { name: string }[] | null,
): string {
  if (!pets) return 'Mascota';
  if (Array.isArray(pets)) return pets[0]?.name ?? 'Mascota';
  return pets.name ?? 'Mascota';
}

export function profileFromJoin<T extends Record<string, unknown>>(
  profiles?: T | T[] | null,
): T | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
}

export function estimateWalkPrice(
  hourlyRate: number | null | undefined,
  durationMinutes: number,
): number | null {
  if (hourlyRate == null) return null;
  return Math.round(Number(hourlyRate) * (durationMinutes / 60));
}

export function walkerDisplayName(name?: string | null): string | null {
  const n = name?.trim();
  if (!n) return null;
  if (n.toLowerCase() === 'paseador') return null;
  return n;
}

export function walkElapsedLabel(startedAt: string | null | undefined, nowMs: number): string {
  if (!startedAt) return '00:00';
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return '00:00';
  const ms = Math.max(0, nowMs - start);
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
