'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Pembelian', href: '/pembelian' },
  { label: 'Penjualan', href: '/penjualan' },
  { label: 'Pembayaran', href: '/pembayaran' },
  { label: 'Produk', href: '/produk' },
  { label: 'Stok', href: '/stok' },
  { label: 'Master', href: '/master' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-[#0f4c3a] text-white shrink-0">
      <div className="px-6 py-5 text-lg font-bold tracking-wide border-b border-white/10">
        MBG Supply
      </div>
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {menuItems.map(({ label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
