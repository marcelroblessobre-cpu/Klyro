import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Progress() {
  const { user, profile } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchWorkouts()
  }, [user])

  async function fetchWorkouts() {
    // Últimos 12 semanas
    const from = new Date()
    from.setDate(from.getDate() - 84)
    const fromStr = from.toISOString().split('T')[0]

    const { data } = await supabase
      .from('workouts')
      .select('date, completed, difficulty, xp_earned')
      .eq('user_id', user.id)
      .gte('date', fromStr)
      .order('date', { ascending: true })

    setWorkouts(data || [])
    setLoading(false)
  }

  // Construir mapa de fechas completadas
  const completedDates = new Set(
    workouts.filter(w => w.completed).map(w => w.date)
  )
  const difficultyMap = Object.fromEntries(
    workouts.filter(w => w.completed).map(w => [w.date, w.difficulty])
  )

  // Generar las últimas 12 semanas (84 días)
  const today = new Date()
  const days = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }

  // Agrupar por semanas
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const totalCompleted = completedDates.size
  const thisWeek = days.slice(-7).filter(d => completedDates.has(d)).length
  const bestStreak = profile?.streak || 0

  function cellColor(date) {
    if (!completedDates.has(date)) return 'bg-white/[0.05]'
    const diff = difficultyMap[date]
    if (diff === 'hard') return 'bg-brand'
    if (diff === 'normal') return 'bg-brand/70'
    return 'bg-brand/40'
  }

  const monthLabels = []
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0] + 'T12:00:00')
    if (firstDay.getDate() <= 7) {
      monthLabels[wi] = firstDay.toLocaleDateString('es-ES', { month: 'short' })
    } else {
      monthLabels[wi] = ''
    }
  })

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-white/40 text-sm">Tu historial</p>
        <h1 className="font-display text-4xl tracking-wide">PROGRESO</h1>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {[
          { label: 'Esta semana', value: `${thisWeek}/7` },
          { label: 'Total entrenos', value: totalCompleted },
          { label: 'Mejor racha', value: `${bestStreak}🔥` },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <div className="font-display text-2xl text-brand">{value}</div>
            <div className="text-[10px] text-white/40 mt-1 font-medium leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Calendario heatmap */}
      <div className="glass rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">
          Últimas 12 semanas
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Etiquetas de mes */}
            <div className="flex gap-1.5 mb-1">
              {weeks.map((_, wi) => (
                <div key={wi} className="w-7 text-[9px] text-white/30 text-center">
                  {monthLabels[wi]}
                </div>
              ))}
            </div>

            {/* Grid de semanas × días */}
            <div className="flex gap-1.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5">
                  {week.map(date => (
                    <div
                      key={date}
                      className={`w-7 h-7 rounded-md transition-all ${cellColor(date)} ${
                        date === today.toISOString().split('T')[0]
                          ? 'ring-1 ring-brand ring-offset-1 ring-offset-surface-card'
                          : ''
                      }`}
                      title={date}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-3 mt-4 justify-end">
              <span className="text-[10px] text-white/30">Menos</span>
              <div className="flex gap-1">
                {['bg-white/[0.05]', 'bg-brand/40', 'bg-brand/70', 'bg-brand'].map(c => (
                  <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
                ))}
              </div>
              <span className="text-[10px] text-white/30">Más</span>
            </div>
          </>
        )}
      </div>

      {/* Semana actual detalle */}
      <div className="glass rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">Esta semana</p>
        <div className="flex justify-between gap-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayLabel, i) => {
            const d = new Date()
            const currentDay = d.getDay() === 0 ? 6 : d.getDay() - 1
            const diff = i - currentDay
            const date = new Date(d)
            date.setDate(d.getDate() + diff)
            const dateStr = date.toISOString().split('T')[0]
            const done = completedDates.has(dateStr)
            const isToday = diff === 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-white/30'}`}>
                  {dayLabel}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? 'bg-brand text-black'
                    : isToday
                    ? 'bg-white/[0.08] text-white border border-brand/40'
                    : 'bg-white/[0.04] text-white/20'
                }`}>
                  {done ? '✓' : date.getDate()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* XP por semana últimas 4 */}
      <div className="glass rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">XP por semana</p>
        {[3, 2, 1, 0].map(weeksAgo => {
          const start = new Date()
          start.setDate(start.getDate() - (weeksAgo * 7 + 6))
          const end = new Date()
          end.setDate(end.getDate() - weeksAgo * 7)
          const startStr = start.toISOString().split('T')[0]
          const endStr = end.toISOString().split('T')[0]
          const weekXP = workouts
            .filter(w => w.completed && w.date >= startStr && w.date <= endStr)
            .reduce((sum, w) => sum + (w.xp_earned || 20), 0)
          const maxXP = 7 * 20
          const pct = Math.min((weekXP / maxXP) * 100, 100)
          const label = weeksAgo === 0 ? 'Esta semana' : `Hace ${weeksAgo} sem.`
          return (
            <div key={weeksAgo} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-xs text-white/40 w-20 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-brand font-bold w-12 text-right">{weekXP} XP</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
