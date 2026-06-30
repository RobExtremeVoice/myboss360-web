import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafaf9_0%,#ffffff_35%,#f8fafc_100%)] px-6 py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-black/6 bg-white/92 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-[0.2em] text-white">
              MB
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-950">
                MyBoss360
              </p>
              <p className="text-xs text-slate-500">Authentication foundation</p>
            </div>
          </Link>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
