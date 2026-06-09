'use client'

import { useState } from 'react'
import { AcaoDia } from '@/lib/algoritmo'
import { Perfil, CheckIn } from '@/lib/types'
import CardLembrete from './CardLembrete'
import CheckInStreak from './CheckInStreak'

export default function HojeConteudo({
  acoes,
  perfil,
  checkins,
  usuarioId,
  totalContatos,
}: {
  acoes: AcaoDia[]
  perfil: Perfil
  checkins: CheckIn[]
  usuarioId: string
  totalContatos: number
}) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())

  const visiveis = acoes.filter((a) => !concluidos.has(a.contato.id))
  const tudoConcluido = acoes.length > 0 && visiveis.length === 0

  // Sem nenhuma marca cadastrada ainda — estado de boas-vindas
  if (totalContatos === 0) {
    return (
      <>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2
              className="text-xl font-light lowercase"
              style={{ color: 'var(--color-primary)' }}
            >
              hoje
            </h2>
            <p className="text-sm mt-1 lowercase" style={{ color: 'var(--color-muted)' }}>
              vamos começar.
            </p>
          </div>
          <CheckInStreak checkins={checkins} usuarioId={usuarioId} />
        </div>

        <div
          className="p-8 rounded text-center"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p
            className="text-sm lowercase font-medium mb-2"
            style={{ color: 'var(--color-primary)' }}
          >
            você ainda não tem nenhuma marca cadastrada.
          </p>
          <p
            className="text-xs lowercase leading-relaxed mb-6"
            style={{ color: 'var(--color-muted)' }}
          >
            o primeiro passo é adicionar as marcas que você quer prospectar.
            <br />
            a ferramenta vai te lembrar de agir no momento certo.
          </p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="/contatos/encontrar"
              className="inline-block px-5 py-2.5 text-sm lowercase font-medium transition-all"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-inv)',
                borderRadius: 'var(--radius-btn)',
              }}
            >
              ✦ encontrar marcas com IA →
            </a>
            <a
              href="/contatos"
              className="text-xs lowercase"
              style={{ color: 'var(--color-muted)' }}
            >
              ou adicionar manualmente
            </a>
          </div>
        </div>
      </>
    )
  }

  let subtitulo: string
  if (acoes.length === 0) subtitulo = 'nada pra fazer hoje. volta amanhã.'
  else if (tudoConcluido) subtitulo = 'tudo feito por hoje!'
  else subtitulo = acoes.length === 1 ? '1 ação para hoje' : `${acoes.length} ações para hoje`

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2
            className="text-xl font-light lowercase"
            style={{ color: 'var(--color-primary)' }}
          >
            hoje
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {subtitulo}
          </p>
        </div>
        <CheckInStreak checkins={checkins} usuarioId={usuarioId} />
      </div>

      {acoes.length > 0 && !tudoConcluido && (
        <div className="flex flex-col gap-4">
          {visiveis.map((acao) => (
            <CardLembrete
              key={acao.contato.id}
              acao={acao}
              perfil={perfil}
              onConcluido={() =>
                setConcluidos((prev) => new Set([...prev, acao.contato.id]))
              }
            />
          ))}
        </div>
      )}

      {tudoConcluido && (
        <div className="py-12 text-center">
          <p className="text-sm lowercase" style={{ color: 'var(--color-muted)' }}>
            tudo feito por hoje.
          </p>
        </div>
      )}
    </>
  )
}
