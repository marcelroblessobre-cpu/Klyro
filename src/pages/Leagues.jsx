import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Leagues() {
  const { user, profile } = useAuth()
  const [myLeagues, setMyLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [leagueRanking, setLeagueRanking] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    if (user) fetchMyLeagues()
  }, [user])

  async function fetchMyLeagues() {
    const { data } = await supabase
      .from('league_members')
      .select('league_id, leagues(id, name, code)')
      .eq('user_id', user.id)

    setMyLeagues(data?.map(m => m.leagues) || [])
    setLoading(false)
  }

  async function fetchRanking(leagueId) {
    const { data: members } = await supabase
      .from('league_members')
      .select('user_id, users(email, xp, level, streak)')
      .eq('league_id', leagueId)

    const sorted = (members || [])
      .map(m => m.users)
      .sort((a, b) => b.xp - a.xp)

    setLeagueRanking(sorted)
  }

  async function createLeague() {
    if (!leagueName.trim()) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: league } = await supabase
      .from('leagues')
      .insert({ name: leagueName.trim(), code })
      .select()
      .single()

    if (league) {
      await supabase.from('league_members').insert({ user_id: user.id, league_id: league.id })
      setLeagueName('')
      setShowCreate(false)
      setActionMsg(`Liga "${league.name}" creada. Código: ${league.code}`)
      fetchMyLeagues()
    }
  }

  async function joinLeague() {
    const code = joinCode.trim().toUpperCase()
    const { data: league } = await supabase
      .from('leagues')
      .select('*')
      .eq('code', code)
      .single()

    if (!league) { setActionMsg('❌ Código no encontrado.'); return }

    const { error } = await supabase
      .from('league_members')
      .insert({ user_id: user.id, league_id: league.id })

    if (error?.code === '23505') { setActionMsg('Ya eres miembro de esta liga.'); }
    else { setActionMsg(`✅ Te uniste a "${league.name}"`); fetchMyLeagues() }

    setJoinCode('')
    setShowJoin(false)
  }

  function openLeague(league) {
    setSelectedLeague(league)
    fetchRanking(league.id)
  }

  const medals = ['🥇', '🥈', '🥉']

  if (selectedLeague) {
    return (
      <div className="min-h-screen pb-24 px-5 pt-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedLeague(null)} className="text-white/50 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 className="font-display text-3xl tracking-wide">{selectedLeague.name.toUpperCase()}</h1>
            <p className="text-xs text-white/40">Código: <span className="text-brand font-mono font-bold">{selectedLeague.code}</span></p>
          </div>
        </div>

        <div className="space-y-3">
          {leagueRanking.map((member, i) => {
            const isMe = member.email === profile?.email
            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                isMe ? 'border-brand/40 bg-brand/5' : 'glass border-transparent'
              }`}>
                <span className="text-2xl w-8 text-center">{medals[i] || `${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {member.email.split('@')[0]}
                    {isMe && <span className="text-brand text-xs ml-2">(tú)</span>}
                  </p>
                  <p className="text-xs text-white/40">Nivel {member.level} · 🔥{member.streak}d</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-brand">{member.xp}</p>
                  <p className="text-xs text-white/40">XP</p>
                </div>
              </div>
            )
          })}
          {leagueRanking.length === 0 && (
            <p className="text-center text-white/30 py-8 text-sm">Cargando ranking...</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 space-y-5">
      <div className="animate-fade-up">
        <p className="text-white/40 text-sm">Competición</p>
        <h1 className="font-display text-4xl tracking-wide">LIGAS</h1>
      </div>

      {actionMsg && (
        <div className="glass border border-brand/20 rounded-xl px-4 py-3 text-sm text-brand animate-pop">
          {actionMsg}
          <button onClick={() => setActionMsg('')} className="float-right text-white/40">✕</button>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <button
          onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }}
          className="bg-brand text-black font-bold py-4 rounded-2xl text-sm tracking-wide active:scale-95 transition-transform"
        >
          + CREAR LIGA
        </button>
        <button
          onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }}
          className="glass border border-white/10 font-bold py-4 rounded-2xl text-sm tracking-wide active:scale-95 transition-transform"
        >
          UNIRSE
        </button>
      </div>

      {showCreate && (
        <div className="glass rounded-2xl p-4 space-y-3 animate-pop">
          <input
            value={leagueName}
            onChange={e => setLeagueName(e.target.value)}
            placeholder="Nombre de la liga"
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 outline-none focus:border-brand/50"
          />
          <button onClick={createLeague} className="w-full bg-brand text-black font-bold py-3 rounded-xl text-sm">
            CREAR
          </button>
        </div>
      )}

      {showJoin && (
        <div className="glass rounded-2xl p-4 space-y-3 animate-pop">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Código de liga (ej: ABC123)"
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 outline-none focus:border-brand/50 font-mono"
          />
          <button onClick={joinLeague} className="w-full bg-brand text-black font-bold py-3 rounded-xl text-sm">
            UNIRSE
          </button>
        </div>
      )}

      {/* My leagues */}
      <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-3 font-medium">Mis ligas</p>
        {loading ? (
          <p className="text-white/30 text-sm text-center py-6">Cargando...</p>
        ) : myLeagues.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-white/50 text-sm">Aún no estás en ninguna liga.</p>
            <p className="text-white/30 text-xs mt-1">Crea una o únete con un código.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myLeagues.map(league => (
              <button
                key={league.id}
                onClick={() => openLeague(league)}
                className="w-full glass rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-transform text-left"
              >
                <div>
                  <p className="font-semibold text-sm">{league.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">Código: <span className="text-brand font-mono">{league.code}</span></p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
