'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Handle hash-based magic link tokens (implicit flow)
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => { if (!error) router.push('/') })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setErro(error.message || 'não conseguimos enviar o link. tente de novo.')
    } else {
      setEnviado(true)
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-sm px-8">
        {/* Logo / título */}
        <div className="mb-10">
          <p
            className="text-xs tracking-widest mb-2 lowercase"
            style={{ color: 'var(--color-muted)' }}
          >
            a arte de vender arte
          </p>
          <h1
            className="text-2xl font-light lowercase"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-main)' }}
          >
            lembrete de prospecção
          </h1>
        </div>

        {enviado ? (
          <div
            className="p-6 rounded"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-primary)' }}
            >
              link enviado para <strong>{email}</strong>.
              <br />
              <br />
              abre o e-mail e clica no link para entrar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-xs lowercase"
                style={{ color: 'var(--color-muted)' }}
              >
                seu e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="você@email.com"
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-main)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)'
                }}
              />
            </div>

            {erro && (
              <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-sm font-medium lowercase transition-all"
              style={{
                background: loading ? 'var(--color-muted)' : 'var(--color-accent)',
                color: 'var(--color-text-inv)',
                borderRadius: 'var(--radius-btn)',
                fontFamily: 'var(--font-main)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'enviando...' : 'entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
