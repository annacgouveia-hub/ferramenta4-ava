'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Canal, Contato } from '@/lib/types'

const CANAIS: { valor: Canal; label: string }[] = [
  { valor: 'instagram', label: 'instagram' },
  { valor: 'email', label: 'e-mail' },
  { valor: 'whatsapp', label: 'whatsapp' },
  { valor: 'linkedin', label: 'linkedin' },
]

const DICAS_PONTO_CONEXAO = [
  'um post específico que te chamou atenção',
  'um produto deles que você usaria',
  'um valor que eles comunicam e que tem a ver com o seu trabalho',
  'uma campanha recente que você achou interessante',
  'algo no perfil deles que conecta com o que você faz',
]

export default function FormNovoContato({
  usuarioId,
  contatoEditando,
  onSalvo,
  onCancelar,
}: {
  usuarioId: string
  contatoEditando?: Contato
  onSalvo: (contato: Contato) => void
  onCancelar: () => void
}) {
  const supabase = createClient()
  const editando = !!contatoEditando

  const [form, setForm] = useState({
    nome: contatoEditando?.nome ?? '',
    nicho: contatoEditando?.nicho ?? '',
    canal_principal: (contatoEditando?.canal_principal ?? '') as Canal | '',
    canal_secundario: (contatoEditando?.canal_secundario ?? '') as Canal | '',
    ponto_conexao: contatoEditando?.ponto_conexao ?? '',
    instagram: contatoEditando?.instagram ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function set(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function podeSalvar() {
    return form.nome.trim() && form.nicho.trim() && form.canal_principal
  }

  async function salvar() {
    if (!podeSalvar()) return
    setLoading(true)
    setErro(null)

    try {
      if (editando && contatoEditando) {
        const { data, error } = await supabase
          .from('contatos')
          .update({
            nome: form.nome,
            nicho: form.nicho,
            canal_principal: form.canal_principal,
            canal_secundario: form.canal_secundario || null,
            ponto_conexao: form.ponto_conexao || null,
            instagram: form.instagram || null,
          })
          .eq('id', contatoEditando.id)
          .select()
          .single()
        if (error) throw error
        onSalvo(data as Contato)
      } else {
        const { data, error } = await supabase
          .from('contatos')
          .insert({
            usuario_id: usuarioId,
            nome: form.nome,
            nicho: form.nicho,
            canal_principal: form.canal_principal,
            canal_secundario: form.canal_secundario || null,
            ponto_conexao: form.ponto_conexao || null,
            instagram: form.instagram || null,
            status: 'na_lista',
          })
          .select()
          .single()
        if (error) throw error
        onSalvo(data as Contato)
      }
    } catch {
      setErro('algo deu errado ao salvar. tenta de novo.')
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
    <div
      className="p-5 rounded"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <h3
        className="text-sm font-medium lowercase mb-5"
        style={{ color: 'var(--color-primary)' }}
      >
        {editando ? 'editar contato' : 'novo contato'}
      </h3>

      <div className="flex flex-col gap-4">
        {/* Nome */}
        <div>
          <label style={labelStyle}>nome da marca ou pessoa *</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            placeholder="baer mate"
            className="w-full px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Nicho */}
        <div>
          <label style={labelStyle}>nicho *</label>
          <input
            type="text"
            value={form.nicho}
            onChange={(e) => set('nicho', e.target.value)}
            placeholder="bebidas sem álcool, bem-estar, lifestyle..."
            className="w-full px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Canal principal */}
        <div>
          <label style={labelStyle}>canal principal *</label>
          <div className="flex flex-wrap gap-2">
            {CANAIS.map((c) => (
              <button
                key={c.valor}
                onClick={() => set('canal_principal', c.valor)}
                className="px-3 py-1.5 text-xs lowercase transition-all"
                style={{
                  background:
                    form.canal_principal === c.valor
                      ? 'var(--color-primary)'
                      : 'var(--color-bg)',
                  color:
                    form.canal_principal === c.valor
                      ? 'var(--color-text-inv)'
                      : 'var(--color-muted)',
                  border: `1px solid ${
                    form.canal_principal === c.valor
                      ? 'var(--color-primary)'
                      : 'var(--color-border)'
                  }`,
                  borderRadius: 'var(--radius-badge)',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canal secundário */}
        <div>
          <label style={labelStyle}>canal secundário (opcional)</label>
          <div className="flex flex-wrap gap-2">
            {CANAIS.filter((c) => c.valor !== form.canal_principal).map((c) => (
              <button
                key={c.valor}
                onClick={() =>
                  set('canal_secundario', form.canal_secundario === c.valor ? '' : c.valor)
                }
                className="px-3 py-1.5 text-xs lowercase transition-all"
                style={{
                  background:
                    form.canal_secundario === c.valor
                      ? 'var(--color-primary)'
                      : 'var(--color-bg)',
                  color:
                    form.canal_secundario === c.valor
                      ? 'var(--color-text-inv)'
                      : 'var(--color-muted)',
                  border: `1px solid ${
                    form.canal_secundario === c.valor
                      ? 'var(--color-primary)'
                      : 'var(--color-border)'
                  }`,
                  borderRadius: 'var(--radius-badge)',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label style={labelStyle}>@ do instagram (opcional)</label>
          <input
            type="text"
            value={form.instagram}
            onChange={(e) => set('instagram', e.target.value)}
            placeholder="@baermate"
            className="w-full px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Ponto de conexão */}
        <div>
          <label style={labelStyle}>
            ponto de conexão (opcional — mas faz a mensagem mais forte)
          </label>
          <textarea
            rows={2}
            value={form.ponto_conexao}
            onChange={(e) => set('ponto_conexao', e.target.value)}
            placeholder={`exemplos: ${DICAS_PONTO_CONEXAO[0]}, ${DICAS_PONTO_CONEXAO[1]}...`}
            className="w-full px-3 py-2 text-sm outline-none resize-none"
            style={inputStyle}
          />
          <p className="text-xs mt-1 lowercase" style={{ color: 'var(--color-muted)' }}>
            pode ser: {DICAS_PONTO_CONEXAO.slice(0, 3).join(', ')}.
          </p>
        </div>

        {erro && (
          <p className="text-xs lowercase" style={{ color: 'var(--color-accent)' }}>
            {erro}
          </p>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={salvar}
            disabled={!podeSalvar() || loading}
            className="px-4 py-2 text-sm lowercase font-medium transition-all"
            style={{
              background:
                podeSalvar() && !loading ? 'var(--color-accent)' : 'var(--color-border)',
              color:
                podeSalvar() && !loading ? 'var(--color-text-inv)' : 'var(--color-muted)',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            {loading ? 'salvando...' : editando ? 'salvar alterações' : 'salvar contato'}
          </button>
          <button
            onClick={onCancelar}
            className="px-4 py-2 text-sm lowercase transition-all"
            style={{ color: 'var(--color-muted)' }}
          >
            cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
