import { Sidebar } from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 flex items-center px-6 border-b border-gray-200 bg-white shrink-0">
          <h1 className="text-base font-semibold text-gray-800">
            Sistem Manajemen MBG
          </h1>
        </header>
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
