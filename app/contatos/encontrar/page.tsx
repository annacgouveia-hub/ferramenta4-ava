import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PerfilBar from '@/components/PerfilBar'
import ChatEncontrarMarcas from '@/components/ChatEncontrarMarcas'

export default async function EncontrarMarcasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: contatos }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase.from('contatos').select('id').eq('usuario_id', user.id),
  ])

  if (!perfil) redirect('/onboarding')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PerfilBar perfil={perfil} totalContatos={(contatos ?? []).length} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <a
              href="/contatos"
              className="text-sm lowercase"
              style={{ color: 'var(--color-muted)' }}
            >
              ← contatos
            </a>
          </div>
          <h2
            className="text-xl font-light lowercase"
            style={{ color: 'var(--color-primary)' }}
          >
            encontrar marcas
          </h2>
          <p className="text-sm mt-1 lowercase" style={{ color: 'var(--color-muted)' }}>
            a IA te ajuda a descobrir marcas que fazem sentido para você prospectar.
          </p>
        </div>

        <ChatEncontrarMarcas perfil={perfil} usuarioId={user.id} />
      </main>
    </div>
  )
}
