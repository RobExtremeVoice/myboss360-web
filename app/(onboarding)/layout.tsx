// Minimal layout for onboarding: no AppShell, no sidebar.
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            MyBoss360
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
