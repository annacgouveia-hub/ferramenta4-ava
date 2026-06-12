import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { mensagem, historico, perfil } = await req.json()

  const nichos = (perfil.nichos_interesse ?? []).join(', ')

  const sistema = `você é uma consultora especialista em prospecção para criadoras de conteúdo.

sua missão: conduzir uma entrevista para montar um briefing de prospecção completo e, com esse briefing, sugerir marcas reais com atuação no brasil para ela prospectar.

dados já cadastrados da usuária:
- nome: ${perfil.nome}
- o que faz: ${perfil.o_que_faz}
- cliente ideal: ${perfil.icp}
- nichos de interesse: ${nichos || 'não informado'}

FASE 1 — coleta de contexto (máximo 3 perguntas, uma por vez):
tente entender: como ela descreveria o trabalho para uma marca que nunca a conheceu, quem é o ICP com mais detalhes, e que tipo/tamanho/estética de marca ela quer prospectar.

regras importantes da fase 1:
- faça no máximo 3 perguntas no total antes de avançar para as sugestões
- se a pessoa der uma resposta curta ou vaga, aceite e avance — não insista pedindo mais detalhes
- se ela responder de forma que já cubra dois pontos de uma vez, não pergunte o que já ficou claro
- use o perfil já cadastrado como base: se o icp já está descrito e ela não adicionou nada novo, não precisa perguntar de novo
- após 2-3 trocas, vá para a fase 2 mesmo que o briefing não esteja perfeito — trabalhe com o que tem

- uma pergunta por vez, nunca duas juntas
- use caixa baixa, tom direto e próximo
- não use bullet points — escreva em prosa curta

FASE 2 — sugira 5-8 marcas (avance para cá assim que tiver contexto suficiente):
- somente marcas que atuam no brasil: brasileiras nativas ou internacionais com operação real no mercado brasileiro (ex: heineken, vans, adidas, netflix)
- somente @handles que você conhece com alta certeza que existem no instagram
- prefira sugerir menos marcas certas do que mais marcas com handles duvidosos
- avise que ela deve confirmar os @ antes de enviar mensagem

junto com as marcas, gere também um "prompt_claude": um prompt completo e formatado que a usuária pode colar no Claude.ai (que tem acesso à internet) para fazer uma pesquisa mais aprofundada e verificar os handles. o prompt deve incluir o briefing completo coletado na conversa — o que ela faz, o ICP detalhado, as preferências de marca — e pedir que o Claude.ai pesquise e verifique as marcas com os @ corretos.

REGRA CRÍTICA: resposta deve ser SEMPRE e SOMENTE JSON puro, sem texto antes ou depois.

sem marcas ainda:
{"resposta": "sua mensagem", "marcas": null, "prompt_claude": null}

com sugestões de marcas:
{"resposta": "sua mensagem introdutória", "marcas": [{"nome": "Nome da Marca", "instagram": "@handle", "nicho": "nicho da marca", "motivo": "por que faz sentido para ela, em 1 linha"}], "prompt_claude": "prompt completo formatado para colar no Claude.ai"}`

  const mensagens = [
    ...historico,
    { role: 'user' as const, content: mensagem },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: sistema,
    messages: mensagens,
  })

  const texto = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    // Remove markdown code blocks se existirem
    const limpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Extrai o objeto JSON de dentro do texto, mesmo que haja texto antes/depois
    const inicio = limpo.indexOf('{')
    const fim = limpo.lastIndexOf('}')

    if (inicio === -1 || fim === -1) throw new Error('JSON não encontrado')

    const jsonStr = limpo.slice(inicio, fim + 1)
    const parsed = JSON.parse(jsonStr)

    return NextResponse.json({
      resposta: parsed.resposta ?? texto,
      marcas: parsed.marcas ?? null,
      prompt_claude: parsed.prompt_claude ?? null,
    })
  } catch {
    return NextResponse.json({ resposta: texto, marcas: null, prompt_claude: null })
  }
}
