export default function Loader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl font-display tracking-widest text-brand animate-pulse">KLYRO</div>
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    </div>
  )
}
