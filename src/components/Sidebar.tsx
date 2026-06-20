'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity=".9"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity=".5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity=".5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity=".5"/>
      </svg>
    ),
  },
  {
    label: 'Pembelian',
    href: '/pembelian',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2h1.5l.8 4h8l1-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M4.3 6l1 5h6l1-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="13.5" r="1" fill="currentColor"/>
        <circle cx="10" cy="13.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Penjualan',
    href: '/penjualan',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Pembayaran',
    href: '/pembayaran',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="3.5" y="9.5" width="3" height="1.5" rx="0.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Produk',
    href: '/produk',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L14 4.5V8C14 11.5 11.5 13.5 8 14.5C4.5 13.5 2 11.5 2 8V4.5L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Stok',
    href: '/stok',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="9.5" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="6.5" y="6.5" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="11.5" y="3.5" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1.5 7.5l3-3 4 2 4-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Master',
    href: '/master',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.42 1.42M11.36 11.36l1.42 1.42M3.22 12.78l1.42-1.42M11.36 4.64l1.42-1.42" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1" aria-label="Navigasi utama">
      {menuItems.map(({ label, href, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors duration-150 relative group
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C77D12]
              ${active
                ? 'bg-white/12 text-white border-l-[3px] border-[#C77D12] pl-[calc(0.75rem-3px)]'
                : 'text-white/60 hover:bg-white/8 hover:text-white/90 border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
              }
            `}
            aria-current={active ? 'page' : undefined}
          >
            <span className="w-4 shrink-0 flex items-center justify-center">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden flex items-center justify-between text-white px-4 py-3 sticky top-0 z-30"
        style={{ backgroundColor: 'var(--pine)' }}
      >
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
        >
          MBG<span style={{ color: 'var(--amber)' }}>·</span>Supply
        </span>
        <button
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C77D12]"
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col w-56 shrink-0
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex
        `}
        style={{ backgroundColor: 'var(--pine)' }}
        aria-label="Sidebar"
      >
        {/* Wordmark */}
        <div
          className="px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span
            className="text-white text-lg font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
          >
            MBG<span style={{ color: 'var(--amber)' }}>·</span>Supply
          </span>
        </div>

        {nav}

        {/* Footer */}
        <div
          className="px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-body), system-ui, sans-serif' }}
          >
            v1.0 · Toko Berkah Abadi
          </p>
        </div>
      </aside>
    </>
  )
}
