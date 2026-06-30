import { redirect } from 'next/navigation'

import { AppShell } from '@/components/dashboard/AppShell'
import { AuthProvider } from '@/providers/AuthProvider'
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
