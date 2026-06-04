'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Perfil, Canal } from '@/lib/types'

const CANAIS: { valor: Canal; label: string }[] = [
  { valor: 'instagram', label: 'instagram' },
  { valor: 'email', label: 'e-mail' },
  { valor: 'whatsapp', label: 'whatsapp' },
  { valor: 'linkedin', label: 'linkedin' },
]

const FREQUENCIAS = [
  { valor: 2, label: '2 por semana' },
  { valor: 5, label: '5 por semana' },
  { valor: 10, label: '10 por semana' },
]

export default function PerfilBar({ perfil: inicial }: { perfil: Perfil }) {
  const supabase = createClient()
  const router = useRouter()
  const [perfil, setPerfil] = useState(inicial)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nome: inicial.nome,
    o_que_faz: inicial.o_que_faz,
    icp: inicial.icp,
    rotina_frequencia: inicial.rotina_frequencia,
    rotina_canais: inicial.rotina_canais as Canal[],
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function set(campo: string, valor: unknown) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function toggleCanal(canal: Canal) {
    setForm((prev) => ({
      ...prev,
      rotina_canais: prev.rotina_canais.includes(canal)
        ? prev.rotina_canais.filter((c) => c !== canal)
        : [...prev.rotina_canais, canal],
    }))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function salvarPerfil() {
    setLoading(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('perfis')
        .update({
          nome: form.nome,
          o_que_faz: form.o_que_faz,
          icp: form.icp,
          rotina_frequencia: form.rotina_frequencia,
          rotina_canais: form.rotina_canais,
        })
        .eq('id', perfil.id)
        .select()
        .single()
      if (error) throw error
      setPerfil(data as Perfil)
      setEditando(false)
    } catch {
      setErro('algo deu errado. tenta de novo.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-input)',
    color: 'var(--color-primary)',
    fontFamily: 'var(--font-main)',
  }

  const labelStyle: React.CSSProperties = {
    color: 'var(--color-muted)',
    fontSize: '11px',
    textTransform: 'lowercase',
    display: 'block',
    marginBottom: '4px',
  }

  return (
    <>
      <div
        className="w-full px-6 py-3 flex items-center justify-between"
        style={{
          background: 'var(--color-primary)',
          borderBottom: '1px solid var(--color-primary-dark)',
        }}
      >
        <div className="flex items-center gap-6">
          <span
            className="text-xs font-medium lowercase"
            style={{ color: 'var(--color-text-inv)' }}
          >
            {perfil.nome}
          </span>
          <span
            className="text-xs lowercase hidden sm:block"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {perfil.o_que_faz.length > 60
              ? perfil.o_que_faz.slice(0, 60) + '...'
              : perfil.o_que_faz}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span
            className="text-xs lowercase hidden md:block"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {perfil.rotina_frequencia}× por semana
          </span>
          <a
            href="/contatos"
            className="text-xs lowercase transition-all"
            style={{ color: 'rgba(255,255,255,0.70)' }}
          >
            contatos
          </a>
          <button
            onClick={() => {
              setForm({
                nome: perfil.nome,
                o_que_faz: perfil.o_que_faz,
                icp: perfil.icp,
                rotina_frequencia: perfil.rotina_frequencia,
                rotina_canais: perfil.rotina_canais as Canal[],
              })
              setErro(null)
              setEditando(true)
            }}
            className="text-xs lowercase transition-all"
            style={{ color: 'rgba(255,255,255,0.70)' }}
          >
            perfil
          </button>
          <button
            onClick={logout}
            className="text-xs lowercase transition-all"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            sair
          </button>
        </div>
      </div>

      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => e.target === e.currentTarget && setEditando(false)}
        >
          <div
            className="w-full max-w-lg rounded p-6"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3
              className="text-sm font-medium lowercase mb-5"
              style={{ color: 'var(--color-primary)' }}
            >
              editar perfil
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label style={labelStyle}>seu nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>o que você faz e entrega</label>
                <textarea
                  rows={2}
                  value={form.o_que_faz}
                  onChange={(e) => set('o_que_faz', e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>cliente ideal (icp)</label>
                <textarea
                  rows={2}
                  value={form.icp}
                  onChange={(e) => set('icp', e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>prospecções por semana</label>
                <div className="flex gap-2">
                  {FREQUENCIAS.map((f) => (
                    <button
                      key={f.valor}
                      onClick={() => set('rotina_frequencia', f.valor)}
                      className="px-3 py-1.5 text-xs lowercase transition-all"
                      style={{
                        background:
                          form.rotina_frequencia === f.valor
                            ? 'var(--color-primary)'
                            : 'var(--color-bg)',
                        color:
                          form.rotina_frequencia === f.valor
                            ? 'var(--color-text-inv)'
                            : 'var(--color-muted)',
                        border: `1px solid ${
                          form.rotina_frequencia === f.valor
                            ? 'var(--color-primary)'
                            : 'var(--color-border)'
                        }`,
                        borderRadius: 'var(--radius-badge)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>canais que você usa</label>
                <div className="flex flex-wrap gap-2">
                  {CANAIS.map((c) => {
                    const sel = form.rotina_canais.includes(c.valor)
                    return (
                      <button
                        key={c.valor}
                        onClick={() => toggleCanal(c.valor)}
                        className="px-3 py-1.5 text-xs lowercase transition-all"
                        style={{
                          background: sel ? 'var(--color-primary)' : 'var(--color-bg)',
                          color: sel ? 'var(--color-text-inv)' : 'var(--color-muted)',
                          border: `1px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-badge)',
                        }}
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {erro && (
                <p className="text-xs lowercase" style={{ color: 'var(--color-accent)' }}>
                  {erro}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={salvarPerfil}
                  disabled={loading || !form.nome.trim() || form.rotina_canais.length === 0}
                  className="px-4 py-2 text-sm lowercase font-medium transition-all"
                  style={{
                    background:
                      !loading && form.nome.trim() && form.rotina_canais.length > 0
                        ? 'var(--color-accent)'
                        : 'var(--color-border)',
                    color:
                      !loading && form.nome.trim() && form.rotina_canais.length > 0
                        ? 'var(--color-text-inv)'
                        : 'var(--color-muted)',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  {loading ? 'salvando...' : 'salvar'}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="px-4 py-2 text-sm lowercase transition-all"
                  style={{ color: 'var(--color-muted)' }}
                >
                  cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
