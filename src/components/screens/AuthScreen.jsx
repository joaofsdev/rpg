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
    <div className="flex flex-col items-center justify-center h-full bg-bg-primary relative noise-bg vignette">
      <div className="relative z-10 card p-6 md:p-8 w-full max-w-sm mx-4 animate-slide-up">
        <img src="/logo.png" alt="MagiChill" className="w-20 mx-auto mb-4 object-contain" />

        {/* Tabs */}
        <div className="flex mb-6 border-b border-border-subtle">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2.5 font-title text-sm font-bold transition-all border-b-2 ${mode === 'login' ? 'border-accent-gold text-accent-gold' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2.5 font-title text-sm font-bold transition-all border-b-2 ${mode === 'register' ? 'border-accent-gold text-accent-gold' : 'border-transparent text-text-muted hover:text-text-secondary'}`}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="font-title text-xs text-text-secondary mb-1 block">Nome de Jogador</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-elevated rounded-lg text-text-primary border border-border-subtle focus:border-accent-gold focus:shadow-[inset_0_0_8px_#f0a50020] outline-none transition-all font-body"
            />
          </div>
          <div>
            <label className="font-title text-xs text-text-secondary mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-elevated rounded-lg text-text-primary border border-border-subtle focus:border-accent-gold focus:shadow-[inset_0_0_8px_#f0a50020] outline-none transition-all font-body"
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="font-title text-xs text-text-secondary mb-1 block">Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-elevated rounded-lg text-text-primary border border-border-subtle focus:border-accent-gold focus:shadow-[inset_0_0_8px_#f0a50020] outline-none transition-all font-body"
              />
            </div>
          )}
          {error && <p className="text-danger text-sm flex items-center gap-1"><span>⚠</span> {error}</p>}
          <button type="submit" className="btn-gold-solid w-full py-3 text-sm mt-2">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>
        <button onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'TITLE' })} className="btn-tertiary mt-4 text-sm w-full text-center">← Voltar</button>
      </div>
    </div>
  )
}
