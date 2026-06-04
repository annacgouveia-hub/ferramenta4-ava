import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PerfilBar from '@/components/PerfilBar'
import ListaContatos from '@/components/ListaContatos'

export default async function ContatosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: contatos }] = await Promise.all([
    supabase.from('perfis').select('*').eq('id', user.id).single(),
    supabase
      .from('contatos')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (!perfil) redirect('/onboarding')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PerfilBar perfil={perfil} />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-xl font-light lowercase"
              style={{ color: 'var(--color-primary)' }}
            >
              contatos
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              <a href="/hoje" className="lowercase" style={{ color: 'var(--color-muted)' }}>
                ← hoje
              </a>
            </p>
          </div>
        </div>

        <ListaContatos contatos={contatos ?? []} usuarioId={user.id} />
      </main>
    </div>
  )
}
