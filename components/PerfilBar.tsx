'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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

const NICHOS_SUGERIDOS = [
  'bem-estar', 'saúde e fitness', 'gastronomia', 'bebidas', 'moda', 'beleza',
  'skincare', 'lifestyle', 'casa e decoração', 'sustentabilidade', 'tecnologia',
  'arte e cultura', 'viagem', 'educação', 'infantil e família', 'pet',
  'orgânicos e naturais', 'esportes',
]

export default function PerfilBar({
  perfil: inicial,
  totalContatos = 0,
}: {
  perfil: Perfil
  totalContatos?: number
}) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [perfil, setPerfil] = useState(inicial)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nome: inicial.nome,
    o_que_faz: inicial.o_que_faz,
    icp: inicial.icp,
    rotina_frequencia: inicial.rotina_frequencia,
    rotina_canais: inicial.rotina_canais as Canal[],
    nichos_interesse: (inicial.nichos_interesse ?? []) as string[],
  })
  const [outroNicho, setOutroNicho] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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

  function toggleNicho(nicho: string) {
    setForm((prev) => ({
      ...prev,
      nichos_interesse: prev.nichos_interesse.includes(nicho)
        ? prev.nichos_interesse.filter((n) => n !== nicho)
        : [...prev.nichos_interesse, nicho],
    }))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${perfil.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${urlData.publicUrl}?t=${Date.now()}`

      const { data, error: updateError } = await supabase
        .from('perfis')
        .update({ avatar_url: url })
        .eq('id', perfil.id)
        .select()
        .single()

      if (updateError) throw updateError
      setPerfil(data as Perfil)
    } catch {
      setErro('erro ao subir a foto. tenta de novo.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function salvarPerfil() {
    setLoading(true)
    setErro(null)
    try {
      const nichosFinal = outroNicho.trim()
        ? [...form.nichos_interesse, outroNicho.trim()]
        : form.nichos_interesse

      const { data, error } = await supabase
        .from('perfis')
        .update({
          nome: form.nome,
          o_que_faz: form.o_que_faz,
          icp: form.icp,
          rotina_frequencia: form.rotina_frequencia,
          rotina_canais: form.rotina_canais,
          nichos_interesse: nichosFinal,
        })
        .eq('id', perfil.id)
        .select()
        .single()
      if (error) throw error
      setPerfil(data as Perfil)
      setOutroNicho('')
      setEditando(false)
    } catch {
      setErro('algo deu errado. tenta de novo.')
    } finally {
      setLoading(false)
    }
  }

  const nichos = perfil.nichos_interesse ?? []
  const inicialNome = perfil.nome.charAt(0).toLowerCase()

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
      <header style={{ background: 'var(--color-primary)' }}>

        {/* Linha topo: branding + ações */}
        <div
          className="px-6 pt-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span
            className="text-xs lowercase tracking-widest pb-3"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            a arte de vender arte
          </span>
          <div className="flex items-center gap-4 pb-3">
            <button
              onClick={() => {
                setForm({
                  nome: perfil.nome,
                  o_que_faz: perfil.o_que_faz,
                  icp: perfil.icp,
                  rotina_frequencia: perfil.rotina_frequencia,
                  rotina_canais: perfil.rotina_canais as Canal[],
                  nichos_interesse: (perfil.nichos_interesse ?? []) as string[],
                })
                setOutroNicho('')
                setErro(null)
                setEditando(true)
              }}
              className="text-xs lowercase transition-all"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              editar perfil
            </button>
            <button
              onClick={logout}
              className="text-xs lowercase transition-all"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              sair
            </button>
          </div>
        </div>

        {/* Perfil: avatar + nome + bio + stats */}
        <div className="px-6 py-5">
          <div className="flex items-start gap-5">

            {/* Avatar clicável */}
            <label
              className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden cursor-pointer relative group"
              style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              title="trocar foto"
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadAvatar(file)
                }}
              />
              {perfil.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt={perfil.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl font-light lowercase select-none"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {uploadingAvatar ? '...' : inicialNome}
                </div>
              )}
              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.45)', fontSize: '10px', color: 'white' }}
              >
                {uploadingAvatar ? '...' : 'trocar'}
              </div>
            </label>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1
                className="text-lg font-medium lowercase leading-tight mb-1"
                style={{ color: 'white' }}
              >
                {perfil.nome}
              </h1>
              <p
                className="text-xs lowercase leading-relaxed mb-4"
                style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '32rem' }}
              >
                {perfil.o_que_faz.length > 200
                  ? perfil.o_que_faz.slice(0, 200) + '...'
                  : perfil.o_que_faz}
              </p>

              {/* Stats */}
              <div className="flex items-start gap-6">
                <div>
                  <span className="text-xl font-medium block leading-none" style={{ color: 'white' }}>
                    {totalContatos}
                  </span>
                  <span className="text-xs lowercase mt-0.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    marcas
                  </span>
                </div>
                <div>
                  <span className="text-xl font-medium block leading-none" style={{ color: 'white' }}>
                    {perfil.rotina_frequencia}×
                  </span>
                  <span className="text-xs lowercase mt-0.5 block" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    por semana
                  </span>
                </div>
                {nichos.length > 0 && (
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs lowercase leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {nichos.slice(0, 3).join(' · ')}
                      {nichos.length > 3 && (
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}> +{nichos.length - 3}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="px-6 flex" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { href: '/hoje', label: 'hoje' },
            { href: '/contatos', label: 'contatos' },
          ].map((link) => {
            const ativo = pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className="px-1 py-3 mr-6 text-xs lowercase transition-all"
                style={{
                  color: ativo ? 'white' : 'rgba(255,255,255,0.4)',
                  borderBottom: `2px solid ${ativo ? 'white' : 'transparent'}`,
                  marginBottom: '-1px',
                }}
              >
                {link.label}
              </a>
            )
          })}
        </div>
      </header>

      {/* Modal editar perfil */}
      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
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
                        background: form.rotina_frequencia === f.valor ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: form.rotina_frequencia === f.valor ? 'var(--color-text-inv)' : 'var(--color-muted)',
                        border: `1px solid ${form.rotina_frequencia === f.valor ? 'var(--color-primary)' : 'var(--color-border)'}`,
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

              <div>
                <label style={labelStyle}>nichos que você prospecta</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {NICHOS_SUGERIDOS.map((nicho) => {
                    const sel = form.nichos_interesse.includes(nicho)
                    return (
                      <button
                        key={nicho}
                        onClick={() => toggleNicho(nicho)}
                        className="px-3 py-1.5 text-xs lowercase transition-all"
                        style={{
                          background: sel ? 'var(--color-primary)' : 'var(--color-bg)',
                          color: sel ? 'var(--color-text-inv)' : 'var(--color-muted)',
                          border: `1px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-badge)',
                        }}
                      >
                        {nicho}
                      </button>
                    )
                  })}
                </div>
                <input
                  type="text"
                  value={outroNicho}
                  onChange={(e) => setOutroNicho(e.target.value)}
                  placeholder="outro nicho não listado..."
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
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
