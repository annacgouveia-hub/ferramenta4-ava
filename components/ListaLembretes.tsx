'use client'

import { useState } from 'react'
import { AcaoDia } from '@/lib/algoritmo'
import { Perfil } from '@/lib/types'
import CardLembrete from './CardLembrete'

export default function ListaLembretes({
  acoes,
  perfil,
}: {
  acoes: AcaoDia[]
  perfil: Perfil
}) {
  const [concluidos, setConcluidos] = useState<Set<string>>(new Set())

  const visiveis = acoes.filter((a) => !concluidos.has(a.contato.id))

  if (visiveis.length === 0) {
    return (
      <div
        className="py-12 text-center"
      >
        <p className="text-sm lowercase" style={{ color: 'var(--color-muted)' }}>
          tudo feito por hoje.
        </p>
      </div>
    )
  }

  return (
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
  )
}
