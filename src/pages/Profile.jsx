import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getLevelName } from '../lib/workouts'
import XPBar from '../components/XPBar'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (user) fetchHistory()
  }, [user])

  async function fetchHistory() {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10)

    setHistory(data || [])
    setLoading(false)
  }

  async function signOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  const levelName = getLevelName(profile?.level || 1)
  const completedCount = history.filter(w => w.completed).length

  const typeEmojis = { push: '💪', pull: '🏋️', legs: '🦵' }
  const typeLabels = { push: 'Push', pull: 'Pull', legs: 'Legs' }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 space-y-5">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-white/40 text-sm">Tu cuenta</p>
        <h1 className="font-display text-4xl tracking-wide">PERFIL</h1>
      </div>

      {/* Avatar + Info */}
      <div className="glass rounded-3xl p-6 flex items-center gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shrink-0">
          <span className="font-display text-black text-3xl">{profile?.level || 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.email?.split('@')[0]}</p>
          <p className="text-xs text-white/40 truncate">{user?.email}</p>
          <div className="mt-1 inline-flex items-center gap-1.5 bg-brand/10 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="text-xs text-brand font-medium capitalize">{levelName}</span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      {profile && (
        <div className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-xs uppercase tracking-widest text-white/30 mb-4 font-medium">Progreso XP</p>
          <XPBar xp={profile.xp} level={profile.level} />
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        {[
          { icon: '⚡', label: 'XP Total', value: profile?.xp || 0 },
          { icon: '🔥', label: 'Racha', value: `${profile?.streak || 0}d` },
          { icon: '✅', label: 'Entrenos', value: completedCount },
        ].map(({ icon, label, value }) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="font-display text-2xl text-brand">{value}</div>
            <div className="text-[10px] text-white/40 mt-0.5 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Workout history */}
      <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-medium">Historial reciente</p>
        {loading ? (
          <p className="text-white/30 text-sm text-center py-6">Cargando...</p>
        ) : history.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-white/40 text-sm">Aún no has completado ningún entrenamiento.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((w) => {
              const dateLabel = new Date(w.date + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'short', day: 'numeric', month: 'short',
              })
              return (
                <div key={w.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeEmojis[w.type] || '🏋️'}</span>
                    <div>
                      <p className="text-sm font-medium">{typeLabels[w.type] || w.type} Day</p>
                      <p className="text-xs text-white/40 capitalize">{dateLabel}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    w.completed
                      ? 'bg-brand/15 text-brand'
                      : 'bg-white/[0.05] text-white/30'
                  }`}>
                    {w.completed ? '+20 XP' : 'Pendiente'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        disabled={signingOut}
        className="w-full glass border border-red-500/20 text-red-400 font-medium py-4 rounded-2xl text-sm active:scale-95 transition-transform disabled:opacity-50 animate-fade-up"
        style={{ animationDelay: '0.25s' }}
      >
        {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
    </div>
  )
}
