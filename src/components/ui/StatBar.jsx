export default function StatBar({ label, current, max, color = 'bg-green-accent' }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100))
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="h-3 bg-dark-900 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
