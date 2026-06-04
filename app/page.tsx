import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/onboarding')

  redirect('/hoje')
}
