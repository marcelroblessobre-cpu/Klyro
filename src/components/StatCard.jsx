export default function StatCard({ icon, label, value, accent }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-1">
      <div className="text-2xl">{icon}</div>
      <div className={`text-2xl font-display tracking-wide ${accent ? 'text-brand' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-white/40 font-medium">{label}</div>
    </div>
  )
}
