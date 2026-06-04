'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckIn } from '@/lib/types'

export default function CheckInStreak({
  checkins,
  usuarioId,
}: {
  checkins: CheckIn[]
  usuarioId: string
}) {
  const supabase = createClient()
  const hoje = new Date().toISOString().split('T')[0]
  const checkinHoje = checkins.find((c) => c.data === hoje)
  const [feito, setFeito] = useState(checkinHoje?.feito ?? false)

  async function marcarFeito() {
    if (feito) return
    setFeito(true)

    await supabase.from('checkins').upsert(
      { usuario_id: usuarioId, data: hoje, feito: true },
      { onConflict: 'usuario_id,data' }
    )
  }

  // Últimos 7 dias para exibir
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dataStr = d.toISOString().split('T')[0]
    const checkin = checkins.find((c) => c.data === dataStr)
    return { data: dataStr, feito: checkin?.feito ?? false, ehHoje: dataStr === hoje }
  })

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Bolinhas dos últimos 7 dias */}
      <div className="flex gap-1">
        {ultimos7.map(({ data, feito: f, ehHoje }) => (
          <div
            key={data}
            title={data}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: f
                ? 'var(--color-primary)'
                : ehHoje && feito
                ? 'var(--color-primary)'
                : 'var(--color-border)',
              opacity: ehHoje ? 1 : 0.6,
            }}
          />
        ))}
      </div>

      {/* Botão check-in */}
      {!feito ? (
        <button
          onClick={marcarFeito}
          className="text-xs lowercase transition-all"
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-main)' }}
        >
          marcar presença hoje
        </button>
      ) : (
        <span className="text-xs lowercase" style={{ color: 'var(--color-muted)' }}>
          presença marcada
        </span>
      )}
    </div>
  )
}
