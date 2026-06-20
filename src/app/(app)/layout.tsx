import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f7f6f3]">
      {/* Sidebar (handles its own mobile toggling internally) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Desktop header — hidden on mobile (Sidebar top-bar handles mobile) */}
        <header className="hidden lg:flex h-14 items-center px-6 border-b border-[#e2e0da] bg-white shrink-0 shadow-sm">
          <h1 className="text-base font-semibold text-[#1a1a1a]">
            MBG Supply — Sistem Manajemen Penjualan
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
