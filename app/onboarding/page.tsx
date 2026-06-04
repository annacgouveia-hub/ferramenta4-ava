'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Canal } from '@/lib/types'

type Passo = 'nome' | 'o_que_faz' | 'icp' | 'rotina_frequencia' | 'rotina_canais'

const PASSOS: Passo[] = ['nome', 'o_que_faz', 'icp', 'rotina_frequencia', 'rotina_canais']

const PERGUNTAS: Record<Passo, { pergunta: string; placeholder?: string; dica?: string }> = {
  nome: {
    pergunta: 'qual é o seu nome?',
    placeholder: 'anna carolina',
  },
  o_que_faz: {
    pergunta: 'o que você faz e entrega para os seus clientes?',
    placeholder: 'ex: fotografia editorial para marcas de lifestyle, stop motion para campanhas de redes sociais...',
    dica: 'pode ser uma frase curta. isso vai aparecer no seu perfil e ajudar a IA a escrever mensagens no seu tom.',
  },
  icp: {
    pergunta: 'descreva o tipo de cliente que você quer prospectar',
    placeholder: 'ex: marcas de bem-estar que já investem em marketing de influência e entendem o valor do visual...',
    dica: 'o seu cliente ideal. quanto mais específico, melhor a ferramenta vai funcionar para você.',
  },
  rotina_frequencia: {
    pergunta: 'quantas prospecções você consegue fazer por semana?',
    dica: 'começa com um número que você sabe que consegue manter — mesmo nas semanas cheias de entrega. sustentabilidade importa mais do que volume.',
  },
  rotina_canais: {
    pergunta: 'por quais canais você costuma prospectar?',
    dica: 'seleciona os que você realmente usa. a ferramenta vai sugerir o canal certo para cada momento.',
  },
}

const CANAIS: { valor: Canal; label: string }[] = [
  { valor: 'instagram', label: 'instagram' },
  { valor: 'email', label: 'e-mail' },
  { valor: 'whatsapp', label: 'whatsapp' },
  { valor: 'linkedin', label: 'linkedin' },
]

const FREQUENCIAS = [
  { valor: 2, label: '2 por semana', descricao: 'ritmo tranquilo' },
  { valor: 5, label: '5 por semana', descricao: 'ritmo consistente' },
  { valor: 10, label: '10 por semana', descricao: 'ritmo ativo' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [passoAtual, setPassoAtual] = useState<Passo>('nome')
  const [form, setForm] = useState({
    nome: '',
    o_que_faz: '',
    icp: '',
    rotina_frequencia: 5,
    rotina_canais: [] as Canal[],
  })
  const [loading, setLoading] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  const indice = PASSOS.indexOf(passoAtual)
  const { pergunta, placeholder, dica } = PERGUNTAS[passoAtual]

  function avancar() {
    const proximo = PASSOS[indice + 1]
    if (proximo) setPassoAtual(proximo)
    else salvar()
  }

  function podeAvancar(): boolean {
    if (passoAtual === 'nome') return form.nome.trim().length > 0
    if (passoAtual === 'o_que_faz') return form.o_que_faz.trim().length > 0
    if (passoAtual === 'icp') return form.icp.trim().length > 0
    if (passoAtual === 'rotina_frequencia') return true
    if (passoAtual === 'rotina_canais') return form.rotina_canais.length > 0
    return false
  }

  function toggleCanal(canal: Canal) {
    setForm((prev) => ({
      ...prev,
      rotina_canais: prev.rotina_canais.includes(canal)
        ? prev.rotina_canais.filter((c) => c !== canal)
        : [...prev.rotina_canais, canal],
    }))
  }

  async function salvar() {
    setLoading(true)
    setErroSalvar(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErroSalvar('sessão expirou. recarrega a página e tenta de novo.')
        return
      }

      const { error } = await supabase.from('perfis').insert({
        id: user.id,
        nome: form.nome,
        o_que_faz: form.o_que_faz,
        icp: form.icp,
        rotina_frequencia: form.rotina_frequencia,
        rotina_canais: form.rotina_canais,
      })

      if (error) throw error
      router.push('/hoje')
    } catch {
      setErroSalvar('algo deu errado ao salvar. tenta de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-lg px-8">
        {/* Progresso */}
        <div className="flex gap-1 mb-10">
          {PASSOS.map((p, i) => (
            <div
              key={p}
              className="h-0.5 flex-1 transition-all duration-300"
              style={{
                background: i <= indice ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Pergunta */}
        <div className="mb-8">
          <p
            className="text-xs lowercase tracking-widest mb-3"
            style={{ color: 'var(--color-muted)' }}
          >
            configurando sua rotina — {indice + 1} de {PASSOS.length}
          </p>
          <h2
            className="text-xl font-light lowercase mb-2"
            style={{ color: 'var(--color-primary)' }}
          >
            {pergunta}
          </h2>
          {dica && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {dica}
            </p>
          )}
        </div>

        {/* Input */}
        <div className="mb-8">
          {(passoAtual === 'nome' || passoAtual === 'o_que_faz' || passoAtual === 'icp') && (
            passoAtual === 'nome' ? (
              <input
                autoFocus
                type="text"
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder={placeholder}
                onKeyDown={(e) => e.key === 'Enter' && podeAvancar() && avancar()}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-main)',
                }}
              />
            ) : (
              <textarea
                autoFocus
                rows={3}
                value={form[passoAtual as 'o_que_faz' | 'icp']}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [passoAtual]: e.target.value }))
                }
                placeholder={placeholder}
                className="w-full px-4 py-3 text-sm outline-none resize-none"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-main)',
                }}
              />
            )
          )}

          {passoAtual === 'rotina_frequencia' && (
            <div className="flex flex-col gap-3">
              {FREQUENCIAS.map((f) => (
                <button
                  key={f.valor}
                  onClick={() => setForm((prev) => ({ ...prev, rotina_frequencia: f.valor }))}
                  className="flex items-center justify-between px-4 py-3 text-sm transition-all text-left"
                  style={{
                    background: form.rotina_frequencia === f.valor ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: form.rotina_frequencia === f.valor ? 'var(--color-text-inv)' : 'var(--color-primary)',
                    border: `1px solid ${form.rotina_frequencia === f.valor ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-card)',
                    fontFamily: 'var(--font-main)',
                  }}
                >
                  <span className="lowercase">{f.label}</span>
                  <span
                    className="text-xs lowercase"
                    style={{
                      color: form.rotina_frequencia === f.valor
                        ? 'rgba(255,255,255,0.6)'
                        : 'var(--color-muted)',
                    }}
                  >
                    {f.descricao}
                  </span>
                </button>
              ))}
            </div>
          )}

          {passoAtual === 'rotina_canais' && (
            <div className="flex flex-wrap gap-2">
              {CANAIS.map((c) => {
                const selecionado = form.rotina_canais.includes(c.valor)
                return (
                  <button
                    key={c.valor}
                    onClick={() => toggleCanal(c.valor)}
                    className="px-4 py-2 text-sm lowercase transition-all"
                    style={{
                      background: selecionado ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: selecionado ? 'var(--color-text-inv)' : 'var(--color-primary)',
                      border: `1px solid ${selecionado ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-badge)',
                      fontFamily: 'var(--font-main)',
                    }}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Botão avançar */}
        <button
          onClick={avancar}
          disabled={!podeAvancar() || loading}
          className="w-full h-12 text-sm font-medium lowercase transition-all"
          style={{
            background: podeAvancar() && !loading ? 'var(--color-accent)' : 'var(--color-border)',
            color: podeAvancar() && !loading ? 'var(--color-text-inv)' : 'var(--color-muted)',
            borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-main)',
            cursor: podeAvancar() && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading
            ? 'salvando...'
            : passoAtual === 'rotina_canais'
            ? 'começar'
            : 'continuar'}
        </button>
        {erroSalvar && (
          <p className="text-xs mt-3 text-center lowercase" style={{ color: 'var(--color-accent)' }}>
            {erroSalvar}
          </p>
        )}
      </div>
    </div>
  )
}
