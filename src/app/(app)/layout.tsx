import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--paper)' }}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Desktop header */}
        <header
          className="hidden lg:flex h-14 items-center px-6 shrink-0"
          style={{
            borderBottom: '1px solid var(--line)',
            backgroundColor: 'var(--paper-elev)',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)',
          }}
        >
          <div className="flex flex-col justify-center">
            <p
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: 'var(--moss)', fontFamily: 'var(--font-body), system-ui, sans-serif' }}
            >
              Sistem Manajemen Penjualan
            </p>
            <h1
              className="text-sm font-semibold leading-tight"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              MBG Supply
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
