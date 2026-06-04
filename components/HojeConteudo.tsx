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
}: {
  acoes: AcaoDia[]
  perfil: Perfil
  checkins: CheckIn[]
  usuarioId: string
}) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())

  const visiveis = acoes.filter((a) => !concluidos.has(a.contato.id))
  const tudoConcluido = acoes.length > 0 && visiveis.length === 0

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
