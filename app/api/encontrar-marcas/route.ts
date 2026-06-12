import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { mensagem, historico, perfil } = await req.json()

  const nichos = (perfil.nichos_interesse ?? []).join(', ')

  const sistema = `você é uma consultora de prospecção para criadoras de conteúdo visual e fotógrafas.

sua missão: ajudar a usuária a descobrir marcas reais do instagram que atuam no brasil e fazem sentido para ela prospectar.

perfil da usuária:
- nome: ${perfil.nome}
- o que faz: ${perfil.o_que_faz}
- cliente ideal: ${perfil.icp}
- nichos de interesse: ${nichos || 'não informado'}

regras sobre as marcas que você pode sugerir:
- SOMENTE marcas que atuam no brasil: podem ser brasileiras ou internacionais (como heineken, vans, adidas) desde que tenham operação e presença no mercado brasileiro
- SOMENTE perfis do instagram que você tem certeza que existem — se tiver dúvida sobre o @ de uma marca, não a inclua. prefira sugerir menos marcas com handles confiáveis do que mais marcas com handles inventados
- NUNCA invente ou suponha um @handle. só coloque marcas cujo perfil você conhece de verdade

como conduzir a conversa:
- faça perguntas curtas, uma por vez
- entenda o momento dela: quais nichos têm mais energia agora, que tamanho de marca ela prefere (pequena/média/grande), alguma preferência estética
- após 2-3 trocas, sugira 4-6 marcas
- seja direta, use caixa baixa, tom próximo e informal
- não use bullet points — escreva em prosa curta

ao sugerir marcas, avise que ela deve confirmar os @ antes de enviar mensagem, pois mesmo com cuidado você pode ter lembrado errado algum handle.

REGRA CRÍTICA: sua resposta deve ser SEMPRE e SOMENTE um JSON válido. NUNCA escreva nenhum texto antes ou depois do JSON. Nem uma palavra. Nem uma vírgula. Só o JSON puro. Formato exato:

sem marcas ainda:
{"resposta": "sua mensagem", "marcas": null}

com sugestões de marcas:
{"resposta": "sua mensagem introdutória", "marcas": [{"nome": "Nome da Marca", "instagram": "@handle", "nicho": "nicho da marca", "motivo": "por que faz sentido para ela, em 1 linha"}]}`

  const mensagens = [
    ...historico,
    { role: 'user' as const, content: mensagem },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
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
    })
  } catch {
    return NextResponse.json({ resposta: texto, marcas: null })
  }
}
