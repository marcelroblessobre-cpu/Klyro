// workouts.js — Lógica de sugerencias y XP
// Ya NO genera rutinas fijas. Lee las rutinas reales del usuario desde Supabase.

// ─── XP y niveles ─────────────────────────────────────────────────────────────

export function getProgress(xp, level) {
  const levelStart = (level - 1) * 100
  const levelEnd = level * 100
  const current = xp - levelStart
  const needed = levelEnd - levelStart
  return Math.min((current / needed) * 100, 100)
}

export function getLevelName(level) {
  if (level <= 2) return 'Principiante'
  if (level <= 5) return 'Intermedio'
  return 'Avanzado'
}

// ─── Sugerencia inteligente (lógica simple, sin IA) ──────────────────────────

/**
 * Devuelve un mensaje de sugerencia basado en el estado del usuario.
 * @param {number} streak - días consecutivos
 * @param {string|null} lastDifficulty - 'easy' | 'normal' | 'hard' | null
 * @param {number} workoutsThisWeek - entrenos completados esta semana
 * @returns {{ message: string, tone: 'positive' | 'warning' | 'neutral' }}
 */
export function getSuggestion(streak, lastDifficulty, workoutsThisWeek) {
  if (streak === 0) {
    return { message: 'Buen momento para retomar el ritmo 💪', tone: 'neutral' }
  }
  if (workoutsThisWeek >= 6) {
    return { message: 'Llevas muchos días seguidos — considera descansar hoy', tone: 'warning' }
  }
  if (streak >= 5 && lastDifficulty === 'hard') {
    return { message: 'Reduce intensidad: llevas una buena racha exigiéndote', tone: 'warning' }
  }
  if (streak >= 3) {
    return { message: `Buena consistencia — ${streak} días seguidos 🔥`, tone: 'positive' }
  }
  if (lastDifficulty === 'easy') {
    return { message: 'Ayer fue suave — puedes subir un poco la intensidad', tone: 'neutral' }
  }
  return { message: 'Sesión normal — a por ello', tone: 'neutral' }
}

// ─── Decidir qué rutina toca hoy ──────────────────────────────────────────────

/**
 * Dado el listado de rutinas activas y el último routine_id completado,
 * devuelve la rutina que toca hoy.
 */
export function getTodayRoutine(routines, lastRoutineId) {
  if (!routines || routines.length === 0) return null
  const sorted = [...routines].sort((a, b) => a.day_order - b.day_order)
  if (!lastRoutineId) return sorted[0]
  const lastIndex = sorted.findIndex(r => r.id === lastRoutineId)
  if (lastIndex === -1) return sorted[0]
  const nextIndex = (lastIndex + 1) % sorted.length
  return sorted[nextIndex]
}
