import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('github_username, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 md:flex-row">
      <Sidebar
        username={profile?.github_username ?? profile?.display_name}
        avatarUrl={profile?.avatar_url}
      />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:p-8">{children}</main>
    </div>
  )
}
