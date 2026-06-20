'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Pembelian', href: '/pembelian', icon: '🛒' },
  { label: 'Penjualan', href: '/penjualan', icon: '📋' },
  { label: 'Pembayaran', href: '/pembayaran', icon: '💳' },
  { label: 'Produk', href: '/produk', icon: '📦' },
  { label: 'Stok', href: '/stok', icon: '🗄' },
  { label: 'Master', href: '/master', icon: '⚙' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {menuItems.map(({ label, href, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-base leading-none w-5 text-center">{icon}</span>
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-[#0f4c3a] text-white px-4 py-3 sticky top-0 z-30">
        <span className="text-base font-bold tracking-wide">MBG Supply</span>
        <button
          aria-label="Buka menu"
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
        >
          {open ? (
            <span className="text-xl leading-none">✕</span>
          ) : (
            <span className="text-xl leading-none">☰</span>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel — always visible on lg, slide-in on mobile */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col w-56 bg-[#0f4c3a] text-white shrink-0
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex
        `}
      >
        <div className="px-6 py-5 text-lg font-bold tracking-wide border-b border-white/10 shrink-0">
          MBG Supply
        </div>
        {nav}
        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <p className="text-xs text-white/40">v1.0 · Sistem Penjualan</p>
        </div>
      </aside>
    </>
  )
}
