'use client'

import { useState } from 'react'
import { AcaoDia } from '@/lib/algoritmo'
import { Perfil } from '@/lib/types'
import { createClient } from '@/lib/supabase'

const LABELS: Record<string, string> = {
  responder: 'ela respondeu — volta pra ela',
  abordagem: 'primeira mensagem',
  fup1: 'lembrete',
  fup2: 'segundo lembrete',
  fup3: 'último lembrete',
  interagir: 'interagir no perfil',
  aquecer: 'aquecimento',
}

const STATUS_APOS_ACAO: Record<string, string> = {
  responder: 'fup1_enviado',
  abordagem: 'abordagem_enviada',
  fup1: 'fup1_enviado',
  fup2: 'fup2_enviado',
  fup3: 'fup3_enviado',
  interagir: 'aquecendo',
  aquecer: 'aquecendo',
}

const CAMPO_DATA: Record<string, string> = {
  abordagem: 'data_abordagem',
  fup1: 'data_fup1',
  fup2: 'data_fup2',
  fup3: 'data_fup3',
}

export default function CardLembrete({
  acao,
  perfil,
  onConcluido,
}: {
  acao: AcaoDia
  perfil: Perfil
  onConcluido: () => void
}) {
  const supabase = createClient()
  const [expandido, setExpandido] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemRecebida, setMensagemRecebida] = useState('')
  const [gerando, setGerando] = useState(false)
  const [adiamentos, setAdiamentos] = useState(acao.contato.adiamentos ?? 0)
  const [confirmandoDesistencia, setConfirmandoDesistencia] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erroGeracao, setErroGeracao] = useState<string | null>(null)

  const precisaPontoConexao = !acao.contato.ponto_conexao && acao.tipo !== 'interagir'

  async function gerarMensagem() {
    setGerando(true)
    setExpandido(true)
    setErroGeracao(null)

    try {
      const res = await fetch('/api/gerar-mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: acao.tipo,
          contato: acao.contato,
          perfil,
          mensagemRecebida: mensagemRecebida || undefined,
        }),
      })

      if (!res.ok) throw new Error('erro ao gerar')
      const data = await res.json()
      setMensagem(data.texto ?? '')
    } catch {
      setErroGeracao('não consegui escrever agora. tenta de novo?')
      setExpandido(false)
    } finally {
      setGerando(false)
    }
  }

  async function marcarEnviado() {
    const agora = new Date().toISOString()
    const updates: Record<string, unknown> = {
      status: STATUS_APOS_ACAO[acao.tipo],
      data_ultimo_contato: agora,
      adiamentos: 0,
    }

    const campo = CAMPO_DATA[acao.tipo]
    if (campo) updates[campo] = agora

    await supabase.from('contatos').update(updates).eq('id', acao.contato.id)
    onConcluido()
  }

  async function adiar() {
    const novosAdiamentos = adiamentos + 1
    setAdiamentos(novosAdiamentos)

    if (novosAdiamentos >= 3) {
      setConfirmandoDesistencia(true)
      return
    }

    await supabase
      .from('contatos')
      .update({ adiamentos: novosAdiamentos })
      .eq('id', acao.contato.id)

    onConcluido()
  }

  async function marcarDormindo() {
    await supabase
      .from('contatos')
      .update({ status: 'dormindo', adiamentos: 0 })
      .eq('id', acao.contato.id)
    onConcluido()
  }

  async function manterAtivo() {
    await supabase
      .from('contatos')
      .update({ adiamentos: 0 })
      .eq('id', acao.contato.id)
    setConfirmandoDesistencia(false)
    setAdiamentos(0)
  }

  function copiar() {
    navigator.clipboard.writeText(mensagem)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (confirmandoDesistencia) {
    return (
      <div
        className="p-5 rounded"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <p className="text-sm mb-4" style={{ color: 'var(--color-primary)' }}>
          você ainda quer entrar em contato com <strong>{acao.contato.nome}</strong>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={manterAtivo}
            className="px-4 py-2 text-sm lowercase transition-all"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-inv)',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            sim, quero
          </button>
          <button
            onClick={marcarDormindo}
            className="px-4 py-2 text-sm lowercase transition-all"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            por enquanto não
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded transition-all"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Cabeçalho do card */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <span
              className="text-xs lowercase"
              style={{
                background: acao.prioridade === 1 ? 'var(--color-accent)' : 'var(--color-lavanda)',
                color: acao.prioridade === 1 ? 'var(--color-text-inv)' : 'var(--color-primary)',
                borderRadius: 'var(--radius-badge)',
                padding: '2px 8px',
              }}
            >
              {LABELS[acao.tipo]}
            </span>
          </div>
        </div>

        <h3
          className="text-base font-medium lowercase mt-2"
          style={{ color: 'var(--color-primary)' }}
        >
          {acao.contato.nome}
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          {acao.contexto}
        </p>

        {/* Aviso de ponto de conexão faltando */}
        {precisaPontoConexao && !expandido && (
          <p
            className="text-xs mt-3 p-3 rounded"
            style={{
              background: 'rgba(194,194,255,0.2)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            sua mensagem fica mais forte com um ponto de conexão. exemplos: um post específico que
            você viu, um produto deles, um valor que eles comunicam, uma campanha recente.
          </p>
        )}

        {/* Input de mensagem recebida para "responder" */}
        {acao.tipo === 'responder' && !expandido && (
          <div className="mt-3">
            <label
              className="text-xs lowercase block mb-1"
              style={{ color: 'var(--color-muted)' }}
            >
              o que ela disse?
            </label>
            <textarea
              rows={2}
              value={mensagemRecebida}
              onChange={(e) => setMensagemRecebida(e.target.value)}
              placeholder="cola aqui o que ela respondeu..."
              className="w-full px-3 py-2 text-sm outline-none resize-none"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-input)',
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-main)',
              }}
            />
          </div>
        )}

        {/* Botão gerar */}
        {!expandido && (
          <>
            <button
              onClick={gerarMensagem}
              disabled={acao.tipo === 'responder' && !mensagemRecebida}
              className="mt-4 text-sm lowercase transition-all"
              style={{
                color: acao.tipo === 'responder' && !mensagemRecebida
                  ? 'var(--color-muted)'
                  : 'var(--color-accent)',
                fontFamily: 'var(--font-main)',
                cursor: acao.tipo === 'responder' && !mensagemRecebida ? 'not-allowed' : 'pointer',
              }}
            >
              escrever mensagem →
            </button>
            {erroGeracao && (
              <p className="text-xs mt-2 lowercase" style={{ color: 'var(--color-accent)' }}>
                {erroGeracao}
              </p>
            )}
          </>
        )}
      </div>

      {/* Mensagem gerada */}
      {expandido && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="p-5">
            {gerando ? (
              <p className="text-sm lowercase" style={{ color: 'var(--color-muted)' }}>
                escrevendo...
              </p>
            ) : (
              <>
                <pre
                  className="text-sm whitespace-pre-wrap leading-relaxed font-sans mb-4"
                  style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-main)' }}
                >
                  {mensagem}
                </pre>

                {/* Ações */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copiar}
                    className="px-4 py-2 text-sm lowercase font-medium transition-all"
                    style={{
                      background: copiado ? 'var(--color-primary)' : 'var(--color-accent)',
                      color: 'var(--color-text-inv)',
                      borderRadius: 'var(--radius-btn)',
                      boxShadow: copiado ? 'none' : 'var(--shadow-cta)',
                    }}
                  >
                    {copiado ? 'copiado!' : 'copiar'}
                  </button>
                  <button
                    onClick={marcarEnviado}
                    className="px-4 py-2 text-sm lowercase transition-all"
                    style={{
                      background: 'var(--color-primary)',
                      color: 'var(--color-text-inv)',
                      borderRadius: 'var(--radius-btn)',
                    }}
                  >
                    copiei e mandei
                  </button>
                  <button
                    onClick={gerarMensagem}
                    className="px-4 py-2 text-sm lowercase transition-all"
                    style={{
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-muted)',
                      borderRadius: 'var(--radius-btn)',
                    }}
                  >
                    reescrever
                  </button>
                  <button
                    onClick={adiar}
                    className="px-4 py-2 text-sm lowercase transition-all"
                    style={{
                      color: 'var(--color-muted)',
                      borderRadius: 'var(--radius-btn)',
                    }}
                  >
                    deixa pra amanhã
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Botão adiar quando não expandido */}
      {!expandido && (
        <div
          className="px-5 pb-4"
        >
          <button
            onClick={adiar}
            className="text-xs lowercase"
            style={{ color: 'var(--color-muted)' }}
          >
            deixa pra amanhã
          </button>
        </div>
      )}
    </div>
  )
}
