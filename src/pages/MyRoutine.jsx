import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MyRoutine() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // routine object being edited
  const [creating, setCreating] = useState(false) // mostrar form de crear

  useEffect(() => {
    if (user) fetchRoutines()
  }, [user])

  async function fetchRoutines() {
    const { data } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('day_order', { ascending: true })
    setRoutines(data || [])
    setLoading(false)
  }

  async function deleteRoutine(id) {
    // Soft delete: marcamos is_active = false
    await supabase.from('routines').update({ is_active: false }).eq('id', id)
    setRoutines(prev => prev.filter(r => r.id !== id))
  }

  async function moveRoutine(index, direction) {
    const newList = [...routines]
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= newList.length) return

    // Swap day_order values
    const a = newList[index]
    const b = newList[swapIndex]
    ;[newList[index], newList[swapIndex]] = [b, a]

    // Update day_order in DB
    await Promise.all([
      supabase.from('routines').update({ day_order: index }).eq('id', b.id),
      supabase.from('routines').update({ day_order: swapIndex }).eq('id', a.id),
    ])
    setRoutines(newList)
  }

  function onSaved(savedRoutine, isNew) {
    if (isNew) {
      setRoutines(prev => [...prev, savedRoutine])
    } else {
      setRoutines(prev => prev.map(r => r.id === savedRoutine.id ? savedRoutine : r))
    }
    setEditing(null)
    setCreating(false)
  }

  // ── Vista: formulario de edición/creación ──────────────────────────────────
  if (editing || creating) {
    return (
      <RoutineForm
        userId={user.id}
        routine={editing}
        dayOrder={routines.length}
        onSaved={onSaved}
        onCancel={() => { setEditing(null); setCreating(false) }}
      />
    )
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <p className="text-white/40 text-sm">Tu programa</p>
          <h1 className="font-display text-4xl tracking-wide">MI RUTINA</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-black font-bold text-xl active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {/* Explicación */}
      <p className="text-white/40 text-sm leading-relaxed animate-fade-up" style={{ animationDelay: '0.05s' }}>
        Añade los días de tu semana. Klyro rotará entre ellos automáticamente.
      </p>

      {/* Lista de rutinas */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      ) : routines.length === 0 ? (
        <EmptyState onAdd={() => setCreating(true)} />
      ) : (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {routines.map((r, i) => (
            <RoutineCard
              key={r.id}
              routine={r}
              index={i}
              total={routines.length}
              onEdit={() => setEditing(r)}
              onDelete={() => deleteRoutine(r.id)}
              onMove={(dir) => moveRoutine(i, dir)}
            />
          ))}
        </div>
      )}

      {/* Botón añadir si ya hay rutinas */}
      {routines.length > 0 && (
        <button
          onClick={() => setCreating(true)}
          className="w-full glass border border-dashed border-white/20 rounded-2xl py-4 text-sm text-white/40 active:scale-95 transition-transform animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          + Añadir día
        </button>
      )}
    </div>
  )
}

// ─── Tarjeta de rutina ────────────────────────────────────────────────────────
function RoutineCard({ routine, index, total, onEdit, onDelete, onMove }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {/* Número de día */}
        <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="font-display text-brand text-base">{index + 1}</span>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{routine.name}</h3>
          <p className="text-xs text-white/40 mt-0.5">
            {routine.exercises.length} ejercicios · {routine.estimated_minutes} min
          </p>
          {routine.exercises.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {routine.exercises.slice(0, 3).map((ex, i) => (
                <span key={i} className="text-xs bg-white/[0.05] rounded-full px-2.5 py-1 text-white/50">
                  {ex}
                </span>
              ))}
              {routine.exercises.length > 3 && (
                <span className="text-xs text-white/30 py-1">+{routine.exercises.length - 3} más</span>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={onEdit} className="text-white/30 hover:text-white p-1 transition-colors">
            <PencilIcon />
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="text-white/30 hover:text-red-400 p-1 transition-colors">
              <TrashIcon />
            </button>
          ) : (
            <button onClick={onDelete} className="text-red-400 p-1 text-xs font-bold">
              ¿Sí?
            </button>
          )}
        </div>
      </div>

      {/* Ordenar */}
      {total > 1 && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="flex-1 text-xs text-white/30 disabled:opacity-20 py-1 hover:text-white transition-colors"
          >
            ↑ Subir
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="flex-1 text-xs text-white/30 disabled:opacity-20 py-1 hover:text-white transition-colors"
          >
            ↓ Bajar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Formulario crear/editar ──────────────────────────────────────────────────
function RoutineForm({ userId, routine, dayOrder, onSaved, onCancel }) {
  const isNew = !routine
  const [name, setName] = useState(routine?.name || '')
  const [minutes, setMinutes] = useState(routine?.estimated_minutes || 45)
  const [exercises, setExercises] = useState(routine?.exercises || [])
  const [newExercise, setNewExercise] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addExercise() {
    const trimmed = newExercise.trim()
    if (!trimmed) return
    setExercises(prev => [...prev, trimmed])
    setNewExercise('')
  }

  function removeExercise(i) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addExercise() }
  }

  async function save() {
    if (!name.trim()) { setError('Ponle un nombre al día'); return }
    if (exercises.length === 0) { setError('Añade al menos un ejercicio'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: name.trim(),
      exercises,
      estimated_minutes: Number(minutes),
    }

    let data, err
    if (isNew) {
      const res = await supabase
        .from('routines')
        .insert({ ...payload, user_id: userId, day_order: dayOrder, is_active: true })
        .select()
        .single()
      data = res.data; err = res.error
    } else {
      const res = await supabase
        .from('routines')
        .update(payload)
        .eq('id', routine.id)
        .select()
        .single()
      data = res.data; err = res.error
    }

    if (err) { setError('Error guardando. Inténtalo de nuevo.'); setSaving(false); return }
    onSaved(data, isNew)
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-up">
        <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="font-display text-3xl tracking-wide">
          {isNew ? 'NUEVO DÍA' : 'EDITAR DÍA'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Nombre */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <label className="text-xs uppercase tracking-widest text-white/30 font-medium">
          Nombre del día
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Pecho y tríceps, Pierna, Upper..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/25 outline-none focus:border-brand/50 transition-colors"
        />
      </div>

      {/* Duración */}
      <div className="space-y-2 animate-fade-up" style={{ animationDelay: '0.08s' }}>
        <label className="text-xs uppercase tracking-widest text-white/30 font-medium">
          Duración estimada
        </label>
        <div className="flex items-center gap-3">
          {[30, 45, 60, 75, 90].map(m => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                minutes === m ? 'bg-brand text-black' : 'glass text-white/50'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Ejercicios */}
      <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <label className="text-xs uppercase tracking-widest text-white/30 font-medium">
          Ejercicios
        </label>

        {/* Añadir ejercicio */}
        <div className="flex gap-2">
          <input
            value={newExercise}
            onChange={e => setNewExercise(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del ejercicio..."
            className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/25 outline-none focus:border-brand/50 transition-colors"
          />
          <button
            onClick={addExercise}
            className="bg-brand text-black font-bold px-5 rounded-xl text-sm active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        {/* Lista de ejercicios */}
        {exercises.length > 0 && (
          <div className="glass rounded-2xl p-4 space-y-2">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-xs text-white/40 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm truncate">{ex}</span>
                </div>
                <button
                  onClick={() => removeExercise(i)}
                  className="text-white/25 hover:text-red-400 transition-colors text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {exercises.length === 0 && (
          <p className="text-white/25 text-xs text-center py-4">
            Escribe un ejercicio y pulsa + o Enter
          </p>
        )}
      </div>

      {/* Guardar */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-brand text-black font-bold text-base py-4 rounded-2xl tracking-wide active:scale-95 transition-all duration-200 disabled:opacity-60 animate-fade-up"
        style={{ animationDelay: '0.15s' }}
      >
        {saving ? 'GUARDANDO...' : isNew ? 'GUARDAR DÍA' : 'ACTUALIZAR DÍA'}
      </button>
    </div>
  )
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="glass rounded-3xl p-8 text-center space-y-4">
      <div className="text-5xl">📋</div>
      <div>
        <h3 className="font-semibold text-base mb-1">Sin días configurados</h3>
        <p className="text-white/40 text-sm leading-relaxed">
          Crea los días de tu semana y Klyro los rotará automáticamente.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="bg-brand text-black font-bold px-8 py-3.5 rounded-2xl text-sm tracking-wide active:scale-95 transition-transform"
      >
        + CREAR PRIMER DÍA
      </button>
    </div>
  )
}

// ─── Iconos ───────────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}
