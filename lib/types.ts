export type StatusContato =
  | 'na_lista'
  | 'aquecendo'
  | 'dever_feito'
  | 'abordagem_enviada'
  | 'fup1_enviado'
  | 'fup2_enviado'
  | 'fup3_enviado'
  | 'respondeu'
  | 'reuniao_agendada'
  | 'fechou'
  | 'dormindo'

export type Canal = 'instagram' | 'email' | 'whatsapp' | 'linkedin'

export type TipoAcao = 'abordagem' | 'fup1' | 'fup2' | 'fup3' | 'responder' | 'interagir' | 'aquecer'

export type Contato = {
  id: string
  usuario_id: string
  nome: string
  nicho: string
  canal_principal: Canal
  canal_secundario: Canal | null
  canal_terciario: Canal | null
  ponto_conexao: string | null
  status: StatusContato
  data_ultimo_contato: string | null
  data_abordagem: string | null
  data_fup1: string | null
  data_fup2: string | null
  data_fup3: string | null
  instagram: string | null
  adiamentos: number
  created_at: string
}

export type Perfil = {
  id: string
  nome: string
  o_que_faz: string
  icp: string
  rotina_frequencia: number
  rotina_canais: Canal[]
  nichos_interesse: string[]
  avatar_url: string | null
  created_at: string
}

export type CheckIn = {
  id: string
  usuario_id: string
  data: string
  feito: boolean
  acoes_feitas: number
}
