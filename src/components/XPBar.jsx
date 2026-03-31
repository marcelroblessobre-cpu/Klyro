import { getProgress } from '../lib/workouts'

export default function XPBar({ xp, level }) {
  const progress = getProgress(xp, level)
  const xpInLevel = xp - (level - 1) * 100
  const xpNeeded = 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Nivel {level}</span>
        </div>
        <span className="text-xs text-white/40">{xpInLevel} / {xpNeeded} XP</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="xp-bar-fill h-full bg-brand rounded-full"
          style={{ '--target-width': `${progress}%` }}
        />
      </div>
    </div>
  )
}
