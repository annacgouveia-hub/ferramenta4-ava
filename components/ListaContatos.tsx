'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Contato, Canal, StatusContato } from '@/lib/types'
import { createClient } from '@/lib/supabase'
import FormNovoContato from './FormNovoContato'

const STATUS_LABEL: Record<StatusContato, string> = {
  na_lista: 'na lista',
  aquecendo: 'aquecendo',
  dever_feito: 'dever feito',
  abordagem_enviada: 'abordagem enviada',
  fup1_enviado: 'fup 1 enviado',
  fup2_enviado: 'fup 2 enviado',
  fup3_enviado: 'fup 3 enviado',
  respondeu: 'respondeu',
  reuniao_agendada: 'reunião agendada',
  fechou: 'fechou',
  dormindo: 'dormindo',
}

const CANAL_LABEL: Record<Canal, string> = {
  instagram: 'instagram',
  email: 'e-mail',
  whatsapp: 'whatsapp',
  linkedin: 'linkedin',
}

export default function ListaContatos({
  contatos: inicial,
  usuarioId,
}: {
  contatos: Contato[]
  usuarioId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [contatos, setContatos] = useState<Contato[]>(inicial)
  const [mostrando, setMostrando] = useState<'ativos' | 'dormindo' | 'fechou'>('ativos')
  const [adicionando, setAdicionando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [confirmandoDeleteId, setConfirmandoDeleteId] = useState<string | null>(null)

  const filtrados = contatos.filter((c) => {
    if (mostrando === 'ativos') return c.status !== 'dormindo' && c.status !== 'fechou'
    return c.status === mostrando
  })

  function aoAdicionar(novo: Contato) {
    setContatos((prev) => [novo, ...prev])
    setAdicionando(false)
    router.refresh()
  }

  function aoEditar(atualizado: Contato) {
    setContatos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)))
    setEditandoId(null)
    router.refresh()
  }

  async function reativar(id: string) {
    await supabase
      .from('contatos')
      .update({ status: 'na_lista', adiamentos: 0 })
      .eq('id', id)
    setContatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'na_lista', adiamentos: 0 } : c))
    )
    router.refresh()
  }

  async function excluir(id: string) {
    await supabase.from('contatos').delete().eq('id', id)
    setContatos((prev) => prev.filter((c) => c.id !== id))
    setConfirmandoDeleteId(null)
    router.refresh()
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['ativos', 'dormindo', 'fechou'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setMostrando(f)}
            className="px-3 py-1 text-xs lowercase transition-all"
            style={{
              background: mostrando === f ? 'var(--color-primary)' : 'var(--color-surface)',
              color: mostrando === f ? 'var(--color-text-inv)' : 'var(--color-muted)',
              border: `1px solid ${mostrando === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-badge)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Botões de ação */}
      {!adicionando && (
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setAdicionando(true)}
            className="text-sm lowercase transition-all"
            style={{ color: 'var(--color-accent)' }}
          >
            + adicionar manualmente
          </button>
          <a
            href="/contatos/encontrar"
            className="text-sm lowercase transition-all px-3 py-1.5 rounded"
            style={{
              background: 'var(--color-lavanda)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-badge)',
            }}
          >
            ✦ encontrar marcas com IA
          </a>
        </div>
      )}

      {/* Formulário de novo contato */}
      {adicionando && (
        <div className="mb-6">
          <FormNovoContato
            usuarioId={usuarioId}
            onSalvo={aoAdicionar}
            onCancelar={() => setAdicionando(false)}
          />
        </div>
      )}

      {/* Lista */}
      {filtrados.length === 0 ? (
        <p className="text-sm lowercase" style={{ color: 'var(--color-muted)' }}>
          {mostrando === 'ativos' ? 'nenhum contato ativo ainda.' : `nenhum contato ${mostrando}.`}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtrados.map((c) => (
            <div key={c.id}>
              {/* Formulário de edição inline */}
              {editandoId === c.id ? (
                <FormNovoContato
                  usuarioId={usuarioId}
                  contatoEditando={c}
                  onSalvo={aoEditar}
                  onCancelar={() => setEditandoId(null)}
                />
              ) : (
                <div
                  className="p-4 rounded"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-medium lowercase"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {c.nome}
                        </span>
                        <span
                          className="text-xs lowercase px-2 py-0.5"
                          style={{
                            background: 'var(--color-bg)',
                            color: 'var(--color-muted)',
                            borderRadius: 'var(--radius-badge)',
                          }}
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-1 lowercase"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {c.nicho} · {CANAL_LABEL[c.canal_principal as Canal]}
                        {c.canal_secundario &&
                          ` · ${CANAL_LABEL[c.canal_secundario as Canal]}`}
                      </p>
                      {c.ponto_conexao && (
                        <p
                          className="text-xs mt-1 italic"
                          style={{ color: 'var(--color-muted)', opacity: 0.8 }}
                        >
                          {c.ponto_conexao.length > 80
                            ? c.ponto_conexao.slice(0, 80) + '...'
                            : c.ponto_conexao}
                        </p>
                      )}
                    </div>

                    {/* Ações do card */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {c.status === 'dormindo' && (
                        <button
                          onClick={() => reativar(c.id)}
                          className="text-xs lowercase"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          reativar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setConfirmandoDeleteId(null)
                          setEditandoId(c.id)
                        }}
                        className="text-xs lowercase"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        editar
                      </button>
                      {confirmandoDeleteId === c.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs lowercase" style={{ color: 'var(--color-muted)' }}>
                            tem certeza?
                          </span>
                          <button
                            onClick={() => excluir(c.id)}
                            className="text-xs lowercase"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            excluir
                          </button>
                          <button
                            onClick={() => setConfirmandoDeleteId(null)}
                            className="text-xs lowercase"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmandoDeleteId(c.id)}
                          className="text-xs lowercase"
                          style={{ color: 'var(--color-muted)', opacity: 0.5 }}
                        >
                          excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
