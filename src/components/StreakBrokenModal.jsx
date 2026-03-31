import { useEffect, useState } from 'react'

export default function StreakBrokenModal({ lostStreak, onClose }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50)
    return () => clearTimeout(t)
  }, [])

  function close() {
    setShow(false)
    setTimeout(onClose, 300)
  }

  if (lostStreak < 2) return null // no drama para rachas de 0-1

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={close}
    >
      <div
        className={`w-full max-w-md bg-surface-card rounded-t-3xl p-8 pb-12 transition-all duration-500 ${
          show ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-7xl mb-3">💔</div>
          <h2 className="font-display text-4xl tracking-wide text-red-400">RACHA ROTA</h2>
          <p className="text-white/50 text-sm mt-2">
            Habías llegado a <span className="text-white font-bold">{lostStreak} días</span> seguidos
          </p>
        </div>

        <div className="glass rounded-2xl p-5 text-center mb-6">
          <div className="font-display text-6xl text-red-400/60 line-through mb-1">{lostStreak}🔥</div>
          <p className="text-white/40 text-xs">Racha perdida</p>
        </div>

        <p className="text-center text-white/50 text-sm mb-6 leading-relaxed">
          Hoy empiezas de nuevo. Las rachas más largas se construyen después de romper una.
        </p>

        <button
          onClick={close}
          className="w-full bg-brand text-black font-bold text-base py-4 rounded-2xl tracking-wide active:scale-95 transition-transform"
        >
          EMPEZAR DE NUEVO 💪
        </button>
      </div>
    </div>
  )
}
