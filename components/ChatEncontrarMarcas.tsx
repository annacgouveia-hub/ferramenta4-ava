'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Perfil } from '@/lib/types'
import { createClient } from '@/lib/supabase'

type Mensagem = {
  role: 'user' | 'assistant'
  content: string
}

type SugestaoMarca = {
  nome: string
  instagram: string
  nicho: string
  motivo: string
}

type BlocoChat =
  | { tipo: 'mensagem'; msg: Mensagem }
  | { tipo: 'sugestoes'; marcas: SugestaoMarca[]; texto: string }

export default function ChatEncontrarMarcas({
  perfil,
  usuarioId,
}: {
  perfil: Perfil
  usuarioId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const fimRef = useRef<HTMLDivElement>(null)

  const [blocos, setBlocos] = useState<BlocoChat[]>([])
  const [historico, setHistorico] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [adicionadas, setAdicionadas] = useState<Set<string>>(new Set())
  const [iniciou, setIniciou] = useState(false)

  // Rola para o fim sempre que chega nova mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [blocos, carregando])

  // Primeira mensagem automática da IA ao montar
  useEffect(() => {
    if (!iniciou) {
      setIniciou(true)
      enviarParaIA('oi! quero encontrar marcas para prospectar.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function enviarParaIA(mensagemUsuaria: string) {
    setCarregando(true)

    // Se for a mensagem inicial automática, não adiciona no chat
    const ehMsgInicial = mensagemUsuaria === 'oi! quero encontrar marcas para prospectar.' && blocos.length === 0

    const novoHistorico: Mensagem[] = [
      ...historico,
      { role: 'user', content: mensagemUsuaria },
    ]

    if (!ehMsgInicial) {
      setBlocos((prev) => [
        ...prev,
        { tipo: 'mensagem', msg: { role: 'user', content: mensagemUsuaria } },
      ])
    }

    try {
      const res = await fetch('/api/encontrar-marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: mensagemUsuaria,
          historico,
          perfil,
        }),
      })

      const data = await res.json()
      const { resposta, marcas } = data

      const msgAssistente: Mensagem = { role: 'assistant', content: resposta }
      const historicoAtualizado = [...novoHistorico, msgAssistente]
      setHistorico(historicoAtualizado)

      if (marcas && marcas.length > 0) {
        setBlocos((prev) => [
          ...prev,
          { tipo: 'sugestoes', marcas, texto: resposta },
        ])
      } else {
        setBlocos((prev) => [
          ...prev,
          { tipo: 'mensagem', msg: msgAssistente },
        ])
      }
    } catch {
      setBlocos((prev) => [
        ...prev,
        {
          tipo: 'mensagem',
          msg: { role: 'assistant', content: 'ops, algo deu errado. tenta de novo?' },
        },
      ])
    } finally {
      setCarregando(false)
    }
  }

  async function enviar() {
    const texto = input.trim()
    if (!texto || carregando) return
    setInput('')
    await enviarParaIA(texto)
  }

  async function adicionarMarca(marca: SugestaoMarca) {
    const { error } = await supabase.from('contatos').insert({
      usuario_id: usuarioId,
      nome: marca.nome,
      nicho: marca.nicho,
      canal_principal: 'instagram',
      instagram: marca.instagram,
      status: 'na_lista',
    })

    if (!error) {
      setAdicionadas((prev) => new Set([...prev, marca.instagram]))
      router.refresh()
    }
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-input)',
    color: 'var(--color-primary)',
    fontFamily: 'var(--font-main)',
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>

      {/* Área de chat */}
      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-4">
        {blocos.map((bloco, i) => {
          if (bloco.tipo === 'mensagem') {
            const { msg } = bloco
            return (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="px-4 py-3 text-sm leading-relaxed"
                  style={{
                    maxWidth: '80%',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: msg.role === 'user' ? 'var(--color-text-inv)' : 'var(--color-primary)',
                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            )
          }

          if (bloco.tipo === 'sugestoes') {
            return (
              <div key={i} className="flex flex-col gap-3">
                {/* Texto introdutório da IA */}
                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 text-sm leading-relaxed"
                    style={{
                      maxWidth: '80%',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'var(--color-surface)',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {bloco.texto}
                  </div>
                </div>

                {/* Cards de sugestão */}
                {bloco.marcas.map((marca) => {
                  const jaAdicionada = adicionadas.has(marca.instagram)
                  return (
                    <div
                      key={marca.instagram}
                      className="rounded p-4"
                      style={{
                        background: 'var(--color-surface)',
                        border: jaAdicionada
                          ? '1px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-sm font-medium lowercase"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              {marca.nome}
                            </span>
                            <a
                              href={`https://instagram.com/${marca.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs hover:underline"
                              style={{ color: 'var(--color-muted)' }}
                            >
                              {marca.instagram}
                            </a>
                          </div>
                          <p
                            className="text-xs lowercase mb-1"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            {marca.nicho}
                          </p>
                          <p
                            className="text-xs lowercase leading-relaxed"
                            style={{ color: 'var(--color-primary)', opacity: 0.7 }}
                          >
                            {marca.motivo}
                          </p>
                        </div>

                        <button
                          onClick={() => adicionarMarca(marca)}
                          disabled={jaAdicionada}
                          className="flex-shrink-0 px-3 py-1.5 text-xs lowercase font-medium transition-all"
                          style={{
                            background: jaAdicionada ? 'var(--color-primary)' : 'var(--color-accent)',
                            color: 'var(--color-text-inv)',
                            borderRadius: 'var(--radius-badge)',
                            opacity: jaAdicionada ? 0.6 : 1,
                            cursor: jaAdicionada ? 'default' : 'pointer',
                          }}
                        >
                          {jaAdicionada ? 'adicionada ✓' : '+ adicionar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          return null
        })}

        {/* Indicador de digitação */}
        {carregando && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 text-sm"
              style={{
                borderRadius: '16px 16px 16px 4px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
              }}
            >
              pensando...
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* Input */}
      <div
        className="pt-4"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviar()}
            placeholder="escreva aqui..."
            className="flex-1 px-4 py-3 text-sm outline-none"
            style={inputStyle}
            disabled={carregando}
          />
          <button
            onClick={enviar}
            disabled={!input.trim() || carregando}
            className="px-5 py-3 text-sm lowercase font-medium transition-all"
            style={{
              background:
                input.trim() && !carregando ? 'var(--color-accent)' : 'var(--color-border)',
              color:
                input.trim() && !carregando ? 'var(--color-text-inv)' : 'var(--color-muted)',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            enviar
          </button>
        </div>
      </div>
    </div>
  )
}
