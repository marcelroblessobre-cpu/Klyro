import { useEffect, useState } from 'react'

export default function CelebrationModal({ xpEarned, newStreak, newLevel, prevLevel, onClose }) {
  const [show, setShow] = useState(false)
  const levelUp = newLevel > prevLevel

  useEffect(() => {
    // pequeño delay para que la animación entre limpia
    const t = setTimeout(() => setShow(true), 50)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setShow(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={close}
    >
      <div
        className={`w-full max-w-md bg-surface-card rounded-t-3xl p-8 pb-12 transition-all duration-500 ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Emoji principal */}
        <div className={`text-center mb-6 ${levelUp ? 'animate-bounce' : ''}`}>
          <div className="text-7xl mb-2">{levelUp ? '🚀' : '🔥'}</div>
          <h2 className="font-display text-5xl tracking-wide text-brand">
            {levelUp ? '¡NIVEL UP!' : '¡COMPLETADO!'}
          </h2>
        </div>

        {/* Stats ganados */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass rounded-2xl p-4 text-center">
            <div className="font-display text-4xl text-brand">+{xpEarned}</div>
            <div className="text-xs text-white/40 mt-1 font-medium uppercase tracking-widest">XP ganados</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="font-display text-4xl text-brand">{newStreak}🔥</div>
            <div className="text-xs text-white/40 mt-1 font-medium uppercase tracking-widest">Racha actual</div>
          </div>
        </div>

        {/* Level up especial */}
        {levelUp && (
          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 text-center mb-6">
            <p className="text-brand font-bold text-sm">
              ⚡ Has subido al nivel {newLevel}
            </p>
          </div>
        )}

        {/* Milestone de racha */}
        {!levelUp && newStreak > 0 && newStreak % 7 === 0 && (
          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 text-center mb-6">
            <p className="text-brand font-bold text-sm">
              🎯 ¡{newStreak} días seguidos! Semana perfecta.
            </p>
          </div>
        )}

        <button
          onClick={close}
          className="w-full bg-brand text-black font-bold text-base py-4 rounded-2xl tracking-wide active:scale-95 transition-transform"
        >
          SEGUIR →
        </button>
      </div>
    </div>
  )
}
