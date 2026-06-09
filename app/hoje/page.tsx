import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { calcularAcoesDoDia, limitarPorRotina } from '@/lib/algoritmo'
import PerfilBar from '@/components/PerfilBar'
import HojeConteudo from '@/components/HojeConteudo'

export default async function HojePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: contatos }, { data: checkins }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase.from('contatos').select('*').eq('usuario_id', user.id),
    supabase
      .from('checkins')
      .select('*')
      .eq('usuario_id', user.id)
      .order('data', { ascending: false })
      .limit(30),
  ])

  if (!perfil) redirect('/onboarding')

  const todasAcoes = calcularAcoesDoDia(contatos ?? [])
  const acoesDoDia = limitarPorRotina(todasAcoes, perfil.rotina_frequencia)
  const totalContatos = (contatos ?? []).length

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--color-bg)' }}
    >
      <PerfilBar perfil={perfil} totalContatos={totalContatos} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <HojeConteudo
          acoes={acoesDoDia}
          perfil={perfil}
          checkins={checkins ?? []}
          usuarioId={user.id}
          totalContatos={totalContatos}
        />

        {/* Link para contatos */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--color-border)' }}>
          <a
            href="/contatos"
            className="text-sm lowercase transition-all"
            style={{ color: 'var(--color-muted)' }}
          >
            ver todos os contatos →
          </a>
        </div>
      </main>
    </div>
  )
}
