import { useState } from 'react'
import { useGame, getUsers, saveUsers } from '../../context/GameContext'
import { classes } from '../../data/classes'

export default function AuthScreen() {
  const { dispatch } = useGame()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    const users = getUsers()
    if (!users[username]) { setError('Usuário não encontrado.'); return }
    if (users[username].passwordHash !== btoa(password)) { setError('Senha incorreta.'); return }
    dispatch({ type: 'LOGIN', payload: { username } })
  }

  function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (username.length < 3 || username.length > 16) { setError('Nome deve ter 3-16 caracteres.'); return }
    if (!/^[a-zA-Z0-9]+$/.test(username)) { setError('Nome deve ser alfanumérico.'); return }
    if (password.length < 4) { setError('Senha deve ter no mínimo 4 caracteres.'); return }
    if (password !== confirmPassword) { setError('Senhas não conferem.'); return }
    const users = getUsers()
    if (users[username]) { setError('Nome de jogador já existe.'); return }
    const ids = classes.map(c => c.id)
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    const classesSorteadas = shuffled.slice(0, 3)
    users[username] = { passwordHash: btoa(password), createdAt: new Date().toISOString(), classesSorteadas, character: null }
    saveUsers(users)
    dispatch({ type: 'LOGIN', payload: { username } })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-dark-900">
      <div className="bg-dark-700 p-8 rounded-xl w-full max-w-sm">
        <div className="flex mb-6 gap-2">
          <button onClick={() => { setMode('login'); setError('') }} className={`flex-1 py-2 rounded-lg font-bold ${mode === 'login' ? 'bg-red-accent text-white' : 'bg-dark-600 text-gray-400'}`}>Entrar</button>
          <button onClick={() => { setMode('register'); setError('') }} className={`flex-1 py-2 rounded-lg font-bold ${mode === 'register' ? 'bg-red-accent text-white' : 'bg-dark-600 text-gray-400'}`}>Criar Conta</button>
        </div>
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Nome de Jogador" className="px-4 py-2 bg-dark-800 rounded-lg text-white border border-dark-600 focus:border-gold outline-none" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="px-4 py-2 bg-dark-800 rounded-lg text-white border border-dark-600 focus:border-gold outline-none" />
          {mode === 'register' && <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar Senha" className="px-4 py-2 bg-dark-800 rounded-lg text-white border border-dark-600 focus:border-gold outline-none" />}
          {error && <p className="text-red-accent text-sm">{error}</p>}
          <button type="submit" className="py-3 bg-red-accent hover:bg-red-accent/80 rounded-lg text-white font-bold transition-all">{mode === 'login' ? 'Entrar' : 'Criar Conta'}</button>
        </form>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'TITLE' })} className="mt-4 text-gray-500 hover:text-gray-300 text-sm w-full text-center">← Voltar</button>
      </div>
    </div>
  )
}
