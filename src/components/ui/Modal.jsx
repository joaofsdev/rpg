export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-700 border border-dark-600 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gold mb-4">{title}</h2>
        <div className="text-gray-300 mb-4">{children}</div>
        <button onClick={onClose} className="w-full py-2 bg-dark-600 hover:bg-dark-800 rounded-lg transition-colors cursor-pointer">
          Fechar
        </button>
      </div>
    </div>
  )
}
