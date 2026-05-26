export default function AttributeControl({ label, value, onIncrease, disabled }) {
  return (
    <div className="flex items-center justify-between bg-dark-800 rounded-lg px-4 py-2">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-gold font-bold w-8 text-center">{value}</span>
        <button
          onClick={onIncrease}
          disabled={disabled}
          className="w-8 h-8 bg-green-accent/20 text-green-accent rounded-full font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-green-accent/40 transition-colors cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  )
}
