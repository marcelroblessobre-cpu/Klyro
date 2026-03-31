import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getTodayRoutine, getSuggestion } from '../lib/workouts'
import XPBar from '../components/XPBar'
import StatCard from '../components/StatCard'
import CelebrationModal from '../components/CelebrationModal'
import StreakBrokenModal from '../components/StreakBrokenModal'
import { requestNotifications, scheduleDailyReminder } from '../hooks/usePWA'

const SUGGESTION_COLORS = {
  positive: 'bg-brand/10 border-brand/20 text-brand',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  neutral: 'bg-white/[0.04] border-white/[0.08] text-white/50',
}

export default function Home() {
  const { user, profile, refreshProfile } = useAuth()
  const [routine, setRoutine] = useState(null)
  const [todayWorkout, setTodayWorkout] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [celebration, setCelebration] = useState(null)  // { xpEarned, newStreak, newLevel, prevLevel }
  const [streakBroken, setStreakBroken] = useState(null) // previous streak value
  const [noRoutines, setNoRoutines] = useState(false)
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState('normal')
  const [notifAsked, setNotifAsked] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (profile) load()
  }, [profile])

  // Mostrar prompt de notificaciones la primera vez
  useEffect(() => {
    if (!profile) return
    const asked = localStorage.getItem('klyro_notif_asked')
    if (!asked && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => setNotifAsked(true), 3000)
    }
  }, [profile])

  async function load() {
    setLoading(true)

    const { data: routines } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('day_order', { ascending: true })

    if (!routines || routines.length === 0) {
      setNoRoutines(true)
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      setTodayWorkout(existing)
      const r = routines.find(r => r.id === existing.routine_id) || routines[0]
      setRoutine(r)
    } else {
      const { data: lastWorkout } = await supabase
        .from('workouts')
        .select('routine_id')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      const todayRoutine = getTodayRoutine(routines, lastWorkout?.routine_id || null)
      setRoutine(todayRoutine)

      const { data: inserted } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          date: today,
          routine_id: todayRoutine.id,
          completed: false,
          xp_earned: 20,
        })
        .select()
        .maybeSingle()

      setTodayWorkout(inserted)

      // Detectar racha rota: si ayer no entrenó y tenía racha > 1
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const { data: yWorkout } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', yesterdayStr)
        .eq('completed', true)
        .maybeSingle()

      if (!yWorkout && profile.streak > 1) {
        const brokenKey = `klyro_streak_broken_${today}`
        if (!localStorage.getItem(brokenKey)) {
          localStorage.setItem(brokenKey, '1')
          setStreakBroken(profile.streak)
        }
      }
    }

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    const weekStr = weekStart.toISOString().split('T')[0]

    const { data: weekWorkouts } = await supabase
      .from('workouts')
      .select('difficulty')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', weekStr)

    const { data: lastCompleted } = await supabase
      .from('workouts')
      .select('difficulty')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    setSuggestion(getSuggestion(
      profile.streak,
      lastCompleted?.difficulty || null,
      weekWorkouts?.length || 0
    ))

    setLoading(false)
  }

  async function completeWorkout() {
    if (!todayWorkout || todayWorkout.completed || completing) return
    setCompleting(true)

    await supabase
      .from('workouts')
      .update({ completed: true, difficulty, xp_earned: 20 })
      .eq('id', todayWorkout.id)

    const prevLevel = profile.level
    const newXP = profile.xp + 20
    const newLevel = Math.floor(newXP / 100) + 1

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yWorkout } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', yesterdayStr)
      .eq('completed', true)
      .maybeSingle()

    const newStreak = yWorkout ? profile.streak + 1 : 1

    await supabase
      .from('users')
      .update({ xp: newXP, level: newLevel, streak: newStreak })
      .eq('id', user.id)

    await refreshProfile()
    setTodayWorkout(prev => ({ ...prev, completed: true }))
    setCelebration({ xpEarned: 20, newStreak, newLevel, prevLevel })
    setCompleting(false)
  }

  async function handleEnableNotifications() {
    localStorage.setItem('klyro_notif_asked', '1')
    setNotifAsked(false)
    const granted = await requestNotifications()
    if (granted) scheduleDailyReminder(9)
  }

  const isCompleted = todayWorkout?.completed
  const dayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' })

  if (!loading && noRoutines) {
    return (
      <div className="min-h-screen pb-24 px-5 pt-8 flex flex-col items-center justify-center gap-6 text-center">
        <div className="text-6xl">🏋️</div>
        <div>
          <h2 className="font-display text-3xl tracking-wide mb-2">Sin rutina aún</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Crea tu primera rutina para que Klyro sepa qué toca cada día.
          </p>
        </div>
        <Link to="/my-routine" className="bg-brand text-black font-bold px-8 py-4 rounded-2xl text-sm tracking-wide">
          CREAR MI RUTINA →
        </Link>
      </div>
    )
  }

  if (loading || !routine) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 space-y-5">

      {/* Modales */}
      {celebration && (
        <CelebrationModal
          xpEarned={celebration.xpEarned}
          newStreak={celebration.newStreak}
          newLevel={celebration.newLevel}
          prevLevel={celebration.prevLevel}
          onClose={() => setCelebration(null)}
        />
      )}
      {streakBroken && (
        <StreakBrokenModal
          lostStreak={streakBroken}
          onClose={() => setStreakBroken(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <p className="text-white/40 text-sm capitalize">{dayName}</p>
          <h1 className="font-display text-4xl tracking-wide text-white">KLYRO</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
          <span className="font-display text-black text-lg">{profile?.level || 1}</span>
        </div>
      </div>

      {/* Prompt notificaciones */}
      {notifAsked && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-brand/20 animate-fade-up">
          <span className="text-2xl shrink-0">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Activar recordatorio diario</p>
            <p className="text-xs text-white/40">Te avisamos cada mañana para no romper la racha</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { localStorage.setItem('klyro_notif_asked', '1'); setNotifAsked(false) }}
              className="text-xs text-white/30 px-2 py-1"
            >
              No
            </button>
            <button
              onClick={handleEnableNotifications}
              className="text-xs bg-brand text-black font-bold px-3 py-1.5 rounded-lg"
            >
              Sí
            </button>
          </div>
        </div>
      )}

      {/* XP Bar */}
      {profile && (
        <div className="glass rounded-2xl p-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <XPBar xp={profile.xp} level={profile.level} />
          <div className="mt-3 text-center">
            <span className="font-display text-3xl text-brand">{profile.xp}</span>
            <span className="text-white/40 text-sm ml-1">XP total</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <StatCard icon="🔥" label="Racha" value={`${profile?.streak || 0}d`} accent />
        <StatCard icon="⚡" label="XP hoy" value={isCompleted ? '+20' : '—'} />
        <StatCard icon="🏆" label="Nivel" value={profile?.level || 1} />
      </div>

      {/* Sugerencia */}
      {suggestion && (
        <div className={`rounded-2xl px-4 py-3 border text-sm font-medium animate-fade-up ${SUGGESTION_COLORS[suggestion.tone]}`}
          style={{ animationDelay: '0.12s' }}>
          {suggestion.message}
        </div>
      )}

      {/* Tarjeta de hoy */}
      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-medium">Hoy toca</p>
        <div className={`rounded-3xl p-6 relative overflow-hidden border transition-all duration-500 ${
          isCompleted ? 'border-brand/40 bg-brand/5' : 'border-white/[0.08] bg-surface-card'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl transition-all duration-500 ${
            isCompleted ? 'bg-brand/15' : 'bg-white/[0.02]'
          }`} />
          <div className="relative">
            <h2 className="font-display text-4xl tracking-wide leading-tight mb-2">
              {routine.name.toUpperCase()}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs bg-white/[0.06] rounded-full px-3 py-1.5 text-white/60">
                ⏱ {routine.estimated_minutes} min
              </span>
              <span className="text-xs bg-white/[0.06] rounded-full px-3 py-1.5 text-white/60">
                {routine.exercises.length} ejercicios
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de ejercicios */}
      <div className="glass rounded-3xl p-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">Ejercicios</p>
        <div className="space-y-3">
          {routine.exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                isCompleted ? 'bg-brand text-black' : 'bg-white/[0.08] text-white/40'
              }`}>
                {isCompleted ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium">{ex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dificultad */}
      {!isCompleted && (
        <div className="glass rounded-2xl p-4 animate-fade-up" style={{ animationDelay: '0.22s' }}>
          <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-medium">¿Cómo fue la sesión?</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'easy', label: 'Suave' },
              { value: 'normal', label: 'Normal' },
              { value: 'hard', label: 'Duro' },
            ].map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                  difficulty === d.value ? 'bg-brand text-black' : 'bg-white/[0.05] text-white/50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botón completar */}
      {!isCompleted ? (
        <button
          onClick={completeWorkout}
          disabled={completing}
          className="w-full bg-brand text-black font-bold text-lg py-5 rounded-2xl tracking-wide active:scale-95 transition-all duration-200 disabled:opacity-60 glow animate-fade-up"
          style={{ animationDelay: '0.25s' }}
        >
          {completing ? '⏳ GUARDANDO...' : '✅ COMPLETAR ENTRENAMIENTO'}
        </button>
      ) : (
        <div className="w-full border-2 border-brand/40 text-brand font-bold text-lg py-5 rounded-2xl tracking-wide text-center animate-pop">
          ✅ COMPLETADO HOY
        </div>
      )}
    </div>
  )
}
