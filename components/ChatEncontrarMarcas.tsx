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
  | { tipo: 'sugestoes'; marcas: SugestaoMarca[]; texto: string; promptClaude: string | null }
  | { tipo: 'oferta-dossie' }

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
  const [marcasAdicionadasDetalhes, setMarcasAdicionadasDetalhes] = useState<SugestaoMarca[]>([])
  const [dossieOfertado, setDossieOfertado] = useState(false)
  const [copiado, setCopiado] = useState(false)
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
      const { resposta, marcas, prompt_claude } = data

      const msgAssistente: Mensagem = { role: 'assistant', content: resposta }
      const historicoAtualizado = [...novoHistorico, msgAssistente]
      setHistorico(historicoAtualizado)

      if (marcas && marcas.length > 0) {
        setBlocos((prev) => [
          ...prev,
          { tipo: 'sugestoes', marcas, texto: resposta, promptClaude: prompt_claude ?? null },
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

  async function copiarPrompt(texto: string) {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
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
      // Não chama router.refresh() aqui — causaria remount do componente e reiniciaria o chat

      setMarcasAdicionadasDetalhes((prev) => {
        const novas = [...prev, marca]
        if (novas.length >= 3 && !dossieOfertado) {
          setDossieOfertado(true)
          setBlocos((b) => [...b, { tipo: 'oferta-dossie' }])
        }
        return novas
      })
    }
  }

  function gerarDossie() {
    const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const conteudo = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Dossiê de Prospecção — ${perfil.nome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 680px; margin: 48px auto; padding: 0 24px; color: #1a1a2e; line-height: 1.65; }
    h1 { font-size: 22px; font-weight: normal; letter-spacing: -0.02em; margin-bottom: 4px; }
    .data { font-size: 12px; color: #999; margin-bottom: 40px; }
    h2 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa; margin: 36px 0 14px; }
    .perfil p { font-size: 14px; line-height: 1.7; margin-bottom: 6px; }
    .marca { margin-bottom: 20px; padding: 16px 20px; border: 1px solid #e8e0d8; border-radius: 6px; }
    .marca-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
    .marca-nome { font-size: 15px; font-weight: bold; }
    .marca-handle { font-size: 12px; color: #c1693a; }
    .marca-nicho { font-size: 11px; color: #aaa; margin-bottom: 6px; text-transform: lowercase; }
    .marca-motivo { font-size: 13px; color: #444; line-height: 1.6; }
    .rodape { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8e0d8; font-size: 11px; color: #bbb; }
    @media print { body { margin: 24px auto; } }
  </style>
</head>
<body>
  <h1>dossiê de prospecção</h1>
  <p class="data">${data}</p>

  <h2>perfil da criadora</h2>
  <div class="perfil">
    <p><strong>${perfil.nome}</strong></p>
    <p>${perfil.o_que_faz}</p>
    ${perfil.icp ? `<p style="margin-top:10px;"><strong>ICP:</strong> ${perfil.icp}</p>` : ''}
  </div>

  <h2>marcas para prospectar (${marcasAdicionadasDetalhes.length})</h2>
  ${marcasAdicionadasDetalhes.map((m) => `
  <div class="marca">
    <div class="marca-header">
      <span class="marca-nome">${m.nome}</span>
      <span class="marca-handle">${m.instagram}</span>
    </div>
    <div class="marca-nicho">${m.nicho}</div>
    <div class="marca-motivo">${m.motivo}</div>
  </div>`).join('')}

  <div class="rodape">gerado pela ferramenta de prospecção AVA · confirme os @ antes de enviar mensagens</div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

    const janela = window.open('', '_blank')
    if (janela) {
      janela.document.write(conteudo)
      janela.document.close()
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
                              className="text-xs"
                              style={{
                                color: 'var(--color-accent)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                              }}
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

                {/* Botão copiar prompt para Claude.ai */}
                {bloco.promptClaude && (
                  <div className="mt-2">
                    <button
                      onClick={() => copiarPrompt(bloco.promptClaude!)}
                      className="w-full px-4 py-3 text-sm lowercase text-left transition-all"
                      style={{
                        background: copiado ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: copiado ? 'var(--color-text-inv)' : 'var(--color-primary)',
                        border: `1px solid ${copiado ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-btn)',
                      }}
                    >
                      {copiado
                        ? '✓ prompt copiado — cole no Claude.ai para pesquisa verificada'
                        : '✦ copiar prompt para pesquisar no Claude.ai →'}
                    </button>
                    <p className="text-xs mt-1.5 lowercase" style={{ color: 'var(--color-muted)' }}>
                      o claude.ai tem acesso à internet e consegue verificar os @ antes de você usar
                    </p>
                  </div>
                )}
              </div>
            )
          }

          if (bloco.tipo === 'oferta-dossie') {
            return (
              <div key={i} className="flex justify-start">
                <div
                  className="px-4 py-4 text-sm leading-relaxed"
                  style={{
                    maxWidth: '80%',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <p className="mb-3">
                    você já adicionou {marcasAdicionadasDetalhes.length} marcas. quer que eu monte o dossiê de prospecção em PDF?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={gerarDossie}
                      className="px-4 py-2 text-xs lowercase font-medium transition-all"
                      style={{
                        background: 'var(--color-accent)',
                        color: 'var(--color-text-inv)',
                        borderRadius: 'var(--radius-badge)',
                      }}
                    >
                      sim, gerar dossiê
                    </button>
                    <button
                      className="px-4 py-2 text-xs lowercase transition-all"
                      style={{
                        background: 'var(--color-bg)',
                        color: 'var(--color-muted)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-badge)',
                      }}
                    >
                      agora não
                    </button>
                  </div>
                </div>
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
