import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const CTA_POR_CANAL_E_TIPO: Record<string, Record<string, string>> = {
  abordagem: {
    instagram: 'posso te mandar uma ideia de conteúdo?',
    email: 'posso te mandar uma proposta com calma?',
    whatsapp: 'posso te mandar uma ideia?',
    linkedin: 'faz sentido a gente conversar?',
  },
  fup1: {
    instagram: 'ainda faz sentido?',
    email: 'só passando pra ver se chegou.',
    whatsapp: 'ainda faz sentido pra vocês?',
    linkedin: 'ainda faz sentido?',
  },
  fup2: {
    instagram: 'fica à vontade pra responder quando fizer sentido.',
    email: 'fica à vontade se não for o momento.',
    whatsapp: 'sem pressa — fica à vontade.',
    linkedin: 'fica à vontade.',
  },
  fup3: {
    instagram: 'qualquer hora que fizer sentido, estou por aqui.',
    email: 'qualquer hora que fizer sentido, estou disponível.',
    whatsapp: 'qualquer hora, estou aqui.',
    linkedin: 'qualquer hora que fizer sentido.',
  },
  responder: {
    instagram: '',
    email: '',
    whatsapp: '',
    linkedin: '',
  },
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const body = await req.json()
  const { tipo, contato, perfil, mensagemRecebida } = body

  const cta = CTA_POR_CANAL_E_TIPO[tipo]?.[contato.canal_principal] ?? ''

  const sistemPrompt = `você é uma assistente que ajuda criadoras visuais autônomas a escrever mensagens de prospecção.

perfil da usuária:
- nome: ${perfil.nome}
- o que faz: ${perfil.o_que_faz}
- cliente ideal: ${perfil.icp}

regras de escrita:
- caixa baixa em tudo
- tom humano, direto, sem linguagem corporativa
- sem "lead", "funil", "conversão", "sinergia"
- mensagens curtas — máximo 5 linhas
- não inventar informações que não foram fornecidas
- o foco é na marca/cliente, não em si mesma
- a mensagem deve parecer escrita por uma pessoa real, não por uma empresa
- sem formatação markdown — sem asteriscos, sem headers, sem bullets, só texto simples`

  const prompts: Record<string, string> = {
    abordagem: `escreva uma mensagem de primeira abordagem para ${contato.nome} (nicho: ${contato.nicho}).
canal: ${contato.canal_principal}
${contato.ponto_conexao ? `ponto de conexão: ${contato.ponto_conexao}` : 'sem ponto de conexão definido — escreva de forma mais genérica mas ainda personalizada para o nicho'}
cta a usar no final: "${cta}"
estrutura: abertura com observação sobre a marca → o que você entrega → cta`,

    fup1: `escreva um primeiro follow-up (lembrete) para ${contato.nome}.
canal: ${contato.canal_principal} (mesmo canal da abordagem)
${contato.ponto_conexao ? `ponto de conexão original: ${contato.ponto_conexao}` : ''}
contexto: você mandou a abordagem há alguns dias e ainda não teve resposta
tom: leve, sem pressão, referencia a mensagem anterior de forma indireta
cta: "${cta}"`,

    fup2: `escreva um segundo follow-up para ${contato.nome}.
canal: ${contato.canal_secundario ?? contato.canal_principal} (canal diferente do primeiro contato)
contexto: dois contatos anteriores sem resposta
tom: ainda mais leve, muito curto, ângulo novo
cta: "${cta}"`,

    fup3: `escreva o terceiro e último follow-up para ${contato.nome}.
canal: ${contato.canal_terciario ?? contato.canal_secundario ?? contato.canal_principal}
contexto: última tentativa — tom gentil, sem pressão, deixa a porta aberta
cta: "${cta}"`,

    responder: `escreva uma resposta para ${contato.nome} que disse:
"${mensagemRecebida}"
contexto: ${contato.ponto_conexao ?? ''}
mantenha o próximo passo claro — propor envio de proposta ou agendar uma conversa rápida com 2 opções de horário`,

    interagir: `sugira um comentário genuíno para deixar no perfil de ${contato.nome} (nicho: ${contato.nicho}).
${contato.ponto_conexao ? `o que você observou: ${contato.ponto_conexao}` : ''}
o comentário deve parecer espontâneo, não comercial. sem emoji obrigatório. máximo 2 linhas.`,
  }

  const prompt = prompts[tipo]
  if (!prompt) return NextResponse.json({ erro: 'tipo inválido' }, { status: 400 })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: sistemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const texto = response.content[0].type === 'text' ? response.content[0].text : ''

  return NextResponse.json({ texto })
}
