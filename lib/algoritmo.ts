import { Contato } from './types'

const DIAS = {
  SEM_INTERACAO: 5,
  AQUECENDO: 7,
  APOS_ABORDAGEM: 5,
  APOS_FUP1: 3,
  APOS_FUP2: 3,
}

function diasDesde(data: string | null): number {
  if (!data) return 999
  const diff = Date.now() - new Date(data).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export type AcaoDia = {
  contato: Contato
  tipo: 'responder' | 'abordagem' | 'fup1' | 'fup2' | 'fup3' | 'aquecer' | 'interagir'
  contexto: string
  prioridade: number
}

export function calcularAcoesDoDia(contatos: Contato[]): AcaoDia[] {
  const acoes: AcaoDia[] = []

  for (const c of contatos) {
    if (c.status === 'fechou' || c.status === 'dormindo') continue

    // P1 — respondeu e você não voltou
    if (c.status === 'respondeu') {
      acoes.push({
        contato: c,
        tipo: 'responder',
        contexto: `${c.nome} respondeu — ainda não voltou para ela`,
        prioridade: 1,
      })
      continue
    }

    // P2 — abordagem enviada há 5+ dias
    if (c.status === 'abordagem_enviada' && diasDesde(c.data_abordagem) >= DIAS.APOS_ABORDAGEM) {
      acoes.push({
        contato: c,
        tipo: 'fup1',
        contexto: `abordagem enviada há ${diasDesde(c.data_abordagem)} dias, sem resposta`,
        prioridade: 2,
      })
      continue
    }

    // P3 — FUP 1 enviado há 3+ dias
    if (c.status === 'fup1_enviado' && diasDesde(c.data_fup1) >= DIAS.APOS_FUP1) {
      acoes.push({
        contato: c,
        tipo: 'fup2',
        contexto: `primeiro lembrete enviado há ${diasDesde(c.data_fup1)} dias, sem retorno`,
        prioridade: 3,
      })
      continue
    }

    // P4 — FUP 2 enviado há 3+ dias
    if (c.status === 'fup2_enviado' && diasDesde(c.data_fup2) >= DIAS.APOS_FUP2) {
      acoes.push({
        contato: c,
        tipo: 'fup3',
        contexto: `segundo lembrete enviado há ${diasDesde(c.data_fup2)} dias, sem retorno`,
        prioridade: 4,
      })
      continue
    }

    // P5 — aquecendo há 7+ dias sem abordagem
    if (c.status === 'aquecendo' && diasDesde(c.data_ultimo_contato) >= DIAS.AQUECENDO) {
      acoes.push({
        contato: c,
        tipo: 'abordagem',
        contexto: `você já está aquecendo há ${diasDesde(c.data_ultimo_contato)} dias — hora da abordagem`,
        prioridade: 5,
      })
      continue
    }

    // P6 — na lista sem interação há 5+ dias
    if (c.status === 'na_lista' && diasDesde(c.created_at) >= DIAS.SEM_INTERACAO) {
      acoes.push({
        contato: c,
        tipo: 'interagir',
        contexto: `cadastrada há ${diasDesde(c.created_at)} dias sem nenhuma interação ainda`,
        prioridade: 6,
      })
    }
  }

  return acoes.sort((a, b) => a.prioridade - b.prioridade)
}

export function limitarPorRotina(acoes: AcaoDia[], limitesDiarios: number): AcaoDia[] {
  return acoes.slice(0, limitesDiarios)
}
